-- ── Mondphasen-Migration ──────────────────────────────────────
-- Ausführen in: Supabase Dashboard → SQL Editor

-- 1. Neue Spalten in dream_entries
ALTER TABLE dream_entries
  ADD COLUMN IF NOT EXISTS moon_phase      DECIMAL(5,4),  -- 0.0000 – 1.0000
  ADD COLUMN IF NOT EXISTS moon_phase_name TEXT;          -- z.B. "Vollmond"

-- 2. Index für schnelle Abfragen nach Mondphase
CREATE INDEX IF NOT EXISTS idx_dream_entries_moon_phase_name
  ON dream_entries (user_id, moon_phase_name)
  WHERE moon_phase_name IS NOT NULL;

-- 3. RPC-Funktion: Mondphasen-Statistik pro User
CREATE OR REPLACE FUNCTION get_moon_phase_stats(p_user_id UUID)
RETURNS TABLE(
  phase_name      TEXT,
  dream_count     BIGINT,
  nightmare_count BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    moon_phase_name                                                          AS phase_name,
    COUNT(*)                                                                 AS dream_count,
    COUNT(*) FILTER (WHERE nightmare_flag = true OR dream_tone = 'nightmare') AS nightmare_count
  FROM dream_entries
  WHERE user_id = p_user_id
    AND moon_phase_name IS NOT NULL
  GROUP BY moon_phase_name
  ORDER BY dream_count DESC;
$$;
