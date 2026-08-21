-- Run this in Supabase → SQL Editor
-- Creates the two tables and disables RLS (MVP: user_id filtering done in queries)

create table if not exists habits (
  id            bigint       primary key,
  user_id       text         not null,
  name          text         not null,
  description   text,
  color         text         not null default '',
  icon          text         not null default 'circle',
  display_order int          not null default 0,
  is_active     boolean      not null default true,
  created_at    timestamptz  not null default now()
);

create table if not exists habit_completions (
  id             bigint       primary key,
  habit_id       bigint       not null references habits(id) on delete cascade,
  user_id        text         not null,
  completed_date text         not null,   -- YYYY-MM-DD
  completed_at   timestamptz  not null default now(),
  unique(habit_id, completed_date)
);

create index if not exists habits_user_id_idx        on habits(user_id);
create index if not exists completions_user_id_idx   on habit_completions(user_id);
create index if not exists completions_habit_id_idx  on habit_completions(habit_id);

-- Disable RLS for MVP — we scope all queries by user_id in app code
alter table habits             disable row level security;
alter table habit_completions  disable row level security;
