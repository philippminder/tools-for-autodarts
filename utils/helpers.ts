import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import { GameMode } from "@/utils/game-data-storage";
import type { IConfig, ISound } from "@/utils/storage";

export const isX01 = () => document.getElementById("ad-ext-game-variant")?.textContent === GameMode.X01;
export const isBullOff = () => document.getElementById("ad-ext-game-variant")?.textContent === "Bull-off";
export const isCricket = () => document.getElementById("ad-ext-game-variant")?.textContent?.split(" ")[0] === "Cricket";

export const isValidGameMode = () => isX01() || isCricket();

export const soundEffect1 = new Audio();
export const soundEffect2 = new Audio();
export const soundEffect3 = new Audio();

// Add Safari-specific initialization
soundEffect1.preload = "auto";
soundEffect2.preload = "auto";
soundEffect3.preload = "auto";

// Modified event listeners to prevent automatic playback which could cause double sounds
// These listeners are now only for debugging purposes
soundEffect1.addEventListener("canplaythrough", () => {
  // Removed automatic play to prevent double sounds
  if (soundEffect1.paused && soundEffect1.autoplay) {
    console.log("Sound 1 loaded and ready to play");
    // Removed automatic play call
  }
});

soundEffect2.addEventListener("canplaythrough", () => {
  // Removed automatic play to prevent double sounds
  if (soundEffect2.paused && soundEffect2.autoplay) {
    console.log("Sound 2 loaded and ready to play");
    // Removed automatic play call
  }
});

soundEffect3.addEventListener("canplaythrough", () => {
  // Removed automatic play to prevent double sounds
  if (soundEffect3.paused && soundEffect3.autoplay) {
    console.log("Sound 3 loaded and ready to play");
    // Removed automatic play call
  }
});

export const soundEffectArray = [ soundEffect1, soundEffect2, soundEffect3 ];

export function isiOS() {
  return [
    "iPad Simulator", "iPhone Simulator", "iPod Simulator", "iPad", "iPhone", "iPod" ].includes(navigator.platform) // iPad on iOS 13 detection
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
}

// Add Safari detection function
export function isSafari() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
         || (navigator.userAgent.includes("AppleWebKit") && !navigator.userAgent.includes("Chrome"));
}

// Function to get the authorization token from storage
export async function getAuthToken() {
  const { AutodartsToolsGlobalStatus } = await import("./storage");
  const globalStatus = await AutodartsToolsGlobalStatus.getValue();
  return globalStatus.auth?.token || "";
}

// Function to make authenticated API requests
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = await getAuthToken();

  const headers = new Headers(options.headers || {});
  if (token) {
    // Set the Cookie header with the Authorization token
    headers.set("Cookie", `Authorization=${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
}

// IndexedDB helpers for sound storage
export interface SoundDB extends DBSchema {
  "sounds-caller": {
    key: string;
    value: {
      id: string;
      name: string;
      base64: string;
      dateAdded: number;
    };
    indexes: { "by-date": number };
  };
}

let dbPromise: Promise<IDBPDatabase<SoundDB>> | null = null;

// Check if IndexedDB is available in the browser
export function isIndexedDBAvailable(): boolean {
  return typeof window !== "undefined"
         && typeof window.indexedDB !== "undefined"
         && window.indexedDB !== null;
}

// Initialize the IndexedDB database
export function getDB(): Promise<IDBPDatabase<SoundDB>> | null {
  if (!isIndexedDBAvailable()) {
    console.warn("IndexedDB is not available in this browser");
    return null;
  }

  if (!dbPromise) {
    dbPromise = openDB<SoundDB>("autodarts-tools-sounds", 1, {
      upgrade(db) {
        // Create a store for Caller sounds
        const soundStore = db.createObjectStore("sounds-caller", {
          keyPath: "id",
        });

        // Create index for sorting by date
        soundStore.createIndex("by-date", "dateAdded");
      },
    });
  }

  return dbPromise;
}

// Save a base64 sound to IndexedDB
export async function saveSoundToIndexedDB(
  name: string,
  base64: string,
): Promise<string | null> {
  try {
    const db = await getDB();
    if (!db) return null;

    const id = `sound_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const soundData = {
      id,
      name,
      base64,
      dateAdded: Date.now(),
    };

    await db.put("sounds-caller", soundData);
    return id;
  } catch (error) {
    console.error("Error saving sound to IndexedDB:", error);
    return null;
  }
}

// Get a sound from IndexedDB by ID
export async function getSoundFromIndexedDB(id: string): Promise<string | null> {
  try {
    const db = await getDB();
    if (!db) return null;

    const sound = await db.get("sounds-caller", id);
    return sound ? sound.base64 : null;
  } catch (error) {
    console.error("Error getting sound from IndexedDB:", error);
    return null;
  }
}

// Get all sounds from IndexedDB
export async function getAllSoundsFromIndexedDB(): Promise<{ id: string; name: string; base64: string }[]> {
  try {
    const db = await getDB();
    if (!db) return [];

    const sounds = await db.getAll("sounds-caller");
    return sounds.map(({ id, name, base64 }) => ({ id, name, base64 }));
  } catch (error) {
    console.error("Error getting all sounds from IndexedDB:", error);
    return [];
  }
}

// Delete all sounds from IndexedDB
export async function clearCallerSoundsFromIndexedDB(): Promise<boolean> {
  try {
    const db = await getDB();
    if (!db) return false;

    await db.clear("sounds-caller");
    return true;
  } catch (error) {
    console.error("Error clearing sounds from IndexedDB:", error);
    return false;
  }
}

// Delete a sound from IndexedDB
export async function deleteSoundFromIndexedDB(id: string): Promise<boolean> {
  try {
    const db = await getDB();
    if (!db) return false;

    await db.delete("sounds-caller", id);
    return true;
  } catch (error) {
    console.error("Error deleting sound from IndexedDB:", error);
    return false;
  }
}

// Migration function to move existing base64 sounds from localStorage to IndexedDB
export async function migrateCallerSoundsToIndexedDB(
  config: IConfig,
  updateConfig: (updatedConfig: IConfig) => Promise<void>,
): Promise<boolean> {
  if (!isIndexedDBAvailable() || !config?.caller?.sounds?.length) {
    return false;
  }

  let migrated = false;
  const updatedSounds: ISound[] = [];

  // Process each sound
  for (const sound of config.caller.sounds) {
    // Skip sounds that don't have base64 data
    if (!sound.base64) {
      updatedSounds.push(sound);
      continue;
    }

    try {
      // Save to IndexedDB
      const soundId = await saveSoundToIndexedDB(
        sound.name || "Migrated Sound",
        sound.base64,
      );

      if (soundId) {
        // Update the sound object with the soundId and remove base64 from config
        updatedSounds.push({
          ...sound,
          soundId,
          base64: "", // Clear base64 from config to save space
        });
        migrated = true;
      } else {
        // If we couldn't save to IndexedDB, keep the original
        updatedSounds.push(sound);
      }
    } catch (error) {
      console.error("Error migrating sound to IndexedDB:", error);
      // Keep the original if there was an error
      updatedSounds.push(sound);
    }
  }

  // Only update config if we actually migrated something
  if (migrated) {
    const updatedConfig: IConfig = {
      ...config,
      caller: {
        ...config.caller,
        sounds: updatedSounds,
      },
    };

    await updateConfig(updatedConfig);
  }

  return migrated;
}
