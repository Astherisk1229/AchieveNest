<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class EnableTargetRlsAndGrants extends Migration
{
    public function up()
    {
        $tables = [
            'academic_programs','administrative_units','student_profiles','student_program_enrollments','personnel_profiles',
            'personnel_college_affiliations','personnel_program_affiliations','personnel_administrative_unit_affiliations',
            'dean_assignments','program_coordinator_assignments','organizations','organization_programs','organization_moderator_assignments',
            'portfolio_categories','portfolio_subcategories','student_portfolio_records','student_portfolio_evidence','student_portfolio_verification_events',
            'award_definitions','award_criteria','award_scoring_rules','award_portfolio_mappings','award_cycles','student_award_evaluations',
            'student_award_criterion_scores','student_award_score_evidence','dean_student_nominations','award_interview_eligibilities',
            'notifications','notification_preferences','audit_logs','events','certificate_template_families','certificate_template_versions',
            'certificate_issuance_batches','issued_certificates',
        ];
        foreach ($tables as $table) {
            $this->db->query("ALTER TABLE public.{$table} ENABLE ROW LEVEL SECURITY");
            $this->db->query("REVOKE ALL ON TABLE public.{$table} FROM PUBLIC, anon, authenticated");
            $this->db->query("GRANT ALL ON TABLE public.{$table} TO service_role");
        }

        $policies = [
            'academic_programs'=>['academic_programs_authenticated_select'],
            'administrative_units'=>['administrative_units_authenticated_select'],
            'portfolio_categories'=>['portfolio_categories_authenticated_select'],
            'portfolio_subcategories'=>['portfolio_subcategories_authenticated_select'],
            'organizations'=>['organizations_authenticated_select','organizations_osad_manage'],
            'organization_programs'=>['organization_programs_authenticated_select','organization_programs_osad_manage'],
            'award_cycles'=>['award_cycles_authenticated_select'], 'events'=>['events_authenticated_select'],
            'student_profiles'=>['student_profiles_own_or_osad_select'],
            'student_program_enrollments'=>['student_enrollments_own_or_osad_or_coordinator_select'],
            'personnel_profiles'=>['personnel_profiles_self_hr_osad_select'],
            'personnel_college_affiliations'=>['personnel_college_affiliations_self_hr_osad_select','personnel_college_affiliations_hr_manage'],
            'personnel_program_affiliations'=>['personnel_program_affiliations_self_hr_osad_select','personnel_program_affiliations_hr_manage'],
            'personnel_administrative_unit_affiliations'=>['personnel_admin_unit_affiliations_self_hr_select','personnel_admin_unit_affiliations_hr_manage'],
            'dean_assignments'=>['dean_assignments_authenticated_select','dean_assignments_hr_manage'],
            'program_coordinator_assignments'=>['program_coordinator_assignments_authenticated_select','program_coordinator_assignments_osad_manage'],
            'organization_moderator_assignments'=>['organization_moderator_assignments_authenticated_select','organization_moderator_assignments_osad_manage'],
            'student_portfolio_records'=>['student_select_own_portfolio','student_insert_own_portfolio','student_update_own_portfolio','coordinator_select_program_portfolios','coordinator_update_program_portfolios'],
            'student_portfolio_evidence'=>['student_select_own_portfolio_evidence','coordinator_select_program_evidence','student_insert_own_portfolio_evidence'],
            'student_portfolio_verification_events'=>['coordinator_insert_verification_event','student_select_own_verification_history','coordinator_select_program_verification_history'],
            'award_definitions'=>['osad_select_award_definitions'],
            'award_criteria'=>['osad_select_scoring_reference_criteria'],
            'award_scoring_rules'=>['osad_select_scoring_reference_rules'],
            'award_portfolio_mappings'=>['osad_select_scoring_reference_mappings'],
            'student_award_evaluations'=>['osad_manage_award_evaluations'],
            'student_award_criterion_scores'=>['osad_manage_criterion_scores'],
            'student_award_score_evidence'=>['osad_manage_score_evidence'],
            'dean_student_nominations'=>['dean_insert_nomination','dean_select_own_nominations','osad_select_dean_nominations'],
            'award_interview_eligibilities'=>['student_select_own_eligibility','osad_manage_interview_eligibilities'],
            'notifications'=>['recipient_select_notifications','recipient_update_notification_read_state'],
            'notification_preferences'=>['notification_preferences_owner_all'], 'audit_logs'=>['audit_logs_hr_osad_select'],
            'certificate_template_families'=>['certificate_template_families_authenticated_select','certificate_template_families_osad_manage'],
            'certificate_template_versions'=>['certificate_template_versions_authenticated_select','certificate_template_versions_osad_manage'],
            'certificate_issuance_batches'=>['certificate_batches_osad_manage'],
            'issued_certificates'=>['issued_certificates_recipient_or_osad_select','issued_certificates_osad_manage'],
        ];
        foreach ($policies as $table => $names) {
            foreach ($names as $name) {
                $this->db->query("DROP POLICY IF EXISTS \"{$name}\" ON public.{$table}");
            }
        }

        $this->db->query(<<<'SQL'
CREATE POLICY academic_programs_authenticated_select ON public.academic_programs FOR SELECT TO authenticated USING (true);
CREATE POLICY administrative_units_authenticated_select ON public.administrative_units FOR SELECT TO authenticated USING (true);
CREATE POLICY portfolio_categories_authenticated_select ON public.portfolio_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY portfolio_subcategories_authenticated_select ON public.portfolio_subcategories FOR SELECT TO authenticated USING (true);
CREATE POLICY organizations_authenticated_select ON public.organizations FOR SELECT TO authenticated USING (true);
CREATE POLICY organization_programs_authenticated_select ON public.organization_programs FOR SELECT TO authenticated USING (true);
CREATE POLICY award_cycles_authenticated_select ON public.award_cycles FOR SELECT TO authenticated USING (true);
CREATE POLICY events_authenticated_select ON public.events FOR SELECT TO authenticated USING (true);

CREATE POLICY student_profiles_own_or_osad_select ON public.student_profiles FOR SELECT TO authenticated
 USING (profile_id=(SELECT auth.uid()) OR (SELECT private.is_osad_admin()));
CREATE POLICY student_enrollments_own_or_osad_or_coordinator_select ON public.student_program_enrollments FOR SELECT TO authenticated
 USING (student_profile_id=(SELECT auth.uid()) OR (SELECT private.is_osad_admin()) OR (SELECT private.is_active_program_coordinator(academic_program_id)));
CREATE POLICY personnel_profiles_self_hr_osad_select ON public.personnel_profiles FOR SELECT TO authenticated
 USING (profile_id=(SELECT auth.uid()) OR (SELECT private.is_hr_admin()) OR (SELECT private.is_osad_admin()));
CREATE POLICY personnel_college_affiliations_self_hr_osad_select ON public.personnel_college_affiliations FOR SELECT TO authenticated
 USING (personnel_profile_id=(SELECT auth.uid()) OR (SELECT private.is_hr_admin()) OR (SELECT private.is_osad_admin()));
CREATE POLICY personnel_college_affiliations_hr_manage ON public.personnel_college_affiliations FOR ALL TO authenticated
 USING ((SELECT private.is_hr_admin())) WITH CHECK ((SELECT private.is_hr_admin()));
CREATE POLICY personnel_program_affiliations_self_hr_osad_select ON public.personnel_program_affiliations FOR SELECT TO authenticated
 USING (personnel_profile_id=(SELECT auth.uid()) OR (SELECT private.is_hr_admin()) OR (SELECT private.is_osad_admin()));
CREATE POLICY personnel_program_affiliations_hr_manage ON public.personnel_program_affiliations FOR ALL TO authenticated
 USING ((SELECT private.is_hr_admin())) WITH CHECK ((SELECT private.is_hr_admin()));
CREATE POLICY personnel_admin_unit_affiliations_self_hr_select ON public.personnel_administrative_unit_affiliations FOR SELECT TO authenticated
 USING (personnel_profile_id=(SELECT auth.uid()) OR (SELECT private.is_hr_admin()));
CREATE POLICY personnel_admin_unit_affiliations_hr_manage ON public.personnel_administrative_unit_affiliations FOR ALL TO authenticated
 USING ((SELECT private.is_hr_admin())) WITH CHECK ((SELECT private.is_hr_admin()));
CREATE POLICY dean_assignments_authenticated_select ON public.dean_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY dean_assignments_hr_manage ON public.dean_assignments FOR ALL TO authenticated
 USING ((SELECT private.is_hr_admin())) WITH CHECK ((SELECT private.is_hr_admin()));
CREATE POLICY program_coordinator_assignments_authenticated_select ON public.program_coordinator_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY program_coordinator_assignments_osad_manage ON public.program_coordinator_assignments FOR ALL TO authenticated
 USING ((SELECT private.is_osad_admin())) WITH CHECK ((SELECT private.is_osad_admin()));
CREATE POLICY organization_moderator_assignments_authenticated_select ON public.organization_moderator_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY organization_moderator_assignments_osad_manage ON public.organization_moderator_assignments FOR ALL TO authenticated
 USING ((SELECT private.is_osad_admin())) WITH CHECK ((SELECT private.is_osad_admin()));
CREATE POLICY organizations_osad_manage ON public.organizations FOR ALL TO authenticated
 USING ((SELECT private.is_osad_admin())) WITH CHECK ((SELECT private.is_osad_admin()));
CREATE POLICY organization_programs_osad_manage ON public.organization_programs FOR ALL TO authenticated
 USING ((SELECT private.is_osad_admin())) WITH CHECK ((SELECT private.is_osad_admin()));

CREATE POLICY student_select_own_portfolio ON public.student_portfolio_records FOR SELECT TO authenticated USING (student_profile_id=(SELECT auth.uid()));
CREATE POLICY student_insert_own_portfolio ON public.student_portfolio_records FOR INSERT TO authenticated
 WITH CHECK (student_profile_id=(SELECT auth.uid()) AND status IN ('draft','submitted'));
CREATE POLICY student_update_own_portfolio ON public.student_portfolio_records FOR UPDATE TO authenticated
 USING (student_profile_id=(SELECT auth.uid()) AND status IN ('draft','revision_requested'))
 WITH CHECK (student_profile_id=(SELECT auth.uid()) AND status IN ('draft','submitted'));
CREATE POLICY coordinator_select_program_portfolios ON public.student_portfolio_records FOR SELECT TO authenticated USING (EXISTS (
 SELECT 1 FROM public.student_program_enrollments e JOIN public.program_coordinator_assignments a ON a.academic_program_id=e.academic_program_id AND a.is_active
 WHERE e.student_profile_id=student_portfolio_records.student_profile_id AND e.is_active AND a.personnel_profile_id=(SELECT auth.uid())));
CREATE POLICY coordinator_update_program_portfolios ON public.student_portfolio_records FOR UPDATE TO authenticated
 USING (status IN ('submitted','revision_requested') AND EXISTS (SELECT 1 FROM public.student_program_enrollments e JOIN public.program_coordinator_assignments a ON a.academic_program_id=e.academic_program_id AND a.is_active WHERE e.student_profile_id=student_portfolio_records.student_profile_id AND e.is_active AND a.personnel_profile_id=(SELECT auth.uid())))
 WITH CHECK (status IN ('revision_requested','verified','rejected') AND EXISTS (SELECT 1 FROM public.student_program_enrollments e JOIN public.program_coordinator_assignments a ON a.academic_program_id=e.academic_program_id AND a.is_active WHERE e.student_profile_id=student_portfolio_records.student_profile_id AND e.is_active AND a.personnel_profile_id=(SELECT auth.uid())));
CREATE POLICY student_select_own_portfolio_evidence ON public.student_portfolio_evidence FOR SELECT TO authenticated USING (EXISTS (
 SELECT 1 FROM public.student_portfolio_records r WHERE r.id=portfolio_record_id AND r.student_profile_id=(SELECT auth.uid())));
CREATE POLICY coordinator_select_program_evidence ON public.student_portfolio_evidence FOR SELECT TO authenticated USING (EXISTS (
 SELECT 1 FROM public.student_portfolio_records r JOIN public.student_program_enrollments e ON e.student_profile_id=r.student_profile_id AND e.is_active
 JOIN public.program_coordinator_assignments a ON a.academic_program_id=e.academic_program_id AND a.is_active
 WHERE r.id=portfolio_record_id AND a.personnel_profile_id=(SELECT auth.uid())));
CREATE POLICY coordinator_insert_verification_event ON public.student_portfolio_verification_events FOR INSERT TO authenticated WITH CHECK (
 actor_profile_id=(SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.student_portfolio_records r JOIN public.student_program_enrollments e ON e.student_profile_id=r.student_profile_id AND e.is_active JOIN public.program_coordinator_assignments a ON a.academic_program_id=e.academic_program_id AND a.is_active WHERE r.id=portfolio_record_id AND a.personnel_profile_id=(SELECT auth.uid())));
CREATE POLICY student_select_own_verification_history ON public.student_portfolio_verification_events FOR SELECT TO authenticated USING (EXISTS (
 SELECT 1 FROM public.student_portfolio_records r WHERE r.id=portfolio_record_id AND r.student_profile_id=(SELECT auth.uid())));
CREATE POLICY coordinator_select_program_verification_history ON public.student_portfolio_verification_events FOR SELECT TO authenticated USING (EXISTS (
 SELECT 1 FROM public.student_portfolio_records r JOIN public.student_program_enrollments e ON e.student_profile_id=r.student_profile_id AND e.is_active JOIN public.program_coordinator_assignments a ON a.academic_program_id=e.academic_program_id AND a.is_active WHERE r.id=portfolio_record_id AND a.personnel_profile_id=(SELECT auth.uid())));

CREATE POLICY osad_select_award_definitions ON public.award_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY osad_select_scoring_reference_criteria ON public.award_criteria FOR SELECT TO authenticated USING ((SELECT private.is_osad_admin()));
CREATE POLICY osad_select_scoring_reference_rules ON public.award_scoring_rules FOR SELECT TO authenticated USING ((SELECT private.is_osad_admin()));
CREATE POLICY osad_select_scoring_reference_mappings ON public.award_portfolio_mappings FOR SELECT TO authenticated USING ((SELECT private.is_osad_admin()));
CREATE POLICY osad_manage_award_evaluations ON public.student_award_evaluations FOR ALL TO authenticated USING ((SELECT private.is_osad_admin())) WITH CHECK ((SELECT private.is_osad_admin()));
CREATE POLICY osad_manage_criterion_scores ON public.student_award_criterion_scores FOR ALL TO authenticated USING ((SELECT private.is_osad_admin())) WITH CHECK ((SELECT private.is_osad_admin()));
CREATE POLICY osad_manage_score_evidence ON public.student_award_score_evidence FOR ALL TO authenticated USING ((SELECT private.is_osad_admin())) WITH CHECK ((SELECT private.is_osad_admin()));
CREATE POLICY dean_insert_nomination ON public.dean_student_nominations FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.dean_assignments d WHERE d.id=dean_assignment_id AND d.personnel_profile_id=(SELECT auth.uid()) AND d.is_active));
CREATE POLICY dean_select_own_nominations ON public.dean_student_nominations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.dean_assignments d WHERE d.id=dean_assignment_id AND d.personnel_profile_id=(SELECT auth.uid())) OR (SELECT private.is_osad_admin()));
CREATE POLICY osad_select_dean_nominations ON public.dean_student_nominations FOR SELECT TO authenticated USING ((SELECT private.is_osad_admin()));
CREATE POLICY student_select_own_eligibility ON public.award_interview_eligibilities FOR SELECT TO authenticated USING (student_profile_id=(SELECT auth.uid()) OR (SELECT private.is_osad_admin()));
CREATE POLICY osad_manage_interview_eligibilities ON public.award_interview_eligibilities FOR ALL TO authenticated USING ((SELECT private.is_osad_admin())) WITH CHECK ((SELECT private.is_osad_admin()));

CREATE POLICY recipient_select_notifications ON public.notifications FOR SELECT TO authenticated USING (recipient_profile_id=(SELECT auth.uid()));
CREATE POLICY recipient_update_notification_read_state ON public.notifications FOR UPDATE TO authenticated USING (recipient_profile_id=(SELECT auth.uid())) WITH CHECK (recipient_profile_id=(SELECT auth.uid()));
CREATE POLICY notification_preferences_owner_all ON public.notification_preferences FOR ALL TO authenticated USING (profile_id=(SELECT auth.uid())) WITH CHECK (profile_id=(SELECT auth.uid()));
CREATE POLICY audit_logs_hr_osad_select ON public.audit_logs FOR SELECT TO authenticated USING ((SELECT private.is_hr_admin()) OR (SELECT private.is_osad_admin()));
CREATE POLICY certificate_template_families_authenticated_select ON public.certificate_template_families FOR SELECT TO authenticated USING (status='published' OR (SELECT private.is_osad_admin()));
CREATE POLICY certificate_template_families_osad_manage ON public.certificate_template_families FOR ALL TO authenticated USING ((SELECT private.is_osad_admin())) WITH CHECK ((SELECT private.is_osad_admin()));
CREATE POLICY certificate_template_versions_authenticated_select ON public.certificate_template_versions FOR SELECT TO authenticated USING (status='published' OR (SELECT private.is_osad_admin()));
CREATE POLICY certificate_template_versions_osad_manage ON public.certificate_template_versions FOR ALL TO authenticated USING ((SELECT private.is_osad_admin())) WITH CHECK ((SELECT private.is_osad_admin()));
CREATE POLICY certificate_batches_osad_manage ON public.certificate_issuance_batches FOR ALL TO authenticated USING ((SELECT private.is_osad_admin())) WITH CHECK ((SELECT private.is_osad_admin()));
CREATE POLICY issued_certificates_recipient_or_osad_select ON public.issued_certificates FOR SELECT TO authenticated USING (recipient_profile_id=(SELECT auth.uid()) OR (SELECT private.is_osad_admin()));
CREATE POLICY issued_certificates_osad_manage ON public.issued_certificates FOR ALL TO authenticated USING ((SELECT private.is_osad_admin())) WITH CHECK ((SELECT private.is_osad_admin()));

GRANT SELECT ON public.academic_programs,public.administrative_units,public.portfolio_categories,public.portfolio_subcategories,
 public.organizations,public.organization_programs,public.award_cycles,public.events,public.award_definitions,public.award_criteria,
 public.award_scoring_rules,public.award_portfolio_mappings TO authenticated;
GRANT SELECT ON public.student_profiles,public.student_program_enrollments,public.personnel_profiles,public.personnel_college_affiliations,
 public.personnel_program_affiliations,public.personnel_administrative_unit_affiliations,public.dean_assignments,
 public.program_coordinator_assignments,public.organization_moderator_assignments TO authenticated;
GRANT SELECT,INSERT,UPDATE ON public.student_portfolio_records TO authenticated;
GRANT SELECT ON public.student_portfolio_evidence TO authenticated;
GRANT SELECT,INSERT ON public.student_portfolio_verification_events TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.personnel_college_affiliations,public.personnel_program_affiliations,
 public.personnel_administrative_unit_affiliations,public.dean_assignments,public.program_coordinator_assignments,
 public.organizations,public.organization_programs,public.organization_moderator_assignments TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.student_award_evaluations,public.student_award_criterion_scores,
 public.student_award_score_evidence,public.dean_student_nominations,public.award_interview_eligibilities TO authenticated;
GRANT SELECT ON public.notifications TO authenticated;
REVOKE UPDATE ON TABLE public.notifications FROM authenticated;
GRANT UPDATE (read_at) ON TABLE public.notifications TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.notification_preferences,public.certificate_template_families,
 public.certificate_template_versions,public.certificate_issuance_batches,public.issued_certificates TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;

REVOKE INSERT,UPDATE,DELETE ON public.award_definitions FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.award_definitions TO service_role;
SQL);
    }

    public function down()
    {
        $policies = [
            'academic_programs'=>['academic_programs_authenticated_select'], 'administrative_units'=>['administrative_units_authenticated_select'],
            'portfolio_categories'=>['portfolio_categories_authenticated_select'], 'portfolio_subcategories'=>['portfolio_subcategories_authenticated_select'],
            'organizations'=>['organizations_authenticated_select','organizations_osad_manage'], 'organization_programs'=>['organization_programs_authenticated_select','organization_programs_osad_manage'],
            'award_cycles'=>['award_cycles_authenticated_select'], 'events'=>['events_authenticated_select'],
            'student_profiles'=>['student_profiles_own_or_osad_select'], 'student_program_enrollments'=>['student_enrollments_own_or_osad_or_coordinator_select'],
            'personnel_profiles'=>['personnel_profiles_self_hr_osad_select'],
            'personnel_college_affiliations'=>['personnel_college_affiliations_self_hr_osad_select','personnel_college_affiliations_hr_manage'],
            'personnel_program_affiliations'=>['personnel_program_affiliations_self_hr_osad_select','personnel_program_affiliations_hr_manage'],
            'personnel_administrative_unit_affiliations'=>['personnel_admin_unit_affiliations_self_hr_select','personnel_admin_unit_affiliations_hr_manage'],
            'dean_assignments'=>['dean_assignments_authenticated_select','dean_assignments_hr_manage'],
            'program_coordinator_assignments'=>['program_coordinator_assignments_authenticated_select','program_coordinator_assignments_osad_manage'],
            'organization_moderator_assignments'=>['organization_moderator_assignments_authenticated_select','organization_moderator_assignments_osad_manage'],
            'student_portfolio_records'=>['student_select_own_portfolio','student_insert_own_portfolio','student_update_own_portfolio','coordinator_select_program_portfolios','coordinator_update_program_portfolios'],
            'student_portfolio_evidence'=>['student_select_own_portfolio_evidence','coordinator_select_program_evidence','student_insert_own_portfolio_evidence'],
            'student_portfolio_verification_events'=>['coordinator_insert_verification_event','student_select_own_verification_history','coordinator_select_program_verification_history'],
            'award_definitions'=>['osad_select_award_definitions'], 'award_criteria'=>['osad_select_scoring_reference_criteria'],
            'award_scoring_rules'=>['osad_select_scoring_reference_rules'], 'award_portfolio_mappings'=>['osad_select_scoring_reference_mappings'],
            'student_award_evaluations'=>['osad_manage_award_evaluations'], 'student_award_criterion_scores'=>['osad_manage_criterion_scores'],
            'student_award_score_evidence'=>['osad_manage_score_evidence'],
            'dean_student_nominations'=>['dean_insert_nomination','dean_select_own_nominations','osad_select_dean_nominations'],
            'award_interview_eligibilities'=>['student_select_own_eligibility','osad_manage_interview_eligibilities'],
            'notifications'=>['recipient_select_notifications','recipient_update_notification_read_state'],
            'notification_preferences'=>['notification_preferences_owner_all'], 'audit_logs'=>['audit_logs_hr_osad_select'],
            'certificate_template_families'=>['certificate_template_families_authenticated_select','certificate_template_families_osad_manage'],
            'certificate_template_versions'=>['certificate_template_versions_authenticated_select','certificate_template_versions_osad_manage'],
            'certificate_issuance_batches'=>['certificate_batches_osad_manage'],
            'issued_certificates'=>['issued_certificates_recipient_or_osad_select','issued_certificates_osad_manage'],
        ];
        foreach ($policies as $table => $names) {
            foreach ($names as $name) {
                $this->db->query("DROP POLICY IF EXISTS \"{$name}\" ON public.{$table}");
            }
        }

        foreach (array_keys($policies) as $table) {
            $this->db->query("REVOKE ALL ON TABLE public.{$table} FROM authenticated, service_role");
        }
        // RLS remains enabled; unknown pre-migration grants are not reconstructed.
    }
}
