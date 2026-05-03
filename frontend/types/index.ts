export interface User {
  id: string;
  email: string;
}

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  niche: string;
  website_url: string;
  social_handles: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
  };
  brand_colors: string[];
  brand_voice: string;
  cta_style: string;
  target_audience: string;
  offer_products: string;
  forbidden_words: string[];
  content_pillars: string[];
  ai_provider: "openai" | "claude";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentInput {
  id: string;
  workspace_id: string;
  input_type: "text" | "url" | "youtube" | "pdf" | "doc";
  raw_content: string;
  extracted_metadata: {
    topic?: string;
    keywords?: string[];
    angle?: string;
    emotional_hook?: string;
    cta_possibilities?: string[];
    content_type?: string;
    target_mood?: string;
  };
  source_url?: string;
  created_at: string;
}

export interface GeneratedContent {
  id: string;
  workspace_id: string;
  input_id?: string;
  content_type: string;
  platform: "instagram" | "facebook" | "linkedin" | "twitter";
  content_text: string;
  status: "draft" | "approved" | "rejected";
  scheduled_at?: string;
  created_at: string;
}

export interface ScheduledPost {
  id: string;
  content_id: string;
  platform: string;
  scheduled_at: string;
  published_at?: string;
  status: "scheduled" | "published" | "failed";
}

export interface SocialAccount {
  id: string;
  workspace_id: string;
  platform: "instagram" | "facebook" | "linkedin" | "twitter" | "tiktok";
  access_token: string;
  refresh_token?: string;
  expires_at: string;
}

export interface Recipe {
  id: string;
  workspace_id: string;
  name: string;
  trigger_type: string;
  n8n_webhook_url: string;
  is_active: boolean;
  created_at: string;
}

// API Request/Response types
export interface GenerateContentRequest {
  workspace_id: string;
  input_text: string;
  platforms: string[];
}

export interface GenerateContentResponse {
  success: boolean;
  input_id: string;
  generated_content: GeneratedContent[];
  metadata: Record<string, unknown>;
}

export interface ScheduleContentRequest {
  content_id: string;
  platform: string;
  scheduled_at: string;
}