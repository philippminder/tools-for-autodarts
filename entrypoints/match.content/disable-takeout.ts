import { AutodartsToolsGameData, type IGameData } from "@/utils/game-data-storage";
import { waitForElementWithTextContent } from "@/utils";

export async function disableTakeout() {
  console.log("Autodarts Tools: disable takeout recognition");
  console.warn("Autodarts Tools: disable takeout recognition - TEST THIS WITH LIVE BOARD");

  // TODO: Check if it's own match or not because other matches don't have these buttons

  try {
    AutodartsToolsGameData.watch(async (gameData: IGameData) => {
      if (typeof gameData.match?.activated === "number" && gameData.match.activated >= 0) {
        console.log("Autodarts Tools: start the board");
        await (await waitForElementWithTextContent("button", "Start"))?.click();
      } else if (gameData.match?.turns[0].throws.length === 3) {
        console.log("Autodarts Tools: stop the board");
        await (await waitForElementWithTextContent("button", "Stop"))?.click();
      }
    });

    const nextBtn = await waitForElementWithTextContent("button", "Next");
    nextBtn?.addEventListener("click", async () => {
      await (await waitForElementWithTextContent("button", "Reset"))?.click();
      console.log("Autodarts Tools: reset the board");
      setTimeout(async () => {
        await (await waitForElementWithTextContent("button", "Start"))?.click();
        console.log("Autodarts Tools: start the board");
      }, 100);
    });
  } catch (e) {
    console.error("Autodarts Tools: disable takeout recognition - Error: ", e);
  }
}
