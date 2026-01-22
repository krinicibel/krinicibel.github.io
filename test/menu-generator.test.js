import { describe, it, expect } from 'vitest';
import menuRaw from '../data/menu.json';
import { localizeMenu } from '../js/menu-generator.js';

describe('localizeMenu', () => {
  it('returns Russian titles by default', () => {
    const res = localizeMenu(menuRaw, 'ru');
    expect(res[0].title).toBe('Брестская область');
    expect(res[0].items[0].title).toBe('Барановичский район');
  });

  it('returns English titles when locale is en', () => {
    const res = localizeMenu(menuRaw, 'en');
    expect(res[0].title).toBe('Brest Region');
    expect(res[0].items[0].title).toBe('Baranovichi district');
  });

  it('falls back to Russian if locale missing', () => {
    // create an artificial entry missing 'en'
    const custom = [{ title: { ru: 'Тест' }, href: 'map.html' }];
    const res = localizeMenu(custom, 'en');
    expect(res[0].title).toBe('Тест');
  });
});
