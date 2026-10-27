#!/usr/bin/env python3
"""
Builds the little "link preview" pages that make shared stories look cute.

Why this exists: the site loads each story with JavaScript, but Messages, Facebook, WhatsApp and email
read a link WITHOUT running JavaScript. So for every PUBLISHED story this script writes
    share/<id>.html   a tiny page with the title, a short note and the cover photo for the preview card
    share/<id>.jpg    the cover photo, cropped to the shape preview cards use (1200 x 630)
    share/index.json  the list of stories that have a preview page (the Share button reads this)
People who open a shared link are sent straight on to the real story.

Run it after publishing or updating a story, then commit the share/ folder:
    pip install pillow
    python3 make_share_pages.py

Drafts and unpublished stories never get a page. Pages for stories that are no longer published are removed.
Uses only the browser-safe publishable key already in js/config.js; no secret key is needed.
"""
import io, json, re, sys, urllib.request, urllib.parse, html
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent
SHARE = ROOT / "share"
CARD = (1200, 630)

def read_config():
    text = (ROOT / "js" / "config.js").read_text(encoding="utf-8")
    def grab(key):
        m = re.search(key + r'\s*:\s*"([^"]*)"', text)
        return m.group(1) if m else ""
    return {"site": grab("siteUrl").rstrip("/"), "url": grab("supabaseUrl").rstrip("/"), "key": grab("publishableKey")}

def api(cfg, path, body=None):
    req = urllib.request.Request(cfg["url"] + path, data=None if body is None else json.dumps(body).encode(),
                                 headers={"apikey": cfg["key"], "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()

def plain(text, limit=200):
    text = re.sub(r"<[^>]+>", " ", text or "")
    text = html.unescape(re.sub(r"\s+", " ", text)).strip()
    if len(text) <= limit: return text
    return text[:limit].rsplit(" ", 1)[0].rstrip(",.;:") + "…"

def pretty_date(iso):
    try:
        import datetime
        d = datetime.date.fromisoformat(iso)
        return d.strftime("%B ") + str(d.day) + d.strftime(", %Y")
    except Exception:
        return ""

def crop_card(raw):
    """Fill a 1200x630 card from the whole original photo. Favors the upper part so faces stay in frame."""
    im = Image.open(io.BytesIO(raw)).convert("RGB")
    w, h = im.size
    target = CARD[0] / CARD[1]
    if w / h > target:                       # too wide: trim the sides, centered
        nw = int(h * target); x = (w - nw) // 2; im = im.crop((x, 0, x + nw, h))
    else:                                    # too tall: trim the bottom more than the top
        nh = int(w / target); y = int((h - nh) * 0.30); im = im.crop((0, y, w, y + nh))
    return im.resize(CARD, Image.LANCZOS)

def page(site, entry, has_photo):
    e = lambda s: html.escape(s, quote=True)
    sid = urllib.parse.quote(entry["id"])
    url = f"{site}/share/{sid}.html"
    image = f"{site}/share/{sid}.jpg" if has_photo else f"{site}/share/default.jpg"
    title = plain(entry.get("title", ""), 120) or "A story from Along the Way"
    when = pretty_date(entry.get("entry_date", ""))
    desc = plain(entry.get("excerpt", "")) or "A story from Along the Way, our little corner of the field."
    if when: desc = f"{when} · {desc}"
    go = f"../entry.html?id={sid}"
    alt = "The cover photo for this story" if has_photo else "Along the Way"
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>{e(title)} | Along the Way</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{e(url)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Along the Way">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{e(url)}">
<meta property="og:image" content="{e(image)}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{e(alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(title)}"><meta name="twitter:description" content="{e(desc)}"><meta name="twitter:image" content="{e(image)}">
<link rel="icon" href="../images/brand/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="../images/brand/apple-touch-icon.png">
<meta http-equiv="refresh" content="0; url={e(go)}">
<script>location.replace({json.dumps(go)});</script>
<style>body{{margin:0;min-height:100vh;display:grid;place-items:center;background:#fbf9f4;color:#342e28;font:16px/1.6 system-ui,sans-serif;text-align:center}}a{{color:#62412f}}</style>
</head><body><p>Opening the story… <br><a href="{e(go)}">Tap here if it doesn’t open.</a></p></body></html>
"""

def build(cfg, entries, fetch):
    """entries: rows from journal_public_entries. fetch(path) -> bytes of that photo from storage."""
    SHARE.mkdir(exist_ok=True)
    keep = []
    for entry in entries:
        photos = entry.get("photos") or []
        cover = next((p for p in photos if p.get("path") == entry.get("cover_path")), None)
        # The card uses the whole original photo, not the narrow crop used on the page.
        path = (cover or {}).get("coverOriginal") or (cover or {}).get("path")
        has_photo = False
        if cover and not cover.get("sample") and path:
            try:
                crop_card(fetch(path)).save(SHARE / f"{entry['id']}.jpg", quality=86, optimize=True, progressive=True)
                has_photo = True
            except Exception as err:
                print(f"  (no cover photo for {entry['id']}: {err})")
        if not has_photo:
            (SHARE / f"{entry['id']}.jpg").unlink(missing_ok=True)
        (SHARE / f"{entry['id']}.html").write_text(page(cfg["site"], entry, has_photo), encoding="utf-8")
        keep.append(entry["id"])
        print("  ✓", entry.get("title", entry["id"]))
    # Anything no longer published loses its page and picture.
    for f in list(SHARE.glob("*.html")) + list(SHARE.glob("*.jpg")):
        if f.stem not in keep and f.stem != "default":
            f.unlink(); print("  removed", f.name)
    (SHARE / "index.json").write_text(json.dumps({"ids": keep}, indent=1), encoding="utf-8")
    return keep

def main():
    cfg = read_config()
    if not cfg["site"]:
        sys.exit('Add your site address to js/config.js first, for example  siteUrl: "https://yourname.github.io/Blog-Site"')
    if not cfg["url"] or not cfg["key"]:
        sys.exit("js/config.js is missing the Supabase address or publishable key.")
    q = "/rest/v1/journal_public_entries?select=id,title,excerpt,entry_date,cover_path,photos&order=entry_date.desc"
    entries = json.loads(api(cfg, q))
    def fetch(path):
        signed = json.loads(api(cfg, "/storage/v1/object/sign/journal-photos/" + urllib.parse.quote(path), {"expiresIn": 600}))
        with urllib.request.urlopen(cfg["url"] + "/storage/v1" + signed["signedURL"], timeout=60) as r:
            return r.read()
    print(f"Building preview pages for {len(entries)} published stories…")
    ids = build(cfg, entries, fetch)
    print(f"Done. {len(ids)} pages in share/. Commit the share folder and push.")

if __name__ == "__main__":
    main()
