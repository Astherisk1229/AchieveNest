<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateIdentityAndAcademicFoundation extends Migration
{
    public function up()
    {
        $this->db->query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS public.roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role_key text NOT NULL UNIQUE,
    display_name text NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT now()
)
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS public.colleges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
)
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS public.departments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE RESTRICT,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
)
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS public.degree_programs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    degree_level text NOT NULL,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
)
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    institutional_id text UNIQUE,
    full_name text NOT NULL,
    account_type text NOT NULL CHECK (account_type IN ('student', 'personnel', 'hr_staff', 'osad_staff')),
    department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
    degree_program_id uuid REFERENCES public.degree_programs(id) ON DELETE SET NULL,
    designation text,
    year_level text,
    avatar_url text,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
)
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS public.profile_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    scope_type text NOT NULL DEFAULT 'university' CHECK (scope_type IN ('university', 'college', 'department', 'degree_program', 'organization')),
    scope_id uuid,
    is_active boolean NOT NULL DEFAULT true,
    assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz,
    UNIQUE (profile_id, role_id, scope_type, scope_id)
)
SQL);

        $this->db->query('CREATE INDEX IF NOT EXISTS idx_departments_college_id ON public.departments(college_id)');
        $this->db->query('CREATE INDEX IF NOT EXISTS idx_degree_programs_department_id ON public.degree_programs(department_id)');
        $this->db->query('CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON public.profiles(department_id)');
        $this->db->query('CREATE INDEX IF NOT EXISTS idx_profiles_degree_program_id ON public.profiles(degree_program_id)');
        $this->db->query('CREATE INDEX IF NOT EXISTS idx_profile_roles_profile_id ON public.profile_roles(profile_id)');

        foreach (['roles', 'colleges', 'departments', 'degree_programs', 'profiles', 'profile_roles'] as $table) {
            $this->db->query("ALTER TABLE public.{$table} ENABLE ROW LEVEL SECURITY");
        }

        $this->db->query(<<<'SQL'
INSERT INTO public.roles (role_key, display_name, description) VALUES
    ('student', 'Student', 'Student achievement and portfolio access'),
    ('personnel', 'Personnel', 'Personnel or faculty portfolio access'),
    ('department_secretary', 'Department Secretary', 'Department-scoped verification access'),
    ('program_coordinator', 'Program Coordinator', 'Program-scoped coordination access'),
    ('organization_moderator', 'Organization Moderator', 'Organization-scoped event access'),
    ('hr_staff', 'HR Staff', 'Personnel governance, evaluation, and ranking access'),
    ('osad_staff', 'OSAD Staff', 'Student-affairs administration access')
ON CONFLICT (role_key) DO NOTHING
SQL);
    }

    public function down()
    {
        $this->db->query('DROP TABLE IF EXISTS public.profile_roles');
        $this->db->query('DROP TABLE IF EXISTS public.profiles');
        $this->db->query('DROP TABLE IF EXISTS public.degree_programs');
        $this->db->query('DROP TABLE IF EXISTS public.departments');
        $this->db->query('DROP TABLE IF EXISTS public.colleges');
        $this->db->query('DROP TABLE IF EXISTS public.roles');
    }
}
