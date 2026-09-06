/*
# Create user_settings table for per-user calibration values

## Purpose
Stores per-user settings that persist across sessions. Currently holds the
user's self-rated distance-per-stroke (DPS) calibration value, which the app
uses to estimate total distance from a raw stroke count when no GPS/speed
sensor is connected.

## New Tables
- `user_settings`
  - `user_id` (uuid, primary key) — references `auth.users(id)`, one row per user
  - `meters_per_stroke` (numeric, default 7.0) — the user's DPS calibration value (1–14 m)
  - `updated_at` (timestamptz, default now()) — last modification time

## Security
- Row Level Security enabled on `user_settings`.
- Four owner-scoped policies (SELECT, INSERT, UPDATE, DELETE) — each authenticated
  user can only access their own row where `user_id = auth.uid()`.
- `user_id` is the primary key and defaults to `auth.uid()` so an upsert that
  omits it still satisfies the INSERT policy's WITH CHECK.

## Notes
1. The frontend uses `.upsert({ meters_per_stroke })` — the `user_id` column
   defaults to `auth.uid()` so the owner is filled in automatically.
2. The DPS screen reads the existing value on mount and initializes the slider
   to the saved value (or 7.0 default if no row exists yet).
3. Uses `numeric(4,1)` to allow values like 7.0, 10.5, etc.
*/

CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  meters_per_stroke numeric(4,1) NOT NULL DEFAULT 7.0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_settings" ON user_settings;
CREATE POLICY "select_own_settings"
ON user_settings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_settings" ON user_settings;
CREATE POLICY "insert_own_settings"
ON user_settings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_settings" ON user_settings;
CREATE POLICY "update_own_settings"
ON user_settings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_settings" ON user_settings;
CREATE POLICY "delete_own_settings"
ON user_settings FOR DELETE
TO authenticated
USING (auth.uid() = user_id);