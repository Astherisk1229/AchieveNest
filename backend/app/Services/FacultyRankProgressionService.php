<?php

namespace App\Services;

use Config\Database;

/**
 * Class FacultyRankProgressionService
 *
 * Deterministic Faculty rank progression engine for Plan E — Phase E2.
 * Enforces normal sequential rank advancement and confirmed PhD exceptions.
 * Read-only engine: Plan E determines the valid progression options; Plan H decides approval.
 */
class FacultyRankProgressionService
{
    private const RETIRED_SENIOR_INSTRUCTOR_STEPS = [
        'SENIOR_INSTRUCTOR_I',
        'SENIOR_INSTRUCTOR_II',
        'SENIOR_INSTRUCTOR_III',
        'SENIOR_INSTRUCTOR_IV',
    ];

    protected $db;
    protected FacultyRankCatalogService $catalogService;

    public function __construct(?FacultyRankCatalogService $catalogService = null)
    {
        $this->db = Database::connect();
        $this->catalogService = $catalogService ?? new FacultyRankCatalogService();
    }

    /**
     * Resolves current rank by stable code or exact display label.
     *
     * @param string $rankIdentifier
     * @return array|null
     */
    public function resolveCurrentRank(string $rankIdentifier): ?array
    {
        $rank = $this->catalogService->getRankByCode($rankIdentifier);
        if ($rank) {
            return $rank;
        }

        return $this->catalogService->getRankByLabel($rankIdentifier);
    }

    /**
     * Checks if a rank is a terminal / highest rank with no further progression.
     *
     * @param string $rankCode
     * @return bool
     */
    public function isTerminalRank(string $rankCode): bool
    {
        $current = $this->resolveCurrentRank($rankCode);
        if (!$current) {
            return false;
        }

        $code = $current['rank_code'];
        if ($code === 'SENIOR_INSTRUCTOR' || in_array($code, self::RETIRED_SENIOR_INSTRUCTOR_STEPS, true)) {
            return true;
        }
        $count = $this->db->table('faculty_rank_transitions')
            ->where('from_rank_code', $code)
            ->where('is_active', 1)
            ->countAllResults();

        return $count === 0;
    }

    /**
     * Returns the normal sequential next rank for a given current rank.
     *
     * @param string $currentRankCode
     * @return array|null
     */
    public function getNextNormalRank(string $currentRankCode): ?array
    {
        $current = $this->resolveCurrentRank($currentRankCode);
        if (!$current) {
            return null;
        }

        if (in_array($current['rank_code'], ['SENIOR_INSTRUCTOR', ...self::RETIRED_SENIOR_INSTRUCTOR_STEPS], true)) {
            return null;
        }
        // The only rank in the Board Licensure track is Senior Instructor. Older
        // transition rows may still point to the retired I–IV ladder.
        if ($current['rank_code'] === 'INSTRUCTOR_III') {
            return $this->catalogService->getRankByCode('SENIOR_INSTRUCTOR');
        }

        $transition = $this->db->table('faculty_rank_transitions')
            ->where('from_rank_code', $current['rank_code'])
            ->where('transition_type', 'normal_sequential')
            ->where('is_active', 1)
            ->get()
            ->getRowArray();

        if (!$transition) {
            return null;
        }

        if (in_array($transition['to_rank_code'], self::RETIRED_SENIOR_INSTRUCTOR_STEPS, true)) {
            return null;
        }

        return $this->catalogService->getRankByCode($transition['to_rank_code']);
    }

    /**
     * Returns the structured progression DTO with normal and allowed exception options.
     *
     * @param string $currentRankCode
     * @param array $context Context flags (e.g. ['has_verified_phd' => true, 'faculty_engagement' => 'full_time_faculty'])
     * @return array
     */
    public function getAllowedTransitions(string $currentRankCode, array $context = []): array
    {
        // Check personnel engagement context boundary
        $engagement = $context['faculty_engagement'] ?? 'full_time_faculty';
        if ($engagement === 'part_time_faculty') {
            return [
                'current_rank_code' => $currentRankCode,
                'status' => 'INELIGIBLE',
                'reason_code' => 'part_time_not_eligible',
                'message' => 'Part-time faculty are not eligible for Full-Time rank progression.',
                'normal_next_rank' => null,
                'allowed_exception_transitions' => [],
                'all_valid_target_ranks' => [],
                'is_terminal' => false,
            ];
        }

        $personnelGroup = $context['personnel_group'] ?? 'faculty';
        if ($personnelGroup !== 'faculty') {
            return [
                'current_rank_code' => $currentRankCode,
                'status' => 'UNRESOLVED',
                'reason_code' => 'rank_catalog_not_configured',
                'message' => 'Non-Teaching Faculty follows the shared ranking process, but its authoritative rank catalog is not configured.',
                'normal_next_rank' => null,
                'allowed_exception_transitions' => [],
                'all_valid_target_ranks' => [],
                'is_terminal' => false,
            ];
        }

        $current = $this->resolveCurrentRank($currentRankCode);
        if (!$current) {
            return [
                'current_rank_code' => $currentRankCode,
                'status' => 'UNRESOLVED',
                'reason_code' => 'rank_not_found',
                'message' => "Current rank identifier [{$currentRankCode}] was not found in the active catalogue.",
                'normal_next_rank' => null,
                'allowed_exception_transitions' => [],
                'all_valid_target_ranks' => [],
                'is_terminal' => false,
            ];
        }

        $normalNext = $this->getNextNormalRank($current['rank_code']);
        $hasVerifiedPhd = !empty($context['has_verified_phd']);
        $hasVerifiedMasters = $this->hasVerifiedMasters((string) ($context['personnel_profile_id'] ?? ''));

        // Check for active exceptions from this rank
        $exceptionRows = $this->db->table('faculty_rank_transitions')
            ->where('from_rank_code', $current['rank_code'])
            ->where('transition_type', 'phd_exception')
            ->where('is_active', 1)
            ->get()
            ->getResultArray();

        $allowedExceptions = [];
        foreach ($exceptionRows as $ex) {
            if (in_array($ex['to_rank_code'], self::RETIRED_SENIOR_INSTRUCTOR_STEPS, true)) {
                continue;
            }
            if ($ex['requires_verified_phd'] && !$hasVerifiedPhd) {
                // Exception path exists in catalog but condition is not met in current context
                continue;
            }
            $targetRank = $this->catalogService->getRankByCode($ex['to_rank_code']);
            if ($targetRank) {
                $allowedExceptions[] = [
                    'rank' => $targetRank,
                    'transition_type' => $ex['transition_type'],
                    'rule_reference' => $ex['rule_reference'],
                    'requires_verified_phd' => (bool)$ex['requires_verified_phd'],
                ];
            }
        }

        // A Senior Instructor has no numbered sub-ranks. Movement into the
        // Master's tier is available only when HR has a verified Master's
        // credential on the actual Personnel record.
        if ($current['rank_code'] === 'SENIOR_INSTRUCTOR' && $hasVerifiedMasters) {
            $mastersTarget = $this->catalogService->getRankByCode('ASSISTANT_PROFESSOR_I');
            if ($mastersTarget !== null) {
                $allowedExceptions[] = [
                    'rank' => $mastersTarget,
                    'transition_type' => 'masters_qualification',
                    'rule_reference' => 'NDMU-DOC-ACAD-RANKS-2026-V1/VERIFIED-MASTERS',
                    'requires_verified_masters' => true,
                ];
            }
        }

        $allValidTargets = [];
        if ($normalNext) {
            $allValidTargets[] = [
                'rank_code' => $normalNext['rank_code'],
                'display_label' => $normalNext['display_label'],
                'transition_type' => 'normal_sequential',
            ];
        }
        foreach ($allowedExceptions as $ex) {
            $allValidTargets[] = [
                'rank_code' => $ex['rank']['rank_code'],
                'display_label' => $ex['rank']['display_label'],
                'transition_type' => $ex['transition_type'],
                'rule_reference' => $ex['rule_reference'],
                'requires_verified_masters' => (bool) ($ex['requires_verified_masters'] ?? false),
            ];
        }

        $isTerminal = ($normalNext === null && empty($allowedExceptions));

        return [
            'current_rank_code' => $current['rank_code'],
            'current_rank_name' => $current['display_label'],
            'qualification_tier' => $current['qualification_tier_code'],
            'status' => $isTerminal ? 'TERMINAL' : 'OK',
            'reason_code' => $isTerminal ? 'no_next_rank' : null,
            'is_terminal' => $isTerminal,
            'normal_next_rank_code' => $normalNext['rank_code'] ?? null,
            'normal_next_rank_name' => $normalNext['display_label'] ?? null,
            'normal_next_rank' => $normalNext,
            'allowed_exception_transitions' => $allowedExceptions,
            'all_valid_target_ranks' => $allValidTargets,
            'rule_reference' => 'NDMU-DOC-ACAD-RANKS-2026-V1',
        ];
    }

    /**
     * Validates a proposed progression transition between two ranks.
     *
     * @param string $fromRankCode
     * @param string $toRankCode
     * @param array $context
     * @return array
     */
    public function validateTransition(string $fromRankCode, string $toRankCode, array $context = []): array
    {
        // 1. Part-Time / Non-Teaching Boundary Check
        $engagement = $context['faculty_engagement'] ?? 'full_time_faculty';
        if ($engagement === 'part_time_faculty') {
            return [
                'allowed' => false,
                'reason_code' => 'part_time_not_eligible',
                'message' => 'Part-time faculty are not eligible for Full-Time rank progression.',
            ];
        }

        $personnelGroup = $context['personnel_group'] ?? 'faculty';
        if ($personnelGroup !== 'faculty') {
            return [
                'allowed' => false,
                'reason_code' => 'rank_catalog_not_configured',
                'message' => 'Non-Teaching Faculty follows the shared ranking process, but its authoritative rank catalog is not configured.',
            ];
        }

        // 2. Resolve From and To ranks
        $fromRank = $this->resolveCurrentRank($fromRankCode);
        if (!$fromRank) {
            return [
                'allowed' => false,
                'reason_code' => 'rank_not_found',
                'message' => "Source rank [{$fromRankCode}] was not found in the active catalogue.",
            ];
        }

        $toRank = $this->resolveCurrentRank($toRankCode);
        if (!$toRank) {
            return [
                'allowed' => false,
                'reason_code' => 'rank_not_found',
                'message' => "Target rank [{$toRankCode}] was not found in the active catalogue.",
            ];
        }

        $from = $fromRank['rank_code'];
        $to = $toRank['rank_code'];

        if (in_array($to, self::RETIRED_SENIOR_INSTRUCTOR_STEPS, true)) {
            return [
                'allowed' => false,
                'reason_code' => 'retired_senior_instructor_step',
                'message' => 'Senior Instructor I–IV are not selectable ranks. The Board Licensure track has one rank: Senior Instructor.',
            ];
        }
        if (in_array($from, self::RETIRED_SENIOR_INSTRUCTOR_STEPS, true)) {
            return [
                'allowed' => false,
                'reason_code' => 'legacy_rank_reconciliation_required',
                'message' => 'This historical Senior Instructor step must be reconciled to a current rank before progression.',
            ];
        }

        if ($from === 'INSTRUCTOR_III' && $to === 'SENIOR_INSTRUCTOR') {
            return [
                'allowed' => true,
                'from_rank' => $fromRank,
                'to_rank' => $toRank,
                'target_rank' => $toRank,
                'transition_type' => 'normal_sequential',
                'rule_reference' => 'NDMU-DOC-ACAD-RANKS-2026-V1',
                'reason_code' => null,
                'message' => 'Valid progression to the single Senior Instructor rank.',
            ];
        }

        if ($from === 'SENIOR_INSTRUCTOR' && $to === 'ASSISTANT_PROFESSOR_I') {
            if (! $this->hasVerifiedMasters((string) ($context['personnel_profile_id'] ?? ''))) {
                return [
                    'allowed' => false,
                    'reason_code' => 'verified_masters_required',
                    'message' => 'Progression from Senior Instructor to the Assistant Professor tier requires a verified Master’s degree on the Personnel record.',
                ];
            }
            return [
                'allowed' => true,
                'from_rank' => $fromRank,
                'to_rank' => $toRank,
                'target_rank' => $toRank,
                'transition_type' => 'masters_qualification',
                'rule_reference' => 'NDMU-DOC-ACAD-RANKS-2026-V1/VERIFIED-MASTERS',
                'reason_code' => null,
                'message' => 'Verified Master’s qualification permits entry to the Assistant Professor tier.',
            ];
        }

        // 3. Same Rank Check
        if ($from === $to) {
            return [
                'allowed' => false,
                'reason_code' => 'same_rank_transition',
                'message' => "Source and target rank are identical ([{$from}]). Progression requires advancing to the next rank.",
            ];
        }

        // 4. Terminal Rank Check
        if ($this->isTerminalRank($from)) {
            return [
                'allowed' => false,
                'reason_code' => 'no_next_rank',
                'message' => "Rank [{$fromRank['display_label']}] is the terminal top rank with no further advancement path.",
            ];
        }

        // 5. Query transition graph
        $transition = $this->db->table('faculty_rank_transitions')
            ->where('from_rank_code', $from)
            ->where('to_rank_code', $to)
            ->where('is_active', 1)
            ->get()
            ->getRowArray();

        if (!$transition) {
            return [
                'allowed' => false,
                'reason_code' => 'invalid_transition',
                'message' => "Direct progression from [{$fromRank['display_label']}] to [{$toRank['display_label']}] is not allowed in the canonical progression graph.",
            ];
        }

        // 6. Check PhD Exception requirement
        if ($transition['requires_verified_phd']) {
            $hasVerifiedPhd = !empty($context['has_verified_phd']);
            if (!$hasVerifiedPhd) {
                return [
                    'allowed' => false,
                    'reason_code' => 'qualification_exception_not_satisfied',
                    'message' => "Transition to [{$toRank['display_label']}] requires verified Ph.D./Ed.D. credentials.",
                ];
            }
        }

        return [
            'allowed' => true,
            'from_rank' => $fromRank,
            'to_rank' => $toRank,
            'target_rank' => $toRank,
            'transition_type' => $transition['transition_type'],
            'rule_reference' => $transition['rule_reference'],
            'reason_code' => null,
            'message' => 'Transition is valid and permitted by the authoritative progression rules.',
        ];
    }

    private function hasVerifiedMasters(string $personnelProfileId): bool
    {
        if ($personnelProfileId === '' || ! $this->db->tableExists('personnel_credentials')) {
            return false;
        }

        return $this->db->table('personnel_credentials')
            ->where('personnel_profile_id', $personnelProfileId)
            ->where('credential_type', 'degree')
            ->where('degree_level', 'masters')
            ->where('verification_status', 'verified')
            ->where('record_state', 'active')
            ->countAllResults() > 0;
    }
}
