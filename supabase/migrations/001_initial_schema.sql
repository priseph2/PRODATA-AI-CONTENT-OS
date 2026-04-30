-- PRO DATA AI CONTENT OS - Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  niche VARCHAR,
  website_url VARCHAR,
  social_handles JSONB DEFAULT '{}',
  brand_colors JSONB DEFAULT '[]',
  brand_voice TEXT,
  cta_style VARCHAR,
  target_audience TEXT,
  offer_products TEXT,
  forbidden_words JSONB DEFAULT '[]',
  content_pillars JSONB DEFAULT '[]',
  ai_provider VARCHAR DEFAULT 'openai' CHECK (ai_provider IN ('openai', 'claude')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Content inputs table
CREATE TABLE IF NOT EXISTS content_inputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  input_type VARCHAR NOT NULL CHECK (input_type IN ('text', 'url', 'youtube', 'pdf', 'doc')),
  raw_content TEXT NOT NULL,
  extracted_metadata JSONB DEFAULT '{}',
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Generated content table
CREATE TABLE IF NOT EXISTS generated_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  input_id UUID REFERENCES content_inputs(id) ON DELETE SET NULL,
  content_type VARCHAR NOT NULL,
  platform VARCHAR NOT NULL CHECK (platform IN ('instagram', 'facebook', 'linkedin', 'twitter', 'tiktok')),
  content_text TEXT NOT NULL,
  status VARCHAR DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected', 'published')),
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Visual assets table
CREATE TABLE IF NOT EXISTS visual_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  content_id UUID REFERENCES generated_content(id) ON DELETE SET NULL,
  asset_type VARCHAR NOT NULL,
  storage_url TEXT,
  template_style VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scheduled posts table
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID REFERENCES generated_content(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  platform VARCHAR NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,
  status VARCHAR DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'published', 'failed'))
);

-- Social accounts table (for OAuth tokens)
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  platform VARCHAR NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, platform)
);

-- Recipes/Automation table
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  trigger_type VARCHAR NOT NULL,
  n8n_workflow_id VARCHAR,
  n8n_webhook_url TEXT,
  actions JSONB DEFAULT '[]',
  schedule VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_content_inputs_workspace_id ON content_inputs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_workspace_id ON generated_content(workspace_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_status ON generated_content(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_workspace_id ON scheduled_posts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);

-- Row Level Security (RLS) - IMPORTANT for production
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own workspaces"
  ON workspaces FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own content inputs"
  ON content_inputs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = content_inputs.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own content inputs"
  ON content_inputs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = content_inputs.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own generated content"
  ON generated_content FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = generated_content.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own scheduled posts"
  ON scheduled_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = scheduled_posts.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own social accounts"
  ON social_accounts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = social_accounts.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own recipes"
  ON recipes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = recipes.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signups
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- You can add default workspaces or other initialization here
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();