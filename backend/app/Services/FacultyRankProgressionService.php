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

        $transition = $this->db->table('faculty_rank_transitions')
            ->where('from_rank_code', $current['rank_code'])
            ->where('transition_type', 'normal_sequential')
            ->where('is_active', 1)
            ->get()
            ->getRowArray();

        if (!$transition) {
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
                'status' => 'INELIGIBLE',
                'reason_code' => 'unsupported_personnel_group',
                'message' => 'Non-teaching personnel are outside the Faculty Academic Rank progression graph.',
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

        // Check for active exceptions from this rank
        $exceptionRows = $this->db->table('faculty_rank_transitions')
            ->where('from_rank_code', $current['rank_code'])
            ->where('transition_type', 'phd_exception')
            ->where('is_active', 1)
            ->get()
            ->getResultArray();

        $allowedExceptions = [];
        foreach ($exceptionRows as $ex) {
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
                'reason_code' => 'unsupported_personnel_group',
                'message' => 'Non-teaching personnel cannot participate in Faculty rank progression.',
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
            'transition_type' => $transition['transition_type'],
            'rule_reference' => $transition['rule_reference'],
            'reason_code' => null,
            'message' => 'Transition is valid and permitted by the authoritative progression rules.',
        ];
    }
}
