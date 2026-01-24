#!/usr/bin/env python3
"""
Script to:
 - normalize missing spaces between attributes in HTML files
 - replace root `header.html` and `footer.html` with `templates/` versions
 - add missing <a href> links in the first column of rows in `index.html` by reusing existing links

Run from repo root: python3 scripts/fix_html_and_index_links.py
"""

import re
import glob
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Regex to find closing quote immediately followed by attribute name (no whitespace)
ATTR_PATTERN = re.compile(r'"([^"]+)"([A-Za-z][A-Za-z0-9-]*=)')


def fix_attr_spacing_in_file(path: Path) -> int:
    text = path.read_text(encoding='utf-8')
    new_text, n = ATTR_PATTERN.subn(r'"\1" \2', text)
    if n > 0:
        path.write_text(new_text, encoding='utf-8')
    return n


def replace_header_footer():
    changed = []
    tpl_header = (ROOT / 'templates' / 'header.html')
    tpl_footer = (ROOT / 'templates' / 'footer.html')
    if tpl_header.exists():
        target = ROOT / 'header.html'
        tpl_text = tpl_header.read_text(encoding='utf-8')
        if not target.exists() or target.read_text(encoding='utf-8') != tpl_text:
            target.write_text(tpl_text, encoding='utf-8')
            changed.append(str(target))
    if tpl_footer.exists():
        target = ROOT / 'footer.html'
        tpl_text = tpl_footer.read_text(encoding='utf-8')
        if not target.exists() or target.read_text(encoding='utf-8') != tpl_text:
            target.write_text(tpl_text, encoding='utf-8')
            changed.append(str(target))
    return changed


def normalize_name(s: str) -> str:
    s = s.replace('\xa0', ' ')
    s = re.sub(r'\s+', ' ', s)
    return s.strip()


def add_missing_links_in_index(index_path: Path) -> (int, list):
    text = index_path.read_text(encoding='utf-8')
    # Build mapping of existing name -> href from anchor cells
    name_to_href = {}
    for m in re.finditer(r'<td>\s*<a\s+href="([^"]+)">\s*([^<]+?)\s*</a>\s*</td>', text, flags=re.IGNORECASE):
        name = normalize_name(m.group(2))
        href = m.group(1)
        if name not in name_to_href:
            name_to_href[name] = href

    # Iterate over table rows and replace first <td> if it has no <a>
    changed = 0
    changed_items = []

    def repl_tr(match):
        nonlocal changed, changed_items
        tr = match.group(0)
        # find first <td>...</td>
        mtd = re.search(r'<td>(.*?)</td>', tr, flags=re.DOTALL)
        if not mtd:
            return tr
        inner = mtd.group(1)
        if '<a ' in inner.lower():
            return tr
        # get plain name
        name_plain = re.sub(r'<[^>]+>', '', inner)
        name_norm = normalize_name(name_plain)
        if not name_norm:
            return tr
        href = name_to_href.get(name_norm)
        if href:
            new_td = '<td><a href="%s">%s</a></td>' % (href, inner.strip())
            new_tr = tr.replace(mtd.group(0), new_td, 1)
            changed += 1
            changed_items.append((name_norm, href))
            return new_tr
        return tr

    new_text = re.sub(r'<tr>.*?</tr>', repl_tr, text, flags=re.DOTALL)
    if changed > 0:
        index_path.write_text(new_text, encoding='utf-8')
    return changed, changed_items


if __name__ == '__main__':
    os.chdir(ROOT)
    html_files = [Path(p) for p in glob.glob('**/*.html', recursive=True) if not p.startswith('dist/') and 'templates/' not in p]
    total_attr_fixes = 0
    files_fixed = []
    for p in html_files:
        # skip templates files, but include header/footer targets
        if str(p).startswith('dist/'):
            continue
        n = fix_attr_spacing_in_file(Path(p))
        if n:
            total_attr_fixes += n
            files_fixed.append((str(p), n))
    print(f'Attribute spacing fixes: {total_attr_fixes} replacements in {len(files_fixed)} files')
    for f,n in files_fixed:
        print('  -', f, '->', n)

    changed_templates = replace_header_footer()
    if changed_templates:
        print('Replaced/updated files from templates:', changed_templates)
    else:
        print('Header/footer already match templates (no change)')

    index_path = ROOT / 'index.html'
    if index_path.exists():
        changed_links, items = add_missing_links_in_index(index_path)
        print(f'Index links added: {changed_links}')
        for name, href in items:
            print('  -', name, '->', href)
    else:
        print('index.html not found; skipping link addition')

    # Exit non-zero if nothing changed to make it clear in CI? We'll still exit 0
    print('Done')
