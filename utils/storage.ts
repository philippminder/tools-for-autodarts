import type { WxtStorageItem } from "wxt/storage";
import { storage } from "wxt/storage";
import type { BoardStatus } from "@/utils/types";

export interface IConfig {
  discord: {
    enabled: boolean;
    manually: boolean;
    url: string;
  };
  autoStart: {
    enabled: boolean;
  };
  streamingMode: {
    enabled: boolean;
    backgroundImage: boolean;
    chromaKeyColor: string;
    image: string;
    throws: boolean;
    footerText: string;
    board: boolean;
    boardImage: boolean;
    avg: boolean; // P4394
    scoreBoardSettings: {
      scale: number;
      x: number;
      y: number;
    };
    coordsSettings: {
      scale: number;
      x: number;
      y: number;
    };
  };
  colors: {
    enabled: boolean;
    background: string;
    text: string;
  };
  recentLocalPlayers: {
    enabled: boolean;
    cap: number;
    players: string[];
  };
  takeout: {
    enabled: boolean;
  };
  smallerScores: {
    enabled: boolean;
  };
  shufflePlayers: {
    enabled: boolean;
  };
  caller: {
    enabled: boolean;
  };
  sounds: {
    enabled: boolean;
  };
  externalBoards: {
    enabled: boolean;
    boards: {
      id: string;
      name: string;
    }[];
  };
  hideMenuInMatch: {
    enabled: boolean;
  };
  largerLegsSets: {
    enabled: boolean;
    value: number;
  };
  largerPlayerMatchData: {
    enabled: boolean;
    value: number;
  };
  automaticNextLeg: {
    enabled: boolean;
    sec: number;
  };
  winnerAnimation: {
    enabled: boolean;
  };
  nextPlayerOnTakeOutStuck: {
    enabled: boolean;
    sec: number;
  };
  disableTakeout: {
    enabled: boolean;
  };
  teamLobby: {
    enabled: boolean;
  };
  ring: {
    enabled: boolean;
    size: number;
    colorEnabled: boolean;
    color: string;
  };
  animations: {
    enabled: boolean;
    duration?: number;
    delayStart?: number;
    objectFit?: string;
    data: IAnimation[];
  };
}

export interface IAnimation {
  url: string;
  triggers: string[];
  enabled: boolean;
}

export interface IGlobalStatus {
  isFirstStart: boolean;
  user: {
    name: string;
  };
  auth?: {
    token: string;
  };
}

export interface IPlayerInfo {
  name: string;
  score: string;
  isActive: boolean;
  legs?: string;
  sets?: string;
  darts?: string;
  stats?: string;
  matchHasLegs?: boolean;
  matchHasSets?: boolean;
}

export interface IMatchStatus {
  playerCount: number;
  throws: string[];
  turnPoints?: string ;
  isInEditMode: boolean;
  isInUndoMode: boolean;
  hasWinner: boolean;
  playerInfo: IPlayerInfo[];
}

export interface ILobbyStatus {
  isPrivate: boolean;
}

export type TBoardStatus = BoardStatus | undefined;

export const defaultConfig: IConfig = {
  discord: {
    enabled: false,
    manually: false,
    url: "",
  },
  autoStart: {
    enabled: false,
  },
  streamingMode: {
    enabled: false,
    backgroundImage: false,
    chromaKeyColor: "#009933",
    image: "",
    throws: false,
    footerText: "",
    board: false,
    boardImage: false,
    avg: false, // P42de
    scoreBoardSettings: {
      scale: 1,
      x: 0,
      y: 0,
    },
    coordsSettings: {
      scale: 1,
      x: 0,
      y: 0,
    },
  },
  colors: {
    enabled: false,
    background: "#3182CE",
    text: "#FFFFFF",
  },
  recentLocalPlayers: {
    enabled: false,
    cap: 10,
    players: [],
  },
  takeout: {
    enabled: false,
  },
  smallerScores: {
    enabled: false,
  },
  shufflePlayers: {
    enabled: false,
  },
  caller: {
    enabled: false,
  },
  sounds: {
    enabled: false,
  },
  externalBoards: {
    enabled: false,
    boards: [],
  },
  hideMenuInMatch: {
    enabled: false,
  },
  largerLegsSets: {
    enabled: false,
    value: 2.5,
  },
  largerPlayerMatchData: {
    enabled: false,
    value: 1.5,
  },
  automaticNextLeg: {
    enabled: false,
    sec: 5,
  },
  winnerAnimation: {
    enabled: false,
  },
  nextPlayerOnTakeOutStuck: {
    enabled: false,
    sec: 10,
  },
  disableTakeout: {
    enabled: false,
  },
  teamLobby: {
    enabled: false,
  },
  ring: {
    enabled: false,
    size: 2,
    colorEnabled: true,
    color: "#000000",
  },
  animations: {
    enabled: false,
    duration: 1,
    delayStart: 1,
    objectFit: "cover",
    data: [],
  },
};

export const AutodartsToolsConfig: WxtStorageItem<IConfig, any> = storage.defineItem(
  "local:config",
  {
    defaultValue: defaultConfig,
  },
);

export const defaultGlobalStatus: IGlobalStatus = {
  isFirstStart: false,
  user: {
    name: "",
  },
  auth: {
    token: "",
  },
};

export const AutodartsToolsGlobalStatus: WxtStorageItem<IGlobalStatus, any> = storage.defineItem(
  "local:globalstatus",
  {
    defaultValue: defaultGlobalStatus,
  },
);

export const defaultMatchStatus: IMatchStatus = {
  playerCount: 0,
  throws: [],
  turnPoints: undefined,
  isInEditMode: false,
  isInUndoMode: false,
  hasWinner: false,
  playerInfo: [],
};

export const defaultLobbyStatus: ILobbyStatus = {
  isPrivate: false,
};

export const AutodartsToolsMatchStatus: WxtStorageItem<IMatchStatus, any> = storage.defineItem(
  "local:matchstatus",
  {
    defaultValue: defaultMatchStatus,
  },
);

export const AutodartsToolsLobbyStatus: WxtStorageItem<ILobbyStatus, any> = storage.defineItem(
  "local:lobbystatus",
  {
    defaultValue: defaultLobbyStatus,
  },
);

export const AutodartsToolsBoardStatus: WxtStorageItem<TBoardStatus, any> = storage.defineItem(
  "local:boardstatus",
  {
    defaultValue: undefined,
  },
);

export const AutodartsToolsSoundAutoplayStatus: WxtStorageItem<boolean, any> = storage.defineItem(
  "local:soundstartstatus",
  {
    defaultValue: false,
  },
);

export const AutodartsToolsUrlStatus: WxtStorageItem<string, any> = storage.defineItem(
  "local:urlstatus",
  {
    defaultValue: window.location.href.split("#")[0] || "undefined",
  },
);

export const AutodartsToolsCricketClosedPoints: WxtStorageItem<number[], any> = storage.defineItem(
  "local:cricketpointsstatus",
  {
    defaultValue: [],
  },
);

export const AutodartsToolsStreamingModeStatus: WxtStorageItem<boolean, any> = storage.defineItem(
  "local:streamingmodestatus",
  {
    defaultValue: false,
  },
);

/**
 * Map to track locks for each config key to prevent concurrent updates
 */
const configLocks = new Map<keyof IConfig, number>();

/**
 * Utility function to check if a config section has changed
 * @param currentConfigSection The current config section from storage
 * @param newConfigSection The new config section from the component
 * @returns boolean indicating if the config sections are different
 */
export function hasConfigChanged<T>(currentConfigSection: T, newConfigSection: T): boolean {
  return JSON.stringify(currentConfigSection) !== JSON.stringify(newConfigSection);
}

/**
 * Updates the config only if the specified section has changed
 * @param currentConfig The current config from storage
 * @param newConfig The new config from the component
 * @param configKey The key of the config section to check
 * @returns Promise<void>
 */
export async function updateConfigIfChanged<K extends keyof IConfig>(
  currentConfig: IConfig,
  newConfig: IConfig | undefined,
  configKey: K,
): Promise<void> {
  if (!newConfig) return;

  /**
   * This is needed because sometimes the config is updated multiple times in a row
   * because of updated hooks from input fields getting triggered.
   */
  // Check if this config key is currently locked
  const lockTime = configLocks.get(configKey);
  if (lockTime && Date.now() - lockTime < 100) {
    // Config is locked, skip update
    return;
  }

  // Set lock for this config key
  configLocks.set(configKey, Date.now());

  if (!hasConfigChanged(currentConfig[configKey], newConfig[configKey])) return;

  console.log("Autodarts Tools: Updating config", configKey, newConfig[configKey]);

  // Get the latest config to ensure we have the most up-to-date values
  const latestConfig = await AutodartsToolsConfig.getValue();

  // Only update the specific section that changed
  await AutodartsToolsConfig.setValue({
    ...latestConfig,
    [configKey]: JSON.parse(JSON.stringify(newConfig[configKey])),
  });
}
