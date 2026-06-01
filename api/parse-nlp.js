import Anthropic from "@anthropic-ai/sdk";

const VERTICALS = ["Sports", "Fitness", "Gaming", "Entertainment", "Tech", "Fintech", "Other"];
const STAGES = ["Pre-seed", "Seed", "Series A", "Series B", "Series C+", "Public", "N/A"];
const FUNCTIONS = ["Product Management", "GTM / Growth", "Strategy & Operations", "Consulting", "Business Development", "Other"];
const SOURCES = ["LinkedIn", "Referral", "Company Site", "Handshake", "Other"];
const JOB_STATUSES = ["Interested", "Applied", "Interviewing", "Offer", "Rejected", "Withdrew"];
const CHANNELS = ["Email", "LinkedIn", "In-Person", "Phone", "Text Message", "WhatsApp", "Slack"];
const OUTREACH_STATUSES = ["Sent", "Replied", "No Response", "Follow-up Needed"];
const CONTACT_TYPES = ["Target", "Bridge", "Resource"];
const HOW_KNOWN = ["Cold", "Acquaintance", "Warm", "Program / Institutional", "Personal"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, existingCompanies, existingContacts, existingJobs, currentDate } = req.body;

  if (!text?.trim()) {
    return res.status(400).json({ error: "No text provided" });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt = `You are a recruiting CRM assistant for a job seeker. Parse a natural language note and return structured JSON describing CRM records to create.

Today's date: ${currentDate}

## Data schema

### company
- name (string, required)
- vertical (one of: ${VERTICALS.join(", ")}) — infer from context, default "Other"
- stage (one of: ${STAGES.join(", ")}) — default "N/A"
- website (string, optional)
- notes (string, optional)

### job
- title (string, required)
- companyName (string, optional) — name of the company offering the role
- function (one of: ${FUNCTIONS.join(", ")}) — default "Other"
- source (one of: ${SOURCES.join(", ")}) — where you found it, default "Other"
- status (one of: ${JOB_STATUSES.join(", ")}) — default "Applied"
- jdLink (string, optional) — URL to the job description
- notes (string, optional)

### contact
- name (string, required)
- companyName (string, optional)
- title (string, optional)
- contactType (array, each one of: ${CONTACT_TYPES.join(", ")}) — "Target" = direct hiring contact, "Bridge" = can introduce you to others, "Resource" = gives advice. Default ["Target"]
- howKnown (one of: ${HOW_KNOWN.join(", ")}) — default "Cold"
- linkedin (string, optional)
- email (string, optional)
- notes (string, optional)

### outreach (a real interaction that already happened — call, meeting, message sent/received)
- contactName (string, required)
- channel (one of: ${CHANNELS.join(", ")})
- direction ("Sent" if you initiated, "Received" if they reached out)
- date (YYYY-MM-DD)
- summary (string — brief description of the interaction)
- status (one of: ${OUTREACH_STATUSES.join(", ")}) — if follow-up needed, use "Follow-up Needed"
- notes (string, optional)

### action_item (a task to do — future plans, not past events)
- description (string, required)
- priority ("H", "M", or "L") — default "M", use "H" if urgent or time-sensitive
- effort ("H", "M", or "L") — default "M"
- dueDate (YYYY-MM-DD, optional) — infer from "tomorrow", "next week", etc.
- linkedTo ("outreach" or "contact") — if the task follows from an interaction, use "outreach"; if it's pre-outreach (haven't talked yet), use "contact"
- linkedName (string — contact name, used to resolve the link)

## Existing data (match by name — do not duplicate)
Companies: ${JSON.stringify(existingCompanies)}
Contacts: ${JSON.stringify(existingContacts)}
Jobs: ${JSON.stringify(existingJobs)}

## Rules
1. Match existing companies/contacts by name (case-insensitive). If matched, set action="existing" and existingId to their id.
2. Only create records clearly implied by the note. Don't invent fields not mentioned.
3. outreach = something that ALREADY happened. A plan to reach out = action_item on the contact (linkedTo: "contact"), not an outreach record.
4. Order records: company → job → contact → outreach → action_item.
5. Return ONLY valid JSON, no markdown fences, no explanation outside the JSON object.

## Output format
{
  "interpretation": "1-2 sentence plain English summary of what you understood",
  "records": [
    {
      "type": "company" | "job" | "contact" | "outreach" | "action_item",
      "action": "create" | "existing",
      "existingId": null | "uuid-string",
      "data": { ...fields }
    }
  ]
}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: text }],
    });

    const raw = response.content[0].text.trim();
    const parsed = JSON.parse(raw);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error("parse-nlp error:", err);
    return res.status(500).json({ error: "Failed to parse input — please try again." });
  }
}
