<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateDeficiencyAndReportDomain extends Migration
{
    public function up()
    {
        $db = $this->db;

        // The original evaluation-event migration only stored payload/created_at,
        // while the HR workflow records a human-readable note and an explicit
        // event timestamp. Add those columns before the controller starts using
        // them so a clean migration run and the deployed schema stay aligned.
        $db->query(<<<'SQL'
ALTER TABLE public.personnel_evaluation_events
    ADD COLUMN IF NOT EXISTS notes text,
    ADD COLUMN IF NOT EXISTS occurred_at timestamptz NOT NULL DEFAULT now()
SQL);

        // 1. personnel_evaluation_deficiency_requests
        $db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS public.personnel_evaluation_deficiency_requests (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id       uuid        NOT NULL REFERENCES public.personnel_evaluations(id) ON DELETE CASCADE,
    evaluation_item_id  uuid        REFERENCES public.personnel_evaluation_items(id) ON DELETE SET NULL,
    requested_by        uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    requested_from      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reason              text        NOT NULL CHECK (btrim(reason) <> ''),
    status              text        NOT NULL DEFAULT 'open'
                                    CHECK (status IN ('open', 'responded', 'resolved', 'cancelled')),
    resolved_by         uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),
    responded_at        timestamptz,
    resolved_at         timestamptz,
    CONSTRAINT deficiency_resolved_check CHECK (
        status NOT IN ('resolved', 'cancelled') OR resolved_at IS NOT NULL
    ),
    CONSTRAINT deficiency_responded_check CHECK (
        status = 'open' OR responded_at IS NOT NULL
    )
)
SQL);

        // 2. personnel_evaluation_reports — immutable finalization snapshots
        $db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS public.personnel_evaluation_reports (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id       uuid        NOT NULL REFERENCES public.personnel_evaluations(id) ON DELETE RESTRICT,
    report_type         text        NOT NULL DEFAULT 'points_summary'
                                    CHECK (report_type IN ('points_summary')),
    snapshot            jsonb       NOT NULL,
    generated_by        uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    generated_at        timestamptz NOT NULL DEFAULT now(),
    rendered_file_path  text,
    version             integer     NOT NULL DEFAULT 1
)
SQL);

        // Indexes
        $db->query('CREATE INDEX IF NOT EXISTS idx_deficiency_requests_eval
            ON public.personnel_evaluation_deficiency_requests(evaluation_id)');
        $db->query('CREATE INDEX IF NOT EXISTS idx_deficiency_requests_status
            ON public.personnel_evaluation_deficiency_requests(evaluation_id, status)');
        $db->query('CREATE INDEX IF NOT EXISTS idx_deficiency_requests_from
            ON public.personnel_evaluation_deficiency_requests(requested_from)');
        $db->query('CREATE INDEX IF NOT EXISTS idx_eval_reports_eval
            ON public.personnel_evaluation_reports(evaluation_id)');

        // Enable RLS
        foreach (['personnel_evaluation_deficiency_requests', 'personnel_evaluation_reports'] as $table) {
            $db->query("ALTER TABLE public.{$table} ENABLE ROW LEVEL SECURITY");
            $db->query("REVOKE ALL ON TABLE public.{$table} FROM anon, authenticated");
        }

        // ----- Deficiency requests RLS -----

        // HR Admin: full access
        $db->query(<<<'SQL'
CREATE POLICY "hr_admin_all_deficiency_requests"
  ON public.personnel_evaluation_deficiency_requests FOR ALL
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
  WITH CHECK (true)
SQL);

        // Dean (assigned evaluator): select + insert + update their own requests
        $db->query(<<<'SQL'
CREATE POLICY "dean_manage_own_deficiency_requests"
  ON public.personnel_evaluation_deficiency_requests FOR ALL
  TO authenticated
  USING (requested_by = (SELECT auth.uid()))
  WITH CHECK (requested_by = (SELECT auth.uid()))
SQL);

        // Personnel (requested_from): select + respond (update responded_at + status)
        $db->query(<<<'SQL'
CREATE POLICY "personnel_select_own_deficiency_requests"
  ON public.personnel_evaluation_deficiency_requests FOR SELECT
  TO authenticated
  USING (requested_from = (SELECT auth.uid()))
SQL);

        $db->query(<<<'SQL'
CREATE POLICY "personnel_respond_deficiency_requests"
  ON public.personnel_evaluation_deficiency_requests FOR UPDATE
  TO authenticated
  USING (
    requested_from = (SELECT auth.uid())
    AND status = 'open'
  )
  WITH CHECK (
    requested_from = (SELECT auth.uid())
    AND status = 'responded'
  )
SQL);

        // ----- Evaluation reports RLS -----

        // HR Admin: full read
        $db->query(<<<'SQL'
CREATE POLICY "hr_admin_select_eval_reports"
  ON public.personnel_evaluation_reports FOR SELECT
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
SQL);

        // Dean (evaluator): read reports they generated
        $db->query(<<<'SQL'
CREATE POLICY "evaluator_select_own_reports"
  ON public.personnel_evaluation_reports FOR SELECT
  TO authenticated
  USING (generated_by = (SELECT auth.uid()))
SQL);

        // Personnel: read their own evaluation reports
        $db->query(<<<'SQL'
CREATE POLICY "personnel_select_own_eval_reports"
  ON public.personnel_evaluation_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.personnel_evaluations pe
      WHERE pe.id = personnel_evaluation_reports.evaluation_id
        AND pe.personnel_profile_id = (SELECT auth.uid())
    )
  )
SQL);

        // Reports are INSERT-only (immutable after creation); no UPDATE/DELETE from any role
        $db->query(<<<'SQL'
CREATE POLICY "system_insert_eval_reports"
  ON public.personnel_evaluation_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.profile_roles pr ON pr.profile_id = p.id
      JOIN public.roles r ON r.id = pr.role_id
      WHERE p.id = (SELECT auth.uid())
        AND (
          (p.account_type = 'hr_admin' AND r.role_key = 'hr_staff')
          OR r.role_key = 'dean'
        )
        AND pr.is_active = true
    )
  )
SQL);
    }

    public function down()
    {
        $db = $this->db;
        $db->query('DROP TABLE IF EXISTS public.personnel_evaluation_reports CASCADE');
        $db->query('DROP TABLE IF EXISTS public.personnel_evaluation_deficiency_requests CASCADE');
        $db->query('ALTER TABLE public.personnel_evaluation_events DROP COLUMN IF EXISTS occurred_at');
        $db->query('ALTER TABLE public.personnel_evaluation_events DROP COLUMN IF EXISTS notes');
    }
}
