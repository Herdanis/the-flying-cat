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

Two to six players take turns on one device. The six dinos are Rex, Stego,
Trike, Long, Ptero and Anky, one per player in that order.

## Build

```bash
npm run build      # static files in dist/
npm run preview    # serve the built files locally
```

The output is plain static files, so it can be served from anywhere. No
server code, no runtime dependencies.

## Docker

```bash
make up
```

Then open `http://localhost:8080`. `make down` stops it. `make logs` follows the
container log, `make test` runs the tests.

## The rules

Unchanged from the original terminal version:

- Roll 1–6 and advance that many squares.
- A rocket lifts you forward, a black hole drags you back.
- You must land on the Star exactly. Overshooting bounces you back by the
  remainder, and that bounce never triggers a rocket or black hole.
- Square 1 is bottom-left, square 100 closes the top row.

The board itself is not fixed: every game draws nine rockets and nine holes at
random, never on the start or the Star.

## Change the art

Every picture in the game — the six dinos, the ten grounds, the sky and the
board marks — is a file under `public/assets/`. Replace one with a file of the
same name, reload the page, and the board uses it: no code change, no rebuild.
`public/assets/README.md` lists each file with its size and the room a
replacement should keep.

## How it works

`src/game/` holds the rules — pure TypeScript, no DOM, no browser API, and no
imports from anywhere else. It is tested on its own. Where a square sits on the
grid, and which way the track leaves it, is drawing code instead: `cellGridPos`
and `dirToNext` live in `src/ui/board.ts`, next to the column and row they
assign.

`src/ui/` draws. Every picture is a file: `public/assets/manifest.json` lists
the dinos, grounds, sky objects and board marks, and `src/ui/assets.ts` is the
only code that turns a key into a path. A missing file leaves a gap; it never
breaks the screen.

Each square paints its leg's ground picture — `grounds/mars.svg` across squares
41 to 50 — and keeps its number in that leg's ink, above the link layer so a
trail never covers a digit. The links are one SVG layer above the squares and
below the dinos: `linkPath` curves between two square centres, `ribbonPath`
tapers it from pad to pad, and the link the last move used carries
`data-live="true"` and draws at full strength while the rest sit back.

The dinosaurs ride a white disc ringed in their species colour, in an overlay
layer above the grid, and move with `transform`. That is what lets the current
player stay full size while other players on the same square shrink to dots. The
mute icon is still inline SVG from `src/ui/icons.ts`.

```bash
npm test      # rules, state and animation paths — no browser needed
```

## The terminal version

The original TUI lives in git history and on the `tui` branch. It is not
maintained; the rules here are the reference now.
