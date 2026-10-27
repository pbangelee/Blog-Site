# About Us and the family photographs

All 15 supplied photographs are included. The opening portrait is the photo-book cover. The album is organized into The two of us, Our families, Our children, and Our grandkids, following the requested grouping. Our children means their children without spouses or grandkids.

The complete photograph is visible in each layout. Images have been resized and compressed for the web, with smaller versions for the album and larger versions for the viewer. The supplied originals are not changed.

Names, introductions, and captions remain bracketed placeholders. No personal names or biographical stories have been added. The broad group headings follow your instructions; individual household names are still unknown. Replace the introduction fields in `js/config.js`; edit the corresponding `caption` in `js/family-photos.js` when the family provides wording. The filename and image description identify each photograph without guessing a person's identity. Section assignments can be adjusted in `JOURNAL_FAMILY_GROUPS` at the end of that file.

Choose a section tab to show one group, or Whole album to see all four sections. A little note expands the placeholder text for each section. The photo-book design uses paper frames, subtle tilts, tape accents, and small hover movements; reduced-motion preferences disable motion.

The viewer follows the selected group and supports tap/click, previous/next buttons, keyboard arrows, Escape to close, and horizontal swipe on phones. Focus returns to the photograph that opened it. Failed images offer Try again.

`about.html` and the older `story.html` URL both show the new page. Family photographs remain separate from the published-entry Photos gallery. About Us can load without waiting for the journal database.

## Install

Copy this folder's contents into the existing GitHub repository, replacing matching files and preserving the `images/family/` and `js/` subfolders. Commit and Push origin, then refresh after GitHub Pages deploys.

This family album adds no SQL or database requirements. If the previous theme-color upgrade is still outstanding, follow `CURRENT-UPDATE.md` for that earlier feature.

## Checks

All 30 image files decode successfully. All 15 supplied photographs appear once on the page, while their larger versions are available in the viewer. Script syntax, local file references, placeholder copy, caption escaping, viewer navigation, swipe, retry, and return focus were checked automatically. The existing Writing Room and database code are unchanged from the prior update. Browser and physical-device visual testing remain pending.

## Homepage photographs

The homepage opening uses one clean, uncropped ocean photograph beside the handwritten welcome. Its family preview is a simple three-photo row linking to the album, with Our children, Our grandkids, and Our families labels. The About Us photo-book grouping and all 15 photographs remain unchanged. See `COASTAL-REFINEMENTS.md` for the current homepage and photo browsing notes.

Our children combines the main group portrait with the other two adult group photographs beneath it, without separate men’s or women’s headings or tabs. All 15 photographs remain included.
