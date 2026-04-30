# PRO DATA AI CONTENT OS

Turn one content input into many approved, branded, scheduled social media assets in minutes.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14 (App Router) + TailwindCSS |
| **Database/Auth/Storage** | Supabase (PostgreSQL) |
| **Automation Brain** | n8n (self-hosted) |
| **AI Text** | OpenAI API + Claude API |
| **Image/Video** | Bannerbear / Creatomate / Cloudinary |
| **Social Posting** | Meta / LinkedIn / X / TikTok APIs |

## Architecture

```
Frontend (Next.js on Vercel)
    │
    ├── Supabase (Auth + Database + Storage)
    │
    ├── n8n (Automation workflows)
    │       ├── URL scraping
    │       ├── AI content generation
    │       ├── Image generation
    │       └── Social posting
    │
    └── AI Engines (OpenAI / Claude)
```

## Quick Start

### 1. Clone & Install

```bash
cd frontend
npm install
```

### 2. Setup Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL migration from `supabase/migrations/`
3. Copy `.env.example` to `.env.local` and fill in your Supabase credentials

### 3. Setup Environment

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI (at least one required)
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=sk-ant-...

# n8n (optional - works in demo mode without)
N8N_WEBHOOK_URL=https://your-n8n.cloud/webhook
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- [ ] **Workspaces** — Create/manage client brand profiles
- [ ] **Content Input** — Text paste, URL scrape, YouTube transcript, PDF upload
- [ ] **AI Generation** — Multi-platform content via n8n + OpenAI/Claude
- [ ] **Approval Board** — Review/approve generated content
- [ ] **Scheduler** — Calendar-based scheduling
- [ ] **Automation Recipes** — n8n workflow triggers

## Supabase Schema

See `SPEC.md` for complete database schema and API documentation.

## Deploy to Vercel

```bash
npm run build
vercel deploy
```

## n8n Setup (Optional)

1. Deploy n8n on a VPS (Docker recommended)
2. Import workflows from `n8n/workflows/`
3. Configure API keys in n8n credentials
4. Add webhook URLs to your `.env.local`

## Cost Estimate (Monthly)

| Service | Free Tier | Paid |
|---------|-----------|------|
| Vercel | Hobby (3 projects) | $20/mo Pro |
| Supabase | 500MB DB, 1GB Storage | $25/mo (2GB) |
| n8n | Self-hosted (free) | Hosting costs |
| OpenAI | $5 credit | Pay-per-use |
| Claude | $5 credit | Pay-per-use |
| **Total** | ~$0-10/mo | ~$50-100/mo |

---

*Document Version: 2.0 — Fastest Stack Pivot (2026-04-30)*