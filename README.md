# Dino Ladder

A dinosaur astronaut flies from Earth to a distant Star. Rockets zoom you
forward, black holes drag you back, and you must land on the Star exactly.

Snakes and Ladders, in a space suit, in your browser.

## Play

```bash
npm install
npm run dev
```

Open the address it prints. The first screen is a shelf of games; tap **Dino
Ladder** to open it, and the browser back button brings you back to the shelf.
The game starts with one button per player count, 2 to 6, each showing its
number and that many dinos. Tap one, then the players pick their dinos in seat
order: a taken dino dims and reads "taken", so no two players share one. Then
the roll-off decides who begins — everyone rolls once, anyone who ties rolls
again, and the highest roll goes first. Tap **Start** and play.

The dice always shows a face, starting at 1, and tumbles while it rolls. Every
dino waits in the launch bay under the board and flies out on its first roll.
When someone wins, the banner leads with their dino and name, and puts the cursor
on "another game", which keeps everyone's dino and rolls off for the next order.

Two to six players take turns on one device. The six dinos are Rex, Stego,
Trike, Long, Ptero and Anky; each player picks one, and that dino is their token,
their name and their colour.

## Board rules

- The turn order comes from the roll-off, not from the seat order: everyone rolls once, a tie group rolls again among itself, and a group that re-rolls keeps the place its first number earned.
- Earth holds one rocket, starting on 2 to 10, and no black hole. Nothing ever lands back on the first ten squares.
- The Asteroid Belt and Neptune trade one trap each way: a rocket from 31–40 up to 71–80, and a hole from 71–80 back down to 31–40. Only that pair may jump more than 20 squares, up to 49.
- The rocket out of the Belt starts above the square the Neptune hole drops you on.
- Two rockets never sit on neighbouring squares, and neither do two holes. A rocket may neighbour a hole.
- Nine rockets and nine holes in all: every leg except Earth and the Star holds two or three traps, always both kinds, and rockets lift at least as far as holes drag back.

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
in `src/ui/board.ts` and `squareCentre` in `src/ui/links.ts` encode the same
serpentine, one for the css grid and one for the link layer. The roll-off is a
rule too: `src/game/startOrder.ts` takes the dice as a function, so its tests
replay a scripted throw instead of waiting for luck.

The shelf is a registry, not a cage: `src/games.ts` lists every game with its
key, title, tile picture and entry function, `src/router.ts` maps the hash to a
key in that list, and `#/` is home. A second game is one entry plus its own
module; the router and the home screen never change.

`src/ui/` draws. Every picture is a file: `public/assets/manifest.json` lists
the dinos, grounds, sky objects and board marks, and `src/ui/assets.ts` is the
only code that turns a key into a path. A missing file leaves a gap; it never
breaks the screen.

Each square paints its leg's ground picture — `grounds/mars.svg` across squares
41 to 50 — and keeps its number in that leg's ink, above the link and mark
layers so a trail never covers a digit. The trails are one SVG layer above the
squares: `linkPath` curves between two square centres and `ribbonPath` tapers it
from pad to pad. The pads, ships, holes and dust are plain `<img>` marks in a
second layer above the trails and below the dinos, because `<image>` inside an
SVG does not paint in every engine. `trapPairs` places both layers from the same
points, so a trail always ends inside its mark. The link the last move used
carries `data-live="true"` and draws at full strength while the rest sit back. A
rocket's source draws the ship on its pad with the flame lit; its landing draws
a second ship, legs down and flame out, on a landing ring. A dashed segment runs
from every square into the next, so the route reads even where no trap sits.

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
