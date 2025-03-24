import type { WxtStorageItem } from "wxt/storage";
import { storage } from "wxt/storage";
import type { ILobbies } from "./websocket-helpers";

export const AutodartsToolsLobbyData: WxtStorageItem<ILobbies | undefined, any> = storage.defineItem(
  "local:lobby-data",
  {
    defaultValue: undefined,
  },
);
