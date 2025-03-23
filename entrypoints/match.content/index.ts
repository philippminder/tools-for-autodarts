import "~/assets/tailwind.css";
import { createApp } from "vue";
import { disableTakeout } from "./disable-takeout";
import { colorChange, onRemove as colorChangeOnRemove } from "./color-change";
import Takeout from "./Takeout.vue";
import { nextPlayerOnTakeOutStuck, nextPlayerOnTakeOutStuckOnRemove } from "./next-player-on-take-out-stuck";
import { automaticNextLeg } from "./automatic-next-leg";
import { smallerScores } from "./smaller-scores";
import { hideMenuInMatch, hideMenuInMatchOnRemove } from "./hide-menu-in-match";
import { largerPlayerMatchData } from "./larger-player-match-data";
import { largerLegsSets } from "./larger-legs-sets";
import { largerPlayerNames } from "./larger-player-names";
import { winnerAnimation, winnerAnimationOnRemove } from "./winner-animation";
import { ring } from "./ring";
import { soundFx, soundFxOnRemove } from "./sound-fx";
import { caller, callerOnRemove } from "./caller";
import { waitForElement, waitForElementWithTextContent } from "@/utils";
import {
  AutodartsToolsConfig,
  AutodartsToolsUrlStatus,
} from "@/utils/storage";

import StreamingMode from "@/entrypoints/match.content/StreamingMode.vue";
import { fetchWithAuth, isSafari, isiOS } from "@/utils/helpers";
import { processWebSocketMessage } from "@/utils/websocket-helpers";
import { AutodartsToolsGameData } from "@/utils/game-data-storage";
import Animations from "@/entrypoints/match.content/Animations.vue";

let matchInitialized = false;
let activeMatchObserver: MutationObserver;
let gameDataWatcher: any;

const tools = {
  streamingMode: null as any,
  takeout: null as any,
  animations: null as any,
};

export default defineContentScript({
  matches: [ "*://play.autodarts.io/*" ],
  cssInjectionMode: "ui",
  async main(ctx: any) {
    AutodartsToolsUrlStatus.watch(async (url: string) => {
      if (!url && (isiOS() || isSafari())) url = window.location.href;

      if (/\/(matches|boards)\/([0-9a-f-]+)/.test(url)) {
        await waitForElement("#root > div > div:nth-of-type(2)");

        // Extract lobby ID from URL and fetch lobby data
        let matchId = url.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0];
        if (matchId) {
          try {
            console.log("Autodarts Tools: Fetching match data with cookie authentication...");

            if (url.includes("boards")) {
              const apiUrl = `https://api.autodarts.io/bs/v0/boards/${matchId}`;
              const response = await fetchWithAuth(apiUrl);

              if (response.ok) {
                matchId = (await response.json()).matchId;
              }
            }

            console.log("Autodarts Tools: Match ID:", matchId);

            const apiUrl = `https://api.autodarts.io/gs/v0/matches/${matchId}/state`;
            const response = await fetchWithAuth(apiUrl);

            console.log("Autodarts Tools: Response status:", response.status);

            if (response.ok) {
              const matchData = await response.json();
              console.log("Autodarts Tools: Match Data:", matchData);
              await processWebSocketMessage("autodarts.matches", matchData);
            } else {
              console.error("Autodarts Tools: Failed to fetch match data", response.status, response.statusText);
            }
          } catch (error) {
            console.error("Autodarts Tools: Error fetching match data:", error);
          }
        }

        const activeMatch = window.location.href.includes("boards") ? !(await waitForElementWithTextContent("h2", "Board has no active match", 1000).catch(() => undefined)) : true;

        if (activeMatch) {
          console.log("Autodarts Tools: Match found, initializing match");
          initMatch(ctx, url).catch(console.error);

          if (!gameDataWatcher) {
            gameDataWatcher = AutodartsToolsGameData.watch(async (value, oldValue) => {
              if (oldValue?.match?.variant === "Bull-off" && value?.match?.variant !== "Bull-off") {
                clearMatch();
                await new Promise(resolve => setTimeout(resolve, 500));
                return initMatch(ctx, url);
              }
            });
          }
        } else {
          console.log("Autodarts Tools: No Active Match found, waiting for match to start");
        }

        activeMatchObserver = startActiveMatchObserver(ctx);
      } else {
        clearMatch();
      }
    });
  },
});

async function initMatch(ctx, url: string) {
  if (matchInitialized) return;
  matchInitialized = true;

  const config = await AutodartsToolsConfig.getValue();

  if (config.streamingMode.enabled) {
    await initStreamingMode(ctx).catch(console.error);
  }

  if (config.disableTakeout.enabled) {
    await initScript(disableTakeout, url).catch(console.error);
  }

  if (config.colors.enabled) {
    await initScript(colorChange, url).catch(console.error);
  }

  if (config.takeout.enabled) {
    await initTakeout(ctx).catch(console.error);
  }

  if (config.nextPlayerOnTakeOutStuck.enabled) {
    await initScript(nextPlayerOnTakeOutStuck, url).catch(console.error);
  }

  if (config.automaticNextLeg.enabled) {
    await initScript(automaticNextLeg, url).catch(console.error);
  }

  if (config.smallerScores.enabled) {
    await initScript(smallerScores, url).catch(console.error);
  }

  if (config.hideMenuInMatch.enabled) {
    await initScript(hideMenuInMatch, url).catch(console.error);
  }

  if (config.largerLegsSets.enabled) {
    await initScript(largerLegsSets, url).catch(console.error);
  }

  if (config.largerPlayerMatchData.enabled) {
    await initScript(largerPlayerMatchData, url).catch(console.error);
  }

  if (config.largerPlayerNames.enabled) {
    await initScript(largerPlayerNames, url).catch(console.error);
  }

  if (config.winnerAnimation.enabled) {
    await initScript(winnerAnimation, url).catch(console.error);
  }

  if (config.ring.enabled) {
    await initScript(ring, url).catch(console.error);
  }

  if (config.animations.enabled) {
    await initAnimations(ctx).catch(console.error);
  }

  if (config.ring.enabled) {
    await initScript(ring, url).catch(console.error);
  }

  if (config.caller.enabled) {
    await initScript(caller, url).catch(console.error);
  }

  if (config.soundFx.enabled) {
    await initScript(soundFx, url).catch(console.error);
  }
}

function clearMatch() {
  console.log("Autodarts Tools: Clearing match");

  activeMatchObserver?.disconnect();

  tools.streamingMode?.remove();
  tools.takeout?.remove();
  tools.animations?.remove();

  colorChangeOnRemove();
  hideMenuInMatchOnRemove();
  winnerAnimationOnRemove();
  callerOnRemove();
  soundFxOnRemove();
  nextPlayerOnTakeOutStuckOnRemove();

  matchInitialized = false;
}

async function initScript(fn: any, url: string) {
  if (window.location.href !== url) return;
  await fn();
}

function startActiveMatchObserver(ctx) {
  const targetNode = document.querySelector("#root > div > div:nth-of-type(2)");
  const observer = new MutationObserver(async () => {
    const url = window.location.href;
    if (!(/\/(matches|boards)\/([0-9a-f-]+)/.test(url))) return;

    // Check if the "Board has no active match" element no longer exists
    const activeMatch = window.location.href.includes("boards") ? !(await waitForElementWithTextContent("h2", "Board has no active match", 1000).catch(() => undefined)) : true;

    if (!activeMatch) {
      console.log("Autodarts Tools Observer: No Active Match found, waiting for match to start");
      if (matchInitialized) {
        matchInitialized = false;
        clearMatch();
      }
    } else {
      const url = await AutodartsToolsUrlStatus.getValue();
      let matchId = url.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0];

      if (url.includes("boards")) {
        const apiUrl = `https://api.autodarts.io/bs/v0/boards/${matchId}`;
        const response = await fetchWithAuth(apiUrl);

        if (response.ok) {
          matchId = (await response.json()).matchId;
        }
      }

      console.log("Autodarts Tools Observer: Match ID:", matchId);

      if (!matchInitialized && matchId) {
        console.log("Autodarts Tools Observer: Match found, initializing match because activeMatch is true");
        initMatch(ctx, url).catch(console.error);
      }
    }
  });

  // Add null check before observing
  if (targetNode) {
    observer.observe(targetNode, {
      childList: true,
      subtree: true,
    });
  }

  return observer;
}

async function initTakeout(ctx) {
  tools.takeout = await createShadowRootUi(ctx, {
    name: "autodarts-tools-takeout",
    position: "inline",
    anchor: "#root > div > div:nth-of-type(2)",
    onMount: (container) => {
      console.log("Autodarts Tools: Takeout initialized");
      const takeout = createApp(Takeout);
      takeout.mount(container);
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        container.classList.add("dark");
      }
      return takeout;
    },
    onRemove: (takeout) => {
      takeout?.unmount();
    },
  });
  tools.takeout.mount();
}

async function initStreamingMode(ctx) {
  await waitForElement("#ad-ext-player-display");
  tools.streamingMode = await createShadowRootUi(ctx, {
    name: "autodarts-tools-streaming-mode",
    position: "inline",
    anchor: "#root",
    onMount: (container: any) => {
      console.log("Autodarts Tools: Streaming Mode initialized");
      const app = createApp(StreamingMode);
      app.mount(container);
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        container.classList.add("dark");
      }
      return app;
    },
    onRemove: (app: any) => {
      app?.unmount();
      console.log("Autodarts Tools: Streaming Mode removed");
    },
  });

  tools.streamingMode.mount();
}

async function initAnimations(ctx) {
  await waitForElement("#root > div > div:nth-of-type(2)");
  tools.animations = await createShadowRootUi(ctx, {
    name: "autodarts-tools-animations",
    position: "inline",
    anchor: "#root > div > div:nth-of-type(2)",
    onMount: (container: any) => {
      console.log("Autodarts Tools: Animations initialized");
      const app = createApp(Animations);
      app.mount(container);
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        container.classList.add("dark");
      }
      return app;
    },
    onRemove: (app: any) => {
      app?.unmount();
      console.log("Autodarts Tools: Animations removed");
    },
  });

  tools.animations.mount();
}
