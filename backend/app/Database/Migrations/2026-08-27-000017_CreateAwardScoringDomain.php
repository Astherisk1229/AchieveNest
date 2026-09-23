<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateAwardScoringDomain extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS public.award_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL UNIQUE, description text,
  candidate_threshold_percent numeric(5,2) NOT NULL DEFAULT 80 CHECK (candidate_threshold_percent BETWEEN 0 AND 100),
  gender_restriction text CHECK (gender_restriction IN ('male','female')), graduating_only boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','archived')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.award_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), award_definition_id uuid NOT NULL REFERENCES public.award_definitions(id) ON DELETE CASCADE,
  code text NOT NULL, name text NOT NULL, max_points numeric(10,2) NOT NULL CHECK (max_points>=0), sort_order integer NOT NULL,
  is_portfolio_computable boolean NOT NULL DEFAULT true, UNIQUE(award_definition_id,code)
);
CREATE TABLE IF NOT EXISTS public.award_scoring_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), criterion_id uuid NOT NULL REFERENCES public.award_criteria(id) ON DELETE CASCADE,
  parent_rule_id uuid REFERENCES public.award_scoring_rules(id) ON DELETE CASCADE, code text NOT NULL, name text NOT NULL,
  rule_type text NOT NULL CHECK (rule_type IN ('highest_only','sum_capped','count_mapping','fixed_presence','matrix_mapping','formula','other_configured')),
  points numeric(10,2), max_points numeric(10,2) CHECK (max_points IS NULL OR max_points>=0),
  rule_config jsonb NOT NULL DEFAULT '{}'::jsonb, sort_order integer NOT NULL DEFAULT 1, UNIQUE(criterion_id,code)
);
CREATE INDEX IF NOT EXISTS idx_award_rules_parent ON public.award_scoring_rules(parent_rule_id);
CREATE TABLE IF NOT EXISTS public.award_portfolio_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), scoring_rule_id uuid NOT NULL REFERENCES public.award_scoring_rules(id) ON DELETE CASCADE,
  portfolio_category_id uuid NOT NULL REFERENCES public.portfolio_categories(id) ON DELETE RESTRICT,
  portfolio_subcategory_id uuid REFERENCES public.portfolio_subcategories(id) ON DELETE RESTRICT,
  metadata_predicate jsonb NOT NULL DEFAULT '{}'::jsonb, is_active boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_award_mappings_rule ON public.award_portfolio_mappings(scoring_rule_id);
CREATE INDEX IF NOT EXISTS idx_award_mappings_category ON public.award_portfolio_mappings(portfolio_category_id,portfolio_subcategory_id);
CREATE INDEX IF NOT EXISTS idx_award_mappings_subcategory ON public.award_portfolio_mappings(portfolio_subcategory_id);

CREATE TABLE IF NOT EXISTS public.award_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), academic_year text NOT NULL, name text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','evaluating','closed','archived')),
  opens_at timestamptz, closes_at timestamptz, created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_award_cycles_created_by ON public.award_cycles(created_by);
CREATE TABLE IF NOT EXISTS public.student_award_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), cycle_id uuid NOT NULL REFERENCES public.award_cycles(id) ON DELETE CASCADE,
  award_definition_id uuid NOT NULL REFERENCES public.award_definitions(id) ON DELETE RESTRICT,
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(profile_id) ON DELETE RESTRICT,
  evaluator_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_review','completed','superseded')),
  raw_score numeric(10,2) NOT NULL DEFAULT 0 CHECK (raw_score>=0), max_computable_score numeric(10,2) NOT NULL CHECK (max_computable_score>0),
  potential_score numeric(5,2) NOT NULL DEFAULT 0 CHECK (potential_score BETWEEN 0 AND 100),
  qualifies_portfolio_based boolean NOT NULL DEFAULT false, evaluated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_student_award_active_evaluation ON public.student_award_evaluations(cycle_id,award_definition_id,student_profile_id) WHERE status<>'superseded';
CREATE INDEX IF NOT EXISTS idx_student_award_evaluations_award ON public.student_award_evaluations(award_definition_id);
CREATE INDEX IF NOT EXISTS idx_student_award_evaluations_evaluator ON public.student_award_evaluations(evaluator_profile_id);
CREATE INDEX IF NOT EXISTS idx_student_award_evaluations_student ON public.student_award_evaluations(student_profile_id);
CREATE TABLE IF NOT EXISTS public.student_award_criterion_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), evaluation_id uuid NOT NULL REFERENCES public.student_award_evaluations(id) ON DELETE CASCADE,
  criterion_id uuid NOT NULL REFERENCES public.award_criteria(id) ON DELETE RESTRICT,
  awarded_points numeric(10,2) NOT NULL CHECK (awarded_points>=0), max_points numeric(10,2) NOT NULL CHECK (max_points>=0),
  scoring_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb, evaluator_remarks text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(evaluation_id,criterion_id)
);
CREATE INDEX IF NOT EXISTS idx_student_award_criterion_scores_criterion ON public.student_award_criterion_scores(criterion_id);
CREATE TABLE IF NOT EXISTS public.student_award_score_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), criterion_score_id uuid NOT NULL REFERENCES public.student_award_criterion_scores(id) ON DELETE CASCADE,
  portfolio_record_id uuid NOT NULL REFERENCES public.student_portfolio_records(id) ON DELETE RESTRICT,
  scoring_rule_id uuid NOT NULL REFERENCES public.award_scoring_rules(id) ON DELETE RESTRICT,
  points_effect numeric(10,2) NOT NULL DEFAULT 0, basis_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_student_award_score_evidence_portfolio ON public.student_award_score_evidence(portfolio_record_id);
CREATE INDEX IF NOT EXISTS idx_student_award_score_evidence_rule ON public.student_award_score_evidence(scoring_rule_id);

CREATE TABLE IF NOT EXISTS public.dean_student_nominations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), cycle_id uuid NOT NULL REFERENCES public.award_cycles(id) ON DELETE CASCADE,
  award_definition_id uuid NOT NULL REFERENCES public.award_definitions(id) ON DELETE RESTRICT,
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(profile_id) ON DELETE RESTRICT,
  dean_assignment_id uuid NOT NULL REFERENCES public.dean_assignments(id) ON DELETE RESTRICT,
  justification text NOT NULL, status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','withdrawn','revoked')),
  nominated_at timestamptz NOT NULL DEFAULT now(), withdrawn_at timestamptz, withdrawal_reason text
);
CREATE INDEX IF NOT EXISTS idx_dean_nominations_award ON public.dean_student_nominations(award_definition_id);
CREATE INDEX IF NOT EXISTS idx_dean_nominations_assignment ON public.dean_student_nominations(dean_assignment_id);
CREATE INDEX IF NOT EXISTS idx_dean_nominations_student ON public.dean_student_nominations(student_profile_id);
CREATE TABLE IF NOT EXISTS public.award_interview_eligibilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), cycle_id uuid NOT NULL REFERENCES public.award_cycles(id) ON DELETE CASCADE,
  award_definition_id uuid NOT NULL REFERENCES public.award_definitions(id) ON DELETE RESTRICT,
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(profile_id) ON DELETE RESTRICT,
  eligibility_source text NOT NULL CHECK (eligibility_source IN ('portfolio_based','dean_nomination')),
  evaluation_id uuid REFERENCES public.student_award_evaluations(id) ON DELETE SET NULL,
  dean_nomination_id uuid REFERENCES public.dean_student_nominations(id) ON DELETE SET NULL,
  potential_score numeric(5,2) CHECK (potential_score IS NULL OR potential_score BETWEEN 0 AND 100),
  eligible_at timestamptz NOT NULL DEFAULT now(), status text NOT NULL DEFAULT 'eligible' CHECK (status IN ('eligible','revoked')),
  revoked_at timestamptz, revoked_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL, revocation_reason text,
  CONSTRAINT ck_award_eligibility_source_reference CHECK (
    (eligibility_source='portfolio_based' AND evaluation_id IS NOT NULL AND dean_nomination_id IS NULL)
    OR (eligibility_source='dean_nomination' AND dean_nomination_id IS NOT NULL AND evaluation_id IS NULL)
  ), UNIQUE(cycle_id,award_definition_id,student_profile_id,eligibility_source)
);
CREATE INDEX IF NOT EXISTS idx_award_eligibility_award ON public.award_interview_eligibilities(award_definition_id);
CREATE INDEX IF NOT EXISTS idx_award_eligibility_nomination ON public.award_interview_eligibilities(dean_nomination_id);
CREATE INDEX IF NOT EXISTS idx_award_eligibility_evaluation ON public.award_interview_eligibilities(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_award_eligibility_revoked_by ON public.award_interview_eligibilities(revoked_by);
CREATE INDEX IF NOT EXISTS idx_award_eligibility_student ON public.award_interview_eligibilities(student_profile_id);

ALTER TABLE public.award_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_portfolio_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_award_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_award_criterion_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_award_score_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dean_student_nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_interview_eligibilities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.award_definitions, public.award_criteria, public.award_scoring_rules, public.award_portfolio_mappings,
 public.award_cycles, public.student_award_evaluations, public.student_award_criterion_scores,
 public.student_award_score_evidence, public.dean_student_nominations, public.award_interview_eligibilities FROM PUBLIC, anon, authenticated;
SQL);
    }

    public function down()
    {
        // Award configuration and evaluation history are retained on rollback.
    }
}
