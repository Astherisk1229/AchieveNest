<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class ExpandAdminAccountTypesAndAddRoleAssignmentEvents extends Migration
{
    public function up()
    {
        // 1. Expand account_type check constraint on public.profiles
        $this->db->query(<<<'SQL'
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_account_type_check,
    ADD CONSTRAINT profiles_account_type_check
        CHECK (account_type IN ('student', 'personnel', 'hr_admin', 'osad_admin'));
SQL);

        // 2. Adjust student program check constraint to ensure only students have degree programs
        $this->db->query(<<<'SQL'
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_student_program_check,
    ADD CONSTRAINT profiles_student_program_check
        CHECK (account_type = 'student' OR degree_program_id IS NULL);
SQL);

        // 3. Drop previous non-partial unique index on profile_roles and create partial active unique index
        $this->db->query('DROP INDEX IF EXISTS public.uq_profile_roles_assignment');
        $this->db->query(<<<'SQL'
CREATE UNIQUE INDEX IF NOT EXISTS uq_profile_roles_active_assignment
ON public.profile_roles (profile_id, role_id, scope_type, scope_id) NULLS NOT DISTINCT
WHERE is_active = true;
SQL);

        // 4. Create dedicated role_assignment_events table for role governance audit trail
        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS public.role_assignment_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_role_id uuid REFERENCES public.profile_roles(id) ON DELETE SET NULL,
    target_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    event_type text NOT NULL CHECK (event_type IN ('assigned', 'revoked')),
    scope_type text NOT NULL CHECK (scope_type IN ('university', 'college', 'department', 'degree_program', 'organization')),
    scope_id uuid,
    performed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason text,
    occurred_at timestamptz NOT NULL DEFAULT now()
);
SQL);

        $this->db->query('CREATE INDEX IF NOT EXISTS idx_role_assignment_events_target ON public.role_assignment_events(target_profile_id)');
        $this->db->query('CREATE INDEX IF NOT EXISTS idx_role_assignment_events_performed_by ON public.role_assignment_events(performed_by)');
    }

    public function down()
    {
        $this->db->query('DROP TABLE IF EXISTS public.role_assignment_events CASCADE');
        $this->db->query('DROP INDEX IF EXISTS public.uq_profile_roles_active_assignment');
        $this->db->query(<<<'SQL'
CREATE UNIQUE INDEX IF NOT EXISTS uq_profile_roles_assignment
ON public.profile_roles (profile_id, role_id, scope_type, scope_id) NULLS NOT DISTINCT;
SQL);
        $this->db->query(<<<'SQL'
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_account_type_check,
    ADD CONSTRAINT profiles_account_type_check
        CHECK (account_type IN ('student', 'personnel'));
SQL);
    }
}
