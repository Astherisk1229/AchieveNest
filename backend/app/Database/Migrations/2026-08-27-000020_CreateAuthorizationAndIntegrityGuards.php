<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateAuthorizationAndIntegrityGuards extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.is_hr_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.account_type='hr_admin' AND p.status='active') $$;
CREATE OR REPLACE FUNCTION private.is_osad_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.account_type='osad_admin' AND p.status='active') $$;
CREATE OR REPLACE FUNCTION private.is_active_dean(target_college_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT EXISTS (SELECT 1 FROM public.dean_assignments a WHERE a.personnel_profile_id=(SELECT auth.uid()) AND a.college_id=target_college_id AND a.is_active) $$;
CREATE OR REPLACE FUNCTION private.is_active_program_coordinator(target_program_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT EXISTS (SELECT 1 FROM public.program_coordinator_assignments a WHERE a.personnel_profile_id=(SELECT auth.uid()) AND a.academic_program_id=target_program_id AND a.is_active) $$;

ALTER FUNCTION private.is_hr_admin() OWNER TO postgres;
ALTER FUNCTION private.is_osad_admin() OWNER TO postgres;
ALTER FUNCTION private.is_active_dean(uuid) OWNER TO postgres;
ALTER FUNCTION private.is_active_program_coordinator(uuid) OWNER TO postgres;

REVOKE ALL ON FUNCTION private.is_hr_admin(), private.is_osad_admin(), private.is_active_dean(uuid), private.is_active_program_coordinator(uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_hr_admin(), private.is_osad_admin(), private.is_active_dean(uuid), private.is_active_program_coordinator(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_portfolio_subcategory_category() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN IF NEW.subcategory_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.portfolio_subcategories s WHERE s.id=NEW.subcategory_id AND s.category_id=NEW.category_id) THEN RAISE EXCEPTION 'Portfolio subcategory does not belong to selected category'; END IF; RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.enforce_personnel_program_college() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE program_college uuid; active_college uuid; cls text; BEGIN
 SELECT personnel_classification INTO cls FROM public.personnel_profiles WHERE profile_id=NEW.personnel_profile_id;
 IF cls<>'academic' THEN RAISE EXCEPTION 'Program affiliation requires Academic Personnel'; END IF;
 SELECT college_id INTO program_college FROM public.academic_programs WHERE id=NEW.academic_program_id;
 SELECT college_id INTO active_college FROM public.personnel_college_affiliations WHERE personnel_profile_id=NEW.personnel_profile_id AND is_active LIMIT 1;
 IF NEW.is_active AND (active_college IS NULL OR active_college<>program_college) THEN RAISE EXCEPTION 'Active Program affiliation must belong to the Personnel active College'; END IF; RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.enforce_organization_program_college() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE org_college uuid; program_college uuid; org_scope text; BEGIN
 SELECT college_id,scope INTO org_college,org_scope FROM public.organizations WHERE id=NEW.organization_id;
 SELECT college_id INTO program_college FROM public.academic_programs WHERE id=NEW.academic_program_id;
 IF org_scope<>'college' OR org_college IS NULL OR program_college<>org_college THEN RAISE EXCEPTION 'Organization Program must belong to the same College as a college-scoped Organization'; END IF; RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.enforce_verified_award_score_evidence() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN IF NOT EXISTS (SELECT 1 FROM public.student_portfolio_records r WHERE r.id=NEW.portfolio_record_id AND r.status='verified') THEN RAISE EXCEPTION 'Only Verified portfolio records may support award scoring'; END IF; RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.enforce_dean_assignment_eligibility() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN IF NEW.is_active AND NOT EXISTS (SELECT 1 FROM public.personnel_college_affiliations a WHERE a.personnel_profile_id=NEW.personnel_profile_id AND a.college_id=NEW.college_id AND a.is_active) THEN RAISE EXCEPTION 'Dean must have an active affiliation to the assigned College'; END IF; RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.enforce_program_coordinator_eligibility() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN IF NEW.is_active AND NOT EXISTS (SELECT 1 FROM public.personnel_program_affiliations a WHERE a.personnel_profile_id=NEW.personnel_profile_id AND a.academic_program_id=NEW.academic_program_id AND a.is_active) THEN RAISE EXCEPTION 'Program Coordinator must have an active affiliation to the exact Program'; END IF; RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_portfolio_subcategory_category ON public.student_portfolio_records;
CREATE TRIGGER trg_portfolio_subcategory_category BEFORE INSERT OR UPDATE OF category_id,subcategory_id ON public.student_portfolio_records FOR EACH ROW EXECUTE FUNCTION public.enforce_portfolio_subcategory_category();
DROP TRIGGER IF EXISTS trg_personnel_program_college ON public.personnel_program_affiliations;
CREATE TRIGGER trg_personnel_program_college BEFORE INSERT OR UPDATE ON public.personnel_program_affiliations FOR EACH ROW EXECUTE FUNCTION public.enforce_personnel_program_college();
DROP TRIGGER IF EXISTS trg_organization_program_college ON public.organization_programs;
CREATE TRIGGER trg_organization_program_college BEFORE INSERT OR UPDATE ON public.organization_programs FOR EACH ROW EXECUTE FUNCTION public.enforce_organization_program_college();
DROP TRIGGER IF EXISTS trg_verified_award_score_evidence ON public.student_award_score_evidence;
CREATE TRIGGER trg_verified_award_score_evidence BEFORE INSERT OR UPDATE OF portfolio_record_id ON public.student_award_score_evidence FOR EACH ROW EXECUTE FUNCTION public.enforce_verified_award_score_evidence();
DROP TRIGGER IF EXISTS trg_dean_assignment_eligibility ON public.dean_assignments;
CREATE TRIGGER trg_dean_assignment_eligibility BEFORE INSERT OR UPDATE ON public.dean_assignments FOR EACH ROW EXECUTE FUNCTION public.enforce_dean_assignment_eligibility();
DROP TRIGGER IF EXISTS trg_program_coordinator_eligibility ON public.program_coordinator_assignments;
CREATE TRIGGER trg_program_coordinator_eligibility BEFORE INSERT OR UPDATE ON public.program_coordinator_assignments FOR EACH ROW EXECUTE FUNCTION public.enforce_program_coordinator_eligibility();

REVOKE ALL ON FUNCTION public.enforce_portfolio_subcategory_category(), public.enforce_personnel_program_college(), public.enforce_organization_program_college(), public.enforce_verified_award_score_evidence(), public.enforce_dean_assignment_eligibility(), public.enforce_program_coordinator_eligibility() FROM PUBLIC, anon, authenticated, service_role;
SQL);
    }

    public function down()
    {
        $this->db->query(<<<'SQL'
DROP TRIGGER IF EXISTS trg_portfolio_subcategory_category ON public.student_portfolio_records;
DROP TRIGGER IF EXISTS trg_personnel_program_college ON public.personnel_program_affiliations;
DROP TRIGGER IF EXISTS trg_organization_program_college ON public.organization_programs;
DROP TRIGGER IF EXISTS trg_verified_award_score_evidence ON public.student_award_score_evidence;
DROP TRIGGER IF EXISTS trg_dean_assignment_eligibility ON public.dean_assignments;
DROP TRIGGER IF EXISTS trg_program_coordinator_eligibility ON public.program_coordinator_assignments;
SQL);
    }
}
