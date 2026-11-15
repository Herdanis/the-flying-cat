# Dino Ladder

A dinosaur astronaut flies from Earth to a distant Star. Rockets zoom you
forward, black holes drag you back, and you must land on the Star exactly.

Snakes and Ladders, in a space suit, in your browser.

## Play

```bash
npm install
npm run dev
```

Open the address it prints. The start screen has one button per player count,
2 to 6, each showing its number and that many dinos. Tap one, then tap the big
dice. That is the whole interface — no reading required.

The dice always shows a face, starting at 1, and tumbles while it rolls. When
someone wins, the banner leads with their dino and name, and puts the cursor on
"another game" so the next round is one key away.

Two to six players take turns on one device.

## Build

```bash
npm run build      # static files in dist/
npm run preview    # serve the built files locally
```

The output is plain static files, so it can be served from anywhere. No
server code, no runtime dependencies.

## The rules

Unchanged from the original terminal version:

- Roll 1–6 and advance that many squares.
- A rocket lifts you forward, a black hole drags you back.
- You must land on the Star exactly. Overshooting bounces you back by the
  remainder, and that bounce never triggers a rocket or black hole.
- Square 1 is bottom-left, square 100 closes the top row.

## How it works

`src/game/` holds the rules — pure TypeScript, no DOM, no browser API, and no
imports from anywhere else. It is tested on its own. Where a square sits on the
grid, and which way the track leaves it, is drawing code instead: `cellGridPos`
and `dirToNext` live in `src/ui/board.ts`, next to the column and row they
assign.

`src/ui/` draws. The board is fat rounded tiles on a star-chart backdrop, with a
dashed track joining consecutive squares and the leg names running down the
left side, in a column that hides below 420px. None of that look is markup: a
`::before` on each cell draws the rounded tile and its tint, and a single dashed
border on `::after` draws the track segment. No image assets.

The rocket, black hole, star and mute icons are inline SVG from
`src/ui/icons.ts`. They draw with `currentColor` and take their size from the
cell, so they stay sharp at any tile size and nothing waits on a font.

The dinosaurs live in an overlay layer above the grid and move with `transform`,
which is what lets the current player's dino stay full size while other players
on the same square shrink to dots.

```bash
npm test      # rules, state and animation paths — no browser needed
```

## The terminal version

The original TUI lives in git history and on the `tui` branch. It is not
maintained; the rules here are the reference now.
