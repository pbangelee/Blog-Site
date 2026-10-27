# Writing Room revision

## Install this update

1. Open the existing Along the Way Supabase project. Its project URL is `https://mjpfhnxpfpaubdtpuzok.supabase.co`.
2. In a new SQL Editor query, paste and run the entire `backend/upgrade-notebook-and-organization.sql`. This assumes the earlier story-tools upgrade has already been run. This migration checks for the expected tables before changing anything and runs within one transaction.
3. Copy this folder's contents into the existing Blog-Site repository, replacing matching files. Keep the `js`, `css`, `images`, and `backend` folders intact. Commit and Push origin in GitHub Desktop.
4. Refresh after deployment; hard-refresh if an old font or layout remains cached.

The migration preserves existing entries, photos, draft/public separation, original chapter assignments, and every existing idea note. Do not rerun older upgrades after this one; if necessary, rerun this newest upgrade last so publishing includes journey placement.

For a brand-new database, the order is: setup.sql, upgrade-writing-room.sql, upgrade-story-tools.sql, upgrade-notebook-and-organization.sql.

## The simpler organization

The public menu stays Home, Our Story, The Journey, Photos.

The Writing Room uses Your entries, Notebook, Journey & themes, and Trash. Collections is removed from the interface. Existing chapter records remain underneath to preserve old entries and links; the author no longer chooses a collection for each new entry.

- **Journey sections** answer where a story belongs: Before the Mission, Year One, Year Two, or a custom section such as Our Calling.
- **Themes** answer what the story is about. A story can have several themes.
- **Notebook pages** are private writing spaces and never appear publicly.

## Journey controls

Create a section or edit its name, introduction, automatic date range, and visibility. The first and last day shown in the form are inclusive. Automatic date ranges cannot overlap; custom sections can instead use manual placement without dates.

Use the arrow buttons to change the section order. The ordering update checks that another tab has not changed the list.

In the entry editor, choose a journey section explicitly or leave Choose automatically from the date. Explicit placement allows an introductory story written today to belong under Before the Mission. The default Our Story page gathers stories placed in the Before the Mission section.

Year Three remains automatic and will not appear until June 23, 2027. Show now and Keep hidden override a section's default visibility. Hiding a section hides its navigation card and filter, not its published stories; those remain in All entries. Unpublish an entry when it should become private.

Deleting a section keeps every entry and returns its explicit assignments to automatic date placement. Entries outside any date range remain in All entries.

## Themes

Create, rename, reorder, and delete themes. Renaming changes the display name without changing the stable ID used by entries. This keeps draft and published assignments independent. Only themes used by published entries appear on the public homepage and archive filter.

Deleting a theme removes the label from private and public entries, after confirmation. It does not delete any story, photograph, or notebook page.

## Notebook

Existing idea notes become notebook pages automatically. Pick a page or choose New page, then write directly on the page. A title is optional. Writing saves privately after a short pause, with Saving / Saved privately feedback. There is no submit form for each idea.

Autosave preserves typing that happens while an earlier save is in flight. If a save fails, the writing stays in the editor and Retry save is available. If another tab changed the same note, the app stops rather than overwriting it. Copy your unsaved writing before refreshing in that case.

Notebook navigation and sign-out flush pending saves. Closing the browser while changes remain unsaved triggers the browser's standard warning. This is cloud autosave, so leave the page open until it says Saved privately; browser closure or loss of connection can prevent a pending save.

Copy into a draft leaves the original page intact. Deleting a notebook page does not delete a copied draft.

## Typography and motion

Nothing You Could Do is now used for both the large Along the Way title and the logo. La Belle Aurore remains the smaller handwritten accent. Body text and article headings retain their readable fonts. Short navigation transitions and reduced-motion support are preserved.

## Validation and remaining check

Automated checks cover notebook preservation, concurrent typing, failure/retry, conflicting tabs, copying/deleting independently of drafts, theme renaming with stable assignments, create/reorder controls, custom journey placement and visibility, private changes versus public snapshots, legacy compatibility, public-only reads, HTML links, unique IDs, and demo content retries.

The migration has been reviewed structurally but has not been executed against the hosted database. The revised Writing Room still needs a visual check on the deployed site and a real phone.
