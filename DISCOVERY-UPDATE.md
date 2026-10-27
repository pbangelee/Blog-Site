# Explore the journal

- Adaptive theme buttons: every custom theme gets a neutral hand-drawn shape, its own saved color and its full name. No fixed category illustrations or manual icon matching.
- Journey path: visible sections, real published photographs, entry counts, and a current-section marker. Vertical on phones.
- A moment from the journal: real photograph, existing caption and story link.
- Surprise me: opens a randomly selected published entry.
- Turn the page: previous/next entry titles and photographs in the public reader and matching preview.
- Gallery: gentle photograph transitions and a clear story link.

## Install
Replace repository files, commit and push.

To choose the homepage photograph yourself, run backend/upgrade-home-moment.sql once in the EXISTING Along the Way Supabase project. Then sign in to the Writing Room and open Organize your journal → Homepage photo moment. Select a published entry and photograph, then Save homepage photo. Choose Automatic to use the latest published photograph again. Reload the Writing Room after publishing new photographs to refresh the choices.

Without the upgrade, the site still works and automatically features the latest published photo. If the chosen photo or entry is removed, the homepage falls back to an available published photograph.

No personal welcome copy was added. All featured material comes from existing published entries.

Validation: DOM checks for custom themes, selected/missing featured photos, random-entry availability, reading links, gallery, album and motion; JavaScript syntax and CSS parsing. Database migration was reviewed but not run against your database. Browser visual testing remains pending.
