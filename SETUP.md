# Connect the writing room

The design preview works as before until a Supabase project is connected. The private editor and cross-device publishing need this one-time setup. This package has not been connected to a live project yet.

## 1. Create a separate Supabase project

Use a new project for this journal. This SQL is designed for a new project, not your Tidy database. Run `backend/setup.sql` once in its SQL Editor, then run `backend/upgrade-writing-room.sql` to install the current writing-room features. It creates the entry tables, private photo bucket, and access policies.

## 2. Create her account and designate the author

In Supabase Authentication > Users, create her email/password user. Disable public account sign-ups in the authentication settings. There is no sign-up form in this website.

Copy her user's UUID and run this separately in the SQL Editor:

```sql
insert into public.journal_author(user_id)
values ('REPLACE-WITH-HER-AUTH-USER-UUID');
```

Only one author can be designated. The database checks this account before allowing changes. Another signed-in account cannot manage the journal. Dashboard HTML is accessible at its URL, but unpublished data and editing require the designated account.

## 3. Connect the website

Open `js/config.js`. Add the project URL and browser-safe publishable key (or legacy anon key) from Supabase. Do not use a secret key or service_role key.

```js
window.JOURNAL_CONFIG = {
  supabaseUrl: "https://YOUR-PROJECT.supabase.co",
  publishableKey: "YOUR-PUBLISHABLE-KEY"
};
```

These two configuration values are intended for the browser; the database policies protect the content. Leave the template's other files in the same folder. The site uses the Supabase browser SDK from jsDelivr and needs an internet connection.

## 4. Open the writing room

Use Live Server to open `admin.html` and sign in with her account. Choose a chapter, add the date, title, short introduction, letter, and photos. Separate paragraphs with a blank line. The first photo becomes the cover, and the Make cover button can change it. Photo descriptions are used as accessible alternative text; captions appear in the journal.

Save draft keeps the letter private. Publish letter adds it to the homepage, its chapter, its reading page, and gallery. Update published letter changes it. Move to drafts unpublishes it. No website-code edits are needed to add the next entry.

The connected journal shows database entries, replacing the fictional sample entries. A newly connected empty database shows a welcoming empty state. Sample chapter artwork and author details remain until you replace them.

Visitors get current entries when opening or refreshing a page. This version does not push new content into pages that are already open. Local Live Server preview is not a publicly accessible website; deploy the frontend later for visitors to use their own devices.

## 5. Verify before sharing

- Signed out or in an incognito window: published entries and their photos appear, drafts do not.
- As the author: save a draft, refresh the editor, and reopen it; its text and photos persist.
- Publish it, then refresh the homepage, chapter, gallery, and entry page.
- Move it back to drafts and verify the public entry becomes unavailable.
- Create a second temporary Auth user without designating it as author: it must not see drafts or change entries or upload photos. Remove that test user afterward if no longer needed.
- Try phone-sized layouts and upload a photo from a phone.

## Photo handling

Photos are resized in the browser to at most 1800px and converted to JPEG. JPEG, PNG, and WebP inputs up to 10MB are accepted, with up to 20 photos per entry. iPhone HEIC files need exporting as JPEG first. Original camera metadata is not included in the canvas-generated JPEG.

Draft photos live in a private bucket. Public photo access is permitted only for files referenced by a published entry. The public pages request signed links lasting one hour. A previously issued link can keep working until it expires after unpublishing. Reload a very long-open page to refresh expired photo links.

Removing a photo from an entry removes its reference after saving; the underlying private file is retained. Abandoned uploads can also remain in storage, for manual cleanup later. This avoids deleting a published photo before changes have been saved.

## Scope and validation

This is a plain HTML/CSS/JavaScript frontend with Supabase-backed authentication, entries, and storage. No local browser password gate is used. No credentials or hosted project have been configured in this package. Syntax, data transformation, rendering, asset references, and policy structure were checked locally. Actual authentication, RLS behavior, upload persistence, and mobile rendering still need the live checks above.

Password resets can be issued by the project owner through Supabase; a self-service reset flow is not included yet.
