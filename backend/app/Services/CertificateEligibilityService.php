<?php

namespace App\Services;

use App\Domain\Certificates\CertificateDomain;

final class CertificateEligibilityService
{
    public function resolve(array $record): array
    {
        $result = ['eligibility_status'=>'NOT_ELIGIBLE','eligible_purpose'=>null,'reason_codes'=>[],
            'source_record_id'=>$record['id'] ?? null,'source_category'=>$record['category_code'] ?? null,
            'source_subcategory'=>$record['subcategory_code'] ?? null];
        if (($record['verification_status'] ?? $record['status'] ?? '') !== 'verified') {
            $result['reason_codes'][] = 'SOURCE_RECORD_NOT_VERIFIED';
            return $result;
        }

        $studentFamily = $this->studentFamily($record);
        $role = $this->token($record, ['structured_attributes.role','metadata.role','role','participation_role']);
        $outcome = $this->token($record, ['structured_attributes.verified_engagement_outcome','metadata.verified_engagement_outcome','verified_engagement_outcome']);
        $placement = $this->token($record, ['structured_attributes.placement','metadata.placement','placement','result']);

        $purpose = match ($studentFamily) {
            'STUDENT_01' => $this->in($role, ['service','contributor','organizer','facilitator']) ? CertificateDomain::PURPOSE_APPRECIATION : null,
            'STUDENT_02' => $this->organizationPurpose($role),
            'STUDENT_03' => $this->servicePurpose($role),
            'STUDENT_04' => $this->ministryPurpose($role),
            'STUDENT_05' => $outcome === 'completed' ? CertificateDomain::PURPOSE_COMPLETION : ($outcome === 'participated' ? CertificateDomain::PURPOSE_PARTICIPATION : null),
            'STUDENT_06' => CertificateDomain::PURPOSE_RECOGNITION,
            'STUDENT_07', 'STUDENT_08' => $this->competitivePurpose($placement),
            'STUDENT_09' => $this->in($role, ['publication_contributor','contributor','service','publication_officer']) ? CertificateDomain::PURPOSE_APPRECIATION : null,
            default => null,
        };

        if ($purpose === null) {
            $result['reason_codes'][] = 'PURPOSE_INCOMPATIBLE';
            return $result;
        }
        $result['eligibility_status'] = 'ELIGIBLE';
        $result['eligible_purpose'] = $purpose;
        return $result;
    }

    private function organizationPurpose(string $role): ?string
    {
        if ($role === 'activity_participant') return CertificateDomain::PURPOSE_PARTICIPATION;
        return $this->in($role, ['facilitator','organizer','project_contributor','committee_member']) ? CertificateDomain::PURPOSE_APPRECIATION : null;
    }

    private function servicePurpose(string $role): ?string
    {
        if ($role === 'participant') return CertificateDomain::PURPOSE_PARTICIPATION;
        return $this->in($role, ['volunteer','organizer','initiator','leader']) ? CertificateDomain::PURPOSE_APPRECIATION : null;
    }

    private function ministryPurpose(string $role): ?string
    {
        if ($role === 'activity_participant') return CertificateDomain::PURPOSE_PARTICIPATION;
        return $this->in($role, ['ministry_volunteer','service_role','assigned_responsibility','facilitator','organizer','committee','working_group','initiator']) ? CertificateDomain::PURPOSE_APPRECIATION : null;
    }

    private function competitivePurpose(string $placement): ?string
    {
        if ($placement === 'participant') return CertificateDomain::PURPOSE_PARTICIPATION;
        return $this->in($placement, ['bronze','3rd','third','silver','2nd','second','gold','1st','first','champion']) ? CertificateDomain::PURPOSE_RECOGNITION : null;
    }

    private function studentFamily(array $record): string
    {
        $value = strtoupper((string)($record['student_category'] ?? $record['category_code'] ?? ''));
        if (preg_match('/(?:STUDENT[_ -]?0?([1-9]))/', $value, $m)) return 'STUDENT_0'.$m[1];
        return match (true) {
            str_contains($value, 'LEADERSHIP') => 'STUDENT_01', str_contains($value, 'MEMBERSHIP') => 'STUDENT_02',
            str_contains($value, 'COMMUNITY') || str_contains($value, 'VOLUNTEER') => 'STUDENT_03',
            str_contains($value, 'CHURCH') || str_contains($value, 'MINISTRY') => 'STUDENT_04',
            str_contains($value, 'SEMINAR') || str_contains($value, 'TRAINING') => 'STUDENT_05',
            str_contains($value, 'CITATION') || str_contains($value, 'RECOGNITION') => 'STUDENT_06',
            str_contains($value, 'SPORT') => 'STUDENT_07', str_contains($value, 'CULTURAL') || str_contains($value, 'PERFORM') => 'STUDENT_08',
            str_contains($value, 'JOURNAL') || str_contains($value, 'PUBLICATION') => 'STUDENT_09', default => '',
        };
    }

    private function token(array $record, array $paths): string
    {
        foreach ($paths as $path) {
            $value=$record;
            foreach (explode('.', $path) as $part) { if (!is_array($value) || !array_key_exists($part,$value)) { $value=null; break; } $value=$value[$part]; }
            if ($value !== null && $value !== '') return strtolower(trim((string)$value));
        }
        return '';
    }

    private function in(string $value, array $allowed): bool { return in_array($value, $allowed, true); }
}
