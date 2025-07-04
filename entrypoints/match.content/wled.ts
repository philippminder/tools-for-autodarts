import type { ILobbies } from "@/utils/websocket-helpers";

import { AutodartsToolsGameData, type IGameData } from "@/utils/game-data-storage";
import { AutodartsToolsLobbyData } from "@/utils/lobby-data-storage";
import { AutodartsToolsBoardData, type IBoard } from "@/utils/board-data-storage";
import { AutodartsToolsConfig, type IConfig, type IWled } from "@/utils/storage";
import { triggerPatterns } from "@/utils/helpers";
import { gameDataProcessor } from "@/utils/wled";

let gameDataWatcherUnwatch: any;
let lobbyDataWatcherUnwatch: any;
let boardDataWatcherUnwatch: any;
let config: IConfig;
let currentBoardId: string;

let debounceTimer: number | null = null;
const DEBOUNCE_DELAY = 200;

async function checkStatus(boardData: IBoard) {
  const boardStatus: string | undefined = boardData.status;

  if (
    boardStatus === "Takeout in progress"
    && isTriggerPresent("takeout")
    && (config.wledFx.boardIds.length === 0
      || (config.wledFx.boardIds.length > 0 && config.wledFx.boardIds.includes(currentBoardId)))
  ) { setEffectByTrigger("takeout"); }
}

export async function wledFx() {
  console.log("Autodarts Tools: WLED: WLED FX");

  try {
    config = await AutodartsToolsConfig.getValue();
    const gameData = await AutodartsToolsGameData.getValue();
    console.log(
      `Autodarts Tools: WLED: Config loaded, ${
        config?.wledFx?.effects?.length || 0
      } effects available`,
    );

    if (!gameDataWatcherUnwatch) {
      gameDataWatcherUnwatch = AutodartsToolsGameData.watch(
        (gameData: IGameData, oldGameData: IGameData) => {
          if (!config?.wledFx?.enabled) return;

          // Debounce the processGameData call
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }

          debounceTimer = window.setTimeout(() => {
            processGameData(gameData, oldGameData, true);
            debounceTimer = null;
          }, DEBOUNCE_DELAY);
        },
      );

      const url = window.location.href;
      const matchId = url.match(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
      )?.[0];

      if (gameData.match?.id === matchId) {
        processGameData(gameData, gameData);
      }
    }

    if (!lobbyDataWatcherUnwatch) {
      lobbyDataWatcherUnwatch = AutodartsToolsLobbyData.watch(
        async (_lobbyData: ILobbies | undefined, _oldLobbyData: ILobbies | undefined) => {
          if (!_lobbyData || !_oldLobbyData || !config?.wledFx?.enabled) return;
          const currentURL = window.location.href;
          if (!currentURL.includes("lobbies")) return;

          if (
            (_lobbyData.players?.length ?? 0) > (_oldLobbyData.players?.length ?? 0)
            && (_lobbyData.players?.length ?? 0) > 1
          ) {
            setEffectByTrigger("lobby_in");
          }

          if (
            (_lobbyData.players?.length ?? 0) < (_oldLobbyData.players?.length ?? 0)
            && (_lobbyData.players?.length ?? 0) > 0
          ) {
            setEffectByTrigger("lobby_out");
          }
        },
      );
    }

    if (!boardDataWatcherUnwatch) {
      boardDataWatcherUnwatch = AutodartsToolsBoardData.watch((boardData: IBoard) => {
        checkStatus(boardData).catch(console.error);
      });
    }
  } catch (error) {
    console.error("Autodarts Tools: WLED: wledFx initialization error", error);
  }
}

export function wledFxOnRemove() {
  console.log("Autodarts Tools: WLED: wledFx on remove");
  if (gameDataWatcherUnwatch) {
    gameDataWatcherUnwatch();
    gameDataWatcherUnwatch = null;
  }

  if (lobbyDataWatcherUnwatch) {
    lobbyDataWatcherUnwatch();
    lobbyDataWatcherUnwatch = null;
  }

  if (boardDataWatcherUnwatch) {
    boardDataWatcherUnwatch();
    boardDataWatcherUnwatch = null;
  }

  setEffectByTrigger("idle");
}

/**
 * Process game data to trigger effects based on game events
 */
async function processGameData(
  gameData: IGameData,
  oldGameData: IGameData,
  fromWebSocket: boolean = false,
): Promise<void> {
  if (!gameData.match || !gameData.match.turns?.length) return;

  const editMode: boolean = gameData.match.activated !== undefined && gameData.match.activated >= 0;
  if (editMode) return;
  if (gameData.match.variant === "Bull-off") return;

  // gameon is the default effect to play when no other event happened
  let nextEffect: string | IWled = "gameon";

  // Play player effect when it's the next players turn
  if (gameData.match.turns[0].throws.length === 0) {
    const currentPlayer = gameData.match.players?.[gameData.match.player];
    const isBot = currentPlayer?.cpuPPR !== null;
    const playerName = currentPlayer?.name;

    if (isBot) {
      console.log("Autodarts Tools: WLED: Bot player detected");
      nextEffect = "bot_throw";
    } else if (playerName) {
      // Try to find player effect (both regular and underscore version)
      const playerNameLower = playerName.toLowerCase();
      const playerNameWithUnderscores = playerNameLower.replace(/\s+/g, "_");
      const playerNameEffects = config.wledFx.effects?.filter(
        effect =>
          effect.enabled
          && effect.triggers
          && (effect.triggers.includes(playerNameLower)
            || effect.triggers.includes(playerNameWithUnderscores)),
      );

      if (playerNameEffects.length > 0) {
        console.log(
          `Autodarts Tools: WLED: Found player name effect for ${playerNameWithUnderscores}`,
        );

        const randomIndex = Math.floor(Math.random() * playerNameEffects.length);
        nextEffect = playerNameEffects[randomIndex];
      }
    }
  }

  const effect: string | null = await gameDataProcessor(gameData, oldGameData, fromWebSocket, isTriggerPresent);
  if (effect) {
    // found effect for match variant
    nextEffect = effect;
  }

  currentBoardId = gameData.match.players?.[gameData.match.player].boardId;

  if (
    config.wledFx.boardIds.length > 0
    && isTriggerPresent("other")
    && !config.wledFx.boardIds.includes(currentBoardId)
  ) {
    nextEffect = "other";
  }

  if (typeof nextEffect === "string") setEffectByTrigger(nextEffect);
  else setEffect(nextEffect);
}

function isTriggerPresent(trigger: string): boolean {
  const present: boolean = config.wledFx.effects?.some(
    effect => effect.enabled && effect?.triggers.includes(trigger),
  );
  if (present) return present;

  // search for range trigger(range_[min]_[max])
  const points = Number(trigger);
  if (Number.isNaN(points)) return false;
  const range_triggers = config.wledFx.effects?.filter(
    effect =>
      effect.enabled && effect?.triggers.some(trigger => trigger.match(triggerPatterns.ranges)),
  );
  for (let i = 0; i < range_triggers.length; i++) {
    const element = range_triggers[i];
    for (let j = 0; j < range_triggers.length; j++) {
      const parts = element.triggers[j].match(triggerPatterns.ranges);
      if (!parts) continue;
      const min = Number(parts[1]);
      const max = Number(parts[2]);
      if (min <= points && points <= max) return true;
    }
  }

  return false;
}

/**
 * Set an effect based on the trigger
 */
export function setEffectByTrigger(trigger: string): void {
  if (!config?.wledFx?.effects || !config.wledFx.effects.length) {
    console.log("Autodarts Tools: WLED: No effects configured");
    return;
  }

  // Find all effects that match the trigger
  const matchingEffects = config.wledFx.effects.filter(
    effect => effect.enabled && effect.triggers && effect.triggers.includes(trigger),
  );

  const points = Number(trigger);
  if (!matchingEffects.length && !Number.isNaN(points)) {
    const range_triggers = config.wledFx.effects.filter(
      effect =>
        effect.enabled && effect?.triggers.some(trigger => trigger.match(triggerPatterns.ranges)),
    );
    for (let i = 0; i < range_triggers.length; i++) {
      const element = range_triggers[i];
      for (let j = 0; j < element.triggers.length; j++) {
        const parts = element.triggers[j].match(triggerPatterns.ranges);
        if (!parts) continue;
        const min = Number(parts[1]);
        const max = Number(parts[2]);
        if (min <= points && points <= max) {
          matchingEffects.push(element);
          break;
        }
      }
    }
  }

  if (!matchingEffects.length) {
    console.log(`Autodarts Tools: WLED: No effect found for trigger "${trigger}"`);
    return;
  }

  // If multiple effects match the trigger, pick a random one
  const randomIndex = Math.floor(Math.random() * matchingEffects.length);
  const nextEffect = matchingEffects[randomIndex];

  console.log(`Autodarts Tools: WLED: Found matching effect ${nextEffect.name}`);
  setEffect(nextEffect);
}

let currentEffect: IWled;
export function setEffect(effect: IWled) {
  if (effect !== currentEffect && effect.url) {
    currentEffect = effect;
    fetch(effect.url).catch(() => {});
  }
}
