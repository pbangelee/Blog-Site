-- Existing journal upgrade. Run the WHOLE file once in the SQL Editor.
-- Entries, photos and the designated author are preserved. Re-running is safe.
begin;
create table if not exists public.journal_chapters (
  id text primary key default gen_random_uuid()::text,
  title text not null check(char_length(title) between 1 and 120),
  description text not null default '' check(char_length(description)<=500),
  intro text not null default '' check(char_length(intro)<=5000),
  sort_order integer not null default 0,
  image_path text,
  sample_image text not null default 'images/hero-ocean.jpg'
);
alter table public.journal_chapters enable row level security;
revoke all on public.journal_chapters from anon,authenticated;
grant select on public.journal_chapters to anon,authenticated;
grant insert,update,delete on public.journal_chapters to authenticated;
drop policy if exists "Read chapters" on public.journal_chapters;
create policy "Read chapters" on public.journal_chapters for select to anon,authenticated using(true);
drop policy if exists "Author manages chapters" on public.journal_chapters;
create policy "Author manages chapters" on public.journal_chapters for all to authenticated
using(exists(select 1 from public.journal_author where user_id=(select auth.uid())))
with check(exists(select 1 from public.journal_author where user_id=(select auth.uid())));
insert into public.journal_chapters(id,title,description,intro,sort_order,sample_image) values
('before-the-mission','Before the Mission','The preparing, the packing, and the goodbyes.','Every journey begins well before the first step.',1,'images/chapter-before.jpg'),
('mtc','MTC','Weeks of learning, language, and new friends.','A season of study and surprise.',2,'images/chapter-mtc.jpg'),
('on-the-mission','On the Mission','People, places, and small miracles.','The heart of the journey.',3,'images/chapter-mission.jpg')
on conflict(id) do nothing;

alter table public.journal_entries add column if not exists blocks jsonb not null default '[]';
alter table public.journal_entries add column if not exists cover_path text;
alter table public.journal_entries add column if not exists deleted_at timestamptz;
alter table public.journal_entries drop constraint if exists journal_entries_chapter_id_check;
alter table public.journal_entries drop constraint if exists journal_entries_status_check;
alter table public.journal_entries add constraint journal_entries_status_check check(status in ('draft','published','trashed'));
do $$ begin
 if not exists(select 1 from pg_constraint where conname='journal_entries_chapter_fk' and conrelid='public.journal_entries'::regclass) then
  alter table public.journal_entries add constraint journal_entries_chapter_fk foreign key(chapter_id) references public.journal_chapters(id);
 end if;
 if not exists(select 1 from pg_constraint where conname='journal_blocks_array' and conrelid='public.journal_entries'::regclass) then
  alter table public.journal_entries add constraint journal_blocks_array check(jsonb_typeof(blocks)='array' and jsonb_array_length(blocks)<=200);
 end if;
end $$;
-- Convert old letters to text blocks followed by their existing inline photos.
update public.journal_entries e set
 cover_path=coalesce(e.cover_path,e.photos->0->>'path'),
 blocks=jsonb_build_array(jsonb_build_object('type','text','text',e.content)) ||
 coalesce((select jsonb_agg(jsonb_build_object('type','photo','photo',p.value->>'path','layout','full') order by p.ordinality)
 from jsonb_array_elements(e.photos) with ordinality p(value,ordinality) where p.ordinality>1),'[]'::jsonb)
where blocks='[]'::jsonb;

-- This table holds ONLY the last explicitly published version.
create table if not exists public.journal_public_entries (
 id uuid primary key references public.journal_entries(id) on delete cascade,
 title text not null,
 chapter_id text not null references public.journal_chapters(id),
 entry_date date not null,
 excerpt text not null,
 content text not null,
 photos jsonb not null,
 blocks jsonb not null,
 cover_path text,
 updated_at timestamptz not null
);
alter table public.journal_public_entries enable row level security;
revoke all on public.journal_public_entries from anon,authenticated;
grant select on public.journal_public_entries to anon,authenticated;
grant insert,update,delete on public.journal_public_entries to authenticated;
drop policy if exists "Read published versions" on public.journal_public_entries;
create policy "Read published versions" on public.journal_public_entries for select to anon,authenticated using(true);
drop policy if exists "Author manages published versions" on public.journal_public_entries;
create policy "Author manages published versions" on public.journal_public_entries for all to authenticated
using(exists(select 1 from public.journal_author where user_id=(select auth.uid())))
with check(exists(select 1 from public.journal_author where user_id=(select auth.uid())));
insert into public.journal_public_entries(id,title,chapter_id,entry_date,excerpt,content,photos,blocks,cover_path,updated_at)
select id,title,chapter_id,entry_date,excerpt,content,photos,blocks,cover_path,updated_at
from public.journal_entries where status='published' on conflict(id) do nothing;
-- Draft edits to a published letter must NEVER be publicly readable.
drop policy if exists "Public can read published entries" on public.journal_entries;
revoke select on public.journal_entries from anon;

create or replace function public.journal_touch_entry() returns trigger
language plpgsql security invoker set search_path='' as $$
begin new.updated_at=clock_timestamp(); return new; end $$;
drop trigger if exists journal_touch_entry on public.journal_entries;
create trigger journal_touch_entry before update on public.journal_entries
for each row execute function public.journal_touch_entry();
create or replace function public.journal_hide_unpublished() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if new.status<>'published' then delete from public.journal_public_entries where id=new.id; end if;
 return new;
end $$;
drop trigger if exists journal_hide_unpublished on public.journal_entries;
create trigger journal_hide_unpublished after update on public.journal_entries
for each row execute function public.journal_hide_unpublished();

create or replace function public.publish_journal_entry(entry_id uuid, expected_updated_at timestamptz)
returns public.journal_entries language plpgsql security invoker set search_path='' as $$
declare letter public.journal_entries; visible_photos jsonb;
begin
 if not exists(select 1 from public.journal_author where user_id=(select auth.uid())) then raise exception 'Author access required'; end if;
 select * into letter from public.journal_entries where id=entry_id for update;
 if not found or letter.status='trashed' then raise exception 'Entry unavailable'; end if;
 if letter.updated_at<>expected_updated_at then raise exception 'Entry changed in another tab. Reload before publishing.'; end if;
 update public.journal_entries set status='published',deleted_at=null where id=entry_id returning * into letter;
 select coalesce(jsonb_agg(p),'[]'::jsonb) into visible_photos from jsonb_array_elements(letter.photos) p
 where p->>'path'=letter.cover_path or exists(
  select 1 from jsonb_array_elements(letter.blocks) b where b->>'photo'=p->>'path' or (b->'photos') ? (p->>'path')
 );
 insert into public.journal_public_entries(id,title,chapter_id,entry_date,excerpt,content,photos,blocks,cover_path,updated_at)
 values(letter.id,letter.title,letter.chapter_id,letter.entry_date,letter.excerpt,letter.content,visible_photos,letter.blocks,letter.cover_path,letter.updated_at)
 on conflict(id) do update set title=excluded.title,chapter_id=excluded.chapter_id,entry_date=excluded.entry_date,
 excerpt=excluded.excerpt,content=excluded.content,photos=excluded.photos,blocks=excluded.blocks,cover_path=excluded.cover_path,updated_at=excluded.updated_at;
 return letter;
end $$;
revoke all on function public.publish_journal_entry(uuid,timestamptz) from public,anon;
grant execute on function public.publish_journal_entry(uuid,timestamptz) to authenticated;

create or replace function public.delete_journal_chapter(chapter_to_delete text,move_entries_to text)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.journal_author where user_id=(select auth.uid())) then raise exception 'Author access required'; end if;
 perform 1 from public.journal_chapters where id=chapter_to_delete for update;
 if not found then raise exception 'Chapter no longer exists'; end if;
 if (select count(*) from public.journal_chapters)<=1 then raise exception 'Keep at least one chapter'; end if;
 if move_entries_to is not null then
  if move_entries_to=chapter_to_delete or not exists(select 1 from public.journal_chapters where id=move_entries_to) then raise exception 'Choose another chapter'; end if;
  update public.journal_entries set chapter_id=move_entries_to where chapter_id=chapter_to_delete;
  update public.journal_public_entries set chapter_id=move_entries_to where chapter_id=chapter_to_delete;
 end if;
 delete from public.journal_chapters where id=chapter_to_delete;
 -- Foreign keys prevent deleting a chapter until ALL working and public entries are moved.
end $$;
revoke all on function public.delete_journal_chapter(text,text) from public,anon;
grant execute on function public.delete_journal_chapter(text,text) to authenticated;

-- Keep draft uploads private, even while an earlier version remains published.
drop policy if exists "Published entry photos are readable" on storage.objects;
drop policy if exists "Published version photos are readable" on storage.objects;
create policy "Published version photos are readable" on storage.objects for select to anon,authenticated
using(bucket_id='journal-photos' and exists(
 select 1 from public.journal_public_entries e
 where e.id::text=(storage.foldername(storage.objects.name))[1]
 and exists(select 1 from jsonb_array_elements(e.photos) p where p->>'path'=storage.objects.name)
));
drop policy if exists "Chapter covers are readable" on storage.objects;
create policy "Chapter covers are readable" on storage.objects for select to anon,authenticated
using(bucket_id='journal-photos' and exists(select 1 from public.journal_chapters c where c.image_path=storage.objects.name));
create or replace function public.reorder_journal_chapters(chapter_ids text[])
returns void language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.journal_author where user_id=(select auth.uid())) then raise exception 'Author access required'; end if;
 perform 1 from public.journal_chapters order by id for update;
 if coalesce(array_length(chapter_ids,1),0)<>(select count(*) from public.journal_chapters)
 or (select count(distinct x) from unnest(chapter_ids) x)<>(select count(*) from public.journal_chapters)
 or exists(select 1 from unnest(chapter_ids) x where not exists(select 1 from public.journal_chapters c where c.id=x)) then
  raise exception 'Chapters changed. Refresh before reordering.';
 end if;
 update public.journal_chapters c set sort_order=u.position
 from unnest(chapter_ids) with ordinality u(id,position) where c.id=u.id;
end $$;
revoke all on function public.reorder_journal_chapters(text[]) from public,anon;
grant execute on function public.reorder_journal_chapters(text[]) to authenticated;
commit;
