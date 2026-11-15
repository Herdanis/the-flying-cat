# Dino Ladder

A dinosaur astronaut flies from Earth to a distant Star. Rockets zoom you
forward, black holes drag you back, and you must land on the Star exactly.

Snakes and Ladders, in a space suit, in your browser.

## Play

```bash
npm install
npm run dev
```

Open the address it prints. Pick how many dinosaurs are playing, then tap the
big dice. That is the whole interface — no reading required.

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
- A rocket (⇧) lifts you forward, a black hole (◉) drags you back.
- You must land on the Star (★) exactly. Overshooting bounces you back by the
  remainder, and that bounce never triggers a rocket or black hole.
- Square 1 is bottom-left, square 100 closes the top row.

## How it works

`src/game/` holds the rules — pure TypeScript, no DOM, no browser API, and no
imports from anywhere else. It is tested on its own.

`src/ui/` draws. The board is a CSS grid of 100 cells; the dinosaurs live in
an overlay layer above it and move with `transform`, which is what lets the
current player's dino stay full size while other players on the same square
shrink to dots.

```bash
npm test      # rules, state and animation paths — no browser needed
```

## The terminal version

The original TUI lives in git history and on the `tui` branch. It is not
maintained; the rules here are the reference now.
