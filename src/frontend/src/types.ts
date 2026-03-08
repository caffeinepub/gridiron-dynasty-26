export type Player = {
  id: number;
  name: string;
  position: string; // QB, RB, WR, TE, OL, DL, LB, CB, S, K
  overall: number; // 65-95
  speed: number;
  strength: number;
  awareness: number;
  teamId: number;
};

export type Team = {
  id: number;
  name: string;
  city: string;
  abbreviation: string;
  primaryColor: string;
  secondaryColor: string;
  wins: number;
  losses: number;
  isUserTeam: boolean;
};

export type ScheduledGame = {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
  week: number;
  isPlayed: boolean;
};

export type PlayResult = {
  yardsGained: number;
  isTouchdown: boolean;
  isInterception: boolean;
  isFumble: boolean;
  description: string;
};

export type DriveState = {
  down: number;
  yardsToGo: number;
  fieldPosition: number; // 0-100, user's yardline
  userScore: number;
  opponentScore: number;
  quarter: number;
  playsRun: number;
  isActive: boolean;
  opponentTeamId: number;
  playHistory: string[];
  isGameOver: boolean;
};

export type PackTier = "bronze" | "silver" | "gold";

export type CardRarity = "Common" | "Rare" | "Elite";

export type PlayerCard = {
  id: number;
  name: string;
  position: string;
  overall: number;
  rarity: CardRarity;
  speed: number;
  strength: number;
  awareness: number;
};

export type PlayoffMatchup = {
  id: number;
  round: "semis" | "championship";
  teamAId: number | null;
  teamBId: number | null;
  teamAScore: number;
  teamBScore: number;
  winnerId: number | null;
  isPlayed: boolean;
};

export type PlayoffState = {
  matchups: PlayoffMatchup[];
  championId: number | null;
  isComplete: boolean;
};

export type GameState = {
  userTeam: Team | null;
  userRoster: Player[];
  schedule: ScheduledGame[];
  driveState: DriveState | null;
  coins: number;
  collectedCards: PlayerCard[];
  playoffState: PlayoffState | null;
};
