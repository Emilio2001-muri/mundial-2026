-- ================================================================
-- Migration 012: Add admin_unlocked to match_predictions
--
-- Allows admins to unlock a specific user's match prediction
-- so they can re-edit it even after the kickoff lock has passed.
-- ================================================================

-- 1. Add column
alter table public.match_predictions
  add column if not exists admin_unlocked boolean not null default false;

-- 2. Update can_edit_match_prediction to also allow editing when admin_unlocked = true
create or replace function public.can_edit_match_prediction(p_match_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select (
    -- Match hasn't locked yet
    exists (
      select 1 from public.matches m
      where m.id = p_match_id
        and now() < m.kickoff_at - interval '1 minute'
    )
    or
    -- OR admin explicitly unlocked this user's prediction
    exists (
      select 1 from public.match_predictions mp
      where mp.match_id = p_match_id
        and mp.user_id = p_user_id
        and mp.admin_unlocked = true
    )
  );
$$;
