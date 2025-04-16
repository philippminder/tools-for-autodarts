import type { IConfig } from "@/utils/storage";
import type { IGameData } from "@/utils/game-data-storage";

import { AutodartsToolsConfig } from "@/utils/storage";
import { waitForElement, waitForElementWithTextContent } from "@/utils";

let gameDataWatcherUnwatch: any;
let boardDataWatcherUnwatch: any;

let gameData: IGameData;

export async function automaticNextLeg() {
  console.warn("Autodarts Tools: Automatic Next Leg - TEST THIS WITH LIVE BOARD");

  await waitForElement("#ad-ext-turn");
  try {
    const config: IConfig = await AutodartsToolsConfig.getValue();

    gameDataWatcherUnwatch = AutodartsToolsGameData.watch(async (_gameData: IGameData, _oldGameData: IGameData) => {
      gameData = _gameData;
    });

    boardDataWatcherUnwatch = AutodartsToolsBoardData.watch(async (_boardData: IBoard, _oldBoardData: IBoard) => {
      if (_boardData.event === "Takeout finished" && (gameData.match?.gameWinner ?? -1) >= 0) {
        const nextLegBtn = await waitForElementWithTextContent("button", "Next Leg");
        if (!nextLegBtn) return;
        let startSec = config.automaticNextLeg.sec;

        const nextLegBtnTextEl = document.createElement("span");
        nextLegBtnTextEl.id = "ad-ext_next-leg-text";
        nextLegBtnTextEl.style.whiteSpace = "pre";
        nextLegBtnTextEl.textContent = ` (${startSec})`;
        nextLegBtn.appendChild(nextLegBtnTextEl);

        const nextLegInterval = setInterval(() => {
          startSec--;
          nextLegBtnTextEl.textContent = ` (${startSec})`;

          if (startSec <= 0) {
            clearInterval(nextLegInterval);
            (nextLegBtn as HTMLElement).click();
          }
        }, 1000);
      }
    });
  } catch (e) {
    console.error("Autodarts Tools: Automatic Next Leg - Error: ", e);
  }
}

export function automaticNextLegOnRemove() {
  gameDataWatcherUnwatch?.();
  boardDataWatcherUnwatch?.();
}
