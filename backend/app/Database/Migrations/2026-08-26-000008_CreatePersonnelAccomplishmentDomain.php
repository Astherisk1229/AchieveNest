<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreatePersonnelAccomplishmentDomain extends Migration
{
    public function up()
    {
        $db = $this->db;

        // 1. personnel_accomplishments — persisted portfolio items
        $db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS public.personnel_accomplishments (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_profile_id uuid  NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_code   text        NOT NULL CHECK (btrim(category_code) <> ''),
    category_area   text        NOT NULL CHECK (category_area IN ('areaA', 'areaB', 'areaC')),
    title           text        NOT NULL CHECK (btrim(title) <> ''),
    category_metadata jsonb     NOT NULL DEFAULT '{}'::jsonb,
    date_achieved   date,
    description     text,
    status          text        NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft', 'submitted', 'under_review', 'verified', 'rejected')),
    rejection_reason text,
    submitted_at    timestamptz,
    reviewed_at     timestamptz,
    reviewed_by     uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
)
SQL);

        // 2. personnel_accomplishment_evidence — private evidence files
        $db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS public.personnel_accomplishment_evidence (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    accomplishment_id   uuid        NOT NULL REFERENCES public.personnel_accomplishments(id) ON DELETE CASCADE,
    storage_path        text        NOT NULL CHECK (btrim(storage_path) <> ''),
    original_filename   text        NOT NULL CHECK (btrim(original_filename) <> ''),
    mime_type           text        NOT NULL CHECK (btrim(mime_type) <> ''),
    byte_size           bigint      NOT NULL CHECK (byte_size > 0),
    checksum            text,
    uploaded_by         uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
    uploaded_at         timestamptz NOT NULL DEFAULT now()
)
SQL);

        // 3. Add real FK on personnel_evaluation_items.accomplishment_id
        $db->query(<<<'SQL'
ALTER TABLE public.personnel_evaluation_items
    ADD CONSTRAINT fk_eval_items_accomplishment
    FOREIGN KEY (accomplishment_id)
    REFERENCES public.personnel_accomplishments(id)
    ON DELETE SET NULL
    NOT VALID
SQL);

        // 4. Validate the constraint (safe for existing 0-row table)
        $db->query('ALTER TABLE public.personnel_evaluation_items VALIDATE CONSTRAINT fk_eval_items_accomplishment');

        // 5. updated_at triggers
        foreach (['personnel_accomplishments'] as $table) {
            $db->query("CREATE TRIGGER set_{$table}_updated_at
                BEFORE UPDATE ON public.{$table}
                FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()");
        }

        // 6. Indexes
        $db->query('CREATE INDEX IF NOT EXISTS idx_accomplishments_personnel
            ON public.personnel_accomplishments(personnel_profile_id)');
        $db->query('CREATE INDEX IF NOT EXISTS idx_accomplishments_status
            ON public.personnel_accomplishments(status)');
        $db->query('CREATE INDEX IF NOT EXISTS idx_accomplishments_category
            ON public.personnel_accomplishments(category_code)');
        $db->query('CREATE INDEX IF NOT EXISTS idx_accomplishment_evidence_acc
            ON public.personnel_accomplishment_evidence(accomplishment_id)');

        // 7. Enable RLS
        foreach (['personnel_accomplishments', 'personnel_accomplishment_evidence'] as $table) {
            $db->query("ALTER TABLE public.{$table} ENABLE ROW LEVEL SECURITY");
            $db->query("REVOKE ALL ON TABLE public.{$table} FROM anon, authenticated");
        }

        // 8. RLS Policies — personnel_accomplishments
        // Personnel may SELECT their own accomplishments
        $db->query(<<<'SQL'
CREATE POLICY "personnel_select_own_accomplishments"
  ON public.personnel_accomplishments FOR SELECT
  TO authenticated
  USING (personnel_profile_id = (SELECT auth.uid()))
SQL);

        // HR Admin may SELECT all personnel accomplishments
        $db->query(<<<'SQL'
CREATE POLICY "hr_admin_select_all_accomplishments"
  ON public.personnel_accomplishments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.profile_roles pr ON pr.profile_id = p.id
      JOIN public.roles r ON r.id = pr.role_id
      WHERE p.id = (SELECT auth.uid())
        AND p.account_type = 'hr_admin'
        AND r.role_key = 'hr_staff'
        AND pr.is_active = true
    )
  )
SQL);

        // Dean may SELECT accomplishments of Personnel in their college.
        // profile.department_id is a department UUID, so resolve its college
        // instead of comparing a college scope directly to a department UUID.
        $db->query(<<<'SQL'
CREATE POLICY "dean_select_college_accomplishments"
  ON public.personnel_accomplishments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profile_roles pr
      JOIN public.roles r ON r.id = pr.role_id
      JOIN public.profiles target ON target.id = personnel_accomplishments.personnel_profile_id
      JOIN public.departments target_department ON target_department.id = target.department_id
      WHERE pr.profile_id = (SELECT auth.uid())
        AND r.role_key = 'dean'
        AND pr.is_active = true
        AND pr.scope_type = 'college'
        AND pr.scope_id = target_department.college_id
    )
  )
SQL);

        // Personnel INSERT their own accomplishments
        $db->query(<<<'SQL'
CREATE POLICY "personnel_insert_own_accomplishments"
  ON public.personnel_accomplishments FOR INSERT
  TO authenticated
  WITH CHECK (personnel_profile_id = (SELECT auth.uid()))
SQL);

        // Personnel UPDATE their own draft/returned accomplishments
        $db->query(<<<'SQL'
CREATE POLICY "personnel_update_own_draft_accomplishments"
  ON public.personnel_accomplishments FOR UPDATE
  TO authenticated
  USING (
    personnel_profile_id = (SELECT auth.uid())
    AND status IN ('draft', 'rejected')
  )
  WITH CHECK (personnel_profile_id = (SELECT auth.uid()))
SQL);

        // HR Admin UPDATE (for review)
        $db->query(<<<'SQL'
CREATE POLICY "hr_admin_update_accomplishments"
  ON public.personnel_accomplishments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.profile_roles pr ON pr.profile_id = p.id
      JOIN public.roles r ON r.id = pr.role_id
      WHERE p.id = (SELECT auth.uid())
        AND p.account_type = 'hr_admin'
        AND r.role_key = 'hr_staff'
        AND pr.is_active = true
    )
  )
  WITH CHECK (true)
SQL);

        // personnel_accomplishment_evidence policies
        $db->query(<<<'SQL'
CREATE POLICY "personnel_select_own_evidence"
  ON public.personnel_accomplishment_evidence FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.personnel_accomplishments a
      WHERE a.id = personnel_accomplishment_evidence.accomplishment_id
        AND a.personnel_profile_id = (SELECT auth.uid())
    )
  )
SQL);

        $db->query(<<<'SQL'
CREATE POLICY "hr_admin_select_all_evidence"
  ON public.personnel_accomplishment_evidence FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.profile_roles pr ON pr.profile_id = p.id
      JOIN public.roles r ON r.id = pr.role_id
      WHERE p.id = (SELECT auth.uid())
        AND p.account_type = 'hr_admin'
        AND r.role_key = 'hr_staff'
        AND pr.is_active = true
    )
  )
SQL);

        $db->query(<<<'SQL'
CREATE POLICY "personnel_insert_own_evidence"
  ON public.personnel_accomplishment_evidence FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.personnel_accomplishments a
      WHERE a.id = personnel_accomplishment_evidence.accomplishment_id
        AND a.personnel_profile_id = (SELECT auth.uid())
    )
  )
SQL);
    }

    public function down()
    {
        $db = $this->db;
        $db->query('ALTER TABLE public.personnel_evaluation_items DROP CONSTRAINT IF EXISTS fk_eval_items_accomplishment');
        $db->query('DROP TABLE IF EXISTS public.personnel_accomplishment_evidence CASCADE');
        $db->query('DROP TABLE IF EXISTS public.personnel_accomplishments CASCADE');
    }
}
