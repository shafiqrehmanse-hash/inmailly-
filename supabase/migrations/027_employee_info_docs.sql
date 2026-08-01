-- Employee Info Doc: admin sends request → team member fills profile on dashboard

CREATE TABLE IF NOT EXISTS employee_info_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_no text NOT NULL,
  member_id uuid REFERENCES team_members(id) ON DELETE SET NULL,
  employee_name text NOT NULL,
  employee_email text NOT NULL,
  admin_note text,
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  stats_snapshot jsonb,
  status text NOT NULL DEFAULT 'pending_fill'
    CHECK (status IN ('pending_fill', 'submitted', 'reviewed')),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_info_docs_member ON employee_info_docs(member_id);
CREATE INDEX IF NOT EXISTS idx_employee_info_docs_email ON employee_info_docs(employee_email);
CREATE INDEX IF NOT EXISTS idx_employee_info_docs_status ON employee_info_docs(status);

-- Private bucket for ID photos and experience letters (signed URLs for admin)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-info-docs',
  'employee-info-docs',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;
