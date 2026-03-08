import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import type { Team } from "../types";

interface TeamSetupPageProps {
  onTeamCreated: (team: Team) => void;
}

export default function TeamSetupPage({ onTeamCreated }: TeamSetupPageProps) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#C8A000");
  const [secondaryColor, setSecondaryColor] = useState("#1B2A4A");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !city.trim() || !abbreviation.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (abbreviation.length < 2 || abbreviation.length > 4) {
      toast.error("Abbreviation must be 2–4 characters.");
      return;
    }

    const team: Team = {
      id: 0,
      name: name.trim(),
      city: city.trim(),
      abbreviation: abbreviation.toUpperCase().trim(),
      primaryColor,
      secondaryColor,
      wins: 0,
      losses: 0,
      isUserTeam: true,
    };

    onTeamCreated(team);
    toast.success(`${city} ${name} created! Time to build a dynasty.`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-0 w-full h-2"
          style={{ background: primaryColor }}
        />
        <div
          className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-5"
          style={{ background: primaryColor, filter: "blur(60px)" }}
        />
        <div
          className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full opacity-5"
          style={{ background: secondaryColor, filter: "blur(60px)" }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🏈</div>
          <h1 className="font-display text-4xl font-black text-primary tracking-tight">
            GRIDIRON
          </h1>
          <h2 className="font-display text-2xl font-bold text-foreground/80 tracking-widest uppercase">
            Dynasty 26
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Build your legacy. Rule the league.
          </p>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-xl text-primary">
              Create Your Team
            </CardTitle>
            <CardDescription>
              Set up your franchise to start the season
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="city"
                  className="text-sm font-medium text-foreground/80"
                >
                  City
                </Label>
                <Input
                  id="city"
                  data-ocid="teamsetup.city.input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Las Vegas"
                  className="bg-secondary/50 border-border/50 focus:border-primary"
                  maxLength={32}
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-foreground/80"
                >
                  Team Name
                </Label>
                <Input
                  id="name"
                  data-ocid="teamsetup.name.input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Thunderbolts"
                  className="bg-secondary/50 border-border/50 focus:border-primary"
                  maxLength={32}
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="abbr"
                  className="text-sm font-medium text-foreground/80"
                >
                  Abbreviation (2–4 letters)
                </Label>
                <Input
                  id="abbr"
                  data-ocid="teamsetup.abbreviation.input"
                  value={abbreviation}
                  onChange={(e) =>
                    setAbbreviation(
                      e.target.value.toUpperCase().replace(/[^A-Z]/g, ""),
                    )
                  }
                  placeholder="e.g. LVT"
                  className="bg-secondary/50 border-border/50 focus:border-primary uppercase tracking-widest font-bold"
                  maxLength={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="primary"
                    className="text-sm font-medium text-foreground/80"
                  >
                    Primary Color
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="primary"
                      data-ocid="teamsetup.primary_color.input"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border border-border/50 bg-secondary/50 p-1"
                    />
                    <span className="text-xs text-muted-foreground font-mono">
                      {primaryColor}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="secondary"
                    className="text-sm font-medium text-foreground/80"
                  >
                    Secondary Color
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="secondary"
                      data-ocid="teamsetup.secondary_color.input"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border border-border/50 bg-secondary/50 p-1"
                    />
                    <span className="text-xs text-muted-foreground font-mono">
                      {secondaryColor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {(city || name) && (
                <div
                  className="rounded-lg p-4 text-center font-display font-black text-white text-lg tracking-wide"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  }}
                >
                  {city} {name} {abbreviation && `• ${abbreviation}`}
                </div>
              )}

              <Button
                type="submit"
                data-ocid="teamsetup.submit_button"
                className="w-full font-display font-bold text-base h-12 bg-primary text-primary-foreground hover:bg-primary/90 gold-glow"
              >
                CREATE TEAM & START SEASON 🏈
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
