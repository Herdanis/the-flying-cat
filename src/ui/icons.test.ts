import { describe, expect, test } from 'vitest';
import { speaker } from './icons';

describe('icons', () => {
  test('the speaker is a self-contained svg with no text glyph', () => {
    for (const svg of [speaker(false), speaker(true)]) {
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg.endsWith('</svg>')).toBe(true);
      expect(svg).toContain('viewBox="0 0 24 24"');
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).not.toMatch(/[⇧◉★🔊]/u);
    }
  });

  test('the muted speaker differs from the loud one', () => {
    expect(speaker(true)).not.toBe(speaker(false));
  });
});
