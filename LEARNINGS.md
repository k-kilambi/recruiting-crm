# Recruiting CRM — Learnings & Insights Log

*A running document capturing key concepts, decisions, and "aha moments" from building this project. Each insight is captured three ways: what triggered it, what the concept actually is, and how you explained it back in your own words — because that's the version you'll actually remember.*

---

## How to Use This Document

- **During a session:** Say "add that to the log" when something clicks
- **End of every session:** Say "do a log update" and Claude will review the conversation and capture new insights
- **For interviews/portfolio:** Use the "Your Words" sections — your own analogies will land better than textbook definitions

---

## Data Modeling Insights

---

### Insight 1: Model entities, not roles

**The trigger:** Deciding whether Target and Bridge contacts should live in separate tables or one unified table.

**The concept:** When designing a database, the fundamental question is "what IS this thing?" not "what role does it play?" If two things share the same fundamental nature, they belong in one table — differentiated by a type field, not split into separate tables. Roles change over time. Entities don't.

**Your words:** *"Hotels and houses — they both have bedrooms, square footage, bathrooms. They're the same entity, a place to live. I'd just give them a type attribute — one would be hotel, one would be residential. I wouldn't build two separate tables."*

**Why it matters:** A bridge contact today could be a hiring manager tomorrow. One person, one record, always.

---

### Insight 2: The entity consolidation decision rule

**The concept:** Four-part test for whether to merge two proposed tables into one:
- Same fundamental nature? → candidate for consolidation
- Shared attributes? → supporting evidence
- Would merging create a lot of empty/inapplicable fields? → keep them separate
- Can one become the other over time? → strong signal to consolidate

**Applied:** Jobs and Applications share attributes but failed the empty fields test — 40+ "interested but didn't apply" jobs would have empty application fields if merged. That emptiness was the signal to keep them separate.

---

### Insight 3: What a relational database actually is

**The concept:** A set of tables (like sheets) where each table stores one type of entity. Instead of copying data across tables, you store it once and reference it by ID everywhere else. The "link" is just one table storing another table's ID. The database follows that link when you query.

**Why it matters practically:**
- Change data in one place, it updates everywhere
- Ask cross-table questions ("show me everything related to Nuvo") without duplicating data
- Eliminates inconsistencies like "Nuvo" vs. "Nuvo Inc." across tables

---

### Insight 4: Design for how you'll query, not how you think today

**The concept:** Before finalizing a data model, write out the questions you'll want to ask the data. Then check if your model can answer them without painful workarounds. The structure should serve the queries, not the other way around.

**Applied:** The question "who could connect me to this person?" required contacts and their relationships to live in the same table to answer cleanly.

**The habit:** Before locking any data model, write 5-10 "what would I want to know?" questions and stress-test the model against them.

---

### Insight 5: Single-select vs. multi-select — strings vs. arrays

**The trigger:** Contact Type had a "Both" option that became ambiguous once we added a third type (Target, Bridge, Resource).

**The concept:** Single-select fields store one value as a string. Multi-select fields store multiple values as an array. The choice isn't just a UI decision — it changes the underlying data type and how you interact with it in code.

- **String:** `"Target"` — one value, simple to filter with `=== "Target"`
- **Array:** `["Target", "Bridge"]` — multiple values, filter with `.includes("Target")`

**Your words:** *"It'd be weird to have a 'both' option when there are three options — 'both' would only refer to two of them and it might not be clear which two."* — You identified the UX smell that revealed the data modeling problem underneath.

**The engineering signal:** When a single-select field starts requiring combo labels to cover real cases, switch to multi-select and store as an array.

---

### Insight 6: Good engineering principles are context-dependent heuristics, not universal laws

**The trigger:** Pushing back on "batch your changes" — pointing out that in an artifact with no build pipeline, there's no real cost to doing changes one at a time.

**The concept:** Many best practices exist to solve specific problems. When those problems don't exist in your context, the practice may not apply. Applying rules without understanding the underlying reason creates unnecessary friction.

**Why it matters for PM:** You'll constantly hear engineers cite best practices. A good PM understands *why* those practices exist so they can have an informed conversation about when they apply.

---

### Insight 7: The value of stored history is asymmetric across records

**The concept:** The same data field doesn't have uniform value across all records. For a cold contact with one unanswered message, outreach history is noise. For a warm contact with multiple calls and exchanges, that history *is* the relationship — it tells you the relationship is warm, that they're invested, that they deserve different treatment.

**Your words:** *"While a lot of what I'll track is a simple LinkedIn message to a cold contact, when it's anything more than that then I'll want to understand all the context of my interactions because it tells me something different about that relationship."*

**The product principle:** When deciding whether to store history vs. current state only, ask: does the depth of history change the meaning of the record? If yes — separate entity, track history.

---

### Insight 8: Progressive disclosure — hide complexity until it's needed

**The concept:** Show only what's needed for the common case by default. Reveal additional complexity only when the user explicitly asks for it. Make simple things fast and complex things possible — without making complex things feel like the norm.

**Three layers used in this app:**
- **Collapsed section** — action items live behind a collapsible toggle. Hidden by default, one click to reveal.
- **Count badge** — appears in table rows only when action items exist. Invisible when empty.
- **Dashboard surfacing** — action items only appear on the dashboard when they're open and incomplete.

**Your words:** *"I want a clean way to track those TODOs... I want to figure out a way for the UI to properly emphasise that this is possibly an edge case."* — You identified the problem before knowing the pattern name.

**The design principle:** Don't charge the common case for the cost of the edge case.

---

### Insight 9: Outreach records should only represent real touchpoints

**The trigger:** Trying to log a referral lead in Outreach and noticing that Direction felt wrong — nothing had actually been exchanged yet.

**The concept:** An outreach record represents an actual touchpoint — something that happened between you and another person. Using it to represent a lead you haven't acted on yet creates phantom records that pollute your history.

**The right model:** Pre-outreach state belongs on the Contact record. Action items attached directly to a Contact (not to an Outreach) represent leads that need action before any touchpoint has occurred.

**Your words:** *"I like that, but then it doesn't capture that there is an action needed to be taken by me... that leads me to option 1 but want to stress test this idea."* — You identified the gap and pushed back on the clean solution to make sure it actually solved your problem.

**The data integrity principle:** Every record in a table should represent something real that happened or exists. When you find yourself creating records as placeholders or reminders, that's the signal the action belongs somewhere else.

---

## Stage 2 Learnings — Local Dev, GitHub, Supabase, Vercel

---

### Insight 10: The local → GitHub → Vercel deployment pipeline

**The concept:** Code travels through three stops:
- **Local** — where you write and test. Vite HMR updates the browser instantly without a full refresh.
- **GitHub** — where code is stored and versioned. Every commit is a named snapshot you can roll back to.
- **Vercel** — where the live app runs. Watches GitHub; every push to `main` triggers an automatic redeploy in ~6 seconds.

**The three commands — Stage, Snapshot, Send:**
```
git add .          ← stage everything
git commit -m ""   ← snapshot with a label
git push           ← send to GitHub → triggers Vercel redeploy
```

---

### Insight 11: What React actually is (vs. JavaScript)

**The concept:** JavaScript is the language. React is a library — a collection of pre-written code that gives you tools for building UIs. Specifically: the component system, `useState` for managing data, and the rendering engine that updates the UI when data changes. JSX is React's syntax extension that lets you write HTML-like markup inside JavaScript — compiled to regular JS by Vite before the browser runs it.

---

### Insight 12: What npm, cd, and -m are

**npm:** Node's built-in package manager — installs and manages external code libraries your project depends on.

**cd:** "Change directory" — navigates your terminal to a different folder.

**-m flag on git commit:** Stands for "message" — lets you write the commit description inline. Without it, Git opens a text editor. `-m` is the shortcut.

---

### Insight 13: Environment variables — why they exist and how they work

**The concept:** Sensitive config values (API keys, database URLs) should never be hardcoded in source code — especially code on GitHub. Environment variables store these values outside the code, in `.env` locally and in platform settings for production.

**Why `.env` is in `.gitignore`:** If you push it to a public repo, your API keys are exposed.

**Vite's convention:** Variables must be prefixed with `VITE_` to be accessible in the browser. Read via `import.meta.env.VITE_SUPABASE_URL`.

**Common gotcha:** Local `.env` files don't automatically transfer to Vercel. You have to add the same variables manually in Vercel's project settings — forgetting this is why things work locally but fail in production.

---

### Insight 14: Relational databases — snake_case vs. camelCase

**The trigger:** Supabase integration kept failing with 400 errors because JavaScript uses camelCase but Postgres uses snake_case.

**The concept:** JavaScript convention is camelCase. SQL/Postgres convention is snake_case. You need a translation layer. We built `toSnake()` and `toCamel()` functions to handle this.

**The gotcha:** Empty strings (`""`) are not the same as `null` in Postgres. UUID fields with no value must send `null`, not `""`, or the database rejects with a 400 error.

**Debugging checklist:** (1) Are field names in the right case? (2) Are nullable UUID fields sending null instead of empty string?

---

### Insight 15: What a 400 vs. 404 vs. 406 HTTP error means

**404 Not Found:** The URL doesn't exist. In our case, the Supabase URL had `/rest/v1` appended to it, causing the client to build `/rest/v1/rest/v1/companies`.

**400 Bad Request:** The server understood the request but rejected it. Sending empty strings for UUID fields or wrong field names caused this.

**406 Not Acceptable:** The server can't respond in the format the client requested. A `.single()` query that expected one row but found none (or multiple) triggered this.

**The debugging habit:** Check the browser console Network tab — the response body usually says exactly what went wrong in plain English.

---

### Insight 16: Progressive disclosure is a design principle, not just a UI trick

**The concept:** Reveal complexity only when the user needs it. The common case should feel simple; the edge case should be possible but not prominent.

**Why it matters for PM:** You'll use this constantly when deciding what to show by default vs. hide behind a click. The question is always: "Am I charging the common case for the cost of the edge case?"

---

## Stage 3 Learnings — Auth, Data Isolation, Error Handling

---

### Insight 17: Snake_case/camelCase mapping must be applied at every data boundary

**The trigger:** A bug where adding a contact to an outreach entry appeared to not save — the contact column always showed "—" and the modal dropdown always showed blank, even when data existed in the database.

**The concept:** Any time data crosses a system boundary (database → JavaScript), a translation layer is needed. The issue was that `action_items` was being mapped correctly (camelCase aliases added on load) but `outreach` was loaded raw. Missing even one translation point creates bugs that only appear in specific UI states — data looks correct in the DB, correct for new records, but wrong for existing records.

**The bug signature:** Data is correct in Supabase, correct when you create a new record, but broken for records loaded from the database. The mismatch only shows up when reading existing state, not writing.

**The fix:** Apply the same camelCase mapping at every entry point — initial load, after insert, and after update. Missing any one of the three creates subtle, hard-to-spot bugs.

---

### Insight 18: Silent failures are a UX bug

**The concept:** When a database operation fails and only `console.error` is called, the user assumes their save worked. They're now operating on stale assumptions. User-visible error feedback is a correctness requirement, not a polish item.

**The pattern used:** A toast notification — fixed position at the bottom of the screen, auto-dismisses after 4 seconds, manual dismiss available. One shared error handler passed down to all tab components so the pattern is consistent.

**The design rule:** If a user action can fail, the user must be told it failed. Silent failures are worse than visible errors because they create false confidence.

---

### Insight 19: Row Level Security — database-enforced access control

**The concept:** RLS policies live in the database, not in your app code. Even if someone bypassed your frontend entirely and queried Supabase directly, they'd still only see their own rows. The policy `auth.uid() = user_id` automatically filters every query to the logged-in user's data.

**The critical gotcha — policies are OR'd together:** Supabase auto-creates permissive "allow all" policies when you enable RLS from the dashboard UI. These override your restrictive policies because multiple policies combine with OR logic. Always verify what policies exist — if there's a permissive one alongside your restrictive one, everyone can see everything.

**The debugging query:**
```sql
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
```
If you see two policies per table — one permissive, one restrictive — drop all of them and recreate only the restrictive ones.

---

### Insight 20: Auth method tradeoffs

**Magic link:** No password to manage, link is one-time and expires, natural fit for email-native users (like recruiting). Rate limited on free tiers (~3 emails/hour per project globally — not per address).

**Email + password:** Most familiar UX, Supabase handles forgot-password flows automatically. Requires users to manage credentials.

**Google OAuth:** Best UX (no new account), but requires registering an app in Google Cloud Console. More setup, more moving parts.

**Context matters:** For a recruiting CRM where users live in their inbox all day, magic link is the right fit — checking email isn't friction, it's the workflow.

---

### Insight 21: Email infrastructure — why production apps need a dedicated sender

**The problem with Supabase's built-in sender:** Rate-limited to ~3 emails per hour per project (not per recipient). Can land in spam. Not intended for production use.

**The solution — Resend (or similar):** A dedicated email delivery service. Free tier: 3,000 emails/month. Plugged into Supabase via SMTP settings — no code changes required, just config. Emails come from your own domain (`noreply@yourdomain.com`).

**The requirement:** You need a domain you control to verify with Resend. A Vercel subdomain (`*.vercel.app`) doesn't work because you don't control its DNS. A domain you own and manage is required.

**The flow:** Resend verifies domain ownership via DNS records → you paste SMTP credentials into Supabase → Supabase routes all auth emails through Resend.

---

### Insight 22: Vercel URL configuration gotchas

**Site URL vs. Redirect URLs:** Supabase's Site URL is where magic links redirect by default. If it's set to `localhost`, all magic links from the production app will redirect to localhost. The fix: set Site URL to your production URL, add `localhost:5173` to the Redirect URLs allowlist for local dev.

**Vercel URL collisions:** Vercel project URLs aren't guaranteed to be unique across users. `recruiting-crm.vercel.app` was someone else's app. Always check your actual deployment URL in the Vercel dashboard (`recruiting-crm-zeta.vercel.app` in this case).

**Env vars don't transfer automatically:** `VITE_*` variables in your local `.env` file must be manually added to Vercel → Project Settings → Environment Variables. Forgetting this is why things work locally but fail in production. (Already covered in Insight 13, but worth repeating — it bites everyone at least once.)

---

## Stage 4 Pre-Work Learnings — Data Migration, Theming

---

### Insight 23: Migrating relational data into Supabase via SQL

**The trigger:** Needed to import old CRM data (from the Stage 1 prototype) into Supabase. The data had its own short IDs and inter-table relationships — contacts referenced companies, outreach referenced contacts, etc.

**The concept:** Supabase uses UUIDs as primary keys (auto-generated). You can't just insert rows with the old short IDs — you need to insert parent records first, capture the new UUIDs, then use them when inserting child records. SQL's `DO $$` anonymous block with `DECLARING` variables and `RETURNING id INTO variable` handles this cleanly.

**The pattern:**
```sql
DO $$
DECLARE
  uid UUID;
  company_tiktok UUID;
  contact_bendes UUID;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'you@example.com';

  INSERT INTO companies (name, user_id)
    VALUES ('TikTok', uid)
    RETURNING id INTO company_tiktok;

  INSERT INTO contacts (name, company_id, user_id)
    VALUES ('David Bendes', company_tiktok, uid);
END $$;
```

Run this in Supabase SQL Editor — it runs as postgres superuser, bypasses RLS, no auth required.

**The UUID gotcha:** Any column that's a UUID type must receive `NULL`, not `''`, if it has no value. The app's `toSnake()` helper handles this automatically, but raw SQL doesn't — you'll get `invalid input syntax for type uuid: ""` if you pass an empty string. In this project: `connectable_to` on contacts is a UUID column that trips this.

---

## Project Decisions Log

| # | Decision | Rationale | Insight |
|---|---|---|---|
| 1 | Unified Contact table (not Target + Bridge separate) | Same entity, roles change over time, key queries require co-location | Insight 1 |
| 2 | Artifact-first, then Supabase | Validates data model through real use before locking in backend | — |
| 3 | Interviews as job status + outreach entry, not separate table | An interview is an event (Outreach) with a status change (Job). Separate table would duplicate data | — |
| 4 | Contact Type changed from single-select string to multi-select array | Adding Resource made "Both" ambiguous. Combo labels signal single-select has hit its limit | Insight 5 |
| 5 | Contact Types: Target / Bridge / Resource | "Resource" cleanly captures advisors, career services, mentors. "Both" was doing too much work | — |
| 6 | How Known options updated | Old options conflated relationship quality (Warm) with channel (Met in Person). New options are all about relationship nature | — |
| 7 | Action Items as separate entity linked to Outreach | One touchpoint can generate multiple distinct tasks. Fields on Outreach can only cleanly handle one | Insight 8 |
| 8 | Action Items support both outreachId and contactId | Pre-outreach leads belong on Contact, not as phantom outreach entries | Insight 9 |
| 9 | Magic link auth (vs. email+password vs. OAuth) | Email-native users, no password to manage, Supabase handles it natively | Insight 20 |
| 10 | Open signup with private URL (vs. invite-only) | Invite-only adds ongoing maintenance burden; private URL is effective gatekeeping with zero overhead | — |
| 11 | Resend for email delivery (vs. Supabase built-in) | Built-in is rate-limited and not production-grade; Resend free tier handles real usage | Insight 21 |
| 12 | RLS enforced at DB level with user_id on all tables | App-level auth alone is insufficient; DB-level isolation means bypassing the frontend still can't expose other users' data | Insight 19 |

---

## Portfolio Narrative

**The problem:** Existing tools like Simplify.Jobs are application-centric — no model for contacts, outreach history, or relationship networks. A job search is a web of relationships, not a list of applications.

**The insight:** A job search needs a CRM, not an ATS.

**What I built:** A full-stack relational recruiting CRM — designed the data model from first principles, built the UI as a React artifact, then graduated it to a production web app with Supabase (Postgres) and Vercel hosting.

**The stack:** React + Vite, Supabase (Postgres), Vercel, GitHub.

**The process:**
- Stage 1: Designed data model from scratch (entities vs. roles, relational linking, query-first design). Built interactive prototype as a React artifact. Validated through real use during MBA internship search.
- Stage 2: Local dev environment, GitHub, Supabase, Vercel. Data now persists across sessions.
- Stage 3: Multi-user auth with per-user data isolation. Magic link authentication via Supabase Auth, Row Level Security at the database level, Resend for production email delivery. Each user sees only their own data — enforced in the database, not just the UI.
- Stage 4 (planned): AI layer — outreach draft generation and follow-up suggestions using Claude API.

**Key design decisions documented:**
- Unified Contact table (entities not roles)
- Outreach as real-event-only log (no phantom records)
- Action items on both Outreach and Contact records
- Progressive disclosure throughout
- Tab color coding for information architecture

**The meta-story:** I was the user. Every design decision was validated against real use during my MBA recruiting process. I caught data model errors in Stage 1 that would have been expensive in production. The build process — including this log — is itself a portfolio artifact demonstrating product thinking, technical execution, and learning velocity.

---

*Last updated: May 2026*
*Next update: After Stage 4 (AI layer) or significant feature additions*
