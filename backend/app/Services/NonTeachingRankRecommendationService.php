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
            ? $this->targetTransition($profileId, $present, $applied, $rank) : null;
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
        if ($applicationStatus === 'RULE_REVIEW_REQUIRED' || $applicationStatus === 'UNRESOLVED') {
            return ['rank' => null, 'status' => 'pending_rule_review'];
        }
        if ($applied === '') return ['rank' => $present, 'status' => 'retained_present_rank'];
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

    private function targetTransition(string $profileId, string $present, string $applied, array $rank): ?array
    {
        $decisionId = (string) ($rank['rank_applied_for_decision_id'] ?? '');
        $catalog = new FacultyRankCatalogService();
        $source = $catalog->getRankByCode($present) ?? $catalog->getRankByLabel($present);
        $target = $catalog->getRankByCode($applied) ?? $catalog->getRankByLabel($applied);
        if (! $source || ! $target) return null;
        if ($decisionId !== '') {
            $decision = $this->db->table('personnel_rank_applied_for_decisions')
                ->select('present_rank_code_snapshot,confirmed_rank_code')
                ->where('id', $decisionId)->where('status', 'confirmed')->get()->getRowArray();
            if (! $decision || $source['rank_code'] !== $decision['present_rank_code_snapshot']
                || $target['rank_code'] !== $decision['confirmed_rank_code']) return null;
        } else {
            $validTargets = $this->progression->getAllowedTransitions($source['rank_code'], [
                'personnel_group' => 'non_teaching_faculty', 'personnel_profile_id' => $profileId,
                'has_verified_phd' => $this->hasVerifiedDoctorate($profileId),
            ])['all_valid_target_ranks'] ?? [];
            if (! in_array($target['rank_code'], array_column($validTargets, 'rank_code'), true)) return null;
        }
        $transition = $this->progression->validateTransition($source['rank_code'], $target['rank_code'], [
            'personnel_profile_id' => $profileId, 'has_verified_phd' => $this->hasVerifiedDoctorate($profileId),
        ]);
        return $transition;
    }

    private function hasVerifiedDoctorate(string $profileId): bool
    {
        return $this->db->tableExists('personnel_credentials') && $this->db->table('personnel_credentials')->where([
            'personnel_profile_id' => $profileId, 'credential_type' => 'degree',
            'degree_level' => 'doctorate', 'verification_status' => 'verified', 'record_state' => 'active',
        ])->countAllResults() > 0;
    }
}
