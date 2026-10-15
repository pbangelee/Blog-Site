# Along the Way

**Want a full demo journal?** Open `demo-content.html` on Live Server while signed in as the author, then click Add demo content. See `DEMO.md`. No new SQL is needed.

**Already ran the Writing Room upgrade successfully?** This simplified editor uses the same database: no SQL changes are needed. Read `WRITING-ROOM.md`.

**Existing connected project:** read `UPGRADE.md` and run `backend/upgrade-writing-room.sql` before using this update. Your existing account, entries, and photos are preserved.

**New project:** follow `SETUP.md`, running setup.sql and then upgrade-writing-room.sql.

Plain HTML, CSS and JavaScript. No build step.

## Preview in VS Code
1. Open this folder in VS Code (File > Open Folder).
2. Install the **Live Server** extension (Ritwick Dey) if you haven't.
3. Right-click `index.html` and choose **Open with Live Server**.

(Open it via Live Server, not by double-clicking the file; the entry and chapter pages use links like `entry.html?id=...`.) Headings use Google Fonts, so they need an internet connection; without one, Georgia is used instead.

## Where things are
- `js/data.js`: ALL content (chapters, entries, photos, author placeholders). Edit here.
- `js/main.js`: renders every page from that data.
- `css/styles.css`: colors and fonts are variables at the top.
- `images/`: sample placeholder photos; replace a file with a real photo of the same name, or point `src` in `data.js` to a new file.
- `make_images.py`: optional script that made the placeholders. Not needed to run the site.

## Common edits
- Add a chapter: add an object to `chapters` with a unique `id` and `order` number.
- Add an entry: add an object to `entries` with `chapter` set to a chapter id. Add its photos to `photos`; the gallery picks them up automatically.
- Fill in the [placeholders] in `author` and in `about()` in `main.js`.

All names, dates and text are fictional samples. The data shape is ready to be replaced later by a backend that returns the same structure.

## v2 additions
- **Map pins:** edit `map.markers` in `js/data.js` (each pin needs a real entry id; x/y are percentages). Delete a pin by removing its line. The dotted trail is decoration only.
- **Sample art:** the images are illustrated placeholders made by `make_sample_art.py` (not real photos). A notice in the footer and in the gallery viewer says so. For a real photo, drop it in `images/`, point the photo's `src` in `data.js` to it, and add `sample: false` so the viewer label disappears. Remove `sampleNotice` in `site` to hide the footer note.
- **Animation:** reveals live in `reveal()` at the bottom of `js/main.js`; timings are CSS variables/transitions in `css/styles.css`. Reduced-motion settings turn it all off.

## Editorial redesign
The homepage now opens with a large editorial masthead and featured/recent entries, followed by photo chapter cards, an author introduction, a coastal map, and a gallery preview. Shared styling covers all seven pages, with mobile layouts and reduced-motion support.

The supplied illustrations and fictional entries are retained as placeholders. Replace these with her real photos and words before sharing the journal. Fonts load from Google Fonts; local system fonts work as a fallback. No hosting, account, installation, or build step is required.

## Handwriting and mobile polish
- The homepage title is an original SVG lettering drawing, animated stroke by stroke once per browser-tab session. It is independent of Google Fonts. Clear session storage to replay it; with reduced motion enabled or storage unavailable it appears complete immediately.
- The mobile menu uses large touch targets, closes on Escape or an outside tap, and excludes hidden links from keyboard focus.
- Entry pages have estimated reading time, a scroll progress line, comfortable mobile typography, and previous/next letter navigation.
- Gallery photos support horizontal swipes; buttons and keyboard arrows remain available.
- Responsive WebP copies at 480px and 960px are supplied, with image dimensions reserved and the main photo loaded first. When replacing images, regenerate the matching WebP copies and update IMAGE_SIZES in main.js, or remove that record to use the original file alone.
- Browser viewport testing was unavailable in this environment. Rendering, link references, asset variants, and interaction logic were checked programmatically.

## Private writing room
Open `admin.html` for the new author dashboard. Read `SETUP.md` to connect a new Supabase project and designate her account. Until configured, public pages retain the static design preview and the editor shows a setup message. After configuration, published database entries drive all public pages. Drafts remain private under database policies. The live integration has not yet been connected or verified.
