CREATE TABLE IF NOT EXISTS ocr_image_cache (
  file_hash TEXT PRIMARY KEY,
  ocr_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_ocr_image_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ocr_image_cache_updated_at_trigger ON ocr_image_cache;
CREATE TRIGGER update_ocr_image_cache_updated_at_trigger
  BEFORE UPDATE ON ocr_image_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_ocr_image_cache_updated_at();
