# Recruiting CRM

A full-stack relational recruiting CRM built during an MBA internship search.

The core insight: a job search is a web of relationships, not a list of applications. Existing tools are application-centric — no model for contacts, outreach history, or relationship networks. This is a CRM, not an ATS.

**Live:** https://recruiting-crm-zeta.vercel.app

---

## Stack

- **Frontend:** React + Vite (JSX)
- **Database:** Supabase (Postgres) with Row Level Security
- **Auth:** Supabase Auth (magic link) via Resend
- **Hosting:** Vercel (auto-deploys on push to `main`)

---

## Data Model

Five tables, fully relational:

- **companies** — target employers
- **jobs** — open roles, linked to companies
- **contacts** — people, linked to companies, typed as Target / Bridge / Resource
- **outreach** — real touchpoints only (calls, emails, messages), linked to contacts and jobs
- **action_items** — tasks linked to either an outreach event or a contact directly

Key design decisions:
- Contacts are a unified table (entities, not roles — a bridge contact today can be a hiring manager tomorrow)
- Outreach records represent real touchpoints only — no placeholder entries
- Action items attach to both outreach and contacts, capturing pre-outreach leads without phantom records
- Per-user data isolation enforced at the database level via RLS, not just the UI

---

## Roadmap

- ✅ Stage 1 — Data model design, interactive prototype (React artifact)
- ✅ Stage 2 — Local dev, GitHub, Supabase, Vercel
- ✅ Stage 3 — Magic link auth, per-user RLS, Resend email delivery
- ⬜ Stage 4 — AI layer: outreach draft generation and follow-up suggestions (Claude API)
- ⬜ Stage 5 — Gmail read integration (read-only, human-in-the-loop)

---

## Running Locally

```bash
npm install
npm run dev
```

Requires a `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
