-- Run the entire file in the Along the Way project after upgrade-story-tools.sql.
-- All changes are transactional. Existing chapters, entries, photos and idea notes stay intact.
begin;
do $$ begin
 if to_regclass('public.journal_entries') is null or to_regclass('public.journal_ideas') is null then
  raise exception 'Wrong project or missing earlier upgrade. Open Along the Way and run upgrade-story-tools.sql first.';
 end if;
end $$;
create table if not exists public.journal_journeys (
 id text primary key default gen_random_uuid()::text,
 title text not null check(char_length(trim(title)) between 1 and 120),
 description text not null default '' check(char_length(description)<=1000),
 start_date date,
 end_date date,
 visibility text not null default 'auto' check(visibility in ('auto','shown','hidden')),
 sort_order integer not null default 0,
 updated_at timestamptz not null default now(),
 check((start_date is null and end_date is null) or (start_date is not null and end_date is not null and start_date<end_date))
);
do $$ begin
 if not exists(select 1 from pg_constraint where conname='journal_journey_date_ranges' and conrelid='public.journal_journeys'::regclass) then
 alter table public.journal_journeys add constraint journal_journey_date_ranges
 exclude using gist (daterange(start_date,end_date,'[)') with &&) where (start_date is not null);
 end if;
end $$;
create table if not exists public.journal_themes (
 id text primary key default gen_random_uuid()::text,
 name text not null check(char_length(trim(name)) between 1 and 80),
 sort_order integer not null default 0,
 updated_at timestamptz not null default now()
);
create unique index if not exists journal_theme_name_unique on public.journal_themes(lower(trim(name)));
alter table public.journal_journeys enable row level security;
alter table public.journal_themes enable row level security;
revoke all on public.journal_journeys,public.journal_themes from public,anon,authenticated;
grant select on public.journal_journeys,public.journal_themes to anon,authenticated;
grant insert,update,delete on public.journal_journeys,public.journal_themes to authenticated;
drop policy if exists "Read journey settings" on public.journal_journeys;
create policy "Read journey settings" on public.journal_journeys for select to anon,authenticated using(true);
drop policy if exists "Read theme names" on public.journal_themes;
create policy "Read theme names" on public.journal_themes for select to anon,authenticated using(true);
drop policy if exists "Author manages journey settings" on public.journal_journeys;
create policy "Author manages journey settings" on public.journal_journeys for all to authenticated
using(exists(select 1 from public.journal_author where user_id=(select auth.uid())))
with check(exists(select 1 from public.journal_author where user_id=(select auth.uid())));
drop policy if exists "Author manages themes" on public.journal_themes;
create policy "Author manages themes" on public.journal_themes for all to authenticated
using(exists(select 1 from public.journal_author where user_id=(select auth.uid())))
with check(exists(select 1 from public.journal_author where user_id=(select auth.uid())));
insert into public.journal_journeys(id,title,description,start_date,end_date,sort_order) values
('before','Before the Mission','The calling, the preparations, and the beginning.','0001-01-01','2025-06-23',0),
('year-1','Year One','The first year, remembered through its meaningful moments.','2025-06-23','2026-06-23',1),
('year-2','Year Two','Stories and reflections as the journey continues.','2026-06-23','2027-06-23',2),
('year-3','Year Three','The final year and the lessons carried forward.','2027-06-23','2028-06-23',3)
on conflict(id) do nothing;
insert into public.journal_themes(id,name,sort_order) values
('Faith','Faith',0),('People','People',1),('Leadership','Leadership',2),('Everyday Moments','Everyday Moments',3),('What We’re Learning','What We’re Learning',4)
on conflict do nothing;
-- Preserve any pre-existing custom theme values too.
insert into public.journal_themes(id,name)
select distinct t,t from (select unnest(themes) t from public.journal_entries union select unnest(themes) t from public.journal_public_entries) old
where char_length(trim(t)) between 1 and 80 on conflict do nothing;
alter table public.journal_entries add column if not exists journey_id text references public.journal_journeys(id) on delete set null;
alter table public.journal_public_entries add column if not exists journey_id text references public.journal_journeys(id) on delete set null;
alter table public.journal_ideas add column if not exists title text not null default '' check(char_length(title)<=160);
alter table public.journal_ideas add column if not exists updated_at timestamptz not null default now();
alter table public.journal_ideas drop constraint if exists journal_ideas_note_check;
alter table public.journal_ideas drop constraint if exists journal_notebook_length;
alter table public.journal_ideas add constraint journal_notebook_length check(char_length(note)<=100000);
drop trigger if exists journal_notebook_touch on public.journal_ideas;
create trigger journal_notebook_touch before update on public.journal_ideas for each row execute function public.journal_touch_entry();
drop trigger if exists journal_theme_touch on public.journal_themes;
create trigger journal_theme_touch before update on public.journal_themes for each row execute function public.journal_touch_entry();
drop trigger if exists journal_journey_touch on public.journal_journeys;
create trigger journal_journey_touch before update on public.journal_journeys for each row execute function public.journal_touch_entry();
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
 insert into public.journal_public_entries(id,title,chapter_id,entry_date,excerpt,content,photos,blocks,cover_path,updated_at,themes,byline,journey_id)
 values(letter.id,letter.title,letter.chapter_id,letter.entry_date,letter.excerpt,letter.content,visible_photos,letter.blocks,letter.cover_path,letter.updated_at,letter.themes,letter.byline,letter.journey_id)
 on conflict(id) do update set title=excluded.title,chapter_id=excluded.chapter_id,entry_date=excluded.entry_date,
 excerpt=excluded.excerpt,content=excluded.content,photos=excluded.photos,blocks=excluded.blocks,cover_path=excluded.cover_path,updated_at=excluded.updated_at,themes=excluded.themes,byline=excluded.byline,journey_id=excluded.journey_id;
 return letter;
end $$;
revoke all on function public.publish_journal_entry(uuid,timestamptz) from public,anon;
grant execute on function public.publish_journal_entry(uuid,timestamptz) to authenticated;

-- Rename a theme by its display name only. Stable IDs keep published and private versions independent.
create or replace function public.delete_journal_theme(theme_to_delete text,expected_updated_at timestamptz) returns void
language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.journal_author where user_id=(select auth.uid())) then raise exception 'Author access required'; end if;
 -- Lock the theme so two delete requests cannot race.
 perform 1 from public.journal_themes where id=theme_to_delete and updated_at=expected_updated_at for update;
 if not found then raise exception 'Theme changed in another tab. Reopen it before deleting.'; end if;
 update public.journal_entries set themes=array_remove(themes,theme_to_delete) where theme_to_delete=any(themes);
 update public.journal_public_entries set themes=array_remove(themes,theme_to_delete) where theme_to_delete=any(themes);
 delete from public.journal_themes where id=theme_to_delete;
end $$;
revoke all on function public.delete_journal_theme(text,timestamptz) from public,anon;
grant execute on function public.delete_journal_theme(text,timestamptz) to authenticated;
-- Reorder a complete list atomically, checking that another tab did not change membership.
create or replace function public.reorder_journal_organization(list_kind text,item_ids text[]) returns void
language plpgsql security invoker set search_path='' as $$
declare expected integer; i integer;
begin
 if not exists(select 1 from public.journal_author where user_id=(select auth.uid())) then raise exception 'Author access required'; end if;
 if list_kind='journey' then
  lock table public.journal_journeys in share row exclusive mode;
  select count(*) into expected from public.journal_journeys;
  if cardinality(item_ids)<>expected or (select count(distinct x) from unnest(item_ids) x)<>expected
   or exists(select 1 from unnest(item_ids) x where not exists(select 1 from public.journal_journeys j where j.id=x)) then raise exception 'Journey sections changed. Refresh before reordering.'; end if;
  for i in 1..expected loop update public.journal_journeys set sort_order=i-1 where id=item_ids[i]; end loop;
 elsif list_kind='themes' then
  lock table public.journal_themes in share row exclusive mode;
  select count(*) into expected from public.journal_themes;
  if cardinality(item_ids)<>expected or (select count(distinct x) from unnest(item_ids) x)<>expected
   or exists(select 1 from unnest(item_ids) x where not exists(select 1 from public.journal_themes t where t.id=x)) then raise exception 'Themes changed. Refresh before reordering.'; end if;
  for i in 1..expected loop update public.journal_themes set sort_order=i-1 where id=item_ids[i]; end loop;
 else raise exception 'Unknown organization list'; end if;
end $$;
revoke all on function public.reorder_journal_organization(text,text[]) from public,anon;
grant execute on function public.reorder_journal_organization(text,text[]) to authenticated;
commit;
