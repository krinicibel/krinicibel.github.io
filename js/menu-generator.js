// js/menu-generator.js
export function getTitle(maybeObj, locale = 'ru') {
  if (!maybeObj) return '';
  if (typeof maybeObj === 'string') return maybeObj;
  if (typeof maybeObj === 'object') return maybeObj[locale] || maybeObj['ru'] || Object.values(maybeObj)[0] || '';
  return '';
}

export function localizeMenu(rawMenu, locale = 'ru') {
  return rawMenu.map((item) => {
    const localized = {
      title: getTitle(item.title, locale),
    };
    if (item.anchor) localized.anchor = item.anchor;
    if (item.href) localized.href = item.href;
    if (item.items) localized.items = item.items.map((sub) => ({ title: getTitle(sub.title, locale), anchor: sub.anchor, href: sub.href }));
    return localized;
  });
}
