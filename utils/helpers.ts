export const isX01 = () => document.getElementById("ad-ext-game-variant")?.textContent === "X01";
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
