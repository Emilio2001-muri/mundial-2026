-- ================================================================
-- Migration 019b: Allow service-role (admin server actions) to bypass
-- the prediction lock trigger. The service-role client has no auth.uid(),
-- so is_admin(NULL) was false and even admins got blocked.
-- ================================================================

create or replace function public.enforce_prediction_lock()
returns trigger
language plpgsql
security definer
as $$
declare
  v_kickoff timestamptz;
  v_is_admin boolean;
begin
  select kickoff_at into v_kickoff from public.matches where id = new.match_id;
  select public.is_admin(auth.uid()) into v_is_admin;

  -- Bypass the lock for admins AND for service-role inserts (auth.uid() is null),
  -- which only the trusted admin server actions use.
  if now() >= v_kickoff - interval '1 minute'
     and not v_is_admin
     and auth.uid() is not null
     and not coalesce(new.admin_unlocked, false) then
    raise exception 'Las predicciones para este partido están bloqueadas (lock: % 1 min before kickoff).', v_kickoff
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;
