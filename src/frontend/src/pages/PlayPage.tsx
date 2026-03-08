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
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { STADIUM_IMAGES, TEAM_LOGOS } from "../assets";
import {
  AI_TEAMS,
  advanceDrive,
  createInitialDriveState,
  generatePlayOptions,
  simulateFullGame,
  throwToReceiver,
} from "../gameLogic";
import type { DriveState, PlayResult, ReceiverRoute, Team } from "../types";

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

type PlayCallOption = ReturnType<typeof generatePlayOptions>[0];
type GamePhase =
  | "idle" // pick a play
  | "pre_snap" // play selected, routes shown, hit SNAP
  | "pocket" // in pocket, pick a receiver or run
  | "throwing" // ball in air
  | "result"; // play result shown

function getDownText(down: number, yardsToGo: number): string {
  const ordinals = ["", "1st", "2nd", "3rd", "4th"];
  return `${ordinals[down] ?? `${down}th`} & ${yardsToGo}`;
}

function getResultColor(result: string): string {
  if (
    result.includes("TOUCHDOWN") ||
    result.includes("BOMB") ||
    result.includes("BREAKAWAY") ||
    result.includes("BIG")
  )
    return "text-accent";
  if (
    result.includes("INTERCEPTION") ||
    result.includes("FUMBLE") ||
    result.includes("turnover") ||
    result.includes("Stuffed") ||
    result.includes("sack")
  )
    return "text-destructive";
  if (result.includes("CPU scores")) return "text-destructive";
  if (result.includes("First down") || result.includes("!"))
    return "text-primary";
  return "text-foreground/80";
}

// ─── QB Perspective Field ─────────────────────────────────────────────────────

const POCKET_SECONDS = 3.5;

interface QBFieldViewProps {
  play: PlayCallOption | null;
  phase: GamePhase;
  pressureFraction: number; // 0-1
  selectedReceiver: ReceiverRoute | null;
  onReceiverSelect: (r: ReceiverRoute) => void;
  stadiumBg: string;
  userTeamColor: string;
  opponentColor: string;
}

function QBFieldView({
  play,
  phase,
  pressureFraction,
  selectedReceiver,
  onReceiverSelect,
  stadiumBg,
  userTeamColor,
  opponentColor,
}: QBFieldViewProps) {
  const W = 600;
  const H = 380;

  // Perspective vanishing point
  const VPY = H * 0.28;

  // Field corners in perspective (left-right-bottom)
  const FIELD_BOTTOM_LEFT = { x: 0, y: H };
  const FIELD_BOTTOM_RIGHT = { x: W, y: H };
  const FIELD_TOP_LEFT = { x: W * 0.12, y: VPY + 8 };
  const FIELD_TOP_RIGHT = { x: W * 0.88, y: VPY + 8 };

  // Hash mark lines: project vertical lines in perspective
  function perspX(worldX: number, depth: number): number {
    // worldX: -1 = far left sideline, 1 = far right sideline
    // depth: 0 = line of scrimmage (near), 1 = end zone (far)
    const t = depth;
    // Near width at bottom: full W; far width converges to VP
    const nearLeft = FIELD_BOTTOM_LEFT.x;
    const nearRight = FIELD_BOTTOM_RIGHT.x;
    const farLeft = FIELD_TOP_LEFT.x;
    const farRight = FIELD_TOP_RIGHT.x;
    const left = nearLeft + (farLeft - nearLeft) * t;
    const right = nearRight + (farRight - nearRight) * t;
    const cx = left + ((worldX + 1) / 2) * (right - left);
    return cx;
  }

  function perspY(depth: number): number {
    const nearY = FIELD_BOTTOM_LEFT.y;
    const farY = FIELD_TOP_LEFT.y;
    return nearY + (farY - nearY) * depth;
  }

  // Yard lines
  const yardDepths = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

  // Receiver positions in projected coords
  function receiverProjected(r: ReceiverRoute) {
    const rx = perspX(r.x, r.depth);
    const ry = perspY(r.depth);
    // Scale: receivers near = bigger, far = smaller
    const scale = 1 - r.depth * 0.6;
    return { rx, ry, scale };
  }

  // Coverage color
  function coverageColor(r: ReceiverRoute) {
    if (r.coverage === "open") return "oklch(72% 0.22 142)"; // green
    if (r.coverage === "contested") return "oklch(78% 0.20 85)"; // amber
    return "oklch(65% 0.22 25)"; // red
  }

  // Linemen positions along LOS (depth=0, near bottom)
  const linemanXs = [-0.35, -0.18, 0, 0.18, 0.35];
  // D-line (slightly ahead, depth=0.06)
  const dlineXs = [-0.38, -0.2, 0.0, 0.2, 0.38];

  // Pressure rush: defensive ends closing from depth 0.06 toward player
  const rushDepth = pressureFraction * 0.06; // 0 to 0.06 as pressure builds
  const deLeft = {
    x: perspX(-0.55, 0.06 - rushDepth),
    y: perspY(0.06 - rushDepth),
  };
  const deRight = {
    x: perspX(0.55, 0.06 - rushDepth),
    y: perspY(0.06 - rushDepth),
  };

  const showFormation =
    phase === "pre_snap" || phase === "pocket" || phase === "throwing";
  const canSelectReceiver = phase === "pocket";
  const isRun = play?.type === "runLeft" || play?.type === "runRight";

  return (
    <div className="relative rounded-xl overflow-hidden border border-border/40">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block" }}
        aria-label="QB perspective field view"
        role="img"
      >
        <title>QB perspective field view</title>
        <defs>
          {/* Sky gradient */}
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(22% 0.04 255)" />
            <stop offset="100%" stopColor="oklch(30% 0.06 200)" />
          </linearGradient>
          {/* Grass light/dark stripes via gradients */}
          <linearGradient id="grassPerspLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(32% 0.10 140)" />
            <stop offset="100%" stopColor="oklch(26% 0.09 140)" />
          </linearGradient>
          <linearGradient id="grassPerspDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(28% 0.09 140)" />
            <stop offset="100%" stopColor="oklch(22% 0.08 140)" />
          </linearGradient>
          <filter id="recvGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter
            id="pressureGlow"
            x="-60%"
            y="-60%"
            width="220%"
            height="220%"
          >
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feFlood
              floodColor="oklch(60% 0.28 25)"
              floodOpacity="0.7"
              result="color"
            />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <style>{`
            @keyframes pulse-open {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.65; }
            }
            .receiver-open { animation: pulse-open 1.2s ease-in-out infinite; }
          `}</style>
        </defs>

        {/* Sky */}
        <rect x={0} y={0} width={W} height={VPY + 8} fill="url(#sky)" />

        {/* Stadium background image clipped to upper half */}
        <image
          href={stadiumBg}
          x={0}
          y={0}
          width={W}
          height={VPY + 60}
          preserveAspectRatio="xMidYMid slice"
          opacity={0.28}
          clipPath={`inset(0 0 ${H - VPY - 60}px 0)`}
        />

        {/* Field polygon */}
        <polygon
          points={`${FIELD_BOTTOM_LEFT.x},${FIELD_BOTTOM_LEFT.y} ${FIELD_BOTTOM_RIGHT.x},${FIELD_BOTTOM_RIGHT.y} ${FIELD_TOP_RIGHT.x},${FIELD_TOP_RIGHT.y} ${FIELD_TOP_LEFT.x},${FIELD_TOP_LEFT.y}`}
          fill="url(#grassPerspLight)"
        />

        {/* Perspective yard stripes */}
        {yardDepths.slice(0, -1).map((d, i) => {
          const d2 = yardDepths[i + 1];
          const x0 = perspX(-1, d);
          const x1 = perspX(1, d);
          const x2 = perspX(1, d2);
          const x3 = perspX(-1, d2);
          const y0 = perspY(d);
          const y1 = perspY(d2);
          return (
            <polygon
              key={`stripe-d${d.toFixed(2)}`}
              points={`${x0},${y0} ${x1},${y0} ${x2},${y1} ${x3},${y1}`}
              fill={
                i % 2 === 0 ? "url(#grassPerspLight)" : "url(#grassPerspDark)"
              }
            />
          );
        })}

        {/* Sidelines */}
        <line
          x1={FIELD_BOTTOM_LEFT.x}
          y1={FIELD_BOTTOM_LEFT.y}
          x2={FIELD_TOP_LEFT.x}
          y2={FIELD_TOP_LEFT.y}
          stroke="white"
          strokeWidth="2"
          opacity="0.7"
        />
        <line
          x1={FIELD_BOTTOM_RIGHT.x}
          y1={FIELD_BOTTOM_RIGHT.y}
          x2={FIELD_TOP_RIGHT.x}
          y2={FIELD_TOP_RIGHT.y}
          stroke="white"
          strokeWidth="2"
          opacity="0.7"
        />

        {/* Yard lines across field */}
        {yardDepths.map((d) => (
          <line
            key={`yl-${d}`}
            x1={perspX(-1, d)}
            y1={perspY(d)}
            x2={perspX(1, d)}
            y2={perspY(d)}
            stroke="white"
            strokeWidth={d === 0 ? 2.5 : 1}
            opacity={d === 0 ? 0.9 : 0.3}
          />
        ))}

        {/* Hash marks */}
        {yardDepths.map((d) => {
          const y = perspY(d);
          const hx1l = perspX(-0.08, d);
          const hx2l = perspX(-0.14, d);
          const hx1r = perspX(0.08, d);
          const hx2r = perspX(0.14, d);
          return (
            <g key={`hash-${d}`}>
              <line
                x1={hx1l}
                y1={y}
                x2={hx2l}
                y2={y}
                stroke="white"
                strokeWidth="1.5"
                opacity="0.45"
              />
              <line
                x1={hx1r}
                y1={y}
                x2={hx2r}
                y2={y}
                stroke="white"
                strokeWidth="1.5"
                opacity="0.45"
              />
            </g>
          );
        })}

        {/* End zone (far) */}
        {(() => {
          const ezDepth = 1.0;
          const ezEndDepth = 1.12;
          return (
            <polygon
              points={`${perspX(-1, ezDepth)},${perspY(ezDepth)} ${perspX(1, ezDepth)},${perspY(ezDepth)} ${perspX(1, ezEndDepth)},${perspY(ezEndDepth)} ${perspX(-1, ezEndDepth)},${perspY(ezEndDepth)}`}
              fill="oklch(22% 0.08 148)"
              opacity="0.9"
            />
          );
        })()}

        {/* ── Player formation ── */}
        {showFormation && (
          <g>
            {/* Offensive line dots */}
            {linemanXs.map((lx) => {
              const px = perspX(lx, 0.01);
              const py = perspY(0.01);
              return (
                <circle
                  key={`ol-${lx.toFixed(2)}`}
                  cx={px}
                  cy={py}
                  r={9}
                  fill={userTeamColor}
                  opacity="0.9"
                  stroke="white"
                  strokeWidth="1"
                />
              );
            })}

            {/* Defensive line */}
            {dlineXs.map((dx) => {
              const px = perspX(dx, 0.055);
              const py = perspY(0.055);
              return (
                <circle
                  key={`dl-${dx.toFixed(2)}`}
                  cx={px}
                  cy={py}
                  r={8}
                  fill={opponentColor}
                  opacity="0.88"
                  stroke="white"
                  strokeWidth="0.8"
                />
              );
            })}

            {/* Defensive ends (with pressure glow when time running out) */}
            {pressureFraction > 0.5 && (
              <g filter="url(#pressureGlow)">
                <circle
                  cx={deLeft.x}
                  cy={deLeft.y}
                  r={9}
                  fill={opponentColor}
                  opacity="0.95"
                />
                <circle
                  cx={deRight.x}
                  cy={deRight.y}
                  r={9}
                  fill={opponentColor}
                  opacity="0.95"
                />
              </g>
            )}
            {pressureFraction <= 0.5 && (
              <g>
                <circle
                  cx={deLeft.x}
                  cy={deLeft.y}
                  r={9}
                  fill={opponentColor}
                  opacity="0.88"
                />
                <circle
                  cx={deRight.x}
                  cy={deRight.y}
                  r={9}
                  fill={opponentColor}
                  opacity="0.88"
                />
              </g>
            )}

            {/* Route lines for passing plays */}
            {!isRun &&
              play?.receivers.map((r) => {
                const { rx, ry } = receiverProjected(r);
                // Route line from near-bottom to receiver
                const startX = perspX(r.x, 0.01);
                const startY = perspY(0.01);
                return (
                  <line
                    key={`route-${r.id}`}
                    x1={startX}
                    y1={startY}
                    x2={rx}
                    y2={ry}
                    stroke={coverageColor(r)}
                    strokeWidth="2"
                    strokeDasharray="8 5"
                    opacity="0.65"
                  />
                );
              })}

            {/* Run lane arrows */}
            {isRun &&
              play?.receivers.map((r) => {
                const { rx, ry } = receiverProjected(r);
                const startX = perspX(r.x, 0.01);
                const startY = perspY(0.01);
                return (
                  <g key={`run-lane-${r.id}`}>
                    <line
                      x1={startX}
                      y1={startY}
                      x2={rx}
                      y2={ry}
                      stroke="oklch(78% 0.20 85)"
                      strokeWidth="4"
                      opacity="0.7"
                    />
                    <polygon
                      points={`${rx},${ry - 6} ${rx - 5},${ry + 6} ${rx + 5},${ry + 6}`}
                      fill="oklch(78% 0.20 85)"
                      opacity="0.85"
                    />
                  </g>
                );
              })}

            {/* Receivers / run gaps */}
            {play?.receivers.map((r) => {
              const { rx, ry, scale } = receiverProjected(r);
              const cc = coverageColor(r);
              const isSelected = selectedReceiver?.id === r.id;
              const isOpen = r.coverage === "open";
              const dotR = Math.max(10, 16 * scale);
              const isInteractive = canSelectReceiver;

              return (
                <g
                  key={`recv-${r.id}`}
                  className={isOpen && canSelectReceiver ? "receiver-open" : ""}
                  filter={isSelected ? "url(#recvGlow)" : undefined}
                  style={{ cursor: isInteractive ? "pointer" : "default" }}
                  onClick={() => isInteractive && onReceiverSelect(r)}
                  onKeyDown={(e) => {
                    if (isInteractive && (e.key === "Enter" || e.key === " ")) {
                      onReceiverSelect(r);
                    }
                  }}
                  role={isInteractive ? "button" : undefined}
                  tabIndex={isInteractive ? 0 : undefined}
                  aria-label={
                    isInteractive
                      ? `Throw to ${r.label} - ${r.coverage}`
                      : undefined
                  }
                >
                  {/* Outer ring */}
                  <circle
                    cx={rx}
                    cy={ry}
                    r={dotR + 4}
                    fill="none"
                    stroke={cc}
                    strokeWidth={isSelected ? 3 : 1.5}
                    opacity={isSelected ? 1 : 0.6}
                  />
                  {/* Fill */}
                  <circle
                    cx={rx}
                    cy={ry}
                    r={dotR}
                    fill={isRun ? "oklch(78% 0.20 85)" : cc}
                    opacity={phase === "throwing" ? 0.5 : 0.9}
                  />
                  {/* Label */}
                  <text
                    x={rx}
                    y={ry + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={Math.max(8, 11 * scale)}
                    fontWeight="800"
                    fontFamily="ui-sans-serif, sans-serif"
                  >
                    {r.label}
                  </text>
                  {/* Coverage badge below */}
                  {!isRun && canSelectReceiver && (
                    <text
                      x={rx}
                      y={ry + dotR + 12}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={cc}
                      fontSize={Math.max(7, 9 * scale)}
                      fontWeight="700"
                      fontFamily="ui-sans-serif, sans-serif"
                      opacity="0.9"
                    >
                      {r.coverage.toUpperCase()}
                    </text>
                  )}
                  {/* Tap target (invisible, large hit area) */}
                  {isInteractive && (
                    <circle cx={rx} cy={ry} r={dotR + 14} fill="transparent" />
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* Center / snap indicator */}
        <g opacity="0.85">
          {/* Ball under center */}
          <text
            x={perspX(0, 0)}
            y={perspY(0) - 10}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="22"
          >
            🏈
          </text>
        </g>

        {/* Throw animation overlay */}
        {phase === "throwing" &&
          selectedReceiver &&
          (() => {
            const { rx, ry } = receiverProjected(selectedReceiver);
            const startX = perspX(0, 0);
            const startY = perspY(0) - 10;
            return (
              <motion.text
                x={startX}
                y={startY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="18"
                initial={{ x: startX, y: startY, opacity: 1 }}
                animate={{ x: rx, y: ry, opacity: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
              >
                🏈
              </motion.text>
            );
          })()}

        {/* Snap flash overlay */}
        {phase === "pocket" && (
          <motion.rect
            x={0}
            y={0}
            width={W}
            height={H}
            fill="white"
            initial={{ opacity: 0.35 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
        )}
      </svg>

      {/* Pressure meter bar overlaid at bottom of field */}
      {(phase === "pocket" || phase === "throwing") && (
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-background/50">
          <motion.div
            className="h-full"
            style={{
              background:
                pressureFraction < 0.5
                  ? "oklch(72% 0.22 142)"
                  : pressureFraction < 0.75
                    ? "oklch(78% 0.20 85)"
                    : "oklch(60% 0.28 25)",
              width: `${(1 - pressureFraction) * 100}%`,
            }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}

      {/* Pressure label */}
      {phase === "pocket" && (
        <div className="absolute top-2 right-3 flex items-center gap-1.5">
          <div
            className="text-xs font-black uppercase tracking-wide"
            style={{
              color:
                pressureFraction < 0.5
                  ? "oklch(72% 0.22 142)"
                  : pressureFraction < 0.75
                    ? "oklch(78% 0.20 85)"
                    : "oklch(60% 0.28 25)",
            }}
          >
            {pressureFraction < 0.5
              ? "CLEAN POCKET"
              : pressureFraction < 0.75
                ? "PRESSURE!"
                : "SACK INCOMING!"}
          </div>
        </div>
      )}

      {/* Instruction overlay pre-snap */}
      {phase === "pre_snap" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="font-display font-black text-white text-xl drop-shadow-lg">
              {play?.label.toUpperCase()}
            </div>
            <div className="text-white/70 text-sm mt-1 drop-shadow">
              Routes are live — tap SNAP to take the snap
            </div>
          </div>
        </div>
      )}

      {/* Pocket instruction */}
      {phase === "pocket" && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
          <div className="bg-background/80 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-bold text-foreground/90 border border-border/40">
            {play?.type === "runLeft" || play?.type === "runRight"
              ? "Tap a gap to run"
              : "Tap a receiver to throw"}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Play Call Card Grid ───────────────────────────────────────────────────────

function PlayCallGrid({
  plays,
  onSelect,
}: {
  plays: PlayCallOption[];
  onSelect: (p: PlayCallOption) => void;
}) {
  return (
    <motion.div
      key="play-call-grid"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-3"
    >
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">
        Call a Play
      </div>
      <div className="grid grid-cols-2 gap-3">
        {plays.map((p) => {
          const isRun = p.type === "runLeft" || p.type === "runRight";
          return (
            <Button
              key={p.type}
              data-ocid={`play.call.${p.type}.button`}
              onClick={() => onSelect(p)}
              variant="outline"
              className={`h-20 font-display font-bold text-sm border-border/50 flex-col gap-1 
                ${isRun ? "hover:bg-orange-900/20 hover:border-orange-500/50" : "hover:bg-cyan-900/20 hover:border-cyan-500/50"}`}
            >
              <span className="text-2xl">{p.icon}</span>
              <span>{p.shortLabel}</span>
              <span className="text-xs text-muted-foreground font-normal">
                {p.label}
              </span>
            </Button>
          );
        })}
      </div>
    </motion.div>
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
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [currentPlay, setCurrentPlay] = useState<PlayCallOption | null>(null);
  const [playOptions, setPlayOptions] = useState<PlayCallOption[]>(() =>
    generatePlayOptions(),
  );
  const [selectedReceiver, setSelectedReceiver] =
    useState<ReceiverRoute | null>(null);
  const [pressureFraction, setPressureFraction] = useState(0);
  const pocketTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pocketStartRef = useRef<number>(0);
  const historyRef = useRef<HTMLDivElement>(null);

  const opponent = driveState
    ? AI_TEAMS.find((t) => t.id === driveState.opponentTeamId)
    : null;

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally scroll on playHistory change
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = 0;
    }
  }, [driveState?.playHistory?.length]);

  // Reset when game ends
  useEffect(() => {
    if (!driveState || driveState.isGameOver) {
      setPhase("idle");
      setCurrentPlay(null);
      setSelectedReceiver(null);
      setPressureFraction(0);
      clearPocketTimer();
    }
  }, [driveState]);

  function clearPocketTimer() {
    if (pocketTimerRef.current) {
      clearInterval(pocketTimerRef.current);
      pocketTimerRef.current = null;
    }
  }

  function startPocketTimer() {
    pocketStartRef.current = Date.now();
    setPressureFraction(0);
    pocketTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - pocketStartRef.current) / 1000;
      const frac = Math.min(elapsed / POCKET_SECONDS, 1);
      setPressureFraction(frac);
      if (frac >= 1) {
        clearPocketTimer();
        // Sack / forced throw-away
        handleForcedSack();
      }
    }, 50);
  }

  const handleForcedSack = useCallback(() => {
    if (!driveState) return;
    const sackResult: PlayResult = {
      yardsGained: -randRange(3, 8),
      isTouchdown: false,
      isInterception: false,
      isFumble: false,
      description: `SACK! Took a ${Math.abs(-randRange(3, 8))}-yard sack. Held the ball too long!`,
    };
    const next = advanceDrive(driveState, sackResult);
    setLastPlayText(sackResult.description);
    setLastPlayKey((k) => k + 1);
    onDriveUpdate(next);
    setPhase("result");
    setCurrentPlay(null);
    setSelectedReceiver(null);
    setPressureFraction(0);
    setTimeout(() => {
      setPhase("idle");
      setPlayOptions(generatePlayOptions());
    }, 1800);
    if (next.isGameOver) toast.success("Game over! Save the result.");
  }, [driveState, onDriveUpdate]);

  // Dummy randRange for sack description (reuse from gameLogic indirectly)
  function randRange(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function handleSelectPlay(play: PlayCallOption) {
    setCurrentPlay(play);
    setSelectedReceiver(null);
    setPressureFraction(0);
    setPhase("pre_snap");
  }

  function handleChangePlay() {
    setCurrentPlay(null);
    setPhase("idle");
    setPlayOptions(generatePlayOptions());
  }

  function handleSnap() {
    setPhase("pocket");
    startPocketTimer();
  }

  function handleReceiverSelect(r: ReceiverRoute) {
    if (phase !== "pocket") return;
    clearPocketTimer();
    setSelectedReceiver(r);
    setPhase("throwing");

    // Slight delay for throw animation then resolve
    setTimeout(() => {
      if (!driveState || !currentPlay) return;
      const result = throwToReceiver(r, pressureFraction);
      const next = advanceDrive(driveState, result);
      setLastPlayText(result.description);
      setLastPlayKey((k) => k + 1);
      onDriveUpdate(next);
      setPhase("result");
      setCurrentPlay(null);
      setSelectedReceiver(null);
      setPressureFraction(0);
      setTimeout(() => {
        setPhase("idle");
        setPlayOptions(generatePlayOptions());
      }, 1800);
      if (next.isGameOver) toast.success("Game over! Save the result.");
    }, 650);
  }

  function handleStartGame() {
    if (!selectedOpponent) {
      toast.error("Select an opponent to play.");
      return;
    }
    const oppId = Number.parseInt(selectedOpponent, 10);
    const newState = createInitialDriveState(oppId);
    onDriveUpdate(newState);
    setPlayOptions(generatePlayOptions());
    toast.success(
      `Game started! vs ${AI_TEAMS.find((t) => t.id === oppId)?.name ?? "CPU"}`,
    );
  }

  function handleEndGame() {
    if (!driveState) return;
    clearPocketTimer();
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
    setPhase("idle");
    setCurrentPlay(null);
    toast.info(`Game ended! Final: ${finalUserScore}–${finalOppScore}`);
  }

  function handleSaveResult() {
    if (!driveState) return;
    clearPocketTimer();
    onGameSaved(
      driveState.opponentTeamId,
      driveState.userScore,
      driveState.opponentScore,
      driveState.userScore > driveState.opponentScore,
    );
    onDriveUpdate(null);
    setPhase("idle");
    setCurrentPlay(null);
    setSelectedReceiver(null);
    toast.success("Result saved to schedule!");
  }

  // Stadium background
  const stadiumBg = opponent
    ? STADIUM_IMAGES[opponent.stadiumStyle ?? "outdoor"]
    : STADIUM_IMAGES.outdoor;

  const userLogoSrc = userTeam.logoId ? TEAM_LOGOS[userTeam.logoId] : null;
  const oppLogoSrc = opponent?.logoId ? TEAM_LOGOS[opponent.logoId] : null;

  // No active game
  if (!driveState) {
    const previewOpp = selectedOpponent
      ? AI_TEAMS.find((t) => t.id === Number.parseInt(selectedOpponent, 10))
      : null;
    const stadiumBgPreview = previewOpp
      ? STADIUM_IMAGES[previewOpp.stadiumStyle ?? "outdoor"]
      : null;

    return (
      <div className="p-4 pb-24 max-w-xl mx-auto">
        <h1 className="font-display text-2xl font-black text-foreground mb-6">
          Play
        </h1>

        {stadiumBgPreview && previewOpp && (
          <div className="relative rounded-xl overflow-hidden border border-border/40 mb-4 h-32">
            <img
              src={stadiumBgPreview}
              alt="Stadium"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-background/55" />
            <div className="absolute inset-0 flex items-center justify-center gap-5">
              {previewOpp.logoId && TEAM_LOGOS[previewOpp.logoId] && (
                <img
                  src={TEAM_LOGOS[previewOpp.logoId]}
                  alt={previewOpp.name}
                  className="w-14 h-14 object-contain drop-shadow-lg"
                />
              )}
              <div className="text-center">
                <div className="font-display text-2xl font-black text-white">
                  {previewOpp.city}
                </div>
                <div
                  className="font-display text-lg font-bold"
                  style={{ color: previewOpp.primaryColor }}
                >
                  {previewOpp.name}
                </div>
              </div>
            </div>
          </div>
        )}

        <Card className="bg-card border-border/50">
          <CardContent className="py-6 text-center space-y-5">
            {!previewOpp && <div className="text-5xl">🏈</div>}
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
                      <div className="flex items-center gap-2">
                        {team.logoId && TEAM_LOGOS[team.logoId] && (
                          <img
                            src={TEAM_LOGOS[team.logoId]}
                            alt={team.name}
                            className="w-5 h-5 object-contain shrink-0"
                          />
                        )}
                        {team.city} {team.name} ({team.abbreviation})
                      </div>
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

  const isOver = driveState.isGameOver;
  const userWon = driveState.userScore > driveState.opponentScore;

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto space-y-3">
      {/* Scoreboard */}
      <div className="rounded-xl overflow-hidden border border-border/50 shadow-lg">
        <div
          className="relative px-4 py-2 text-center overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, oklch(18% 0.04 265), oklch(22% 0.05 265))",
          }}
        >
          <span className="relative z-10 text-xs font-black text-white/60 uppercase tracking-[0.2em]">
            {isOver ? "✦ FINAL ✦" : `Q${driveState.quarter} — IN PROGRESS`}
          </span>
        </div>
        <div className="bg-card flex items-stretch">
          <div className="flex-1 flex items-center justify-center gap-3 py-4 px-4">
            {userLogoSrc && (
              <img
                src={userLogoSrc}
                alt={userTeam.abbreviation}
                className="w-8 h-8 object-contain shrink-0"
              />
            )}
            <div className="text-center">
              <div className="font-display text-xl font-black text-primary leading-none">
                {userTeam.abbreviation}
              </div>
              <div className="font-display text-5xl font-black text-foreground mt-1 leading-none">
                {driveState.userScore}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center px-2">
            <div className="h-16 w-px bg-border/40" />
          </div>
          <div className="flex-1 flex items-center justify-center gap-3 py-4 px-4">
            {oppLogoSrc && (
              <img
                src={oppLogoSrc}
                alt={opponent?.abbreviation}
                className="w-8 h-8 object-contain shrink-0"
              />
            )}
            <div className="text-center">
              <div
                className="font-display text-xl font-black leading-none"
                style={{ color: opponent?.primaryColor ?? "#888" }}
              >
                {opponent?.abbreviation ?? "CPU"}
              </div>
              <div className="font-display text-5xl font-black text-foreground mt-1 leading-none">
                {driveState.opponentScore}
              </div>
            </div>
          </div>
        </div>
        {!isOver && (
          <div className="bg-secondary/40 px-4 py-2 text-center border-t border-border/20">
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
            data-ocid="play.save_result.button"
            onClick={handleSaveResult}
            className="mt-4 bg-primary text-primary-foreground font-display font-bold gold-glow"
          >
            Save Result to Season
          </Button>
        </motion.div>
      )}

      {/* QB Perspective Field */}
      {!isOver && (
        <QBFieldView
          play={currentPlay}
          phase={phase}
          pressureFraction={pressureFraction}
          selectedReceiver={selectedReceiver}
          onReceiverSelect={handleReceiverSelect}
          stadiumBg={stadiumBg}
          userTeamColor={userTeam.primaryColor}
          opponentColor={opponent?.primaryColor ?? "oklch(65% 0.22 25)"}
        />
      )}

      {/* Coverage legend */}
      {!isOver &&
        phase === "pocket" &&
        currentPlay?.type !== "runLeft" &&
        currentPlay?.type !== "runRight" && (
          <div className="flex items-center justify-center gap-5">
            {(["open", "contested", "covered"] as const).map((c) => (
              <div key={c} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    background:
                      c === "open"
                        ? "oklch(72% 0.22 142)"
                        : c === "contested"
                          ? "oklch(78% 0.20 85)"
                          : "oklch(65% 0.22 25)",
                  }}
                />
                <span className="text-xs text-muted-foreground capitalize font-medium">
                  {c}
                </span>
              </div>
            ))}
          </div>
        )}

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

      {/* Play Call UI */}
      {!isOver && (
        <AnimatePresence mode="wait">
          {phase === "idle" || phase === "result" ? (
            <PlayCallGrid
              key="play-grid"
              plays={playOptions}
              onSelect={handleSelectPlay}
            />
          ) : phase === "pre_snap" && currentPlay ? (
            <motion.div
              key="pre-snap"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="rounded-xl bg-secondary/60 border border-border/40 p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-2xl shrink-0">
                  {currentPlay.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-black text-foreground text-base">
                    {currentPlay.label.toUpperCase()}
                  </div>
                  <div className="text-muted-foreground text-xs mt-0.5">
                    {currentPlay.receivers.length} options on this play
                  </div>
                </div>
                <Badge className="bg-primary/20 text-primary border-primary/30 font-bold text-xs shrink-0">
                  {currentPlay.type === "runLeft" ||
                  currentPlay.type === "runRight"
                    ? "RUN"
                    : "PASS"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  data-ocid="play.change_play.button"
                  variant="outline"
                  onClick={handleChangePlay}
                  className="h-12 font-display font-bold border-border/50"
                >
                  ↩ Audible
                </Button>
                <Button
                  data-ocid="play.snap.button"
                  onClick={handleSnap}
                  className="h-12 font-display font-black text-base bg-primary text-primary-foreground hover:bg-primary/90 gold-glow"
                >
                  HUT HUT! 🏈
                </Button>
              </div>
            </motion.div>
          ) : phase === "pocket" ? (
            <motion.div
              key="pocket"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-1"
            >
              <div
                className="font-display font-black text-lg"
                style={{
                  color:
                    pressureFraction < 0.5
                      ? "oklch(72% 0.22 142)"
                      : pressureFraction < 0.75
                        ? "oklch(78% 0.20 85)"
                        : "oklch(60% 0.28 25)",
                }}
              >
                {pressureFraction < 0.5
                  ? "YOU'RE IN THE POCKET"
                  : pressureFraction < 0.75
                    ? "PRESSURE COMING!"
                    : "THROW IT NOW!"}
              </div>
              <div className="text-muted-foreground text-xs mt-0.5">
                Tap a{" "}
                {currentPlay?.type === "runLeft" ||
                currentPlay?.type === "runRight"
                  ? "gap"
                  : "receiver"}{" "}
                on the field
              </div>
            </motion.div>
          ) : phase === "throwing" ? (
            <motion.div
              key="throwing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-2"
            >
              <div className="font-display font-black text-primary text-xl animate-pulse">
                BALL IN AIR... 🏈
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      )}

      {/* End Game */}
      {!isOver && phase === "idle" && (
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
                    // biome-ignore lint/suspicious/noArrayIndexKey: stable reverse order
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
