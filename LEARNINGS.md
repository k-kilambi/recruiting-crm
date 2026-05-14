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

---

## Portfolio Narrative

**The problem:** Existing tools like Simplify.Jobs are application-centric — no model for contacts, outreach history, or relationship networks. A job search is a web of relationships, not a list of applications.

**The insight:** A job search needs a CRM, not an ATS.

**What I built:** A full-stack relational recruiting CRM — designed the data model from first principles, built the UI as a React artifact, then graduated it to a production web app with Supabase (Postgres) and Vercel hosting.

**The stack:** React + Vite, Supabase (Postgres), Vercel, GitHub.

**The process:**
- Stage 1: Designed data model from scratch (entities vs. roles, relational linking, query-first design). Built interactive prototype as a React artifact. Validated through real use during MBA internship search.
- Stage 2: Local dev environment, GitHub, Supabase, Vercel. Data now persists across sessions.
- Stage 3 (in progress): AI layer — outreach draft generation and follow-up suggestions using Claude API.

**Key design decisions documented:**
- Unified Contact table (entities not roles)
- Outreach as real-event-only log (no phantom records)
- Action items on both Outreach and Contact records
- Progressive disclosure throughout
- Tab color coding for information architecture

**The meta-story:** I was the user. Every design decision was validated against real use during my MBA recruiting process. I caught data model errors in Stage 1 that would have been expensive in production. The build process — including this log — is itself a portfolio artifact demonstrating product thinking, technical execution, and learning velocity.

---

*Last updated: May 2026*
*Next update: After Stage 3 (AI layer) or significant feature additions*
