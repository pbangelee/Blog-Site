# Photo-led opening

The homepage now has a full-width original ocean photograph, Instrument Serif title and wordmark, and a handwritten La Belle Aurore accent. The accent reveals from left to right; the main title fades in. On phones the title sits above the complete photograph to avoid covering faces.

Removed A moment from the journal and its Writing Room selector. No database changes are needed. If you already ran the earlier homepage-moment migration, the unused table can stay; this version does not query it.

Replace repository files, commit and push. To replace the hero later, update images/family/family-14-large.webp and its responsive thumbnail with the same photo framing.

This uses the original photo, not the AI mockup. Web fonts load from Google Fonts with local/system fallbacks.
