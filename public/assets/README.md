# Art assets

Every picture in the game is a file listed in `manifest.json` under one of four
groups: `dinos`, `grounds`, `sky`, `marks`. The app asks
`asset('dinos', 'rex')` and gets `assets/dinos/rex.svg` back. No other code
builds an asset path, so this file is the whole picture list.

## Swapping art

Drop a replacement in place with the same name — `assets/dinos/rex.svg` — and
the next page load uses it. No rebuild, no code change.

To point a key at a different file, edit `manifest.json` and run
`npm run build`. The manifest is baked into the bundle at build time, so
editing `dist/assets/manifest.json` alone does nothing. Every entry is an
`.svg` file; the asset test pins the exact `assets/<group>/<key>.svg` path.

Each `.svg` here is a standalone document: it renders when opened in a browser
on its own, its colours are written in the file, and it pulls in nothing
external — no `currentColor`, no web fonts, no images, no stylesheets.

## Sizes

| Canvas | Where |
|---|---|
| 112 × 112 | dinos |
| 100 × 100 | grounds, marks |
| 320 × 320 · 192 × 192 · 88 × 88 · 60 × 60 · 200 × 80 · 320 × 200 | sky: sun, planet, satellite, moon, comet, nebulae |

## The files

Safe area is the part of the canvas a replacement should stay inside; anything
outside it risks clipping or crowding a neighbour.

| Key | Canvas | Safe area | A replacement must keep |
|---|---|---|---|
| `dinos/rex` | 112 × 112 | body and helmet ≥ 4 units from every edge | transparent background, one dino facing right, head top-right |
| `dinos/stego` | 112 × 112 | same, margin ≥ 4 units | same |
| `dinos/trike` | 112 × 112 | same, margin ≥ 4 units | same |
| `dinos/long` | 112 × 112 | same, margin ≥ 4 units | same, long neck |
| `dinos/ptero` | 112 × 112 | same, margin ≥ 4 units | same, wings spread wide |
| `dinos/anky` | 112 × 112 | same, margin ≥ 4 units | same, tail club left |
| `grounds/earth` | 100 × 100 | none — fill the square | opaque ocean blue, no transparency |
| `grounds/orbit` | 100 × 100 | none | opaque, arc across the square |
| `grounds/moon` | 100 × 100 | none | opaque grey, craters |
| `grounds/belt` | 100 × 100 | none | opaque brown, rocks |
| `grounds/mars` | 100 × 100 | none | opaque rust red, dunes |
| `grounds/jupiter` | 100 × 100 | none | opaque tan, horizontal bands |
| `grounds/saturn` | 100 × 100 | none | opaque gold, ring sweep |
| `grounds/neptune` | 100 × 100 | none | opaque blue-violet, waves |
| `grounds/deep` | 100 × 100 | none | opaque near-black navy, star specks |
| `grounds/star` | 100 × 100 | none | opaque gold, brightest of the ten |
| `sky/sun` | 320 × 320 | glow inside the canvas | transparent outside the glow, warm yellow-white |
| `sky/moon` | 60 × 60 | 6 units | transparent background, craters, pale grey |
| `sky/planet` | 192 × 192 | ring inside the canvas | transparent background, ringed gas giant |
| `sky/satellite` | 88 × 88 | 4 units | transparent background, body plus four panels |
| `sky/comet` | 200 × 80 | tail inside the canvas | transparent background, head right, tail left |
| `sky/nebulaA` | 320 × 200 | fades out by the edge | transparent corners, violet bloom |
| `sky/nebulaB` | 320 × 200 | fades out by the edge | transparent corners, pink bloom |
| `marks/rocketShip` | 100 × 100 | 6 units (art inside 88 × 88) | transparent background, nose up, flame down, 34 units tall before scaling |
| `marks/rocketLanded` | 100 × 100 | 6 units | transparent background, nose up, legs down, no flame, smaller than the launched ship |
| `marks/launchPad` | 100 × 100 | 6 units | transparent background, pad below, gantry and beacon to the right |
| `marks/landingPad` | 100 × 100 | 6 units | transparent background, square ring with four landing ticks, no perspective |
| `marks/dust` | 100 × 100 | 6 units | transparent background, a puff of pale dots |
| `marks/hole` | 100 × 100 | 6 units | transparent background, dark centre, solid bright ring, flare rings outside it (source only) |
| `marks/holeExit` | 100 × 100 | 6 units | transparent background, dark centre with a thin dim rim, dashed gold ring and three radial ticks outside it (destination only) |
| `marks/star` | 100 × 100 | 6 units | transparent background, flat pale-gold star with a face |

Grounds are drawn edge to edge on purpose: the board clips each one to a
rounded square, so any transparent margin shows up as a gap at the tile edge.

The six dinos share one drawing pipeline — same body plan, different colours and
head — so a replacement set reads as one family.
