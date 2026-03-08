# Gridiron Dynasty 26

## Current State
The game has a top-down SVG football field with colored dots representing players, route lines, and a ball animation. Play-calling uses 4 buttons (Run Left, Run Right, Pass Short, Pass Deep). Results are text-based with dice-roll outcomes. There is no sense of being the quarterback.

## Requested Changes (Diff)

### Add
- First-person QB perspective view: a 3D-perspective canvas showing the field stretching away from the player's POV behind center
- Receivers visible as player silhouettes on the field with their position label and coverage indicators
- A "pocket" phase after snap: a countdown pressure meter as the pass rush closes in (3 seconds to throw)
- Tap-to-throw mechanic: user taps a specific receiver to target them — each receiver has a coverage difficulty rating
- Coverage indicators: each receiver shows open/contested/covered status visually
- Pass result based on coverage difficulty + pressure (did you throw in time?) + receiver rating
- Running plays: show a burst animation with left/right lane choice instead of receivers
- Pre-snap: show play art overlaid on perspective field with highlighted routes before snapping

### Modify
- PlayPage.tsx: replace or supplement the existing top-down SVG field with a new first-person perspective component during active gameplay
- gameLogic.ts: add `throwToReceiver` function that accepts receiver difficulty + pressure time used and returns a PlayResult
- The top-down field view is replaced by the QB perspective when a game is active

### Remove
- The old "Choose a Play → Select → SNAP" flow is replaced by the new immersive QB view flow
- Route animation on the top-down map (replaced by perspective view)

## Implementation Plan
1. Add `QBFieldView` canvas/SVG component to PlayPage.tsx with perspective projection
2. Show 3–4 receiver icons on field at perspective-correct positions with coverage status badges
3. Add pressure timer (PocketTimer) that counts down 3s after snap; if expired, forces throw-away/sack
4. Add receiver-tap throw mechanic that calls new `throwToReceiver` in gameLogic.ts
5. For run plays, show left/right arrow lanes on the perspective field instead of receivers
6. Update `callPlay` / add `throwToReceiver` in gameLogic.ts with pressure + coverage calculations
7. Keep scoreboard, play history, and game over logic unchanged
