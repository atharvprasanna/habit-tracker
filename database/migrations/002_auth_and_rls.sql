-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 002: lock the database down with Row Level Security (RLS)
--
-- After this runs, each signed-in user can read and write ONLY their own rows,
-- and anonymous visitors (anyone holding the public anon key) get nothing.
--
-- Run ONCE in Supabase -> SQL Editor. Safe to re-run.
-- Do it together with deploying the new login (Supabase Auth) version of the app.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Turn RLS on for the app tables
alter table public.habits            enable row level security;
alter table public.habit_completions enable row level security;

-- Helper tables created by earlier migrations (the backup holds a full copy of everyone's data!)
alter table if exists public.habit_completions_backup_001 enable row level security;
alter table if exists public.schema_migrations           enable row level security;
-- (RLS on with no policy = nobody can read them through the API; you still can in the SQL editor)

-- 2) Policies: a row belongs to the user whose id is stored in user_id
drop policy if exists habits_select on public.habits;
drop policy if exists habits_insert on public.habits;
drop policy if exists habits_update on public.habits;
drop policy if exists habits_delete on public.habits;

create policy habits_select on public.habits
  for select to authenticated
  using (user_id = (select auth.uid())::text);

create policy habits_insert on public.habits
  for insert to authenticated
  with check (user_id = (select auth.uid())::text);

create policy habits_update on public.habits
  for update to authenticated
  using      (user_id = (select auth.uid())::text)
  with check (user_id = (select auth.uid())::text);

create policy habits_delete on public.habits
  for delete to authenticated
  using (user_id = (select auth.uid())::text);

drop policy if exists completions_select on public.habit_completions;
drop policy if exists completions_insert on public.habit_completions;
drop policy if exists completions_update on public.habit_completions;
drop policy if exists completions_delete on public.habit_completions;

create policy completions_select on public.habit_completions
  for select to authenticated
  using (user_id = (select auth.uid())::text);

-- A completion may only be added to a habit that the same user owns
create policy completions_insert on public.habit_completions
  for insert to authenticated
  with check (
    user_id = (select auth.uid())::text
    and exists (
      select 1 from public.habits h
      where h.id = habit_id and h.user_id = (select auth.uid())::text
    )
  );

create policy completions_update on public.habit_completions
  for update to authenticated
  using      (user_id = (select auth.uid())::text)
  with check (user_id = (select auth.uid())::text);

create policy completions_delete on public.habit_completions
  for delete to authenticated
  using (user_id = (select auth.uid())::text);

-- 3) Quick check: should list your tables with rowsecurity = true
select tablename, rowsecurity
  from pg_tables
 where schemaname = 'public'
 order by tablename;
