import { Button } from "@/components/ui/button";
import { ChevronRight, Swords, Trophy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { AI_TEAMS } from "../gameLogic";
import type { PlayoffMatchup, PlayoffState, Team } from "../types";

interface PlayoffPageProps {
  userTeam: Team;
  playoffState: PlayoffState | null;
  onStartPlayoffs: () => void;
  onSimulateMatchup: (matchupId: number) => void;
}

function getTeamById(teamId: number | null, userTeam: Team): Team | null {
  if (teamId === null) return null;
  if (teamId === userTeam.id) return userTeam;
  return AI_TEAMS.find((t) => t.id === teamId) ?? null;
}

function MatchupBox({
  matchup,
  userTeam,
  label,
  onSimulate,
  isTbd,
}: {
  matchup: PlayoffMatchup;
  userTeam: Team;
  label: string;
  onSimulate: () => void;
  isTbd: boolean;
}) {
  const teamA = getTeamById(matchup.teamAId, userTeam);
  const teamB = getTeamById(matchup.teamBId, userTeam);
  const isUserInMatchup =
    matchup.teamAId === userTeam.id || matchup.teamBId === userTeam.id;

  const winnerTeam = matchup.winnerId
    ? getTeamById(matchup.winnerId, userTeam)
    : null;

  if (isTbd && !matchup.teamAId && !matchup.teamBId) {
    return (
      <div className="rounded-xl border border-border/30 bg-card/60 p-4 min-w-[160px]">
        <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-3 text-center">
          {label}
        </div>
        <div className="text-center text-muted-foreground text-sm font-display font-bold py-4">
          TBD
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-xl border-2 ${
        isUserInMatchup ? "border-primary/50" : "border-border/40"
      } bg-card p-4 min-w-[160px] shadow-md`}
    >
      <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-3 text-center">
        {label}
      </div>

      {/* Team A */}
      <div
        className={`flex items-center justify-between py-1.5 px-2 rounded-lg mb-1 ${
          matchup.isPlayed && matchup.winnerId === matchup.teamAId
            ? "bg-accent/10 border border-accent/20"
            : "bg-secondary/30"
        }`}
      >
        <div className="flex items-center gap-2">
          {matchup.teamAId === userTeam.id && (
            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
          )}
          <span
            className="font-display font-black text-sm"
            style={{
              color: teamA
                ? teamA.isUserTeam
                  ? undefined
                  : teamA.primaryColor
                : undefined,
            }}
          >
            {teamA ? teamA.abbreviation : "TBD"}
          </span>
        </div>
        {matchup.isPlayed && (
          <span
            className={`font-display font-bold text-base ${
              matchup.winnerId === matchup.teamAId
                ? "text-accent"
                : "text-muted-foreground"
            }`}
          >
            {matchup.teamAScore}
          </span>
        )}
      </div>

      <div className="text-center text-xs text-muted-foreground font-bold my-1">
        vs
      </div>

      {/* Team B */}
      <div
        className={`flex items-center justify-between py-1.5 px-2 rounded-lg ${
          matchup.isPlayed && matchup.winnerId === matchup.teamBId
            ? "bg-accent/10 border border-accent/20"
            : "bg-secondary/30"
        }`}
      >
        <div className="flex items-center gap-2">
          {matchup.teamBId === userTeam.id && (
            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
          )}
          <span
            className="font-display font-black text-sm"
            style={{
              color: teamB
                ? teamB.isUserTeam
                  ? undefined
                  : teamB.primaryColor
                : undefined,
            }}
          >
            {teamB ? teamB.abbreviation : "TBD"}
          </span>
        </div>
        {matchup.isPlayed && (
          <span
            className={`font-display font-bold text-base ${
              matchup.winnerId === matchup.teamBId
                ? "text-accent"
                : "text-muted-foreground"
            }`}
          >
            {matchup.teamBScore}
          </span>
        )}
      </div>

      {/* Simulate or result */}
      <div className="mt-3">
        {matchup.isPlayed && winnerTeam ? (
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Winner</div>
            <div
              className="font-display font-black text-sm"
              style={{
                color: winnerTeam.isUserTeam
                  ? undefined
                  : winnerTeam.primaryColor,
              }}
            >
              {winnerTeam.isUserTeam
                ? userTeam.abbreviation
                : winnerTeam.abbreviation}
            </div>
          </div>
        ) : !matchup.isPlayed && matchup.teamAId && matchup.teamBId ? (
          <Button
            data-ocid={`playoffs.matchup_${matchup.id}.button`}
            onClick={onSimulate}
            size="sm"
            variant="outline"
            className="w-full font-display font-bold text-xs border-primary/40 text-primary hover:bg-primary/10 mt-1"
          >
            <Swords className="w-3.5 h-3.5 mr-1.5" />
            Simulate
          </Button>
        ) : null}
      </div>
    </motion.div>
  );
}

export default function PlayoffPage({
  userTeam,
  playoffState,
  onStartPlayoffs,
  onSimulateMatchup,
}: PlayoffPageProps) {
  if (!playoffState) {
    return (
      <div className="p-4 pb-24 max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-7 h-7 text-yellow-400" />
          <h1 className="font-display text-2xl font-black text-foreground">
            Playoffs
          </h1>
        </div>
        <div
          data-ocid="playoffs.empty_state"
          className="bg-card border border-border/30 rounded-2xl p-8 text-center"
        >
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="font-display text-xl font-bold text-foreground mb-2">
            Ready for the Championship?
          </h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
            Complete your regular season first, then enter the playoffs to claim
            the Gridiron Dynasty title.
          </p>
          <Button
            data-ocid="playoffs.primary_button"
            onClick={onStartPlayoffs}
            className="bg-primary text-primary-foreground font-display font-bold h-12 px-8 gold-glow"
          >
            🏆 Start Playoffs
          </Button>
        </div>
      </div>
    );
  }

  const { matchups, championId, isComplete } = playoffState;
  const semi1 = matchups.find((m) => m.id === 1)!;
  const semi2 = matchups.find((m) => m.id === 2)!;
  const championship = matchups.find((m) => m.id === 3)!;

  const championTeam = championId ? getTeamById(championId, userTeam) : null;
  const isUserChampion = championId === userTeam.id;

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-7 h-7 text-yellow-400" />
        <h1 className="font-display text-2xl font-black text-foreground">
          Playoffs
        </h1>
      </div>

      {/* Champion Banner */}
      <AnimatePresence>
        {isComplete && championTeam && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border-2 p-6 text-center mb-6 ${
              isUserChampion
                ? "border-yellow-500/60 bg-yellow-900/30"
                : "border-border/50 bg-card"
            }`}
            data-ocid="playoffs.success_state"
          >
            <div className="text-5xl mb-3">🏆</div>
            <div className="font-display text-2xl font-black text-yellow-400 mb-1">
              {isUserChampion ? "YOU'RE CHAMPION!" : "CHAMPION"}
            </div>
            <div
              className="font-display text-3xl font-black"
              style={{
                color: championTeam.isUserTeam
                  ? undefined
                  : championTeam.primaryColor,
              }}
            >
              {championTeam.city} {championTeam.name}
            </div>
            {isUserChampion && (
              <div className="text-yellow-400/80 text-sm mt-2">
                🎊 Gridiron Dynasty 26 Champions!
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bracket */}
      <div className="mb-4">
        <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-3">
          Bracket
        </div>

        {/* Mobile: vertical stack with connectors */}
        <div className="block sm:hidden space-y-4">
          {/* Semifinals */}
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
            Semifinals
          </div>
          <MatchupBox
            matchup={semi1}
            userTeam={userTeam}
            label="Semi 1"
            onSimulate={() => onSimulateMatchup(1)}
            isTbd={false}
          />
          <MatchupBox
            matchup={semi2}
            userTeam={userTeam}
            label="Semi 2"
            onSimulate={() => onSimulateMatchup(2)}
            isTbd={false}
          />

          {/* Arrow down */}
          <div className="flex items-center gap-2 text-muted-foreground/50 px-2">
            <div className="flex-1 h-px bg-border/30" />
            <ChevronRight className="w-4 h-4 rotate-90" />
            <div className="flex-1 h-px bg-border/30" />
          </div>

          {/* Championship */}
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
            Championship
          </div>
          <MatchupBox
            matchup={championship}
            userTeam={userTeam}
            label="Championship"
            onSimulate={() => onSimulateMatchup(3)}
            isTbd={!championship.teamAId || !championship.teamBId}
          />
        </div>

        {/* Desktop: horizontal bracket */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Semis column */}
          <div className="flex flex-col gap-4 flex-1">
            <MatchupBox
              matchup={semi1}
              userTeam={userTeam}
              label="Semi 1"
              onSimulate={() => onSimulateMatchup(1)}
              isTbd={false}
            />
            <MatchupBox
              matchup={semi2}
              userTeam={userTeam}
              label="Semi 2"
              onSimulate={() => onSimulateMatchup(2)}
              isTbd={false}
            />
          </div>

          {/* Connector lines (CSS) */}
          <div className="flex flex-col items-center self-stretch py-6">
            <div className="flex-1 w-px bg-border/40" />
            <ChevronRight className="w-5 h-5 text-muted-foreground/40 shrink-0 my-1" />
            <div className="flex-1 w-px bg-border/40" />
          </div>

          {/* Championship column */}
          <div className="flex-1 flex items-center">
            <MatchupBox
              matchup={championship}
              userTeam={userTeam}
              label="Championship"
              onSimulate={() => onSimulateMatchup(3)}
              isTbd={!championship.teamAId || !championship.teamBId}
            />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span>Your team</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1 rounded bg-accent/50" />
          <span>Winner</span>
        </div>
      </div>
    </div>
  );
}
