<?php

namespace App\Services;

final class CertificateSnapshotBuilder
{
    public function build(array $identity, array $student, array $source, string $purpose, array $data, array $template, array $signatories): array
    {
        return ['certificate_identity'=>$identity,'recipient'=>['name'=>$student['full_name'] ?? null],
            'source_record'=>['id'=>$source['id'] ?? null,'type'=>'student_portfolio_record','title'=>$source['title'] ?? null],
            'classification'=>['category'=>$source['category_code'] ?? null,'subcategory'=>$source['subcategory_code'] ?? null],
            'certificate_purpose'=>$purpose,'resolved_certificate_data'=>$data,
            'organizer_and_issuer'=>['organizer_name'=>$data['organizer_name'] ?? null,'issuer_name'=>$data['issuer_name'] ?? null],
            'dates'=>array_intersect_key($data,array_flip(['activity_date','activity_start_date','activity_end_date','date_range','recognition_date','issued_date'])),
            'template'=>['family_id'=>$template['template_family_id'] ?? $template['id'] ?? null,'version_id'=>$template['id'] ?? null,'version_number'=>$template['version_number'] ?? null],
            'signatories'=>$signatories,'rendering_metadata'=>['snapshot_version'=>1]];
    }
}
