/*
# Create leads table for client/portfolio tracking

1. New Tables
- `leads`
  - `id` (uuid, primary key)
  - `company_name` (text, not null) — client or company name
  - `contact_person` (text) — contact person name
  - `phone` (text) — phone or WhatsApp number
  - `email` (text) — email address
  - `location` (text) — physical location
  - `interested_service` (text) — Solar, Electrical, Boreholes, Irrigation, etc.
  - `lead_source` (text) — where the lead came from
  - `status` (text, default 'new') — New / Contacted / Interested / Quoted / Won / Lost
  - `last_contact_date` (date) — last contact date
  - `follow_up_date` (date) — follow-up date
  - `notes` (text) — freeform notes
  - `marketing_consent` (boolean, default false) — marketing consent status
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Indexes
- `idx_leads_status` on `status` for filtering by pipeline stage
- `idx_leads_follow_up_date` on `follow_up_date` for follow-up reminders
- `idx_leads_created_at` on `created_at` for sorting

3. Security
- Enable RLS on `leads`.
- This is a single-tenant app with no sign-in screen, so all CRUD is allowed
  for both `anon` and `authenticated` roles (data is intentionally shared).

4. Notes
- No `user_id` column — the app has no authentication/sign-in.
- `status` is constrained to the six pipeline stages via CHECK.
- `updated_at` is auto-maintained by a trigger.
*/

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_person text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  location text DEFAULT '',
  interested_service text DEFAULT '',
  lead_source text DEFAULT '',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','interested','quoted','won','lost')),
  last_contact_date date,
  follow_up_date date,
  notes text DEFAULT '',
  marketing_consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up_date ON leads(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_leads" ON leads;
CREATE POLICY "anon_select_leads" ON leads FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_leads" ON leads;
CREATE POLICY "anon_insert_leads" ON leads FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_leads" ON leads;
CREATE POLICY "anon_update_leads" ON leads FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_leads" ON leads;
CREATE POLICY "anon_delete_leads" ON leads FOR DELETE
  TO anon, authenticated USING (true);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leads_updated_at ON leads;
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();