# Writing Room upgrade — keep your existing project

Your Supabase URL and browser-safe publishable key are already included. Your author account stays the same. This upgrade preserves the letters and photos you have saved.

## One-time upgrade

1. Keep your previous website folder as a backup, then unzip this updated folder separately.
2. Open `backend/upgrade-writing-room.sql` in VS Code. Copy the entire file into a NEW Supabase SQL Editor query and run it once. It runs in a transaction and can safely be run again.
3. Open this updated folder in VS Code and launch `admin.html` with Live Server. Use your existing author login.
4. Refresh the public site using the updated folder too. After the migration, old website files cannot load entries because draft privacy now uses a separate published-version table. Avoid leaving two Live Servers running on different copies by accident.

Do NOT rerun `backend/setup.sql` on your existing project. New projects must run setup.sql FIRST and upgrade-writing-room.sql SECOND.

## Entries

- **Drafts:** private letters. Choose Continue writing to open one.
- **Published:** public letters. Choose Edit published entry to open its working copy. View published entry opens what readers currently see.
- **Save changes privately:** saves edits to a published letter without changing the public version. The entry remains in Published with a “saved changes not published” note.
- **Update published entry:** replaces the public version with the working copy. Text, photos, and cover changes are published together in a database transaction.
- **Unpublish to drafts:** removes the public version and keeps the last saved working copy as a draft. Save unsaved changes first or accept the discard prompt.
- **Move to Trash:** hides the saved letter from public pages and keeps it recoverable.
- **Trash → Restore:** restores as a private draft, never automatically republishes.
- **Trash → Delete permanently:** deletes the entry and its published version after confirmation. This cannot be undone. Underlying private photo files are retained for manual cleanup; it does not erase originals from storage.

The simplified editor now autosaves valid drafts and working revisions privately after a pause. Watch All changes saved before leaving; Save for later is also available. Publishing still requires Publish letter or Update live letter. See WRITING-ROOM.md for the current interface.

## Story blocks

Upload photos to the photo library. Add Text, Photo, Photo pair, and Quote blocks using the buttons, or the insertion menu between blocks. Choose photos in each photo block. Move blocks with the up/down arrows; remove a block without deleting its library photos. Text is plain text, with blank lines between paragraphs.

Photo blocks can be full-width or smaller and centered. Photo pair blocks show two pictures side by side. Add image descriptions and captions in the photo library. Choose the cover separately: it appears at the top of the entry and on the homepage. Only cover and story photos are included in the public published snapshot and gallery; unused library uploads stay private.

Use Preview to see current changes without publishing, and switch Desktop/Mobile inside the preview. The preview uses the article stylesheet, but does not include the whole site header or interactive navigation. Its serif font can fall back to a local font. The dashboard itself also adapts to phone screens.

## Chapters

Create a chapter with a name, short description, introduction, and optional cover photo. Chapter changes are public immediately after saving. Use arrow buttons to reorder chapters. Deleting a chapter requires choosing another chapter for all its entries, including Trash. At least one chapter must remain. Entry and photo data are preserved when moving between chapters.

The migration seeds the existing three chapter names and short descriptions. If you previously customized those in js/data.js, copy your wording into the new chapter editor after upgrading. They are now managed in the database.

## What to check

1. Existing drafts, published entries, photos and their entry links still work.
2. Add a chapter and create a draft with text → photo → text → photo pair → quote. Reorder blocks and reload after saving.
3. Publish it and check the homepage, chapter, article, and gallery in an incognito window.
4. Save a change privately to the published entry, including a NEW uploaded photo. Incognito must still show the old published text and must not include the new photo.
5. Update published entry; incognito now shows the change after refresh.
6. Move to Trash; verify public access disappears. Restore as draft; it stays private. Test permanent deletion on a disposable entry.
7. Reorder chapters and delete a test chapter by moving its entries elsewhere.
8. Confirm a non-author account cannot read working copies, publish, upload, reorder, or delete.

Existing signed photo links can remain valid up to one hour after unpublishing or replacing a published version. Draft uploads that have never been published do not receive public access. Saved edits do not change public text or newly uploaded photos until you publish them.

## Validation scope

The upgrade includes local checks of block editing, published/draft separation, rendering, data transformations, and access-policy structure. The migration has not been executed on your live project, and browser-based visual QA was unavailable. Run the live checks above after applying the upgrade. There is no change to hosting: Live Server is still local preview.
