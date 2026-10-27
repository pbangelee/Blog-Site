# Typography and journey polish

**Superseded:** the current font is Nothing You Could Do for title and logo. See `WRITING-ROOM-REVISION.md` for the latest Writing Room and required database upgrade. The notes below describe the earlier typography pass.

This update requires no additional SQL. Keep the story-tools upgrade already installed for bylines, themes, and private ideas.

- Allura is used for the Along the Way title and logo.
- La Belle Aurore replaces the bolder handwriting in the small personal notes.
- Serif headings and plain body text remain readable. Fonts load through Google Fonts; if that connection is unavailable, serif fallbacks keep the site usable.
- The public journey now shows Before the Mission, Year One, and Year Two. Year Three stays out of the homepage, journey cards, archive dropdown, and photo dropdown until June 23, 2027.
- Future-year matching remains available privately in the editor, so existing dates and entries are not changed.
- In `js/config.js`, `showFutureJourneyYears: ["year-3"]` can show Year Three early. `hiddenJourneyYears: ["year-3"]` keeps it hidden even after its start date. The default lists are empty.
- Page navigation uses short native crossfades where supported. Other browsers get a light content entrance. Normal links, Back navigation, and filters keep working; no artificial navigation delay or loading screen is added. Reduced-motion settings disable these effects.

Replace the repository files with the contents of this folder, commit, and Push origin. After deployment, hard-refresh if the old fonts remain cached. The typography and motion still need a visual check on the deployed site and a phone.

The private notebook and editable journey/theme settings discussed as further ideas are not part of this typography update; the existing Ideas and collection tools are preserved.
