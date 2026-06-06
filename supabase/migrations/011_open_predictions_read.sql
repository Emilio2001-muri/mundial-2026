-- ================================================================
-- Migration 011: Open prediction reads to all authenticated users
-- 
-- Reason: The user profile page should show any user's predictions
-- to all logged-in members of the quiniela. The "hide before kickoff/lock"
-- restriction was causing predictions to never load for non-admin viewers.
-- For a private friend/family quiniela, full transparency is desired.
-- ================================================================

-- 1. Drop old restrictive SELECT policies for match_predictions
drop policy if exists "predictions: read others after lock" on public.match_predictions;
drop policy if exists "predictions: users can read own"    on public.match_predictions;

-- 2. Replace with a single open SELECT: any authenticated user can read any prediction
create policy "predictions: read all authenticated" on public.match_predictions
  for select
  using (auth.role() = 'authenticated');

-- 3. Drop old restrictive SELECT policy for scorer_predictions
drop policy if exists "scorer_preds: users can read own" on public.scorer_predictions;

-- 4. Replace with open SELECT for scorer_predictions
create policy "scorer_preds: read all authenticated" on public.scorer_predictions
  for select
  using (auth.role() = 'authenticated');

-- 5. Drop old restrictive SELECT policies for global_predictions
drop policy if exists "global_preds: read others after lock" on public.global_predictions;
drop policy if exists "global_preds: users can read own"     on public.global_predictions;

-- 6. Replace with open SELECT for global_predictions
create policy "global_preds: read all authenticated" on public.global_predictions
  for select
  using (auth.role() = 'authenticated');
