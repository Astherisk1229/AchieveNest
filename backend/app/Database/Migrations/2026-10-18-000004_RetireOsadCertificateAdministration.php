<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

final class RetireOsadCertificateAdministration extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
DROP POLICY IF EXISTS certificate_template_families_osad_manage ON public.certificate_template_families;
DROP POLICY IF EXISTS certificate_template_versions_osad_manage ON public.certificate_template_versions;
DROP POLICY IF EXISTS certificate_batches_osad_manage ON public.certificate_issuance_batches;
DROP POLICY IF EXISTS issued_certificates_osad_manage ON public.issued_certificates;
DROP POLICY IF EXISTS certificate_template_families_authenticated_select ON public.certificate_template_families;
DROP POLICY IF EXISTS certificate_template_versions_authenticated_select ON public.certificate_template_versions;
DROP POLICY IF EXISTS issued_certificates_recipient_or_osad_select ON public.issued_certificates;
CREATE POLICY certificate_template_families_authenticated_select ON public.certificate_template_families
    FOR SELECT TO authenticated USING (status = 'published');
CREATE POLICY certificate_template_versions_authenticated_select ON public.certificate_template_versions
    FOR SELECT TO authenticated USING (status = 'published');
CREATE POLICY issued_certificates_recipient_select ON public.issued_certificates
    FOR SELECT TO authenticated USING (recipient_profile_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS osad_manage_certificate_assets ON storage.objects;
SQL);
    }

    public function down()
    {
        $this->db->query(<<<'SQL'
DROP POLICY IF EXISTS certificate_template_families_authenticated_select ON public.certificate_template_families;
DROP POLICY IF EXISTS certificate_template_versions_authenticated_select ON public.certificate_template_versions;
DROP POLICY IF EXISTS issued_certificates_recipient_select ON public.issued_certificates;
CREATE POLICY certificate_template_families_authenticated_select ON public.certificate_template_families
    FOR SELECT TO authenticated USING (status = 'published' OR (SELECT private.is_osad_admin()));
CREATE POLICY certificate_template_families_osad_manage ON public.certificate_template_families
    FOR ALL TO authenticated USING ((SELECT private.is_osad_admin())) WITH CHECK ((SELECT private.is_osad_admin()));
CREATE POLICY certificate_template_versions_authenticated_select ON public.certificate_template_versions
    FOR SELECT TO authenticated USING (status = 'published' OR (SELECT private.is_osad_admin()));
CREATE POLICY certificate_template_versions_osad_manage ON public.certificate_template_versions
    FOR ALL TO authenticated USING ((SELECT private.is_osad_admin())) WITH CHECK ((SELECT private.is_osad_admin()));
CREATE POLICY certificate_batches_osad_manage ON public.certificate_issuance_batches
    FOR ALL TO authenticated USING ((SELECT private.is_osad_admin())) WITH CHECK ((SELECT private.is_osad_admin()));
CREATE POLICY issued_certificates_recipient_or_osad_select ON public.issued_certificates
    FOR SELECT TO authenticated USING (recipient_profile_id = (SELECT auth.uid()) OR (SELECT private.is_osad_admin()));
CREATE POLICY issued_certificates_osad_manage ON public.issued_certificates
    FOR ALL TO authenticated USING ((SELECT private.is_osad_admin())) WITH CHECK ((SELECT private.is_osad_admin()));
CREATE POLICY osad_manage_certificate_assets ON storage.objects
    FOR ALL TO authenticated USING (bucket_id IN ('certificate-assets', 'issued-certificates') AND (SELECT private.is_osad_admin()))
    WITH CHECK (bucket_id IN ('certificate-assets', 'issued-certificates') AND (SELECT private.is_osad_admin()));
SQL);
    }
}
