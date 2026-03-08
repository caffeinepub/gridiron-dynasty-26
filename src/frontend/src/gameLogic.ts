import type {
  CardRarity,
  DriveState,
  PackTier,
  PlayResult,
  Player,
  PlayerCard,
  PlayoffMatchup,
  PlayoffState,
  Team,
} from "./types";

// Seeded PRNG
let seed = Date.now();
function rand(max: number): number {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return Math.abs(seed) % max;
}

function randFloat(): number {
  return rand(10000) / 10000;
}

function randRange(min: number, max: number): number {
  return min + rand(max - min + 1);
}

// 16 AI teams
export const AI_TEAMS: Team[] = [
  {
    id: 1,
    name: "Ironclads",
    city: "Chicago",
    abbreviation: "CHI",
    primaryColor: "#C41E3A",
    secondaryColor: "#1B1B2F",
    wins: 0,
    losses: 0,
    isUserTeam: false,
  },
  {
    id: 2,
    name: "Thunderhawks",
    city: "Denver",
    abbreviation: "DEN",
    primaryColor: "#FF6B35",
    secondaryColor: "#1A237E",
    wins: 0,
    losses: 0,
    isUserTeam: false,
  },
  {
    id: 3,
    name: "Stormbreakers",
    city: "Dallas",
    abbreviation: "DAL",
    primaryColor: "#0D47A1",
    secondaryColor: "#C0C0C0",
    wins: 0,
    losses: 0,
    isUserTeam: false,
  },
  {
    id: 4,
    name: "Warlords",
    city: "Miami",
    abbreviation: "MIA",
    primaryColor: "#006A4E",
    secondaryColor: "#FF8C00",
    wins: 0,
    losses: 0,
    isUserTeam: false,
  },
  {
    id: 5,
    name: "Blazecats",
    city: "Atlanta",
    abbreviation: "ATL",
    primaryColor: "#B71C1C",
    secondaryColor: "#212121",
    wins: 0,
    losses: 0,
    isUserTeam: false,
  },
  {
    id: 6,
    name: "Wolfpack",
    city: "Seattle",
    abbreviation: "SEA",
    primaryColor: "#1B5E20",
    secondaryColor: "#0D47A1",
    wins: 0,
    losses: 0,
    isUserTeam: false,
  },
  {
    id: 7,
    name: "Vipers",
    city: "Phoenix",
    abbreviation: "PHX",
    primaryColor: "#E65100",
    secondaryColor: "#311B92",
    wins: 0,
    losses: 0,
    isUserTeam: false,
  },
  {
    id: 8,
    name: "Titans",
    city: "Nashville",
    abbreviation: "NSH",
    primaryColor: "#1565C0",
    secondaryColor: "#C8A000",
    wins: 0,
    losses: 0,
    isUserTeam: false,
  },
  {
    id: 9,
    name: "Renegades",
    city: "Las Vegas",
    abbreviation: "LVG",
    primaryColor: "#212121",
    secondaryColor: "#CFB53B",
    wins: 0,
    losses: 0,
    isUserTeam: false,
  },
  {
    id: 10,
    name: "Cyclones",
    city: "Kansas City",
    abbreviation: "KCY",
    primaryColor: "#B71C1C",
    secondaryColor: "#FFD700",
    wins: 0,
    losses: 0,
    isUserTeam: false,
  },
  {
    id: 11,
    name: "Mavericks",
    city: "San Antonio",
    abbreviation: "SAT",
    primaryColor: "#4A148C",
    secondaryColor: "#FF6F00",
    wins: 0,
    losses: 0,
    isUserTeam: false,
  },
  {
    id: 12,
    name: "Glaciers",
    city: "Minneapolis",
    abbreviation: "MIN",
    primaryColor: "#0D47A1",
    secondaryColor: "#FFD600",
    wins: 0,
    losses: 0,
    isUserTeam: false,
  },
  {
    id: 13,
    name: "Cobras",
    city: "New Orleans",
    abbreviation: "NOR",
    primaryColor: "#1A237E",
    secondaryColor: "#D4AF37",
    wins: 0,
    losses: 0,
    isUserTeam: false,
  },
  {
    id: 14,
    name: "Phantoms",
    city: "Pittsburgh",
    abbreviation: "PIT",
    primaryColor: "#212121",
    secondaryColor: "#FFD700",
    wins: 0,
    losses: 0,
    isUserTeam: false,
  },
  {
    id: 15,
    name: "Condors",
    city: "Los Angeles",
    abbreviation: "LAC",
    primaryColor: "#1565C0",
    secondaryColor: "#FFA000",
    wins: 0,
    losses: 0,
    isUserTeam: false,
  },
  {
    id: 16,
    name: "Predators",
    city: "Jacksonville",
    abbreviation: "JAX",
    primaryColor: "#006064",
    secondaryColor: "#D4AF37",
    wins: 0,
    losses: 0,
    isUserTeam: false,
  },
];

const FIRST_NAMES = [
  "Marcus",
  "Darius",
  "Jamal",
  "Tyrone",
  "Devon",
  "Khalil",
  "Andre",
  "Brandon",
  "Corey",
  "Elijah",
  "Fredrick",
  "Garrett",
  "Hunter",
  "Isaiah",
  "Jordan",
  "Kevin",
  "Lance",
  "Mason",
  "Nathan",
  "Omar",
  "Patrick",
  "Quinn",
  "Rashad",
  "Sterling",
  "Trevor",
  "Umar",
  "Victor",
  "Wesley",
  "Xavier",
  "Zach",
  "Aaron",
  "Blake",
  "Carlos",
  "Derek",
  "Evan",
  "Frank",
  "Grant",
  "Henry",
  "Ivan",
  "James",
  "Kyle",
  "Logan",
  "Miguel",
  "Noah",
  "Oscar",
  "Paul",
  "Ray",
  "Sean",
  "Trent",
];

const LAST_NAMES = [
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Wilson",
  "Taylor",
  "Anderson",
  "Thomas",
  "Jackson",
  "White",
  "Harris",
  "Martin",
  "Thompson",
  "Moore",
  "Young",
  "Allen",
  "Scott",
  "Hall",
  "Adams",
  "Hill",
  "Baker",
  "Carter",
  "Mitchell",
  "Nelson",
  "Roberts",
  "Turner",
  "Phillips",
  "Campbell",
  "Parker",
  "Evans",
  "Edwards",
  "Collins",
  "Stewart",
  "Morris",
  "Rogers",
  "Reed",
  "Cook",
  "Morgan",
  "Bell",
  "Murphy",
  "Bailey",
  "Rivera",
  "Cooper",
  "Richardson",
  "Cox",
  "Ward",
  "Torres",
  "Peterson",
  "Gray",
  "Ramirez",
  "James",
  "Watson",
  "Brooks",
];

function randomName(): string {
  const f = FIRST_NAMES[rand(FIRST_NAMES.length)];
  const l = LAST_NAMES[rand(LAST_NAMES.length)];
  return `${f} ${l}`;
}

const ROSTER_TEMPLATE = [
  { position: "QB", count: 2 },
  { position: "RB", count: 3 },
  { position: "WR", count: 4 },
  { position: "TE", count: 2 },
  { position: "OL", count: 4 },
  { position: "DL", count: 3 },
  { position: "LB", count: 3 },
  { position: "CB", count: 3 },
  { position: "S", count: 2 },
  { position: "K", count: 1 },
];

export function generateRoster(teamId: number): Player[] {
  const players: Player[] = [];
  let idCounter = teamId * 1000;

  for (const { position, count } of ROSTER_TEMPLATE) {
    for (let i = 0; i < count; i++) {
      const overall = randRange(65, 95);
      const variance = () =>
        Math.max(50, Math.min(99, overall + randRange(-10, 10)));
      players.push({
        id: idCounter++,
        name: randomName(),
        position,
        overall,
        speed: variance(),
        strength: variance(),
        awareness: variance(),
        teamId,
      });
    }
  }

  return players;
}

export function callPlay(
  playType: "runLeft" | "runRight" | "passShort" | "passDeep",
): PlayResult {
  const roll = randFloat();

  if (playType === "runLeft" || playType === "runRight") {
    const dir = playType === "runLeft" ? "left" : "right";
    if (roll < 0.05) {
      return {
        yardsGained: 0,
        isTouchdown: false,
        isInterception: false,
        isFumble: true,
        description: `FUMBLE! Stripped on the run ${dir}.`,
      };
    }
    if (roll < 0.2) {
      const loss = -randRange(1, 3);
      return {
        yardsGained: loss,
        isTouchdown: false,
        isInterception: false,
        isFumble: false,
        description: `Run ${dir} for ${loss} yards. Stopped for a loss.`,
      };
    }
    if (roll < 0.7) {
      const gain = randRange(1, 5);
      return {
        yardsGained: gain,
        isTouchdown: false,
        isInterception: false,
        isFumble: false,
        description: `Run ${dir} for ${gain} yards.`,
      };
    }
    if (roll < 0.9) {
      const gain = randRange(6, 9);
      return {
        yardsGained: gain,
        isTouchdown: false,
        isInterception: false,
        isFumble: false,
        description: `Run ${dir} for ${gain} yards! Nice pickup!`,
      };
    }
    const bigGain = randRange(10, 20);
    return {
      yardsGained: bigGain,
      isTouchdown: false,
      isInterception: false,
      isFumble: false,
      description: `BIG RUN ${dir} for ${bigGain} yards!`,
    };
  }

  if (playType === "passShort") {
    if (roll < 0.05) {
      return {
        yardsGained: 0,
        isTouchdown: false,
        isInterception: true,
        isFumble: false,
        description: "INTERCEPTION! Pass picked off short.",
      };
    }
    if (roll < 0.3) {
      return {
        yardsGained: 0,
        isTouchdown: false,
        isInterception: false,
        isFumble: false,
        description: "Incomplete pass. Thrown away.",
      };
    }
    if (roll < 0.75) {
      const gain = randRange(5, 12);
      return {
        yardsGained: gain,
        isTouchdown: false,
        isInterception: false,
        isFumble: false,
        description: `Short completion for ${gain} yards.`,
      };
    }
    const gain = randRange(13, 18);
    return {
      yardsGained: gain,
      isTouchdown: false,
      isInterception: false,
      isFumble: false,
      description: `Pass complete for ${gain} yards! First down!`,
    };
  }

  // passDeep
  if (roll < 0.1) {
    return {
      yardsGained: 0,
      isTouchdown: false,
      isInterception: true,
      isFumble: false,
      description: "INTERCEPTION! Deep ball picked off!",
    };
  }
  if (roll < 0.55) {
    return {
      yardsGained: 0,
      isTouchdown: false,
      isInterception: false,
      isFumble: false,
      description: "Incomplete. Deep pass falls incomplete.",
    };
  }
  if (roll < 0.85) {
    const gain = randRange(18, 28);
    return {
      yardsGained: gain,
      isTouchdown: false,
      isInterception: false,
      isFumble: false,
      description: `Deep completion for ${gain} yards!`,
    };
  }
  const deepGain = randRange(30, 45);
  return {
    yardsGained: deepGain,
    isTouchdown: false,
    isInterception: false,
    isFumble: false,
    description: `BOMB! Deep catch for ${deepGain} yards!`,
  };
}

export function advanceDrive(
  state: DriveState,
  result: PlayResult,
): DriveState {
  const next = { ...state, playHistory: [...state.playHistory] };
  next.playsRun += 1;

  // Increment quarter every 15 plays
  if (next.playsRun % 15 === 0 && next.playsRun > 0) {
    next.quarter = Math.min(next.quarter + 1, 4);
  }

  if (result.isTouchdown) {
    next.userScore += 7;
    next.playHistory = [
      `Q${next.quarter}: TOUCHDOWN! +7`,
      ...next.playHistory.slice(0, 9),
    ];
    // Reset drive
    next.down = 1;
    next.yardsToGo = 10;
    next.fieldPosition = 20;
    if (next.playsRun >= 60 || next.quarter >= 4) {
      next.isGameOver = true;
    }
    return next;
  }

  if (result.isInterception || result.isFumble) {
    const turnoverType = result.isInterception ? "INT" : "FUM";
    // CPU scores on turnover
    const cpuRoll = randFloat();
    let cpuPts = 0;
    if (cpuRoll < 0.35) {
      cpuPts = 7;
    } else if (cpuRoll < 0.6) {
      cpuPts = 3;
    }
    next.opponentScore += cpuPts;
    const cpuDesc = cpuPts > 0 ? ` CPU scores ${cpuPts}!` : " CPU punts.";
    next.playHistory = [
      `Q${next.quarter}: ${turnoverType} - turnover!${cpuDesc}`,
      ...next.playHistory.slice(0, 9),
    ];
    // Reset drive
    next.down = 1;
    next.yardsToGo = 10;
    next.fieldPosition = 20;
    if (next.playsRun >= 60 || next.quarter >= 4) {
      next.isGameOver = true;
    }
    return next;
  }

  // Determine if this play is a touchdown based on field position
  const newFieldPosition = next.fieldPosition + result.yardsGained;
  if (newFieldPosition >= 100) {
    next.userScore += 7;
    next.playHistory = [
      `Q${next.quarter}: TOUCHDOWN! ${result.description}`,
      ...next.playHistory.slice(0, 9),
    ];
    next.down = 1;
    next.yardsToGo = 10;
    next.fieldPosition = 20;
    if (next.playsRun >= 60 || next.quarter >= 4) {
      next.isGameOver = true;
    }
    return next;
  }

  next.playHistory = [
    `Q${next.quarter}: ${result.description}`,
    ...next.playHistory.slice(0, 9),
  ];

  if (result.yardsGained <= 0) {
    // Loss or incomplete
    next.down += 1;
  } else {
    next.fieldPosition = newFieldPosition;
    next.yardsToGo -= result.yardsGained;

    if (next.yardsToGo <= 0) {
      // First down!
      next.down = 1;
      next.yardsToGo = 10;
    } else {
      next.down += 1;
    }
  }

  // Turnover on downs
  if (next.down > 4) {
    const cpuRoll = randFloat();
    let cpuPts = 0;
    if (cpuRoll < 0.4) {
      cpuPts = 7;
    } else if (cpuRoll < 0.7) {
      cpuPts = 3;
    }
    next.opponentScore += cpuPts;
    const cpuDesc = cpuPts > 0 ? ` CPU scores ${cpuPts}!` : " CPU punts.";
    next.playHistory = [
      `Q${next.quarter}: Turnover on downs!${cpuDesc}`,
      ...next.playHistory.slice(0, 9),
    ];
    next.down = 1;
    next.yardsToGo = 10;
    next.fieldPosition = 20;
  }

  if (next.playsRun >= 60 || next.quarter >= 4) {
    next.isGameOver = true;
  }

  return next;
}

export function simulateFullGame(): {
  userScore: number;
  opponentScore: number;
  userWon: boolean;
} {
  const userScore = randRange(7, 45);
  const opponentScore = randRange(7, 45);
  return {
    userScore,
    opponentScore,
    userWon: userScore > opponentScore,
  };
}

export function createInitialDriveState(opponentTeamId: number): DriveState {
  return {
    down: 1,
    yardsToGo: 10,
    fieldPosition: 20,
    userScore: 0,
    opponentScore: 0,
    quarter: 1,
    playsRun: 0,
    isActive: true,
    opponentTeamId,
    playHistory: [],
    isGameOver: false,
  };
}

// ─── Phase 2: Card Packs ──────────────────────────────────────────────────────

const POSITIONS = ["QB", "RB", "WR", "TE", "OL", "DL", "LB", "CB", "S", "K"];

let cardIdCounter = 100000;

export function openCardPack(tier: PackTier): PlayerCard[] {
  const cards: PlayerCard[] = [];

  const config: {
    count: number;
    maxOvr: number;
    rarityWeights: [CardRarity, number][];
  } =
    tier === "bronze"
      ? {
          count: 3,
          maxOvr: 79,
          rarityWeights: [
            ["Common", 0.75],
            ["Rare", 0.22],
            ["Elite", 0.03],
          ],
        }
      : tier === "silver"
        ? {
            count: 4,
            maxOvr: 87,
            rarityWeights: [
              ["Common", 0.45],
              ["Rare", 0.42],
              ["Elite", 0.13],
            ],
          }
        : {
            count: 5,
            maxOvr: 95,
            rarityWeights: [
              ["Common", 0.1],
              ["Rare", 0.55],
              ["Elite", 0.35],
            ],
          };

  const minOvr = tier === "bronze" ? 65 : tier === "silver" ? 72 : 80;

  for (let i = 0; i < config.count; i++) {
    const roll = randFloat();
    let rarity: CardRarity = "Common";
    let cumulative = 0;
    for (const [r, weight] of config.rarityWeights) {
      cumulative += weight;
      if (roll <= cumulative) {
        rarity = r;
        break;
      }
    }

    const rarityBonus = rarity === "Elite" ? 8 : rarity === "Rare" ? 4 : 0;
    const overall = Math.min(
      config.maxOvr,
      randRange(minOvr, config.maxOvr - 3) + rarityBonus,
    );
    const variance = () =>
      Math.max(50, Math.min(99, overall + randRange(-8, 8)));

    cards.push({
      id: cardIdCounter++,
      name: randomName(),
      position: POSITIONS[rand(POSITIONS.length)],
      overall,
      rarity,
      speed: variance(),
      strength: variance(),
      awareness: variance(),
    });
  }

  return cards;
}

export function getUpgradeCost(currentOverall: number): number {
  if (currentOverall >= 90) return 400;
  if (currentOverall >= 85) return 250;
  if (currentOverall >= 80) return 150;
  if (currentOverall >= 75) return 100;
  return 50;
}

// ─── Phase 2: Playoffs ────────────────────────────────────────────────────────

export function generatePlayoffBracket(
  userTeamId: number,
  aiTeams: Team[],
): PlayoffState {
  // Simulate random 8-game records for AI teams and pick top 3
  const aiWithRecords = aiTeams.map((team) => ({
    ...team,
    simWins: randRange(0, 8),
  }));
  aiWithRecords.sort((a, b) => b.simWins - a.simWins);
  const top3 = aiWithRecords.slice(0, 3);

  // Seeds: 1=user, 2=top AI, 3=second AI, 4=third AI
  const seed2 = top3[0].id;
  const seed3 = top3[1].id;
  const seed4 = top3[2].id;

  const matchups: PlayoffMatchup[] = [
    {
      id: 1,
      round: "semis",
      teamAId: userTeamId, // seed 1
      teamBId: seed4, // seed 4
      teamAScore: 0,
      teamBScore: 0,
      winnerId: null,
      isPlayed: false,
    },
    {
      id: 2,
      round: "semis",
      teamAId: seed2, // seed 2
      teamBId: seed3, // seed 3
      teamAScore: 0,
      teamBScore: 0,
      winnerId: null,
      isPlayed: false,
    },
    {
      id: 3,
      round: "championship",
      teamAId: null, // TBD: winner of matchup 1
      teamBId: null, // TBD: winner of matchup 2
      teamAScore: 0,
      teamBScore: 0,
      winnerId: null,
      isPlayed: false,
    },
  ];

  return {
    matchups,
    championId: null,
    isComplete: false,
  };
}

export function simulatePlayoffGame(): {
  homeScore: number;
  awayScore: number;
} {
  return {
    homeScore: randRange(7, 42),
    awayScore: randRange(7, 42),
  };
}
