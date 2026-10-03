<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateStorageBucketsAndPolicies extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES
 ('student-evidence','student-evidence',false,20971520,ARRAY['application/pdf','image/jpeg','image/png','image/webp']),
 ('personnel-evidence','personnel-evidence',false,20971520,ARRAY['application/pdf','image/jpeg','image/png','image/webp']),
 ('certificate-assets','certificate-assets',false,10485760,ARRAY['image/jpeg','image/png','image/webp','image/svg+xml','application/pdf']),
 ('issued-certificates','issued-certificates',false,10485760,ARRAY['application/pdf']),
 ('evaluation-reports','evaluation-reports',false,20971520,ARRAY['application/pdf']),
 ('avatars','avatars',false,5242880,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,public=EXCLUDED.public,file_size_limit=EXCLUDED.file_size_limit,allowed_mime_types=EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS student_evidence_select_own ON storage.objects;
DROP POLICY IF EXISTS student_evidence_insert_own ON storage.objects;
DROP POLICY IF EXISTS personnel_evidence_select_own ON storage.objects;
DROP POLICY IF EXISTS personnel_evidence_insert_own ON storage.objects;
DROP POLICY IF EXISTS hr_read_personnel_evidence ON storage.objects;
DROP POLICY IF EXISTS avatar_owner_all ON storage.objects;
CREATE POLICY avatar_owner_all ON storage.objects FOR ALL TO authenticated
 USING (bucket_id='avatars' AND (storage.foldername(name))[1]=(SELECT auth.uid())::text)
 WITH CHECK (bucket_id='avatars' AND (storage.foldername(name))[1]=(SELECT auth.uid())::text);
DROP POLICY IF EXISTS hr_manage_evaluation_reports ON storage.objects;
CREATE POLICY hr_manage_evaluation_reports ON storage.objects FOR ALL TO authenticated
 USING (bucket_id='evaluation-reports' AND (SELECT private.is_hr_admin()))
 WITH CHECK (bucket_id='evaluation-reports' AND (SELECT private.is_hr_admin()));
DROP POLICY IF EXISTS osad_manage_certificate_assets ON storage.objects;
CREATE POLICY osad_manage_certificate_assets ON storage.objects FOR ALL TO authenticated
 USING (bucket_id IN ('certificate-assets','issued-certificates') AND (SELECT private.is_osad_admin()))
 WITH CHECK (bucket_id IN ('certificate-assets','issued-certificates') AND (SELECT private.is_osad_admin()));
SQL);
    }

    public function down()
    {
        // Buckets and restrictive evidence posture are intentionally retained.
    }
}
