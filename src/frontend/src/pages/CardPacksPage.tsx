import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, Package, Sparkles, Star, X, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { PLAYER_PORTRAITS } from "../assets";
import { openCardPack } from "../gameLogic";
import type { CardRarity, PackTier, PlayerCard } from "../types";

interface CardPacksPageProps {
  coins: number;
  onOpenPack: (tier: PackTier, cards: PlayerCard[]) => void;
}

const PACK_CONFIG: {
  tier: PackTier;
  label: string;
  cost: number;
  description: string;
  cardCount: string;
  maxOvr: string;
  gradient: string;
  borderColor: string;
  glowColor: string;
  icon: React.ReactNode;
  badgeClass: string;
}[] = [
  {
    tier: "bronze",
    label: "Bronze Pack",
    cost: 100,
    description: "Solid foundation players",
    cardCount: "3 players",
    maxOvr: "up to 79 OVR",
    gradient: "from-orange-900/60 via-amber-800/40 to-orange-900/60",
    borderColor: "border-orange-600/50",
    glowColor: "shadow-orange-600/20",
    icon: <Package className="w-8 h-8 text-orange-400" />,
    badgeClass: "bg-orange-600/20 text-orange-400 border-orange-600/30",
  },
  {
    tier: "silver",
    label: "Silver Pack",
    cost: 300,
    description: "Quality mixed roster cards",
    cardCount: "4 players",
    maxOvr: "up to 87 OVR",
    gradient: "from-slate-600/60 via-gray-500/40 to-slate-600/60",
    borderColor: "border-slate-400/50",
    glowColor: "shadow-slate-400/20",
    icon: <Star className="w-8 h-8 text-slate-300" />,
    badgeClass: "bg-slate-500/20 text-slate-300 border-slate-400/30",
  },
  {
    tier: "gold",
    label: "Gold Pack",
    cost: 600,
    description: "Elite & Rare superstars",
    cardCount: "5 players",
    maxOvr: "up to 95 OVR",
    gradient: "from-yellow-900/60 via-amber-600/40 to-yellow-900/60",
    borderColor: "border-yellow-500/60",
    glowColor: "shadow-yellow-500/30",
    icon: <Sparkles className="w-8 h-8 text-yellow-400" />,
    badgeClass: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
];

function getRarityStyle(rarity: CardRarity): {
  bg: string;
  text: string;
  border: string;
  glow: string;
} {
  switch (rarity) {
    case "Elite":
      return {
        bg: "bg-yellow-900/60",
        text: "text-yellow-300",
        border: "border-yellow-500/60",
        glow: "shadow-yellow-500/40",
      };
    case "Rare":
      return {
        bg: "bg-blue-900/60",
        text: "text-blue-300",
        border: "border-blue-500/60",
        glow: "shadow-blue-500/30",
      };
    default:
      return {
        bg: "bg-slate-800/60",
        text: "text-slate-400",
        border: "border-slate-600/40",
        glow: "shadow-none",
      };
  }
}

function getOvrColor(ovr: number): string {
  if (ovr >= 90) return "text-yellow-400";
  if (ovr >= 80) return "text-green-400";
  if (ovr >= 70) return "text-blue-400";
  return "text-slate-400";
}

function PlayerCardDisplay({
  card,
  index,
}: {
  card: PlayerCard;
  index: number;
}) {
  const rarityStyle = getRarityStyle(card.rarity);
  const portraitSrc = PLAYER_PORTRAITS[card.position] ?? PLAYER_PORTRAITS.QB;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.8, rotateY: -15 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
      transition={{
        delay: index * 0.15,
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      className={`relative rounded-xl border-2 ${rarityStyle.border} overflow-hidden shadow-xl ${rarityStyle.glow} flex flex-col`}
      style={{ minHeight: "200px" }}
    >
      {/* Elite rotating star */}
      {card.rarity === "Elite" && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center z-20"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
        </motion.div>
      )}

      {/* Portrait — top 60% of card */}
      <div className="relative flex-none" style={{ height: "120px" }}>
        <img
          src={portraitSrc}
          alt={card.position}
          className="w-full h-full object-cover object-top"
        />
        {/* Rarity gradient overlay at top */}
        <div
          className={`absolute inset-0 opacity-30 ${rarityStyle.bg}`}
          style={{
            background:
              card.rarity === "Elite"
                ? "linear-gradient(to bottom, rgba(234,179,8,0.4), transparent)"
                : card.rarity === "Rare"
                  ? "linear-gradient(to bottom, rgba(59,130,246,0.3), transparent)"
                  : "linear-gradient(to bottom, rgba(100,116,139,0.2), transparent)",
          }}
        />
        {/* OVR chip */}
        <div className="absolute top-2 left-2 z-10">
          <div
            className={`font-display text-xl font-black leading-none ${getOvrColor(card.overall)} drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]`}
          >
            {card.overall}
          </div>
          <div className="text-[9px] font-bold text-white/60 leading-none">
            OVR
          </div>
        </div>
        {/* Position chip */}
        <div className="absolute bottom-2 right-2 z-10">
          <div className="bg-background/80 backdrop-blur-sm border border-border/40 rounded px-1.5 py-0.5 text-[9px] font-black text-foreground/90">
            {card.position}
          </div>
        </div>
      </div>

      {/* Card bottom — stats area */}
      <div className={`flex-1 ${rarityStyle.bg} p-2`}>
        {/* Rarity badge */}
        <div className="flex items-center justify-between mb-1.5">
          <Badge
            className={`text-[9px] font-bold py-0 px-1.5 h-4 ${rarityStyle.bg} ${rarityStyle.text} border ${rarityStyle.border}`}
          >
            {card.rarity.toUpperCase()}
          </Badge>
        </div>
        {/* Name */}
        <div className="font-display font-black text-xs text-foreground leading-tight truncate mb-2">
          {card.name}
        </div>

        {/* Stats row */}
        <div className="flex justify-between pt-1.5 border-t border-border/20">
          <div className="text-center">
            <div className="text-[8px] text-muted-foreground font-medium">
              SPD
            </div>
            <div className="text-xs font-black text-foreground/90">
              {card.speed}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[8px] text-muted-foreground font-medium">
              STR
            </div>
            <div className="text-xs font-black text-foreground/90">
              {card.strength}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[8px] text-muted-foreground font-medium">
              AWR
            </div>
            <div className="text-xs font-black text-foreground/90">
              {card.awareness}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function CardPacksPage({
  coins,
  onOpenPack,
}: CardPacksPageProps) {
  const [openingTier, setOpeningTier] = useState<PackTier | null>(null);
  const [revealedCards, setRevealedCards] = useState<PlayerCard[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);

  function handleOpenPack(tier: PackTier, cost: number) {
    if (coins < cost) return;
    const cards = openCardPack(tier);
    setRevealedCards(cards);
    setOpeningTier(tier);
    setIsRevealing(true);
  }

  function handleAddToRoster() {
    if (openingTier === null) return;
    const cost = PACK_CONFIG.find((p) => p.tier === openingTier)?.cost ?? 0;
    onOpenPack(openingTier, revealedCards);
    setOpeningTier(null);
    setRevealedCards([]);
    setIsRevealing(false);
    // cost is already handled in parent via onOpenPack
    void cost;
  }

  function handleCloseModal() {
    setOpeningTier(null);
    setRevealedCards([]);
    setIsRevealing(false);
  }

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto">
      {/* Header with coin balance */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-black text-foreground">
            Card Packs
          </h1>
          <p className="text-muted-foreground text-sm">
            Open packs to build your roster
          </p>
        </div>
        <div
          data-ocid="packs.coins.card"
          className="flex items-center gap-2 bg-yellow-900/30 border border-yellow-600/40 rounded-xl px-4 py-2"
        >
          <Coins className="w-5 h-5 text-yellow-400" />
          <span className="font-display font-black text-xl text-yellow-400">
            {coins}
          </span>
        </div>
      </div>

      {/* Earn coins hint */}
      <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-lg px-3 py-2 mb-5 text-sm text-accent/80">
        <Zap className="w-4 h-4 text-accent shrink-0" />
        <span>Win games to earn coins: +50 per win, +25 per loss</span>
      </div>

      {/* Pack cards */}
      <div className="space-y-4">
        {PACK_CONFIG.map((pack) => {
          const canAfford = coins >= pack.cost;
          return (
            <div
              key={pack.tier}
              data-ocid={`packs.${pack.tier}.card`}
              className={`relative rounded-2xl border-2 ${pack.borderColor} bg-gradient-to-br ${pack.gradient} p-5 shadow-lg ${pack.glowColor}`}
            >
              <div className="flex items-center gap-4">
                {/* Pack icon */}
                <div className="w-16 h-16 rounded-xl bg-background/30 border border-border/30 flex items-center justify-center shrink-0">
                  {pack.icon}
                </div>

                {/* Pack info */}
                <div className="flex-1 min-w-0">
                  <div className="font-display font-black text-lg text-foreground">
                    {pack.label}
                  </div>
                  <div className="text-sm text-foreground/70 mt-0.5">
                    {pack.description}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge
                      className={`text-xs font-bold ${pack.badgeClass} border`}
                    >
                      {pack.cardCount}
                    </Badge>
                    <Badge
                      className={`text-xs font-bold ${pack.badgeClass} border`}
                    >
                      {pack.maxOvr}
                    </Badge>
                  </div>
                </div>

                {/* Open button */}
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1 justify-end mb-2">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span className="font-display font-black text-lg text-yellow-400">
                      {pack.cost}
                    </span>
                  </div>
                  <Button
                    data-ocid={`packs.${pack.tier}.button`}
                    onClick={() => handleOpenPack(pack.tier, pack.cost)}
                    disabled={!canAfford}
                    size="sm"
                    className={`font-display font-bold ${
                      canAfford
                        ? pack.tier === "gold"
                          ? "bg-yellow-500 text-black hover:bg-yellow-400 gold-glow"
                          : pack.tier === "silver"
                            ? "bg-slate-400 text-black hover:bg-slate-300"
                            : "bg-orange-600 text-white hover:bg-orange-500"
                        : "opacity-50 cursor-not-allowed"
                    }`}
                  >
                    {canAfford ? "Open" : "Need Coins"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Card Reveal Modal */}
      <AnimatePresence>
        {isRevealing && openingTier !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
            data-ocid="packs.modal"
          >
            <motion.div
              initial={{ y: 60, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="w-full max-w-lg bg-card border border-border/50 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-xl font-black text-foreground">
                    Pack Opened!
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {revealedCards.length} new players added
                  </p>
                </div>
                <button
                  type="button"
                  data-ocid="packs.close_button"
                  onClick={handleCloseModal}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cards Grid */}
              <div
                className={`grid gap-3 mb-5 ${
                  revealedCards.length <= 3
                    ? "grid-cols-3"
                    : revealedCards.length === 4
                      ? "grid-cols-2 sm:grid-cols-4"
                      : "grid-cols-3 sm:grid-cols-5"
                }`}
              >
                {revealedCards.map((card, i) => (
                  <PlayerCardDisplay key={card.id} card={card} index={i} />
                ))}
              </div>

              {/* Cost deduction note */}
              <div className="flex items-center gap-2 bg-secondary/40 rounded-lg px-3 py-2 mb-4 text-sm text-muted-foreground">
                <Coins className="w-4 h-4 text-yellow-400 shrink-0" />
                <span>
                  {PACK_CONFIG.find((p) => p.tier === openingTier)?.cost} coins
                  will be deducted
                </span>
              </div>

              {/* Actions */}
              <Button
                data-ocid="packs.confirm_button"
                onClick={handleAddToRoster}
                className="w-full bg-primary text-primary-foreground font-display font-bold h-12 text-base gold-glow"
              >
                Add All to Roster
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
