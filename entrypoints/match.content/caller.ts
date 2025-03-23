import { AutodartsToolsGameData, type IGameData } from "@/utils/game-data-storage";
import { AutodartsToolsConfig, type IConfig } from "@/utils/storage";
import { getSoundFromIndexedDB, isIndexedDBAvailable } from "@/utils/helpers";

let gameDataWatcherUnwatch: any;
let config: IConfig;

// Audio player for Safari compatibility
let audioPlayer: HTMLAudioElement | null = null;
// Queue for sounds to be played
const soundQueue: { url?: string; base64?: string; name?: string; soundId?: string }[] = [];
// Flag to track if we're currently playing a sound
let isPlaying = false;
// Flag to track if audio has been unlocked
let audioUnlocked = false;
// Debounce timer for processing game data
let debounceTimer: number | null = null;
// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 200;
// Flag to track if we've shown the interaction notification
let interactionNotificationShown = false;
// Reference to notification element
let notificationElement: HTMLElement | null = null;
// Reference to the style element for notification
let notificationStyleElement: HTMLStyleElement | null = null;

// Audio element pool for Safari compatibility
const AUDIO_POOL_SIZE = 3;
const audioPool: HTMLAudioElement[] = [];
let currentAudioIndex = 0;
// Tracking URLs that need to be revoked
const blobUrlsToRevoke: string[] = [];

export async function caller() {
  console.log("Autodarts Tools: caller");

  try {
    config = await AutodartsToolsConfig.getValue();
    console.log("Autodarts Tools: Config loaded", config?.caller?.sounds?.length || 0, "sounds available");

    // Initialize audio player for Safari compatibility
    initAudioPlayer();

    if (!gameDataWatcherUnwatch) {
      gameDataWatcherUnwatch = AutodartsToolsGameData.watch((gameData: IGameData, oldGameData: IGameData) => {
        if (!config?.caller?.enabled) return;
        console.log("Autodarts Tools: caller game data updated");

        // Debounce the processGameData call
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        debounceTimer = window.setTimeout(() => {
          processGameData(gameData, oldGameData);
          debounceTimer = null;
        }, DEBOUNCE_DELAY);
      });
    }
  } catch (error) {
    console.error("Autodarts Tools: caller initialization error", error);
  }
}

export function callerOnRemove() {
  console.log("Autodarts Tools: caller on remove");
  if (gameDataWatcherUnwatch) {
    gameDataWatcherUnwatch();
    gameDataWatcherUnwatch = null;
  }

  // Clear any pending debounce timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  // Clean up audio player
  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.removeEventListener("ended", playNextSound);
    audioPlayer = null;
  }

  // Clean up audio pool
  audioPool.forEach((audio) => {
    audio.pause();
    audio.src = "";
    audio.remove();
  });
  audioPool.length = 0;

  // Revoke any blob URLs
  blobUrlsToRevoke.forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Autodarts Tools: Error revoking URL", e);
    }
  });
  blobUrlsToRevoke.length = 0;

  // Remove notification elements if they exist
  removeInteractionNotification();
}

/**
 * Initialize the audio player with Safari compatibility in mind
 */
function initAudioPlayer(): void {
  if (!audioPlayer) {
    audioPlayer = new Audio();

    // Add ended event listener to play the next sound in queue
    audioPlayer.addEventListener("ended", playNextSound);

    // Handle errors
    audioPlayer.addEventListener("error", (e) => {
      console.error("Autodarts Tools: Audio playback error", e);
      // Move to next sound on error
      playNextSound();
    });

    // Initialize audio pool
    for (let i = 0; i < AUDIO_POOL_SIZE; i++) {
      const audio = new Audio();
      audio.addEventListener("ended", () => {
        console.log("Autodarts Tools: Pool audio ended");
        playNextSound();
      });
      audio.addEventListener("error", (error) => {
        console.error("Autodarts Tools: Pool audio error", error);
        playNextSound();
      });
      audioPool.push(audio);
    }

    // Unlock audio on first user interaction (required for Safari/iOS)
    document.addEventListener("click", unlockAudio, { once: true });
    document.addEventListener("touchstart", unlockAudio, { once: true });
    document.addEventListener("keydown", unlockAudio, { once: true });
  }
}

/**
 * Unlock audio playback on user interaction (required for Safari/iOS)
 */
function unlockAudio(): void {
  if (audioUnlocked || !audioPlayer) return;

  console.log("Autodarts Tools: Attempting to unlock audio");

  // Create a short silent audio buffer
  const silentAudio = "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";

  audioPlayer.src = silentAudio;
  audioPlayer.volume = 0.01;

  // Also unlock all audio pool elements
  audioPool.forEach((audio, i) => {
    audio.src = silentAudio;
    audio.volume = 1;
    // Don't play them all, just load them
    if (i === 0) {
      audio.play().catch(e => console.error("Autodarts Tools: Error unlocking pool audio", e));
    }
  });

  audioPlayer.play()
    .then(() => {
      console.log("Autodarts Tools: Audio unlocked successfully");
      audioUnlocked = true;
      hideInteractionNotification();

      // If we have sounds in the queue, start playing them
      if (soundQueue.length > 0 && !isPlaying) {
        playNextSound();
      }
    })
    .catch((error) => {
      console.error("Autodarts Tools: Failed to unlock audio", error);
    });
}

/**
 * Shows a notification to inform the user they need to interact with the page
 */
function showInteractionNotification(): void {
  // Return if notification is already shown or if another notification with the same class already exists
  if (interactionNotificationShown || document.querySelector(".adt-notification")) return;

  interactionNotificationShown = true;

  // Add style for notification if not already added
  if (!document.querySelector("style[data-adt-notification-style]")) {
    notificationStyleElement = document.createElement("style");
    notificationStyleElement.setAttribute("data-adt-notification-style", "");
    notificationStyleElement.textContent = `
      .adt-notification {
        position: fixed;
        bottom: 16px;
        right: 32px;
        z-index: 50;
        max-width: 28rem;
        border-radius: 6px;
        padding: 16px;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
        backdrop-filter: blur(4px);
        background-color: rgba(0, 0, 0, 0.4);
        color: white;
      }
      .adt-notification::after {
        content: '';
        position: absolute;
        inset: 0;
        background-color: rgba(220, 38, 38, 0.3);
        border-radius: 6px;
        pointer-events: none;
      }
      .adt-notification-content {
        display: flex;
      }
      .adt-notification-icon {
        margin-right: 8px;
        flex-shrink: 0;
        font-size: 1.25rem;
      }
      .adt-notification-message {
        margin-right: 16px;
        flex-grow: 1;
      }
      .adt-notification-close {
        flex-shrink: 0;
        font-size: 1.25rem;
        opacity: 0.7;
        background: none;
        border: none;
        color: white;
        cursor: pointer;
      }
      .adt-notification-close:hover {
        opacity: 1;
      }
      
      /* Animation classes */
      @keyframes adt-notification-enter {
        from {
          transform: translateY(32px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      .adt-notification {
        animation: adt-notification-enter 300ms ease-out forwards;
      }
    `;
    document.head.appendChild(notificationStyleElement);
  } else {
    // If the style element exists but we don't have a reference to it, get a reference
    notificationStyleElement = document.querySelector("style[data-adt-notification-style]");
  }

  // Create notification element if it doesn't exist
  if (!notificationElement) {
    notificationElement = document.createElement("div");
    notificationElement.className = "adt-notification";
    notificationElement.setAttribute("data-adt-notification-source", "caller");
    notificationElement.innerHTML = `
      <div class="adt-notification-content">
        <div class="adt-notification-message">
          Please interact with the page (click, tap, or press a key) to enable audio for the caller.
        </div>
        <button class="adt-notification-close">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><!-- Icon from Pixelarticons by Gerrit Halfmann - https://github.com/halfmage/pixelarticons/blob/master/LICENSE --><path fill="currentColor" d="M5 5h2v2H5zm4 4H7V7h2zm2 2H9V9h2zm2 0h-2v2H9v2H7v2H5v2h2v-2h2v-2h2v-2h2v2h2v2h2v2h2v-2h-2v-2h-2v-2h-2zm2-2v2h-2V9zm2-2v2h-2V7zm0 0V5h2v2z"/></svg>
        </button>
      </div>
    `;

    // Add click listener to close button
    const closeButton = notificationElement.querySelector(".adt-notification-close");
    if (closeButton) {
      closeButton.addEventListener("click", hideInteractionNotification);
    }

    // Add the notification to the DOM
    document.body.appendChild(notificationElement);
  } else {
    notificationElement.style.display = "block";
  }
}

/**
 * Hides the interaction notification
 */
function hideInteractionNotification(): void {
  if (notificationElement) {
    notificationElement.remove();
    notificationElement = null;
  }
  interactionNotificationShown = false;
}

/**
 * Completely removes notification elements from the DOM
 */
function removeInteractionNotification(): void {
  // Only remove the notification if it belongs to this feature
  if (notificationElement && notificationElement.getAttribute("data-adt-notification-source") === "caller") {
    notificationElement.remove();
    notificationElement = null;

    // Only remove the style element if no other notifications are present
    if (notificationStyleElement && !document.querySelector(".adt-notification")) {
      notificationStyleElement.remove();
      notificationStyleElement = null;
    }
  }

  interactionNotificationShown = false;
}

/**
 * Process game data to trigger sounds based on game events
 */
async function processGameData(gameData: IGameData, oldGameData: IGameData): Promise<void> {
  if (!gameData.match || !gameData.match.turns?.length) return;

  const editMode: boolean = gameData.match.activated !== undefined && gameData.match.activated >= 0;
  if (editMode) {
    // If in edit mode, stop all sounds that are currently playing
    stopAllSounds();
    return;
  }

  // Play gameon sound if it's the first round and variant is not Bull-off
  if (gameData.match.round === 1 && gameData.match.turns[0].throws.length === 0 && gameData.match.variant !== "Bull-off" && gameData.match.player === 0) {
    playSound("gameon");
    const playerName = gameData.match.players?.[gameData.match.player]?.name;
    if (playerName) {
      playSound(playerName.toLowerCase());
    }
  } else if (oldGameData?.match?.player !== undefined
    && gameData.match.player !== undefined
    && oldGameData.match.player !== gameData.match.player
    && gameData.match.round >= 1) {
    // Get player name and play sound with player name as trigger
    const playerName = gameData.match.players?.[gameData.match.player]?.name;
    if (playerName) {
      console.log("Autodarts Tools: Player changed to", playerName);
      playSound(playerName.toLowerCase());
    }
  }

  // Check for checkout guide
  if (gameData.match.state?.checkoutGuide?.length) {
    console.log("Autodarts Tools: Checkout guide available");

    // Get the current player's score from gameScores
    const currentPlayerIndex = gameData.match.player;
    const currentScore = gameData.match.gameScores[currentPlayerIndex];

    // Only play "you require" when there are 0 throws in the current turn
    if (config.caller.callCheckout && currentScore > 0 && gameData.match.turns[0].throws.length === 0) {
      console.log(`Autodarts Tools: Playing checkout guide sound for ${currentScore}`);
      // Play "you_require" followed by the player's current score
      playSound("you_require");
      playSound(currentScore.toString());
    }
  }

  const currentThrow = gameData.match.turns[0].throws[gameData.match.turns[0].throws.length - 1];
  if (!currentThrow) return;

  // const currentPlayerIndex = gameData.match.player;
  const isLastThrow: boolean = gameData.match.turns[0].throws.length >= 3;
  const throwName: string = currentThrow.segment.name; // S1
  const winner: boolean = gameData.match.gameWinner >= 0; // use this for ambient_gameshot_match later || (gameData.match.variant === "X01" && gameData.match.gameScores[currentPlayerIndex] === 0);
  const busted: boolean = gameData.match.turns[0].busted;
  const points: number = gameData.match.turns[0].points;
  const score: number = gameData.match.turns[0].score;
  const combinedThrows: string = gameData.match.turns[0].throws.map(t => t.segment.name.toLowerCase()).join("_");

  // For non-Cricket variants, use normal sound logic
  if (gameData.match.variant !== "Cricket") {
    if (winner) {
      playSound("gameshot");
      const winnerPlayerName = gameData.match.players?.find(player => player.index === gameData.match?.winner)?.name;
      if (winnerPlayerName) {
        playSound(winnerPlayerName.toLowerCase());
      }
    } else if (busted) {
      playSound("busted");
    } else if (isLastThrow) {
      if (config.caller.callEveryDart) playSound(throwName.toLowerCase());
      // Only play points sound if there's more than one player
      if (gameData.match.players && gameData.match.players.length > 1) {
        playSound(points.toString());
      }
      playSound(combinedThrows);
    } else {
      if (config.caller.callEveryDart) playSound(throwName.toLowerCase());
    }
  } else {
    // For Cricket, handle only winner and busted sounds (not the individual throws)
    if (winner) {
      playSound("gameshot");
      const winnerPlayerName = gameData.match.players?.find(player => player.index === gameData.match?.winner)?.name;
      if (winnerPlayerName) {
        playSound(winnerPlayerName.toLowerCase());
      }
    } else if (busted) {
      playSound("busted");
    } else if (gameData.match.players && gameData.match.players.length > 1 && isLastThrow) {
      if (config.caller.callEveryDart) playSound(throwName.toLowerCase());
      playSound(score.toString());
    } else {
      if (config.caller.callEveryDart) playSound(throwName.toLowerCase());
    }
    // Note: we don't play individual throw sounds as we've handled cricket_hit/cricket_miss above
  }
}

/**
 * Play a sound based on the trigger
 * Adds the sound to a queue to be played sequentially
 */
function playSound(trigger: string): void {
  console.log("Autodarts Tools: Adding sound to queue", trigger);

  if (!config?.caller?.sounds || !config.caller.sounds.length) {
    console.log("Autodarts Tools: No sounds configured");
    return;
  }

  // Find all sounds that match the trigger
  let matchingSounds = config.caller.sounds.filter(sound =>
    sound.enabled && sound.triggers && sound.triggers.includes(trigger),
  );

  // If no direct match, try to find a fallback only for s, d, or t prefixes
  // For example, if "s41" is not found, try "41"
  if (!matchingSounds.length && trigger.length > 1) {
    const firstChar = trigger.charAt(0).toLowerCase();

    // Check for miss prefix (m) and fallback to "outside"
    // But only if the trigger doesn't contain an underscore (to avoid combined throws)
    if (firstChar === "m" && !trigger.includes("_")) {
      console.log(`Autodarts Tools: Using fallback sound for "${trigger}" -> "outside"`);
      matchingSounds = config.caller.sounds.filter(sound =>
        sound.enabled && sound.triggers && sound.triggers.includes("outside"),
      );
    } else if (firstChar === "d" || firstChar === "t") {
      // For double (d) and triple (t) prefixes, try multiple fallbacks
      const number = trigger.substring(1);

      // Only proceed if the rest is a number
      if (/^\d+$/.test(number)) {
        // First try "double" or "triple" as fallback
        const wordFallback = firstChar === "d" ? "double" : "triple";

        console.log(`Autodarts Tools: Trying fallback sound for "${trigger}" -> "${wordFallback}"`);
        matchingSounds = config.caller.sounds.filter(sound =>
          sound.enabled && sound.triggers && sound.triggers.includes(wordFallback),
        );

        if (matchingSounds.length) {
          console.log(`Autodarts Tools: Using fallback sound for "${trigger}" -> "${wordFallback}"`);

          // Play the word fallback sound
          const randomIndex = Math.floor(Math.random() * matchingSounds.length);
          const soundToPlay = matchingSounds[randomIndex];

          console.log("soundToPlay");
          console.log(soundToPlay);

          // Add to queue
          if (soundToPlay.url || soundToPlay.base64 || soundToPlay.soundId) {
            soundQueue.push({
              url: soundToPlay.url,
              base64: soundToPlay.base64,
              name: soundToPlay.name,
              soundId: soundToPlay.soundId,
            });

            // Also try to play the number sound right after
            console.log(`Autodarts Tools: Also trying to play number "${number}" after ${wordFallback}`);
            const numberSounds = config.caller.sounds.filter(sound =>
              sound.enabled && sound.triggers && sound.triggers.includes(number),
            );

            if (numberSounds.length) {
              const randomNumberIndex = Math.floor(Math.random() * numberSounds.length);
              const numberSoundToPlay = numberSounds[randomNumberIndex];

              if (numberSoundToPlay.url || numberSoundToPlay.base64 || numberSoundToPlay.soundId) {
                soundQueue.push({
                  url: numberSoundToPlay.url,
                  base64: numberSoundToPlay.base64,
                  name: numberSoundToPlay.name,
                  soundId: numberSoundToPlay.soundId,
                });
                console.log(`Autodarts Tools: Added number "${number}" sound to queue`);
              }
            }

            // Start playing if not already playing
            if (!isPlaying) {
              playNextSound();
            }

            // Return early since we've handled the sound playing
            return;
          }
        } else {
          // If no "double"/"triple" sound, fall back to just the number
          console.log(`Autodarts Tools: Trying fallback sound for "${trigger}" -> "${number}"`);
          matchingSounds = config.caller.sounds.filter(sound =>
            sound.enabled && sound.triggers && sound.triggers.includes(number),
          );

          if (matchingSounds.length) {
            console.log(`Autodarts Tools: Using fallback sound for "${trigger}" -> "${number}"`);
          }
        }
      }
    } else if (firstChar === "s") {
      // Only use fallback for s (single) prefix
      const fallbackTrigger = trigger.substring(1);

      // Only proceed if the rest is a number
      if (/^\d+$/.test(fallbackTrigger)) {
        // First try "single" as fallback
        console.log(`Autodarts Tools: Trying fallback sound for "${trigger}" -> "single"`);
        matchingSounds = config.caller.sounds.filter(sound =>
          sound.enabled && sound.triggers && sound.triggers.includes("single"),
        );

        if (matchingSounds.length) {
          console.log(`Autodarts Tools: Using fallback sound for "${trigger}" -> "single"`);

          // Play the single fallback sound
          const randomIndex = Math.floor(Math.random() * matchingSounds.length);
          const soundToPlay = matchingSounds[randomIndex];

          // Add to queue
          if (soundToPlay.url || soundToPlay.base64 || soundToPlay.soundId) {
            soundQueue.push({
              url: soundToPlay.url,
              base64: soundToPlay.base64,
              name: soundToPlay.name,
              soundId: soundToPlay.soundId,
            });

            // Also try to play the number sound right after
            console.log(`Autodarts Tools: Also trying to play number "${fallbackTrigger}" after single`);
            const numberSounds = config.caller.sounds.filter(sound =>
              sound.enabled && sound.triggers && sound.triggers.includes(fallbackTrigger),
            );

            if (numberSounds.length) {
              const randomNumberIndex = Math.floor(Math.random() * numberSounds.length);
              const numberSoundToPlay = numberSounds[randomNumberIndex];

              if (numberSoundToPlay.url || numberSoundToPlay.base64 || numberSoundToPlay.soundId) {
                soundQueue.push({
                  url: numberSoundToPlay.url,
                  base64: numberSoundToPlay.base64,
                  name: numberSoundToPlay.name,
                  soundId: numberSoundToPlay.soundId,
                });
                console.log(`Autodarts Tools: Added number "${fallbackTrigger}" sound to queue`);
              }
            }

            // Start playing if not already playing
            if (!isPlaying) {
              playNextSound();
            }

            // Return early since we've handled the sound playing
            return;
          }
        } else {
          // If no "single" sound, fall back to just the number
          console.log(`Autodarts Tools: Trying fallback sound for "${trigger}" -> "${fallbackTrigger}"`);
          matchingSounds = config.caller.sounds.filter(sound =>
            sound.enabled && sound.triggers && sound.triggers.includes(fallbackTrigger),
          );

          if (matchingSounds.length) {
            console.log(`Autodarts Tools: Using fallback sound for "${trigger}" -> "${fallbackTrigger}"`);
          }
        }
      }
    }
  }

  // Special case: fallback from "miss" to "outside"
  if (!matchingSounds.length && trigger.toLowerCase() === "miss") {
    matchingSounds = config.caller.sounds.filter(sound =>
      sound.enabled && sound.triggers && sound.triggers.includes("outside"),
    );

    if (matchingSounds.length) {
      console.log("Autodarts Tools: Using fallback sound for \"miss\" -> \"outside\"");
    }
  }

  // If we found matching sounds, randomly select one
  if (matchingSounds.length > 0) {
    console.log(`Autodarts Tools: Found ${matchingSounds.length} matching sounds for ${trigger}`);

    // Randomly select a sound from matching sounds
    const randomIndex = Math.floor(Math.random() * matchingSounds.length);
    const soundToPlay = matchingSounds[randomIndex];

    // Add to queue
    if (soundToPlay.url || soundToPlay.base64 || soundToPlay.soundId) {
      soundQueue.push({
        url: soundToPlay.url,
        base64: soundToPlay.base64,
        name: soundToPlay.name,
        soundId: soundToPlay.soundId,
      });

      // Start playing if not already playing
      if (!isPlaying) {
        playNextSound();
      }
    }
  } else {
    console.log(`Autodarts Tools: No matching sounds found for ${trigger}`);
  }
}

/**
 * Play the next sound in the queue
 */
async function playNextSound(): Promise<void> {
  console.log(`Autodarts Tools: Next sound, queue length: ${soundQueue.length}`);

  // If the queue is empty, we're done
  if (soundQueue.length === 0) {
    isPlaying = false;
    return;
  }

  isPlaying = true;

  // Get the next sound from the queue
  const nextSound = soundQueue.shift();

  if (nextSound) {
    try {
      console.log(`Autodarts Tools: Playing sound: ${nextSound.name || "unnamed"}`);

      // Try to load from IndexedDB first if soundId is present
      if (nextSound.soundId && isIndexedDBAvailable()) {
        console.log("Autodarts Tools: Attempting to load sound from IndexedDB");
        try {
          const base64Data = await getSoundFromIndexedDB(nextSound.soundId);
          if (base64Data) {
            console.log("Autodarts Tools: Successfully loaded sound from IndexedDB");
            playBase64Sound(base64Data);
            return;
          } else {
            console.warn("Autodarts Tools: Sound not found in IndexedDB, falling back to base64/URL");
          }
        } catch (error) {
          console.error("Autodarts Tools: Error loading sound from IndexedDB", error);
        }
      }

      // Fall back to base64 in config if available
      if (nextSound.base64) {
        playBase64Sound(nextSound.base64);
      } else if (nextSound.url) {
        // Use URL source if available
        console.log("Autodarts Tools: Using URL source");

        // Get the next audio element from the pool
        const audioElement = audioPool[currentAudioIndex];

        // Make sure the audio element exists
        if (!audioElement) {
          console.error("Autodarts Tools: Audio element not found in pool");
          // Move to next sound
          playNextSound();
          return;
        }

        // Update index for next use
        currentAudioIndex = (currentAudioIndex + 1) % AUDIO_POOL_SIZE;

        // Stop any current playback
        audioElement.pause();

        // Set the source to the URL
        audioElement.src = nextSound.url;

        // Play the sound
        audioElement.play()
          .then(() => {
            console.log("Autodarts Tools: URL sound playing successfully");
          })
          .catch((error) => {
            console.error("Autodarts Tools: Error playing URL sound", error);

            // Check if the error is due to user interaction requirement
            if (
              error.toString().includes("failed because the user didn't interact with the document first") // chrome
              || error.toString().includes("The play method is not allowed by the user agent") // firefox
              || error.toString().includes("The request is not allowed by the user agent") // safari
            ) {
              showInteractionNotification();
              unlockAudio(); // Try to unlock audio again
            }

            // Move to next sound
            playNextSound();
          });
      } else {
        console.error("Autodarts Tools: Sound has neither URL, base64 data, nor soundId");
        // Move to next sound
        playNextSound();
      }
    } catch (error) {
      console.error("Autodarts Tools: Exception while setting up audio", error);
      // Move to next sound on error
      playNextSound();
    }
  } else {
    console.error("Autodarts Tools: nextSound is unexpectedly empty even though queue had items");
    isPlaying = false;
  }
}

/**
 * Play a sound from base64 data
 */
function playBase64Sound(base64Data: string): void {
  console.log("Autodarts Tools: Using base64 source");

  try {
    // Create a blob URL from the base64 data
    const audioUrl = createAudioBlobUrl(base64Data);

    if (!audioUrl) {
      console.error("Autodarts Tools: Failed to create audio blob URL");
      playNextSound();
      return;
    }

    // Add URL to tracking array for later revocation
    blobUrlsToRevoke.push(audioUrl);

    // Get the next audio element from the pool
    const audioElement = audioPool[currentAudioIndex];

    // Make sure the audio element exists
    if (!audioElement) {
      console.error("Autodarts Tools: Audio element not found in pool for base64");
      URL.revokeObjectURL(audioUrl);
      const index = blobUrlsToRevoke.indexOf(audioUrl);
      if (index > -1) {
        blobUrlsToRevoke.splice(index, 1);
      }
      playNextSound();
      return;
    }

    // Update index for next use
    currentAudioIndex = (currentAudioIndex + 1) % AUDIO_POOL_SIZE;

    // Stop any current playback
    audioElement.pause();

    // Set the source to the blob URL
    audioElement.src = audioUrl;

    // Play the sound
    audioElement.play()
      .then(() => {
        console.log("Autodarts Tools: Base64 sound playing successfully");
      })
      .catch((error) => {
        console.error("Autodarts Tools: Base64 sound playback failed", error);

        // Check if error is due to user interaction requirement
        if (
          error.toString().includes("failed because the user didn't interact with the document first") // chrome
          || error.toString().includes("The play method is not allowed by the user agent") // firefox
          || error.toString().includes("The request is not allowed by the user agent") // safari
        ) {
          showInteractionNotification();
          unlockAudio(); // Try to unlock audio again
        }

        URL.revokeObjectURL(audioUrl);
        const index = blobUrlsToRevoke.indexOf(audioUrl);
        if (index > -1) {
          blobUrlsToRevoke.splice(index, 1);
        }
        playNextSound();
      });
  } catch (error) {
    console.error("Autodarts Tools: Error processing base64 data", error);
    playNextSound();
  }
}

/**
 * Create a blob URL from base64 data
 * Returns null if the conversion fails
 */
function createAudioBlobUrl(base64Data: string): string | null {
  try {
    // First, extract the actual base64 data if it's a data URL
    let rawBase64 = base64Data;

    // If it's a data URL (starts with data:), extract just the base64 part
    if (base64Data.startsWith("data:")) {
      const commaIndex = base64Data.indexOf(",");
      if (commaIndex !== -1) {
        rawBase64 = base64Data.substring(commaIndex + 1);
      } else {
        console.error("Autodarts Tools: Invalid data URL format");
        return null;
      }
    }

    // Clean the base64 string - remove whitespace, newlines, etc.
    rawBase64 = rawBase64.replace(/[\s\r\n]+/g, "");

    // Handle potential padding issues
    // Base64 strings should have a length that is a multiple of 4
    while (rawBase64.length % 4 !== 0) {
      rawBase64 += "=";
    }

    // Remove any characters that aren't valid in base64
    rawBase64 = rawBase64.replace(/[^A-Za-z0-9+/=]/g, "");

    // Decode base64 to binary
    let binaryString: string;
    try {
      binaryString = window.atob(rawBase64);
    } catch (e) {
      console.error("Autodarts Tools: Base64 decoding failed", e);

      // Log a sample of the problematic string to help with debugging
      console.error("Autodarts Tools: Problem with base64 string:",
        rawBase64.length > 50 ? `${rawBase64.substring(0, 50)}...` : rawBase64);

      return null;
    }

    // Create a typed array from the binary string
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create a blob and object URL
    // Try to determine the MIME type from the data URL if available
    let mimeType = "audio/mpeg"; // Default MIME type
    if (base64Data.startsWith("data:")) {
      const mimeMatch = base64Data.match(/^data:([^;]+);/);
      if (mimeMatch && mimeMatch[1]) {
        mimeType = mimeMatch[1];
      }
    }

    const blob = new Blob([ bytes ], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Autodarts Tools: Failed to create blob URL", error);
    return null;
  }
}

// Clean up blob URLs periodically to prevent memory leaks
setInterval(() => {
  if (blobUrlsToRevoke.length > 20) {
    console.log("Autodarts Tools: Cleaning up blob URLs", blobUrlsToRevoke.length);
    // Keep the 5 most recent URLs (they might still be in use)
    const urlsToKeep = blobUrlsToRevoke.slice(-5);
    const urlsToRemove = blobUrlsToRevoke.slice(0, -5);

    urlsToRemove.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error("Autodarts Tools: Error revoking URL", e);
      }
    });

    blobUrlsToRevoke.length = 0;
    blobUrlsToRevoke.push(...urlsToKeep);
  }
}, 60000); // Check every minute

/**
 * Stops all currently playing sounds and clears the sound queue
 */
function stopAllSounds(): void {
  console.log("Autodarts Tools: Stopping all sounds due to edit mode");

  // Clear the sound queue
  soundQueue.length = 0;

  // Stop the main audio player if it exists
  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
  }

  // Stop all audio elements in the pool
  audioPool.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });

  // Reset playing flag
  isPlaying = false;
}
