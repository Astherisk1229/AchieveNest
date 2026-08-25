<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreatePasswordResetRequestsDomain extends Migration
{
    public function up()
    {
        $this->db->query('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false');

        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    institutional_email text NOT NULL CHECK (btrim(institutional_email) <> ''),
    account_type text NOT NULL CHECK (account_type IN ('student', 'personnel')),
    assigned_office text NOT NULL CHECK (assigned_office IN ('osad', 'hr')),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
    requested_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    handled_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    rejection_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pw_reset_req_user_status ON public.password_reset_requests (user_id, status);
CREATE INDEX IF NOT EXISTS idx_pw_reset_req_office_status ON public.password_reset_requests (assigned_office, status);
CREATE INDEX IF NOT EXISTS idx_pw_reset_req_email ON public.password_reset_requests (institutional_email);

CREATE TABLE IF NOT EXISTS public.password_reset_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid REFERENCES public.password_reset_requests(id) ON DELETE SET NULL,
    actor_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action text NOT NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pw_reset_events_target ON public.password_reset_events (target_user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_pw_reset_events_request ON public.password_reset_events (request_id);
SQL);
    }

    public function down()
    {
        $this->db->query('DROP TABLE IF EXISTS public.password_reset_events CASCADE');
        $this->db->query('DROP TABLE IF EXISTS public.password_reset_requests CASCADE');
        $this->db->query('ALTER TABLE public.profiles DROP COLUMN IF EXISTS must_change_password');
    }
}
