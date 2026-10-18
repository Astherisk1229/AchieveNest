<?php

namespace App\Services;

/** Applies rules explicitly captured in an evaluation item's locked criterion snapshot. */
final class VerifiedEvidenceScoringService
{
    /** Return a full-maximum score for faculty criteria with evidence-approved maximum scoring. */
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
        $category = is_array($snapshot['category'] ?? null) ? $snapshot['category'] : [];
        if (! empty($snapshot['award_maximum_after_evidence_verification'])) return true;

        // Compatibility for already-submitted items whose frozen snapshot
        // still marks a max-only criterion as evaluator judgment.
        if (empty($snapshot['evaluator_judgment_required'])) return false;
        if (! empty($category['options'])) return false;
        if ((int) ($category['requires_manual_hr_rule'] ?? 0) === 1 && empty($category['subcategories'])) return true;

        $subcategory = is_array($snapshot['subcategory'] ?? null) ? $snapshot['subcategory'] : [];
        return $subcategory !== []
            && empty($subcategory['levels'])
            && is_numeric($subcategory['default_points'] ?? null)
            && (float) $subcategory['default_points'] > 0;
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
