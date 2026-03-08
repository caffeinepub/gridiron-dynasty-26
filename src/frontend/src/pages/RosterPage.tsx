import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Coins, TrendingUp } from "lucide-react";
import { useState } from "react";
import { PLAYER_PORTRAITS } from "../assets";
import { getUpgradeCost } from "../gameLogic";
import type { Player } from "../types";

interface RosterPageProps {
  roster: Player[];
  coins: number;
  onUpgradePlayer: (playerId: number) => void;
}

function getPositionBadgeClass(position: string): string {
  if (position === "QB") return "position-badge-qb";
  if (["RB", "WR", "TE"].includes(position)) return "position-badge-skill";
  if (position === "OL") return "position-badge-ol";
  if (["DL", "LB"].includes(position)) return "position-badge-dl";
  if (["CB", "S"].includes(position)) return "position-badge-db";
  return "position-badge-k";
}

function getOvrColor(ovr: number): string {
  if (ovr >= 90) return "text-yellow-400";
  if (ovr >= 80) return "text-green-400";
  if (ovr >= 70) return "text-blue-400";
  return "text-muted-foreground";
}

type SortKey = "overall" | "position" | "speed";

export default function RosterPage({
  roster,
  coins,
  onUpgradePlayer,
}: RosterPageProps) {
  const [sortBy, setSortBy] = useState<SortKey>("overall");

  const sortedRoster = [...roster].sort((a, b) => {
    if (sortBy === "overall") return b.overall - a.overall;
    if (sortBy === "position")
      return a.position.localeCompare(b.position) || b.overall - a.overall;
    if (sortBy === "speed") return b.speed - a.speed;
    return 0;
  });

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-2xl font-black text-foreground">
            Roster
          </h1>
          <p className="text-muted-foreground text-sm">
            {roster.length} players
          </p>
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
          <SelectTrigger
            data-ocid="roster.sort.select"
            className="w-36 bg-card border-border/50 text-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border/50">
            <SelectItem value="overall">Sort: Overall</SelectItem>
            <SelectItem value="position">Sort: Position</SelectItem>
            <SelectItem value="speed">Sort: Speed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Coin balance */}
      <div className="flex items-center gap-2 bg-yellow-900/20 border border-yellow-600/30 rounded-lg px-3 py-2 mb-3">
        <Coins className="w-4 h-4 text-yellow-400" />
        <span className="font-display font-black text-yellow-400">{coins}</span>
        <span className="text-muted-foreground text-xs">
          coins available for upgrades
        </span>
      </div>

      {/* Column headers */}
      <div className="flex items-center px-3 py-1.5 mb-1">
        <div className="w-14 text-xs text-muted-foreground font-medium">
          PLAYER
        </div>
        <div className="w-10 text-xs text-muted-foreground font-medium ml-1">
          POS
        </div>
        <div className="flex-1 text-xs text-muted-foreground font-medium">
          NAME
        </div>
        <div className="w-10 text-center text-xs text-muted-foreground font-medium">
          OVR
        </div>
        <div className="w-10 text-center text-xs text-muted-foreground font-medium">
          SPD
        </div>
        <div className="w-10 text-center text-xs text-muted-foreground font-medium">
          STR
        </div>
        <div className="w-10 text-center text-xs text-muted-foreground font-medium hidden sm:block">
          AWR
        </div>
        <div className="w-20 text-center text-xs text-muted-foreground font-medium">
          UPGRADE
        </div>
      </div>

      <div className="space-y-1">
        {sortedRoster.map((player, index) => {
          const dataOcid = index < 3 ? `roster.item.${index + 1}` : undefined;
          const upgradeCost = getUpgradeCost(player.overall);
          const canUpgrade = coins >= upgradeCost && player.overall < 99;
          const portraitSrc =
            PLAYER_PORTRAITS[player.position] ?? PLAYER_PORTRAITS.QB;
          return (
            <Card
              key={player.id}
              data-ocid={dataOcid}
              className="bg-card border-border/30 hover:border-border/60 transition-colors"
            >
              <CardContent className="flex items-center px-3 py-2 gap-0">
                {/* Portrait */}
                <div className="w-14 shrink-0 pr-2">
                  <div className="w-10 h-[52px] rounded-lg overflow-hidden border border-border/30 bg-secondary/30">
                    <img
                      src={portraitSrc}
                      alt={player.position}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>
                {/* Position badge */}
                <div className="w-10 shrink-0">
                  <Badge
                    className={`text-xs font-bold px-1.5 py-0.5 ${getPositionBadgeClass(player.position)}`}
                  >
                    {player.position}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground truncate">
                    {player.name}
                  </div>
                </div>
                <div
                  className={`w-10 text-center font-display font-black text-base ${getOvrColor(player.overall)}`}
                >
                  {player.overall}
                </div>
                <div className="w-10 text-center text-sm text-foreground/70">
                  {player.speed}
                </div>
                <div className="w-10 text-center text-sm text-foreground/70">
                  {player.strength}
                </div>
                <div className="w-10 text-center text-sm text-foreground/70 hidden sm:block">
                  {player.awareness}
                </div>
                <div className="w-20 flex flex-col items-center gap-0.5">
                  <Button
                    data-ocid={
                      index < 3 ? `roster.edit_button.${index + 1}` : undefined
                    }
                    size="sm"
                    variant="outline"
                    disabled={!canUpgrade}
                    onClick={() => onUpgradePlayer(player.id)}
                    className={`h-6 px-2 text-xs font-bold ${
                      canUpgrade
                        ? "border-accent/50 text-accent hover:bg-accent/10 hover:border-accent/70"
                        : "border-border/30 text-muted-foreground/40 cursor-not-allowed"
                    }`}
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />↑ UP
                  </Button>
                  <div className="flex items-center gap-0.5 text-xs text-muted-foreground/60">
                    <Coins className="w-2.5 h-2.5 text-yellow-500/60" />
                    <span>{upgradeCost}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {roster.length === 0 && (
        <div
          data-ocid="roster.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <div className="text-4xl mb-3">👤</div>
          <p className="font-display font-bold">No players on roster</p>
        </div>
      )}
    </div>
  );
}
