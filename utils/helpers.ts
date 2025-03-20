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
  "sounds-fx": {
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
    dbPromise = openDB<SoundDB>("autodarts-tools-sounds", 2, {
      upgrade(db, oldVersion, newVersion) {
        // Create a store for Caller sounds if it doesn't exist
        if (!db.objectStoreNames.contains("sounds-caller")) {
          const callerStore = db.createObjectStore("sounds-caller", {
            keyPath: "id",
          });
          callerStore.createIndex("by-date", "dateAdded");
        }

        // Create a store for SoundFx sounds if it doesn't exist
        if (!db.objectStoreNames.contains("sounds-fx")) {
          const soundFxStore = db.createObjectStore("sounds-fx", {
            keyPath: "id",
          });
          soundFxStore.createIndex("by-date", "dateAdded");
        }
      },
    });
  }

  return dbPromise;
}

// Generic function to save to IndexedDB
async function saveToIndexedDB(
  storeName: "sounds-caller" | "sounds-fx",
  name: string,
  base64: string,
  existingId?: string,
): Promise<string | null> {
  try {
    const db = await getDB();
    if (!db) return null;

    // Use existing ID if provided, otherwise generate a new one
    const id = existingId || `sound_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const soundData = {
      id,
      name,
      base64,
      dateAdded: existingId ? (await db.get(storeName, id))?.dateAdded || Date.now() : Date.now(),
    };

    await db.put(storeName, soundData);
    return id;
  } catch (error) {
    console.error(`Error saving sound to IndexedDB (${storeName}):`, error);
    return null;
  }
}

// Save a base64 sound to IndexedDB for caller
export async function saveSoundToIndexedDB(
  name: string,
  base64: string,
  existingId?: string,
): Promise<string | null> {
  return saveToIndexedDB("sounds-caller", name, base64, existingId);
}

// Save a base64 sound to IndexedDB for soundFx
export async function saveSoundFxToIndexedDB(
  name: string,
  base64: string,
  existingId?: string,
): Promise<string | null> {
  return saveToIndexedDB("sounds-fx", name, base64, existingId);
}

// Get a sound from IndexedDB by ID for caller
export async function getSoundFromIndexedDB(id: string): Promise<string | null> {
  return getFromIndexedDB("sounds-caller", id);
}

// Get a sound from IndexedDB by ID for soundFx
export async function getSoundFxFromIndexedDB(id: string): Promise<string | null> {
  return getFromIndexedDB("sounds-fx", id);
}

// Generic function to get from IndexedDB
async function getFromIndexedDB(
  storeName: "sounds-caller" | "sounds-fx",
  id: string,
): Promise<string | null> {
  try {
    const db = await getDB();
    if (!db) return null;

    const sound = await db.get(storeName, id);
    return sound ? sound.base64 : null;
  } catch (error) {
    console.error(`Error getting sound from IndexedDB (${storeName}):`, error);
    return null;
  }
}

// Delete a sound from IndexedDB for caller
export async function deleteSoundFromIndexedDB(id: string): Promise<boolean> {
  return deleteFromIndexedDB("sounds-caller", id);
}

// Delete a sound from IndexedDB for soundFx
export async function deleteSoundFxFromIndexedDB(id: string): Promise<boolean> {
  return deleteFromIndexedDB("sounds-fx", id);
}

// Generic function to delete from IndexedDB
async function deleteFromIndexedDB(
  storeName: "sounds-caller" | "sounds-fx",
  id: string,
): Promise<boolean> {
  try {
    const db = await getDB();
    if (!db) return false;

    await db.delete(storeName, id);
    return true;
  } catch (error) {
    console.error(`Error deleting sound from IndexedDB (${storeName}):`, error);
    return false;
  }
}

// Clear sounds from IndexedDB for caller
export async function clearCallerSoundsFromIndexedDB(): Promise<boolean> {
  return clearFromIndexedDB("sounds-caller");
}

// Clear sounds from IndexedDB for soundFx
export async function clearSoundFxFromIndexedDB(): Promise<boolean> {
  return clearFromIndexedDB("sounds-fx");
}

// Generic function to clear from IndexedDB
async function clearFromIndexedDB(
  storeName: "sounds-caller" | "sounds-fx",
): Promise<boolean> {
  try {
    const db = await getDB();
    if (!db) return false;

    await db.clear(storeName);
    return true;
  } catch (error) {
    console.error(`Error clearing sounds from IndexedDB (${storeName}):`, error);
    return false;
  }
}

// Get all sounds from IndexedDB for caller
export async function getAllCallerSoundsFromIndexedDB(): Promise<Array<{ id: string; name: string; base64: string }> | null> {
  return getAllSoundsFromIndexedDB("sounds-caller");
}

// Get all sounds from IndexedDB for soundFx
export async function getAllSoundFxFromIndexedDB(): Promise<Array<{ id: string; name: string; base64: string }> | null> {
  return getAllSoundsFromIndexedDB("sounds-fx");
}

// Generic function to get all sounds from IndexedDB
async function getAllSoundsFromIndexedDB(
  storeName: "sounds-caller" | "sounds-fx",
): Promise<Array<{ id: string; name: string; base64: string }> | null> {
  try {
    const db = await getDB();
    if (!db) return null;

    const sounds = await db.getAll(storeName);
    return sounds.map(sound => ({
      id: sound.id,
      name: sound.name,
      base64: sound.base64,
    }));
  } catch (error) {
    console.error(`Error getting all sounds from IndexedDB (${storeName}):`, error);
    return null;
  }
}

// Migration function to move existing base64 sounds from localStorage to IndexedDB
export async function migrateCallerSoundsToIndexedDB(
  config: IConfig,
  updateConfig: (updatedConfig: IConfig) => Promise<void>,
): Promise<boolean> {
  return migrateSoundsToIndexedDB(
    "caller",
    config,
    updateConfig,
    saveSoundToIndexedDB,
  );
}

// Migration function for SoundFx
export async function migrateSoundFxToIndexedDB(
  config: IConfig,
  updateConfig: (updatedConfig: IConfig) => Promise<void>,
): Promise<boolean> {
  return migrateSoundsToIndexedDB(
    "soundFx",
    config,
    updateConfig,
    saveSoundFxToIndexedDB,
  );
}

// Generic migration function
async function migrateSoundsToIndexedDB(
  featureKey: "caller" | "soundFx",
  config: IConfig,
  updateConfig: (updatedConfig: IConfig) => Promise<void>,
  saveFunction: (name: string, base64: string) => Promise<string | null>,
): Promise<boolean> {
  if (!isIndexedDBAvailable() || !config?.[featureKey]?.sounds?.length) {
    return false;
  }

  let migrated = false;
  const updatedSounds: ISound[] = [];

  // Process each sound
  for (const sound of config[featureKey].sounds) {
    // Skip sounds that don't have base64 data
    if (!sound.base64) {
      updatedSounds.push(sound);
      continue;
    }

    try {
      // Save to IndexedDB
      const soundId = await saveFunction(
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
      console.error(`Error migrating ${featureKey} sound to IndexedDB:`, error);
      // Keep the original if there was an error
      updatedSounds.push(sound);
    }
  }

  // Only update config if we actually migrated something
  if (migrated) {
    const updatedConfig: IConfig = {
      ...config,
      [featureKey]: {
        ...config[featureKey],
        sounds: updatedSounds,
      },
    };

    await updateConfig(updatedConfig);
  }

  return migrated;
}
