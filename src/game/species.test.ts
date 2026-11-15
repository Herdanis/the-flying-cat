import { describe, expect, test } from 'vitest';
import { SPECIES } from './species';

describe('SPECIES', () => {
  test('lists the six species in the fixed order', () => {
    expect(SPECIES).toHaveLength(6);
    expect(SPECIES.map((s) => s.key)).toEqual(['rex', 'stego', 'trike', 'long', 'ptero', 'anky']);
  });

  test('gives every species a unique name and colour', () => {
    expect(new Set(SPECIES.map((s) => s.name)).size).toBe(6);
    expect(new Set(SPECIES.map((s) => s.colour)).size).toBe(6);
    for (const species of SPECIES) {
      expect(species.name.length).toBeGreaterThan(0);
      expect(species.colour).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
