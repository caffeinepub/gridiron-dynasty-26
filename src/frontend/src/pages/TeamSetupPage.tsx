import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { JERSEY_IMAGES, STADIUM_IMAGES, TEAM_LOGOS } from "../assets";
import type { Team } from "../types";

interface TeamSetupPageProps {
  onTeamCreated: (team: Team) => void;
}

type Step = 1 | 2 | 3;

const JERSEY_OPTIONS: Array<{
  key: "home" | "away" | "alternate";
  label: string;
}> = [
  { key: "home", label: "HOME" },
  { key: "away", label: "AWAY" },
  { key: "alternate", label: "ALTERNATE" },
];

const HELMET_OPTIONS: Array<{
  key: "classic" | "matte" | "chrome";
  label: string;
  symbol: string;
}> = [
  { key: "classic", label: "Classic", symbol: "⬦" },
  { key: "matte", label: "Matte", symbol: "●" },
  { key: "chrome", label: "Chrome", symbol: "◆" },
];

const STADIUM_OPTIONS: Array<{
  key: "dome" | "outdoor" | "coastal";
  label: string;
}> = [
  { key: "dome", label: "DOME" },
  { key: "outdoor", label: "OUTDOOR" },
  { key: "coastal", label: "COASTAL" },
];

export default function TeamSetupPage({ onTeamCreated }: TeamSetupPageProps) {
  const [step, setStep] = useState<Step>(1);

  // Step 1: Identity
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [abbreviation, setAbbreviation] = useState("");

  // Step 2: Look
  const [jerseyStyle, setJerseyStyle] = useState<"home" | "away" | "alternate">(
    "home",
  );
  const [helmetStyle, setHelmetStyle] = useState<
    "classic" | "matte" | "chrome"
  >("classic");
  const [primaryColor, setPrimaryColor] = useState("#C8A000");
  const [secondaryColor, setSecondaryColor] = useState("#1B2A4A");

  // Step 3: Stadium & Logo
  const [stadiumStyle, setStadiumStyle] = useState<
    "dome" | "outdoor" | "coastal"
  >("outdoor");
  const [logoId, setLogoId] = useState<number>(1);

  function validateStep1(): boolean {
    if (!name.trim() || !city.trim() || !abbreviation.trim()) {
      toast.error("Please fill in all fields.");
      return false;
    }
    if (abbreviation.length < 2 || abbreviation.length > 4) {
      toast.error("Abbreviation must be 2–4 characters.");
      return false;
    }
    return true;
  }

  function handleNext() {
    if (step === 1 && !validateStep1()) return;
    setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  }

  function handleBack() {
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  }

  function handleCreate() {
    if (!validateStep1()) return;
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
      jerseyStyle,
      helmetStyle,
      stadiumStyle,
      logoId,
    };
    onTeamCreated(team);
    toast.success(`${city} ${name} created! Time to build a dynasty.`);
  }

  const stepLabels = ["Identity", "Look", "Stadium"];

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 pt-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-0 w-full h-1.5"
          style={{
            background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
          }}
        />
        <div
          className="absolute top-1/3 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background: primaryColor, filter: "blur(80px)" }}
        />
        <div
          className="absolute bottom-1/4 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: secondaryColor, filter: "blur(80px)" }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 mb-4">
            <span className="text-3xl">🏈</span>
          </div>
          <h1 className="font-display text-4xl font-black text-primary tracking-tight leading-none">
            GRIDIRON
          </h1>
          <h2 className="font-display text-xl font-bold text-foreground/50 tracking-[0.3em] uppercase mt-1">
            Dynasty 26
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Build your legacy. Rule the league.
          </p>
        </div>

        {/* Step Progress */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {stepLabels.map((label, i) => {
            const stepNum = (i + 1) as Step;
            const isActive = step === stepNum;
            const isComplete = step > stepNum;
            return (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 border ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_oklch(78%_0.18_85/0.5)]"
                        : isComplete
                          ? "bg-primary/20 text-primary border-primary/40"
                          : "bg-secondary/50 text-muted-foreground border-border/30"
                    }`}
                  >
                    {isComplete ? "✓" : stepNum}
                  </div>
                  <span
                    className={`text-[10px] font-bold mt-1 uppercase tracking-wider ${isActive ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {label}
                  </span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div
                    className={`w-16 h-px mx-2 mb-5 transition-all duration-500 ${step > stepNum ? "bg-primary/40" : "bg-border/30"}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div className="bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-6 space-y-5">
                <h3 className="font-display text-lg font-black text-primary uppercase tracking-wide">
                  Step 1 — Identity
                </h3>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="city"
                    className="text-sm font-semibold text-foreground/70 uppercase tracking-wider text-xs"
                  >
                    City
                  </Label>
                  <Input
                    id="city"
                    data-ocid="teamsetup.city.input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Las Vegas"
                    className="bg-secondary/40 border-border/40 focus:border-primary h-12 text-base"
                    maxLength={32}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="name"
                    className="text-sm font-semibold text-foreground/70 uppercase tracking-wider text-xs"
                  >
                    Team Name
                  </Label>
                  <Input
                    id="name"
                    data-ocid="teamsetup.name.input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Thunderbolts"
                    className="bg-secondary/40 border-border/40 focus:border-primary h-12 text-base"
                    maxLength={32}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="abbr"
                    className="text-sm font-semibold text-foreground/70 uppercase tracking-wider text-xs"
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
                    className="bg-secondary/40 border-border/40 focus:border-primary h-12 text-base uppercase tracking-widest font-bold"
                    maxLength={4}
                  />
                </div>

                {/* Preview */}
                {(city || name) && (
                  <div
                    className="rounded-xl p-4 text-center font-display font-black text-white text-lg tracking-wide"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}dd, ${secondaryColor}cc)`,
                    }}
                  >
                    {city} {name}
                    {abbreviation && ` • ${abbreviation}`}
                  </div>
                )}
              </div>

              <Button
                data-ocid="teamsetup.submit_button"
                onClick={handleNext}
                className="w-full font-display font-black text-base h-13 bg-primary text-primary-foreground hover:bg-primary/90 gold-glow h-12"
              >
                Next: Choose Your Look →
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div className="bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-6 space-y-6">
                <h3 className="font-display text-lg font-black text-primary uppercase tracking-wide">
                  Step 2 — Look
                </h3>

                {/* Jersey Picker */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Jersey Style
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {JERSEY_OPTIONS.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setJerseyStyle(key)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 group ${
                          jerseyStyle === key
                            ? "border-primary shadow-[0_0_16px_oklch(78%_0.18_85/0.4)]"
                            : "border-border/30 hover:border-border/60"
                        }`}
                      >
                        <img
                          src={JERSEY_IMAGES[key]}
                          alt={label}
                          className="w-full object-cover"
                          style={{ height: "100px" }}
                        />
                        <div
                          className={`absolute inset-0 transition-opacity ${
                            jerseyStyle === key
                              ? "opacity-0"
                              : "opacity-40 bg-background/60"
                          }`}
                        />
                        <div className="absolute bottom-0 left-0 right-0 py-1.5 bg-background/80 text-center">
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider ${jerseyStyle === key ? "text-primary" : "text-muted-foreground"}`}
                          >
                            {label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Helmet Picker */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Helmet Style
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {HELMET_OPTIONS.map(({ key, label, symbol }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setHelmetStyle(key)}
                        className={`h-12 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                          helmetStyle === key
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/30 bg-secondary/30 text-muted-foreground hover:border-border/60 hover:text-foreground"
                        }`}
                      >
                        <span>{symbol}</span>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Pickers */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="primary"
                      className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                    >
                      Primary Color
                    </Label>
                    <div className="flex items-center gap-3 bg-secondary/30 rounded-xl p-3 border border-border/30">
                      <input
                        id="primary"
                        data-ocid="teamsetup.primary_color.input"
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                        style={{ WebkitAppearance: "none" }}
                      />
                      <span className="text-xs text-muted-foreground font-mono">
                        {primaryColor}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="secondary"
                      className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                    >
                      Secondary Color
                    </Label>
                    <div className="flex items-center gap-3 bg-secondary/30 rounded-xl p-3 border border-border/30">
                      <input
                        id="secondary"
                        data-ocid="teamsetup.secondary_color.input"
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                        style={{ WebkitAppearance: "none" }}
                      />
                      <span className="text-xs text-muted-foreground font-mono">
                        {secondaryColor}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Jersey Preview with color tint */}
                <div className="relative rounded-xl overflow-hidden border border-border/30">
                  <div className="flex items-center justify-center p-4 bg-secondary/20">
                    <div className="relative">
                      <img
                        src={JERSEY_IMAGES[jerseyStyle]}
                        alt="Jersey preview"
                        className="h-32 object-contain relative z-10"
                        style={{
                          filter: `drop-shadow(0 0 16px ${primaryColor}80)`,
                        }}
                      />
                      {/* Color overlay */}
                      <div
                        className="absolute inset-0 mix-blend-color opacity-60 z-20 pointer-events-none"
                        style={{ background: primaryColor }}
                      />
                    </div>
                    <div className="ml-6 text-center">
                      <div
                        className="font-display text-3xl font-black"
                        style={{
                          color: primaryColor,
                          textShadow: `0 0 12px ${primaryColor}60`,
                        }}
                      >
                        {abbreviation || "XXX"}
                      </div>
                      <div className="text-sm font-bold text-foreground/60 mt-1">
                        {city || "City"} {name || "Team"}
                      </div>
                      <div className="flex items-center gap-2 mt-2 justify-center">
                        <div
                          className="w-5 h-5 rounded-full border-2 border-border/50"
                          style={{ background: primaryColor }}
                        />
                        <div
                          className="w-5 h-5 rounded-full border-2 border-border/50"
                          style={{ background: secondaryColor }}
                        />
                        <span className="text-xs text-muted-foreground font-medium">
                          {helmetStyle} helmet
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="h-12 font-display font-bold border-border/40"
                  data-ocid="teamsetup.cancel_button"
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="h-12 font-display font-black bg-primary text-primary-foreground gold-glow"
                  data-ocid="teamsetup.submit_button"
                >
                  Next: Stadium →
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div className="bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-6 space-y-6">
                <h3 className="font-display text-lg font-black text-primary uppercase tracking-wide">
                  Step 3 — Stadium &amp; Logo
                </h3>

                {/* Stadium Picker */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Home Stadium
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {STADIUM_OPTIONS.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setStadiumStyle(key)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                          stadiumStyle === key
                            ? "border-primary shadow-[0_0_16px_oklch(78%_0.18_85/0.4)]"
                            : "border-border/30 hover:border-border/60"
                        }`}
                      >
                        <img
                          src={STADIUM_IMAGES[key]}
                          alt={label}
                          className="w-full object-cover"
                          style={{ height: "70px" }}
                        />
                        <div
                          className={`absolute inset-0 transition-opacity ${
                            stadiumStyle === key
                              ? "opacity-0"
                              : "bg-background/50"
                          }`}
                        />
                        <div className="absolute bottom-0 left-0 right-0 py-1 bg-background/75 text-center">
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider ${stadiumStyle === key ? "text-primary" : "text-muted-foreground"}`}
                          >
                            {label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo Picker */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Team Logo
                  </Label>
                  <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setLogoId(id)}
                        className={`aspect-square rounded-xl border-2 bg-secondary/30 flex items-center justify-center p-2 transition-all duration-200 ${
                          logoId === id
                            ? "border-primary bg-primary/10 shadow-[0_0_12px_oklch(78%_0.18_85/0.35)]"
                            : "border-border/20 hover:border-border/50"
                        }`}
                      >
                        <img
                          src={TEAM_LOGOS[id]}
                          alt={`Logo ${id}`}
                          className="w-full h-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stadium + Logo Preview */}
                <div className="relative rounded-xl overflow-hidden border border-border/30 h-28">
                  <img
                    src={STADIUM_IMAGES[stadiumStyle]}
                    alt="Stadium preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-background/60" />
                  <div className="absolute inset-0 flex items-center justify-center gap-4">
                    <img
                      src={TEAM_LOGOS[logoId]}
                      alt="Team logo"
                      className="w-16 h-16 object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                    />
                    <div className="text-center">
                      <div
                        className="font-display text-2xl font-black"
                        style={{ color: primaryColor }}
                      >
                        {city || "City"}
                      </div>
                      <div className="font-display text-lg font-bold text-white/80">
                        {name || "Team Name"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="h-12 font-display font-bold border-border/40"
                  data-ocid="teamsetup.cancel_button"
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleCreate}
                  className="h-12 font-display font-black text-base bg-primary text-primary-foreground gold-glow"
                  data-ocid="teamsetup.submit_button"
                >
                  CREATE TEAM 🏈
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
