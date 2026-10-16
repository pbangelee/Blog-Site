-- Run once in a NEW Supabase project using the SQL Editor.
create table public.journal_author (
  user_id uuid primary key references auth.users(id) on delete cascade,
  singleton boolean not null default true unique check(singleton)
);
alter table public.journal_author enable row level security;
revoke all on public.journal_author from anon, authenticated;
grant select on public.journal_author to authenticated;
create policy "Author can verify own access" on public.journal_author
  for select to authenticated using(user_id = (select auth.uid()));

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null check(char_length(title) between 1 and 160),
  chapter_id text not null check(chapter_id in ('before-the-mission','mtc','on-the-mission')),
  entry_date date not null default current_date,
  excerpt text not null default '' check(char_length(excerpt)<=500),
  content text not null check(char_length(content) between 1 and 100000),
  photos jsonb not null default '[]' check(jsonb_typeof(photos)='array' and jsonb_array_length(photos)<=20),
  status text not null default 'draft' check(status in ('draft','published')),
  updated_at timestamptz not null default now()
);
alter table public.journal_entries enable row level security;
revoke all on public.journal_entries from anon,authenticated;
grant select on public.journal_entries to anon;
grant select,insert,update,delete on public.journal_entries to authenticated;
create policy "Public can read published entries" on public.journal_entries
  for select to anon,authenticated using(status='published');
create policy "Only the author can manage entries" on public.journal_entries
  for all to authenticated
  using(exists(select 1 from public.journal_author where user_id=(select auth.uid())))
  with check(exists(select 1 from public.journal_author where user_id=(select auth.uid())));
create index journal_published_dates on public.journal_entries(entry_date desc) where status='published';

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('journal-photos','journal-photos',false,10485760,array['image/jpeg','image/png','image/webp']);
create policy "Only author uploads photos" on storage.objects
  for insert to authenticated with check(bucket_id='journal-photos' and exists(select 1 from public.journal_author where user_id=(select auth.uid())));
create policy "Author can read private photos" on storage.objects
  for select to authenticated using(bucket_id='journal-photos' and exists(select 1 from public.journal_author where user_id=(select auth.uid())));
create policy "Published entry photos are readable" on storage.objects
  for select to anon,authenticated using(bucket_id='journal-photos' and exists(
    select 1 from public.journal_entries e
    where e.status='published' and e.id::text=(storage.foldername(name))[1]
      and exists(select 1 from jsonb_array_elements(e.photos) p where p->>'path'=name)
  ));
-- No public sign-up or browser action can add another author.
-- After creating her Auth user, replace the UUID below and run separately:
-- insert into public.journal_author(user_id) values ('HER-AUTH-USER-UUID');
