-- Migration: import old data from Old Data.md
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- It looks up your user ID by email, so no manual UUID lookup needed.

DO $$
DECLARE
  uid UUID;

  -- Company IDs
  company_tiktok  UUID;
  company_nba     UUID;
  company_wb      UUID;
  company_gsw     UUID;
  company_zoom    UUID;

  -- Contact IDs
  contact_bendes      UUID;
  contact_wan         UUID;
  contact_valdehueza  UUID;

  -- Job IDs (declared but only used for reference)
  job_tiktok_pm   UUID;
  job_zoom_intern UUID;

  -- Outreach ID
  outreach_bendes UUID;

BEGIN
  -- Resolve user
  SELECT id INTO uid FROM auth.users WHERE email = 'k.kilambi.ms@gmail.com';
  IF uid IS NULL THEN
    RAISE EXCEPTION 'User not found — check the email address in this script';
  END IF;

  -- Companies
  INSERT INTO companies (name, vertical, stage, website, notes, user_id)
    VALUES ('TikTok', 'Entertainment', '', '', '', uid)
    RETURNING id INTO company_tiktok;

  INSERT INTO companies (name, vertical, stage, website, notes, user_id)
    VALUES ('NBA', '', '', '', '', uid)
    RETURNING id INTO company_nba;

  INSERT INTO companies (name, vertical, stage, website, notes, user_id)
    VALUES ('Warner Bros (Games)', 'Gaming', '', '', '', uid)
    RETURNING id INTO company_wb;

  INSERT INTO companies (name, vertical, stage, website, notes, user_id)
    VALUES ('Golden State Warriors', 'Sports', '', '', '', uid)
    RETURNING id INTO company_gsw;

  INSERT INTO companies (name, vertical, stage, website, notes, user_id)
    VALUES ('Zoom', 'Tech', '', '', '', uid)
    RETURNING id INTO company_zoom;

  -- Contacts
  INSERT INTO contacts (name, company_id, title, linkedin, email, contact_type, how_known, connectable_to, notes, user_id)
    VALUES ('David Bendes', company_nba, '', '', '', ARRAY[]::text[], 'Warm', NULL, '', uid)
    RETURNING id INTO contact_bendes;

  INSERT INTO contacts (name, company_id, title, linkedin, email, contact_type, how_known, connectable_to, notes, user_id)
    VALUES ('Melody Wan', company_wb, '', 'https://www.linkedin.com/in/wanmelody/', '', ARRAY[]::text[], 'Warm', NULL, '', uid)
    RETURNING id INTO contact_wan;

  INSERT INTO contacts (name, company_id, title, linkedin, email, contact_type, how_known, connectable_to, notes, user_id)
    VALUES (
      'Maria Valdehueza', company_gsw, '', '', 'mvaldehueza@goldenstate.com',
      ARRAY[]::text[], 'Cold', NULL,
      'Chatted about ticketing platforms and data for understanding fans, i mentioned it was my area of expertise. I asked for a name and she gave me the head of data Charles Gao',
      uid
    )
    RETURNING id INTO contact_valdehueza;

  -- Jobs
  INSERT INTO jobs (title, company_id, function, source, status, date_added, jd_link, resume_link, cover_letter_link, notes, user_id)
    VALUES ('Product Manager', company_tiktok, 'Product Management', 'LinkedIn', 'Applied', '2026-05-12', '', '', '', '', uid)
    RETURNING id INTO job_tiktok_pm;

  INSERT INTO jobs (title, company_id, function, source, status, date_added, jd_link, resume_link, cover_letter_link, notes, user_id)
    VALUES (
      'Intern - AI Product Management, Agentic Workflows', company_zoom,
      'Product Management', 'LinkedIn', 'Interested', '2026-05-14',
      'https://www.linkedin.com/jobs/search/?currentJobId=4414293154&f_TPR=r43200&geoId=103644278&keywords=MBA%20Intern&origin=JOB_SEARCH_PAGE_SEARCH_BUTTON&refresh=true',
      '', '', '', uid
    )
    RETURNING id INTO job_zoom_intern;

  -- Outreach
  INSERT INTO outreach (contact_id, job_id, channel, direction, date, summary, status, draft_ready, notes, user_id)
    VALUES (contact_bendes, NULL, 'Email', 'Received', '2026-05-12', '', 'Follow-up Needed', false, '', uid)
    RETURNING id INTO outreach_bendes;

  -- Action items
  INSERT INTO action_items (outreach_id, contact_id, description, priority, effort, done, backlog, due_date, user_id)
    VALUES (NULL, contact_bendes,     'Review email',                   'H', 'L', false, false, NULL, uid);

  INSERT INTO action_items (outreach_id, contact_id, description, priority, effort, done, backlog, due_date, user_id)
    VALUES (NULL, contact_valdehueza, 'Confirm this is actually her name', 'H', 'L', false, false, NULL, uid);

  INSERT INTO action_items (outreach_id, contact_id, description, priority, effort, done, backlog, due_date, user_id)
    VALUES (NULL, contact_valdehueza, 'follow up on via email',          'H', 'M', false, false, NULL, uid);

  INSERT INTO action_items (outreach_id, contact_id, description, priority, effort, done, backlog, due_date, user_id)
    VALUES (NULL, contact_valdehueza, 'reach out to Charles Gao',        'H', 'M', false, false, NULL, uid);

END $$;
