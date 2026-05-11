ALTER TABLE weekly_day_images
ADD COLUMN IF NOT EXISTS source_mode VARCHAR(20) DEFAULT 'daily'
  CHECK (source_mode IN ('daily', 'block')),
ADD COLUMN IF NOT EXISTS day_span_count INT DEFAULT 1
  CHECK (day_span_count BETWEEN 1 AND 7),
ADD COLUMN IF NOT EXISTS ocr_status VARCHAR(20) DEFAULT 'pending'
  CHECK (ocr_status IN ('pending', 'processing', 'processed', 'error')),
ADD COLUMN IF NOT EXISTS ocr_raw_text TEXT,
ADD COLUMN IF NOT EXISTS ocr_error TEXT;
