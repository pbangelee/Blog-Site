# Share buttons, photo viewing, album and Writing Room updates (v16)

No SQL changes. Copy the folder over the existing repository (keep subfolders), then Commit and Push.

## What changed
- **Our families** is hidden from About Us and from the homepage photo stack. Its photographs are still in `images/family/` and in `js/family-photos.js`. A comment at the bottom of that file shows the one line that brings the section back.
- **Our grandkids** now includes the beach photo you sent (the original `family-03`, matched exactly from the album files). It is the first photo in that group, which now has 3.
- **Writing Room** lists 5 entries per page instead of 7.
- **View photo** label is hidden until someone hovers over (or keyboard-focuses) the photo. On phones it never shows; tapping the photo opens it.
- **Cropped covers**: the entry page keeps the crop, but opening the photo shows the full original.
- **Share this story** button under each entry title: Copy link, Email, Text message, Facebook, Print. On phones and tablets it opens the device's own share sheet first. "Link copied ♡" appears briefly after copying. The pre-filled message reads: Thought you'd enjoy this story from Along the Way: "Title". Print gives a clean page with only the story.
- A custom site icon (favicon and home-screen icon) is on every page.

## Making shared links look cute (one-time setup, then one command per update)
Messages, Facebook and email read a link without running the site's JavaScript, so they can't see the story's photo or title unless each published story has a small preview page.

1. In `js/config.js`, fill in `siteUrl` with the public address of the site, with no trailing slash (for example `https://yourname.github.io/Blog-Site`).
2. After publishing or updating stories, run `python3 make_share_pages.py` from this folder (needs `pip install pillow` once). It writes `share/<story>.html`, `share/<story>.jpg` and `share/index.json`.
3. Commit and Push the `share` folder along with everything else.

Each preview card uses that story's cover photo (the full original, trimmed to the card shape), its title, date and excerpt, and "Along the Way" as the site name. Stories without a cover photo use `share/default.jpg`. Drafts never get a page, and pages for unpublished stories are removed automatically.
Until a story has a preview page, its Share button still works and shares the normal link (no photo card). Facebook remembers cards it has seen; use Facebook's Sharing Debugger to refresh one.

## Checks
Tested in a desktop and a phone-sized browser: hover label, full-photo opening, share menu (copy, close on Escape/outside click), native share payload, print layout, About page groups. Not yet tested against the live Supabase project or on physical phones; the Writing Room page size was changed but not exercised because it needs a sign-in.
