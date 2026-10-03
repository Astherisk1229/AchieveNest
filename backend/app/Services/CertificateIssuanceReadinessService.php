<?php

namespace App\Services;

use App\Domain\Certificates\CertificateDomain;

final class CertificateIssuanceReadinessService
{
    public function evaluate(array $eligibility, ?array $template, array $resolvedData, array $signatories, bool $hasCurrentCertificate=false): array
    {
        if (($eligibility['eligibility_status'] ?? '') !== 'ELIGIBLE') return ['status'=>CertificateDomain::READINESS_NOT_ELIGIBLE,'certificate_purpose'=>null,'blocking_reasons'=>$eligibility['reason_codes'] ?? ['PURPOSE_INCOMPATIBLE']];
        $purpose=$eligibility['eligible_purpose']; $blocks=[];
        if ($template === null) $blocks[]='MISSING_PUBLISHED_TEMPLATE';
        else {
            if (strtoupper((string)($template['status'] ?? '')) !== CertificateDomain::TEMPLATE_PUBLISHED) $blocks[]='MISSING_PUBLISHED_TEMPLATE';
            if (strtoupper((string)($template['certificate_purpose'] ?? '')) !== $purpose) $blocks[]='TEMPLATE_PURPOSE_MISMATCH';
            foreach (($template['placeholder_contract'] ?? []) as $placeholder) if (strtoupper((string)($placeholder['requirement_type'] ?? ''))==='REQUIRED' && trim((string)($resolvedData[$placeholder['name']] ?? ''))==='') $blocks[]='REQUIRED_PLACEHOLDER_UNRESOLVED';
            foreach (($template['signatory_slots'] ?? []) as $slot) if (strtoupper((string)($slot['requirement_type'] ?? ''))==='REQUIRED' && empty($signatories[$slot['role_code']] ?? null)) $blocks[]='REQUIRED_SIGNATORY_UNAVAILABLE';
        }
        if ($hasCurrentCertificate) $blocks[]='CURRENT_CERTIFICATE_ALREADY_EXISTS';
        return ['status'=>$blocks === [] ? CertificateDomain::READINESS_ISSUABLE : CertificateDomain::READINESS_BLOCKED,'certificate_purpose'=>$purpose,'blocking_reasons'=>array_values(array_unique($blocks))];
    }
}
