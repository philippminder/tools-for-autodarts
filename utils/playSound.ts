import { soundEffectArray } from "@/utils/helpers";
import { AutodartsToolsConfig } from "@/utils/storage";
import { AutodartsToolsSoundsConfig } from "@/utils/soundsStorage";

soundEffectArray[0].autoplay = true;
soundEffectArray[1].autoplay = true;
soundEffectArray[2].autoplay = true;

// Helper function to safely play audio in Safari
function safePlay(audioElement: HTMLAudioElement) {
  // Safari requires explicit play() call after user interaction
  const playPromise = audioElement.play();

  // Handle play() promise to catch any errors
  if (playPromise !== undefined) {
    playPromise.catch((error) => {
      console.log("Safari audio playback error:", error);

      // If autoplay was prevented, try again with user gesture simulation
      if (error.name === "NotAllowedError") {
        // Create a temporary button and click it to simulate user interaction
        const tempButton = document.createElement("button");
        tempButton.style.display = "none";
        document.body.appendChild(tempButton);
        tempButton.addEventListener("click", () => {
          audioElement.play().catch(e => console.log("Second attempt failed:", e));
          document.body.removeChild(tempButton);
        });
        tempButton.click();
      }
    });
  }
}

export async function playSound(configKey: string, slot: number = 1, arrIndex?: number) {
  let soundConfig = (await AutodartsToolsSoundsConfig.getValue())[configKey];
  if (typeof arrIndex === "number") soundConfig = soundConfig[arrIndex];
  const isSoundsEnabled = (await AutodartsToolsConfig.getValue()).sounds.enabled;
  const fileName = soundConfig.info;
  if (!isSoundsEnabled || !fileName) return;
  const fileData = soundConfig.data;

  const audioElement = soundEffectArray[slot - 1];
  audioElement.src = fileData || fileName;

  // Explicitly call play for Safari
  safePlay(audioElement);
}

export function playPointsSound(callerServerUrl: string, callerFileExt: string, turnPoints?: string, slot: number = 1) {
  if (!turnPoints) return;
  if (callerServerUrl?.length) {
    const audioElement = soundEffectArray[slot - 1];
    audioElement.src = callerServerUrl + turnPoints + callerFileExt;

    // Explicitly call play for Safari
    safePlay(audioElement);
  }
}
