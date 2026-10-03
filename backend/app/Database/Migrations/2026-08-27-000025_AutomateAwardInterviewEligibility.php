<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AutomateAwardInterviewEligibility extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
CREATE OR REPLACE FUNCTION public.calculate_portfolio_potential_score() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
DECLARE threshold numeric(5,2); computed_score numeric(5,2); BEGIN
 SELECT candidate_threshold_percent INTO threshold FROM public.award_definitions WHERE id=NEW.award_definition_id;
 computed_score:=LEAST(100,GREATEST(0,ROUND((NEW.raw_score/NULLIF(NEW.max_computable_score,0))*100,2)));
 NEW.potential_score:=computed_score;
 NEW.qualifies_portfolio_based:=(NEW.status='completed' AND computed_score>=threshold);
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.sync_portfolio_based_award_eligibility_after_write() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$ BEGIN
 IF NEW.qualifies_portfolio_based THEN
  INSERT INTO public.award_interview_eligibilities(cycle_id,award_definition_id,student_profile_id,eligibility_source,evaluation_id,dean_nomination_id,potential_score,eligible_at,status)
  VALUES(NEW.cycle_id,NEW.award_definition_id,NEW.student_profile_id,'portfolio_based',NEW.id,NULL,NEW.potential_score,COALESCE(NEW.evaluated_at,now()),'eligible')
  ON CONFLICT(cycle_id,award_definition_id,student_profile_id,eligibility_source) DO UPDATE SET
   evaluation_id=EXCLUDED.evaluation_id,dean_nomination_id=NULL,potential_score=EXCLUDED.potential_score,
   eligible_at=EXCLUDED.eligible_at,status='eligible',revoked_at=NULL,revoked_by=NULL,revocation_reason=NULL;
 ELSE
  UPDATE public.award_interview_eligibilities SET status='revoked',revoked_at=COALESCE(revoked_at,now()),
   revocation_reason=COALESCE(revocation_reason,'Portfolio-based eligibility no longer qualifies')
  WHERE cycle_id=NEW.cycle_id AND award_definition_id=NEW.award_definition_id AND student_profile_id=NEW.student_profile_id
   AND eligibility_source='portfolio_based' AND status='eligible';
 END IF; RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.sync_dean_nomination_eligibility() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$ BEGIN
 IF NEW.status='active' THEN
  INSERT INTO public.award_interview_eligibilities(cycle_id,award_definition_id,student_profile_id,eligibility_source,evaluation_id,dean_nomination_id,potential_score,eligible_at,status)
  VALUES(NEW.cycle_id,NEW.award_definition_id,NEW.student_profile_id,'dean_nomination',NULL,NEW.id,NULL,NEW.nominated_at,'eligible')
  ON CONFLICT(cycle_id,award_definition_id,student_profile_id,eligibility_source) DO UPDATE SET
   dean_nomination_id=EXCLUDED.dean_nomination_id,evaluation_id=NULL,potential_score=NULL,eligible_at=EXCLUDED.eligible_at,
   status='eligible',revoked_at=NULL,revoked_by=NULL,revocation_reason=NULL;
 ELSE
  UPDATE public.award_interview_eligibilities SET status='revoked',revoked_at=COALESCE(revoked_at,now()),
   revocation_reason=COALESCE(revocation_reason,CASE WHEN NEW.status='withdrawn' THEN 'Dean nomination withdrawn' ELSE 'Dean nomination revoked' END)
  WHERE dean_nomination_id=NEW.id AND eligibility_source='dean_nomination' AND status='eligible';
 END IF; RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_calculate_portfolio_potential_score ON public.student_award_evaluations;
CREATE TRIGGER trg_calculate_portfolio_potential_score BEFORE INSERT OR UPDATE OF raw_score,max_computable_score,status,award_definition_id
 ON public.student_award_evaluations FOR EACH ROW EXECUTE FUNCTION public.calculate_portfolio_potential_score();
DROP TRIGGER IF EXISTS trg_sync_portfolio_based_award_eligibility_after_write ON public.student_award_evaluations;
CREATE TRIGGER trg_sync_portfolio_based_award_eligibility_after_write AFTER INSERT OR UPDATE OF raw_score,max_computable_score,status,evaluated_at,award_definition_id
 ON public.student_award_evaluations FOR EACH ROW EXECUTE FUNCTION public.sync_portfolio_based_award_eligibility_after_write();
DROP TRIGGER IF EXISTS trg_sync_dean_nomination_eligibility ON public.dean_student_nominations;
CREATE TRIGGER trg_sync_dean_nomination_eligibility AFTER INSERT OR UPDATE OF status
 ON public.dean_student_nominations FOR EACH ROW EXECUTE FUNCTION public.sync_dean_nomination_eligibility();

CREATE OR REPLACE FUNCTION public.recalculate_award_evaluations_after_threshold_change() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$ BEGIN
 UPDATE public.student_award_evaluations evaluation SET award_definition_id=evaluation.award_definition_id
 WHERE evaluation.award_definition_id=NEW.id AND evaluation.status<>'superseded';
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_recalculate_award_evaluations_after_threshold_change ON public.award_definitions;
CREATE TRIGGER trg_recalculate_award_evaluations_after_threshold_change
 AFTER UPDATE OF candidate_threshold_percent ON public.award_definitions FOR EACH ROW
 WHEN (OLD.candidate_threshold_percent IS DISTINCT FROM NEW.candidate_threshold_percent)
 EXECUTE FUNCTION public.recalculate_award_evaluations_after_threshold_change();

CREATE OR REPLACE FUNCTION public.admin_update_award_candidate_threshold(
 p_actor_profile_id uuid,p_award_definition_id uuid,p_candidate_threshold_percent numeric
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE old_threshold numeric(5,2); BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM public.profiles p
  JOIN public.profile_roles pr ON pr.profile_id=p.id AND pr.is_active
  JOIN public.roles r ON r.id=pr.role_id AND r.role_key='osad_staff'
  WHERE p.id=p_actor_profile_id AND p.account_type='osad_admin' AND p.status='active'
 ) THEN
  RAISE EXCEPTION 'Active OSAD administrator authorization required';
 END IF;
 IF p_candidate_threshold_percent IS NULL OR p_candidate_threshold_percent NOT BETWEEN 0 AND 100
    OR p_candidate_threshold_percent<>round(p_candidate_threshold_percent,2) THEN
  RAISE EXCEPTION 'Candidate threshold must be between 0 and 100 with at most two decimal places';
 END IF;
 SELECT candidate_threshold_percent INTO old_threshold FROM public.award_definitions
 WHERE id=p_award_definition_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Award definition not found'; END IF;
 IF old_threshold IS NOT DISTINCT FROM p_candidate_threshold_percent THEN
  RETURN jsonb_build_object('award_definition_id',p_award_definition_id,'field','candidate_threshold_percent',
   'old_value',old_threshold,'new_value',p_candidate_threshold_percent,'changed',false);
 END IF;
 UPDATE public.award_definitions SET candidate_threshold_percent=p_candidate_threshold_percent,updated_at=now()
 WHERE id=p_award_definition_id;
 INSERT INTO public.audit_logs(event_code,category,actor_profile_id,target_type,target_id,outcome,details,safe_context)
 VALUES('AWARD_CANDIDATE_THRESHOLD_UPDATED','award_configuration',p_actor_profile_id,'award_definition',p_award_definition_id,
  'success','Candidate threshold percentage updated',jsonb_build_object('field','candidate_threshold_percent','old_value',old_threshold,'new_value',p_candidate_threshold_percent));
 RETURN jsonb_build_object('award_definition_id',p_award_definition_id,'field','candidate_threshold_percent',
  'old_value',old_threshold,'new_value',p_candidate_threshold_percent,'changed',true);
END $$;

ALTER FUNCTION public.admin_update_award_candidate_threshold(uuid,uuid,numeric) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.calculate_portfolio_potential_score(), public.sync_portfolio_based_award_eligibility_after_write(),
 public.sync_dean_nomination_eligibility(), public.recalculate_award_evaluations_after_threshold_change() FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.admin_update_award_candidate_threshold(uuid,uuid,numeric) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_award_candidate_threshold(uuid,uuid,numeric) TO service_role;
REVOKE INSERT,UPDATE,DELETE ON public.award_definitions FROM PUBLIC,anon,authenticated,service_role;
SQL);
    }

    public function down()
    {
        $this->db->query(<<<'SQL'
DROP TRIGGER IF EXISTS trg_recalculate_award_evaluations_after_threshold_change ON public.award_definitions;
DROP TRIGGER IF EXISTS trg_sync_dean_nomination_eligibility ON public.dean_student_nominations;
DROP TRIGGER IF EXISTS trg_sync_portfolio_based_award_eligibility_after_write ON public.student_award_evaluations;
DROP TRIGGER IF EXISTS trg_calculate_portfolio_potential_score ON public.student_award_evaluations;
DROP FUNCTION IF EXISTS public.admin_update_award_candidate_threshold(uuid,uuid,numeric);
DROP FUNCTION IF EXISTS public.recalculate_award_evaluations_after_threshold_change();
DROP FUNCTION IF EXISTS public.sync_dean_nomination_eligibility();
DROP FUNCTION IF EXISTS public.sync_portfolio_based_award_eligibility_after_write();
DROP FUNCTION IF EXISTS public.calculate_portfolio_potential_score();
SQL);
    }
}
