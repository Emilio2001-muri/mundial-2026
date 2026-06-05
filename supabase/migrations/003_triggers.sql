-- ================================================================
-- Migration 003: Triggers
-- ================================================================

-- Auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, role, timezone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    coalesce(new.raw_user_meta_data->>'timezone', 'UTC')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-compute prediction_lock_at = kickoff_at - 1 minute
-- (PostgreSQL does not allow timestamptz arithmetic in GENERATED ALWAYS AS)
create or replace function public.set_prediction_lock_at()
returns trigger
language plpgsql
as $$
begin
  new.prediction_lock_at := new.kickoff_at - interval '1 minute';
  return new;
end;
$$;

create trigger set_matches_prediction_lock_at
  before insert or update of kickoff_at on public.matches
  for each row execute procedure public.set_prediction_lock_at();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger set_matches_updated_at
  before update on public.matches
  for each row execute procedure public.set_updated_at();

create trigger set_predictions_updated_at
  before update on public.match_predictions
  for each row execute procedure public.set_updated_at();

create trigger set_scorer_preds_updated_at
  before update on public.scorer_predictions
  for each row execute procedure public.set_updated_at();

create trigger set_global_preds_updated_at
  before update on public.global_predictions
  for each row execute procedure public.set_updated_at();

-- Lock predictions automatically 1 minute before kickoff
-- (This is a check trigger — the primary enforcement is in application code and RLS)
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

  if now() >= v_kickoff - interval '1 minute' and not v_is_admin then
    raise exception 'Las predicciones para este partido están bloqueadas (lock: % 1 min before kickoff).', v_kickoff
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger enforce_prediction_lock_insert
  before insert on public.match_predictions
  for each row execute procedure public.enforce_prediction_lock();

create trigger enforce_prediction_lock_update
  before update on public.match_predictions
  for each row execute procedure public.enforce_prediction_lock();
