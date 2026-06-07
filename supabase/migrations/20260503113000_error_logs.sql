CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('web', 'telegram', 'ocr')),
  message TEXT NOT NULL,
  stack_trace TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at
  ON error_logs (created_at DESC);

CREATE OR REPLACE FUNCTION insert_error_log(
  p_source TEXT,
  p_message TEXT,
  p_stack_trace TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_id UUID;
BEGIN
  INSERT INTO error_logs (source, message, stack_trace)
  VALUES (
    CASE
      WHEN p_source IN ('web', 'telegram', 'ocr') THEN p_source
      ELSE 'web'
    END,
    COALESCE(NULLIF(TRIM(p_message), ''), 'Unknown error'),
    p_stack_trace
  )
  RETURNING id INTO inserted_id;

  RETURN inserted_id;
END;
$$;

CREATE OR REPLACE FUNCTION list_error_logs(
  p_telegram_id BIGINT,
  p_limit INT DEFAULT 200
)
RETURNS TABLE (
  id UUID,
  source TEXT,
  message TEXT,
  stack_trace TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM users
    WHERE telegram_id = p_telegram_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    e.id,
    e.source,
    e.message,
    e.stack_trace,
    e.created_at
  FROM error_logs e
  ORDER BY e.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 200), 1000));
END;
$$;

REVOKE EXECUTE ON FUNCTION insert_error_log(TEXT, TEXT, TEXT) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION list_error_logs(BIGINT, INT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_error_log(TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION list_error_logs(BIGINT, INT) TO service_role;
