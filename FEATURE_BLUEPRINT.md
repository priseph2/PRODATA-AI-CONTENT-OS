# PRO DATA AI CONTENT OS
## Full Feature Blueprint v1.0

**Last Updated:** 2026-04-30
**Status:** Pre-Development

---

## 1. VISION & CORE FLOW

### Product Promise
> Turn one content input into many approved, branded, scheduled social media assets in minutes.

### Core Flow
```
INPUT → SCRAPE → ANALYZE → GENERATE → APPROVE → SCHEDULE → PUBLISH
  │        │        │         │         │         │         │
  ▼        ▼        ▼         ▼         ▼         ▼         ▼
 Blog    n8n      AI API    n8n AI    Web UI    Web UI    n8n
 URL    workflow  prompts  workflows  buttons  calendar  posting
```

### Target Users
1. **Social Media Managers** managing multiple client accounts
2. **Content Agencies** generating bulk content fast
3. **Solo Entrepreneurs** maintaining their brand presence

---

## 2. TECH STACK

### Frontend (Next.js 14 + Vercel)
| Component | Choice |
|-----------|--------|
| Framework | Next.js 14 App Router |
| Styling | TailwindCSS + custom CSS variables |
| UI Components | Custom + Lucide icons |
| Auth | Supabase Auth |
| State | React hooks + Context |
| Forms | React Hook Form + Zod |
| HTTP | Native fetch (no axios) |

### Backend (n8n + Next.js API Routes)
| Component | Choice |
|-----------|--------|
| Automation | n8n (self-hosted) |
| API Routes | Next.js Route Handlers |
| Webhooks | n8n webhooks |

### Database (Supabase)
| Component | Choice |
|-----------|--------|
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (email + OAuth) |
| Storage | Supabase Storage (assets) |
| RLS | Row Level Security enabled |

### AI Engine
| Provider | Model | Use Case |
|----------|-------|----------|
| **Claude (default)** | claude-sonnet-4-7 | Brand voice, long-form |
| **OpenAI (alt)** | gpt-4o-mini | Fast generation, variety |

### Infrastructure
| Service | Cost | Purpose |
|---------|------|---------|
| Vercel | $0-20/mo | Frontend hosting |
| Supabase | $0-25/mo | Database + Auth |
| n8n (self-hosted) | ~$6/mo VPS | Automation |
| OpenAI/Claude | Pay-per-use | AI generation |

---

## 3. DATABASE SCHEMA (Supabase)

### Core Tables

#### `workspaces`
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES auth.users
name            VARCHAR NOT NULL
niche           VARCHAR
website_url     VARCHAR
social_handles  JSONB
brand_colors    JSONB
brand_voice     TEXT
cta_style       VARCHAR
target_audience TEXT
offer_products  TEXT
forbidden_words JSONB
content_pillars  JSONB
ai_provider     VARCHAR DEFAULT 'claude'
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```
**RLS:** Users own their workspaces

#### `content_inputs`
```sql
id                UUID PRIMARY KEY
workspace_id      UUID REFERENCES workspaces
input_type        VARCHAR ('text','url','youtube','pdf','doc')
raw_content       TEXT
extracted_metadata JSONB
source_url        VARCHAR
created_at        TIMESTAMPTZ
```
**RLS:** Via workspace ownership

#### `generated_content`
```sql
id              UUID PRIMARY KEY
workspace_id    UUID REFERENCES workspaces
input_id        UUID REFERENCES content_inputs
content_type    VARCHAR ('caption','hook','cta','thread','script')
platform        VARCHAR ('instagram','facebook','linkedin','twitter')
content_text    TEXT
status          VARCHAR ('draft','approved','rejected','published')
scheduled_at    TIMESTAMPTZ
created_at      TIMESTAMPTZ
```
**RLS:** Via workspace ownership

#### `scheduled_posts`
```sql
id              UUID PRIMARY KEY
content_id      UUID REFERENCES generated_content
workspace_id    UUID REFERENCES workspaces
platform        VARCHAR
scheduled_at    TIMESTAMPTZ NOT NULL
published_at    TIMESTAMPTZ
status          VARCHAR ('scheduled','published','failed')
```
**RLS:** Via workspace ownership

#### `social_accounts`
```sql
id              UUID PRIMARY KEY
workspace_id    UUID REFERENCES workspaces
platform        VARCHAR
access_token    TEXT (encrypted)
refresh_token   TEXT
expires_at      TIMESTAMPTZ
created_at      TIMESTAMPTZ
```
**RLS:** Via workspace ownership

#### `recipes`
```sql
id              UUID PRIMARY KEY
workspace_id    UUID REFERENCES workspaces
name            VARCHAR
trigger_type    VARCHAR
n8n_workflow_id VARCHAR
n8n_webhook_url TEXT
actions         JSONB
schedule        VARCHAR
is_active       BOOLEAN
created_at      TIMESTAMPTZ
```
**RLS:** Via workspace ownership

---

## 4. FRONTEND PAGES

### Public Pages

#### `/` — Landing Page
- Hero with product promise
- Tech stack badges
- Sign up / Sign in CTAs
- Gradient background (purple/slate)

#### `/login` — Sign In
- Email + password form
- "Forgot password" link
- OAuth options (Google, GitHub)
- Link to signup

#### `/signup` — Sign Up
- Email + password form
- Terms acceptance checkbox
- OAuth options
- Link to login

### Dashboard Pages

#### `/dashboard` — Overview
- Welcome message with user email
- Stats cards: Workspaces, Content, Pending, Scheduled
- Quick action buttons
- Recent activity list

#### `/dashboard/workspaces` — Workspace List
- Grid of workspace cards
- Search/filter bar
- "New Workspace" button
- Each card shows: name, niche, brand colors, content count
- Actions: Edit, Duplicate, Delete

#### `/dashboard/workspaces/new` — Create Workspace
- Multi-section form:
  - Basic: name, niche, website
  - Brand: voice, colors, CTA, audience, products
  - Social: handles for IG/FB/LI/X
  - AI: provider selector (Claude/OpenAI)
  - Forbidden words (tag input)
  - Content pillars (tag input)
- Save / Cancel buttons

#### `/dashboard/workspaces/[id]` — Edit Workspace
- Same form as new, pre-populated
- Delete workspace option (with confirmation)
- View generated content stats

#### `/dashboard/content` — Content Generation
- Workspace selector dropdown
- Input type tabs: Text | URL | YouTube | PDF
- Textarea or URL input based on type
- Platform checkboxes: IG, FB, LI, X
- "Generate Content" button
- Info box explaining n8n workflow

#### `/dashboard/approval` — Approval Board
- Workspace selector
- Filter tabs: All | Draft | Approved
- Content cards grid:
  - Platform icon + name
  - Content preview (truncated)
  - Status badge
  - Action buttons: Approve, Reject, Regenerate
- Approved content shows "Schedule" button

#### `/dashboard/schedule` — Calendar View
- Workspace selector
- Month calendar grid
- Scheduled posts shown on calendar days
- Day clicks show post list
- Upcoming posts list below
- Delete scheduled post option

#### `/dashboard/settings` — Settings (stretch goal)
- Profile settings
- API keys management
- Notification preferences

---

## 5. N8N WORKFLOWS

### 5.1 URL Content Scraper
**Webhook:** `POST /webhook/scrape-url`

```
Trigger (Webhook)
    │
    ▼
HTTP Request (fetch URL)
    │
    ▼
HTML Parse (extract text)
    │
    ▼
Save to Supabase (content_inputs)
    │
    ▼
Respond
```

**Use case:** When user pastes a URL, n8n fetches and saves content

### 5.2 YouTube Transcript Fetcher
**Webhook:** `POST /webhook/youtube-transcript`

```
Trigger (Webhook)
    │
    ▼
YouTube API (get transcript)
    │
    ▼
Format transcript
    │
    ▼
Save to Supabase (content_inputs)
    │
    ▼
Respond
```

### 5.3 AI Content Generator
**Webhook:** `POST /webhook/generate-content`

```
Trigger (Webhook)
    │
    ▼
Get Workspace (from Supabase)
    │
    ▼
Prompt 1: Analyze source
    │
    ▼
Prompt 2: Identify viral angles
    │
    ▼
For each platform (IG, FB, LI, X):
    │
    ├── Prompt 3: Generate content
    │
    ├── Prompt 4: Rewrite to brand voice
    │
    └── Save to Supabase (generated_content)
    │
    ▼
Respond
```

**Output per platform:**
- 3 Instagram captions
- 2 Facebook posts
- 2 LinkedIn posts
- 2 Twitter threads

### 5.4 Image Generator (v1.1)
**Webhook:** `POST /webhook/generate-image`

```
Trigger
    │
    ▼
Get content + brand colors
    │
    ▼
Call Bannerbear/Creatomate API
    │
    ▼
Save asset URL to Supabase (visual_assets)
    │
    ▼
Respond
```

### 5.5 Social Media Poster (v1.1)
**Webhook:** `POST /webhook/post-to-platform`

```
Trigger (scheduled time)
    │
    ▼
Get scheduled post + content
    │
    ▼
Get social account tokens
    │
    ▼
Post to platform API:
    ├── Meta Graph API (Instagram/Facebook)
    ├── LinkedIn API
    ├── X API v2
    └── TikTok API (third-party)
    │
    ▼
Update status (published/failed)
    │
    ▼
Respond
```

---

## 6. API ENDPOINTS (Next.js)

### Authentication
All endpoints require Supabase auth session.

### Workspaces
```
GET    /api/workspaces          → List user's workspaces
POST   /api/workspaces          → Create workspace
GET    /api/workspaces/:id      → Get single workspace
PUT    /api/workspaces/:id      → Update workspace
DELETE /api/workspaces/:id      → Delete workspace
```

### Content
```
POST   /api/content/input       → Submit content (triggers n8n)
GET    /api/content/:workspace  → List content for workspace
```

### Generation
```
POST   /api/generate/content    → Trigger content generation (n8n)
GET    /api/generate/status/:id  → Check generation status
```

### Approval
```
GET    /api/approval/:workspace  → Get pending content
POST   /api/approval/:id/approve → Approve content
POST   /api/approval/:id/reject  → Reject content
POST   /api/approval/:id/regen   → Regenerate content
```

### Scheduling
```
GET    /api/schedule/:workspace  → Get scheduled posts
POST   /api/schedule             → Schedule a post
PUT    /api/schedule/:id          → Update schedule
DELETE /api/schedule/:id          → Remove scheduled post
```

---

## 7. IMPLEMENTATION PHASES

### Phase 0: Setup (Day 1)
- [x] Git initialization
- [x] GitHub repo creation (pending)
- [x] Create SPEC.md
- [x] Create FEATURE_BLUEPRINT.md (this file)
- [ ] Create `.env.example` with all vars
- [ ] Create Supabase project
- [ ] Run SQL migration

### Phase 1: Frontend Core (Week 1)
- [ ] Setup Next.js project with proper config
- [ ] Implement landing page
- [ ] Implement auth (login/signup)
- [ ] Build dashboard layout + sidebar
- [ ] Build workspace list page
- [ ] Build workspace create/edit form

### Phase 2: Content Generation (Week 2)
- [ ] Content input page with type tabs
- [ ] Connect to API route
- [ ] Setup n8n instance
- [ ] Import URL scraper workflow
- [ ] Import AI content generator workflow
- [ ] Test full generation flow

### Phase 3: Approval & Schedule (Week 3)
- [ ] Approval board page
- [ ] Approve/reject actions
- [ ] Schedule page with calendar
- [ ] Schedule/unschedule actions
- [ ] Test integration with Supabase

### Phase 4: Social Posting (Week 4) — v1.1
- [ ] Social account connection UI
- [ ] Token storage (encrypted)
- [ ] Import poster workflow
- [ ] Test posting to each platform

### Phase 5: Polish & Launch
- [ ] Error handling UI
- [ ] Loading states
- [ ] Empty states
- [ ] Mobile responsiveness
- [ ] Deploy to Vercel
- [ ] Custom domain setup

---

## 8. MVP SUCCESS CRITERIA

### Must Have (MVP)
- [ ] Can sign up/login via Supabase
- [ ] Can create workspace with brand profile
- [ ] Can input content via text/URL
- [ ] AI generates 4-platform content (IG, FB, LI, X)
- [ ] Can approve/reject content cards
- [ ] Can schedule approved content
- [ ] Can switch between workspaces
- [ ] All data persists in Supabase
- [ ] RLS protects user data

### Nice to Have (v1.1)
- [ ] YouTube transcript input
- [ ] PDF upload
- [ ] Image generation
- [ ] Social posting (auto-publish)
- [ ] Recipe automation

---

## 9. COST BREAKDOWN

### MVP (Personal Use)
| Service | Tier | Cost |
|---------|------|------|
| Vercel | Hobby (free) | $0 |
| Supabase | Free tier | $0 |
| n8n | Self-hosted ($6 VPS) | $6/mo |
| AI | Pay-per-use | ~$10/mo |
| **Total** | | **$16/mo** |

### Agency (Multiple Clients)
| Service | Tier | Cost |
|---------|------|------|
| Vercel | Pro | $20/mo |
| Supabase | Pro | $25/mo |
| n8n | Self-hosted | $6/mo |
| AI | Pay-per-use | ~$50/mo |
| **Total** | | **$101/mo** |

---

## 10. FILE STRUCTURE

```
PRODATA-AI-CONTENT-OS/
├── .gitignore
├── README.md
├── SPEC.md
├── FEATURE_BLUEPRINT.md
├── .env.example
│
├── frontend/                    # Next.js 14 App
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx       # Sidebar + nav
│   │   │   ├── page.tsx         # Overview
│   │   │   ├── workspaces/
│   │   │   │   ├── page.tsx     # List
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── content/page.tsx
│   │   │   ├── approval/page.tsx
│   │   │   ├── schedule/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/
│   │   │   ├── workspaces/route.ts
│   │   │   ├── content/route.ts
│   │   │   ├── generate/route.ts
│   │   │   ├── approval/route.ts
│   │   │   └── schedule/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx             # Landing
│   ├── components/
│   │   ├── ui/                  # Reusable components
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
│   ├── types/
│   │   └── index.ts
│   ├── middleware.ts
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── next.config.js
│   └── .env.example
│
├── backend/                     # FastAPI (optional, local fallback)
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── routers/
│   │   └── services/
│   ├── requirements.txt
│   └── .env.example
│
├── n8n/                          # Automation workflows
│   └── workflows/
│       ├── scrape-url.json
│       ├── youtube-transcript.json
│       ├── ai-content-gen.json
│       ├── image-gen.json
│       └── post-to-social.json
│
└── supabase/                     # Database
    └── migrations/
        └── 001_initial_schema.sql
```

---

## 11. TEAM WORKFLOW

### Branch Strategy
```
main              → Production-ready
├── develop        → Integration branch
│   ├── feat/auth
│   ├── feat/workspaces
│   ├── feat/content-gen
│   ├── feat/approval
│   └── feat/scheduling
└── hotfix/        → Emergency fixes
```

### Commit Convention
```
feat: add new feature
fix: bug fix
docs: documentation
refactor: code restructure
test: testing
chore: maintenance
```

### PR Process
1. Create feature branch from develop
2. Make changes + commit
3. Push + create PR to develop
4. Review + merge
5. Weekly: merge develop → main

---

## 12. DEPLOYMENT CHECKLIST

### Pre-Deploy
- [ ] All env vars set in Vercel
- [ ] Supabase project configured
- [ ] RLS policies tested
- [ ] n8n instance running
- [ ] AI API keys configured in n8n

### Post-Deploy
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Test full user flow
- [ ] Monitor error logs
- [ ] Setup uptime monitoring

---

*End of FEATURE_BLUEPRINT.md*