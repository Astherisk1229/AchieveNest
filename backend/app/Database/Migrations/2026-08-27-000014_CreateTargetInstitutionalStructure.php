<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateTargetInstitutionalStructure extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS public.academic_programs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE RESTRICT,
    code text NOT NULL UNIQUE CHECK (btrim(code) <> ''),
    name text NOT NULL CHECK (btrim(name) <> ''),
    degree_level text NOT NULL CHECK (btrim(degree_level) <> ''),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_academic_programs_college_id ON public.academic_programs(college_id);
CREATE INDEX IF NOT EXISTS idx_academic_programs_status ON public.academic_programs(status);

CREATE TABLE IF NOT EXISTS public.administrative_units (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE CHECK (btrim(code) <> ''),
    name text NOT NULL UNIQUE CHECK (btrim(name) <> ''),
    unit_type text NOT NULL DEFAULT 'central_office' CHECK (unit_type IN ('central_office','college_based_office','other')),
    college_id uuid REFERENCES public.colleges(id) ON DELETE RESTRICT,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_administrative_units_college_scope CHECK (
      (unit_type='college_based_office' AND college_id IS NOT NULL)
      OR (unit_type<>'college_based_office' AND college_id IS NULL)
    )
);
CREATE INDEX IF NOT EXISTS idx_administrative_units_college_id ON public.administrative_units(college_id);
CREATE INDEX IF NOT EXISTS idx_administrative_units_status ON public.administrative_units(status);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.degree_programs dp
    JOIN public.departments d ON d.id=dp.department_id
    WHERE d.college_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Every degree program must resolve to a college before target reconciliation';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.degree_programs dp
    JOIN public.academic_programs ap ON ap.code=dp.code AND ap.id<>dp.id
  ) THEN
    RAISE EXCEPTION 'Academic-program code conflicts with a legacy degree-program UUID';
  END IF;
END $$;

INSERT INTO public.academic_programs (id,college_id,code,name,degree_level,status,created_at,updated_at)
SELECT dp.id,d.college_id,dp.code,dp.name,dp.degree_level,dp.status,dp.created_at,dp.updated_at
FROM public.degree_programs dp
JOIN public.departments d ON d.id=dp.department_id
ON CONFLICT (code) DO UPDATE SET
  college_id=EXCLUDED.college_id,
  name=EXCLUDED.name,
  degree_level=EXCLUDED.degree_level,
  status=EXCLUDED.status,
  updated_at=now();

ALTER TABLE public.academic_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administrative_units ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.academic_programs, public.administrative_units FROM PUBLIC, anon, authenticated;
SQL);
    }

    public function down()
    {
        // Compatibility tables and copied identifiers are retained to avoid data loss.
    }
}
