<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateIdentityAndAcademicFoundation extends Migration
{
    public function up()
    {
        $this->db->query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

        $this->db->query(<<<'SQL'
CREATE TABLE public.roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role_key text NOT NULL UNIQUE CHECK (role_key = lower(role_key) AND role_key ~ '^[a-z][a-z0-9_]*$'),
    display_name text NOT NULL CHECK (btrim(display_name) <> ''),
    description text,
    created_at timestamptz NOT NULL DEFAULT now()
)
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE public.colleges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE CHECK (btrim(code) <> ''),
    name text NOT NULL CHECK (btrim(name) <> ''),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
)
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE public.departments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE RESTRICT,
    code text NOT NULL UNIQUE CHECK (btrim(code) <> ''),
    name text NOT NULL CHECK (btrim(name) <> ''),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
)
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE public.degree_programs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    code text NOT NULL UNIQUE CHECK (btrim(code) <> ''),
    name text NOT NULL CHECK (btrim(name) <> ''),
    degree_level text NOT NULL CHECK (btrim(degree_level) <> ''),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
)
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    institutional_id text NOT NULL UNIQUE
        CHECK (institutional_id = btrim(institutional_id) AND institutional_id <> '' AND position('-' IN institutional_id) = 0),
    institutional_email text NOT NULL
        CHECK (
            institutional_email = lower(btrim(institutional_email))
            AND institutional_email ~ '^[^@[:space:]]+@ndmu\.edu\.ph$'
        ),
    full_name text NOT NULL CHECK (btrim(full_name) <> ''),
    account_type text NOT NULL CHECK (account_type IN ('student', 'personnel')),
    department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
    degree_program_id uuid REFERENCES public.degree_programs(id) ON DELETE SET NULL,
    designation text,
    year_level text,
    avatar_url text,
    status text NOT NULL DEFAULT 'provisioned'
        CHECK (status IN ('provisioned', 'active', 'suspended', 'archived')),
    provisioning_method text NOT NULL CHECK (provisioning_method IN ('manual', 'roster_csv', 'roster_xlsx')),
    must_change_password boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    provisioned_at timestamptz NOT NULL DEFAULT now(),
    activated_at timestamptz,
    last_login_at timestamptz,
    suspended_at timestamptz,
    suspended_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    suspension_reason text,
    archived_at timestamptz,
    archived_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    archive_reason text,
    restored_at timestamptz,
    restored_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT profiles_student_program_check CHECK (
        account_type = 'student' OR degree_program_id IS NULL
    ),
    CONSTRAINT profiles_archived_details_check CHECK (
        status <> 'archived' OR (archived_at IS NOT NULL AND archived_by IS NOT NULL AND btrim(archive_reason) <> '')
    ),
    CONSTRAINT profiles_suspended_details_check CHECK (
        status <> 'suspended' OR (suspended_at IS NOT NULL AND suspended_by IS NOT NULL AND btrim(suspension_reason) <> '')
    )
)
SQL);

        $this->db->query('CREATE UNIQUE INDEX uq_profiles_institutional_email ON public.profiles (lower(institutional_email))');

        $this->db->query(<<<'SQL'
CREATE TABLE public.profile_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    scope_type text NOT NULL DEFAULT 'university'
        CHECK (scope_type IN ('university', 'college', 'department', 'degree_program', 'organization')),
    scope_id uuid,
    is_active boolean NOT NULL DEFAULT true,
    assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz,
    CONSTRAINT profile_roles_scope_check CHECK (
        (scope_type = 'university' AND scope_id IS NULL)
        OR (scope_type <> 'university' AND scope_id IS NOT NULL)
    ),
    CONSTRAINT profile_roles_revocation_check CHECK (
        (is_active AND revoked_at IS NULL) OR (NOT is_active AND revoked_at IS NOT NULL)
    )
)
SQL);

        $this->db->query(<<<'SQL'
CREATE UNIQUE INDEX uq_profile_roles_assignment
ON public.profile_roles (profile_id, role_id, scope_type, scope_id) NULLS NOT DISTINCT
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE public.account_lifecycle_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    event_type text NOT NULL CHECK (event_type IN ('provisioned', 'activated', 'suspended', 'archived', 'restored')),
    performed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason text,
    occurred_at timestamptz NOT NULL DEFAULT now()
)
SQL);

        $this->db->query(<<<'SQL'
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$
SQL);
        $this->db->query('REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC');

        foreach (['colleges', 'departments', 'degree_programs', 'profiles'] as $table) {
            $this->db->query("CREATE TRIGGER set_{$table}_updated_at BEFORE UPDATE ON public.{$table} FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()");
        }

        $indexes = [
            'CREATE INDEX idx_departments_college_id ON public.departments(college_id)',
            'CREATE INDEX idx_degree_programs_department_id ON public.degree_programs(department_id)',
            'CREATE INDEX idx_profiles_department_id ON public.profiles(department_id)',
            'CREATE INDEX idx_profiles_degree_program_id ON public.profiles(degree_program_id)',
            'CREATE INDEX idx_profiles_created_by ON public.profiles(created_by)',
            'CREATE INDEX idx_profiles_suspended_by ON public.profiles(suspended_by)',
            'CREATE INDEX idx_profiles_archived_by ON public.profiles(archived_by)',
            'CREATE INDEX idx_profiles_restored_by ON public.profiles(restored_by)',
            'CREATE INDEX idx_profile_roles_profile_id ON public.profile_roles(profile_id)',
            'CREATE INDEX idx_profile_roles_role_id ON public.profile_roles(role_id)',
            'CREATE INDEX idx_profile_roles_assigned_by ON public.profile_roles(assigned_by)',
            'CREATE INDEX idx_account_lifecycle_events_profile_id ON public.account_lifecycle_events(profile_id)',
            'CREATE INDEX idx_account_lifecycle_events_performed_by ON public.account_lifecycle_events(performed_by)',
        ];

        foreach ($indexes as $index) {
            $this->db->query($index);
        }

        foreach (['roles', 'colleges', 'departments', 'degree_programs', 'profiles', 'profile_roles', 'account_lifecycle_events'] as $table) {
            $this->db->query("ALTER TABLE public.{$table} ENABLE ROW LEVEL SECURITY");
            $this->db->query("REVOKE ALL ON TABLE public.{$table} FROM anon, authenticated");
        }

        $this->db->query(<<<'SQL'
INSERT INTO public.roles (role_key, display_name, description) VALUES
    ('student', 'Student', 'Student achievement and portfolio access'),
    ('personnel', 'Personnel', 'Personnel or faculty portfolio access'),
    ('department_secretary', 'Department Secretary', 'Department-scoped verification access'),
    ('program_coordinator', 'Program Coordinator', 'Program-scoped coordination access'),
    ('organization_moderator', 'Organization Moderator', 'Organization-scoped event access'),
    ('hr_staff', 'HR Staff', 'Personnel account provisioning and governance access'),
    ('osad_staff', 'OSAD Staff', 'Student account provisioning and student-affairs access')
SQL);
    }

    public function down()
    {
        $this->db->query('DROP TABLE IF EXISTS public.account_lifecycle_events');
        $this->db->query('DROP TABLE IF EXISTS public.profile_roles');
        $this->db->query('DROP TABLE IF EXISTS public.profiles');
        $this->db->query('DROP TABLE IF EXISTS public.degree_programs');
        $this->db->query('DROP TABLE IF EXISTS public.departments');
        $this->db->query('DROP TABLE IF EXISTS public.colleges');
        $this->db->query('DROP TABLE IF EXISTS public.roles');
        $this->db->query('DROP FUNCTION IF EXISTS public.set_updated_at()');
    }
}
