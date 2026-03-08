# Gridiron Dynasty 26

## Current State
- Full-stack football game with team creation, roster management, play-calling gameplay, and 8-game season mode
- Data stored in localStorage via `GameState` type
- Nav: Home, Team, Roster, Season, Play (5 tabs)
- No card packs, no player upgrades, no playoff bracket

## Requested Changes (Diff)

### Add
- **Card Packs system**: Players earn coins from wins (e.g. 50 coins/win, 25 coins/loss). Three pack tiers: Bronze (100 coins), Silver (300 coins), Gold (600 coins). Each pack reveals 3–5 player cards with randomized position, overall rating, and rarity (Common, Rare, Elite). Pulled players go to the user's roster. Animated "open pack" reveal sequence with card flip animation.
- **Player Upgrades**: On the Roster page (or a new Upgrades tab within it), each player can spend coins to upgrade their Overall rating. Upgrade costs scale with current overall (e.g. 75→76 costs 50 coins, 85→86 costs 150 coins, 90+ costs 300 coins). Max overall: 99.
- **Playoff Bracket**: After all 8 regular season games are complete, a "Playoffs" option unlocks. The top 4 teams (user + 3 best AI teams by simulated record) enter a 4-team single-elimination bracket (Semis → Championship). Each round can be played live or simulated. Bracket is displayed as a visual tree with matchup results filled in as rounds complete.
- New `coins` field in GameState (starts at 200)
- New `playerCards` collected array in GameState
- New `playoffState` in GameState
- Nav tab "Packs" (package icon) and "Playoffs" (trophy icon)

### Modify
- `types.ts`: Add `PlayerCard`, `PackTier`, `PlayoffMatchup`, `PlayoffState`, and extend `GameState` with `coins`, `collectedCards`, `playoffState`
- `gameLogic.ts`: Add `openCardPack()`, `getUpgradeCost()`, `generatePlayoffBracket()`, `simulatePlayoffGame()` functions
- `App.tsx`: Add `packs` and `playoffs` pages, wire coin earning on game save, handle playoff state updates, add nav items
- `SeasonPage.tsx`: Show coin balance, add "Enter Playoffs" button when all 8 games are played

### Remove
- Nothing removed

## Implementation Plan
1. Update `types.ts` with new types and extended `GameState`
2. Update `gameLogic.ts` with card pack, upgrade cost, and playoff logic
3. Create `CardPacksPage.tsx` — coin balance display, three pack cards, animated reveal modal
4. Create `PlayoffPage.tsx` — 4-team bracket SVG/CSS tree, simulate or play each matchup
5. Update `RosterPage.tsx` — add upgrade button per player, show upgrade cost, deduct coins
6. Update `App.tsx` — new state fields, new page routing, coin logic on game save, new nav items
7. Update `SeasonPage.tsx` — show coin total, unlock playoff button
8. Validate (typecheck + lint + build)
