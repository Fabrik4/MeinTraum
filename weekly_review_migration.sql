-- Wochenrückblick RPC
-- Ausführen in Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_weekly_review(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_week_start TIMESTAMPTZ := NOW() - INTERVAL '7 days';
  v_prev_start TIMESTAMPTZ := NOW() - INTERVAL '14 days';
  result JSON;
BEGIN
  SELECT json_build_object(
    'dream_count', (
      SELECT COUNT(*) FROM dream_entries
      WHERE user_id = p_user_id
        AND created_at >= v_week_start
        AND (dream_tone IS NULL OR dream_tone NOT IN ('no_memory', 'no_sleep'))
    ),
    'checkin_count', (
      SELECT COUNT(*) FROM dream_entries
      WHERE user_id = p_user_id
        AND created_at >= v_week_start
        AND dream_tone IN ('no_memory', 'no_sleep')
    ),
    'journal_count', (
      SELECT COUNT(*) FROM journal_entries
      WHERE user_id = p_user_id
        AND created_at >= v_week_start
    ),
    'mood_avg', (
      SELECT ROUND(AVG(mood_score)::NUMERIC, 1)
      FROM journal_entries
      WHERE user_id = p_user_id
        AND created_at >= v_week_start
        AND mood_score IS NOT NULL
    ),
    'mood_avg_prev', (
      SELECT ROUND(AVG(mood_score)::NUMERIC, 1)
      FROM journal_entries
      WHERE user_id = p_user_id
        AND created_at >= v_prev_start
        AND created_at < v_week_start
        AND mood_score IS NOT NULL
    ),
    'nightmare_count', (
      SELECT COUNT(*) FROM dream_entries
      WHERE user_id = p_user_id
        AND created_at >= v_week_start
        AND nightmare_flag = true
    ),
    'pleasant_count', (
      SELECT COUNT(*) FROM dream_entries
      WHERE user_id = p_user_id
        AND created_at >= v_week_start
        AND dream_tone = 'pleasant'
    ),
    'top_emotion', (
      SELECT emotion_part
      FROM (
        SELECT TRIM(unnest(string_to_array(dominant_emotion, ','))) AS emotion_part
        FROM dream_entries
        WHERE user_id = p_user_id
          AND created_at >= v_week_start
          AND dominant_emotion IS NOT NULL
      ) emotions
      WHERE emotion_part <> ''
      GROUP BY emotion_part
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ),
    'moon_phases', COALESCE((
      SELECT json_agg(DISTINCT moon_phase_name)
      FROM dream_entries
      WHERE user_id = p_user_id
        AND created_at >= v_week_start
        AND moon_phase_name IS NOT NULL
    ), '[]'::json),
    'persons', COALESCE((
      SELECT json_agg(DISTINCT ue.entity_label)
      FROM dream_entry_entities dee
      JOIN dream_entries d ON d.id = dee.dream_id
      JOIN user_entities ue ON ue.id = dee.user_entity_id
      WHERE d.user_id = p_user_id
        AND d.created_at >= v_week_start
        AND ue.entity_type = 'person'
    ), '[]'::json),
    'places', COALESCE((
      SELECT json_agg(DISTINCT ue.entity_label)
      FROM dream_entry_entities dee
      JOIN dream_entries d ON d.id = dee.dream_id
      JOIN user_entities ue ON ue.id = dee.user_entity_id
      WHERE d.user_id = p_user_id
        AND d.created_at >= v_week_start
        AND ue.entity_type = 'place'
    ), '[]'::json),
    'week_start', v_week_start,
    'week_end', NOW()
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
