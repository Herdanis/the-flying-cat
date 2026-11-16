import { expect, test } from 'vitest';
import { PIPS, TUMBLE_MS, tumbleFrames } from './dice';

const FACES = [1, 2, 3, 4, 5, 6];
const FACE_ANGLES: Record<number, readonly [number, number]> = {
  1: [0, 0],
  2: [-90, 0],
  3: [0, -90],
  4: [0, 90],
  5: [90, 0],
  6: [0, 180],
};

function anglesOf(frame: Keyframe): { x: number; y: number } {
  const found = /rotateX\((-?[\d.]+)deg\) rotateY\((-?[\d.]+)deg\)/.exec(String(frame.transform));
  if (!found) throw new Error(`no cube rotation in ${frame.transform}`);
  return { x: Number(found[1]), y: Number(found[2]) };
}

function mod(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

test('every face 1-6 has its pips, and the start face is one', () => {
  expect(PIPS[1]).toEqual([4]);
  expect(PIPS[4]).toHaveLength(4);
  expect(PIPS[6]).toHaveLength(6);
  expect(PIPS[0]).toEqual([]);
});

test('a roll lands exactly on the face it shows', () => {
  for (const face of FACES) {
    const frames = tumbleFrames({ x: 0, y: 0 }, face);
    const last = anglesOf(frames[frames.length - 1]);
    expect([mod(last.x), mod(last.y)]).toEqual([mod(FACE_ANGLES[face][0]), mod(FACE_ANGLES[face][1])]);
  }
});

test('every frame turns forward, always more than a full turn per axis', () => {
  let from = { x: 0, y: 0 };
  for (const face of [...FACES, 3, 1, 6]) {
    const frames = tumbleFrames(from, face);
    const angles = frames.map(anglesOf);

    for (let i = 1; i < angles.length; i++) {
      expect(angles[i].x).toBeGreaterThanOrEqual(angles[i - 1].x);
      expect(angles[i].y).toBeGreaterThanOrEqual(angles[i - 1].y);
    }

    const first = angles[0];
    const last = angles[angles.length - 1];
    expect(last.x - first.x).toBeGreaterThan(360);
    expect(last.y - first.y).toBeGreaterThan(360);
    from = last;
  }
});

test('the roll lasts at least 1.5s on one eased curve, and never hops', () => {
  const frames = tumbleFrames({ x: 0, y: 0 }, 3);

  expect(TUMBLE_MS).toBeGreaterThanOrEqual(1500);
  expect(frames).toHaveLength(2);

  const ease = String(frames[0].easing);
  expect(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out']).not.toContain(ease);

  for (const frame of frames) expect(String(frame.transform)).not.toMatch(/translate/);
  expect(String(frames[1].transform)).toMatch(/^rotateX\(-?[\d.]+deg\) rotateY\(-?[\d.]+deg\)$/);
});
