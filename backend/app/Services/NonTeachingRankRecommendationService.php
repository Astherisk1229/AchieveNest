<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;

/** Resolve an evaluation recommendation without changing the personnel rank. */
final class NonTeachingRankRecommendationService
{
    public function __construct(
        private BaseConnection $db,
        private ?FacultyRankProgressionService $progression = null,
    ) {
        $this->progression ??= new FacultyRankProgressionService();
    }

    public function decide(string $profileId, string $trackId, float $total, array $criteria): array
    {
        $rank = (new PersonnelSharedRankContextService($this->db))->forPersonnel($profileId, $trackId);
        $threshold = self::lockedPassingScore($criteria);
        $present = trim((string) ($rank['present_rank'] ?? ''));
        $applied = trim((string) ($rank['rank_applied_for'] ?? ''));
        $transition = $threshold !== null && $total >= $threshold && $applied !== ''
            && ($rank['rank_applied_for_status'] ?? '') === 'confirmed'
            ? $this->confirmedTargetTransition($profileId, $present, $applied, $rank) : null;
        $targetValid = (bool) ($transition['allowed'] ?? false);
        $outcome = self::outcome($total, $threshold, $present, $applied,
            (string) ($rank['rank_applied_for_status'] ?? ''), $targetValid);

        return $rank + [
            'recommended_rank' => $outcome['rank'],
            'recommended_rank_status' => $outcome['status'],
            'recommended_rank_rule' => $targetValid ? ($transition['rule_reference'] ?? null) : $outcome['status'],
            'recommendation_score' => $total,
            'recommendation_passing_score' => $threshold,
        ];
    }

    public static function outcome(float $total, ?float $threshold, string $present, string $applied,
        string $applicationStatus, bool $targetValid): array
    {
        if ($threshold === null) return ['rank' => null, 'status' => 'passing_score_unavailable'];
        if ($present === '') return ['rank' => null, 'status' => 'present_rank_unresolved'];
        if ($total < $threshold) return ['rank' => $present, 'status' => 'retained_present_rank'];
        if ($applicationStatus === 'MASTERS_REQUIRED') {
            return ['rank' => $present, 'status' => 'retained_masters_required'];
        }
        if ($applied === '' || $applicationStatus !== 'confirmed') {
            return ['rank' => null, 'status' => $applicationStatus === 'RULE_REVIEW_REQUIRED'
                ? 'pending_rule_review' : 'pending_rank_application_confirmation'];
        }
        return $targetValid
            ? ['rank' => $applied, 'status' => 'passed_applied_rank']
            : ['rank' => null, 'status' => 'pending_rule_review'];
    }

    public static function lockedPassingScore(array $criteria): ?float
    {
        $values = array_values(array_unique(array_map('floatval', array_filter([
            $criteria['version']['passing_score'] ?? null,
            $criteria['sheet']['passing_score'] ?? null,
            $criteria['passing_score'] ?? null,
        ], 'is_numeric'))));
        return count($values) === 1 && $values[0] > 0 ? $values[0] : null;
    }

    private function confirmedTargetTransition(string $profileId, string $present, string $applied, array $rank): ?array
    {
        $decisionId = (string) ($rank['rank_applied_for_decision_id'] ?? '');
        if ($decisionId === '') return null;
        $decision = $this->db->table('personnel_rank_applied_for_decisions')
            ->select('present_rank_code_snapshot,confirmed_rank_code')
            ->where('id', $decisionId)->where('status', 'confirmed')->get()->getRowArray();
        if (! $decision) return null;
        $catalog = new FacultyRankCatalogService();
        $source = $catalog->getRankByCode($present) ?? $catalog->getRankByLabel($present);
        $target = $catalog->getRankByCode($applied) ?? $catalog->getRankByLabel($applied);
        if (! $source || ! $target || $source['rank_code'] !== $decision['present_rank_code_snapshot']
            || $target['rank_code'] !== $decision['confirmed_rank_code']) return null;
        $hasPhd = $this->db->table('personnel_credentials')->where([
            'personnel_profile_id' => $profileId, 'credential_type' => 'degree',
            'degree_level' => 'doctorate', 'verification_status' => 'verified', 'record_state' => 'active',
        ])->countAllResults() > 0;
        $transition = $this->progression->validateTransition($source['rank_code'], $target['rank_code'], [
            'personnel_profile_id' => $profileId, 'has_verified_phd' => $hasPhd,
        ]);
        return $transition;
    }
}
