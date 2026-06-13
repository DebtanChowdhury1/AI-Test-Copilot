# AI Test Copilot

A professional QA tool that generates structured test cases from user stories using AI (Gemini Flash + Groq Llama3 fallback).

## Features

- **AI Generation** — paste any user story, feature spec, or bug report to get 8–15 structured test cases in seconds
- **Dual AI** — Gemini 1.5 Flash (primary) with automatic Groq Llama3 fallback for 100% uptime
- **Full CRUD** — save, edit, duplicate, and delete test suites stored in MongoDB
- **Live editing** — update test case status and notes inline
- **Export** — one-click export to Excel (.xlsx), PDF, or Markdown clipboard copy
- **Auth** — Google, GitHub, and email sign-in via Clerk
- **Dark mode** — system preference aware

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router + TypeScript |
| Auth | Clerk v5 |
| Database | MongoDB Atlas + Mongoose |
| Primary AI | Google Gemini 1.5 Flash |
| Fallback AI | Groq Llama3-8b-8192 |
| Styling | Tailwind CSS v3 |
| Export | xlsx + jspdf + jspdf-autotable |

## Setup

### 1. Clone and install

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `MONGODB_URI` | [MongoDB Atlas](https://cloud.mongodb.com) → Connect → Drivers |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `GROQ_API_KEY` | [Groq Console](https://console.groq.com/keys) |

### 3. Clerk setup

In your Clerk dashboard:
- Enable **Google** and **GitHub** social providers
- Set Allowed redirect URLs to include `http://localhost:3000`

### 4. MongoDB Atlas setup

- Create a free M0 cluster
- Add your IP to the Network Access list (or allow `0.0.0.0/0` for development)
- Copy the connection string to `MONGODB_URI`

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  (auth)/sign-in/[[...sign-in]]/  ← Clerk catch-all
  (auth)/sign-up/[[...sign-up]]/
  (dashboard)/layout.tsx           ← sidebar + auth guard
  (dashboard)/dashboard/           ← stats + recent suites
  (dashboard)/generate/            ← generator form + results
  (dashboard)/suites/              ← all suites list
  (dashboard)/suites/[id]/         ← suite detail + edit
  (dashboard)/settings/
  api/generate/                    ← AI generation endpoint
  api/suites/                      ← CRUD endpoints
  api/suites/[id]/duplicate/

lib/
  mongodb.ts     ← connection pooling
  gemini.ts      ← Gemini Flash client
  groq.ts        ← Groq client
  ai-router.ts   ← fallback logic + JSON parsing
  utils.ts       ← cn() helper

models/
  TestSuite.ts   ← Mongoose schema

components/
  Sidebar.tsx
  GeneratorForm.tsx
  TestCaseTable.tsx
  ExportButtons.tsx
  PriorityBadge.tsx
  StatusBadge.tsx
```

## Deploying to Vercel

1. Push to GitHub
2. Import the repo in Vercel
3. Add all environment variables in Vercel Project Settings → Environment Variables
4. Deploy

## AI Model Details

- **Gemini 1.5 Flash** — free tier: 15 req/min, 1M tokens/day
- **Groq Llama3-8b-8192** — free tier: 14,400 req/day, 30 req/min
- Auto mode: tries Gemini first with a 10s timeout, falls back to Groq on error or timeout
