<?php

namespace App\Services;

/**
 * Checks the workbook's "Present Rank" against the Present Rank recorded in AchieveNest
 * (personnel_profiles.current_rank_title — the authoritative value), then checks "Applied Status"
 * (rank applied for) against the seeded Full-Time rank catalog and its active transitions.
 *
 * Advisory only: it never changes the workbook, the import, or any rank-applied-for decision.
 * All progression rules come from FacultyRankProgressionService (faculty_rank_transitions);
 * nothing is hard-coded here.
 */
class AnnualReviewRankAlignmentService
{
    private const ROMAN = ['1' => 'I', '2' => 'II', '3' => 'III', '4' => 'IV'];

    public function __construct(
        private ?FacultyRankCatalogService $catalog = null,
        private ?FacultyRankProgressionService $progression = null
    ) {
        $this->catalog ??= new FacultyRankCatalogService();
        $this->progression ??= new FacultyRankProgressionService($this->catalog);
    }

    /**
     * @param array $personnel roster row: current_rank_title (the system's Present Rank, as used by
     *                         RankAppliedForService), personnel_group, faculty_engagement
     * @param bool|null $hasVerifiedPhd verified doctorate on record; null when unknown
     */
    public function evaluate(?string $workbookPresentText, ?string $appliedText, array $personnel = [], ?bool $hasVerifiedPhd = null): array
    {
        $systemText = trim((string) ($personnel['current_rank_title'] ?? ''));
        $system = $this->match($systemText);
        $workbookPresent = $this->match($workbookPresentText);
        $applied = $this->match($appliedText);

        // 1. Present Rank: the system record is authoritative; the workbook is checked against it.
        $presentCheck = $this->presentCheck($systemText, $system, $workbookPresentText, $workbookPresent);
        $basis = $system ?? $workbookPresent;
        $base = [
            'system_present_rank' => $this->summary($systemText, $system),
            'present_rank' => $this->summary($workbookPresentText, $workbookPresent),
            'present_rank_check' => $presentCheck,
            'applied_rank' => $this->summary($appliedText, $applied),
            'basis' => $system ? 'system' : ($workbookPresent ? 'workbook' : null),
            'recommended_rank' => null,
            'valid_target_ranks' => [],
        ];
        if (! $basis) return $base + $this->status('present_rank_unresolved', 'No Present Rank could be resolved from the system record or the workbook, so no recommendation can be made.');

        // 2. Applied Status: compared with the seeded progression from the authoritative Present Rank.
        $transitions = $this->progression->getAllowedTransitions($basis['rank_code'], [
            'personnel_group' => strtolower((string) ($personnel['personnel_group'] ?? 'faculty')) ?: 'faculty',
            'faculty_engagement' => (string) ($personnel['faculty_engagement'] ?? '') ?: 'full_time_faculty',
            'has_verified_phd' => true, // list PhD exceptions; verification is reported separately below
        ]);
        if (in_array($transitions['status'] ?? '', ['INELIGIBLE', 'UNRESOLVED'], true)) {
            return $base + $this->status('not_applicable', (string) ($transitions['message'] ?? 'Rank progression does not apply to this personnel.'));
        }

        $normal = $transitions['normal_next_rank'] ?? null;
        $phdTargets = [];
        foreach ($transitions['allowed_exception_transitions'] ?? [] as $exception) {
            if (! empty($exception['requires_verified_phd'])) $phdTargets[] = $exception['rank']['rank_code'];
        }
        $base['valid_target_ranks'] = array_map(fn ($t) => [
            'rank_code' => $t['rank_code'],
            'display_label' => $t['display_label'],
            'transition_type' => $t['transition_type'],
            'requires_verified_phd' => in_array($t['rank_code'], $phdTargets, true),
        ], $transitions['all_valid_target_ranks'] ?? []);
        if ($normal) $base['recommended_rank'] = ['rank_code' => $normal['rank_code'], 'display_label' => $normal['display_label'], 'transition_type' => 'normal_sequential'];
        $from = $basis['display_label'] . ($system ? ' (system record)' : ' (workbook; no system rank on record)');

        if (! empty($transitions['is_terminal'])) {
            $base['recommended_rank'] = null;
            return $base + $this->status('terminal', $from . ' has no next rank in the seeded progression.');
        }
        if (trim((string) $appliedText) === '') return $base + $this->status('applied_rank_missing', 'Applied Status was not found in the workbook.' . $this->recommendText($normal));
        if (! $applied) return $base + $this->status('applied_rank_unrecognized', 'Applied Status "' . trim((string) $appliedText) . '" does not match any rank in the seeded faculty rank catalog.' . $this->recommendText($normal));

        if ($normal && $applied['rank_code'] === $normal['rank_code']) return $base + $this->status('aligned', 'Applied Status follows the normal progression from ' . $from . '.');
        if (in_array($applied['rank_code'], $phdTargets, true)) {
            if ($hasVerifiedPhd === true) return $base + $this->status('aligned', 'Applied Status is the PhD exception from ' . $from . ', and a verified doctorate is on record.');
            return $base + $this->status('aligned_requires_phd', $applied['display_label'] . ' is allowed from ' . $from . ' only through the PhD exception, and no verified doctorate is on record.' . $this->recommendText($normal));
        }
        foreach ($base['valid_target_ranks'] as $target) {
            if ($target['rank_code'] === $applied['rank_code']) return $base + $this->status('aligned', 'Applied Status is a valid progression from ' . $from . '.');
        }
        return $base + $this->status('misaligned', $applied['display_label'] . ' is not a valid next rank from ' . $from . '.' . $this->recommendText($normal));
    }

    private function presentCheck(string $systemText, ?array $system, ?string $workbookText, ?array $workbook): array
    {
        $workbookText = trim((string) $workbookText);
        if ($systemText === '') return ['status' => 'system_missing', 'message' => 'No Present Rank is recorded in AchieveNest for this personnel. HR should record it; the workbook value is used meanwhile.'];
        if (! $system) return ['status' => 'system_unrecognized', 'message' => 'The Present Rank recorded in AchieveNest ("' . $systemText . '") is not in the seeded rank catalog.'];
        if ($workbookText === '') return ['status' => 'workbook_missing', 'message' => 'The workbook has no Present Rank. AchieveNest records ' . $system['display_label'] . '.'];
        if (! $workbook) return ['status' => 'workbook_unrecognized', 'message' => 'The workbook Present Rank "' . $workbookText . '" is not a seeded rank. AchieveNest records ' . $system['display_label'] . '.'];
        if ($workbook['rank_code'] === $system['rank_code']) return ['status' => 'match', 'message' => 'The workbook Present Rank matches the AchieveNest record.'];
        return ['status' => 'mismatch', 'message' => 'The workbook says ' . $workbook['display_label'] . ', but AchieveNest records ' . $system['display_label'] . '. The AchieveNest record is used.'];
    }

    /** Verified doctorate on record, using the same rule as RankAppliedForService. Null when credentials are unavailable. */
    public static function hasVerifiedPhd($db, string $personnelId): ?bool
    {
        if ($personnelId === '' || ! $db->tableExists('personnel_credentials')) return null;
        return $db->table('personnel_credentials')->where(['personnel_profile_id' => $personnelId, 'verification_status' => 'verified', 'record_state' => 'active', 'credential_type' => 'degree', 'degree_level' => 'doctorate'])->countAllResults() > 0;
    }

    /** Matches workbook text to a catalog rank: case/space-insensitive, "Instructor 1" ≡ "Instructor I". */
    public function match(?string $text): ?array
    {
        $key = $this->normalize((string) $text);
        if ($key === '') return null;
        $code = strtoupper(trim((string) $text));
        foreach ($this->catalog->getFullTimeFacultyRanks() as $rank) {
            // Same identifiers RankAppliedForService accepts for current_rank_title: rank_code or display label.
            if ($rank['rank_code'] === $code || $this->normalize($rank['display_label']) === $key) return $rank;
        }
        return null;
    }

    public function normalize(string $text): string
    {
        $text = strtolower(trim(preg_replace('/\s+/', ' ', str_replace('.', ' ', $text))));
        return preg_replace_callback('/\s([1-4])$/', fn ($m) => ' ' . strtolower(self::ROMAN[$m[1]]), $text);
    }

    private function summary(?string $text, ?array $rank): array
    {
        return ['workbook_text' => trim((string) $text) ?: null, 'rank_code' => $rank['rank_code'] ?? null, 'display_label' => $rank['display_label'] ?? null];
    }

    private function status(string $status, string $message): array
    {
        return ['status' => $status, 'message' => $message];
    }

    private function recommendText(?array $normal): string
    {
        return $normal ? ' Recommended: ' . $normal['display_label'] . '.' : '';
    }
}
