-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 001: convert saved check-in dates to LOCAL calendar dates
--
-- Why: older versions of the app saved each check-in under the UTC date of local
-- midnight. For anyone east of UTC (India = UTC+5:30) that is one day EARLIER than
-- the day they actually ticked. The app now uses true local dates, so existing rows
-- must move forward by one day.
--
-- Run this ONCE in Supabase → SQL Editor, at the same time the new app version goes live.
-- It is guarded: running it a second time does nothing.
--
-- Scope: INDIAN USERS ONLY (UTC+5:30), which is every existing user for now.
--   shift_days = 1  -> India is east of UTC, so every old date was one day early.
--   target_users = NULL -> all rows that exist today are treated as Indian users.
--     The database does not store timezones, so if a non-Indian user has signed in,
--     list users first with:
--       select user_id, count(*) from habit_completions group by user_id;
--     then set target_users to only the Indian users' ids, e.g. ARRAY['1234567890'].
-- Users who sign up after the new app version goes live are NOT affected: the app now
-- saves correct local dates for everyone, in any timezone.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Safety copy of the current data (kept until you delete it yourself)
create table if not exists habit_completions_backup_001 as
  select * from habit_completions;

-- 2) Guard table so the migration can never be applied twice
create table if not exists schema_migrations (
  name       text primary key,
  applied_at timestamptz not null default now()
);
alter table schema_migrations disable row level security;

do $$
declare
  shift_days   int    := 1;      -- <-- change to 0 / other value if needed
  target_users text[] := null;   -- <-- or ARRAY['google-user-id', ...]
begin
  if exists (select 1 from schema_migrations where name = '001_local_date_keys') then
    raise notice 'Migration 001 already applied - nothing to do.';
    return;
  end if;

  -- Two steps via a temporary prefix so the unique(habit_id, completed_date)
  -- constraint can never clash while rows are being moved.
  update habit_completions
     set completed_date = 'tmp:' || to_char(completed_date::date + shift_days, 'YYYY-MM-DD')
   where completed_date ~ '^\d{4}-\d{2}-\d{2}$'
     and (target_users is null or user_id = any (target_users));

  update habit_completions
     set completed_date = substr(completed_date, 5)
   where completed_date like 'tmp:%';

  insert into schema_migrations (name) values ('001_local_date_keys');
  raise notice 'Migration 001 applied.';
end $$;

-- 3) Quick look at the result (latest dates should now match the days you ticked)
select habit_id, completed_date
  from habit_completions
 order by completed_date desc
 limit 10;

-- To undo (only if something looks wrong):
--   delete from habit_completions;
--   insert into habit_completions select * from habit_completions_backup_001;
--   delete from schema_migrations where name = '001_local_date_keys';
