-- Run only in the Along the Way Supabase project, once.
begin;
do $$ begin
 if to_regclass('public.journal_public_entries') is null or to_regclass('public.journal_author') is null then
  raise exception 'Open the existing Along the Way project before running this upgrade.';
 end if;
end $$;
create table if not exists public.journal_home_settings (
 id integer primary key check(id=1),
 featured_entry_id uuid references public.journal_public_entries(id) on delete set null,
 featured_photo_path text,
 revision integer not null default 0
);
insert into public.journal_home_settings(id) values(1) on conflict do nothing;
alter table public.journal_home_settings enable row level security;
revoke all on public.journal_home_settings from anon,authenticated;
grant select on public.journal_home_settings to anon,authenticated;
grant update on public.journal_home_settings to authenticated;
drop policy if exists "Read homepage selection" on public.journal_home_settings;
create policy "Read homepage selection" on public.journal_home_settings for select using(true);
drop policy if exists "Author edits homepage selection" on public.journal_home_settings;
create policy "Author edits homepage selection" on public.journal_home_settings for update to authenticated
using(exists(select 1 from public.journal_author where user_id=(select auth.uid())))
with check(exists(select 1 from public.journal_author where user_id=(select auth.uid())));
create or replace function public.validate_home_moment() returns trigger language plpgsql set search_path=public as $$
begin
 if new.featured_entry_id is null then new.featured_photo_path:=null;
 elsif not exists(select 1 from public.journal_public_entries e, jsonb_array_elements(e.photos) p where e.id=new.featured_entry_id and p->>'path'=new.featured_photo_path and coalesce(p->>'sample','false')<>'true') then
  raise exception 'Choose a photograph from a currently published entry.';
 end if;
 return new;
end $$;
drop trigger if exists validate_home_moment on public.journal_home_settings;
create trigger validate_home_moment before insert or update on public.journal_home_settings for each row execute function public.validate_home_moment();
commit;
