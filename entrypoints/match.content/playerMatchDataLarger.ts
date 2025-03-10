import { AutodartsToolsConfig } from "@/utils/storage";
import { waitForElement } from "@/utils";

export async function playerMatchDataLarger() {
  await waitForElement("#ad-ext-turn");
  try {
    const config = await AutodartsToolsConfig.getValue();
    if (!config.legsSetsLarger.enabled && !config.playerMatchData.enabled) return;
    const legsSetsLargerSize = config.legsSetsLarger.value || 3;
    const playerMatchDataSize = config.playerMatchData.value || 1.5;
    document.querySelectorAll(".ad-ext-player").forEach((playerCardEl) => {
      playerCardEl?.querySelectorAll(".chakra-stack span").forEach((spanEl) => {
        if (spanEl.classList.contains("ad-ext-player-name")
            || spanEl.querySelector(".ad-ext-player-name")
            || spanEl.closest(".ad-ext-player-name")
            || spanEl.parentElement?.classList.contains("ad-ext-player-name")) {
          return;
        }

        const paragraph = spanEl.querySelector("p");
        if (config.legsSetsLarger.enabled && paragraph) {
          paragraph.style.fontSize = `${legsSetsLargerSize}rem`;
        }
      });

      if (config.playerMatchData.enabled) {
        const matchDataElement = playerCardEl?.querySelector("div:last-of-type > p") as HTMLElement | null;
        if (matchDataElement) {
          matchDataElement.style.fontSize = `${playerMatchDataSize}rem`;
        }
      }
    });
  } catch (e) {
    console.error("Autodarts Tools: Larger Legs / Sets - Error: ", e);
  }
}
