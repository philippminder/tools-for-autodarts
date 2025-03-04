import type { WxtStorageItem } from "wxt/storage";
import { storage } from "wxt/storage";

export interface IAnimationsConfig {
  startDelay?: Number;
  endDelay?: Number;
  winner: { data?: string; info: string }[];
  bull: { data?: string; info: string }[];
  oneEighty: { data?: string; info: string }[];
  miss: { data?: string; info: string }[];
  bust: { data?: string; info: string }[];
}

export const defaultAnimationsConfig: IAnimationsConfig = {
  startDelay: 1,
  endDelay: 4,
  winner: [
    { info: "https://media1.tenor.com/m/uhkDiMdcP44AAAAd/rapid-darts-darts.gif" },
    { info: "https://media1.tenor.com/m/QriSf7Rc78cAAAAd/darts-niner.gif" },
    { info: "https://media.tenor.com/VGyxDGucFyAAAAAM/dancing-bubbly.gif" },
    { info: "https://media1.tenor.com/m/2SQcMaUE_D8AAAAd/celebrate-winner.gif" },
  ],
  bull: [ 
    { info: "https://media1.tenor.com/m/HhqlzHe8tXsAAAAd/bulls-eye-anderson.gif" },
    { info: "https://media1.tenor.com/m/Oqlecl-G3xAAAAAd/simon-whitlock-darts-bull.gif" },
    { info: "https://media1.tenor.com/m/pJJbIyu-Bf0AAAAd/tony-o-shea-tony.gif" },
    { info: "https://media.tenor.com/G4cRydvvtU4AAAAM/ted-hankey-darts.gif" },
  ],
  oneEighty: [
    { info: "https://media1.tenor.com/m/bYQ_X5uvRrIAAAAd/gerwyn-price-darts.gif" },
    { info: "https://media1.tenor.com/m/lTiUQMnV_qQAAAAC/gerwynprice-darts.gif" },
    { info: "https://media.tenor.com/xFkVft-1xMQAAAAM/gerwyn-price-darts.gif" },
    { info: "https://media.tenor.com/uL_HJCSQfkIAAAAM/throw-toss.gif" },
  ],
  miss: [
    { info: "https://media1.tenor.com/m/psyC1iEr058AAAAd/bulls-eye-animation.gif" },
    { info: "https://media1.tenor.com/m/x715u156Jz4AAAAd/bbc-america-darts-bbca.gif" },
    { info: "https://media.tenor.com/sbknQ0awa2sAAAAM/bbc-america-darts-bbca.gif" },
    { info: "https://media.tenor.com/kD_PH0LHaHEAAAAM/sigh-growl.gif" },
  ],
  bust: [
    { info: "https://media1.tenor.com/m/jaqTZHiIA7EAAAAd/james-wade-darts.gif" },
    { info: "https://media.tenor.com/LU60882wezcAAAAM/fallon-sherrock-sports.gif" },
    { info: "https://media.tenor.com/Rpa8qRNWZ3UAAAAM/glen-durrant-miss.gif" },
    { info: "https://media.tenor.com/tfkMfGGbcLoAAAAM/bbc-america-darts-bbca.gif" },
  ],
};

export const AutodartsToolsAnimationsConfig: WxtStorageItem<IAnimationsConfig, any> = storage.defineItem(
  "local:animationsconfig",
  {
    defaultValue: defaultAnimationsConfig,
  },
);