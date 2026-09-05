/*
# Create sessions table for rowing session history

## Purpose
Stores a row for each completed rowing session so logged-in users can review
their past workouts (date, duration, stroke rate) on the history screen.

## New Tables
- `sessions`
  - `id` (uuid, primary key) — unique session identifier
  - `user_id` (uuid, not null) — references `auth.users(id)`, identifies the owner
  - `start_time` (timestamptz, not null) — when the session began
  - `end_time` (timestamptz, not null) — when the session ended
  - `duration_sec` (integer, not null) — session length in seconds
  - `spm` (integer, not null) — the stroke rate (strokes per minute) the metronome was set to
  - `stroke_count` (integer, not null, default 0) — total strokes counted during the session
  - `created_at` (timestamptz, default now()) — when the record was inserted

## Security
- Row Level Security enabled on `sessions`.
- Four owner-scoped policies (SELECT, INSERT, UPDATE, DELETE) — each authenticated
  user can only access rows where `user_id = auth.uid()`.
- `user_id` has `DEFAULT auth.uid()` so inserts that omit it still satisfy the
  INSERT policy's WITH CHECK.

## Notes
1. The app's frontend inserts a new row when the user stops the metronome.
2. The history screen queries rows for the current user, ordered by `start_time`
   descending (most recent first).
3. No email confirmation is enabled — sign-up logs the user in immediately.
*/

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  duration_sec integer NOT NULL,
  spm integer NOT NULL,
  stroke_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_sessions" ON sessions;
CREATE POLICY "select_own_sessions"
ON sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_sessions" ON sessions;
CREATE POLICY "insert_own_sessions"
ON sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_sessions" ON sessions;
CREATE POLICY "update_own_sessions"
ON sessions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_sessions" ON sessions;
CREATE POLICY "delete_own_sessions"
ON sessions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_user_start_time
ON sessions (user_id, start_time DESC);
