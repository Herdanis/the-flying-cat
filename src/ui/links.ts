// ============================================
// Link Geometry
// ============================================

export interface LinkGeometry {
  d: string;
  end: { x: number; y: number };
}

interface Point {
  x: number;
  y: number;
}

const SIDE = 10;
const STEPS = 30;
const SAMPLES = /-?\d+(?:\.\d+)?/g;

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Centre of a square on the 10×10 board, in the link layer's own pixels. */
export function squareCentre(square: number, cell: number, gap: number): Point {
  const leg = Math.floor((square - 1) / SIDE);
  const offset = (square - 1) % SIDE;
  const column = leg % 2 === 0 ? offset : SIDE - 1 - offset;
  const step = cell + gap;
  return { x: column * step + cell / 2, y: (SIDE - 1 - leg) * step + cell / 2 };
}

export function linkPath(from: number, to: number, cell: number, gap: number): LinkGeometry {
  const start = squareCentre(from, cell, gap);
  const end = squareCentre(to, cell, gap);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  // Alternate the bow so parallel links between the same rows stay apart.
  const bend = (from + to) % 2 === 0 ? 1 : -1;
  const bow = Math.min(cell * 0.48, length * 0.35) * bend;
  const control = {
    x: round((start.x + end.x) / 2 - (dy / length) * bow),
    y: round((start.y + end.y) / 2 + (dx / length) * bow),
  };
  const tip = { x: round(end.x), y: round(end.y) };

  return { d: `M${round(start.x)} ${round(start.y)} Q${control.x} ${control.y} ${tip.x} ${tip.y}`, end: tip };
}

function curve(geometry: LinkGeometry): { a: Point; c: Point; b: Point } {
  // d is always the quadratic linkPath writes: M x y Q cx cy x y
  const [ax, ay, cx, cy, bx, by] = (geometry.d.match(SAMPLES) ?? []).map(Number);
  return { a: { x: ax, y: ay }, c: { x: cx, y: cy }, b: { x: bx, y: by } };
}

function pointOn(a: Point, c: Point, b: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
  };
}

export function ribbonPath(geometry: LinkGeometry, startWidth: number, endWidth: number): string {
  const { a, c, b } = curve(geometry);
  const left: string[] = [];
  const right: string[] = [];

  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    const p = pointOn(a, c, b, t);
    // Difference across the sample; at t=1 step back so the tangent stays real.
    const behind = t < 1 ? p : pointOn(a, c, b, t - 0.01);
    const ahead = t < 1 ? pointOn(a, c, b, t + 0.01) : p;
    const dx = ahead.x - behind.x;
    const dy = ahead.y - behind.y;
    const length = Math.hypot(dx, dy) || 1;
    const half = (startWidth + (endWidth - startWidth) * t) / 2;
    const nx = -(dy / length) * half;
    const ny = (dx / length) * half;
    left.push(`${round(p.x + nx)} ${round(p.y + ny)}`);
    right.push(`${round(p.x - nx)} ${round(p.y - ny)}`);
  }

  return `M${left.join(' L')} L${right.reverse().join(' L')} Z`;
}
