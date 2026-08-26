<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateQualificationGateDomain extends Migration
{
    public function up()
    {
        $db = $this->db;

        // personnel_qualification_reviews
        // Stores the Prerequisite Qualification Report gate decision per Personnel per period.
        $db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS public.personnel_qualification_reviews (
    id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_profile_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    academic_year           text        NOT NULL CHECK (btrim(academic_year) <> ''),
    evaluation_period       text,

    -- Report identity — label is always "Prerequisite Qualification Report" (neutral/configurable)
    report_label            text        NOT NULL DEFAULT 'Prerequisite Qualification Report'
                                        CHECK (btrim(report_label) <> ''),
    report_reference        text,
    report_file_path        text,
    report_version          text,

    -- Benchmark — stored as validated JSONB to support multidimensional criteria
    benchmark_type          text        CHECK (benchmark_type IS NULL OR btrim(benchmark_type) <> ''),
    benchmark_payload       jsonb       NOT NULL DEFAULT '{}'::jsonb,
    benchmark_reference     text,

    -- Actual result — HR-entered or computed against benchmark
    actual_result_payload   jsonb       NOT NULL DEFAULT '{}'::jsonb,

    -- Eligibility decision
    eligibility_decision    text        NOT NULL DEFAULT 'pending'
                                        CHECK (eligibility_decision IN ('pending', 'cleared', 'not_cleared')),
    decision_basis          text,
    status                  text        NOT NULL DEFAULT 'pending'
                                        CHECK (status IN ('pending', 'cleared', 'not_cleared')),

    -- Accountability
    remarks                 text,
    recorded_by             uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    evaluated_at            timestamptz,

    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now()
)
SQL);

        // Preserve report/benchmark history while preventing the same report
        // version from being recorded twice for a period.
        $db->query(<<<'SQL'
CREATE UNIQUE INDEX uq_qualification_review_personnel_year
  ON public.personnel_qualification_reviews
    (personnel_profile_id, academic_year, COALESCE(evaluation_period, ''), COALESCE(report_version, ''))
SQL);

        // updated_at trigger
        $db->query("CREATE TRIGGER set_personnel_qualification_reviews_updated_at
            BEFORE UPDATE ON public.personnel_qualification_reviews
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()");

        // Indexes
        $db->query('CREATE INDEX IF NOT EXISTS idx_qual_reviews_personnel
            ON public.personnel_qualification_reviews(personnel_profile_id)');
        $db->query('CREATE INDEX IF NOT EXISTS idx_qual_reviews_year
            ON public.personnel_qualification_reviews(academic_year)');
        $db->query('CREATE INDEX IF NOT EXISTS idx_qual_reviews_decision
            ON public.personnel_qualification_reviews(eligibility_decision)');
        $db->query('CREATE INDEX IF NOT EXISTS idx_qual_reviews_recorded_by
            ON public.personnel_qualification_reviews(recorded_by)');

        // Enable RLS
        $db->query('ALTER TABLE public.personnel_qualification_reviews ENABLE ROW LEVEL SECURITY');
        $db->query('REVOKE ALL ON TABLE public.personnel_qualification_reviews FROM anon, authenticated');

        // HR Admin: full read/write
        $db->query(<<<'SQL'
CREATE POLICY "hr_admin_manage_qualification_reviews"
  ON public.personnel_qualification_reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.profile_roles pr ON pr.profile_id = p.id
      JOIN public.roles r ON r.id = pr.role_id
      WHERE p.id = (SELECT auth.uid())
        AND p.account_type = 'hr_admin'
        AND r.role_key = 'hr_staff'
        AND pr.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.profile_roles pr ON pr.profile_id = p.id
      JOIN public.roles r ON r.id = pr.role_id
      WHERE p.id = (SELECT auth.uid())
        AND p.account_type = 'hr_admin'
        AND r.role_key = 'hr_staff'
        AND pr.is_active = true
    )
  )
SQL);

        // Personnel: read their own qualification reviews only
        $db->query(<<<'SQL'
CREATE POLICY "personnel_select_own_qualification"
  ON public.personnel_qualification_reviews FOR SELECT
  TO authenticated
  USING (personnel_profile_id = (SELECT auth.uid()))
SQL);
    }

    public function down()
    {
        $db = $this->db;
        $db->query('DROP TABLE IF EXISTS public.personnel_qualification_reviews CASCADE');
    }
}
