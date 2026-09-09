<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateIdentityAffiliationGovernance extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS public.student_profiles (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_status text NOT NULL DEFAULT 'active' CHECK (student_status IN ('active','inactive','graduated','archived')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.student_program_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_profile_id uuid NOT NULL REFERENCES public.student_profiles(profile_id) ON DELETE CASCADE,
  academic_program_id uuid NOT NULL REFERENCES public.academic_programs(id) ON DELETE RESTRICT,
  year_level text, academic_year text, effective_from date NOT NULL DEFAULT CURRENT_DATE, effective_to date,
  is_active boolean NOT NULL DEFAULT true, recorded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT ck_student_program_enrollment_dates CHECK (effective_to IS NULL OR effective_to>=effective_from)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_student_program_enrollments_one_active ON public.student_program_enrollments(student_profile_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_student_program_enrollments_program ON public.student_program_enrollments(academic_program_id);
CREATE INDEX IF NOT EXISTS idx_student_program_enrollments_recorded_by ON public.student_program_enrollments(recorded_by);

CREATE TABLE IF NOT EXISTS public.personnel_profiles (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  personnel_classification text NOT NULL CHECK (personnel_classification IN ('academic','non_academic')),
  employment_status text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.personnel_college_affiliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), personnel_profile_id uuid NOT NULL REFERENCES public.personnel_profiles(profile_id) ON DELETE CASCADE,
  college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE RESTRICT, effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date, is_active boolean NOT NULL DEFAULT true, recorded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), CHECK (effective_to IS NULL OR effective_to>=effective_from)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_personnel_one_active_college ON public.personnel_college_affiliations(personnel_profile_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_personnel_college_affiliation_college ON public.personnel_college_affiliations(college_id);
CREATE INDEX IF NOT EXISTS idx_personnel_college_affiliation_recorded_by ON public.personnel_college_affiliations(recorded_by);

CREATE TABLE IF NOT EXISTS public.personnel_program_affiliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), personnel_profile_id uuid NOT NULL REFERENCES public.personnel_profiles(profile_id) ON DELETE CASCADE,
  academic_program_id uuid NOT NULL REFERENCES public.academic_programs(id) ON DELETE RESTRICT, effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date, is_active boolean NOT NULL DEFAULT true, recorded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), CHECK (effective_to IS NULL OR effective_to>=effective_from)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_personnel_program_active_pair ON public.personnel_program_affiliations(personnel_profile_id,academic_program_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_personnel_program_affiliation_program ON public.personnel_program_affiliations(academic_program_id);
CREATE INDEX IF NOT EXISTS idx_personnel_program_affiliation_recorded_by ON public.personnel_program_affiliations(recorded_by);

CREATE TABLE IF NOT EXISTS public.personnel_administrative_unit_affiliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), personnel_profile_id uuid NOT NULL REFERENCES public.personnel_profiles(profile_id) ON DELETE CASCADE,
  administrative_unit_id uuid NOT NULL REFERENCES public.administrative_units(id) ON DELETE RESTRICT, effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date, is_active boolean NOT NULL DEFAULT true, recorded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), CHECK (effective_to IS NULL OR effective_to>=effective_from)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_personnel_one_active_admin_unit ON public.personnel_administrative_unit_affiliations(personnel_profile_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_personnel_admin_affiliation_unit ON public.personnel_administrative_unit_affiliations(administrative_unit_id);
CREATE INDEX IF NOT EXISTS idx_personnel_admin_affiliation_recorded_by ON public.personnel_administrative_unit_affiliations(recorded_by);

CREATE TABLE IF NOT EXISTS public.dean_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), personnel_profile_id uuid NOT NULL REFERENCES public.personnel_profiles(profile_id) ON DELETE RESTRICT,
  college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE RESTRICT, effective_from date NOT NULL DEFAULT CURRENT_DATE, effective_to date,
  is_active boolean NOT NULL DEFAULT true, assigned_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assigned_at timestamptz NOT NULL DEFAULT now(), ended_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ended_at timestamptz, end_reason text, CHECK (effective_to IS NULL OR effective_to>=effective_from)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_dean_one_active_per_college ON public.dean_assignments(college_id) WHERE is_active;
CREATE UNIQUE INDEX IF NOT EXISTS uq_dean_one_active_per_personnel ON public.dean_assignments(personnel_profile_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_dean_assignments_assigned_by ON public.dean_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_dean_assignments_ended_by ON public.dean_assignments(ended_by);

CREATE TABLE IF NOT EXISTS public.program_coordinator_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), personnel_profile_id uuid NOT NULL REFERENCES public.personnel_profiles(profile_id) ON DELETE RESTRICT,
  academic_program_id uuid NOT NULL REFERENCES public.academic_programs(id) ON DELETE RESTRICT, effective_from date NOT NULL DEFAULT CURRENT_DATE, effective_to date,
  is_active boolean NOT NULL DEFAULT true, assigned_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assigned_at timestamptz NOT NULL DEFAULT now(), ended_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ended_at timestamptz, end_reason text, CHECK (effective_to IS NULL OR effective_to>=effective_from)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_program_one_active_coordinator ON public.program_coordinator_assignments(academic_program_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_program_coordinator_personnel ON public.program_coordinator_assignments(personnel_profile_id);
CREATE INDEX IF NOT EXISTS idx_program_coordinator_assigned_by ON public.program_coordinator_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_program_coordinator_ended_by ON public.program_coordinator_assignments(ended_by);

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL UNIQUE,
  scope text NOT NULL CHECK (scope IN ('university','college')),
  category text NOT NULL CHECK (category IN ('academic_college','ministry_religious','institutional','socio_cultural_performing','other_non_academic')),
  college_id uuid REFERENCES public.colleges(id) ON DELETE RESTRICT, status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','archived')),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((scope='university' AND college_id IS NULL) OR (scope='college' AND college_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_organizations_college ON public.organizations(college_id);
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations(created_by);
CREATE TABLE IF NOT EXISTS public.organization_programs (
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  academic_program_id uuid NOT NULL REFERENCES public.academic_programs(id) ON DELETE RESTRICT,
  PRIMARY KEY (organization_id,academic_program_id)
);
CREATE INDEX IF NOT EXISTS idx_organization_programs_program ON public.organization_programs(academic_program_id);
CREATE TABLE IF NOT EXISTS public.organization_moderator_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  personnel_profile_id uuid NOT NULL REFERENCES public.personnel_profiles(profile_id) ON DELETE RESTRICT,
  effective_from date NOT NULL DEFAULT CURRENT_DATE, effective_to date, is_active boolean NOT NULL DEFAULT true,
  assigned_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT, assigned_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz, end_reason text, CHECK (effective_to IS NULL OR effective_to>=effective_from)
);
DO $$
DECLARE conflicting_organizations text;
BEGIN
  SELECT string_agg(organization_id::text, ', ' ORDER BY organization_id::text)
  INTO conflicting_organizations
  FROM (
    SELECT organization_id
    FROM public.organization_moderator_assignments
    WHERE is_active
    GROUP BY organization_id
    HAVING count(*) > 1
  ) conflicts;

  IF conflicting_organizations IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot enforce one active Organization Moderator; conflicting organization IDs: %', conflicting_organizations;
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS uq_org_moderator_one_active_per_organization
  ON public.organization_moderator_assignments(organization_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_org_moderator_organization ON public.organization_moderator_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_moderator_personnel ON public.organization_moderator_assignments(personnel_profile_id);
CREATE INDEX IF NOT EXISTS idx_org_moderator_assigned_by ON public.organization_moderator_assignments(assigned_by);

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_program_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_college_affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_program_affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_administrative_unit_affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dean_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_coordinator_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_moderator_assignments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.student_profiles, public.student_program_enrollments, public.personnel_profiles,
  public.personnel_college_affiliations, public.personnel_program_affiliations,
  public.personnel_administrative_unit_affiliations, public.dean_assignments,
  public.program_coordinator_assignments, public.organizations, public.organization_programs,
  public.organization_moderator_assignments FROM PUBLIC, anon, authenticated;
SQL);
    }

    public function down()
    {
        $this->db->query('DROP INDEX IF EXISTS public.uq_org_moderator_one_active_per_organization');
        // Assignment tables and their history are intentionally retained.
    }
}
