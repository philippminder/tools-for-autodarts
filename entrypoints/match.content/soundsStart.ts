import { AutodartsToolsConfig, AutodartsToolsSoundAutoplayStatus } from "@/utils/storage";
import { AutodartsToolsSoundsConfig } from "@/utils/soundsStorage";
import { initializeAudioContext, playSound } from "@/utils/playSound";
import { isSafari } from "@/utils/helpers";

export async function soundsStart() {
  const config = await AutodartsToolsConfig.getValue();
  const soundConfig = await AutodartsToolsSoundsConfig.getValue();
  if (!config.sounds.enabled) return;

  // Initialize AudioContext first
  initializeAudioContext();

  // Check if we're in Safari and if we've already had user interaction
  const soundAutoplayStatus = await AutodartsToolsSoundAutoplayStatus.getValue();

  if (soundConfig.gameOn?.data || soundConfig.gameOn?.info) {
    // For Safari, we need to ensure there's been user interaction
    if (isSafari() && !soundAutoplayStatus) {
      // Create a one-time event listener for the first user interaction
      const handleUserInteraction = async () => {
        await AutodartsToolsSoundAutoplayStatus.setValue(true);
        await playSound("gameOn", 2);

        // Remove the event listeners after first interaction
        document.removeEventListener("click", handleUserInteraction);
        document.removeEventListener("touchstart", handleUserInteraction);
      };

      // Add event listeners for user interaction
      document.addEventListener("click", handleUserInteraction, { once: true });
      document.addEventListener("touchstart", handleUserInteraction, { once: true });

      console.log("Safari detected: waiting for user interaction to play sounds");
    } else {
      // For non-Safari browsers or if we've already had user interaction
      await playSound("gameOn", 2);
    }
  }
}
