<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreatePersonnelEvaluationDomain extends Migration
{
    public function up()
    {
        $db = $this->db;

        // 1. Table: personnel_evaluations
        $db->query("
            CREATE TABLE IF NOT EXISTS public.personnel_evaluations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                personnel_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
                status VARCHAR(50) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_evaluation', 'ready_for_finalization', 'returned_for_revision', 'completed')),
                submission_type VARCHAR(100) NOT NULL DEFAULT 'Personnel Ranking Evaluation',
                academic_year VARCHAR(20) NOT NULL DEFAULT '2025-2026',
                evaluator_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
                tenure_years INT NOT NULL DEFAULT 0,
                total_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
                area_a_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
                area_b_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
                area_c_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
                return_reason TEXT,
                evaluator_remarks TEXT,
                final_snapshot JSONB,
                submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                evaluation_started_at TIMESTAMPTZ,
                ready_at TIMESTAMPTZ,
                finalized_at TIMESTAMPTZ,
                returned_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        ");

        // 2. Table: personnel_evaluation_items
        $db->query("
            CREATE TABLE IF NOT EXISTS public.personnel_evaluation_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                evaluation_id UUID NOT NULL REFERENCES public.personnel_evaluations(id) ON DELETE CASCADE,
                accomplishment_id UUID,
                category_area VARCHAR(20) NOT NULL CHECK (category_area IN ('areaA', 'areaB', 'areaC')),
                criterion_code VARCHAR(20) NOT NULL,
                criterion_key VARCHAR(50) NOT NULL,
                criterion_title VARCHAR(255) NOT NULL,
                evidence_title VARCHAR(255) NOT NULL,
                file_name VARCHAR(255),
                file_url TEXT,
                source_type VARCHAR(50) DEFAULT 'accomplishment',
                verification_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'ineligible', 'needs_revision')),
                rating_status VARCHAR(50) NOT NULL DEFAULT 'unrated' CHECK (rating_status IN ('unrated', 'rated', 'not_applicable')),
                awarded_points NUMERIC(5,2) NOT NULL DEFAULT 0.00,
                max_points NUMERIC(5,2) NOT NULL DEFAULT 40.00,
                scoring_mode VARCHAR(50) NOT NULL DEFAULT 'FIXED_OPTION' CHECK (scoring_mode IN ('FIXED_OPTION', 'MULTI_FACTOR', 'MANUAL_BOUNDED', 'AUTOMATIC_DERIVED', 'MIXED')),
                scoring_payload JSONB,
                evaluator_remarks TEXT,
                evaluated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
                evaluated_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        ");

        // 3. Table: personnel_evaluation_events
        $db->query("
            CREATE TABLE IF NOT EXISTS public.personnel_evaluation_events (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                evaluation_id UUID NOT NULL REFERENCES public.personnel_evaluations(id) ON DELETE CASCADE,
                event_type VARCHAR(50) NOT NULL,
                performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
                payload JSONB,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        ");

        // Indexes
        $db->query("
            CREATE INDEX IF NOT EXISTS idx_personnel_evaluations_profile ON public.personnel_evaluations(personnel_profile_id);
            CREATE INDEX IF NOT EXISTS idx_personnel_evaluations_status ON public.personnel_evaluations(status);
            CREATE INDEX IF NOT EXISTS idx_personnel_eval_items_eval ON public.personnel_evaluation_items(evaluation_id);
            CREATE INDEX IF NOT EXISTS idx_personnel_eval_events_eval ON public.personnel_evaluation_events(evaluation_id);
        ");
    }

    public function down()
    {
        $db = $this->db;
        $db->query("DROP TABLE IF EXISTS public.personnel_evaluation_events CASCADE;");
        $db->query("DROP TABLE IF EXISTS public.personnel_evaluation_items CASCADE;");
        $db->query("DROP TABLE IF EXISTS public.personnel_evaluations CASCADE;");
    }
}
