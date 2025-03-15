import "~/assets/tailwind.css";
import { createApp } from "vue";
import { waitForElement, waitForElementWithTextContent } from "@/utils";
import {
  AutodartsToolsConfig,
  AutodartsToolsUrlStatus,
} from "@/utils/storage";

import StreamingMode from "@/entrypoints/match.content/StreamingMode.vue";
import { fetchWithAuth } from "@/utils/helpers";
import { processWebSocketMessage } from "@/utils/websocket-helpers";

let matchInitialized = false;
let activeMatchObserver: MutationObserver;

const tools = {
  streamingMode: null as any,
};

export default defineContentScript({
  matches: [ "*://play.autodarts.io/*" ],
  cssInjectionMode: "ui",
  async main(ctx: any) {
    AutodartsToolsUrlStatus.watch(async (url: string) => {
      if (/(?<!history)(\/matches\/|boards\/)/.test(url)) {
        // Extract lobby ID from URL and fetch lobby data
        const matchIdMatch = url.match(/\/matches\/([0-9a-f-]+)/);
        if (matchIdMatch && matchIdMatch[1]) {
          const matchId = matchIdMatch[1];
          console.log("Autodarts Tools: Match ID:", matchId);

          try {
            console.log("Autodarts Tools: Fetching match data with cookie authentication...");
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

        const activeMatch = !(await waitForElementWithTextContent("h2", "Board has no active match", 1000).catch(() => false));

        if (!activeMatch) {
          console.log("Autodarts Tools: No Active Match found, waiting for match to start");
        } else {
          console.log("Autodarts Tools: Match found, initializing match");
          initMatch(ctx).catch(console.error);
        }

        activeMatchObserver = startActiveMatchObserver(ctx);
      } else {
        console.log("Autodarts Tools: No Match found, clearing match");
        clearMatch();
      }
    });
  },
});

function clearMatch() {
  tools.streamingMode?.remove();
  activeMatchObserver?.disconnect();

  matchInitialized = false;
}

function startActiveMatchObserver(ctx) {
  const targetNode = document.querySelector("#root > div > div:nth-of-type(2)");
  const observer = new MutationObserver(async () => {
    // Check if the "Board has no active match" element no longer exists
    const activeMatch = !(await waitForElementWithTextContent("h2", "Board has no active match", 1000).catch(() => false));

    if (!activeMatch) {
      console.log("Autodarts Tools: No Active Match found, waiting for match to start");
      if (matchInitialized) {
        matchInitialized = false;
        clearMatch();
      }
    } else {
      if (!matchInitialized) {
        console.log("Autodarts Tools: Match found, initializing match");
        initMatch(ctx).catch(console.error);
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

async function initMatch(ctx) {
  if (matchInitialized) return;
  matchInitialized = true;

  const config = await AutodartsToolsConfig.getValue();

  if (config.streamingMode.enabled) {
    await initStreamingMode(ctx).catch(console.error);
  }

  console.log("Autodarts Tools: Match initialized successfully");
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
