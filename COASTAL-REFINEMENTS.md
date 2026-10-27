# Coastal refinement

This update starts from the attached `along-the-way-coastal-journal.zip`, rather than the later minimal homepage. It retains the coastal version's side-by-side welcome, handwritten title, featured stories, journey overview, family preview, and photo section.

## Requested changes

- The handwritten title animates automatically once per browser-tab session. The replay control has been removed. Reduced-motion visitors see the finished title immediately.
- The homepage opening uses one clean, uncropped ocean photograph. Tape, printed-paper framing, the overlapping portrait, and handwritten captions have been removed from that opening.
- The extra Meet us link is gone from the opening and the shared header. About Us remains in normal navigation.
- The large Find a thread filter pills are replaced by a dedicated Explore by theme section. Each theme opens the existing archive filtered to that theme. Only themes used by published entries appear; author-chosen colors appear as slim accents, alongside actual story counts.
- Homepage photograph previews have no gray image padding, heavy frames, or forced height. Images keep their proportions within a compact maximum size. Captions use the photo's own caption when available, otherwise View photograph, rather than repeating the entry title.
- The family preview is a simple row of complete photographs with quiet labels and no tilted overlapping paper frames. The About Us family album retains its existing photo-book design and grouping.
- Photos has a compact sage journey toolbar and a clearly labeled native selector. The selector keeps normal keyboard and touch behavior, with a visible focus indicator. Gallery thumbnails now use natural proportions in responsive columns. The existing viewer, keyboard/swipe controls, deep links, and return focus remain available.

## Install

Copy this folder's contents into the existing repository, replacing matching files. Include the new `css/gallery.css` and updated `gallery.html`, plus the revised `css/home.css`, `js/main.js`, `js/title-ink.js`, and `js/reader.js`. Commit and push. Refresh after GitHub Pages deploys; use a hard refresh if the previous design is cached.

No new SQL is required. Drafts, published entries, images in storage, authentication, and authoring tools are unchanged. This update does not modify database content. Any outstanding earlier theme-color migration is still documented in `CURRENT-UPDATE.md`.

## Verification

Automated checks cover the restored coastal structure, removal of replay/Meet us/tape markup, one-image opening, automatic title animation and reduced motion, theme counts and links into the filtered archive, latest-story ordering, empty/slow/offline behavior, mobile menu, photo filtering and singular/plural counts, viewer navigation and focus return, photo deep links, local assets, duplicate IDs, CSS parsing, and JavaScript syntax. Existing family-album checks pass against this package.

The backend, authentication, authoring modules, SQL files, and album data are byte-identical to the supplied ZIP. The shared reader change removes the extra header link; article markup and preview behavior remain unchanged.

Browser/device visual testing remains pending because the supported browser QA tool is unavailable. These are implemented source changes, not a claim that live browser screenshots were verified.
