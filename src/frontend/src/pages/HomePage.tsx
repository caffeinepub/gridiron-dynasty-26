import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, PlayCircle, Trophy, Zap } from "lucide-react";
import { TEAM_LOGOS } from "../assets";
import { AI_TEAMS } from "../gameLogic";
import type { ScheduledGame, Team } from "../types";

interface HomePageProps {
  userTeam: Team;
  schedule: ScheduledGame[];
  onPlayNextGame: () => void;
  onSimulateGame: () => void;
}

export default function HomePage({
  userTeam,
  schedule,
  onPlayNextGame,
  onSimulateGame,
}: HomePageProps) {
  const gamesPlayed = schedule.filter((g) => g.isPlayed).length;
  const totalGames = schedule.length;
  const progressPct = totalGames > 0 ? (gamesPlayed / totalGames) * 100 : 0;

  const nextGame = schedule.find((g) => !g.isPlayed);
  const opponentId = nextGame
    ? nextGame.homeTeamId === userTeam.id
      ? nextGame.awayTeamId
      : nextGame.homeTeamId
    : null;
  const opponent = opponentId
    ? AI_TEAMS.find((t) => t.id === opponentId)
    : null;

  const recentGames = schedule
    .filter((g) => g.isPlayed)
    .slice(-3)
    .reverse();

  return (
    <div className="p-4 space-y-4 pb-24 max-w-xl mx-auto">
      {/* Team Banner */}
      <div
        className="rounded-xl p-5 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${userTeam.primaryColor}dd, ${userTeam.secondaryColor}cc)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)",
          }}
        />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Team logo */}
              {userTeam.logoId && TEAM_LOGOS[userTeam.logoId] ? (
                <img
                  src={TEAM_LOGOS[userTeam.logoId]}
                  alt={userTeam.name}
                  className="w-12 h-12 object-contain drop-shadow-lg shrink-0"
                />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center text-2xl shrink-0">
                  🏈
                </div>
              )}
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-widest">
                  {userTeam.city}
                </p>
                <h1 className="font-display text-3xl font-black text-white leading-none mt-0.5">
                  {userTeam.name}
                </h1>
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-4xl font-black text-white leading-none">
                {userTeam.abbreviation}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="bg-white/20 rounded-lg px-3 py-1.5 text-center">
              <div className="font-display text-2xl font-black text-white leading-none">
                {userTeam.wins}
              </div>
              <div className="text-white/60 text-xs">WINS</div>
            </div>
            <div className="text-white/50 font-bold text-xl">–</div>
            <div className="bg-white/10 rounded-lg px-3 py-1.5 text-center">
              <div className="font-display text-2xl font-black text-white leading-none">
                {userTeam.losses}
              </div>
              <div className="text-white/60 text-xs">LOSSES</div>
            </div>
            <div className="ml-auto">
              <div className="text-white/70 text-xs text-right mb-1">
                Season Progress
              </div>
              <div className="text-white font-bold text-sm">
                {gamesPlayed}/{totalGames} games
              </div>
            </div>
          </div>
          <Progress value={progressPct} className="mt-3 h-2 bg-white/20" />
        </div>
      </div>

      {/* Next Game Card */}
      {nextGame && opponent ? (
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Week {nextGame.week} — Next Game
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                {userTeam.logoId && TEAM_LOGOS[userTeam.logoId] ? (
                  <img
                    src={TEAM_LOGOS[userTeam.logoId]}
                    alt={userTeam.abbreviation}
                    className="w-10 h-10 mx-auto object-contain mb-1"
                  />
                ) : (
                  <div className="text-2xl mb-1">🏈</div>
                )}
                <div className="font-display text-2xl font-black text-primary">
                  {userTeam.abbreviation}
                </div>
                <div className="text-xs text-muted-foreground">
                  {userTeam.city}
                </div>
              </div>
              <div className="font-display text-xl font-black text-muted-foreground">
                VS
              </div>
              <div className="text-center">
                {opponent.logoId && TEAM_LOGOS[opponent.logoId] ? (
                  <img
                    src={TEAM_LOGOS[opponent.logoId]}
                    alt={opponent.abbreviation}
                    className="w-10 h-10 mx-auto object-contain mb-1"
                  />
                ) : (
                  <div className="text-2xl mb-1">🏈</div>
                )}
                <div
                  className="font-display text-2xl font-black"
                  style={{ color: opponent.primaryColor }}
                >
                  {opponent.abbreviation}
                </div>
                <div className="text-xs text-muted-foreground">
                  {opponent.city}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                data-ocid="home.play_next.button"
                onClick={onPlayNextGame}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-display font-bold h-11 gold-glow"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                PLAY GAME
              </Button>
              <Button
                data-ocid="home.simulate_game.button"
                onClick={onSimulateGame}
                variant="outline"
                className="border-border/50 hover:bg-secondary font-display font-bold h-11"
              >
                <Zap className="w-4 h-4 mr-2" />
                SIMULATE
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border/50">
          <CardContent className="py-8 text-center">
            <Trophy className="w-12 h-12 mx-auto text-primary mb-3" />
            <h3 className="font-display text-lg font-bold text-foreground">
              Season Complete!
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              Final record: {userTeam.wins}W – {userTeam.losses}L
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent Results */}
      {recentGames.length > 0 && (
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Recent Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentGames.map((game) => {
              const oppId =
                game.homeTeamId === userTeam.id
                  ? game.awayTeamId
                  : game.homeTeamId;
              const opp = AI_TEAMS.find((t) => t.id === oppId);
              const isHome = game.homeTeamId === userTeam.id;
              const userScore = isHome ? game.homeScore : game.awayScore;
              const oppScore = isHome ? game.awayScore : game.homeScore;
              const won = userScore > oppScore;
              return (
                <div
                  key={game.id}
                  className="flex items-center justify-between py-2 border-t border-border/30 first:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`font-display font-bold text-xs w-6 h-6 flex items-center justify-center p-0 ${won ? "bg-accent/20 text-accent border-accent/30" : "bg-destructive/20 text-destructive border-destructive/30"}`}
                    >
                      {won ? "W" : "L"}
                    </Badge>
                    {opp?.logoId && TEAM_LOGOS[opp.logoId] && (
                      <img
                        src={TEAM_LOGOS[opp.logoId]}
                        alt={opp.abbreviation}
                        className="w-5 h-5 object-contain"
                      />
                    )}
                    <span className="text-sm text-foreground/80">
                      Week {game.week} vs {opp?.abbreviation ?? "???"}
                    </span>
                  </div>
                  <span className="font-display font-bold text-sm">
                    {userScore}–{oppScore}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
