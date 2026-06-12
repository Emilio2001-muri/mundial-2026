-- ================================================================
-- Migration 015: Add admin_unlocked flag to global_predictions
-- Allows admins to let a specific user re-edit their global picks
-- after the tournament lock date has passed.
-- ================================================================

alter table public.global_predictions
  add column if not exists admin_unlocked boolean not null default false;
