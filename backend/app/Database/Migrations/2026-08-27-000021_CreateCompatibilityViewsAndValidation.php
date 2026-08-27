<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateCompatibilityViewsAndValidation extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
CREATE OR REPLACE VIEW public.v_current_student_academic_placement WITH (security_invoker=true) AS
SELECT p.id profile_id,p.institutional_id,e.academic_program_id,ap.code academic_program_code,ap.name academic_program_name,
 ap.college_id,c.code college_code,c.name college_name,e.year_level,e.academic_year
FROM public.profiles p
JOIN public.student_program_enrollments e ON e.student_profile_id=p.id AND e.is_active
JOIN public.academic_programs ap ON ap.id=e.academic_program_id
JOIN public.colleges c ON c.id=ap.college_id;

CREATE OR REPLACE VIEW public.v_current_personnel_affiliation WITH (security_invoker=true) AS
SELECT p.id profile_id,p.institutional_id,p.full_name,pp.personnel_classification,pca.college_id,c.code college_code,
 pau.administrative_unit_id,au.code administrative_unit_code,au.name administrative_unit_name
FROM public.profiles p JOIN public.personnel_profiles pp ON pp.profile_id=p.id
LEFT JOIN public.personnel_college_affiliations pca ON pca.personnel_profile_id=p.id AND pca.is_active
LEFT JOIN public.colleges c ON c.id=pca.college_id
LEFT JOIN public.personnel_administrative_unit_affiliations pau ON pau.personnel_profile_id=p.id AND pau.is_active
LEFT JOIN public.administrative_units au ON au.id=pau.administrative_unit_id;

REVOKE ALL ON public.v_current_student_academic_placement, public.v_current_personnel_affiliation FROM PUBLIC, anon;
GRANT SELECT ON public.v_current_student_academic_placement, public.v_current_personnel_affiliation TO authenticated, service_role;

DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM public.degree_programs dp LEFT JOIN public.academic_programs ap ON ap.id=dp.id WHERE ap.id IS NULL) THEN RAISE EXCEPTION 'Validation failed: unmigrated degree_programs'; END IF;
 IF EXISTS (SELECT 1 FROM public.student_program_enrollments WHERE is_active GROUP BY student_profile_id HAVING count(*)>1) THEN RAISE EXCEPTION 'Validation failed: multiple active student enrollments'; END IF;
 IF EXISTS (SELECT 1 FROM public.student_award_score_evidence se JOIN public.student_portfolio_records pr ON pr.id=se.portfolio_record_id WHERE pr.status<>'verified') THEN RAISE EXCEPTION 'Validation failed: non-verified portfolio evidence used in scoring'; END IF;
END $$;
SQL);
    }

    public function down()
    {
        $this->db->query('DROP VIEW IF EXISTS public.v_current_personnel_affiliation');
        $this->db->query('DROP VIEW IF EXISTS public.v_current_student_academic_placement');
    }
}
