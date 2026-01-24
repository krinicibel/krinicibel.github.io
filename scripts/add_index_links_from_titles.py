#!/usr/bin/env python3
"""
Add missing <a href> to the first <td> in index.html rows by matching the displayed name
with the <h2> title of pages in the repo. Prefer pages inside the same district folder (based
on preceding <strong><a name="district"></a> marker).
"""

import re
import glob
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def normalize(s: str) -> str:
    s = s.replace('\xa0', ' ')
    s = re.sub(r'<[^>]+>', '', s)
    s = re.sub(r'\s+', ' ', s)
    return s.strip()


# Build title -> path mapping
mapping = {}
for p in glob.glob('**/*.html', recursive=True):
    if p.startswith('dist/') or p.startswith('templates/'):
        continue
    text = Path(p).read_text(encoding='utf-8')
    m = re.search(r'<h2[^>]*>(.*?)</h2>', text, flags=re.DOTALL|re.IGNORECASE)
    if not m:
        m = re.search(r'<h1[^>]*>(.*?)</h1>', text, flags=re.DOTALL|re.IGNORECASE)
    if m:
        title = normalize(m.group(1))
        if title:
            # store first occurrence only
            if title not in mapping:
                mapping[title] = p

# Parse index.html and add links where possible
index_path = ROOT / 'index.html'
content = index_path.read_text(encoding='utf-8')

# Iterate by regions: track current district anchor
# pattern finds <strong> ... <a name="code"></a> ... </strong>
district_re = re.compile(r'<strong>.*?<a\s+name=["\']([^"\']+)["\'][^>]*>.*?</a>.*?</strong>', re.IGNORECASE|re.DOTALL)
# Split content into pieces to maintain context
pieces = []
last = 0
for m in district_re.finditer(content):
    pieces.append(('text', content[last:m.start()]))
    pieces.append(('district', m.group(1)))
    last = m.end()
pieces.append(('text', content[last:]))

new_content = content
changes = []
# For each district segment, find its table rows
pos = 0
for i in range(len(pieces)):
    typ, val = pieces[i]
    if typ != 'district':
        continue
    district = val
    # next text segment contains the table with rows for this district (until next district)
    table_segment = pieces[i+1][1]
    # find trs inside this segment
    def repl_tr(match):
        tr = match.group(0)
        # find first td
        mtd = re.search(r'<td>(.*?)</td>', tr, flags=re.DOTALL|re.IGNORECASE)
        if not mtd:
            return tr
        inner = mtd.group(1)
        if '<a ' in inner.lower():
            return tr
        name_plain = normalize(inner)
        if not name_plain:
            return tr
        # prefer mapping where path starts with district/
        candidate = None
        if name_plain in mapping:
            candidate = mapping[name_plain]
            # prefer same-district
            if candidate.startswith(district + '/'):
                href = candidate
            else:
                # try to find any other mapping which is inside district
                for t, p in mapping.items():
                    if t == name_plain and p.startswith(district + '/'):
                        candidate = p
                        break
                href = candidate
        else:
            # try case-insensitive match
            for t, p in mapping.items():
                if t.lower() == name_plain.lower():
                    candidate = p
                    break
            href = candidate
        if not href:
            return tr
        # make href relative (index.html is at root)
        href_rel = href.replace('\\', '/')
        new_td = '<td><a href="%s">%s</a></td>' % (href_rel, inner.strip())
        new_tr = tr.replace(mtd.group(0), new_td, 1)
        changes.append((name_plain, href_rel))
        return new_tr

    new_table_segment = re.sub(r'<tr>.*?</tr>', repl_tr, table_segment, flags=re.DOTALL|re.IGNORECASE)
    # replace the segment in new_content (first occurrence)
    # Be careful to replace only the first occurrence of table_segment following pos
    idx = new_content.find(table_segment, pos)
    if idx != -1:
        new_content = new_content[:idx] + new_table_segment + new_content[idx+len(table_segment):]
        pos = idx + len(new_table_segment)

if changes:
    index_path.write_text(new_content, encoding='utf-8')

print('Index links additions:', len(changes))
for name, href in changes:
    print('  -', name, '->', href)
print('Done')
