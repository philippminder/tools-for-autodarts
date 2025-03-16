import type { WxtStorageItem } from "wxt/storage";
import { storage } from "wxt/storage";

// Add type declaration for import.meta.env
declare global {
  interface ImportMeta {
    env: {
      DEV: boolean;
      VITE_PRIVATE_CALLER?: string;
      [key: string]: any;
    };
  }
}

export interface TCaller {
  name?: string;
  url: string;
  fileExt?: string;
  isActive?: boolean;
};

export interface ICallerConfig {
  caller: TCaller[];
}

// Safely access environment variables
const privateCaller = (typeof import.meta.env !== "undefined"
                      && import.meta.env.DEV
                      && import.meta.env.VITE_PRIVATE_CALLER)
  ? JSON.parse(import.meta.env.VITE_PRIVATE_CALLER).privateCaller || []
  : [];

// console.log("privateCaller", privateCaller);
export const defaultCallerConfig: ICallerConfig = {
  caller: [ ...[
    {
      name: "Male eng",
      url: "https://autodarts.x10.mx/1_male_eng",
      fileExt: ".mp3",
      isActive: true,
    },
  ], ...privateCaller ],
};

export const AutodartsToolsCallerConfig: WxtStorageItem<ICallerConfig, any> = storage.defineItem(
  "local:callerconfig",
  {
    defaultValue: defaultCallerConfig,
  },
);
