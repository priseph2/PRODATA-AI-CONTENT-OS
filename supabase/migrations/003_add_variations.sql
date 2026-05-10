-- Phase 8: Content Variations
-- Add variation grouping and angle tracking to generated_content

ALTER TABLE generated_content
ADD COLUMN IF NOT EXISTS variation_set UUID;

ALTER TABLE generated_content
ADD COLUMN IF NOT EXISTS variation_index INTEGER DEFAULT 0;

ALTER TABLE generated_content
ADD COLUMN IF NOT EXISTS variation_angle VARCHAR;

-- Index for efficient variation group queries
CREATE INDEX IF NOT EXISTS idx_generated_content_variation_set ON generated_content(variation_set);
