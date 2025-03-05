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

// Add event listeners to handle Safari's playback restrictions
soundEffect1.addEventListener("canplaythrough", () => {
  if (soundEffect1.paused && soundEffect1.autoplay) {
    const playPromise = soundEffect1.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.log("Safari playback error:", error);
      });
    }
  }
});

soundEffect2.addEventListener("canplaythrough", () => {
  if (soundEffect2.paused && soundEffect2.autoplay) {
    const playPromise = soundEffect2.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.log("Safari playback error:", error);
      });
    }
  }
});

soundEffect3.addEventListener("canplaythrough", () => {
  if (soundEffect3.paused && soundEffect3.autoplay) {
    const playPromise = soundEffect3.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.log("Safari playback error:", error);
      });
    }
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
