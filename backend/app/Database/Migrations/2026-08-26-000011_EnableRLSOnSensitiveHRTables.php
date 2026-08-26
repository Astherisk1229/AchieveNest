<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Migration 000011 — Enable RLS with reviewed policies on the six sensitive HR/security tables.
 *
 * Tables targeted (all currently have RLS enabled but zero policies):
 *   role_assignment_events
 *   personnel_evaluations
 *   personnel_evaluation_items
 *   personnel_evaluation_events
 *   password_reset_requests
 *   password_reset_events
 *
 * Policy design:
 *   - No broad "TO authenticated USING (true)" policies.
 *   - Ownership / role checks in every USING + WITH CHECK clause.
 *   - Use (SELECT auth.uid()) not auth.uid() to avoid per-row re-evaluation.
 *   - Deprecated auth.role() is NOT used; TO clause + EXISTS check instead.
 */
class EnableRLSOnSensitiveHRTables extends Migration
{
    /**
     * Helper: builds the EXISTS sub-query that confirms the caller is an active HR Admin.
     */
    private function hrAdminCheck(): string
    {
        return <<<'EXPR'
    EXISTS (
      SELECT 1
      FROM public.profiles hp
      JOIN public.profile_roles hpr ON hpr.profile_id = hp.id
      JOIN public.roles hr ON hr.id = hpr.role_id
      WHERE hp.id = (SELECT auth.uid())
        AND hp.account_type = 'hr_admin'
        AND hr.role_key   = 'hr_staff'
        AND hpr.is_active = true
    )
EXPR;
    }

    /**
     * Helper: builds the EXISTS sub-query that confirms the caller is an active Dean.
     */
    private function deanCheck(): string
    {
        return <<<'EXPR'
    EXISTS (
      SELECT 1
      FROM public.profile_roles dr
      JOIN public.roles drl ON drl.id = dr.role_id
      WHERE dr.profile_id = (SELECT auth.uid())
        AND drl.role_key   = 'dean'
        AND dr.is_active   = true
    )
EXPR;
    }

    public function up()
    {
        $db  = $this->db;
        $hr  = $this->hrAdminCheck();
        $dn  = $this->deanCheck();

        // ----------------------------------------------------------------
        // 1. role_assignment_events
        // ----------------------------------------------------------------
        $db->query('ALTER TABLE public.role_assignment_events ENABLE ROW LEVEL SECURITY');
        $db->query('REVOKE ALL ON TABLE public.role_assignment_events FROM anon, authenticated');

        // HR Admin: read all role events
        $db->query("
          CREATE POLICY \"hr_admin_select_role_events\"
            ON public.role_assignment_events FOR SELECT
            TO authenticated
            USING ({$hr})
        ");

        // Personnel/Dean: read their own role assignment events (target_profile_id)
        $db->query("
          CREATE POLICY \"subject_select_own_role_events\"
            ON public.role_assignment_events FOR SELECT
            TO authenticated
            USING (target_profile_id = (SELECT auth.uid()))
        ");

        // Only service role (via backend) inserts role events — no direct user INSERT policy

        // ----------------------------------------------------------------
        // 2. personnel_evaluations
        // ----------------------------------------------------------------
        $db->query('ALTER TABLE public.personnel_evaluations ENABLE ROW LEVEL SECURITY');
        $db->query('REVOKE ALL ON TABLE public.personnel_evaluations FROM anon, authenticated');

        // HR Admin: read all
        $db->query("
          CREATE POLICY \"hr_admin_select_evaluations\"
            ON public.personnel_evaluations FOR SELECT
            TO authenticated
            USING ({$hr})
        ");

        // Assigned evaluator (HR or Dean): read evaluations they are evaluating
        $db->query("
          CREATE POLICY \"evaluator_select_assigned_evaluations\"
            ON public.personnel_evaluations FOR SELECT
            TO authenticated
            USING (evaluator_profile_id = (SELECT auth.uid()))
        ");

        // Personnel: read their own evaluation
        $db->query("
          CREATE POLICY \"personnel_select_own_evaluation\"
            ON public.personnel_evaluations FOR SELECT
            TO authenticated
            USING (personnel_profile_id = (SELECT auth.uid()))
        ");

        // HR Admin: INSERT + UPDATE (non-completed evaluations; completed are locked in app layer)
        $db->query("
          CREATE POLICY \"hr_admin_insert_evaluations\"
            ON public.personnel_evaluations FOR INSERT
            TO authenticated
            WITH CHECK ({$hr})
        ");

        $db->query("
          CREATE POLICY \"hr_admin_update_evaluations\"
            ON public.personnel_evaluations FOR UPDATE
            TO authenticated
            USING ({$hr} AND status <> 'completed')
            WITH CHECK ({$hr})
        ");

        // Assigned evaluator UPDATE (for Dean-reviewed evaluations, non-completed)
        $db->query("
          CREATE POLICY \"evaluator_update_assigned_evaluations\"
            ON public.personnel_evaluations FOR UPDATE
            TO authenticated
            USING (
              evaluator_profile_id = (SELECT auth.uid())
              AND status <> 'completed'
              AND ({$dn})
            )
            WITH CHECK (evaluator_profile_id = (SELECT auth.uid()))
        ");

        // ----------------------------------------------------------------
        // 3. personnel_evaluation_items
        // ----------------------------------------------------------------
        $db->query('ALTER TABLE public.personnel_evaluation_items ENABLE ROW LEVEL SECURITY');
        $db->query('REVOKE ALL ON TABLE public.personnel_evaluation_items FROM anon, authenticated');

        // HR Admin: all
        $db->query("
          CREATE POLICY \"hr_admin_all_eval_items\"
            ON public.personnel_evaluation_items FOR ALL
            TO authenticated
            USING ({$hr})
            WITH CHECK ({$hr})
        ");

        // Assigned evaluator (Dean): read + update items for their assigned evaluations
        $db->query("
          CREATE POLICY \"evaluator_manage_assigned_items\"
            ON public.personnel_evaluation_items FOR ALL
            TO authenticated
            USING (
              EXISTS (
                SELECT 1 FROM public.personnel_evaluations pe
                WHERE pe.id = personnel_evaluation_items.evaluation_id
                  AND pe.evaluator_profile_id = (SELECT auth.uid())
                  AND pe.status <> 'completed'
              )
              AND ({$dn})
            )
            WITH CHECK (
              EXISTS (
                SELECT 1 FROM public.personnel_evaluations pe
                WHERE pe.id = personnel_evaluation_items.evaluation_id
                  AND pe.evaluator_profile_id = (SELECT auth.uid())
              )
            )
        ");

        // Personnel: read their own evaluation items
        $db->query("
          CREATE POLICY \"personnel_select_own_eval_items\"
            ON public.personnel_evaluation_items FOR SELECT
            TO authenticated
            USING (
              EXISTS (
                SELECT 1 FROM public.personnel_evaluations pe
                WHERE pe.id = personnel_evaluation_items.evaluation_id
                  AND pe.personnel_profile_id = (SELECT auth.uid())
              )
            )
        ");

        // ----------------------------------------------------------------
        // 4. personnel_evaluation_events — append-only audit log
        // ----------------------------------------------------------------
        $db->query('ALTER TABLE public.personnel_evaluation_events ENABLE ROW LEVEL SECURITY');
        $db->query('REVOKE ALL ON TABLE public.personnel_evaluation_events FROM anon, authenticated');

        // HR Admin: read all events
        $db->query("
          CREATE POLICY \"hr_admin_select_eval_events\"
            ON public.personnel_evaluation_events FOR SELECT
            TO authenticated
            USING ({$hr})
        ");

        // Assigned evaluator: read events for their assigned evaluations
        $db->query("
          CREATE POLICY \"evaluator_select_eval_events\"
            ON public.personnel_evaluation_events FOR SELECT
            TO authenticated
            USING (
              EXISTS (
                SELECT 1 FROM public.personnel_evaluations pe
                WHERE pe.id = personnel_evaluation_events.evaluation_id
                  AND pe.evaluator_profile_id = (SELECT auth.uid())
              )
            )
        ");

        // Personnel: read events on their own evaluation
        $db->query("
          CREATE POLICY \"personnel_select_own_eval_events\"
            ON public.personnel_evaluation_events FOR SELECT
            TO authenticated
            USING (
              EXISTS (
                SELECT 1 FROM public.personnel_evaluations pe
                WHERE pe.id = personnel_evaluation_events.evaluation_id
                  AND pe.personnel_profile_id = (SELECT auth.uid())
              )
            )
        ");

        // Insert: HR Admin + Dean evaluators (append-only audit — no UPDATE/DELETE policy)
        $db->query("
          CREATE POLICY \"admin_insert_eval_events\"
            ON public.personnel_evaluation_events FOR INSERT
            TO authenticated
            WITH CHECK (
              {$hr}
              OR (
                {$dn}
                AND EXISTS (
                  SELECT 1 FROM public.personnel_evaluations pe
                  WHERE pe.id = personnel_evaluation_events.evaluation_id
                    AND pe.evaluator_profile_id = (SELECT auth.uid())
                )
              )
            )
        ");

        // ----------------------------------------------------------------
        // 5. password_reset_requests
        // ----------------------------------------------------------------
        $db->query('ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY');
        $db->query('REVOKE ALL ON TABLE public.password_reset_requests FROM anon, authenticated');

        // HR Admin: read requests for their office (assigned_office = 'hr')
        $db->query("
          CREATE POLICY \"hr_admin_select_pw_reset_requests\"
            ON public.password_reset_requests FOR SELECT
            TO authenticated
            USING (
              {$hr}
              AND assigned_office = 'hr'
            )
        ");

        // HR Admin: update (complete/reject)
        $db->query("
          CREATE POLICY \"hr_admin_update_pw_reset_requests\"
            ON public.password_reset_requests FOR UPDATE
            TO authenticated
            USING ({$hr} AND assigned_office = 'hr')
            WITH CHECK ({$hr})
        ");

        // Personnel/Students: read their own request status (user_id match)
        $db->query("
          CREATE POLICY \"subject_select_own_pw_reset_request\"
            ON public.password_reset_requests FOR SELECT
            TO authenticated
            USING (user_id = (SELECT auth.uid()))
        ");

        // Public insert is handled by backend with service role — no direct user INSERT policy

        // ----------------------------------------------------------------
        // 6. password_reset_events — append-only audit log
        // ----------------------------------------------------------------
        $db->query('ALTER TABLE public.password_reset_events ENABLE ROW LEVEL SECURITY');
        $db->query('REVOKE ALL ON TABLE public.password_reset_events FROM anon, authenticated');

        // HR Admin: read all events for personnel resets
        $db->query("
          CREATE POLICY \"hr_admin_select_pw_reset_events\"
            ON public.password_reset_events FOR SELECT
            TO authenticated
            USING ({$hr})
        ");

        // Subject: read events targeting themselves
        $db->query("
          CREATE POLICY \"subject_select_own_pw_events\"
            ON public.password_reset_events FOR SELECT
            TO authenticated
            USING (target_user_id = (SELECT auth.uid()))
        ");

        // Insert: HR Admin only (audit trail — no UPDATE/DELETE)
        $db->query("
          CREATE POLICY \"hr_admin_insert_pw_reset_events\"
            ON public.password_reset_events FOR INSERT
            TO authenticated
            WITH CHECK ({$hr})
        ");
    }

    public function down()
    {
        $db = $this->db;

        $tables = [
            'role_assignment_events',
            'personnel_evaluations',
            'personnel_evaluation_items',
            'personnel_evaluation_events',
            'password_reset_requests',
            'password_reset_events',
        ];

        foreach ($tables as $table) {
            // Drop policies created by this migration
            $policies = $db->query(
                "SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = ?",
                [$table]
            )->getResultArray();

            foreach ($policies as $policy) {
                $db->query("DROP POLICY IF EXISTS \"{$policy['policyname']}\" ON public.{$table}");
            }

            $db->query("ALTER TABLE public.{$table} DISABLE ROW LEVEL SECURITY");
        }
    }
}
