import { AutodartsToolsMatchStatus } from "@/utils/storage";
import type { IMatchStatus, IPlayerInfo } from "@/utils/storage";
import { getDartsThrown, getStats } from "@/utils/getElements";

export async function setPlayerInfo() {
  try {
    const editPlayerThrowActive = document.querySelector(".ad-ext-turn-throw.css-891a5e");
    const hasWinner = document.querySelector(".ad-ext-player-winner");

    const playerCount = document.getElementById("ad-ext-player-display")?.children.length || 0;

    const turnContainerEl = document.getElementById("ad-ext-turn");
    const throws = [ ...turnContainerEl?.querySelectorAll(".ad-ext-turn-throw") as NodeListOf<HTMLElement> ].map(el => el.innerText);
    const turnPoints = document.querySelector<HTMLElement>(".ad-ext-turn-points")?.innerText?.trim();

    const matchStatus: IMatchStatus = await AutodartsToolsMatchStatus.getValue();

    const playerInfo: IPlayerInfo[] = [ ...document.querySelectorAll(".ad-ext-player") ].map((playerCardEl) => {
      const playerStatsEl = playerCardEl?.children[0] as HTMLElement;

      const matchHasLegs = playerStatsEl.querySelector("div.chakra-stack:first-of-type > div > div")!.children.length >= 1;
      const matchHasSets = playerStatsEl.querySelector("div.chakra-stack:first-of-type > div > div")!.children.length >= 2;

      return {
        name: playerCardEl.querySelector(".ad-ext-player-name")?.textContent || "",
        score: playerCardEl.querySelector(".ad-ext-player-score")?.textContent?.trim() ?? "0",
        isActive: playerCardEl.classList.contains("ad-ext-player-active"),
        ...(matchHasLegs && { legs: playerStatsEl.querySelector("div.chakra-stack:first-of-type > div > div")?.children[matchHasSets ? 1 : 0]?.textContent?.trim() }),
        ...(matchHasSets && { sets: playerStatsEl.querySelector("div.chakra-stack:first-of-type > div > div")?.children[0]?.textContent?.trim() }),
        darts: getDartsThrown(playerCardEl as HTMLElement),
        stats: getStats(playerCardEl as HTMLElement),
        matchHasLegs,
        matchHasSets,
      };
    });

    await AutodartsToolsMatchStatus.setValue({
      ...matchStatus,
      playerCount,
      throws,
      turnPoints,
      isInEditMode: !!editPlayerThrowActive,
      hasWinner: !!hasWinner,
      playerInfo,
    });
  } catch (e) {
    console.error("Autodarts Tools: Set Player Info - Error: ", e);
  }
}
