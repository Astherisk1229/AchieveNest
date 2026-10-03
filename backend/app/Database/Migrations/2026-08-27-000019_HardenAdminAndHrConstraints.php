<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class HardenAdminAndHrConstraints extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
DO $$ BEGIN
 IF (SELECT count(*) FROM public.profiles WHERE account_type='hr_admin' AND status='active')>1 THEN
  RAISE EXCEPTION 'Cannot enforce one active HR admin: duplicate active profiles exist';
 END IF;
 IF EXISTS (SELECT 1 FROM public.personnel_evaluations WHERE area_a_score NOT BETWEEN 0 AND 70 OR area_b_score NOT BETWEEN 0 AND 50 OR area_c_score NOT BETWEEN 0 AND 40 OR total_score NOT BETWEEN 0 AND 160 OR total_score<>area_a_score+area_b_score+area_c_score) THEN
  RAISE EXCEPTION 'Existing personnel evaluation violates final score constraints';
 END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_one_active_hr_admin ON public.profiles((account_type)) WHERE account_type='hr_admin' AND status='active';
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ck_personnel_eval_area_a' AND conrelid='public.personnel_evaluations'::regclass) THEN ALTER TABLE public.personnel_evaluations ADD CONSTRAINT ck_personnel_eval_area_a CHECK (area_a_score BETWEEN 0 AND 70) NOT VALID; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ck_personnel_eval_area_b' AND conrelid='public.personnel_evaluations'::regclass) THEN ALTER TABLE public.personnel_evaluations ADD CONSTRAINT ck_personnel_eval_area_b CHECK (area_b_score BETWEEN 0 AND 50) NOT VALID; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ck_personnel_eval_area_c' AND conrelid='public.personnel_evaluations'::regclass) THEN ALTER TABLE public.personnel_evaluations ADD CONSTRAINT ck_personnel_eval_area_c CHECK (area_c_score BETWEEN 0 AND 40) NOT VALID; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ck_personnel_eval_total' AND conrelid='public.personnel_evaluations'::regclass) THEN ALTER TABLE public.personnel_evaluations ADD CONSTRAINT ck_personnel_eval_total CHECK (total_score BETWEEN 0 AND 160) NOT VALID; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ck_personnel_eval_total_sum' AND conrelid='public.personnel_evaluations'::regclass) THEN ALTER TABLE public.personnel_evaluations ADD CONSTRAINT ck_personnel_eval_total_sum CHECK (total_score=area_a_score+area_b_score+area_c_score) NOT VALID; END IF;
END $$;
ALTER TABLE public.personnel_evaluations VALIDATE CONSTRAINT ck_personnel_eval_area_a;
ALTER TABLE public.personnel_evaluations VALIDATE CONSTRAINT ck_personnel_eval_area_b;
ALTER TABLE public.personnel_evaluations VALIDATE CONSTRAINT ck_personnel_eval_area_c;
ALTER TABLE public.personnel_evaluations VALIDATE CONSTRAINT ck_personnel_eval_total;
ALTER TABLE public.personnel_evaluations VALIDATE CONSTRAINT ck_personnel_eval_total_sum;
SQL);
    }

    public function down()
    {
        $this->db->query(<<<'SQL'
ALTER TABLE public.personnel_evaluations DROP CONSTRAINT IF EXISTS ck_personnel_eval_total_sum;
ALTER TABLE public.personnel_evaluations DROP CONSTRAINT IF EXISTS ck_personnel_eval_total;
ALTER TABLE public.personnel_evaluations DROP CONSTRAINT IF EXISTS ck_personnel_eval_area_c;
ALTER TABLE public.personnel_evaluations DROP CONSTRAINT IF EXISTS ck_personnel_eval_area_b;
ALTER TABLE public.personnel_evaluations DROP CONSTRAINT IF EXISTS ck_personnel_eval_area_a;
DROP INDEX IF EXISTS public.uq_profiles_one_active_hr_admin;
SQL);
    }
}
