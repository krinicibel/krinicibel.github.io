import { describe, it, expect } from 'vitest';
import menuRaw from '../data/menu.json';
import { normalizeMenu } from '../js/menu-generator.js';

describe('normalizeMenu', () => {
  it('returns titles as strings', () => {
    const res = normalizeMenu(menuRaw);
    expect(res[0].title).toBe('Брестская область');
    expect(res[0].items[0].title).toBe('Барановичский район');
  });

  it('falls back to ru when title object present', () => {
    const custom = [{ title: { ru: 'Тест' }, href: 'map.html' }];
    const res = normalizeMenu(custom);
    expect(res[0].title).toBe('Тест');
  });
});
