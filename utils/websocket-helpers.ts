import { AutodartsToolsBoardData, type IBoard } from "./board-data-storage";
import { AutodartsToolsBoardImages } from "./board-image-storage";
import { AutodartsToolsGameData } from "./game-data-storage";
import { AutodartsToolsLobbyData } from "./lobby-data-storage";
import { AutodartsToolsTournamentData, type ITournament } from "./tournament-data-storage";

interface IUserSettings {
  callCheckouts: boolean;
  callScores: boolean;
  caller: string;
  callerEmotion: string;
  callerLanguage: string;
  callerVolume: number;
  countEachThrow: boolean;
  showAnimations: boolean;
  showChalkboard: boolean;
  showCheckoutGuide: boolean;
  showSeasonalEffects: boolean;
}

interface IUser {
  avatarUrl: string;
  average: number;
  averageUntil170: number;
  checkoutRate: number;
  country: string;
  first9Average: number;
  id: string;
  legsPlayed: number;
  name: string;
  total180s: number;
  tournament180s: number;
  tournamentAverage: number;
  tournamentAverageUntil170: number;
  tournamentWins: number;
  tournamentsPlayed: number;
  userSettings: IUserSettings;
}

export interface IPlayer {
  avatarUrl: string;
  boardId: string;
  boardName: string;
  cpuPPR: number | null;
  host: IUser;
  hostId: string;
  id: string;
  index: number;
  name: string;
  user: IUser;
  userId: string;
}

interface ILobbySettings {
  baseScore: number;
  bullMode: string;
  inMode: string;
  maxRounds: number;
  outMode: string;
}

export interface ILobbies {
  bullOffMode: "Off" | "Normal" | "Official";
  createdAt: string;
  host: IUser;
  id: string;
  isPrivate: boolean;
  maxPlayers: number;
  players: IPlayer[];
  settings: ILobbySettings;
  variant: "Bull-off" | "X01" | "Cricket" | "Bermuda" | "Shanghai" | "Gotcha" | "ATC" | "RTW" | "Random Checkout" | "CountUp" | "Segment Training" | "Bob's 27";
}

export interface IMatchSettings {
  mode: string;
  gameMode: string;
}

export interface ISegment {
  name: string;
  number: number;
  bed: string;
  multiplier: number;
}

export interface ICoords {
  x: number;
  y: number;
}

export interface IThrow {
  id: string;
  throw: number;
  createdAt: string;
  segment: ISegment;
  coords?: ICoords;
  entry: string;
  marks: any | null;
}

export interface ITurn {
  id: string;
  createdAt: string;
  finishedAt: string;
  round: number;
  turn: number;
  playerId: string;
  score: number;
  points: number;
  marks: any | null;
  busted: boolean;
  throws: IThrow[];
}

export interface IStats {
  segmentNumber?: number;
  bullDistance?: number;
  coords?: ICoords | null;
  average?: number;
  averageUntil170?: number;
  checkoutPercent?: number;
  checkoutPoints?: number;
  checkoutPointsAverage?: number;
  checkouts?: number;
  checkoutsHit?: number;
  dartsThrown?: number;
  dartsUntil170?: number;
  first9Average?: number;
  first9Score?: number;
  gameId?: string;
  less60?: number;
  playerId?: string;
  plus100?: number;
  plus140?: number;
  plus170?: number;
  plus60?: number;
  score?: number;
  scoreUntil170?: number;
  total180?: number;
}

export interface IPlayerStats {
  matchStats: IStats;
  setStats: IStats | null;
  legStats: IStats | null;
}

export interface IChalkboardRow {
  isPointsStruck: boolean;
  isScoreStruck: boolean;
  points: number;
  round: number;
  score: number;
}

export interface IChalkboard {
  rows: IChalkboardRow[];
}

export interface IScore {
  legs: number;
  sets: number;
}

export interface IX01Settings extends IMatchSettings {
  baseScore: number;
  bullMode: string;
  gameId: string;
  inMode: string;
  maxRounds: number;
  outMode: string;
}

export interface IMatch {
  body?: any;
  id: string;
  activated?: -1 | 0 | 1 | 2;
  createdAt: string;
  host: IUser;
  variant: string;
  settings: IX01Settings | IMatchSettings;
  players: IPlayer[];
  scores: IScore[] | null;
  type: string;
  set: number;
  leg: number;
  sets?: number;
  legs?: number;
  finished: boolean;
  winner: number;
  turns: ITurn[];
  round: number;
  player: number;
  turnScore: number;
  turnBusted: boolean;
  gameScores: number[];
  gameFinished: boolean;
  gameWinner: number;
  stats: IPlayerStats[];
  state: Record<string, any>;
  chalkboards?: IChalkboard[];
}

export async function processWebSocketMessage(channel: string, data: ILobbies | IMatch | IBoard | ITournament | string) {
  // do a switch on the channel
  switch (channel) {
    case "autodarts.lobbies": {
      data = data as ILobbies;
      const id = window.location.href.match(/lobbies\/([0-9a-f-]+)/)?.[1];
      if (id !== data.id) return;

      AutodartsToolsLobbyData.setValue(data as ILobbies);

      break;
    }
    case "autodarts.matches": {
      data = data as IMatch;
      if (data.body) return;

      const id = window.location.href.match(/matches\/([0-9a-f-]+)/)?.[1];
      const playersBoard = data.players?.find(player => player.boardId === window.location.href.match(/boards\/([0-9a-f-]+)/)?.[1]);
      if ((id !== data.id && !playersBoard) && (data as IMatch).activated === undefined) return;

      const gameData = await AutodartsToolsGameData.getValue();
      if ((data as IMatch).activated !== undefined) {
        // Merge activated state with existing match data
        AutodartsToolsGameData.setValue({
          ...gameData,
          match: gameData.match
            ? {
                ...gameData.match,
                activated: (data as IMatch).activated,
              }
            : {
                ...data as IMatch,
              },
        });
      } else {
        // Replace entire match data
        AutodartsToolsGameData.setValue({
          ...gameData,
          match: data as IMatch,
        });
      }

      break;
    }
    case "autodarts.boards": {
      data = data as IBoard;
      const boardData = await AutodartsToolsBoardData.getValue();

      AutodartsToolsBoardData.setValue({
        ...boardData,
        ...data,
      });

      break;
    }
    case "autodarts.boards.images": {
      data = data as string;
      const boardImages = await AutodartsToolsBoardImages.getValue();

      boardImages.images.push(data as string);
      while (boardImages.images.length > 6) {
        boardImages.images.shift();
      }
      AutodartsToolsBoardImages.setValue(boardImages);

      break;
    }
    case "autodarts.tournaments": {
      data = data as ITournament;

      AutodartsToolsTournamentData.setValue(data);

      break;
    }
    default: {
      console.log("Unknown channel", channel);
      // console.log(data);

      break;
    }
  }
}
