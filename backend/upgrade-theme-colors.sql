-- Run in the existing Along the Way Supabase project, after the notebook upgrade.
-- Theme colors are public labels; existing author-only write policies remain in place.
begin;
do $$ begin
 if to_regclass('public.journal_themes') is null then
  raise exception 'Open Along the Way and install upgrade-notebook-and-organization.sql first.';
 end if;
end $$;
alter table public.journal_themes add column if not exists color text not null default '#e6eedf';
alter table public.journal_themes drop constraint if exists journal_theme_color_valid;
alter table public.journal_themes add constraint journal_theme_color_valid check(color ~ '^#[0-9A-Fa-f]{6}$');
commit;
