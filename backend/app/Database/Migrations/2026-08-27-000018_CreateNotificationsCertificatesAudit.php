<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateNotificationsCertificatesAudit extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), recipient_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, notification_type text NOT NULL,
  title text NOT NULL, message text NOT NULL, reference_type text, reference_id uuid,
  is_mandatory boolean NOT NULL DEFAULT true, read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON public.notifications(recipient_profile_id,created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_actor ON public.notifications(actor_profile_id);
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_code text NOT NULL, category text NOT NULL,
  actor_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, actor_context text,
  target_type text, target_id uuid, outcome text, details text NOT NULL, request_id text,
  source_ip inet, user_agent text, safe_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_time ON public.audit_logs(actor_profile_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_type,target_id);
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT,
  title text NOT NULL, category text, event_date date NOT NULL, start_time time, end_time time, venue text,
  description text, target_audience text, status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','ongoing','completed','archived')),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_organization ON public.events(organization_id);
CREATE TABLE IF NOT EXISTS public.certificate_template_families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL,
  allowed_contexts jsonb NOT NULL DEFAULT '[]'::jsonb, status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  current_published_version_id uuid, created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_certificate_template_families_created_by ON public.certificate_template_families(created_by);
CREATE INDEX IF NOT EXISTS idx_certificate_template_families_current_version ON public.certificate_template_families(current_published_version_id);
CREATE TABLE IF NOT EXISTS public.certificate_template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), template_family_id uuid NOT NULL REFERENCES public.certificate_template_families(id) ON DELETE CASCADE,
  version_number integer NOT NULL CHECK (version_number>0), status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','retired')),
  content_schema jsonb NOT NULL, layout_schema jsonb NOT NULL, signatory_slots jsonb, change_summary text,
  published_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL, published_at timestamptz,
  UNIQUE(template_family_id,version_number)
);
CREATE INDEX IF NOT EXISTS idx_certificate_template_versions_published_by ON public.certificate_template_versions(published_by);
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_certificate_template_current_version' AND conrelid='public.certificate_template_families'::regclass) THEN
  ALTER TABLE public.certificate_template_families ADD CONSTRAINT fk_certificate_template_current_version
  FOREIGN KEY (current_published_version_id) REFERENCES public.certificate_template_versions(id) DEFERRABLE INITIALLY DEFERRED;
 END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.certificate_issuance_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid REFERENCES public.events(id) ON DELETE RESTRICT,
  template_version_id uuid NOT NULL REFERENCES public.certificate_template_versions(id) ON DELETE RESTRICT,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT, idempotency_key text NOT NULL UNIQUE,
  recipient_count integer NOT NULL DEFAULT 0 CHECK (recipient_count>=0), issued_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  issued_at timestamptz NOT NULL DEFAULT now(), status text NOT NULL CHECK (status IN ('completed','partially_completed','revoked'))
);
CREATE INDEX IF NOT EXISTS idx_certificate_batches_event ON public.certificate_issuance_batches(event_id);
CREATE INDEX IF NOT EXISTS idx_certificate_batches_issued_by ON public.certificate_issuance_batches(issued_by);
CREATE INDEX IF NOT EXISTS idx_certificate_batches_organization ON public.certificate_issuance_batches(organization_id);
CREATE INDEX IF NOT EXISTS idx_certificate_batches_template_version ON public.certificate_issuance_batches(template_version_id);
CREATE TABLE IF NOT EXISTS public.issued_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), batch_id uuid NOT NULL REFERENCES public.certificate_issuance_batches(id) ON DELETE CASCADE,
  certificate_number text NOT NULL UNIQUE, recipient_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  event_id uuid REFERENCES public.events(id) ON DELETE RESTRICT, template_version_id uuid NOT NULL REFERENCES public.certificate_template_versions(id) ON DELETE RESTRICT,
  render_snapshot jsonb NOT NULL, signatory_snapshot jsonb NOT NULL, verification_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')), issued_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz, revoked_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL, revocation_reason text
);
CREATE INDEX IF NOT EXISTS idx_issued_certificates_batch ON public.issued_certificates(batch_id);
CREATE INDEX IF NOT EXISTS idx_issued_certificates_event ON public.issued_certificates(event_id);
CREATE INDEX IF NOT EXISTS idx_issued_certificates_recipient ON public.issued_certificates(recipient_profile_id);
CREATE INDEX IF NOT EXISTS idx_issued_certificates_revoked_by ON public.issued_certificates(revoked_by);
CREATE INDEX IF NOT EXISTS idx_issued_certificates_template_version ON public.issued_certificates(template_version_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_template_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_issuance_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issued_certificates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.notifications, public.notification_preferences, public.audit_logs, public.events,
 public.certificate_template_families, public.certificate_template_versions,
 public.certificate_issuance_batches, public.issued_certificates FROM PUBLIC, anon, authenticated;
SQL);
    }

    public function down()
    {
        // Notifications, audit logs, and issued certificates are retained on rollback.
    }
}
