#!/usr/bin/env node
// scripts/inline-partials.js
// Создаёт временную копию сайта в tmp_site с inlined header/footer и генерирует per-page entry модули в /entries

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const TMP = path.join(ROOT, 'tmp_site');

function rmDir(dir) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch (e) {
    return null;
  }
}

function copyRecursive(src, dest, opts = {}) {
  // simple wrapper around fs.cpSync if available
  try {
    fs.cpSync(src, dest, { recursive: true, errorOnExist: false });
    return;
  } catch (e) {
    // fallback
  }

  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    mkdirp(dest);
    for (const entry of fs.readdirSync(src)) {
      if (entry === 'node_modules' || entry === '.git' || entry === 'tmp_site') continue;
      if (opts.skip && opts.skip(entry)) continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry), opts);
    }
  } else {
    mkdirp(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

function findHtmlFiles(dir) {
  const results = [];
  (function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      if (entry.name === 'templates') continue;
      if (entry.name === '_notes') continue;
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.html')) results.push(full);
    }
  })(dir);
  return results;
}

// Start
console.log('inline-partials: preparing tmp_site...');
rmDir(TMP);
mkdirp(TMP);

// Read templates
const headerT = readFileSafe(path.join(ROOT, 'templates', 'header.html')) || '';
const footerT = readFileSafe(path.join(ROOT, 'templates', 'footer.html')) || '';

// Find HTML files
const htmlFiles = findHtmlFiles(ROOT).filter((f) => !f.includes(`${path.sep}templates${path.sep}`));
console.log(`inline-partials: found ${htmlFiles.length} HTML files`);

// Copy assets: js, styles.css, favicon.ico, map.html, opv.html etc.
const toCopy = ['js', 'styles.css', 'favicon.ico', 'map.html', 'opv.html', 'index.html'];
for (const item of fs.readdirSync(ROOT)) {
  const src = path.join(ROOT, item);
  const dest = path.join(TMP, item);
  if (
    [
      'templates',
      'scripts',
      '.git',
      'node_modules',
      'tmp_site',
      'dist',
      'package.json',
      'package-lock.json',
      '.github',
      '.vscode',
    ].includes(item)
  )
    continue;
  // copy directories and files (excluding _notes directories inside)
  copyRecursive(src, dest, { skip: (name) => name === '_notes' });
}

// Ensure entries dir
mkdirp(path.join(TMP, 'entries'));

// Universal helper: adjust top-level .html links (file.html or /file.html) by adding prefix
function adjustPaths(html, prefix) {
  if (!prefix) return html;
  return html.replace(
    /href=(['"])(?:\/)?([A-Za-z0-9_-]+\.html)(#[^\"']*)?\1/g,
    (m, q, file, hash = '') => `href=${q}${prefix}${file}${hash}${q}`
  );
}

// Process each HTML file
for (const file of htmlFiles) {
  const rel = path.relative(ROOT, file);
  const destPath = path.join(TMP, rel);
  mkdirp(path.dirname(destPath));
  let content = fs.readFileSync(file, 'utf8');

  // compute relative prefix depending on page depth ('' for root pages, '../' for one level, '../../'...)
  const dir = path.dirname(rel);
  const depth = !dir || dir === '.' ? 0 : dir.split(path.sep).length;
  const prefix = depth === 0 ? '' : '../'.repeat(depth);

  // Prepare per-page adjusted header/footer (rewrite root links to relative ones)
  let adjustedHeader = headerT;
  let adjustedFooter = footerT;

  // Replace href="/" to prefix + index.html
  adjustedHeader = adjustedHeader.replace(
    /href=(['"])\/\1/g,
    (m, q) => `href=${q}${prefix}index.html${q}`
  );
  adjustedFooter = adjustedFooter.replace(
    /href=(['"])\/\1/g,
    (m, q) => `href=${q}${prefix}index.html${q}`
  );

  // Adjust top-level .html files (map.html, opv.html, about.html, etc.)
  adjustedHeader = adjustPaths(adjustedHeader, prefix);
  adjustedFooter = adjustPaths(adjustedFooter, prefix);

  // Adjust favicon link if present in templates (to reference top-level favicon.svg correctly)
  adjustedHeader = adjustedHeader.replace(
    /<link[^>]*href=["'](?:\.?\/)?favicon\.(?:ico|svg)["'][^>]*>/gi,
    `<link rel="icon" href="${prefix}favicon.svg" type="image/svg+xml" />`
  );
  adjustedFooter = adjustedFooter.replace(
    /<link[^>]*href=["'](?:\.?\/)?favicon\.(?:ico|svg)["'][^>]*>/gi,
    `<link rel="icon" href="${prefix}favicon.svg" type="image/svg+xml" />`
  );

  // Remove module script tag from footer (we inject per-page entries)
  adjustedFooter = adjustedFooter.replace(
    /<script[^>]*src=["']\/?js\/main\.js["'][^>]*>\s*<\/script>/gi,
    ''
  );

  // Now replace includes with adjusted content
  content = content.replace(
    /<div\s+data-include=["']\/?templates\/header\.html["']\s*><\/div>/i,
    adjustedHeader
  );
  content = content.replace(
    /<div\s+data-include=["']\/?templates\/footer\.html["']\s*><\/div>/i,
    adjustedFooter
  );

  // Remove runtime include loader script references (we inline them) and any remaining /js/main.js
  content = content.replace(
    /<script[^>]*src=["']\/?js\/(?:include|main)\.js["'][^>]*>\s*<\/script>/gi,
    ''
  );

  // Replace any remaining favicon links to prefixed svg (match any path, incl. file://)
  content = content.replace(
    /<link[^>]*href=["'][^"']*favicon\.(?:ico|svg)["'][^>]*>/gi,
    `<link rel="icon" href="${prefix}favicon.svg" type="image/svg+xml" />`
  );

  // Inject per-page entry script before </body>
  const entryRel = rel.replace(/\.html$/, '.js');
  // compute relative src for the entry from the page location
  const entryPathOnDisk = path.join(TMP, 'entries', entryRel);
  const entrySrcRel = path.relative(path.dirname(destPath), entryPathOnDisk).replace(/\\/g, '/');
  const entrySrc = entrySrcRel.startsWith('.') ? entrySrcRel : './' + entrySrcRel;
  const entryScript = `\n    <script type="module" src="${entrySrc}"></script>\n`;

  if (content.includes('</body>')) {
    content = content.replace(/<\/body>/i, entryScript + '</body>');
  } else {
    content += entryScript;
  }

  fs.writeFileSync(destPath, content, 'utf8');

  // Create corresponding entry file (imports shared main)
  mkdirp(path.dirname(entryPathOnDisk));
  // compute relative import path from entry to js/main.js
  const mainPath = path.join(TMP, 'js', 'main.js');
  let relToMain = path.relative(path.dirname(entryPathOnDisk), mainPath).replace(/\\/g, '/');
  if (!relToMain.startsWith('.') && !relToMain.startsWith('/')) relToMain = './' + relToMain;
  const entryContent = `// Auto-generated entry for ${rel}\nimport '${relToMain}';\n`;
  fs.writeFileSync(entryPathOnDisk, entryContent, 'utf8');
}

// Create .nojekyll
fs.writeFileSync(path.join(TMP, '.nojekyll'), '', 'utf8');

// Create tmp_site vite config (mjs)
const viteConfig = `import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

const root = path.resolve('.');

function collect(dir) {
  const out = {};
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || ['templates', 'entries', 'dist', '_notes'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      Object.assign(out, collect(full));
    } else if (entry.name.endsWith('.html')) {
      const rel = path.relative(root, full).replaceAll('\\\\', '/');
      out[rel] = full;
    }
  }
  return out;
}

const input = collect(root);

export default defineConfig({
  // Use relative base so generated pages work when served from any path/domain
  base: './',
  build: {
    rollupOptions: {
      input
    }
  }
});
`;

fs.writeFileSync(path.join(TMP, 'vite.config.mjs'), viteConfig, 'utf8');

console.log('inline-partials: tmp_site created with entries and vite config.');
console.log('Run: vite build --root tmp_site --config tmp_site/vite.config.mjs --outDir dist');
