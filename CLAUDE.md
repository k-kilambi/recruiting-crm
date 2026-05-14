# CLAUDE.md — Recruiting CRM

*Read this at the start of every session. Update when decisions change or new patterns are established.*

---

## What This Is

A full-stack relational recruiting CRM. Not an ATS — a CRM. The insight: a job search is a web of relationships, not a list of applications. Built by Kumar (MBA, UC Berkeley Haas) as both a daily-use tool during his internship search and a portfolio project demonstrating PM + technical thinking.

**Live:** https://recruiting-crm-zeta.vercel.app  
**GitHub:** https://github.com/k-kilambi/recruiting-crm  
**Local:** `C:\Users\kkila\Documents\recruiting-crm`

---

## Tech Stack

- **Frontend:** React + Vite (JSX), single file at `src/App.jsx`
- **Database:** Supabase (Postgres) with Row Level Security enabled
- **Auth:** Supabase Auth (magic link), email via Resend (SMTP configured in Supabase dashboard)
- **Hosting:** Vercel (auto-deploys on push to `main`)
- **Version control:** GitHub

**Deploy:**
```
git add .
git commit -m "description"
git push
```
Vercel redeploys in ~6 seconds.

**Env vars** (`.env` locally, Vercel project settings in prod):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## File Structure

```
src/
  App.jsx        ← entire application (~1350 lines, single file for now)
  supabase.js    ← Supabase client init
.env             ← gitignored, never push
```

Modularization is planned before Stage 3 (AI layer). When that happens, each tab component moves to its own file under `src/components/`.

---

## Data Model

Five tables in Supabase. Snake_case in DB, camelCase in JS — translated via `toSnake()` / `toCamel()` helpers. All tables have RLS enabled — users only see their own rows.

**companies** — `id, name, vertical, stage, website, notes, user_id`

**jobs** — `id, title, company_id, function, source, status, date_added, jd_link, resume_link, cover_letter_link, notes, user_id`

**contacts** — `id, name, company_id, title, linkedin, email, contact_type (text[]), how_known, connectable_to, notes, user_id`

**outreach** — `id, contact_id, job_id, channel, direction, date, summary, status, draft_ready, notes, user_id`

**action_items** — `id, outreach_id, contact_id, description, priority, effort, done, backlog, due_date, user_id`

**Key relationships:**
- Jobs → Companies (many-to-one)
- Contacts → Companies (many-to-one)
- Outreach → Contacts + Jobs (many-to-one each)
- Action Items → Outreach OR Contact (one or the other, not both)

**Critical data rules:**
- `contact_type` is `text[]` (Postgres array), not a string — filter with `.includes()`, not `===`
- UUID fields must send `null`, not `""`, or Supabase returns a 400
- Outreach records represent real touchpoints only — no phantom/placeholder entries
- Pre-outreach leads live as action items on the Contact record, not as outreach entries
- All inserts must include `user_id` — every tab receives `userId` as a prop from `session.user.id`
- camelCase mapping (contactId, jobId, draftReady) must be applied at ALL three points: initial load, after insert, after update. Missing any one creates silent display bugs on existing records.

---

## Constants (don't change without updating DB expectations)

```js
VERTICALS: ["Sports", "Fitness", "Gaming", "Entertainment", "Tech", "Fintech", "Other"]
STAGES: ["Pre-seed", "Seed", "Series A", "Series B", "Series C+", "Public", "N/A"]
FUNCTIONS: ["Product Management", "GTM / Growth", "Strategy & Operations", "Consulting", "Business Development", "Other"]
SOURCES: ["LinkedIn", "Referral", "Company Site", "Handshake", "Other"]
JOB_STATUSES: ["Interested", "Applied", "Interviewing", "Offer", "Rejected", "Withdrew"]
CONTACT_TYPES: ["Target", "Bridge", "Resource"]
HOW_KNOWN: ["Cold", "Acquaintance", "Warm", "Program / Institutional", "Personal"]
CHANNELS: ["Email", "LinkedIn", "In-Person", "Phone", "Text Message", "WhatsApp", "Slack"]
OUTREACH_STATUSES: ["Sent", "Replied", "No Response", "Follow-up Needed"]
```

---

## Key Helper Functions

**`toSnake(obj)`** — converts camelCase JS object to snake_case for Supabase inserts/updates. Coerces empty strings to null for UUID fields.

**`toCamel(obj)`** — converts snake_case Supabase response to camelCase for React state.

**`dbSave(table, record, setState)`** — upserts a record (insert if id starts with `"new_"`, update otherwise). Stamps `user_id` on inserts via `session` closure.

**`dbDelete(table, id, setState)`** — deletes a record and updates local state.

**`genId()`** — generates a temporary `"new_" + random` id for new records before they're saved.

**`showError(msg)`** — displays a red toast at the bottom of the screen, auto-dismisses after 4 seconds. Passed to all tabs as `onError` prop.

---

## Application Structure

**`LoginScreen`** — magic link auth UI. Email input → sends OTP via `supabase.auth.signInWithOtp` → confirmation state. Shown when no session exists.

**`Toast`** — fixed-position error notification, auto-dismisses after 4 seconds.

**`CompaniesTab`** — CRUD for companies

**`JobsTab`** — CRUD for jobs, filter bar by status, inline company creation with duplicate detection

**`ContactsTab`** — CRUD for contacts, multi-select contact types, inline company creation, contact-level action items

**`OutreachTab`** — CRUD for outreach (event log), inline contact creation (3 levels deep: outreach → contact → company), action items with progressive disclosure

**`DashboardTab`** — command center; sections: High Priority Actions, Other Open Actions, Contact Actions, Follow-ups Needed, Active Interviews, No Response, Backlog (collapsed). Smart suppression: Follow-up Needed rows hidden when open action items exist for that outreach. Click any item to open edit modal in-place.

---

## UI Conventions

- **Dark theme:** background `#060d18`, primary accent amber `#f59e0b`
- **Tab colors:** Dashboard = amber, Companies/Jobs/Contacts = blue, Outreach = purple. Muted when inactive, full when active.
- **Progressive disclosure:** action items hidden behind collapsible toggle in modals. Count badge in table rows when open items exist.
- **Inline creation:** Job → create Company mid-flow. Contact → create Company mid-flow. Outreach → create Contact mid-flow → create Company mid-flow (3 levels).
- **Click-away to close:** all modals close on backdrop click
- **Dashboard is primary:** everything clickable, opens edit modals without leaving the page
- **Fonts:** DM Sans (body), DM Mono (labels, code, header)

---

## Current Build State (Stage 3 complete)

All five entities fully functional with CRUD, Supabase persistence, and Vercel deployment. Dashboard operational with all sections. Magic link auth live. Per-user data isolation enforced via RLS. Email delivery via Resend on ggrecruit.com domain.

Version badge in header: `v0.2 — stage 2` (not yet updated)

---

## Roadmap

- ✅ **Stage 1** — Artifact prototype, data model validation
- ✅ **Stage 2** — Local dev, GitHub, Supabase, Vercel
- ✅ **Stage 3** — Auth (magic link), per-user RLS, Resend email delivery
- ⬜ **Pre-Stage 4** — Modularize App.jsx (split tabs into component files)
- ⬜ **Stage 4** — AI layer: "Draft Message" button on outreach (contact + job + company context → Claude API → draft), follow-up nudge suggestions on dashboard
- ⬜ **Stage 5** — Gmail read integration (read-only, human-in-the-loop)

---

## How Kumar Works

- **Direct and casual.** No em dashes, no overly polished language.
- **Explain, don't just fix.** When making a technical decision, briefly say why — he wants to understand, not just copy-paste.
- **Iterative.** Describe the change, confirm understanding, then implement. Don't rewrite large sections without talking through it first.
- **Accuracy over impressiveness.** If something is uncertain or has tradeoffs, say so.
- **Log decisions.** Anything that involves a real tradeoff gets noted in `LEARNINGS.md`. Say "want me to log that?" when something notable comes up.

---

*Last updated: May 2026*
