<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateStudentPortfolioDomain extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS public.portfolio_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL UNIQUE,
  description text, status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')), sort_order integer NOT NULL
);
CREATE TABLE IF NOT EXISTS public.portfolio_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), category_id uuid NOT NULL REFERENCES public.portfolio_categories(id) ON DELETE RESTRICT,
  code text NOT NULL, name text NOT NULL, description text, metadata_requirements jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')), sort_order integer NOT NULL,
  UNIQUE(category_id,code)
);
CREATE TABLE IF NOT EXISTS public.student_portfolio_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_profile_id uuid NOT NULL REFERENCES public.student_profiles(profile_id) ON DELETE RESTRICT,
  category_id uuid NOT NULL REFERENCES public.portfolio_categories(id) ON DELETE RESTRICT,
  subcategory_id uuid REFERENCES public.portfolio_subcategories(id) ON DELETE RESTRICT,
  title text NOT NULL, organizer_or_body text, occurrence_date date, start_date date, end_date date,
  description text, structured_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','revision_requested','verified','rejected','archived')),
  submitted_at timestamptz, verified_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date>=start_date)
);
CREATE INDEX IF NOT EXISTS idx_student_portfolio_owner_status ON public.student_portfolio_records(student_profile_id,status);
CREATE INDEX IF NOT EXISTS idx_student_portfolio_category_status ON public.student_portfolio_records(category_id,status);
CREATE INDEX IF NOT EXISTS idx_student_portfolio_metadata_gin ON public.student_portfolio_records USING gin(structured_metadata);
CREATE INDEX IF NOT EXISTS idx_student_portfolio_records_subcategory ON public.student_portfolio_records(subcategory_id);

CREATE TABLE IF NOT EXISTS public.student_portfolio_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), portfolio_record_id uuid NOT NULL REFERENCES public.student_portfolio_records(id) ON DELETE CASCADE,
  storage_path text NOT NULL, original_filename text NOT NULL, mime_type text NOT NULL, byte_size bigint NOT NULL CHECK (byte_size>0),
  checksum text, evidence_type text, uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  uploaded_at timestamptz NOT NULL DEFAULT now(), status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','superseded','removed'))
);
CREATE INDEX IF NOT EXISTS idx_student_portfolio_evidence_record ON public.student_portfolio_evidence(portfolio_record_id);
CREATE INDEX IF NOT EXISTS idx_student_portfolio_evidence_uploaded_by ON public.student_portfolio_evidence(uploaded_by);
CREATE TABLE IF NOT EXISTS public.student_portfolio_verification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), portfolio_record_id uuid NOT NULL REFERENCES public.student_portfolio_records(id) ON DELETE CASCADE,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN ('submitted','revision_requested','resubmitted','verified','rejected')),
  previous_status text, new_status text NOT NULL, remarks text, occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_portfolio_verification_record_time ON public.student_portfolio_verification_events(portfolio_record_id,occurred_at);
CREATE INDEX IF NOT EXISTS idx_student_portfolio_verification_actor ON public.student_portfolio_verification_events(actor_profile_id);

ALTER TABLE public.portfolio_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_portfolio_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_portfolio_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_portfolio_verification_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.portfolio_categories, public.portfolio_subcategories, public.student_portfolio_records,
  public.student_portfolio_evidence, public.student_portfolio_verification_events FROM PUBLIC, anon, authenticated;
SQL);
    }

    public function down()
    {
        // Portfolio records and evidence references are retained to avoid destructive rollback.
    }
}
