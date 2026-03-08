import { Toaster } from "@/components/ui/sonner";
import {
  Calendar,
  Home,
  List,
  Package,
  PlayCircle,
  Trophy,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { TEAM_LOGOS } from "./assets";
import {
  AI_TEAMS,
  generatePlayoffBracket,
  generateRoster,
  getUpgradeCost,
  simulateFullGame,
  simulatePlayoffGame,
} from "./gameLogic";
import CardPacksPage from "./pages/CardPacksPage";
import HomePage from "./pages/HomePage";
import PlayPage from "./pages/PlayPage";
import PlayoffPage from "./pages/PlayoffPage";
import RosterPage from "./pages/RosterPage";
import SeasonPage from "./pages/SeasonPage";
import TeamPage from "./pages/TeamPage";
import TeamSetupPage from "./pages/TeamSetupPage";
import type {
  DriveState,
  GameState,
  PackTier,
  PlayerCard,
  ScheduledGame,
  Team,
} from "./types";

const STORAGE_KEY = "gridiron_dynasty_26";

type Page =
  | "home"
  | "team"
  | "roster"
  | "season"
  | "play"
  | "packs"
  | "playoffs";

const NAV_ITEMS: {
  id: Page;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "team", label: "Team", icon: Users },
  { id: "roster", label: "Roster", icon: List },
  { id: "season", label: "Season", icon: Calendar },
  { id: "play", label: "Play", icon: PlayCircle },
  { id: "packs", label: "Packs", icon: Package },
  { id: "playoffs", label: "Playoffs", icon: Trophy },
];

function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GameState>;
      // Ensure new fields exist for existing saves
      return {
        userTeam: null,
        userRoster: [],
        schedule: [],
        driveState: null,
        coins: 200,
        collectedCards: [],
        playoffState: null,
        ...parsed,
      } as GameState;
    }
  } catch {
    // ignore
  }
  return {
    userTeam: null,
    userRoster: [],
    schedule: [],
    driveState: null,
    coins: 200,
    collectedCards: [],
    playoffState: null,
  };
}

function saveState(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function createSchedule(userTeamId: number): ScheduledGame[] {
  // Use all 16 AI teams for weeks 1-16, then add a random rematch for week 17
  const shuffled = [...AI_TEAMS].sort(() => Math.random() - 0.5);
  const week17Opp = shuffled[Math.floor(Math.random() * shuffled.length)];
  const allOpponents = [...shuffled, week17Opp];
  return allOpponents.map((opp, idx) => ({
    id: idx + 1,
    homeTeamId: idx % 2 === 0 ? userTeamId : opp.id,
    awayTeamId: idx % 2 === 0 ? opp.id : userTeamId,
    homeScore: 0,
    awayScore: 0,
    week: idx + 1,
    isPlayed: false,
  }));
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => loadState());
  const [currentPage, setCurrentPage] = useState<Page>("home");

  useEffect(() => {
    saveState(gameState);
  }, [gameState]);

  const updateState = useCallback((patch: Partial<GameState>) => {
    setGameState((prev) => ({ ...prev, ...patch }));
  }, []);

  function handleTeamCreated(team: Team) {
    const roster = generateRoster(0);
    const schedule = createSchedule(team.id);
    updateState({
      userTeam: team,
      userRoster: roster,
      schedule,
      driveState: null,
      coins: 200,
      collectedCards: [],
      playoffState: null,
    });
    setCurrentPage("home");
  }

  function handleUpdateTeam(team: Team) {
    updateState({ userTeam: team });
  }

  function handleSimulateGame() {
    const { userTeam, schedule, coins } = gameState;
    if (!userTeam) return;
    const nextGame = schedule.find((g) => !g.isPlayed);
    if (!nextGame) {
      toast.info("No more games to simulate!");
      return;
    }
    const result = simulateFullGame();
    const isHome = nextGame.homeTeamId === userTeam.id;
    const updatedGame: ScheduledGame = {
      ...nextGame,
      homeScore: isHome ? result.userScore : result.opponentScore,
      awayScore: isHome ? result.opponentScore : result.userScore,
      isPlayed: true,
    };
    const updatedSchedule = schedule.map((g) =>
      g.id === nextGame.id ? updatedGame : g,
    );
    const updatedTeam: Team = {
      ...userTeam,
      wins: userTeam.wins + (result.userWon ? 1 : 0),
      losses: userTeam.losses + (result.userWon ? 0 : 1),
    };
    const coinReward = result.userWon ? 50 : 25;
    updateState({
      schedule: updatedSchedule,
      userTeam: updatedTeam,
      coins: coins + coinReward,
    });
    const oppId = isHome ? nextGame.awayTeamId : nextGame.homeTeamId;
    const opponent = AI_TEAMS.find((t) => t.id === oppId);
    const scoreStr = `${result.userScore}–${result.opponentScore}`;
    if (result.userWon) {
      toast.success(`W vs ${opponent?.name} ${scoreStr}! +${coinReward} coins`);
    } else {
      toast.error(`L vs ${opponent?.name} ${scoreStr}. +${coinReward} coins`);
    }
  }

  function handlePlayNextGame() {
    setCurrentPage("play");
  }

  function handleGameSaved(
    opponentId: number,
    userScore: number,
    oppScore: number,
    userWon: boolean,
  ) {
    const { userTeam, schedule, coins } = gameState;
    if (!userTeam) return;
    // Find the game matching opponent
    const gameToUpdate =
      schedule.find((g) => {
        const oppInGame =
          g.homeTeamId === userTeam.id ? g.awayTeamId : g.homeTeamId;
        return oppInGame === opponentId && !g.isPlayed;
      }) ?? schedule.find((g) => !g.isPlayed);

    if (!gameToUpdate) {
      toast.error("No matching game found in schedule.");
      return;
    }
    const isHome = gameToUpdate.homeTeamId === userTeam.id;
    const updatedGame: ScheduledGame = {
      ...gameToUpdate,
      homeScore: isHome ? userScore : oppScore,
      awayScore: isHome ? oppScore : userScore,
      isPlayed: true,
    };
    const updatedSchedule = schedule.map((g) =>
      g.id === gameToUpdate.id ? updatedGame : g,
    );
    const updatedTeam: Team = {
      ...userTeam,
      wins: userTeam.wins + (userWon ? 1 : 0),
      losses: userTeam.losses + (userWon ? 0 : 1),
    };
    const coinReward = userWon ? 50 : 25;
    updateState({
      schedule: updatedSchedule,
      userTeam: updatedTeam,
      driveState: null,
      coins: coins + coinReward,
    });
    toast.success(`+${coinReward} coins earned!`);
  }

  function handleOpenPack(tier: PackTier, cards: PlayerCard[]) {
    const PACK_COSTS: Record<PackTier, number> = {
      bronze: 100,
      silver: 300,
      gold: 600,
    };
    const cost = PACK_COSTS[tier];
    const { coins, collectedCards, userRoster } = gameState;
    if (coins < cost) {
      toast.error("Not enough coins!");
      return;
    }
    // Convert PlayerCards to Players and add to roster
    const newPlayers = cards.map((card) => ({
      id: card.id,
      name: card.name,
      position: card.position,
      overall: card.overall,
      speed: card.speed,
      strength: card.strength,
      awareness: card.awareness,
      teamId: 0,
    }));
    updateState({
      coins: coins - cost,
      collectedCards: [...collectedCards, ...cards],
      userRoster: [...userRoster, ...newPlayers],
    });
    const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
    toast.success(`${tierLabel} Pack opened! ${cards.length} players added.`);
  }

  function handleUpgradePlayer(playerId: number) {
    const { userRoster, coins } = gameState;
    const player = userRoster.find((p) => p.id === playerId);
    if (!player) return;
    const cost = getUpgradeCost(player.overall);
    if (coins < cost) {
      toast.error("Not enough coins!");
      return;
    }
    if (player.overall >= 99) {
      toast.info("Player is already at max overall!");
      return;
    }
    const updatedRoster = userRoster.map((p) =>
      p.id === playerId ? { ...p, overall: p.overall + 1 } : p,
    );
    updateState({ userRoster: updatedRoster, coins: coins - cost });
    toast.success(`${player.name} upgraded to ${player.overall + 1} OVR!`);
  }

  function handleStartPlayoffs() {
    const { userTeam } = gameState;
    if (!userTeam) return;
    const playoffState = generatePlayoffBracket(userTeam.id, AI_TEAMS);
    updateState({ playoffState });
    setCurrentPage("playoffs");
    toast.success("Playoffs bracket generated!");
  }

  function handleSimulateMatchup(matchupId: number) {
    const { playoffState, userTeam } = gameState;
    if (!playoffState || !userTeam) return;

    const matchup = playoffState.matchups.find((m) => m.id === matchupId);
    if (!matchup || matchup.isPlayed || !matchup.teamAId || !matchup.teamBId)
      return;

    const result = simulatePlayoffGame();
    const winnerId =
      result.homeScore >= result.awayScore ? matchup.teamAId : matchup.teamBId;

    const updatedMatchups = playoffState.matchups.map((m) => {
      if (m.id === matchupId) {
        return {
          ...m,
          teamAScore: result.homeScore,
          teamBScore: result.awayScore,
          winnerId,
          isPlayed: true,
        };
      }
      // Advance winners to championship
      if (m.id === 3) {
        const updatedChamp = { ...m };
        if (matchupId === 1) updatedChamp.teamAId = winnerId;
        if (matchupId === 2) updatedChamp.teamBId = winnerId;
        return updatedChamp;
      }
      return m;
    });

    // Check if championship is complete
    const champMatchup = updatedMatchups.find((m) => m.id === 3);
    let championId = playoffState.championId;
    let isComplete = playoffState.isComplete;
    if (champMatchup?.isPlayed && champMatchup.winnerId) {
      championId = champMatchup.winnerId;
      isComplete = true;
      if (championId === userTeam.id) {
        toast.success("🏆 You're the Gridiron Dynasty Champions!");
      } else {
        const champTeam = AI_TEAMS.find((t) => t.id === championId);
        toast.info(`${champTeam?.name ?? "AI Team"} wins the Championship!`);
      }
    }

    updateState({
      playoffState: {
        matchups: updatedMatchups,
        championId,
        isComplete,
      },
    });
  }

  function handleDriveUpdate(state: DriveState | null) {
    updateState({ driveState: state });
  }

  function handleResetSeason() {
    const { userTeam } = gameState;
    if (!userTeam) return;
    const freshTeam: Team = { ...userTeam, wins: 0, losses: 0 };
    const freshSchedule = createSchedule(userTeam.id);
    updateState({
      userTeam: freshTeam,
      schedule: freshSchedule,
      driveState: null,
    });
    toast.success("Season reset!");
  }

  // Show team setup if no user team
  if (!gameState.userTeam) {
    return (
      <>
        <div className="min-h-screen bg-background">
          <TeamSetupPage onTeamCreated={handleTeamCreated} />
        </div>
        <Toaster position="top-center" richColors />
      </>
    );
  }

  const { userTeam, userRoster, schedule, driveState, coins, playoffState } =
    gameState;

  function renderPage() {
    switch (currentPage) {
      case "home":
        return (
          <HomePage
            userTeam={userTeam!}
            schedule={schedule}
            onPlayNextGame={handlePlayNextGame}
            onSimulateGame={handleSimulateGame}
          />
        );
      case "team":
        return (
          <TeamPage
            userTeam={userTeam!}
            roster={userRoster}
            onUpdateTeam={handleUpdateTeam}
            onViewRoster={() => setCurrentPage("roster")}
          />
        );
      case "roster":
        return (
          <RosterPage
            roster={userRoster}
            coins={coins}
            onUpgradePlayer={handleUpgradePlayer}
          />
        );
      case "season":
        return (
          <SeasonPage
            userTeam={userTeam!}
            schedule={schedule}
            onResetSeason={handleResetSeason}
            coins={coins}
            playoffState={playoffState}
            onEnterPlayoffs={() => {
              handleStartPlayoffs();
            }}
          />
        );
      case "play":
        return (
          <PlayPage
            userTeam={userTeam!}
            driveState={driveState}
            onDriveUpdate={handleDriveUpdate}
            onGameSaved={handleGameSaved}
          />
        );
      case "packs":
        return <CardPacksPage coins={coins} onOpenPack={handleOpenPack} />;
      case "playoffs":
        return (
          <PlayoffPage
            userTeam={userTeam!}
            playoffState={playoffState}
            onStartPlayoffs={handleStartPlayoffs}
            onSimulateMatchup={handleSimulateMatchup}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-2xl mx-auto relative">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            {userTeam.logoId && TEAM_LOGOS[userTeam.logoId] ? (
              <img
                src={TEAM_LOGOS[userTeam.logoId]}
                alt={userTeam.abbreviation}
                className="w-7 h-7 object-contain"
              />
            ) : (
              <span className="text-lg">🏈</span>
            )}
            <span className="font-display font-black text-primary text-lg tracking-tight">
              GRIDIRON
            </span>
            <span className="font-display font-bold text-foreground/50 text-sm hidden xs:inline">
              DYNASTY 26
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-yellow-900/20 border border-yellow-600/30 rounded-full px-2.5 py-1">
              <span className="text-xs">🪙</span>
              <span className="font-display font-black text-sm text-yellow-400">
                {gameState.coins}
              </span>
            </div>
            <div className="font-display text-sm font-bold text-muted-foreground">
              {userTeam.abbreviation} {userTeam.wins}–{userTeam.losses}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">{renderPage()}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 bg-card/95 backdrop-blur-sm border-t border-border/40">
        <div className="flex overflow-x-auto scrollbar-none">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = currentPage === id;
            return (
              <button
                type="button"
                key={id}
                data-ocid={`nav.${id}.link`}
                onClick={() => setCurrentPage(id)}
                className={`flex-1 min-w-[52px] flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors relative ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? "stroke-[2.5px]" : ""}`}
                />
                <span
                  className={`text-[9px] font-bold uppercase tracking-wide ${isActive ? "text-primary" : ""}`}
                >
                  {label}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 h-0.5 w-10 bg-primary rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <Toaster position="top-center" richColors />
    </div>
  );
}
