# Logo, buttons and hero motion

No SQL needed. Replace the repository files with this folder, commit and push.

**Logos** – `images/brand/logo-*.svg` are now true vector traces of your lettering (about 20 KB each instead of ~1.8 MB of embedded pixels), so they stay sharp at any size. Each comes in a dark version and a `-light` (cream) version. The hero uses `logo-stacked-light.svg`; the header and footer use the horizontal dark version.
If you later export a clean vector (SVG/AI/PDF) from your design tool, just replace these four files with the same names.

**Hero photo** – built from the 8148 px original into `images/hero/home-900/1600/2560.webp` and served with `srcset`, so phones get a small file and large screens stay sharp. Swap the photo by replacing those three files (keep the 3:2 shape) or pointing `heroPhoto` in `js/config.js` at a new base name.

**Hero and motion** (`js/hero-motion.js`, `css/refine.css`) – about two seconds start to finish. The page opens on a dusk-blue title card with only the logo; the card lifts into the photo while the logo glides up, then the tagline fades in under it, then the menu and scroll cue. A click, key press or first scroll skips straight to the finished page, and repeat visits in the same session skip the card. On desktop the logo (horizontal) and tagline are sized together from where the couple's heads land in your window, so they never touch them; phones use the stacked logo with the tagline at the bottom. Everything is off for visitors with reduced-motion turned on.

**The people along the way** (`css/play.css`, `js/home-interactions.js`) – three polaroids in a taped stack. Tap or click a photo behind to bring it forward, or use "Shuffle the stack". Tapping the front photo opens that group in the family album (`about.html?group=...`, handled in `js/family-album.js`). The photos and group names are picked in `main.js` (`stackItems`).

**Life between the lines** – a swipeable, draggable strip of the 12 most recent journal photos as small polaroids, each with its date and entry title, plus arrows and a progress line. Change how many photos with `slice(-12)` in `main.js`.

**Surprise me** – now a "Not sure where to start?" card with a "Read a random entry" button and a dice that rolls on click. It only appears when there are at least two entries.

**Buttons and type** – all in `css/refine.css`, loaded last. Square, quiet buttons with a clay fill that sweeps in on hover; text links with an underline that draws in; Jost for small labels (loaded from Google Fonts, falls back to Nunito Sans). Delete `css/refine.css` and its `<link>` lines to go back to the previous look.

**About Us** (`js/family-album.js`, `css/about.css`) – condensed from a long album into a short page: a welcome with photo and letter, one row of four photo tiles (two of us, families, children, grandkids), and a sign-off. Tap a tile to open that group in the full-screen viewer (swipe, arrows, keyboard). Links like `about.html?group=grandkids` open a group directly, which is what the homepage stack uses. All writing is Lorem ipsum placeholder text: edit `aboutNames`, `aboutHeading`, `aboutParagraphs`, `familyIntro` and `familyClosing` in `js/config.js`, and the photo captions and group notes in `js/family-photos.js`. Change which photo fronts each tile in `covers` at the top of `family-album.js`.

**Footer** – now uses the stacked logo.
