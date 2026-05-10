-- Phase 6 & 7: Add Missing Columns and Tables
-- Run this in Supabase SQL Editor if you already ran migration 001

-- Add missing columns to generated_content
ALTER TABLE generated_content
ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE generated_content
ADD COLUMN IF NOT EXISTS template_id UUID;

-- Add missing columns to scheduled_posts
ALTER TABLE scheduled_posts
ADD COLUMN IF NOT EXISTS platform_post_id VARCHAR;

ALTER TABLE scheduled_posts
ADD COLUMN IF NOT EXISTS error_message TEXT;

ALTER TABLE scheduled_posts
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Add missing columns to social_accounts
ALTER TABLE social_accounts
ADD COLUMN IF NOT EXISTS account_id VARCHAR;

ALTER TABLE social_accounts
ADD COLUMN IF NOT EXISTS page_id VARCHAR;

-- Create content_templates table
CREATE TABLE IF NOT EXISTS content_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  platform VARCHAR NOT NULL,
  template_text TEXT NOT NULL,
  category VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create post_analytics table
CREATE TABLE IF NOT EXISTS post_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  scheduled_post_id UUID REFERENCES scheduled_posts(id) ON DELETE CASCADE,
  platform VARCHAR NOT NULL,
  platform_post_id VARCHAR,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saved INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  total_interactions INTEGER DEFAULT 0,
  post_impressions INTEGER DEFAULT 0,
  post_impressions_unique INTEGER DEFAULT 0,
  post_clicks INTEGER DEFAULT 0,
  post_reactions_like_total INTEGER DEFAULT 0,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add new indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_platform ON scheduled_posts(platform);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_accounts_workspace_platform ON social_accounts(workspace_id, platform);
CREATE INDEX IF NOT EXISTS idx_content_templates_workspace_id ON content_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_post_analytics_workspace_id ON post_analytics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_post_analytics_scheduled_post_id ON post_analytics(scheduled_post_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_post_analytics_unique_post ON post_analytics(scheduled_post_id);

-- Enable RLS on new tables
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables (only if they don't exist)
CREATE POLICY "Users can manage their own content templates"
  ON content_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = content_templates.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own post analytics"
  ON post_analytics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = post_analytics.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  );
