import { AutodartsToolsConfig, AutodartsToolsSoundAutoplayStatus } from "@/utils/storage";
import { AutodartsToolsCallerConfig } from "@/utils/callerStorage";
import { AutodartsToolsSoundsConfig } from "@/utils/soundsStorage";
import { playPointsSound, playSound } from "@/utils/playSound";
import { getWinnerPlayerCard } from "@/utils/getElements";
import { isSafari } from "@/utils/helpers";

export async function soundsWinner() {
  try {
    const isSoundsEnabled = (await AutodartsToolsConfig.getValue()).sounds.enabled;
    const isCallerEnabled = (await AutodartsToolsConfig.getValue()).caller.enabled;

    // Check if we're in Safari and if we've had user interaction
    const soundAutoplayStatus = await AutodartsToolsSoundAutoplayStatus.getValue();

    // If we're in Safari and haven't had user interaction yet, set up a one-time listener
    if (isSafari() && !soundAutoplayStatus) {
      const handleUserInteraction = async () => {
        await AutodartsToolsSoundAutoplayStatus.setValue(true);
        // Re-run the soundsWinner function after user interaction
        soundsWinner();

        // Remove the event listeners after first interaction
        document.removeEventListener("click", handleUserInteraction);
        document.removeEventListener("touchstart", handleUserInteraction);
      };

      // Add event listeners for user interaction
      document.addEventListener("click", handleUserInteraction, { once: true });
      document.addEventListener("touchstart", handleUserInteraction, { once: true });

      console.log("Safari detected: waiting for user interaction to play winner sounds");
      return; // Exit early, we'll re-run after user interaction
    }

    const winnerPlayerCard = getWinnerPlayerCard();
    const winnerPlayerName = (winnerPlayerCard?.querySelector(".ad-ext-player-name") as HTMLElement)?.innerText;

    const callerActive = (await AutodartsToolsCallerConfig.getValue()).caller.filter(caller => caller.isActive)[0];
    const soundsConfig = await AutodartsToolsSoundsConfig.getValue();

    if (!isCallerEnabled && !isSoundsEnabled) return;

    const isWinnerSoundOnLegWin = soundsConfig.winnerSoundOnLegWin;

    let callerServerUrl = callerActive?.url || "";
    if (callerServerUrl.at(-1) !== "/") callerServerUrl += "/";

    const playWinnerSound = () => {
      if (isSoundsEnabled) {
        setTimeout(() => {
          const winnerSoundIndex = soundsConfig.winner.findIndex(winner => winner.name.toLowerCase() === winnerPlayerName?.toLowerCase());
          const soundIndex = winnerSoundIndex && soundsConfig.winner[winnerSoundIndex]?.info ? winnerSoundIndex : 0;
          playSound("winner", 2, soundIndex);
        }, 1000);
      }
    };

    const buttons = [ ...document.querySelectorAll(".chakra-button") as NodeList ];
    const isLegWinner = buttons.findIndex(button => (button as HTMLElement).innerText === "Next Leg") !== -1;
    if (isLegWinner) {
      if (isCallerEnabled && callerServerUrl.length) playPointsSound(callerServerUrl, ".mp3", "gameshot", 3);
      isWinnerSoundOnLegWin && playWinnerSound();
    } else {
      const isMatchWinner = buttons.findIndex(button => (button as HTMLElement).innerText === "Finish") !== -1;
      if (isMatchWinner) {
        if (isCallerEnabled && callerServerUrl.length) playPointsSound(callerServerUrl, ".mp3", "gameshot and the match", 3);
        playWinnerSound();
      }
    }
  } catch (e) {
    console.error("Autodarts Tools: Set winner sounds - Error: ", e);
  }
}
