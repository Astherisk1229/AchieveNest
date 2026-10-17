<?php

namespace App\Services;

/** Applies rules explicitly captured in an evaluation item's locked criterion snapshot. */
final class VerifiedEvidenceScoringService
{
    /** Return a full-maximum score only for criteria configured for this workflow. */
    public function scoreOnVerification(array $item, string $personnelGroup): ?float
    {
        if (! $this->isApplicable($item, $personnelGroup)) return null;

        $snapshot = $this->snapshot($item);
        $category = is_array($snapshot['category'] ?? null) ? $snapshot['category'] : [];

        $maximum = (float) ($snapshot['criterion_cap'] ?? $category['max_points'] ?? $item['max_allowed_points'] ?? 0);
        return $maximum > 0 ? $maximum : null;
    }

    public function isApplicable(array $item, string $personnelGroup): bool
    {
        if (strtoupper(trim($personnelGroup)) !== 'FACULTY') return false;
        $snapshot = $this->snapshot($item);
        if (empty($snapshot['award_maximum_after_evidence_verification'])) return false;
        $category = is_array($snapshot['category'] ?? null) ? $snapshot['category'] : [];
        $code = strtoupper(trim((string) ($category['category_code'] ?? $item['criterion_code'] ?? '')));
        return in_array($code, ['B.2', 'B.5'], true);
    }

    public function hasAttachedEvidence(array $item): bool
    {
        $evidence = $item['evidence_snapshot'] ?? [];
        if (is_string($evidence)) $evidence = json_decode($evidence, true);
        if (is_array($evidence) && $evidence !== []) return true;
        return trim((string) ($item['evidence_id'] ?? $item['file_url'] ?? $item['file_name'] ?? '')) !== '';
    }

    private function snapshot(array $item): array
    {
        $snapshot = $item['criterion_snapshot'] ?? [];
        if (is_string($snapshot)) $snapshot = json_decode($snapshot, true);
        return is_array($snapshot) ? $snapshot : [];
    }
}
