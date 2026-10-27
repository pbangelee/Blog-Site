Latest revision: SHARE-AND-FAMILY-UPDATE.md. Share buttons and link previews, full-photo viewing, album and Writing Room changes. No SQL changes.

Latest revision: SCROLL-AND-NAV-UPDATE.md. Sticky navigation, title placement and interactive details. No SQL changes.

Latest revision: PHOTO-OPENING-UPDATE.md. Full-width photo opening and serif typography. The homepage moment was removed; no SQL upgrade is required.

Latest update: DISCOVERY-UPDATE.md — adaptable themes, journey path and homepage photo selection.

Latest update: INTERACTION-UPDATE.md — smoother navigation, hover feedback and clean family album spreads.

Current design: see WARM-JOURNAL-UPDATE.md for the warm palette and Latest entry revision.

# Current revision

See [COASTAL-REFINEMENTS.md](COASTAL-REFINEMENTS.md) for the restored coastal design and requested homepage/theme/photo changes. No new SQL is required.

# Latest update

See [HOMEPAGE-UPDATE.md](HOMEPAGE-UPDATE.md) for the coastal journal homepage and handwritten title. No new SQL is required.

# Along the Way

A personal mission journal built with HTML, CSS, JavaScript, and Supabase. Hosted through the existing GitHub Pages repository; no build step is required.

## Current update

Read `FAMILY-ALBUM.md` for the new About Us family album. The earlier theme and reader-preview changes are documented in `CURRENT-UPDATE.md`.

- Nothing You Could Do for the title and logo; La Belle Aurore for small personal notes.
- Public navigation: Home, About Us, The Journey, Photos.
- Writing Room: Entries, a guided Write → Details & cover → Review editor, private Notebook, Organize your journal, and Trash.
- Collections is removed from the interface; old entries and chapter records are preserved for compatibility.
- Year Three stays hidden automatically until June 23, 2027, unless its visibility is changed.

## Update an existing working installation

The current update adds theme colors. After the earlier notebook and organization upgrade, run `backend/upgrade-theme-colors.sql` once in the same Along the Way project.

1. In the existing Along the Way Supabase project, run the entire `backend/upgrade-notebook-and-organization.sql` in a new SQL Editor query. This assumes the earlier Writing Room and story-tools upgrades have already been installed.
2. Copy the contents of this folder into the existing GitHub repository, replacing matching files. Keep the subfolders intact.
3. Commit and Push origin. Refresh once GitHub Pages finishes deploying.

## New installation

Follow `SETUP.md` for the account and project configuration. Run SQL files in this order:

1. `backend/setup.sql`
2. `backend/upgrade-writing-room.sql`
3. `backend/upgrade-story-tools.sql`
4. `backend/upgrade-notebook-and-organization.sql`
5. `backend/upgrade-theme-colors.sql`

The newest upgrade must run last so publishing includes the current metadata. Never put a service_role or secret key in browser code. `js/config.js` contains only the browser-safe publishable key.

## Writing and photographs

Use `admin.html` to sign in. Drafts and notebook pages are private. Publish or Update live entry explicitly to share an entry. Photos used in published entries appear in the public gallery automatically.

Entry dates choose a mission year automatically, or the author can choose a journey section manually. Themes can be created, renamed, reordered, and deleted in Organize your journal.

For homepage introductory text and a future welcome photograph, edit the corresponding values in `js/config.js`. The actual personal stories are written by the authors, not prefilled by this update.

## Local preview

Open this folder in VS Code and use Live Server on `index.html`. The public site and authentication need an internet connection. Google Fonts supplies the fonts, with serif fallbacks if it cannot load.

## Files

- `js/main.js`: public page rendering
- `js/backend.js`: published snapshot and photo adapter
- `js/journey.js`: shared journey/theme model with editable organization
- `js/admin.js`: entry editor and authentication
- `js/organizer.js`: notebook autosave and organization controls
- `css/styles.css`, `css/admin.css`: appearance and responsive layouts
- `backend/`: SQL setup and upgrades
- `demo-content.html`, `DEMO.md`: optional fictional demo content tools

Older design notes remain in the folder as references. `WRITING-ROOM-REVISION.md` describes the current version.
