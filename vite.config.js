const { resolve } = require('path');
const fs = require('fs');

function collectHtmlFiles(root) {
  const out = {};
  function walk(dir) {
    for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
      if (name.name.startsWith('.') || ['templates', 'dist', 'node_modules', '_notes', 'tmp_site', 'scripts'].includes(name.name)) continue;
      const full = resolve(dir, name.name);
      if (name.isDirectory()) walk(full);
      else if (name.name.endsWith('.html')) {
        const rel = full.replace(root + '/', '');
        out[rel] = full;
      }
    }
  }
  walk(root);
  return out;
}

function adjustPaths(html, prefix) {
  if (!prefix) return html;
  return html.replace(/href=(['"])(?:\/)?([A-Za-z0-9_-]+\.html)(#[^\"']*)?\1/g, (m, q, file, hash = '') => `href=${q}${prefix}${file}${hash}${q}`);
}

function htmlPartialsPlugin() {
  let header = '';
  let footer = '';
  let menuJson = null;

  function escapeHtml(s) {
    return (s + '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderMenus(menu, prefix) {
    const mainParts = [];
    const mobileParts = [];

    for (const item of menu) {
      const itemTitle = typeof item.title === 'string' ? item.title : (item.title && item.title.ru) || '';

      if (item.items && item.items.length) {
        // desktop
        const sub = item.items
          .map((s) => {
            const subTitle = typeof s.title === 'string' ? s.title : (s.title && s.title.ru) || '';
            return `<li><a href="${prefix}index.html${escapeHtml(s.anchor || '')}">${escapeHtml(subTitle)}</a></li>`;
          })
          .join('');
        mainParts.push(`<li class="has-submenu"><a href="${prefix}index.html${escapeHtml(item.anchor || '')}">${escapeHtml(itemTitle)}</a><ul class="submenu">${sub}</ul></li>`);

        // mobile (with aria-controls)
        const id = 'mobile-submenu-' + Math.random().toString(36).slice(2, 9);
        const mobileSub = item.items
          .map((s) => {
            const subTitle = typeof s.title === 'string' ? s.title : (s.title && s.title.ru) || '';
            return `<li><a href="${prefix}index.html${escapeHtml(s.anchor || '')}">${escapeHtml(subTitle)}</a></li>`;
          })
          .join('');
        const button = `<button class="submenu-toggle" aria-expanded="false" aria-controls="${id}" aria-label="Открыть подменю"><svg width="20" height="20"><use href="#icon-chevron"></use></svg></button>`;
        mobileParts.push(`<li><div class="mobile-menu-item"><a href="${prefix}index.html${escapeHtml(item.anchor || '')}">${escapeHtml(itemTitle)}</a>${button}</div><ul class="mobile-submenu" id="${id}" aria-hidden="true">${mobileSub}</ul></li>`);
      } else {
        // simple links
        const href = item.href ? `${prefix}${escapeHtml(item.href)}` : `${prefix}index.html${escapeHtml(item.anchor || '')}`;
        mainParts.push(`<li><a href="${href}">${escapeHtml(itemTitle)}</a></li>`);
        mobileParts.push(`<li><div class="mobile-menu-item"><a href="${href}">${escapeHtml(itemTitle)}</a></div></li>`);
      }
    }

    return { mainHtml: `<ul class="main-menu">${mainParts.join('')}</ul>`, mobileHtml: `<ul class="mobile-menu">${mobileParts.join('')}</ul>` };
  }

  return {
    name: 'html-partials',
    configResolved() {
      try {
        header = fs.readFileSync('templates/header.html', 'utf8');
      } catch (e) {
        header = '';
      }
      try {
        footer = fs.readFileSync('templates/footer.html', 'utf8');
      } catch (e) {
        footer = '';
      }

      // attempt to load menu data for SSR rendering
      try {
        menuJson = JSON.parse(fs.readFileSync('data/menu.json', 'utf8'));
      } catch (e) {
        menuJson = null;
      }
    },

    transformIndexHtml: {
      order: 'pre',
      handler(html, { filename }) {
        if (!filename) return html;

        const rel = filename.replace(process.cwd() + '/', '');
        const depth = rel.split('/').filter(Boolean).length - 1;
        const prefix = depth > 0 ? '../'.repeat(depth) : '';

        // prepare adjusted templates
        let adjustedHeader = header;
        let adjustedFooter = footer;

        // replace root href="/" with prefix + index.html
        adjustedHeader = adjustedHeader.replace(/href=(['"])\/\1/g, (m, q) => `href=${q}${prefix}index.html${q}`);
        adjustedFooter = adjustedFooter.replace(/href=(['"])\/\1/g, (m, q) => `href=${q}${prefix}index.html${q}`);

        adjustedHeader = adjustPaths(adjustedHeader, prefix);
        adjustedFooter = adjustPaths(adjustedFooter, prefix);

        // favicon -> prefixed svg
        adjustedHeader = adjustedHeader.replace(/<link[^>]*href=["'][^"']*favicon\.(?:ico|svg)["'][^>]*>/gi, `<link rel="icon" href="${prefix}favicon.svg" type="image/svg+xml" />`);
        adjustedFooter = adjustedFooter.replace(/<link[^>]*href=["'][^"']*favicon\.(?:ico|svg)["'][^>]*>/gi, `<link rel="icon" href="${prefix}favicon.svg" type="image/svg+xml" />`);

        // whenever present, remove include loader
        html = html.replace(/<script[^>]*src=["'][^"']*\/js\/include\.js["'][^>]*>\s*<\/script>/gi, '');

        // SSR-render menu if we have menu data
        if (menuJson) {
          const { mainHtml, mobileHtml } = renderMenus(menuJson, prefix);
          // replace entire placeholders with rendered HTML
          adjustedHeader = adjustedHeader.replace(/<ul\s+class=["']main-menu["']\s*>\s*<\/ul>/i, mainHtml);
          adjustedHeader = adjustedHeader.replace(/<ul\s+class=["']mobile-menu["']\s*>\s*<\/ul>/i, mobileHtml);
        }

        // inject adjusted templates
        let out = html.replace(/<div\s+data-include=["']\/?templates\/header\.html["']\s*><\/div>/i, adjustedHeader);
        out = out.replace(/<div\s+data-include=["']\/?templates\/footer\.html["']\s*><\/div>/i, adjustedFooter);

        return out;
      }
    }
  };
}

const root = process.cwd();
const input = collectHtmlFiles(root);

module.exports = {
  base: './',
  plugins: [htmlPartialsPlugin()],
  build: {
    rollupOptions: {
      input
    }
  }
};
