<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/** Retires Dean student nominations from the legacy PostgreSQL schema. */
class RemoveDeanStudentNominationWorkflow extends Migration
{
    public function up()
    {
        $this->db->query('DROP TRIGGER IF EXISTS trg_sync_dean_nomination_eligibility ON public.dean_student_nominations');
        $this->db->query('DROP FUNCTION IF EXISTS public.sync_dean_nomination_eligibility()');
        $this->db->query('DROP POLICY IF EXISTS dean_insert_nomination ON public.dean_student_nominations');
        $this->db->query('DROP POLICY IF EXISTS dean_select_own_nominations ON public.dean_student_nominations');
        $this->db->query('DROP POLICY IF EXISTS osad_select_dean_nominations ON public.dean_student_nominations');

        $this->db->query('ALTER TABLE IF EXISTS public.award_interview_eligibilities DROP CONSTRAINT IF EXISTS ck_award_eligibility_source_reference');
        $this->db->query('ALTER TABLE IF EXISTS public.award_interview_eligibilities DROP CONSTRAINT IF EXISTS award_interview_eligibilities_eligibility_source_check');
        $this->db->query("DELETE FROM public.award_interview_eligibilities WHERE eligibility_source = 'dean_nomination'");
        $this->db->query('ALTER TABLE IF EXISTS public.award_interview_eligibilities DROP COLUMN IF EXISTS dean_nomination_id');
        $this->db->query('DROP INDEX IF EXISTS public.idx_award_eligibility_nomination');
        $this->db->query("ALTER TABLE IF EXISTS public.award_interview_eligibilities ADD CONSTRAINT award_interview_eligibilities_eligibility_source_check CHECK (eligibility_source = 'portfolio_based')");
        $this->db->query("ALTER TABLE IF EXISTS public.award_interview_eligibilities ADD CONSTRAINT ck_award_eligibility_source_reference CHECK (eligibility_source = 'portfolio_based' AND evaluation_id IS NOT NULL)");

        $this->db->query(<<<'SQL'
UPDATE public.award_student_evaluation_summaries
SET candidate_pathway = 'automatic_portfolio',
    summary_payload = jsonb_set(
        summary_payload::jsonb #- '{candidate_intake,dean_nomination}',
        '{candidate_intake,candidate_pathway}',
        '"automatic_portfolio"'::jsonb,
        true
    )::json
WHERE candidate_pathway = 'dean_nomination'
SQL);

        $this->db->query('REVOKE ALL ON public.dean_student_nominations FROM PUBLIC, anon, authenticated, service_role');
        $this->db->query('DROP TABLE IF EXISTS public.dean_student_nominations CASCADE');
    }

    public function down()
    {
        // The Dean nomination workflow and its stored records are permanently retired.
    }
}
