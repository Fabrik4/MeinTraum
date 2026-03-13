-- Revisions-System für Traumeinträge
-- Ausführen in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS dream_revisions (
  id          BIGSERIAL PRIMARY KEY,
  dream_entry_id BIGINT NOT NULL REFERENCES dream_entries(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  expanded    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dream_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own dream revisions" ON dream_revisions
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS dream_revisions_entry_idx ON dream_revisions(dream_entry_id);
CREATE INDEX IF NOT EXISTS dream_revisions_user_idx  ON dream_revisions(user_id);
