import { describe, expect, test } from 'vitest';
import { asset, groundFor, type Group } from './assets';

const FILES = new Set(
  Object.keys(import.meta.glob('../../public/assets/*/*.svg')).map((path) => path.replace('../../public/', '')),
);

const USED: Record<Group, string[]> = {
  dinos: ['rex', 'stego', 'trike', 'long', 'ptero', 'anky'],
  grounds: ['earth', 'orbit', 'moon', 'belt', 'mars', 'jupiter', 'saturn', 'neptune', 'deep', 'star'],
  sky: ['sun', 'moon', 'planet', 'satellite', 'comet', 'nebulaA', 'nebulaB'],
  marks: ['rocketShip', 'rocketLanded', 'launchPad', 'landingPad', 'dust', 'hole', 'star'],
};

describe('assets', () => {
  test('every group and key the app uses resolves to its own svg under assets/', () => {
    for (const [group, keys] of Object.entries(USED) as [Group, string[]][]) {
      for (const key of keys) {
        expect(asset(group, key), `${group}/${key}`).toBe(`assets/${group}/${key}.svg`);
      }
    }
  });

  test('groundFor walks the ten legs from earth to star', () => {
    expect(groundFor(0)).toBe(asset('grounds', 'earth'));
    expect(groundFor(9)).toBe(asset('grounds', 'star'));
    for (let leg = 0; leg < 10; leg++) expect(groundFor(leg)).toBe(asset('grounds', USED.grounds[leg]));
  });

  test('an unknown key throws an error that names it', () => {
    expect(() => asset('dinos', 'nope')).toThrow('unknown asset: dinos/nope');
    expect(() => asset('marks', 'rocket')).toThrow('unknown asset: marks/rocket');
  });

  test('a whole group missing from the manifest throws the same clean error', () => {
    expect(() => asset('nope' as Group, 'rex')).toThrow('unknown asset: nope/rex');
  });

  test('every path in the manifest is a file that exists', () => {
    for (const [group, keys] of Object.entries(USED) as [Group, string[]][]) {
      for (const key of keys) {
        const path = asset(group, key);
        expect(FILES.has(path), path).toBe(true);
      }
    }
  });
});
