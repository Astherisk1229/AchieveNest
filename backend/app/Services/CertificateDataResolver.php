<?php

namespace App\Services;

final class CertificateDataResolver
{
    public function resolve(array $record, array $student, string $purpose, array $issuer): array
    {
        $attributes = $record['structured_attributes'] ?? $record['metadata'] ?? [];
        if (is_string($attributes)) $attributes = json_decode($attributes, true) ?: [];
        return array_filter([
            'recipient_name'=>$student['full_name'] ?? null,
            'activity_title'=>$record['title'] ?? null,
            'activity_type'=>$record['category_name'] ?? null,
            'activity_date'=>$record['occurrence_date'] ?? null,
            'activity_start_date'=>$record['start_date'] ?? null,
            'activity_end_date'=>$record['end_date'] ?? null,
            'date_range'=>$record['date_range'] ?? null,
            'recognition_date'=>$attributes['recognition_date'] ?? null,
            'student_role'=>$attributes['role'] ?? null,
            'contribution_role'=>$attributes['contribution_role'] ?? $attributes['role'] ?? null,
            'recognition_title'=>$attributes['recognition_title'] ?? null,
            'placement'=>$this->displayPlacement((string)($attributes['placement'] ?? $attributes['result'] ?? '')),
            'scope'=>$attributes['scope'] ?? null,
            'granting_body'=>$attributes['granting_body'] ?? null,
            'organizer_name'=>$record['organizer_name'] ?? $attributes['organizer_name'] ?? null,
            'issuer_name'=>$issuer['name'] ?? null,
            'certificate_purpose'=>$purpose,
        ], static fn($value) => $value !== null && $value !== '');
    }

    private function displayPlacement(string $value): ?string
    {
        $value=strtolower(trim($value));
        return ['champion'=>'Champion','1st'=>'1st Place','first'=>'1st Place','gold'=>'Gold','2nd'=>'2nd Place','second'=>'2nd Place','silver'=>'Silver','3rd'=>'3rd Place','third'=>'3rd Place','bronze'=>'Bronze','participant'=>'Participant'][$value] ?? ($value !== '' ? ucwords(str_replace('_',' ',$value)) : null);
    }
}
