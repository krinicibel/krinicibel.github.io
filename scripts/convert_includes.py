#!/usr/bin/env python3
"""
Convert inline includeHTML pattern to data-include placeholders using templates
 - replace <div id="header-container"></div> with <div data-include="/templates/header.html"></div>
 - replace <div id="footer-container"></div> with <div data-include="/templates/footer.html"></div>
 - remove the inline <script> ... async function includeHTML ... includeHTML(...) ... </script>
"""

import re
import glob
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

SCRIPT_RE = re.compile(r'<script[^>]*>\s*?async\s+function\s+includeHTML\s*\([^)]*\)[\s\S]*?includeHTML\s*\([^;]+;?\s*includeHTML\s*\([^;]+;?\s*</script>', re.IGNORECASE)
# Fallback: if the above is too strict, also remove any script block that contains 'async function includeHTML'
ALT_SCRIPT_RE = re.compile(r'<script[^>]*>[\s\S]*?async\s+function\s+includeHTML[\s\S]*?</script>', re.IGNORECASE)

DIV_HEADER_RE = re.compile(r'<div[^>]*id=["\']header-container["\'][^>]*>\s*</div>', re.IGNORECASE)
DIV_FOOTER_RE = re.compile(r'<div[^>]*id=["\']footer-container["\'][^>]*>\s*</div>', re.IGNORECASE)

changed_files = []

for path in glob.glob('**/*.html', recursive=True):
    if path.startswith('dist/') or path.startswith('templates/'):
        continue
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    if 'async function includeHTML' not in text:
        continue
    orig = text
    text = DIV_HEADER_RE.sub('<div data-include="/templates/header.html"></div>', text)
    text = DIV_FOOTER_RE.sub('<div data-include="/templates/footer.html"></div>', text)
    # remove script block
    text, n = SCRIPT_RE.subn('', text)
    if n == 0:
        text, n = ALT_SCRIPT_RE.subn('', text)
    if text != orig:
        p.write_text(text, encoding='utf-8')
        changed_files.append((path, n))

print('Files updated (include -> data-include):', len(changed_files))
for f, n in changed_files:
    print('  -', f, 'script-blocks-removed:', n)
print('Done')
