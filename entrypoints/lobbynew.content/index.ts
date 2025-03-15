import type { IConfig } from "@/utils/storage";
import {
  AutodartsToolsConfig, AutodartsToolsLobbyStatus,
  AutodartsToolsUrlStatus,
} from "@/utils/storage";
import type { GameMode, IGameData } from "@/utils/game-data-storage";
import { AutodartsToolsGameData } from "@/utils/game-data-storage";
import { waitForElement, waitForElementWithTextContent } from "@/utils";

export default defineContentScript({
  matches: [ "*://play.autodarts.io/*" ],
  cssInjectionMode: "ui",
  async main() {
    AutodartsToolsUrlStatus.watch(async (url: string) => {
      const config: IConfig = await AutodartsToolsConfig.getValue();
      if (/\/lobbies\/*new\//.test(url)) {
        console.log("Autodarts Tools: Lobby New Ready");

        const gameData: IGameData = await AutodartsToolsGameData.getValue();
        const gameModeTitle = await waitForElement("h2");
        const buttonPublic = await waitForElementWithTextContent("button", "Public");
        const buttonPrivate = await waitForElementWithTextContent("button", "Private");

        await AutodartsToolsGameData.setValue({
          ...gameData,
          gameMode: gameModeTitle.textContent as GameMode,
        });

        console.log("Autodarts Tools: Game Mode", gameModeTitle.textContent);

        buttonPublic?.addEventListener("click", async () => {
          await AutodartsToolsGameData.setValue({
            ...gameData,
            private: false,
          });
          console.log("Autodarts Tools: Lobby is Public");
        });

        buttonPrivate?.addEventListener("click", async () => {
          await AutodartsToolsGameData.setValue({
            ...gameData,
            private: true,
          });
          console.log("Autodarts Tools: Lobby is Private");
        });

        // check if buttonPublic or buttonPrivate has data-active attribute and set the private state accordingly
        if (buttonPublic?.hasAttribute("data-active")) {
          await AutodartsToolsGameData.setValue({
            ...gameData,
            private: false,
          });
          console.log("Autodarts Tools: Lobby is Public");
        } else if (buttonPrivate?.hasAttribute("data-active")) {
          await AutodartsToolsGameData.setValue({
            ...gameData,
            private: true,
          });
          console.log("Autodarts Tools: Lobby is Private");
        }

        // Old Stuff
        if (config.teamLobby.enabled) {
          const lobbyStatus = await AutodartsToolsLobbyStatus.getValue();
          const privateButton = [ ...document.querySelectorAll("button") ].find(btn => (btn as HTMLElement).innerText === "Private");
          const publicButton = [ ...document.querySelectorAll("button") ].find(btn => (btn as HTMLElement).innerText === "Public");

          const setPrivateState = async (isPrivate: boolean) => {
            await AutodartsToolsLobbyStatus.setValue({
              ...lobbyStatus,
              isPrivate,
            });
          };

          await setPrivateState(privateButton?.hasAttribute("data-active") || false);

          privateButton?.addEventListener("click", async () => {
            await setPrivateState(true);
          });

          publicButton?.addEventListener("click", async () => {
            await setPrivateState(false);
          });
        }
      }
    });
  },
});
