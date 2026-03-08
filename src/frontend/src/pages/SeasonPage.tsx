import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Coins, RotateCcw, Trophy } from "lucide-react";
import { useState } from "react";
import { AI_TEAMS } from "../gameLogic";
import type { PlayoffState, ScheduledGame, Team } from "../types";

interface SeasonPageProps {
  userTeam: Team;
  schedule: ScheduledGame[];
  onResetSeason: () => void;
  coins: number;
  playoffState: PlayoffState | null;
  onEnterPlayoffs: () => void;
}

export default function SeasonPage({
  userTeam,
  schedule,
  onResetSeason,
  coins,
  playoffState,
  onEnterPlayoffs,
}: SeasonPageProps) {
  const [activeTab, setActiveTab] = useState("schedule");

  // Build standings: user team + all AI teams with simulated records from schedule
  const allTeams: Team[] = [userTeam, ...AI_TEAMS];

  // Calculate records from schedule for user team
  const userRecord = { wins: userTeam.wins, losses: userTeam.losses };

  // Give AI teams some simulated records (based on their seed)
  const aiRecords = AI_TEAMS.map((team) => {
    const base = (team.id * 3) % 9;
    return {
      id: team.id,
      wins: base,
      losses: 8 - base,
    };
  });

  const standings = allTeams
    .map((team) => {
      if (team.isUserTeam)
        return { ...team, wins: userRecord.wins, losses: userRecord.losses };
      const rec = aiRecords.find((r) => r.id === team.id);
      return { ...team, wins: rec?.wins ?? 0, losses: rec?.losses ?? 0 };
    })
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses);

  const allGamesPlayed =
    schedule.length > 0 && schedule.every((g) => g.isPlayed);
  const canEnterPlayoffs = allGamesPlayed && !playoffState;

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-black text-foreground">
            Season
          </h1>
          <div className="flex items-center gap-1.5 bg-yellow-900/20 border border-yellow-600/30 rounded-full px-2.5 py-1">
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
            <span className="font-display font-black text-sm text-yellow-400">
              {coins}
            </span>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              data-ocid="season.reset.button"
              variant="outline"
              size="sm"
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Reset
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent
            className="bg-card border-border/50"
            data-ocid="season.dialog"
          >
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display text-destructive">
                Reset Season?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will clear all game results and standings. Your team will
                remain.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                data-ocid="season.cancel_button"
                className="border-border/50"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                data-ocid="season.confirm_button"
                onClick={onResetSeason}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Reset Season
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Enter Playoffs Banner */}
      {canEnterPlayoffs && (
        <div className="bg-gradient-to-r from-yellow-900/40 via-amber-800/30 to-yellow-900/40 border border-yellow-500/50 rounded-xl p-4 mb-4 flex items-center justify-between">
          <div>
            <div className="font-display font-black text-base text-yellow-400">
              Season Complete!
            </div>
            <div className="text-sm text-yellow-400/70">
              {userTeam.wins}–{userTeam.losses} record
            </div>
          </div>
          <Button
            data-ocid="season.playoffs.button"
            onClick={onEnterPlayoffs}
            className="bg-yellow-500 text-black font-display font-black hover:bg-yellow-400 gold-glow"
          >
            <Trophy className="w-4 h-4 mr-1.5" />
            Enter Playoffs
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-secondary/50 mb-4">
          <TabsTrigger
            value="schedule"
            data-ocid="season.schedule.tab"
            className="flex-1 font-display font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Calendar className="w-4 h-4 mr-1.5" />
            Schedule
          </TabsTrigger>
          <TabsTrigger
            value="standings"
            data-ocid="season.standings.tab"
            className="flex-1 font-display font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Trophy className="w-4 h-4 mr-1.5" />
            Standings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-2 mt-0">
          {schedule.length === 0 ? (
            <div
              data-ocid="season.empty_state"
              className="text-center py-12 text-muted-foreground"
            >
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-display font-bold">No games scheduled</p>
            </div>
          ) : (
            schedule.map((game) => {
              const isHome = game.homeTeamId === userTeam.id;
              const oppId = isHome ? game.awayTeamId : game.homeTeamId;
              const opponent = AI_TEAMS.find((t) => t.id === oppId);
              const userScore = isHome ? game.homeScore : game.awayScore;
              const oppScore = isHome ? game.awayScore : game.homeScore;
              const won = game.isPlayed && userScore > oppScore;
              const lost = game.isPlayed && userScore < oppScore;

              return (
                <Card
                  key={game.id}
                  className={`bg-card border-border/30 ${game.isPlayed ? "opacity-80" : ""}`}
                >
                  <CardContent className="flex items-center gap-3 px-4 py-3">
                    <div className="text-xs text-muted-foreground font-bold w-12 shrink-0">
                      WK {game.week}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm text-primary">
                          {userTeam.abbreviation}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {isHome ? "vs" : "@"}
                        </span>
                        <span
                          className="font-display font-bold text-sm"
                          style={{ color: opponent?.primaryColor ?? "#888" }}
                        >
                          {opponent?.abbreviation ?? "???"}
                        </span>
                      </div>
                      {!game.isPlayed && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {opponent?.city} {opponent?.name}
                        </div>
                      )}
                    </div>
                    {game.isPlayed ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-display font-bold text-sm">
                          {userScore}–{oppScore}
                        </span>
                        <Badge
                          className={`font-display font-bold text-xs px-2 ${won ? "bg-accent/20 text-accent border-accent/30" : lost ? "bg-destructive/20 text-destructive border-destructive/30" : "bg-secondary text-muted-foreground"}`}
                        >
                          {won ? "W" : lost ? "L" : "T"}
                        </Badge>
                      </div>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground border-border/50 shrink-0"
                      >
                        Upcoming
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="standings" className="mt-0">
          <Card className="bg-card border-border/30">
            <CardContent className="p-0">
              <div className="flex items-center px-4 py-2 text-xs text-muted-foreground font-medium border-b border-border/30">
                <div className="w-8">#</div>
                <div className="flex-1">Team</div>
                <div className="w-8 text-center">W</div>
                <div className="w-8 text-center">L</div>
                <div className="w-12 text-center">PCT</div>
              </div>
              {standings.map((team, idx) => {
                const pct =
                  team.wins + team.losses > 0
                    ? (team.wins / (team.wins + team.losses)).toFixed(3)
                    : ".000";
                const isUser = team.id === userTeam.id;
                return (
                  <div
                    key={team.id}
                    className={`flex items-center px-4 py-2.5 border-b border-border/20 last:border-0 ${isUser ? "bg-primary/10" : ""}`}
                  >
                    <div className="w-8 text-sm text-muted-foreground font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {isUser && (
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                        <span
                          className={`font-display font-bold text-sm ${isUser ? "text-primary" : "text-foreground"}`}
                        >
                          {team.abbreviation}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {team.city}
                        </span>
                      </div>
                    </div>
                    <div className="w-8 text-center font-bold text-sm text-foreground">
                      {team.wins}
                    </div>
                    <div className="w-8 text-center text-sm text-muted-foreground">
                      {team.losses}
                    </div>
                    <div className="w-12 text-center text-xs text-muted-foreground">
                      {pct}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
