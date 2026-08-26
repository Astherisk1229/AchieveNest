<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Forward-only reconciliation for HR migrations that were already applied to
 * AchieveNest-Test before their controller/schema contract review completed.
 */
class ReconcileHRFinalizationSchema extends Migration
{
    public function up()
    {
        $db = $this->db;

        $db->query(<<<'SQL'
ALTER TABLE public.personnel_evaluation_events
    ADD COLUMN IF NOT EXISTS notes text,
    ADD COLUMN IF NOT EXISTS occurred_at timestamptz NOT NULL DEFAULT now()
SQL);

        $db->query('DROP INDEX IF EXISTS public.uq_qualification_review_personnel_year');
        $db->query(<<<'SQL'
CREATE UNIQUE INDEX uq_qualification_review_personnel_year
  ON public.personnel_qualification_reviews
    (personnel_profile_id, academic_year, COALESCE(evaluation_period, ''), COALESCE(report_version, ''))
SQL);

        $db->query('DROP POLICY IF EXISTS "dean_select_college_accomplishments" ON public.personnel_accomplishments');
        $db->query(<<<'SQL'
CREATE POLICY "dean_select_college_accomplishments"
  ON public.personnel_accomplishments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profile_roles pr
      JOIN public.roles r ON r.id = pr.role_id
      JOIN public.profiles target ON target.id = personnel_accomplishments.personnel_profile_id
      JOIN public.departments target_department ON target_department.id = target.department_id
      WHERE pr.profile_id = (SELECT auth.uid())
        AND r.role_key = 'dean'
        AND pr.is_active = true
        AND pr.scope_type = 'college'
        AND pr.scope_id = target_department.college_id
    )
  )
SQL);
    }

    public function down()
    {
        $db = $this->db;
        $db->query('DROP POLICY IF EXISTS "dean_select_college_accomplishments" ON public.personnel_accomplishments');
        $db->query('DROP INDEX IF EXISTS public.uq_qualification_review_personnel_year');
        $db->query(<<<'SQL'
CREATE UNIQUE INDEX uq_qualification_review_personnel_year
  ON public.personnel_qualification_reviews (personnel_profile_id, academic_year)
  WHERE eligibility_decision <> 'not_cleared'
SQL);
        // Event columns are retained on rollback to avoid destroying audit data.
    }
}
