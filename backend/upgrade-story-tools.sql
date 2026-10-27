-- Run after setup.sql and upgrade-writing-room.sql. Safe to re-run.
-- Adds optional metadata and private ideas; existing text, dates, chapters and photos are preserved.
begin;
alter table public.journal_entries add column if not exists themes text[] not null default '{}';
alter table public.journal_entries add column if not exists byline text not null default '';
alter table public.journal_public_entries add column if not exists themes text[] not null default '{}';
alter table public.journal_public_entries add column if not exists byline text not null default '';
do $$ begin
 if not exists(select 1 from pg_constraint where conname='journal_story_metadata' and conrelid='public.journal_entries'::regclass) then
 alter table public.journal_entries add constraint journal_story_metadata check(cardinality(themes)<=10 and char_length(byline)<=120);
 end if;
end $$;
create table if not exists public.journal_ideas (
 id uuid primary key default gen_random_uuid(),
 note text not null check(char_length(trim(note)) between 1 and 10000),
 created_at timestamptz not null default now()
);
alter table public.journal_ideas enable row level security;
revoke all on public.journal_ideas from public,anon,authenticated;
grant select,insert,update,delete on public.journal_ideas to authenticated;
drop policy if exists "Author manages private ideas" on public.journal_ideas;
create policy "Author manages private ideas" on public.journal_ideas for all to authenticated
using(exists(select 1 from public.journal_author where user_id=(select auth.uid())))
with check(exists(select 1 from public.journal_author where user_id=(select auth.uid())));
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
 insert into public.journal_public_entries(id,title,chapter_id,entry_date,excerpt,content,photos,blocks,cover_path,updated_at,themes,byline)
 values(letter.id,letter.title,letter.chapter_id,letter.entry_date,letter.excerpt,letter.content,visible_photos,letter.blocks,letter.cover_path,letter.updated_at,letter.themes,letter.byline)
 on conflict(id) do update set title=excluded.title,chapter_id=excluded.chapter_id,entry_date=excluded.entry_date,
 excerpt=excluded.excerpt,content=excluded.content,photos=excluded.photos,blocks=excluded.blocks,cover_path=excluded.cover_path,updated_at=excluded.updated_at,themes=excluded.themes,byline=excluded.byline;
 return letter;
end $$;
revoke all on function public.publish_journal_entry(uuid,timestamptz) from public,anon;
grant execute on function public.publish_journal_entry(uuid,timestamptz) to authenticated;

commit;
