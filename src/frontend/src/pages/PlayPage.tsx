import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AI_TEAMS,
  advanceDrive,
  callPlay,
  createInitialDriveState,
  simulateFullGame,
} from "../gameLogic";
import type { DriveState, Team } from "../types";

interface PlayPageProps {
  userTeam: Team;
  driveState: DriveState | null;
  onDriveUpdate: (state: DriveState | null) => void;
  onGameSaved: (
    opponentId: number,
    userScore: number,
    oppScore: number,
    userWon: boolean,
  ) => void;
}

type PlayType = "runLeft" | "runRight" | "passShort" | "passDeep";

const PLAY_BUTTONS: { type: PlayType; label: string; icon: string }[] = [
  { type: "runLeft", label: "Run Left", icon: "⬅️" },
  { type: "runRight", label: "Run Right", icon: "➡️" },
  { type: "passShort", label: "Pass Short", icon: "🎯" },
  { type: "passDeep", label: "Pass Deep", icon: "🚀" },
];

function getDownText(down: number, yardsToGo: number): string {
  const ordinals = ["", "1st", "2nd", "3rd", "4th"];
  return `${ordinals[down] ?? `${down}th`} & ${yardsToGo}`;
}

function getResultColor(result: string): string {
  if (
    result.includes("TOUCHDOWN") ||
    result.includes("BOMB") ||
    result.includes("BIG RUN")
  )
    return "text-accent";
  if (
    result.includes("INTERCEPTION") ||
    result.includes("FUMBLE") ||
    result.includes("turnover")
  )
    return "text-destructive";
  if (result.includes("CPU scores")) return "text-destructive";
  if (result.includes("First down") || result.includes("!"))
    return "text-primary";
  return "text-foreground/80";
}

// ─── Football Field SVG Component ────────────────────────────────────────────

const FIELD_YARD_LABELS = [10, 20, 30, 40, 50, 40, 30, 20, 10] as const;
// 100 yards of play + 10yd end zone each side = 120 total
// End zones are 10/120 = 8.33% each; play field is 100/120 = 83.33%
const EZ = 10 / 120; // end zone fraction
const PLAY_FRAC = 100 / 120; // play field fraction

function FootballField({ fieldPosition }: { fieldPosition: number }) {
  // fieldPosition: 0 = own goal line, 100 = opponent end zone
  // Map to SVG x coord: end zone left (0→EZ), play field, end zone right
  const clampedPos = Math.min(Math.max(fieldPosition, 0), 100);
  // ball x as fraction of total (0→1)
  const ballFrac = EZ + (clampedPos / 100) * PLAY_FRAC;
  const ballXPct = ballFrac * 100;

  const W = 600;
  const H = 190;
  const ezW = W * EZ; // end zone width in SVG units
  const playW = W * PLAY_FRAC;

  // Grass stripe alternating bands (every 10 yards on the play field)
  const stripes: { id: string; x: number; w: number; dark: boolean }[] = [];
  for (let i = 0; i < 10; i++) {
    stripes.push({
      id: `stripe-yd${i * 10}`,
      x: ezW + i * (playW / 10),
      w: playW / 10,
      dark: i % 2 === 0,
    });
  }

  // Yard lines at 10, 20, 30, 40, 50, 60, 70, 80, 90 (goal lines at 0 & 100)
  const yardLineXs: { id: string; x: number; yd: number }[] = [];
  for (let y = 10; y < 100; y += 10) {
    yardLineXs.push({ id: `yl-${y}`, x: ezW + (y / 100) * playW, yd: y });
  }

  // Hash mark positions: NFL hashes at ~1/3 and 2/3 of field height
  const hashY1 = H * 0.35;
  const hashY2 = H * 0.65;
  const hashLen = 6;
  const hashMarks: { id: string; x: number }[] = [];
  for (let y = 0; y <= 100; y += 5) {
    hashMarks.push({ id: `hash-${y}`, x: ezW + (y / 100) * playW });
  }

  return (
    <div className="football-field-svg-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        aria-label={`Football field, ball at own ${clampedPos} yard line`}
        role="img"
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id="ezLeft" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="oklch(24% 0.08 148)" />
            <stop offset="100%" stopColor="oklch(21% 0.07 148)" />
          </linearGradient>
          <linearGradient id="ezRight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="oklch(21% 0.07 148)" />
            <stop offset="100%" stopColor="oklch(24% 0.08 148)" />
          </linearGradient>
          <linearGradient id="grassLight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="oklch(34% 0.10 145)" />
            <stop offset="100%" stopColor="oklch(28% 0.09 145)" />
          </linearGradient>
          <linearGradient id="grassDark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="oklch(30% 0.09 145)" />
            <stop offset="100%" stopColor="oklch(25% 0.08 145)" />
          </linearGradient>
          <filter id="ballGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feFlood
              floodColor="oklch(78% 0.18 85)"
              floodOpacity="0.8"
              result="color"
            />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="scrimGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Left end zone */}
        <rect x={0} y={0} width={ezW} height={H} fill="url(#ezLeft)" />
        {/* Right end zone */}
        <rect
          x={ezW + playW}
          y={0}
          width={ezW}
          height={H}
          fill="url(#ezRight)"
        />

        {/* Alternating grass stripes */}
        {stripes.map((s) => (
          <rect
            key={s.id}
            x={s.x}
            y={0}
            width={s.w}
            height={H}
            fill={s.dark ? "url(#grassDark)" : "url(#grassLight)"}
          />
        ))}

        {/* End zone text - left (rotated) */}
        <text
          x={ezW / 2}
          y={H / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          transform={`rotate(-90, ${ezW / 2}, ${H / 2})`}
          fill="oklch(75% 0.12 145)"
          fontSize="11"
          fontWeight="800"
          fontFamily="Bricolage Grotesque, Cabinet Grotesk, ui-sans-serif, sans-serif"
          letterSpacing="3"
          opacity="0.85"
        >
          END ZONE
        </text>
        {/* End zone text - right */}
        <text
          x={ezW + playW + ezW / 2}
          y={H / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          transform={`rotate(90, ${ezW + playW + ezW / 2}, ${H / 2})`}
          fill="oklch(75% 0.12 145)"
          fontSize="11"
          fontWeight="800"
          fontFamily="Bricolage Grotesque, Cabinet Grotesk, ui-sans-serif, sans-serif"
          letterSpacing="3"
          opacity="0.85"
        >
          END ZONE
        </text>

        {/* Goal lines */}
        <line
          x1={ezW}
          y1={0}
          x2={ezW}
          y2={H}
          stroke="white"
          strokeWidth="2"
          opacity="0.9"
        />
        <line
          x1={ezW + playW}
          y1={0}
          x2={ezW + playW}
          y2={H}
          stroke="white"
          strokeWidth="2"
          opacity="0.9"
        />

        {/* Yard lines every 10 yards */}
        {yardLineXs.map((yl) => (
          <line
            key={yl.id}
            x1={yl.x}
            y1={0}
            x2={yl.x}
            y2={H}
            stroke="white"
            strokeWidth={yl.yd === 50 ? 2 : 1}
            opacity={yl.yd === 50 ? 0.8 : 0.45}
          />
        ))}

        {/* Hash marks every 5 yards */}
        {hashMarks.map((h) => (
          <g key={h.id}>
            <line
              x1={h.x}
              y1={hashY1 - hashLen / 2}
              x2={h.x}
              y2={hashY1 + hashLen / 2}
              stroke="white"
              strokeWidth="1.5"
              opacity="0.5"
            />
            <line
              x1={h.x}
              y1={hashY2 - hashLen / 2}
              x2={h.x}
              y2={hashY2 + hashLen / 2}
              stroke="white"
              strokeWidth="1.5"
              opacity="0.5"
            />
          </g>
        ))}

        {/* Yard numbers */}
        {FIELD_YARD_LABELS.map((label, i) => {
          const x = ezW + (i + 1) * (playW / 10) - playW / 20;
          // Use position x as stable key (each x is unique for each label slot)
          const stableKey = `yardlabel-${i}-${label}`;
          return (
            <text
              key={stableKey}
              x={x}
              y={H / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="13"
              fontWeight="700"
              fontFamily="Bricolage Grotesque, Cabinet Grotesk, ui-sans-serif, sans-serif"
              opacity="0.7"
            >
              {label}
            </text>
          );
        })}

        {/* Scrimmage line */}
        <line
          x1={`${ballXPct}%`}
          y1={0}
          x2={`${ballXPct}%`}
          y2={H}
          stroke="oklch(85% 0.22 85)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          opacity="0.75"
          filter="url(#scrimGlow)"
        />

        {/* Ball marker */}
        <motion.g
          animate={{ x: `${ballXPct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          style={{ translateX: "-50%" }}
          filter="url(#ballGlow)"
        >
          <text
            x={0}
            y={H / 2 + 6}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="22"
          >
            🏈
          </text>
        </motion.g>
      </svg>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PlayPage({
  userTeam,
  driveState,
  onDriveUpdate,
  onGameSaved,
}: PlayPageProps) {
  const [selectedOpponent, setSelectedOpponent] = useState<string>("");
  const [lastPlayText, setLastPlayText] = useState<string>("");
  const [lastPlayKey, setLastPlayKey] = useState(0);
  const historyRef = useRef<HTMLDivElement>(null);

  const opponent = driveState
    ? AI_TEAMS.find((t) => t.id === driveState.opponentTeamId)
    : null;

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally scroll on playHistory change
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driveState?.playHistory?.length]);

  function handleStartGame() {
    if (!selectedOpponent) {
      toast.error("Select an opponent to play.");
      return;
    }
    const oppId = Number.parseInt(selectedOpponent, 10);
    const newState = createInitialDriveState(oppId);
    onDriveUpdate(newState);
    toast.success(
      `Game started! vs ${AI_TEAMS.find((t) => t.id === oppId)?.name ?? "CPU"}`,
    );
  }

  function handlePlay(playType: PlayType) {
    if (!driveState || driveState.isGameOver) return;
    const result = callPlay(playType);
    const next = advanceDrive(driveState, result);
    setLastPlayText(result.description);
    setLastPlayKey((k) => k + 1);
    onDriveUpdate(next);

    if (next.isGameOver) {
      toast.success("Game over! Save the result.");
    }
  }

  function handleEndGame() {
    if (!driveState) return;
    // Simulate remaining plays
    const sim = simulateFullGame();
    const finalUserScore = driveState.userScore + Math.floor(sim.userScore / 3);
    const finalOppScore =
      driveState.opponentScore + Math.floor(sim.opponentScore / 3);
    const endedState: DriveState = {
      ...driveState,
      isGameOver: true,
      userScore: finalUserScore,
      opponentScore: finalOppScore,
    };
    onDriveUpdate(endedState);
    toast.info(`Game ended! Final: ${finalUserScore}–${finalOppScore}`);
  }

  function handleSaveResult() {
    if (!driveState) return;
    onGameSaved(
      driveState.opponentTeamId,
      driveState.userScore,
      driveState.opponentScore,
      driveState.userScore > driveState.opponentScore,
    );
    onDriveUpdate(null);
    toast.success("Result saved to schedule!");
  }

  // No active game — show start game UI
  if (!driveState) {
    return (
      <div className="p-4 pb-24 max-w-xl mx-auto">
        <h1 className="font-display text-2xl font-black text-foreground mb-6">
          Play
        </h1>
        <Card className="bg-card border-border/50">
          <CardContent className="py-8 text-center space-y-6">
            <div className="text-6xl">🏈</div>
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                Start New Game
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Choose an opponent and hit the field
              </p>
            </div>

            <div className="max-w-xs mx-auto space-y-4">
              <Select
                value={selectedOpponent}
                onValueChange={setSelectedOpponent}
              >
                <SelectTrigger
                  data-ocid="play.opponent.select"
                  className="bg-secondary/50 border-border/50 w-full"
                >
                  <SelectValue placeholder="Select opponent..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/50">
                  {AI_TEAMS.map((team) => (
                    <SelectItem key={team.id} value={String(team.id)}>
                      {team.city} {team.name} ({team.abbreviation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                data-ocid="play.start_game.button"
                onClick={handleStartGame}
                className="w-full bg-primary text-primary-foreground font-display font-bold h-12 gold-glow"
                disabled={!selectedOpponent}
              >
                🏟️ KICK OFF!
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active game
  const isOver = driveState.isGameOver;
  const userWon = driveState.userScore > driveState.opponentScore;

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto space-y-3">
      {/* Scoreboard */}
      <div className="rounded-xl overflow-hidden border border-border/50">
        <div className="bg-secondary/80 px-4 py-2 text-center">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {isOver ? "FINAL" : `Quarter ${driveState.quarter}`}
          </span>
        </div>
        <div className="bg-card flex items-center">
          <div className="flex-1 text-center py-4 px-3">
            <div className="font-display text-3xl font-black text-primary">
              {userTeam.abbreviation}
            </div>
            <div className="font-display text-5xl font-black text-foreground mt-1">
              {driveState.userScore}
            </div>
          </div>
          <div className="text-muted-foreground font-bold text-xl px-2">–</div>
          <div className="flex-1 text-center py-4 px-3">
            <div
              className="font-display text-3xl font-black"
              style={{ color: opponent?.primaryColor ?? "#888" }}
            >
              {opponent?.abbreviation ?? "CPU"}
            </div>
            <div className="font-display text-5xl font-black text-foreground mt-1">
              {driveState.opponentScore}
            </div>
          </div>
        </div>
        {!isOver && (
          <div className="bg-secondary/40 px-4 py-2 text-center">
            <span className="font-bold text-sm text-foreground/80">
              {getDownText(driveState.down, driveState.yardsToGo)}
            </span>
            <span className="text-muted-foreground text-xs ml-2">
              • Own {driveState.fieldPosition}-yd line
            </span>
          </div>
        )}
      </div>

      {/* Game Over Banner */}
      {isOver && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`rounded-xl p-5 text-center ${userWon ? "bg-accent/20 border border-accent/40" : "bg-destructive/10 border border-destructive/30"}`}
        >
          <div className="text-4xl mb-2">{userWon ? "🏆" : "😔"}</div>
          <div
            className={`font-display text-2xl font-black ${userWon ? "text-accent" : "text-destructive"}`}
          >
            {userWon ? "VICTORY!" : "DEFEAT"}
          </div>
          <div className="text-muted-foreground text-sm mt-1">
            {userTeam.abbreviation} {driveState.userScore} –{" "}
            {driveState.opponentScore} {opponent?.abbreviation}
          </div>
          <Button
            data-ocid="play.start_game.button"
            onClick={handleSaveResult}
            className="mt-4 bg-primary text-primary-foreground font-display font-bold gold-glow"
          >
            Save Result to Season
          </Button>
        </motion.div>
      )}

      {/* Field Position */}
      {!isOver && <FootballField fieldPosition={driveState.fieldPosition} />}

      {/* Last Play Result */}
      <AnimatePresence mode="wait">
        {lastPlayText && (
          <motion.div
            key={lastPlayKey}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-center font-display font-bold text-lg ${getResultColor(lastPlayText)}`}
          >
            {lastPlayText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play Buttons */}
      {!isOver && (
        <div className="grid grid-cols-2 gap-3">
          {PLAY_BUTTONS.map(({ type, label, icon }) => (
            <Button
              key={type}
              data-ocid={`play.${type.replace(/([A-Z])/g, "_$1").toLowerCase()}.button`}
              onClick={() => handlePlay(type)}
              variant="outline"
              className="h-16 font-display font-bold text-base border-border/50 hover:bg-primary/20 hover:border-primary/60 hover:text-primary flex-col gap-1"
            >
              <span className="text-xl">{icon}</span>
              {label}
            </Button>
          ))}
        </div>
      )}

      {/* End Game */}
      {!isOver && (
        <Button
          data-ocid="play.end_game.button"
          onClick={handleEndGame}
          variant="outline"
          className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 font-display font-bold"
        >
          End Game (Simulate Remaining)
        </Button>
      )}

      {/* Play History */}
      {driveState.playHistory.length > 0 && (
        <Card className="bg-card border-border/30">
          <CardContent className="py-3 px-4">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Play History
            </div>
            <ScrollArea
              className="h-32"
              ref={historyRef as React.RefObject<HTMLDivElement>}
            >
              <div className="space-y-1">
                {driveState.playHistory.map((entry, i) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: play history is reverse-ordered, index is stable
                    key={i}
                    className={`text-xs py-1 border-b border-border/20 last:border-0 ${getResultColor(entry)}`}
                  >
                    {entry}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
