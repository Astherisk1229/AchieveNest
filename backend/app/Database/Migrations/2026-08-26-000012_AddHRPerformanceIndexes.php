<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Migration 000012 — HR Performance Indexes
 *
 * Adds compound indexes optimized for the HR Admin vertical slice:
 * - Personnel listing / filtering
 * - Evaluation dashboard counts
 * - Evaluator queue
 * - Qualification gate lookup
 * - Deficiency unresolved check
 * - Report lookup
 * - Password reset queue
 * - Audit history
 */
class AddHRPerformanceIndexes extends Migration
{
    public function up()
    {
        $db = $this->db;

        $indexes = [
            // Personnel listing
            'CREATE INDEX IF NOT EXISTS idx_profiles_acct_status
                ON public.profiles(account_type, status)',
            'CREATE INDEX IF NOT EXISTS idx_profiles_dept_status
                ON public.profiles(department_id, status)',
            'CREATE INDEX IF NOT EXISTS idx_profiles_college_status
                ON public.profiles(department_id, account_type)',

            // Evaluation dashboard counts
            'CREATE INDEX IF NOT EXISTS idx_evaluations_status_submitted
                ON public.personnel_evaluations(status, submitted_at DESC)',

            // Evaluator queue (Dean's active evaluations)
            'CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator_status
                ON public.personnel_evaluations(evaluator_profile_id, status)',

            // Personnel + academic year (duplicate submission check)
            'CREATE INDEX IF NOT EXISTS idx_evaluations_personnel_year
                ON public.personnel_evaluations(personnel_profile_id, academic_year)',

            // Qualification gate lookup
            'CREATE INDEX IF NOT EXISTS idx_qual_reviews_personnel_year
                ON public.personnel_qualification_reviews(personnel_profile_id, academic_year)',
            'CREATE INDEX IF NOT EXISTS idx_qual_reviews_decision_status
                ON public.personnel_qualification_reviews(eligibility_decision, status)',

            // Deficiency unresolved check
            'CREATE INDEX IF NOT EXISTS idx_deficiency_eval_status
                ON public.personnel_evaluation_deficiency_requests(evaluation_id, status)',
            'CREATE INDEX IF NOT EXISTS idx_deficiency_requested_from
                ON public.personnel_evaluation_deficiency_requests(requested_from, status)',

            // Report lookup
            'CREATE INDEX IF NOT EXISTS idx_eval_reports_eval_id
                ON public.personnel_evaluation_reports(evaluation_id)',

            // Password reset HR queue
            'CREATE INDEX IF NOT EXISTS idx_pw_reset_office_status
                ON public.password_reset_requests(assigned_office, status)',
            'CREATE INDEX IF NOT EXISTS idx_pw_reset_user_status
                ON public.password_reset_requests(user_id, status)',

            // Lifecycle audit history
            'CREATE INDEX IF NOT EXISTS idx_lifecycle_events_profile_occurred
                ON public.account_lifecycle_events(profile_id, occurred_at DESC)',

            // Role assignment event history
            'CREATE INDEX IF NOT EXISTS idx_role_events_target_occurred
                ON public.role_assignment_events(target_profile_id, occurred_at DESC)',

            // Accomplishments
            'CREATE INDEX IF NOT EXISTS idx_accomplishments_personnel_status
                ON public.personnel_accomplishments(personnel_profile_id, status)',

            // Evaluation items per evaluation + area
            'CREATE INDEX IF NOT EXISTS idx_eval_items_eval_area
                ON public.personnel_evaluation_items(evaluation_id, category_area)',
        ];

        foreach ($indexes as $sql) {
            $db->query($sql);
        }
    }

    public function down()
    {
        $db = $this->db;

        $drops = [
            'idx_profiles_acct_status',
            'idx_profiles_dept_status',
            'idx_profiles_college_status',
            'idx_evaluations_status_submitted',
            'idx_evaluations_evaluator_status',
            'idx_evaluations_personnel_year',
            'idx_qual_reviews_personnel_year',
            'idx_qual_reviews_decision_status',
            'idx_deficiency_eval_status',
            'idx_deficiency_requested_from',
            'idx_eval_reports_eval_id',
            'idx_pw_reset_office_status',
            'idx_pw_reset_user_status',
            'idx_lifecycle_events_profile_occurred',
            'idx_role_events_target_occurred',
            'idx_accomplishments_personnel_status',
            'idx_eval_items_eval_area',
        ];

        foreach ($drops as $idx) {
            $db->query("DROP INDEX IF EXISTS public.{$idx}");
        }
    }
}
