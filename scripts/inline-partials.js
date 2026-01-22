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

// Process each HTML file
for (const file of htmlFiles) {
  const rel = path.relative(ROOT, file);
  const destPath = path.join(TMP, rel);
  mkdirp(path.dirname(destPath));
  let content = fs.readFileSync(file, 'utf8');

  // Replace header/footer includes (flexible about quotes and leading slash)
  content = content.replace(
    /<div\s+data-include=["']\/?templates\/header\.html["']\s*><\/div>/i,
    headerT
  );
  content = content.replace(
    /<div\s+data-include=["']\/?templates\/footer\.html["']\s*><\/div>/i,
    footerT
  );

  // Remove runtime include loader script references (we inline them)
  content = content.replace(/<script[^>]*src=["']\/?js\/include\.js["'][^>]*>\s*<\/script>/i, '');

  // Inject per-page entry script before </body>
  const entryRel = rel.replace(/\.html$/, '.js');
  const entrySrc = '/entries/' + entryRel.replace(/\\/g, '/');
  const entryScript = `\n    <script type="module" src="${entrySrc}"></script>\n`;

  if (content.includes('</body>')) {
    content = content.replace(/<\/body>/i, entryScript + '</body>');
  } else {
    content += entryScript;
  }

  fs.writeFileSync(destPath, content, 'utf8');

  // Create corresponding entry file (imports shared main)
  const entryPathOnDisk = path.join(TMP, 'entries', entryRel);
  mkdirp(path.dirname(entryPathOnDisk));
  const entryContent = `// Auto-generated entry for ${rel}\nimport '/js/main.js';\n`;
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
    if (entry.name.startsWith('.') || entry.name === 'templates' || entry.name === '_notes') continue;
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
  base: '/',
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
