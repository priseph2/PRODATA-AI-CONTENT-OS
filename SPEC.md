# PRO DATA AI CONTENT OS — MVP Specification

## Product Promise

Turn one content input into many approved, branded, scheduled social media assets in minutes.

**Input → Generate → Approve → Publish**

---

## Tech Stack (Fastest / Lowest Cost MVP)

| Layer | Choice | Why |
|-------|--------|-----|
| **Frontend** | Next.js (Vercel) | Modern SaaS feel, cheap deploy, API-ready |
| **Database/Auth/Storage** | Supabase | PostgreSQL + Auth + File Storage in one |
| **Automation Brain** | n8n (self-hosted) | Handles scraping, workflows, posting |
| **AI Text** | OpenAI API + Claude (alternative) | Best content generation |
| **Image/Video** | Bannerbear / Creatomate / Cloudinary | Template-based generation |
| **Social Posting** | Meta / LinkedIn / X / TikTok APIs | Official API + n8n bridges |

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                    Next.js (Vercel)                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
     ┌─────────┐    ┌───────────┐    ┌─────────┐
     │ Supabase│    │    n8n    │    │   AI    │
     │ DB/Auth │    │ Automation│    │ Engines │
     │ Storage │    │   Brain   │    │         │
     └────┬────┘    └─────┬─────┘    └────┬────┘
          │              │               │
          ▼              ▼               ▼
     Workspaces     Scraping        Text Generation
     Content       Workflows       Image Generation
     Schedules     Posting APIs    Content Generation
```

### Infrastructure Cost Estimate (Monthly)
- **Vercel**: Free (hobby) → $20/month (pro) — frontend
- **Supabase**: Free (500MB) → $25/month (2GB) — database
- **n8n**: Free (self-hosted on $6 droplet)
- **AI APIs**: Pay-per-use (~$10-50/month for MVP)
- **Total MVP**: ~$6-50/month depending on scale

---

## Module A — Client Workspace Manager

### Workspace Schema (Supabase Table)
```json
{
  "id": "uuid",
  "name": "Scentified",
  "niche": "Luxury perfume subscription",
  "website_url": "https://scentified.com",
  "social_handles": {
    "instagram": "@scentified",
    "facebook": "ScentifiedOfficial",
    "linkedin": "scentified",
    "twitter": "@scentified"
  },
  "brand_colors": ["#1a1a2e", "#e94560"],
  "brand_voice": "Sophisticated, sensual, confident",
  "cta_style": "Shop now / Subscribe / Discover",
  "target_audience": "Women 25-45 who value self-care",
  "offer_products": "Monthly perfume subscriptions",
  "forbidden_words": ["cheap", "affordable", "budget"],
  "content_pillars": ["Luxury lifestyle", "Fragrance education", "Self-care rituals", "Behind the scent"],
  "ai_provider": "openai",
  "user_id": "uuid (from Supabase Auth)"
}
```

### Features
- Create/Edit/Delete workspaces (RLS-protected per user)
- Duplicate workspace (for similar clients)
- Active/inactive toggle
- Connect social accounts (OAuth tokens stored securely)

---

## Module B — Content Input Center

### Input Types & Automation (via n8n)
| Type | Handler (n8n workflow) |
|------|------------------------|
| Text idea | Direct paste → save to Supabase |
| Blog URL | n8n scrapes → saves content |
| YouTube URL | n8n fetches transcript → saves |
| Product URL | n8n scrapes content → saves |
| PDF/DOC upload | Supabase Storage → n8n processes |

### Extracted Metadata
- Topic
- Keywords
- Angle
- Emotional hook
- CTA possibilities
- Content type classification

---

## Module C — AI Content Engine

### Prompt Chaining (OpenAI/Claude via n8n)

```
Input Source
    │
    ▼
[n8n Workflow] ──── Call OpenAI/Claude API
    │
    ▼
[Prompt 1] ──── Analyze & Extract Metadata
    │
    ▼
[Prompt 2] ──── Identify Viral Angles
    │
    ▼
[Prompt 3] ──── Generate Per Platform
    │
    ▼
[Prompt 4] ──── Rewrite to Brand Voice
    │
    ▼
Structured Batch → Save to Supabase
```

### Generated Content Types
| Type | Quantity |
|------|----------|
| IG captions | 5 |
| FB posts | 3 |
| LinkedIn posts | 2 |
| Twitter threads | 2 |
| CTA options | 10 |
| Hook bank | 15 |
| Story posts | 5 |
| Carousel slide copy | 8-10 slides |
| Reel/TikTok script | 1 |
| Ad copy options | 3 |

---

## Module D — AI Creative Engine

### Image Generation Stack
| Service | Use Case |
|---------|----------|
| **Bannerbear** | Template-based social graphics |
| **Creatomate** | Dynamic image/video generation |
| **Cloudinary** | Asset management + transformations |

### Generated Assets
- Static promo graphics (Bannerbear)
- Quote cards
- Educational carousels
- Video subtitle reels

---

## Module E — Content Approval Board

### Content Card Display
```
┌─────────────────────────────────┐
│ [Platform Icon] @handle         │
│                                 │
│ Caption preview text here...   │
│                                 │
│ Schedule: Mar 15, 9:00 AM      │
│                                 │
│ [✓ Approve] [✏ Edit] [↻ Regen] │
│ [→ Queue]                       │
└─────────────────────────────────┘
```

### Actions
- **Approve** → Move to publish queue
- **Edit** → Open inline editor
- **Regenerate** → Re-run n8n AI workflow
- **Delete** → Remove from board

---

## Module F — Publishing & Scheduler

### Schedule Interface
| Field | Type |
|-------|------|
| Date | Date picker |
| Time | Time picker |
| Platform | Multi-select (IG, FB, LI, X, TikTok) |
| Queue | Calendar view |

### Queue Management
- Drag to reschedule
- Bulk approve
- Conflict detection
- Timezone support

### Posting (via n8n)
```
Approved Content → n8n Workflow → Platform API
                              ├── Meta Graph API
                              ├── LinkedIn API
                              ├── X API
                              └── TikTok (third-party bridge)
```

---

## Module G — Automation Recipes (n8n Workflows)

### Recipe Schema
```json
{
  "id": "uuid",
  "name": "Blog → Weekly Campaign",
  "trigger": "blog_url_inserted",
  "n8n_workflow_id": "workflow-uuid",
  "actions": [
    "scrape_content",
    "run_content_engine",
    "generate_visual",
    "populate_approval_board"
  ],
  "schedule": "weekly",
  "is_active": true
}
```

### Pre-built n8n Workflows
1. **URL Scraper** — Fetches and parses web content
2. **YouTube Transcript** — Extracts transcript from videos
3. **AI Content Generator** — Calls OpenAI/Claude for content
4. **Image Generator** — Creates visuals via Bannerbear/Creatomate
5. **Multi-Platform Poster** — Posts to all major platforms

---

## Database Schema (Supabase)

### Tables
```sql
-- Users (handled by Supabase Auth)
-- workspaces table
workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR NOT NULL,
  niche VARCHAR,
  website_url VARCHAR,
  social_handles JSONB,
  brand_colors JSONB,
  brand_voice TEXT,
  cta_style VARCHAR,
  target_audience TEXT,
  offer_products TEXT,
  forbidden_words JSONB,
  content_pillars JSONB,
  ai_provider VARCHAR DEFAULT 'openai',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Content inputs
content_inputs (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  input_type VARCHAR,
  raw_content TEXT,
  extracted_metadata JSONB,
  source_url TEXT,
  created_at TIMESTAMPTZ
)

-- Generated content
generated_content (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  input_id UUID REFERENCES content_inputs(id),
  content_type VARCHAR,
  platform VARCHAR,
  content_text TEXT,
  status VARCHAR DEFAULT 'draft',
  created_at TIMESTAMPTZ
)

-- Visual assets (stored in Supabase Storage)
visual_assets (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  content_id UUID REFERENCES generated_content(id),
  asset_type VARCHAR,
  storage_url TEXT,
  template_style VARCHAR,
  created_at TIMESTAMPTZ
)

-- Scheduled posts
scheduled_posts (
  id UUID PRIMARY KEY,
  content_id UUID REFERENCES generated_content(id),
  platform VARCHAR,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status VARCHAR DEFAULT 'scheduled'
)

-- Social account tokens (encrypted)
social_accounts (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  platform VARCHAR,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)

-- Automation recipes
recipes (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  name VARCHAR,
  trigger_type VARCHAR,
  n8n_webhook_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ
)
```

---

## File Structure (Next.js Frontend)

```
/
├── frontend/                      # Next.js app (Vercel)
│   ├── app/
│   │   ├── (auth)/               # Auth pages (login/signup)
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/          # Protected dashboard
│   │   │   ├── workspaces/
│   │   │   ├── content/
│   │   │   ├── approval/
│   │   │   └── schedule/
│   │   ├── api/                  # API routes
│   │   │   ├── workspaces/
│   │   │   ├── content/
│   │   │   └── generate/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                   # Shadcn/ui components
│   │   ├── workspace/
│   │   ├── content/
│   │   ├── approval/
│   │   └── schedule/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   └── utils.ts
│   ├── hooks/
│   ├── types/
│   └── package.json
├── n8n/                           # n8n workflows (self-hosted)
│   ├── workflows/
│   │   ├── scrape-url.json
│   │   ├── youtube-transcript.json
│   │   ├── ai-content-gen.json
│   │   ├── image-gen.json
│   │   └── post-to-social.json
│   └── docker-compose.yml
├── supabase/
│   ├── migrations/
│   └── config.toml
├── SPEC.md
└── README.md
```

---

## API Endpoints (Next.js API Routes + n8n)

### Workspaces (Supabase direct)
- `GET /api/workspaces` — List user's workspaces
- `POST /api/workspaces` — Create workspace
- `GET /api/workspaces/:id` — Get workspace
- `PUT /api/workspaces/:id` — Update workspace
- `DELETE /api/workspaces/:id` — Delete workspace

### Content Input
- `POST /api/content/input` — Submit content source
- `GET /api/content/:workspace_id` — List content inputs

### AI Generation (via n8n webhook)
- `POST /api/generate/content` — Trigger n8n AI workflow
- `GET /api/generate/status/:run_id` — Check generation status

### Approval Board
- `GET /api/approval/:workspace_id` — Get pending content
- `POST /api/approval/:id/approve` — Approve
- `POST /api/approval/:id/reject` — Reject

### Scheduling
- `GET /api/schedule/:workspace_id` — Get calendar
- `POST /api/schedule` — Schedule post
- `PUT /api/schedule/:id` — Update schedule
- `DELETE /api/schedule/:id` — Remove

### n8n Webhook Endpoints
- `POST /webhook/scrape-url` — n8n URL scraper trigger
- `POST /webhook/generate-content` — n8n AI content generator
- `POST /webhook/generate-image` — n8n image generator
- `POST /webhook/post-to-platform` — n8n social poster

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI
OPENAI_API_KEY=your-key-here
CLAUDE_API_KEY=your-key-here
AI_PROVIDER=openai

# n8n
N8N_WEBHOOK_URL=https://your-n8n-instance/webhook
N8N_API_KEY=your-n8n-api-key

# Image Generation
BANNERBEAR_API_KEY=your-key
CREATOMATE_API_KEY=your-key
CLOUDINARY_URL=cloudinary://key:secret@cloud

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## MVP Scope — What We Build First

1. **Supabase setup** — Auth + Database + Storage
2. **Next.js frontend** — Workspace CRUD + dashboard
3. **Content input** — Text paste + URL submission
4. **n8n workflows** — URL scraper + AI content gen
5. **Approval board** — View/approve/reject content
6. **Scheduler** — Simple calendar view

**Deferred to v1.1:**
- YouTube transcription workflow
- Image generation workflows
- Social posting workflows (Meta/LinkedIn/X)
- Recipe automation builder

---

## Success Criteria

- [ ] Can sign up/login via Supabase Auth
- [ ] Can create workspace with brand profile
- [ ] Can input content via text/URL
- [ ] n8n + AI generates 4-platform content
- [ ] Can approve/reject content cards
- [ ] Can schedule approved content
- [ ] All data persists in Supabase
- [ ] RLS protects user data

---

## n8n Quick Start

1. Deploy n8n on a $6 VPS (Docker)
2. Import provided workflow JSON files
3. Configure webhook URLs in Next.js env
4. Connect AI API keys in n8n credential

---

*Document Version: 2.0 — Fastest Stack Pivot*
*Last Updated: 2026-04-30*