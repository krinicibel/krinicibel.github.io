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

        // remove include loader if present
        html = html.replace(/<script[^>]*src=["'][^"']*\/js\/include\.js["'][^>]*>\s*<\/script>/gi, '');

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
