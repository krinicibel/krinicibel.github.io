#!/usr/bin/env python3
"""
Fix and standardize embedded iframes across the site:
 - Wrap map iframes in <div class="embed-responsive map-responsive" data-aspect="...">... </div>
 - Wrap video iframes (YouTube) in <div class="embed-responsive embed-video">... </div>
 - Remove inline width/height/frameborder/style attributes
 - Ensure `loading="lazy"` and `title` and `aria-label` are present
 - Keep allow/referrerpolicy/allowfullscreen attributes

Usage: python scripts/fix_embeds.py
"""

import re
from pathlib import Path
from html import unescape

ROOT = Path(__file__).resolve().parents[1]
IGNORE_DIRS = {"dist", "templates", "node_modules"}

IFRAME_RE = re.compile(r"<iframe\b[^>]*>.*?</iframe>", re.IGNORECASE | re.DOTALL)
OPEN_TAG_RE = re.compile(r"<iframe\b([^>]*)>", re.IGNORECASE | re.DOTALL)
ATTR_RE = re.compile(r"([^\s=]+)(?:\s*=\s*(?:\"([^\"]*)\"|'([^']*)'|([^\s\"'=<>`]+)))?", re.DOTALL)
H2_RE = re.compile(r"<h2\b[^>]*>(.*?)</h2>", re.IGNORECASE | re.DOTALL)
TITLE_RE = re.compile(r"<title\b[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)

changed_files = []


def clean_whitespace_for_allow(value: str) -> str:
    # collapse whitespace and semicolons to single semicolons separated by single space
    parts = [p.strip() for p in re.split(r"[;\n]+", value) if p.strip()]
    return "; ".join(parts)


def parse_attrs(open_tag_text: str) -> dict:
    m = OPEN_TAG_RE.search(open_tag_text)
    if not m:
        return {}
    attr_text = m.group(1)
    attrs = {}
    for a in ATTR_RE.finditer(attr_text):
        name = a.group(1).lower()
        val = a.group(2) or a.group(3) or a.group(4) or ""
        attrs[name] = val
    return attrs


def detect_kind(src: str) -> str:
    s = src.lower()
    if "youtube.com/embed" in s or "youtu.be/" in s:
        return "video"
    if "openstreetmap.org" in s or "google.com/maps" in s or "arcgis" in s or "storymaps" in s:
        return "map"
    return "embed"


def aspect_from_wh(width: str, height: str) -> str | None:
    try:
        w = float(width)
        h = float(height)
        if w <= 0 or h <= 0:
            return None
        ratio = w / h
        if abs(ratio - (16 / 9)) < 0.06:
            return "16-9"
        if abs(ratio - (4 / 3)) < 0.06:
            return "4-3"
        if abs(ratio - (3 / 2)) < 0.06:
            return "3-2"
    except Exception:
        return None
    return None


for path in ROOT.rglob("*.html"):
    if any(part in IGNORE_DIRS for part in path.parts):
        continue
    text = path.read_text(encoding="utf-8")
    orig = text
    page_title = ""
    # try to extract an informative title from <h2> or <title>
    m = H2_RE.search(text)
    if m:
        page_title = re.sub(r"<[^>]+>", "", m.group(1)).strip()
    else:
        m = TITLE_RE.search(text)
        if m:
            page_title = re.sub(r"<[^>]+>", "", m.group(1)).strip()
    if not page_title:
        page_title = path.stem

    new_text = text
    offset = 0
    edits = 0

    for match in list(IFRAME_RE.finditer(text)):
        iframe_html = match.group(0)
        start = match.start()

        # check if already wrapped within an embed container (look back a short distance)
        context_before = text[max(0, start - 400) : start]
        already_wrapped = bool(re.search(r"<div[^>]+class=[\"'][^\"']*(embed-responsive|map-responsive|embed-video)[^\"']*[\"']", context_before, re.IGNORECASE))

        # parse attributes
        attrs = parse_attrs(iframe_html)
        src = attrs.get("src", "").strip()
        if not src:
            # nothing to do
            continue
        kind = detect_kind(src)

        # compute aspect
        aspect = aspect_from_wh(attrs.get("width", ""), attrs.get("height", ""))
        if not aspect and kind == "map":
            # fallback to 4-3 for maps
            aspect = "4-3"
        if not aspect and kind == "video":
            aspect = "16-9"

        # prepare new attrs
        new_attrs = {}
        new_attrs["src"] = src
        # prefer existing title, otherwise build one
        if attrs.get("title"):
            title_val = attrs.get("title")
        else:
            title_val = ("Видео: " if kind == "video" else "Карта: ") + page_title
        new_attrs["title"] = title_val
        new_attrs["aria-label"] = attrs.get("aria-label", title_val)
        new_attrs["loading"] = attrs.get("loading", "lazy")

        if attrs.get("allow"):
            new_attrs["allow"] = clean_whitespace_for_allow(attrs.get("allow"))
        if attrs.get("referrerpolicy"):
            new_attrs["referrerpolicy"] = attrs.get("referrerpolicy")
        if "allowfullscreen" in attrs or re.search(r"allowfullscreen\b", iframe_html, re.IGNORECASE):
            new_attrs["allowfullscreen"] = None

        # build iframe tag
        parts = [f'src="{new_attrs.pop("src")}"']
        for k in ["title", "aria-label", "loading", "allow", "referrerpolicy"]:
            if k in new_attrs:
                parts.append(f'{k}="{new_attrs[k]}"')
        if "allowfullscreen" in new_attrs or "allowfullscreen" in attrs:
            parts.append("allowfullscreen")

        iframe_one_liner = "<iframe " + " ".join(parts) + "></iframe>"

        if already_wrapped:
            # just replace inner iframe with sanitized one
            new_text = new_text.replace(iframe_html, iframe_one_liner)
            edits += 1
        else:
            # wrap accordingly
            if kind == "video":
                wrapper = f'<div class="embed-responsive embed-video">\n  {iframe_one_liner}\n</div>'
            elif kind == "map":
                aspect_attr = f' data-aspect="{aspect}"' if aspect else ""
                wrapper = f'<div class="embed-responsive map-responsive"{aspect_attr}>\n  {iframe_one_liner}\n</div>'
            else:
                wrapper = f'<div class="embed-responsive">\n  {iframe_one_liner}\n</div>'
            new_text = new_text.replace(iframe_html, wrapper)
            edits += 1

    if edits:
        path.write_text(new_text, encoding="utf-8")
        changed_files.append((str(path), edits))
        print(f"Updated {path}: {edits} iframe(s)")

if not changed_files:
    print("No iframe changes needed")
else:
    print("Done. Files updated:")
    for f, e in changed_files:
        print(f" - {f}: {e} iframe(s)")
