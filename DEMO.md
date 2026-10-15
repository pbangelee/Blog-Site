# Add demo content

No new SQL is needed. The demo loader works with the current Writing Room database.

1. Open this website folder in VS Code and launch `admin.html` with Live Server. Sign in with your existing author account.
2. Open `demo-content.html` using the same Live Server.
3. Click **Add demo content** and keep the tab open until it says Done.
4. Refresh the homepage, chapters, gallery, and Writing Room.

The loader creates 24 fictional letters (18 published, 6 drafts), 5 clearly marked demo chapters, and 48 uploaded sample illustrations. It uses the existing images in this folder, not real mission photographs. Stories include text, inline photos, photo pairs, and quotes.

Your own entries and chapters are not overwritten. Each demo letter has a stable ID; repeating the import skips ones already present. You can edit the demo letters to try the builder. Published demos appear publicly wherever you host this frontend.

To clean up, return to `demo-content.html` and click **Remove demo content**. This permanently removes only those specific demo letters, including any edits you made to them. Demo chapters are removed only if no other working or public letters use them. The underlying image files remain private in Storage for manual cleanup.

If an import is interrupted, click Add demo content again. It reuses its illustration uploads and skips completed letters. If you deliberately moved a demo letter to Trash, it is also kept there on re-import; remove the demo batch before starting completely fresh.

Local checks cover the data counts, source assets, demo IDs, import retry rules, author gating, and cleanup scope. The import has not been run on your live project here; clicking the button performs it under your signed-in author account.
