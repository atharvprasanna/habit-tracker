-- Migration 003: attach your OLD habits (saved under your Google id) to your NEW email account.
-- Run in Supabase -> SQL Editor AFTER you have created your email account in the app.
-- Run it once per person who had data before the switch. Safe to repeat (it only moves rows
-- that are still under the old id).

-- Step A: find the old Google ids that own data (each looks like a long number)
select user_id, count(*) as habits
  from public.habits
 group by user_id
 order by habits desc;

-- Step B: fill in the two values below, then run this block
do $$
declare
  old_id    text := 'PASTE_OLD_USER_ID_FROM_STEP_A';
  new_email text := 'PASTE_THE_EMAIL_YOU_SIGNED_UP_WITH';
  new_id    uuid;
begin
  select id into new_id from auth.users where lower(email) = lower(new_email);
  if new_id is null then
    raise exception 'No account found for that email. Create it in the app first.';
  end if;

  update public.habits            set user_id = new_id::text where user_id = old_id;
  update public.habit_completions set user_id = new_id::text where user_id = old_id;
  raise notice 'Moved data from % to %', old_id, new_id;
end $$;

-- Step C: check - should show your habits under the new account
select h.name, h.user_id
  from public.habits h
 order by h.created_at desc
 limit 20;
