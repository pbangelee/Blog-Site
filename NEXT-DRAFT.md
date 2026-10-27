# Along the Way: their shared journey

**Current revision:** see `WRITING-ROOM-REVISION.md`; the Notebook and Journey & themes controls now supersede the Ideas/Collections interface described below.

**Later typography update:** see `TYPE-AND-MOTION.md`. Year Three is now hidden until its start date. If you already ran the story-tools upgrade, there is no additional SQL.

This draft builds the structure for their writing and photographs. It does not add invented personal stories, import the PDF's text, change existing entries, or publish anything to Supabase.

## Update your existing site

1. Extract the ZIP and copy the contents of `along-the-way` into the existing Blog-Site repository folder. Replace matching files and keep the `css`, `js`, `images`, and `backend` folders intact.
2. In Supabase's SQL Editor, open a new query, paste the entire contents of `backend/upgrade-story-tools.sql`, and choose Run. This assumes the Writing Room upgrade was already completed. It adds themes, bylines, and private ideas without moving or rewriting existing entries. It is safe to run again.
3. Commit in GitHub Desktop and Push origin. Refresh after GitHub Pages finishes deploying.

The public design and original writing tools work before step 2. The Writing Room shows a setup note and keeps the new metadata controls unavailable until the upgrade is installed.

For a brand-new database, run setup.sql, then upgrade-writing-room.sql, then upgrade-story-tools.sql. If you rerun the Writing Room upgrade later, rerun upgrade-story-tools.sql afterward so publication includes the new metadata.

## Public structure

Navigation: Home, Our Story, The Journey, Photos.

- Home opens with a quiet introduction and Begin the journey / Read our latest. No invented photograph is used. Published entries and actual uploaded photographs populate the relevant sections.
- Our Story gathers entries dated before the mission's start.
- The Journey offers Before the Mission, Year One, Year Two, and Year Three, plus All entries. Years use the date of each experience, not the order it was published.
- Mission start is June 23, 2025, configurable in `js/config.js`. Year One runs through June 22, 2026; Year Two begins June 23, 2026; Year Three begins June 23, 2027. Stories outside these periods remain available in All entries.
- All entries can be filtered by year and theme, searched, and sorted. Existing chapters are retained as collections and are also available as a filter. No existing chapter IDs, assignments, or dates are changed.
- Photos gathers real images used in published entries and links them to their stories. Sample-marked illustrations are excluded. Photos can be filtered by mission year.
- Our Little Corner of the Field appears as a personal phrase. The About page identifies the site as a personal journal.

## Writing Room

The date field is visible while writing and explains which year the entry belongs to. For a retrospective, choose the date of the experience. A cover is optional: entries without one use a clean text layout.

Under Entry details, Written by and Themes are optional. Theme choices: Faith, People, Leadership, Everyday Moments, What We're Learning. Private changes to a published entry do not change its public byline or themes until Update live entry is confirmed.

Ideas is a private list of short notes. Save a few words without a title, date, or collection. Use as a draft copies a note into the editor and keeps the original idea. Deleting the idea does not delete the draft. No ideas are automatically published.

Collections keeps the old chapter-management tools, preserving existing work. Collections group related entries; mission years are determined separately by date.

## When the photographs and writing arrive

Upload story photos through the Writing Room. They automatically populate the gallery after publication. Set a cover when desired.

For a welcome photograph, add the image under `images/` and set `welcomePhoto` and `welcomePhotoAlt` in `js/config.js`. The layout adapts automatically. `welcomeIntro`, `storyIntro`, and `aboutText` are editable there as well. The current copy is a short general introduction, leaving the actual personal story to its authors.

## Loading behavior

There is no opening screen, spinner, or gray placeholder grid. The header and page introduction appear first. Published stories populate after retrieval; actual connection errors show a short retry message. Small save/upload status remains near the editor actions. No public snapshot is cached in persistent browser storage.

## Verification

Automated checks cover mission-year boundaries, public rendering, filtering, metadata conversion, private revisions and republishing, review/cancel, autosave while typing, inline uploads, private idea saving/copying/deletion, compatibility before the new migration, demo retries, local links, and JavaScript syntax.

The SQL migration was reviewed structurally but has not been executed against your hosted database. Browser rendering and a real-phone visual review remain to be checked after deployment.
