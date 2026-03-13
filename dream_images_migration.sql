-- Dream Images Tabelle
-- Ausführen in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS dream_images (
  id             BIGSERIAL PRIMARY KEY,
  dream_entry_id BIGINT NOT NULL REFERENCES dream_entries(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url      TEXT NOT NULL,
  storage_path   TEXT,
  prompt_used    TEXT,
  format         TEXT NOT NULL DEFAULT 'square',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dream_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own dream images" ON dream_images
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS dream_images_entry_idx ON dream_images(dream_entry_id);
CREATE INDEX IF NOT EXISTS dream_images_user_idx  ON dream_images(user_id);
CREATE INDEX IF NOT EXISTS dream_images_created_idx ON dream_images(user_id, created_at);

-- RPC: Tagesanzahl der generierten Bilder
CREATE OR REPLACE FUNCTION get_daily_image_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*)::INTEGER
  FROM dream_images
  WHERE user_id = p_user_id
    AND created_at >= CURRENT_DATE
    AND created_at < CURRENT_DATE + INTERVAL '1 day'
$$;
