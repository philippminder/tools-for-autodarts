import "~/assets/tailwind.css";
import { createApp } from "vue";
import Takeout from "./Takeout.vue";
import { waitForElement } from "@/utils";
import type { IConfig, IMatchStatus } from "@/utils/storage";
import {
  AutodartsToolsBoardStatus,
  AutodartsToolsConfig,
  AutodartsToolsGlobalStatus,
  AutodartsToolsMatchStatus,
  AutodartsToolsUrlStatus,
  defaultMatchStatus,
} from "@/utils/storage";

import { scoreSmaller } from "@/entrypoints/match.content/scoreSmaller";
import { colorChange, onRemove as onRemoveColorChange } from "@/entrypoints/match.content/color-change";
import StreamingMode from "@/entrypoints/match.content/StreamingMode.vue";
import Animations from "@/entrypoints/match.content/Animations.vue";

import { sounds } from "@/entrypoints/match.content/sounds";
import { getBoardStatusEl, getMenu } from "@/utils/getElements";
import { BoardStatus } from "@/utils/types";
import { isBullOff, isCricket, isValidGameMode, isX01 } from "@/utils/helpers";
import { soundsWinner } from "@/entrypoints/match.content/soundsWinner";
import { setCricketClosedPoints } from "@/entrypoints/match.content/setCricketPoints";
import { hideMenu } from "@/entrypoints/match.content/hideMenu";
import { automaticNextLeg } from "@/entrypoints/match.content/automaticNextLeg";
import { playerMatchDataLarger } from "@/entrypoints/match.content/playerMatchDataLarger";
import {
  removeWinnerAnimation,
  removeWinnerAnimationOnEdit,
  winnerAnimation,
} from "@/entrypoints/match.content/winner-animation";
import { soundsStart } from "@/entrypoints/match.content/soundsStart";
import { liveViewRing } from "@/entrypoints/match.content/liveViewRing";
import { setPlayerInfo } from "@/entrypoints/match.content/setPlayerInfo";
import { nextPlayerAfter3darts } from "@/entrypoints/match.content/nextPlayerAfter3darts";
import { handleUndoMode } from "@/entrypoints/match.content/handleUndoMode";
import { nextPlayerOnTakeOutStuck } from "@/entrypoints/match.content/nextPlayerOnTakeOutStuck";
import { disableTakeout } from "@/entrypoints/match.content/disableTakeout";
import "@/utils/audioContextFix";

let matchActive: boolean = false;
let matchActiveObserver: MutationObserver;
let takeoutUI: any;
let streamingModeUI: any;
let animationsUI: any;
let matchReadyUnwatch: any;
let throwsObserver: MutationObserver;
let boardStatusObserver: MutationObserver;

export default defineContentScript({
  matches: [ "*://play.autodarts.io/*" ],
  cssInjectionMode: "ui",
  async main(ctx: any) {
    matchReadyUnwatch = AutodartsToolsUrlStatus.watch(async (url: string) => {
      if (/(?<!history)(\/matches\/|\/boards\/)/.test(url)) {
        const noActiveMatchElements = document.querySelectorAll("h2");
        let noActiveMatchElExists = false;

        for (const el of noActiveMatchElements) {
          if (el.textContent?.includes("Board has no active match")) {
            noActiveMatchElExists = true;
            break;
          }
        }
        matchActive = !noActiveMatchElExists;

        if (!matchActive) {
          console.log("Autodarts Tools: Match Not Ready");
        }

        if (matchActive) {
          initMatch(ctx).catch(console.error);
        }

        matchActiveObserver = startMatchReadyObserver(ctx);
      } else {
        matchActiveObserver?.disconnect();
        throwsObserver?.disconnect();
        boardStatusObserver?.disconnect();
        takeoutUI?.remove();
        takeoutUI = null;
        streamingModeUI?.remove();
        streamingModeUI = null;
        animationsUI?.remove();
        animationsUI = null;
        await onRemoveColorChange();
        const menu = getMenu();
        if (menu) menu.style.display = "flex";
      }
    });
  },
});

function startMatchReadyObserver(ctx) {
  const targetNode = document.querySelector("#root");
  const observer = new MutationObserver(() => {
    // Check if the "Board has no active match" element no longer exists
    const noActiveMatchElements = document.querySelectorAll("h2");
    let noActiveMatchElExists = false;

    for (const el of noActiveMatchElements) {
      if (el.textContent?.includes("Board has no active match")) {
        noActiveMatchElExists = true;
        break;
      }
    }

    if (!noActiveMatchElExists && !matchActive) {
      // Check if match has become active
      waitForElement("#ad-ext-turn").then(() => {
        console.log("Autodarts Tools: Match Became Active");
        matchActive = true;

        // Initialize match components
        initMatch(ctx).catch(console.error);
      }).catch(console.error);
    } else if (noActiveMatchElExists && matchActive) {
      // Match has become inactive
      console.log("Autodarts Tools: Match Became Inactive");
      matchActive = false;
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
  takeoutUI = await createShadowRootUi(ctx, {
    name: "autodarts-tools-takeout",
    position: "inline",
    anchor: "#root > div > div:nth-of-type(2)",
    onMount: (container) => {
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
  takeoutUI.mount();
}

async function initMatch(ctx) {
  const config: IConfig = await AutodartsToolsConfig.getValue();
  await AutodartsToolsMatchStatus.setValue(defaultMatchStatus);
  const globalStatus = await AutodartsToolsGlobalStatus.getValue();

  await waitForElement("#ad-ext-turn");

  if (!config.disableTakeout.enabled) {
    const takeoutDiv = document.querySelector("autodarts-tools-takeout");
    if (!takeoutDiv) initTakeout(ctx).catch(console.error);
  }

  if (config.streamingMode.enabled) {
    const div = document.querySelector("autodarts-tools-streaming-mode");
    if (!div) initStreamingMode(ctx).catch(console.error);
  }

  if (config.animations.enabled) {
    const div = document.querySelector("autodarts-tools-animations");
    if (!div) initAnimations(ctx).catch(console.error);
  }

  startThrowsObserver(ctx);

  if (isValidGameMode()
      && !config.disableTakeout.enabled
      && getBoardStatusEl()
      && (config.takeout.enabled || config.automaticNextLeg.enabled || config.nextPlayerOnTakeOutStuck.enabled)) {
    startBoardStatusObserver();
  }

  if (isX01() && config.liveViewRing.enabled) {
    await liveViewRing();
    startViewObserver();
  }

  if (config.colors.enabled) {
    await colorChange();
  }

  await hideMenu();

  if (isValidGameMode()) {
    await playerMatchDataLarger();
    if (!config.disableTakeout.enabled) {
      await nextPlayerOnTakeOutStuck();
    }

    if (globalStatus.isFirstStart) {
      await soundsStart();
      await AutodartsToolsGlobalStatus.setValue({ ...globalStatus, isFirstStart: false });
    }

    await disableTakeout();
  }

  await handleUndoMode();

  throwsChange(ctx).catch(console.error);
}

async function initStreamingMode(ctx) {
  await waitForElement("#ad-ext-player-display");
  streamingModeUI = await createShadowRootUi(ctx, {
    name: "autodarts-tools-streaming-mode",
    position: "inline",
    anchor: "#root",
    onMount: (container: any) => {
      console.log("Autodarts Tools: Streaming Mode");
      const app = createApp(StreamingMode);
      app.mount(container);
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        container.classList.add("dark");
      }
      return app;
    },
    onRemove: (app: any) => {
      console.log("Autodarts Tools: Remove Streaming Mode");
      app?.unmount();
    },
  });
  streamingModeUI.mount();
}

async function initAnimations(ctx) {
  await waitForElement("#ad-ext-player-display");
  animationsUI = await createShadowRootUi(ctx, {
    name: "autodarts-tools-animations",
    position: "inline",
    anchor: "#root",
    onMount: (container: any) => {
      const app = createApp(Animations);
      app.mount(container);
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        container.classList.add("dark");
      }
      return app;
    },
    onRemove: (app: any) => {
      app?.unmount();
    },
  });
  animationsUI.mount();
}

async function throwsChange(ctx) {
  await setPlayerInfo();
  const matchStatus: IMatchStatus = await AutodartsToolsMatchStatus.getValue();

  if (isValidGameMode()) {
    if (matchStatus.hasWinner) {
      if (matchStatus.isInEditMode) {
        await removeWinnerAnimationOnEdit();
      } else {
        await winnerAnimation();
      }
    } else {
      await removeWinnerAnimation();
    }

    await nextPlayerAfter3darts();
  }

  if (isBullOff()) {
    const bullOffInterval = setInterval(() => {
      clearInterval(bullOffInterval);
      initMatch(ctx).catch(console.error);
    }, 1000);
  }

  await scoreSmaller();
  await sounds();

  if (isCricket()) await setCricketClosedPoints(matchStatus.playerCount).catch(console.error);

  matchStatus.hasWinner && isValidGameMode() && (await soundsWinner());

  if (matchStatus.hasWinner) {
    const isBot = document.querySelector(".ad-ext-player-winner .ad-ext-player-name")?.textContent?.startsWith("BOT LEVEL");
    if (isBot) await automaticNextLeg();
  }

  await AutodartsToolsMatchStatus.setValue({
    ...matchStatus,
    isInUndoMode: false,
  });
}

function startThrowsObserver(ctx) {
  const targetNode = document.querySelector("#ad-ext-turn");
  throwsObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        throwsChange(ctx).catch(console.error);
      }
    }
  });

  if (targetNode) {
    throwsObserver.observe(targetNode, {
      childList: true,
      subtree: true,
    });
  }
}

function startBoardStatusObserver() {
  const targetNode = getBoardStatusEl();
  if (!targetNode) {
    console.log("Autodarts Tools: No board status found");
    return;
  }
  boardStatusObserver = new MutationObserver((m) => {
    m.forEach((record) => {
      if (record.type === "characterData" && record.target.textContent && Object.values(BoardStatus).includes(record.target.textContent as BoardStatus)) {
        AutodartsToolsBoardStatus.setValue(record.target.textContent as BoardStatus).catch(console.error);
        // automatic next leg if board status is throw (so it starts counting after takeout)
        if (record.target.textContent === BoardStatus.THROW) {
          AutodartsToolsMatchStatus.getValue().then((matchStatus) => {
            if (matchStatus.hasWinner) automaticNextLeg().catch(console.error);
          });
        }
      }
    });
  });
  boardStatusObserver.observe(targetNode, { characterData: true, subtree: true });
}

function startViewObserver() {
  const targetNode = document.getElementById("ad-ext-turn")?.nextElementSibling;
  if (!targetNode) {
    console.error("Target node not found");
    return;
  }
  throwsObserver = new MutationObserver((m) => {
    m.forEach(async (record) => {
      if (record.addedNodes.length > 0 && record.addedNodes[0] && (record.addedNodes[0] as HTMLElement).childElementCount === 2 && (record.addedNodes[0] as HTMLElement).children[1].childElementCount === 2) {
        await liveViewRing();
      }
    });
  });
  throwsObserver.observe(targetNode, { childList: true, subtree: true, attributes: false });
}
