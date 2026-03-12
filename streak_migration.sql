-- Streak-Funktion: zählt aufeinanderfolgende Tage mit mind. einem Eintrag
-- Ausführen in: Supabase → SQL Editor

CREATE OR REPLACE FUNCTION get_user_streak(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_streak  integer := 0;
  v_check   date    := CURRENT_DATE;
  v_found   boolean;
BEGIN
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM dream_entries
      WHERE user_id = p_user_id
        AND DATE(COALESCE(dreamed_at, created_at)) = v_check
      UNION ALL
      SELECT 1 FROM journal_entries
      WHERE user_id = p_user_id
        AND COALESCE(entry_date::date, DATE(created_at)) = v_check
    ) INTO v_found;

    IF v_found THEN
      v_streak := v_streak + 1;
      v_check  := v_check - 1;
    ELSIF v_check = CURRENT_DATE THEN
      -- Heute noch kein Eintrag → trotzdem gestern prüfen (Streak noch aktiv)
      v_check := v_check - 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  RETURN v_streak;
END;
$$;
