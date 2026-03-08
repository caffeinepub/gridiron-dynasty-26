import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2, Shield, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { JERSEY_IMAGES, TEAM_LOGOS } from "../assets";
import type { Player, Team } from "../types";

interface TeamPageProps {
  userTeam: Team;
  roster: Player[];
  onUpdateTeam: (team: Team) => void;
  onViewRoster: () => void;
}

function getPositionBadgeClass(position: string): string {
  if (position === "QB") return "position-badge-qb";
  if (["RB", "WR", "TE"].includes(position)) return "position-badge-skill";
  if (position === "OL") return "position-badge-ol";
  if (["DL", "LB"].includes(position)) return "position-badge-dl";
  if (["CB", "S"].includes(position)) return "position-badge-db";
  return "position-badge-k";
}

export default function TeamPage({
  userTeam,
  roster,
  onUpdateTeam,
  onViewRoster,
}: TeamPageProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(userTeam.name);
  const [editPrimary, setEditPrimary] = useState(userTeam.primaryColor);
  const [editSecondary, setEditSecondary] = useState(userTeam.secondaryColor);

  const topPlayers = [...roster]
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 4);
  const avgOverall =
    roster.length > 0
      ? Math.round(
          roster.reduce((sum, p) => sum + p.overall, 0) / roster.length,
        )
      : 0;

  function handleSave() {
    if (!editName.trim()) {
      toast.error("Team name cannot be empty.");
      return;
    }
    onUpdateTeam({
      ...userTeam,
      name: editName.trim(),
      primaryColor: editPrimary,
      secondaryColor: editSecondary,
    });
    toast.success("Team updated!");
    setEditOpen(false);
  }

  const teamLogoSrc = userTeam.logoId ? TEAM_LOGOS[userTeam.logoId] : null;
  const jerseyImgSrc = JERSEY_IMAGES[userTeam.jerseyStyle ?? "home"];

  return (
    <div className="p-4 space-y-4 pb-24 max-w-xl mx-auto">
      {/* Team Card */}
      <div
        className="rounded-xl p-6 relative overflow-hidden"
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
        <div className="relative flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Team logo */}
            {teamLogoSrc ? (
              <img
                src={teamLogoSrc}
                alt={userTeam.name}
                className="w-16 h-16 object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] shrink-0 mt-1"
              />
            ) : (
              <div className="w-16 h-16 flex items-center justify-center text-4xl shrink-0">
                🏈
              </div>
            )}
            <div>
              <p className="text-white/60 text-xs uppercase tracking-widest">
                {userTeam.city}
              </p>
              <h1 className="font-display text-3xl font-black text-white leading-tight mt-0.5">
                {userTeam.name}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-white/20 text-white text-sm font-bold px-3 py-1 rounded-full">
                  {userTeam.wins}W – {userTeam.losses}L
                </span>
              </div>
            </div>
          </div>
          <div className="font-display text-5xl font-black text-white/25 leading-none select-none">
            {userTeam.abbreviation}
          </div>
        </div>
      </div>

      {/* Jersey + Colors Section */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Jersey image */}
            <div className="w-24 shrink-0 flex items-center justify-center">
              <img
                src={jerseyImgSrc}
                alt={`${userTeam.jerseyStyle ?? "home"} jersey`}
                className="h-28 w-auto object-contain"
                style={{
                  filter: `drop-shadow(0 4px 12px ${userTeam.primaryColor}60)`,
                }}
              />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Uniform
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="text-xs capitalize bg-secondary/50 text-foreground/70 border-border/30">
                    {userTeam.jerseyStyle ?? "home"} jersey
                  </Badge>
                  <Badge className="text-xs capitalize bg-secondary/50 text-foreground/70 border-border/30">
                    {userTeam.helmetStyle ?? "classic"} helmet
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Team Colors
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg border-2 border-border/40 shadow-inner"
                      style={{ background: userTeam.primaryColor }}
                    />
                    <span className="text-xs font-mono text-muted-foreground">
                      {userTeam.primaryColor}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg border-2 border-border/40 shadow-inner"
                      style={{ background: userTeam.secondaryColor }}
                    />
                    <span className="text-xs font-mono text-muted-foreground">
                      {userTeam.secondaryColor}
                    </span>
                  </div>
                </div>
              </div>
              {userTeam.stadiumStyle && (
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Stadium
                  </div>
                  <Badge className="text-xs capitalize bg-secondary/50 text-foreground/70 border-border/30">
                    🏟️ {userTeam.stadiumStyle} stadium
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-card border-border/50 text-center">
          <CardContent className="py-4">
            <div className="font-display text-2xl font-black text-primary">
              {roster.length}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Players</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50 text-center">
          <CardContent className="py-4">
            <div className="font-display text-2xl font-black text-foreground">
              {avgOverall}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Avg OVR</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50 text-center">
          <CardContent className="py-4">
            <div className="font-display text-2xl font-black text-accent">
              {userTeam.wins > userTeam.losses
                ? "W"
                : userTeam.wins < userTeam.losses
                  ? "L"
                  : "–"}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Record</div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Team */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full border-border/50 hover:bg-secondary font-display font-bold"
            data-ocid="team.edit_button"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Team
          </Button>
        </DialogTrigger>
        <DialogContent
          className="bg-card border-border/50"
          data-ocid="team.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-primary">
              Edit Team
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Team Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-secondary/50 border-border/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editPrimary}
                    onChange={(e) => setEditPrimary(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-border/50 bg-secondary/50 p-1"
                  />
                  <span className="text-xs text-muted-foreground font-mono">
                    {editPrimary}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editSecondary}
                    onChange={(e) => setEditSecondary(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-border/50 bg-secondary/50 p-1"
                  />
                  <span className="text-xs text-muted-foreground font-mono">
                    {editSecondary}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              data-ocid="team.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-primary text-primary-foreground"
              data-ocid="team.save_button"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Top Players */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Top Players
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {topPlayers.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-secondary/30"
            >
              <div className="flex items-center gap-3">
                <Badge
                  className={`text-xs font-bold px-2 py-0.5 ${getPositionBadgeClass(player.position)}`}
                >
                  {player.position}
                </Badge>
                <span className="font-medium text-sm text-foreground">
                  {player.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="font-display font-black text-lg text-primary">
                  {player.overall}
                </div>
                <div className="text-xs text-muted-foreground">OVR</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* View Full Roster */}
      <Button
        variant="outline"
        className="w-full border-border/50 hover:bg-secondary font-display font-bold"
        onClick={onViewRoster}
        data-ocid="team.secondary_button"
      >
        <Users className="w-4 h-4 mr-2" />
        View Full Roster
      </Button>
    </div>
  );
}
