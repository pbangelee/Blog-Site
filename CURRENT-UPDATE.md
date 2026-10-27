# Writing Room update — v15

- Filter stories by section, theme, and experience-date range. Filters combine and can be cleared together.
- Soft rounded filter panel, active-filter count, and mobile date controls.
- Theme bubbles lift gently on hover, with Edit inside each bubble.
- Written by is a simple free-text name field; perspective presets removed.
- Little details uses colored selectable theme pills with clear checkmarks and keyboard focus.
- Cover crop shows the entire photo with a bright crop frame and dimmed surroundings. Drag to move, drag a corner to resize, or use the frame-size slider. Reset restores the full-width crop. Arrow keys move the frame; plus/minus resize it.
- Crop exports retain the cover’s 3:1 ratio and preserve the original photo. No database migration required.

Validated locally using sample records and a mocked backend: combined filters, pagination, name/theme persistence, crop drag/resize/reset/upload, responsive layout, and existing public archive behavior. Live hosting and database were not changed.
