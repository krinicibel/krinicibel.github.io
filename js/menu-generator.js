// js/menu-generator.js
// Simplified: no i18n — menu titles are plain strings
export function normalizeMenu(rawMenu) {
  return rawMenu.map((item) => {
    const normalized = {
      title: typeof item.title === 'string' ? item.title : (item.title && item.title.ru) || '',
    };
    if (item.anchor) normalized.anchor = item.anchor;
    if (item.href) normalized.href = item.href;
    if (item.items)
      normalized.items = item.items.map((sub) => ({
        title: typeof sub.title === 'string' ? sub.title : (sub.title && sub.title.ru) || '',
        anchor: sub.anchor,
        href: sub.href,
      }));
    return normalized;
  });
}

export default normalizeMenu;
