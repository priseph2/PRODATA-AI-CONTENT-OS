# PRO DATA AI CONTENT OS
## Full Feature Blueprint v2.0

**Last Updated:** 2026-05-01
**Status:** Ready for Development
**Version:** 2.0 - Implementation Ready

---

## TABLE OF CONTENTS

1. [Vision & Core Flow](#1-vision--core-flow)
2. [Tech Stack](#2-tech-stack)
3. [Database Schema](#3-database-schema)
4. [Frontend Pages](#4-frontend-pages)
5. [API Endpoints](#5-api-endpoints)
6. [n8n Workflows](#6-n8n-workflows)
7. [Component Library](#7-component-library)
8. [AI Prompt System](#8-ai-prompt-system)
9. [Security & RLS](#9-security--rls)
10. [Implementation Phases](#10-implementation-phases)
11. [Testing Strategy](#11-testing-strategy)
12. [Deployment Guide](#12-deployment-guide)

---

## 1. VISION & CORE FLOW

### Product Promise
> Turn one content input into many approved, branded, scheduled social media assets in minutes.

### The Problem We Solve
Social media managers waste hours:
- Rewriting the same content for different platforms
- Struggling to maintain brand voice consistency
- Manually scheduling posts across tools
- Waiting on designers for simple graphics

### Our Solution
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           THE CORE FLOW                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  INPUT   │───▶│  SCRAPE  │───▶│ ANALYZE  │───▶│ GENERATE │              │
│  │          │    │          │    │          │    │          │              │
│  │ • Paste  │    │ • n8n    │    │ • AI     │    │ • Multi  │              │
│  │ • URL    │    │ • Fetch  │    │ • Extract│    │ platform │              │
│  │ • Upload │    │ • Parse  │    │ • Classify│   │ • Branded│              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│       ▲                                                       │            │
│       │                                                       ▼            │
│       │                                                ┌──────────┐        │
│       │                                                │ APPROVE  │        │
│       │                                                │          │        │
│       │                                                │ • Review │        │
│       │                                                │ • Edit   │        │
│       │                                                │ • Reject │        │
│       │                                                └──────────┘        │
│       │                                                       │            │
│       │                                                       ▼            │
│       │                                                ┌──────────┐        │
│       │                                                │ SCHEDULE │        │
│       │                                                │          │        │
│       │                                                │ • Calendar│        │
│       │                                                │ • Queue  │        │
│       │                                                └──────────┘        │
│       │                                                       │            │
│       └───────────────────────────────────────────────────────┘            │
│                          (Published → Analytics)                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Target Users

| Persona | Pain Point | Our Solution |
|---------|------------|--------------|
| **Social Media Manager** | Managing 10+ client accounts | Workspaces with brand profiles |
| **Content Agency** | Bulk content creation bottlenecks | AI generation at scale |
| **Solo Entrepreneur** | No time for content strategy | One input → many outputs |
| **Marketing Team** | Inconsistent brand voice | Brand voice enforcement |

### User Stories

1. **As a social media manager**, I want to save brand guidelines once and have them applied to all generated content, so I don't have to rewrite briefs.

2. **As an agency owner**, I want to generate a week's worth of content from one blog post, so I can serve more clients in less time.

3. **As a solo founder**, I want to paste a URL and get ready-to-post content, so I can maintain my social presence without hiring help.

4. **As a content creator**, I want to review and approve content before it goes live, so I maintain quality control.

---

## 2. TECH STACK

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND STACK                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Next.js 14 (App Router)                                    │
│  ├── Server Components for data fetching                    │
│  ├── Client Components for interactivity                    │
│  └── API Routes for backend logic                           │
│                                                             │
│  Styling                                                    │
│  ├── TailwindCSS for utility classes                        │
│  ├── CSS Variables for theming                              │
│  └── Lucide React for icons                                 │
│                                                             │
│  State Management                                           │
│  ├── React Context for global state                         │
│  ├── React Query for server state                           │
│  └── URL search params for filters                          │
│                                                             │
│  Forms                                                      │
│  ├── React Hook Form                                        │
│  └── Zod for validation                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Backend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND STACK                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Primary: n8n Automation                                    │
│  ├── Self-hosted on VPS (Docker)                            │
│  ├── Webhook triggers from Next.js                          │
│  ├── Supabase integration                                   │
│  └── AI API integrations                                    │
│                                                             │
│  Secondary: Next.js API Routes                              │
│  ├── CRUD operations                                        │
│  ├── Auth middleware                                        │
│  └── Direct Supabase calls                                  │
│                                                             │
│  Fallback: FastAPI (optional)                               │
│  └── For complex operations n8n can't handle                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Layer

```
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Supabase (PostgreSQL)                                      │
│  ├── Auth: User management                                  │
│  ├── Database: Relational data                              │
│  ├── Storage: File uploads                                  │
│  └── RLS: Row-level security                                │
│                                                             │
│  Real-time (future)                                         │
│  └── Supabase subscriptions for live updates                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### AI Layer

| Provider | Model | Use Case | Cost |
|----------|-------|----------|------|
| **Claude (Primary)** | claude-sonnet-4-7 | Brand voice, long-form, nuanced content | ~$0.01/request |
| **OpenAI (Fallback)** | gpt-4o-mini | Fast generation, variety, hooks | ~$0.005/request |

### Infrastructure

```
┌─────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Vercel (Frontend)                                          │
│  ├── Automatic deployments                                  │
│  ├── Edge functions                                         │
│  └── Image optimization                                     │
│                                                             │
│  Supabase (Database)                                        │
│  ├── Managed PostgreSQL                                     │
│  ├── Built-in auth                                          │
│  └── File storage                                           │
│                                                             │
│  n8n (Automation)                                           │
│  ├── Self-hosted on $6/mo VPS                               │
│  ├── Docker deployment                                      │
│  └── Persistent queue                                       │
│                                                             │
│  External APIs                                              │
│  ├── Claude/OpenAI for text                                 │
│  ├── Bannerbear/Creatomate for images (v1.1)               │
│  └── Social platforms for posting (v1.1)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. DATABASE SCHEMA

### Entity Relationship Diagram

```
┌─────────────────┐       ┌──────────────────┐       ┌───────────────────┐
│  auth.users     │       │   workspaces     │       │ social_accounts   │
├─────────────────┤       ├──────────────────┤       ├───────────────────┤
│ id (PK)         │◄──────│ user_id (FK)     │       │ workspace_id (FK) │
│ email           │   1:N │ id (PK)          │◄──────│ id (PK)           │
│ created_at      │       │ name             │   1:N │ platform          │
└─────────────────┘       │ niche            │       │ access_token      │
                          │ website_url      │       │ refresh_token     │
                          │ social_handles   │       │ expires_at        │
                          │ brand_colors     │       └───────────────────┘
                          │ brand_voice      │
                          │ cta_style        │
                          │ target_audience  │
                          │ offer_products   │
                          │ forbidden_words  │
                          │ content_pillars  │
                          │ ai_provider      │
                          │ is_active        │
                          │ created_at       │
                          │ updated_at       │
                          └────────┬─────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
          ┌────────────────┐ ┌──────────────┐ ┌──────────────────┐
          │ content_inputs │ │generated_    │ │    recipes       │
          ├────────────────┤ │content       │ ├──────────────────┤
          │ id (PK)        │ ├──────────────┤ │ id (PK)          │
          │ workspace(FK)  │ │ id (PK)      │ │ workspace_id(FK) │
          │ input_type     │ │ workspace(FK)│ │ name             │
          │ raw_content    │ │ input_id(FK) │ │ trigger_type     │
          │ metadata       │ │ content_type │ │ n8n_workflow_id  │
          │ source_url     │ │ platform     │ │ webhook_url      │
          │ created_at     │ │ content_text │ │ actions          │
          └────────────────┘ │ status       │ │ schedule         │
                             │ scheduled_at │ │ is_active        │
                             │ created_at   │ │ created_at       │
                             └──────┬───────┘ └──────────────────┘
                                    │
                                    ▼
                          ┌──────────────────┐
                          │ scheduled_posts  │
                          ├──────────────────┤
                          │ id (PK)          │
                          │ content_id (FK)  │
                          │ workspace_id(FK) │
                          │ platform         │
                          │ scheduled_at     │
                          │ published_at     │
                          │ status           │
                          └──────────────────┘
```

### Table Specifications

#### `workspaces`

Brand profile for each client/account.

```sql
CREATE TABLE workspaces (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  niche           VARCHAR(255),
  website_url     VARCHAR(512),
  social_handles  JSONB DEFAULT '{}',
  brand_colors    JSONB DEFAULT '[]',
  brand_voice     TEXT,
  cta_style       VARCHAR(255),
  target_audience TEXT,
  offer_products  TEXT,
  forbidden_words JSONB DEFAULT '[]',
  content_pillars JSONB DEFAULT '[]',
  ai_provider     VARCHAR(50) DEFAULT 'claude',
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_workspaces_user ON workspaces(user_id);
CREATE INDEX idx_workspaces_active ON workspaces(is_active);

-- RLS Policies
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workspaces"
  ON workspaces FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workspaces"
  ON workspaces FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workspaces"
  ON workspaces FOR DELETE
  USING (auth.uid() = user_id);
```

#### `content_inputs`

Raw content submitted by users.

```sql
CREATE TABLE content_inputs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  input_type        VARCHAR(50) NOT NULL, -- 'text', 'url', 'youtube', 'pdf', 'doc'
  raw_content       TEXT,
  extracted_metadata JSONB DEFAULT '{}',
  source_url        VARCHAR(512),
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_content_inputs_workspace ON content_inputs(workspace_id);
CREATE INDEX idx_content_inputs_type ON content_inputs(input_type);

-- RLS Policies (inherited via workspace)
ALTER TABLE content_inputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view content in own workspaces"
  ON content_inputs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert content in own workspaces"
  ON content_inputs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id AND w.user_id = auth.uid()
    )
  );
```

#### `generated_content`

AI-generated content ready for approval.

```sql
CREATE TABLE generated_content (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  input_id        UUID REFERENCES content_inputs(id) ON DELETE SET NULL,
  content_type    VARCHAR(50) NOT NULL, -- 'caption', 'hook', 'cta', 'thread', 'script', 'carousel'
  platform        VARCHAR(50) NOT NULL, -- 'instagram', 'facebook', 'linkedin', 'twitter', 'tiktok'
  content_text    TEXT NOT NULL,
  status          VARCHAR(50) DEFAULT 'draft', -- 'draft', 'approved', 'rejected', 'published'
  scheduled_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_generated_workspace ON generated_content(workspace_id);
CREATE INDEX idx_generated_status ON generated_content(status);
CREATE INDEX idx_generated_platform ON generated_content(platform);

-- RLS Policies
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view content in own workspaces"
  ON generated_content FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update content in own workspaces"
  ON generated_content FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete content in own workspaces"
  ON generated_content FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id AND w.user_id = auth.uid()
    )
  );
```

#### `scheduled_posts`

Queued posts waiting to be published.

```sql
CREATE TABLE scheduled_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      UUID REFERENCES generated_content(id) ON DELETE CASCADE,
  workspace_id    UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  platform        VARCHAR(50) NOT NULL,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  published_at    TIMESTAMPTZ,
  status          VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'published', 'failed'
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_scheduled_workspace ON scheduled_posts(workspace_id);
CREATE INDEX idx_scheduled_at ON scheduled_posts(scheduled_at);
CREATE INDEX idx_scheduled_status ON scheduled_posts(status);

-- RLS Policies
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view posts in own workspaces"
  ON scheduled_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage posts in own workspaces"
  ON scheduled_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id AND w.user_id = auth.uid()
    )
  );
```

#### `social_accounts`

OAuth tokens for social platforms.

```sql
CREATE TABLE social_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  platform        VARCHAR(50) NOT NULL,
  account_name    VARCHAR(255),
  access_token    TEXT NOT NULL,
  refresh_token   TEXT,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Note: access_token should be encrypted at application level
-- Use pgcrypto or encrypt in app before storing

-- Indexes
CREATE INDEX idx_social_workspace ON social_accounts(workspace_id);
CREATE INDEX idx_social_platform ON social_accounts(platform);

-- RLS Policies
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accounts in own workspaces"
  ON social_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage accounts in own workspaces"
  ON social_accounts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id AND w.user_id = auth.uid()
    )
  );
```

#### `recipes`

Automation workflow configurations.

```sql
CREATE TABLE recipes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  trigger_type    VARCHAR(50) NOT NULL, -- 'url_submitted', 'scheduled', 'manual'
  n8n_workflow_id VARCHAR(255),
  n8n_webhook_url TEXT,
  actions         JSONB DEFAULT '[]',
  schedule        VARCHAR(100), -- cron expression
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_recipes_workspace ON recipes(workspace_id);
CREATE INDEX idx_recipes_active ON recipes(is_active);

-- RLS Policies
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recipes in own workspaces"
  ON recipes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage recipes in own workspaces"
  ON recipes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id AND w.user_id = auth.uid()
    )
  );
```

---

## 4. FRONTEND PAGES

### Page Tree

```
/                           (Landing Page)
├── /login                  (Auth)
├── /signup                 (Auth)
├── /dashboard              (Overview)
│   ├── /workspaces
│   │   ├── /               (List)
│   │   ├── /new            (Create)
│   │   └── /[id]           (Edit)
│   ├── /content            (Input & Generate)
│   ├── /approval           (Review Board)
│   ├── /schedule           (Calendar)
│   └── /settings           (Profile & Keys)
└── /api/*                  (API Routes)
```

### Page Specifications

#### `/` — Landing Page

**Purpose:** Convert visitors to signups

**Sections:**
1. **Hero**
   - Headline: "Turn One Content Input Into Many Approved Assets"
   - Subheadline: "AI-powered social media content at scale"
   - CTA: "Get Started Free" → /signup

2. **How It Works**
   - 4-step visual: Input → Generate → Approve → Schedule

3. **Features**
   - Multi-platform generation
   - Brand voice consistency
   - Approval workflow
   - Calendar scheduling

4. **Tech Stack**
   - Badges: Next.js, Supabase, n8n, Claude, OpenAI

5. **Footer**
   - Links: Login, Signup, Docs

**Design:** Gradient background (purple/slate), clean typography

---

#### `/login` — Sign In

**Purpose:** Authenticate existing users

**Form Fields:**
- Email (type: email, required)
- Password (type: password, required)
- "Forgot password?" link

**OAuth Options:**
- Continue with Google
- Continue with GitHub

**Links:**
- "Don't have an account? Sign up" → /signup

**Validation:**
- Email format
- Password min 6 chars

**Post-submit:**
- Success → Redirect to /dashboard
- Error → Display inline error message

---

#### `/signup` — Sign Up

**Purpose:** Register new users

**Form Fields:**
- Email (type: email, required)
- Password (type: password, required, min 6 chars)
- Confirm Password (type: password, required)
- Terms acceptance (checkbox, required)

**OAuth Options:**
- Continue with Google
- Continue with GitHub

**Links:**
- "Already have an account? Log in" → /login

**Validation:**
- Email format
- Password strength (6+ chars)
- Passwords match
- Terms checked

**Post-submit:**
- Success → Email confirmation → Redirect to /dashboard
- Error → Display inline error message

---

#### `/dashboard` — Overview

**Purpose:** Dashboard home with quick stats

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Welcome back, [email]                              [Settings]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │    3     │  │    12    │  │    5     │  │    8     │   │
│  │Workspaces│  │ Content  │  │ Pending  │  │Scheduled │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  Quick Actions                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ + New       │  │ Generate    │  │ View        │        │
│  │ Workspace   │  │ Content     │  │ Calendar    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  Recent Activity                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ • "Summer Sale" approved for Instagram (2 min ago)  │   │
│  │ • New workspace "Client ABC" created (1 hr ago)     │   │
│  │ • 5 posts scheduled for this week (3 hr ago)        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Data Requirements:**
- Workspace count
- Content count by status
- Recent activity feed

---

#### `/dashboard/workspaces` — Workspace List

**Purpose:** Browse and manage workspaces

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Workspaces                              [+ New Workspace]   │
├─────────────────────────────────────────────────────────────┤
│  [Search workspaces...]                                     │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Scentified │  │  TechStart  │  │  FitnessCo  │        │
│  │  Luxury     │  │  SaaS       │  │  Gym        │        │
│  │  perfume    │  │  B2B        │  │  membership │        │
│  │             │  │             │  │             │        │
│  │  🎨 #1a1a2e │  │  🎨 #0066ff │  │  🎨 #ff0000 │        │
│  │  📦 12 items│  │  📦 5 items │  │  📦 8 items │        │
│  │             │  │             │  │             │        │
│  │  [Edit] [📋]│  │  [Edit] [📋]│  │  [Edit] [📋]│        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Search by name/niche
- Grid/List view toggle
- Workspace cards with:
  - Name and niche
  - Brand color preview
  - Content count
  - Edit/Duplicate actions
- Empty state: "No workspaces yet. Create your first!"

---

#### `/dashboard/workspaces/new` — Create Workspace

**Purpose:** Onboard new client/brand

**Form Sections:**

**1. Basic Info**
| Field | Type | Required |
|-------|------|----------|
| Name | text | Yes |
| Niche | text | No |
| Website URL | url | No |

**2. Brand Identity**
| Field | Type | Required |
|-------|------|----------|
| Brand Voice | textarea | No |
| Brand Colors | color picker (multi) | No |
| CTA Style | text | No |
| Target Audience | textarea | No |
| Offer/Products | textarea | No |

**3. Social Profiles**
| Field | Type | Platform |
|-------|------|----------|
| Instagram Handle | text | @username |
| Facebook Page | text | Page name |
| LinkedIn | text | Company slug |
| Twitter/X | text | @username |

**4. AI Settings**
| Field | Type | Options |
|-------|------|---------|
| AI Provider | select | Claude (default), OpenAI |

**5. Guardrails**
| Field | Type | Format |
|-------|------|--------|
| Forbidden Words | tag input | Array of strings |
| Content Pillars | tag input | Array of strings |

**Actions:**
- Save → POST /api/workspaces → Redirect to list
- Cancel → Back to list

---

#### `/dashboard/workspaces/[id]` — Edit Workspace

**Purpose:** Modify existing workspace

**Same form as Create, plus:**
- Pre-populated fields
- Delete Workspace button (with confirmation)
- Content stats section:
  - Total content generated
  - Approved count
  - Scheduled count

---

#### `/dashboard/content` — Content Generation

**Purpose:** Submit content and trigger AI generation

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Generate Content                                           │
├─────────────────────────────────────────────────────────────┤
│  Workspace: [Select Workspace ▼]                            │
│                                                             │
│  Input Type:                                                │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┐       │
│  │  Text   │   URL   │ YouTube │   PDF   │   DOC   │       │
│  │    ●    │         │         │         │         │       │
│  └─────────┴─────────┴─────────┴─────────┴─────────┘       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Paste your content idea, blog post, or article...   │   │
│  │                                                     │   │
│  │                                                     │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Generate for:                                              │
│  ☑ Instagram  ☑ Facebook  ☑ LinkedIn  ☑ Twitter            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ℹ️ Content will be generated using n8n + Claude     │   │
│  │   Expect 15-30 seconds for processing               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                    [Generate Content]                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Input Type Handlers:**

| Type | Input | Processing |
|------|-------|------------|
| Text | Textarea | Direct to AI |
| URL | URL input | n8n scrape → AI |
| YouTube | URL input | n8n transcript → AI |
| PDF | File upload | Supabase Storage → n8n → AI |
| DOC | File upload | Supabase Storage → n8n → AI |

**Post-submit:**
- Show loading state
- Poll /api/generate/status/:run_id
- On complete → Redirect to /approval

---

#### `/dashboard/approval` — Approval Board

**Purpose:** Review and approve/reject generated content

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Approval Board                                             │
├─────────────────────────────────────────────────────────────┤
│  Workspace: [Select ▼]   Filter: [All] [Draft] [Approved]   │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Instagram   │  │ LinkedIn    │  │ Twitter     │        │
│  │ Caption     │  │ Article     │  │ Thread      │        │
│  │             │  │             │  │             │        │
│  │ "Discover   │  │ "Excited to │  │ "Thread: 5  │        │
│  │ the secret  │  │ announce    │  │ ways to...  │        │
│  │ to..."      │  │ our new..." │  │             │        │
│  │             │  │             │  │             │        │
│  │ [✓] [✏] [↻]│  │ [✓] [✏] [↻]│  │ [✓] [✏] [↻]│        │
│  │ [→ Schedule]│  │ [→ Schedule]│  │ [→ Schedule]│        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  [Select All] [Bulk Approve] [Bulk Reject]                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Card Actions:**

| Action | Behavior |
|--------|----------|
| ✓ Approve | Status → 'approved', enables Schedule button |
| ✏ Edit | Opens inline editor modal |
| ↻ Regenerate | Triggers n8n workflow again |
| → Schedule | Opens schedule modal |

**Filters:**
- All (default)
- Draft (pending review)
- Approved (ready to schedule)

**Bulk Actions:**
- Select multiple cards
- Bulk Approve / Bulk Reject

---

#### `/dashboard/schedule` — Calendar

**Purpose:** View and manage scheduled posts

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Content Calendar                                           │
├─────────────────────────────────────────────────────────────┤
│  Workspace: [Select ▼]   Month: [◀ March 2026 ▶]            │
│                                                             │
│  ┌────┬────┬────┬────┬────┬────┬────┐                      │
│  │Mon │Tue │Wed │Thu │Fri │Sat │Sun │                      │
│  ├────┼────┼────┼────┼────┼────┼────┤                      │
│  │ 1  │ 2  │ 3  │ 4  │ 5  │ 6  │ 7  │                      │
│  │    │ IG │    │LI  │    │FB  │    │                      │
│  ├────┼────┼────┼────┼────┼────┼────┤                      │
│  │ 8  │ 9  │ 10 │ 11 │ 12 │ 13 │ 14 │                      │
│  │ X  │    │ IG │    │    │    │LI  │                      │
│  └────┴────┴────┴────┴────┴────┴────┘                      │
│                                                             │
│  Upcoming Posts                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Mar 5, 9:00 AM  │ LinkedIn │ "Article post..." │ [×]│   │
│  │ Mar 6, 2:00 PM  │ Facebook │ "FB post..."    │ [×]│   │
│  │ Mar 10, 11:00 AM│ Instagram│ "Caption..."    │ [×]│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Month calendar view
- Platform icons on scheduled days
- Click day → Show posts for that day
- Drag to reschedule (stretch goal)
- Delete (×) to unschedule

**Schedule Modal:**
When scheduling content:
- Date picker
- Time picker
- Platform selector
- Preview of content
- [Schedule Post] button

---

#### `/dashboard/settings` — Settings

**Purpose:** Account and API management

**Sections:**

**1. Profile**
- Email (read-only)
- Change password
- Delete account

**2. API Keys** (for self-hosted n8n)
- OpenAI API Key
- Claude API Key
- n8n Webhook URL

**3. Notifications**
- Email notifications toggle
- Slack webhook (stretch)

---

## 5. API ENDPOINTS

### Authentication Middleware

All API routes (except landing) require authentication.

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request: Request) {
  const supabase = createServerClient(...)
  const session = await supabase.auth.getSession()
  
  if (!session.data.session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}
```

### Workspaces API

#### `GET /api/workspaces`

List all workspaces for current user.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Scentified",
      "niche": "Luxury perfume",
      "brand_colors": ["#1a1a2e", "#e94560"],
      "content_count": 12
    }
  ]
}
```

#### `POST /api/workspaces`

Create new workspace.

**Request:**
```json
{
  "name": "Scentified",
  "niche": "Luxury perfume subscription",
  "website_url": "https://scentified.com",
  "social_handles": {
    "instagram": "@scentified"
  },
  "brand_colors": ["#1a1a2e", "#e94560"],
  "brand_voice": "Sophisticated, sensual, confident",
  "ai_provider": "claude"
}
```

**Response:** `201 Created` with workspace object

#### `GET /api/workspaces/:id`

Get single workspace details.

#### `PUT /api/workspaces/:id`

Update workspace.

#### `DELETE /api/workspaces/:id`

Delete workspace (cascades to content).

---

### Content API

#### `POST /api/content/input`

Submit content for processing.

**Request:**
```json
{
  "workspace_id": "uuid",
  "input_type": "url",
  "source_url": "https://example.com/blog/post",
  "platforms": ["instagram", "facebook", "linkedin", "twitter"]
}
```

**Response:**
```json
{
  "run_id": "uuid",
  "status": "processing",
  "estimated_time": 30
}
```

**Side Effect:** Triggers n8n webhook

#### `GET /api/content/:workspace_id`

List content inputs for workspace.

**Query Params:**
- `type` (optional): Filter by input type
- `limit` (optional): Default 20

---

### Generation API

#### `POST /api/generate/content`

Trigger AI content generation via n8n.

**Request:**
```json
{
  "input_id": "uuid",
  "workspace_id": "uuid",
  "platforms": ["instagram", "facebook"]
}
```

**Response:**
```json
{
  "run_id": "uuid",
  "status": "queued"
}
```

#### `GET /api/generate/status/:run_id`

Poll generation status.

**Response:**
```json
{
  "run_id": "uuid",
  "status": "complete",
  "generated_count": 12
}
```

---

### Approval API

#### `GET /api/approval/:workspace_id`

Get pending content for approval.

**Query Params:**
- `status`: 'draft' | 'approved' | 'all'

#### `POST /api/approval/:id/approve`

Approve content.

**Request:**
```json
{
  "status": "approved"
}
```

#### `POST /api/approval/:id/reject`

Reject content.

#### `POST /api/approval/:id/regen`

Regenerate content (triggers n8n).

---

### Scheduling API

#### `GET /api/schedule/:workspace_id`

Get scheduled posts.

**Query Params:**
- `start`: ISO date
- `end`: ISO date

#### `POST /api/schedule`

Schedule a post.

**Request:**
```json
{
  "content_id": "uuid",
  "platform": "instagram",
  "scheduled_at": "2026-05-15T09:00:00Z"
}
```

#### `PUT /api/schedule/:id`

Reschedule post.

#### `DELETE /api/schedule/:id`

Unschedule post.

---

## 6. N8N WORKFLOWS

### Workflow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    N8N WORKFLOW FLOW                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Next.js Webhook                                            │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────┐                                       │
│  │  Webhook Node   │ ← POST /webhook/*                     │
│  └────────┬────────┘                                       │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                       │
│  │  Supabase Node  │ ← Fetch workspace + content           │
│  └────────┬────────┘                                       │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                       │
│  │  HTTP Request   │ → Claude/OpenAI API                   │
│  └────────┬────────┘                                       │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                       │
│  │  Split In Batches│ ← For each platform                  │
│  └────────┬────────┘                                       │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                       │
│  │  AI Prompt      │ ← Platform-specific generation        │
│  └────────┬────────┘                                       │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                       │
│  │  Supabase Node  │ ← Save generated_content              │
│  └─────────────────┘                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.1 URL Content Scraper

**Webhook:** `POST /webhook/scrape-url`

**Workflow JSON:**
```json
{
  "name": "URL Content Scraper",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "httpMethod": "POST",
        "path": "scrape-url"
      }
    },
    {
      "name": "HTTP Request",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "requestMethod": "GET",
        "url": "={{ $json.body.source_url }}",
        "options": {
          "response": {
            "response": {
              "responseFormat": "text"
            }
          }
        }
      }
    },
    {
      "name": "HTML Extract",
      "type": "n8n-nodes-base.html",
      "parameters": {
        "operation": "extract",
        "sourceData": "={{ $json.data }}",
        "extractors": [
          {
            "property": "title",
            "selector": "h1",
            "return": "text"
          },
          {
            "property": "content",
            "selector": "article",
            "return": "text"
          }
        ]
      }
    },
    {
      "name": "Supabase",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "insert",
        "table": "content_inputs",
        "columns": "workspace_id,input_type,raw_content,extracted_metadata,source_url",
        "values": "={{ [{ workspace_id: $json.body.workspace_id, input_type: 'url', raw_content: $json.content, extracted_metadata: { title: $json.title }, source_url: $json.body.source_url }] }}"
      }
    }
  ]
}
```

### 6.2 AI Content Generator

**Webhook:** `POST /webhook/generate-content`

**Prompt Chain:**

**Prompt 1: Analyze Source**
```
Analyze the following content and extract:
1. Main topic
2. Key points (3-5)
3. Target audience
4. Emotional hooks
5. Call-to-action opportunities

Content:
{{raw_content}}

Return as JSON.
```

**Prompt 2: Identify Viral Angles**
```
Based on the analysis, identify 3 viral angles:
1. Controversial take
2. Behind-the-scenes
3. Educational insight

Return as JSON array.
```

**Prompt 3: Generate Per Platform**

For Instagram:
```
Generate 3 Instagram captions based on:
- Topic: {{topic}}
- Angles: {{angles}}
- Brand voice: {{brand_voice}}
- Forbidden words: {{forbidden_words}}

Each caption should:
- Start with a hook
- Be 100-200 words
- Include 3-5 relevant hashtags
- End with a CTA

Return as JSON array.
```

For LinkedIn:
```
Generate 2 LinkedIn posts based on:
- Topic: {{topic}}
- Angles: {{angles}}
- Brand voice: {{brand_voice}}

Each post should:
- Start with a professional hook
- Be 150-300 words
- Include industry insights
- End with a thought-provoking question

Return as JSON array.
```

For Twitter:
```
Generate 2 Twitter threads (3-5 tweets each) based on:
- Topic: {{topic}}
- Angles: {{angles}}
- Brand voice: {{brand_voice}}

Each thread should:
- Tweet 1: Strong hook
- Tweets 2-4: Value/content
- Final tweet: CTA or question

Return as JSON array of arrays.
```

### 6.3 Image Generator (v1.1)

**Webhook:** `POST /webhook/generate-image`

**Workflow:**
1. Get content + brand colors from Supabase
2. Call Bannerbear API with template
3. Save returned image URL to `visual_assets`

### 6.4 Social Media Poster (v1.1)

**Webhook:** `POST /webhook/post-to-platform`

**Trigger:** Scheduled time (cron) or manual

**Workflow:**
1. Get scheduled post from Supabase
2. Get social account tokens
3. Post to platform API
4. Update status to 'published' or 'failed'

---

## 7. COMPONENT LIBRARY

### UI Components (Custom + Lucide)

```
components/
├── ui/
│   ├── button.tsx
│   ├── input.tsx
│   ├── textarea.tsx
│   ├── select.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   ├── avatar.tsx
│   ├── dialog.tsx
│   ├── toast.tsx
│   ├── skeleton.tsx
│   └── dropdown-menu.tsx
│
├── workspace/
│   ├── workspace-card.tsx
│   ├── workspace-form.tsx
│   ├── workspace-list.tsx
│   └── brand-color-picker.tsx
│
├── content/
│   ├── content-input.tsx
│   ├── input-type-tabs.tsx
│   ├── platform-selector.tsx
│   └── generation-status.tsx
│
├── approval/
│   ├── approval-board.tsx
│   ├── content-card.tsx
│   ├── content-editor.tsx
│   └── bulk-actions.tsx
│
└── schedule/
    ├── calendar-view.tsx
    ├── schedule-modal.tsx
    ├── post-list.tsx
    └── day-cell.tsx
```

### Component Specifications

#### Button
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  children: React.ReactNode
}
```

#### Content Card
```typescript
interface ContentCardProps {
  id: string
  platform: Platform
  content: string
  status: 'draft' | 'approved' | 'rejected'
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onEdit: (id: string, content: string) => void
  onRegenerate: (id: string) => void
}
```

---

## 8. AI PROMPT SYSTEM

### System Prompts

#### Brand Voice System Prompt
```
You are a content creator writing for a brand with the following characteristics:
- Brand Voice: {{brand_voice}}
- Target Audience: {{target_audience}}
- CTA Style: {{cta_style}}

Forbidden words/phrases: {{forbidden_words}}
Content Pillars: {{content_pillars}}

Always write in the brand voice and avoid forbidden words.
```

### Platform-Specific Prompts

#### Instagram Caption Prompt
```
Generate 3 Instagram captions for a {{niche}} brand.

Source Content:
{{source_content}}

Viral Angles:
{{viral_angles}}

Requirements:
- Start with an attention-grabbing hook (question, bold statement, or curiosity)
- 100-200 words per caption
- Include 3-5 relevant hashtags at the end
- End with a clear CTA
- Match brand voice: {{brand_voice}}
- Use emojis sparingly (1-3 per caption)

Return format:
[
  {
    "hook": "...",
    "body": "...",
    "hashtags": ["#tag1", "#tag2"],
    "cta": "..."
  }
]
```

#### LinkedIn Post Prompt
```
Generate 2 LinkedIn posts for a B2B audience.

Source Content:
{{source_content}}

Requirements:
- Start with a professional hook (industry insight, data point, or contrarian view)
- 150-300 words per post
- Include actionable insights or thought leadership
- End with a thought-provoking question to drive engagement
- Professional tone matching: {{brand_voice}}
- No hashtags (LinkedIn best practice)

Return format:
[
  {
    "hook": "...",
    "body": "...",
    "engagement_question": "..."
  }
]
```

#### Twitter Thread Prompt
```
Generate 2 Twitter threads (4-5 tweets each).

Source Content:
{{source_content}}

Requirements:
- Tweet 1: Strong hook that makes people want to read more
- Tweets 2-4: Deliver value, insights, or storytelling
- Final tweet: CTA, question, or summary
- Each tweet under 280 characters
- Conversational tone matching: {{brand_voice}}

Return format:
[
  ["Tweet 1...", "Tweet 2...", "Tweet 3...", "Tweet 4..."]
]
```

---

## 9. SECURITY & RLS

### Row Level Security Policies

All tables have RLS enabled. Policies follow this pattern:

```sql
-- Select policy (read own data)
CREATE POLICY "Users can view own data"
  ON table_name FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id AND w.user_id = auth.uid()
    )
  );

-- Insert policy (create in own workspaces)
CREATE POLICY "Users can insert in own workspaces"
  ON table_name FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id AND w.user_id = auth.uid()
    )
  );

-- Update policy (modify own data)
CREATE POLICY "Users can update own data"
  ON table_name FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id AND w.user_id = auth.uid()
    )
  );

-- Delete policy (delete own data)
CREATE POLICY "Users can delete own data"
  ON table_name FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id AND w.user_id = auth.uid()
    )
  );
```

### Token Encryption

Social account tokens must be encrypted:

```typescript
// lib/encryption.ts
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return JSON.stringify({
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: authTag.toString('hex')
  })
}

export function decrypt(encryptedJson: string): string {
  const { iv, encryptedData, authTag } = JSON.parse(encryptedJson)
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'hex')
  )
  decipher.setAuthTag(Buffer.from(authTag, 'hex'))
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
```

### API Security

- All API routes require valid Supabase session
- Rate limiting on webhook endpoints
- Input validation with Zod schemas
- CORS configured for production domain

---

## 10. IMPLEMENTATION PHASES

### Phase 0: Setup (Day 1)

**Infrastructure**
- [ ] Create Supabase project
- [ ] Run SQL migrations
- [ ] Configure auth providers (Google, GitHub)
- [ ] Set up n8n on VPS (Docker)
- [ ] Create GitHub repository

**Environment**
- [ ] Create `.env.local` with all variables
- [ ] Configure Vercel project
- [ ] Set up encryption key for tokens

**Deliverable:** Empty app with auth working

---

### Phase 1: Frontend Core (Week 1)

**Day 1-2: Foundation**
- [ ] Initialize Next.js 14 project
- [ ] Configure TailwindCSS
- [ ] Set up Supabase client
- [ ] Create auth pages (login, signup)
- [ ] Implement middleware protection

**Day 3-4: Dashboard**
- [ ] Build dashboard layout with sidebar
- [ ] Create overview page with stats
- [ ] Build workspace list page
- [ ] Create workspace card component

**Day 5-7: Workspace CRUD**
- [ ] Build workspace create form
- [ ] Build workspace edit form
- [ ] Implement brand color picker
- [ ] Add tag inputs for forbidden words/pillars
- [ ] Delete with confirmation

**Deliverable:** Can create and manage workspaces

---

### Phase 2: Content Generation (Week 2)

**Day 1-2: Content Input**
- [ ] Build content input page
- [ ] Create input type tabs (Text/URL/YouTube/PDF)
- [ ] Implement platform selector
- [ ] Build form validation

**Day 3-4: n8n Integration**
- [ ] Import URL scraper workflow
- [ ] Import AI content generator workflow
- [ ] Connect API routes to n8n webhooks
- [ ] Implement polling for generation status

**Day 5-7: Testing**
- [ ] Test text input → generation
- [ ] Test URL input → scrape → generation
- [ ] Verify content saved to Supabase
- [ ] Error handling for failed generations

**Deliverable:** Can generate content from inputs

---

### Phase 3: Approval & Schedule (Week 3)

**Day 1-2: Approval Board**
- [ ] Build approval board page
- [ ] Create content card component
- [ ] Implement approve/reject actions
- [ ] Add status filters

**Day 3-4: Editing & Regenerating**
- [ ] Build inline content editor
- [ ] Implement regenerate action
- [ ] Add bulk actions

**Day 5-7: Scheduling**
- [ ] Build calendar view
- [ ] Create schedule modal
- [ ] Implement schedule/unschedule actions
- [ ] Build upcoming posts list

**Deliverable:** Can approve and schedule content

---

### Phase 4: Polish & Launch (Week 4)

**Day 1-2: UI Polish**
- [ ] Add loading states
- [ ] Add empty states
- [ ] Add error states
- [ ] Toast notifications

**Day 3-4: Mobile & Testing**
- [ ] Mobile responsive design
- [ ] Cross-browser testing
- [ ] End-to-end user flow testing

**Day 5-7: Deploy**
- [ ] Deploy to Vercel
- [ ] Configure custom domain
- [ ] Set up monitoring
- [ ] Create user documentation

**Deliverable:** Production-ready MVP

---

## 11. TESTING STRATEGY

### Unit Tests

**Components:**
```typescript
// __tests__/workspace-form.test.tsx
describe('WorkspaceForm', () => {
  it('validates required fields', async () => {
    // Test empty form submission
  })
  
  it('submits valid data', async () => {
    // Test successful submission
  })
})
```

**API Routes:**
```typescript
// __tests__/api-workspaces.test.ts
describe('GET /api/workspaces', () => {
  it('returns workspaces for authenticated user', async () => {
    // Test with valid session
  })
  
  it('returns 401 for unauthenticated request', async () => {
    // Test without session
  })
})
```

### Integration Tests

**Flows:**
1. Sign up → Create workspace → Generate content → Approve → Schedule
2. URL input → Scrape → Generate → Approve → Schedule

### E2E Tests (Playwright)

```typescript
// e2e/content-flow.spec.ts
test('full content generation flow', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name=email]', 'test@example.com')
  await page.fill('[name=password]', 'password123')
  await page.click('button[type=submit]')
  
  await page.goto('/dashboard/content')
  await page.selectOption('[name=workspace]', workspaceId)
  await page.fill('textarea', 'Blog post about AI content')
  await page.click('button:has-text("Generate")')
  
  // Wait for generation to complete
  await page.waitForSelector('[data-testid=content-card]')
})
```

---

## 12. DEPLOYMENT GUIDE

### Pre-Deploy Checklist

**Supabase:**
- [ ] Project created
- [ ] All migrations run
- [ ] RLS policies enabled
- [ ] Auth providers configured
- [ ] Storage buckets created

**n8n:**
- [ ] VPS provisioned (DigitalOcean, Linode, etc.)
- [ ] Docker installed
- [ ] n8n container running
- [ ] Workflows imported
- [ ] Webhook URLs noted

**Vercel:**
- [ ] Project connected to GitHub
- [ ] Environment variables set
- [ ] Production domain configured
- [ ] SSL certificate active

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Encryption
ENCRYPTION_KEY=32-byte-hex-key-here

# AI (for n8n)
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=sk-ant-...

# n8n
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook
N8N_API_KEY=n8n_...

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Deployment Commands

```bash
# Frontend
cd frontend
npm run build
vercel deploy --prod

# n8n (Docker on VPS)
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=secure \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```

### Post-Deploy

**Monitoring:**
- [ ] Vercel Analytics enabled
- [ ] Supabase logs monitored
- [ ] n8n execution logs checked
- [ ] Error tracking set up (Sentry/LogRocket)

**Backups:**
- [ ] Supabase daily backups enabled
- [ ] n8n workflow exports saved
- [ ] Database backup strategy documented

---

## APPENDIX A: PROMPT TEMPLATES

### Full Prompt Library

All prompts are versioned and stored in `backend/app/services/prompts/`

---

## APPENDIX B: N8N WORKFLOW JSONS

Complete workflow exports in `n8n/workflows/`

---

## APPENDIX C: SUPABASE MIGRATION SQL

Full SQL in `supabase/migrations/001_initial_schema.sql`

---

*End of FEATURE_BLUEPRINT.md v2.0*
