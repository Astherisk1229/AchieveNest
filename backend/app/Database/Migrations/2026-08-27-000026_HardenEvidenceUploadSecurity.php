<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class HardenEvidenceUploadSecurity extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
DO $$ BEGIN
 IF to_regclass('public.student_portfolio_evidence') IS NULL OR to_regclass('public.personnel_accomplishment_evidence') IS NULL THEN
  RAISE EXCEPTION 'Target evidence tables must exist before evidence security hardening';
 END IF;
END $$;
ALTER TABLE public.student_portfolio_evidence
 ADD COLUMN IF NOT EXISTS security_status text NOT NULL DEFAULT 'pending', ADD COLUMN IF NOT EXISTS detected_mime_type text,
 ADD COLUMN IF NOT EXISTS sha256 text, ADD COLUMN IF NOT EXISTS malware_scanner text, ADD COLUMN IF NOT EXISTS security_validated_at timestamptz;
ALTER TABLE public.personnel_accomplishment_evidence
 ADD COLUMN IF NOT EXISTS security_status text NOT NULL DEFAULT 'pending', ADD COLUMN IF NOT EXISTS detected_mime_type text,
 ADD COLUMN IF NOT EXISTS sha256 text, ADD COLUMN IF NOT EXISTS malware_scanner text, ADD COLUMN IF NOT EXISTS security_validated_at timestamptz;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ck_student_evidence_security_status') THEN ALTER TABLE public.student_portfolio_evidence ADD CONSTRAINT ck_student_evidence_security_status CHECK(security_status IN ('pending','clean','rejected','quarantined')); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ck_personnel_evidence_security_status') THEN ALTER TABLE public.personnel_accomplishment_evidence ADD CONSTRAINT ck_personnel_evidence_security_status CHECK(security_status IN ('pending','clean','rejected','quarantined')); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ck_student_evidence_sha256') THEN ALTER TABLE public.student_portfolio_evidence ADD CONSTRAINT ck_student_evidence_sha256 CHECK(sha256 IS NULL OR sha256~'^[a-f0-9]{64}$'); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ck_personnel_evidence_sha256') THEN ALTER TABLE public.personnel_accomplishment_evidence ADD CONSTRAINT ck_personnel_evidence_sha256 CHECK(sha256 IS NULL OR sha256~'^[a-f0-9]{64}$'); END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.file_security_audit_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
 evidence_domain text NOT NULL CHECK(evidence_domain IN ('student_portfolio','personnel_accomplishment')), evidence_id uuid NOT NULL,
 storage_bucket text NOT NULL, storage_path text NOT NULL, detected_mime_type text NOT NULL, byte_size bigint NOT NULL CHECK(byte_size>0),
 sha256 text NOT NULL CHECK(sha256~'^[a-f0-9]{64}$'), scanner text NOT NULL,
 result text NOT NULL CHECK(result IN ('clean','rejected','scan_error')), details jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_file_security_audit_evidence ON public.file_security_audit_events(evidence_domain,evidence_id,created_at DESC);
ALTER TABLE public.file_security_audit_events ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.file_security_audit_events TO service_role;
DROP POLICY IF EXISTS student_evidence_insert_own ON storage.objects; DROP POLICY IF EXISTS student_evidence_select_own ON storage.objects;
DROP POLICY IF EXISTS personnel_evidence_insert_own ON storage.objects; DROP POLICY IF EXISTS personnel_evidence_select_own ON storage.objects;
DROP POLICY IF EXISTS hr_read_personnel_evidence ON storage.objects;
DROP POLICY IF EXISTS student_insert_own_portfolio_evidence ON public.student_portfolio_evidence;
REVOKE INSERT,UPDATE,DELETE ON public.student_portfolio_evidence FROM authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.personnel_accomplishment_evidence FROM authenticated;
REVOKE ALL ON public.file_security_audit_events FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.require_clean_student_evidence() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$ BEGIN
 IF NEW.security_status<>'clean' OR NEW.detected_mime_type IS NULL OR NEW.sha256 IS NULL OR NEW.malware_scanner IS NULL
 OR NEW.security_validated_at IS NULL OR NEW.checksum IS DISTINCT FROM NEW.sha256 OR NEW.mime_type IS DISTINCT FROM NEW.detected_mime_type
 THEN RAISE EXCEPTION 'Student evidence must pass backend security validation before registration'; END IF; RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.require_clean_personnel_evidence() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$ BEGIN
 IF NEW.security_status<>'clean' OR NEW.detected_mime_type IS NULL OR NEW.sha256 IS NULL OR NEW.malware_scanner IS NULL
 OR NEW.security_validated_at IS NULL OR NEW.checksum IS DISTINCT FROM NEW.sha256 OR NEW.mime_type IS DISTINCT FROM NEW.detected_mime_type
 THEN RAISE EXCEPTION 'Personnel evidence must pass backend security validation before registration'; END IF; RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_require_clean_student_evidence ON public.student_portfolio_evidence;
CREATE TRIGGER trg_require_clean_student_evidence BEFORE INSERT OR UPDATE OF storage_path,mime_type,checksum,security_status,detected_mime_type,sha256,malware_scanner,security_validated_at ON public.student_portfolio_evidence FOR EACH ROW EXECUTE FUNCTION public.require_clean_student_evidence();
DROP TRIGGER IF EXISTS trg_require_clean_personnel_evidence ON public.personnel_accomplishment_evidence;
CREATE TRIGGER trg_require_clean_personnel_evidence BEFORE INSERT OR UPDATE OF storage_path,mime_type,checksum,security_status,detected_mime_type,sha256,malware_scanner,security_validated_at ON public.personnel_accomplishment_evidence FOR EACH ROW EXECUTE FUNCTION public.require_clean_personnel_evidence();
REVOKE ALL ON FUNCTION public.require_clean_student_evidence(),public.require_clean_personnel_evidence() FROM PUBLIC,anon,authenticated,service_role;
SQL);
    }

    public function down()
    {
        // Evidence security is intentionally not weakened by rollback.
    }
}
