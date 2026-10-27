# Current Writing Room

See `CURRENT-UPDATE.md` for the current interface and installation. The older notes below are retained for reference.

# Shared-journey update

See `NEXT-DRAFT.md` for the current interface and the one-time story-tools upgrade. Existing chapters are now called collections, and years follow story dates.

# The simpler Writing Room

## Install this update

You already ran the Writing Room database upgrade. There is **no new SQL to run** for this interface update.

Unzip into a new folder, open it in VS Code, and launch its `admin.html` with Live Server. The existing project connection is included. Use your current login. All existing letters, chapter settings, and photos are kept in the same database.

Keep the previous folder until you have tried the update. Stop any Live Server serving the old folder before starting the new one.

## Your letters

The dashboard now opens with your letter collection, without an editor beside it. Switch between Drafts and Published, search by title, or filter by chapter. Each card shows its cover image, chapter, status and last edited date. Continue writing opens a draft; Edit letter opens a published letter's working copy. View live letter opens what visitors currently see.

Choose New letter to start a separate writing screen. Use Your letters at the top to return: valid changes are saved privately before returning. If the letter has no title, you can stay to add one or confirm leaving without saving.

## Write naturally

Begin with a title, choose a chapter, and write below. Add to your story offers Text, Photo, Two photos, or Quote. The same control appears between sections so you can insert pictures in the middle of a letter.

Choosing Photo lets you upload directly into that spot. Two photos gives each picture its own upload control. Add captions beneath the images. Photo options contains optional image descriptions, size settings, and a way to reuse an uploaded picture. Choose a new file to replace a picture. Previous files stay in Your uploaded photos for reuse; remove unused ones there if you reach the 20-photo limit.

A small ⋯ menu beside a story section contains Move up, Move down and Remove section. Removing a section does not delete its underlying uploaded photo.

## Fewer settings in the way

Entry details holds the date, optional homepage introduction, and cover. Upload a cover there or reuse an uploaded image. The cover is independent of pictures within the story. Your uploaded photos is collapsed below the story and is only needed to reuse, describe or remove library images.

## Save and share

After you pause typing, the editor saves privately. Look for Saving… then All changes saved. Add a title before autosave can begin. Incomplete photo sections may be saved as drafts; choose all pictures before previewing or publishing. Save for later lets you save immediately.

Autosave preserves cursor position and does not redraw your story. If you keep typing during a save, newer changes remain marked as unsaved and save after another pause. A failed save leaves the text on the current page and shows a message: check the connection and use Save for later. This is not offline saving.

Drafts stay private. For a published letter, autosave and Save for later keep a private revision; they do not change the live letter. Click Update live letter to share those changes. Publish letter shares a draft for the first time. Previously published photos can retain existing signed links for up to one hour after removal, as in the previous version.

Preview opens a private desktop/mobile view. More ⋯ contains View live letter, Unpublish to drafts, and Move to Trash. Trash still supports restore and permanent deletion. Chapter management is unchanged.

## Quick check

1. Open a saved draft from Your letters and confirm the editor is on its own screen.
2. Type a sentence, pause a few seconds, and wait for All changes saved. Refresh and reopen the letter.
3. Use Add to your story → Photo, choose an image directly, and type a caption below it.
4. Preview, save for later, and return to Your letters.
5. Edit a published letter and let it autosave. A private/incognito window must still show its old public version until you click Update live letter.
6. Try the dashboard on a phone-sized screen.

Local regression checks cover the screen flow, direct photo uploads, autosave while typing, draft/private-public version handling, Trash and public rendering. Browser visual testing was unavailable; check the layout on your devices after opening the new folder.
