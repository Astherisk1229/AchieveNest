<?php

namespace App\Services;

use Config\Database;

/**
 * Class FacultyInitialRankService
 *
 * Authoritative Full-Time Faculty initial rank seeding and current-rank reconciliation engine.
 * Plan E — Phase E4.
 *
 * Core Invariants:
 * 1. Initial rank seeding maps verified qualification/licensure context to the base starting rank.
 * 2. It NEVER automatically demotes an existing valid rank.
 * 3. It NEVER automatically promotes an existing valid rank (progression is governed by Phase E2 / Plan H).
 * 4. It rejects Part-Time Faculty (routed to Phase E3) and Non-Teaching Personnel.
 * 5. Unverified qualifications or missing licensure produce unresolved outcomes rather than guesses.
 */
class FacultyInitialRankService
{
    protected $db;
    protected FacultyRankCatalogService $catalogService;

    /**
     * Canonical source reference
     */
    public const SOURCE_DOCUMENT_ID = 'NDMU-DOC-ACAD-RANKS-2026-V1';
    public const SEED_VERSION = '2026.1';

    /**
     * Base starting ranks per qualification group
     */
    public const BASE_RANKS = [
        'doctoral' => [
            'rank_code' => 'PROFESSOR_I',
            'display_label' => 'Professor I',
            'tier' => 'doctoral',
            'reason_code' => 'doctoral_initial_rank',
        ],
        'masters' => [
            'rank_code' => 'ASSISTANT_PROFESSOR',
            'display_label' => 'Assistant Professor',
            'tier' => 'masters',
            'reason_code' => 'masters_initial_rank',
        ],
        'board_licensure' => [
            'rank_code' => 'SENIOR_INSTRUCTOR',
            'display_label' => 'Senior Instructor',
            'tier' => 'board_licensure',
            'reason_code' => 'licensed_professional_initial_rank',
        ],
        'baccalaureate' => [
            'rank_code' => 'ASSISTANT_INSTRUCTOR',
            'display_label' => 'Assistant Instructor',
            'tier' => 'baccalaureate',
            'reason_code' => 'baccalaureate_initial_rank',
        ],
    ];

    /**
     * Authoritative qualification maps
     */
    protected const DOCTORAL_KEYWORDS = [
        'phd', 'ph.d', 'ph.d.', 'edd', 'ed.d', 'ed.d.', 'doctor of philosophy',
        'doctor of education', 'doctorate', 'd.phil', 's.t.d', 'std',
    ];

    protected const MASTERS_KEYWORDS = [
        'ma', 'm.a', 'm.a.', 'ms', 'm.s', 'm.s.', 'mat', 'm.a.t', 'm.a.t.',
        'md', 'm.d', 'm.d.', 'llb', 'll.b', 'll.b.', 'master', 'masters',
        'priest', 'priests', 'ordained', 'seminarian', 'equivalent religious',
    ];

    protected const BOARD_LICENSURE_KEYWORDS = [
        'cpa', 'engr', 'engr.', 'engineer', 'engineering',
        'medtech', 'med tech', 'medical technologist', 'medical technology',
        'chemist', 'chemistry',
        'nurse', 'nursing', 'rn',
        'dvm', 'd.v.m', 'veterinary', 'veterinarian',
        'architect', 'architecture',
        'dmd', 'd.m.d', 'ddm', 'dentist', 'dentistry',
        'social worker', 'social work', 'rsw',
    ];

    protected const BACCALAUREATE_KEYWORDS = [
        'ab', 'a.b', 'a.b.', 'bse', 'b.s.e', 'b.s.e.', 'bs', 'b.s', 'b.s.',
        'bachelor', 'baccalaureate', 'ba', 'b.a', 'b.a.',
    ];

    /**
     * Legacy Rank Aliases to Canonical Codes
     */
    protected const RANK_ALIASES = [
        'PROFESSOR' => 'PROFESSOR_I',
        'PROFESSOR I' => 'PROFESSOR_I',
        'ASSISTANT PROFESSOR' => 'ASSISTANT_PROFESSOR',
        'ASSOCIATE PROFESSOR' => 'ASSOCIATE_PROFESSOR',
        'SENIOR INSTRUCTOR' => 'SENIOR_INSTRUCTOR',
        'INSTRUCTOR' => 'INSTRUCTOR_I',
        'INSTRUCTOR I' => 'INSTRUCTOR_I',
        'ASSISTANT INSTRUCTOR' => 'ASSISTANT_INSTRUCTOR',
        'UNIVERSITY PROFESSOR' => 'UNIVERSITY_PROFESSOR',
    ];

    public function __construct(?FacultyRankCatalogService $catalogService = null)
    {
        $this->db = Database::connect();
        $this->catalogService = $catalogService ?? new FacultyRankCatalogService();
    }

    /**
     * Resolves the canonical initial base rank from verified qualification and licensure context.
     *
     * @param array $context
     * @return array Structured resolution DTO
     */
    public function resolveInitialRank(array $context): array
    {
        // 1. Check Faculty Scope (Plan D Boundary)
        $engagement = $context['faculty_engagement'] ?? $context['workload_status'] ?? 'full_time_faculty';
        if ($engagement === 'part_time_faculty') {
            return [
                'status' => 'INELIGIBLE',
                'seed_action' => 'no_action',
                'reason_code' => 'part_time_not_applicable',
                'resolved_initial_rank_code' => null,
                'resolved_initial_rank_name' => null,
                'qualification_group' => null,
                'qualification_verified' => false,
                'licensure_verified' => false,
                'source_reference' => self::SOURCE_DOCUMENT_ID,
                'requires_hr_review' => false,
                'message' => 'Part-Time Faculty receive qualification-based titles (Phase E3) and are not seeded with Full-Time ranks.',
            ];
        }

        $personnelGroup = $context['personnel_group'] ?? 'faculty';
        if ($personnelGroup !== 'faculty') {
            return [
                'status' => 'INELIGIBLE',
                'seed_action' => 'no_action',
                'reason_code' => 'non_teaching_not_applicable',
                'resolved_initial_rank_code' => null,
                'resolved_initial_rank_name' => null,
                'qualification_group' => null,
                'qualification_verified' => false,
                'licensure_verified' => false,
                'source_reference' => self::SOURCE_DOCUMENT_ID,
                'requires_hr_review' => false,
                'message' => 'Non-Teaching personnel are outside the Full-Time Faculty academic rank model.',
            ];
        }

        // 2. Check Qualification Verification Flag
        $isQualVerified = !empty($context['qualification_verified']) || !empty($context['has_verified_qualification']);
        if (!$isQualVerified) {
            return [
                'status' => 'UNRESOLVED',
                'seed_action' => 'no_action',
                'reason_code' => 'qualification_not_verified',
                'resolved_initial_rank_code' => null,
                'resolved_initial_rank_name' => null,
                'qualification_group' => null,
                'qualification_verified' => false,
                'licensure_verified' => false,
                'source_reference' => self::SOURCE_DOCUMENT_ID,
                'requires_hr_review' => true,
                'message' => 'Qualification is not verified. Initial rank cannot be seeded without verified HR qualification records.',
            ];
        }

        // 3. Normalize Qualification string
        $qualString = trim((string)($context['qualification_code'] ?? $context['qualification_title'] ?? $context['qualification'] ?? ''));
        if ($qualString === '') {
            return [
                'status' => 'UNRESOLVED',
                'seed_action' => 'no_action',
                'reason_code' => 'qualification_not_verified',
                'resolved_initial_rank_code' => null,
                'resolved_initial_rank_name' => null,
                'qualification_group' => null,
                'qualification_verified' => false,
                'licensure_verified' => false,
                'source_reference' => self::SOURCE_DOCUMENT_ID,
                'requires_hr_review' => true,
                'message' => 'No qualification credential was provided in the personnel context.',
            ];
        }

        $group = $this->determineQualificationGroup($qualString);
        $isLicensureVerified = !empty($context['licensure_verified']) || !empty($context['has_verified_licensure']) || !empty($context['board_passer']);

        if (!$group) {
            return [
                'status' => 'UNRESOLVED',
                'seed_action' => 'no_action',
                'reason_code' => 'seed_rule_unresolved',
                'resolved_initial_rank_code' => null,
                'resolved_initial_rank_name' => null,
                'qualification_group' => null,
                'qualification_verified' => true,
                'licensure_verified' => $isLicensureVerified,
                'source_reference' => self::SOURCE_DOCUMENT_ID,
                'requires_hr_review' => true,
                'message' => "Qualification [{$qualString}] is not mapped to an authoritative rank tier in " . self::SOURCE_DOCUMENT_ID . '.',
            ];
        }

        // 4. Handle Licensure Dependency for Professional Group
        if ($group === 'board_licensure') {
            if (!$isLicensureVerified) {
                // If licensure is NOT verified, cannot assign Senior Instructor.
                // Resolves to baseline Assistant Instructor or requires licensure verification.
                $base = self::BASE_RANKS['baccalaureate'];
                return [
                    'status' => 'OK',
                    'seed_action' => 'seed_initial_rank',
                    'reason_code' => 'licensure_not_verified',
                    'resolved_initial_rank_code' => $base['rank_code'],
                    'resolved_initial_rank_name' => $base['display_label'],
                    'qualification_group' => 'baccalaureate',
                    'qualification_verified' => true,
                    'licensure_verified' => false,
                    'source_reference' => self::SOURCE_DOCUMENT_ID,
                    'requires_hr_review' => false,
                    'message' => 'Professional degree verified without confirmed board licensure. Resolved to Assistant Instructor base rank.',
                ];
            }
        }

        // 5. Lookup Base Rank
        $base = self::BASE_RANKS[$group];

        return [
            'status' => 'OK',
            'seed_action' => 'seed_initial_rank',
            'reason_code' => $base['reason_code'],
            'resolved_initial_rank_code' => $base['rank_code'],
            'resolved_initial_rank_name' => $base['display_label'],
            'qualification_group' => $base['tier'],
            'qualification_verified' => true,
            'licensure_verified' => $isLicensureVerified,
            'source_reference' => self::SOURCE_DOCUMENT_ID,
            'requires_hr_review' => false,
            'message' => "Resolved to base rank [{$base['display_label']}] based on verified {$base['tier']} qualifications.",
        ];
    }

    /**
     * Reconciles current Personnel rank against catalog and verified qualifications.
     * Enforces Non-Demotion, Non-Promotion, and safe Preservation of existing ranks.
     *
     * @param array $context
     * @return array
     */
    public function reconcileCurrentRank(array $context): array
    {
        $profileId = $context['personnel_profile_id'] ?? $context['personnel_id'] ?? null;
        $currentRankRaw = trim((string)($context['current_rank'] ?? $context['current_rank_code'] ?? $context['rank'] ?? ''));

        // Check scope first
        $engagement = $context['faculty_engagement'] ?? $context['workload_status'] ?? 'full_time_faculty';
        if ($engagement === 'part_time_faculty') {
            return [
                'personnel_profile_id' => $profileId,
                'current_rank_code' => $currentRankRaw ?: null,
                'current_rank_name' => null,
                'current_rank_status' => 'ineligible',
                'resolved_initial_rank_code' => null,
                'resolved_initial_rank_name' => null,
                'qualification_group' => null,
                'qualification_verified' => false,
                'licensure_verified' => false,
                'seed_action' => 'no_action',
                'reason_code' => 'part_time_not_applicable',
                'source_reference' => self::SOURCE_DOCUMENT_ID,
                'requires_hr_review' => false,
                'message' => 'Part-Time Faculty are governed by Phase E3 title resolution and excluded from Full-Time rank seeding.',
            ];
        }

        $personnelGroup = $context['personnel_group'] ?? 'faculty';
        if ($personnelGroup !== 'faculty') {
            return [
                'personnel_profile_id' => $profileId,
                'current_rank_code' => $currentRankRaw ?: null,
                'current_rank_name' => null,
                'current_rank_status' => 'ineligible',
                'resolved_initial_rank_code' => null,
                'resolved_initial_rank_name' => null,
                'qualification_group' => null,
                'qualification_verified' => false,
                'licensure_verified' => false,
                'seed_action' => 'no_action',
                'reason_code' => 'non_teaching_not_applicable',
                'source_reference' => self::SOURCE_DOCUMENT_ID,
                'requires_hr_review' => false,
                'message' => 'Non-Teaching personnel cannot be assigned Full-Time Academic ranks.',
            ];
        }

        // Case A: Missing Current Rank -> Resolve Initial Seed Rank
        if ($currentRankRaw === '') {
            $resolution = $this->resolveInitialRank($context);
            if ($resolution['status'] === 'OK') {
                return [
                    'personnel_profile_id' => $profileId,
                    'current_rank_code' => null,
                    'current_rank_name' => null,
                    'current_rank_status' => 'missing',
                    'resolved_initial_rank_code' => $resolution['resolved_initial_rank_code'],
                    'resolved_initial_rank_name' => $resolution['resolved_initial_rank_name'],
                    'qualification_group' => $resolution['qualification_group'],
                    'qualification_verified' => $resolution['qualification_verified'],
                    'licensure_verified' => $resolution['licensure_verified'],
                    'seed_action' => 'seed_initial_rank',
                    'reason_code' => $resolution['reason_code'],
                    'source_reference' => self::SOURCE_DOCUMENT_ID,
                    'requires_hr_review' => false,
                    'message' => "Current rank is missing. Proposing initial base rank [{$resolution['resolved_initial_rank_name']}].",
                ];
            }

            return [
                'personnel_profile_id' => $profileId,
                'current_rank_code' => null,
                'current_rank_name' => null,
                'current_rank_status' => 'missing',
                'resolved_initial_rank_code' => null,
                'resolved_initial_rank_name' => null,
                'qualification_group' => null,
                'qualification_verified' => $resolution['qualification_verified'],
                'licensure_verified' => $resolution['licensure_verified'],
                'seed_action' => 'no_action',
                'reason_code' => $resolution['reason_code'],
                'source_reference' => self::SOURCE_DOCUMENT_ID,
                'requires_hr_review' => true,
                'message' => $resolution['message'],
            ];
        }

        // Case B: Existing Current Rank -> Validate Against Catalog & Aliases
        $canonicalRank = $this->resolveCanonicalRank($currentRankRaw);

        if ($canonicalRank) {
            // Valid existing rank found in E1 catalog
            $initialResolution = $this->resolveInitialRank($context);

            return [
                'personnel_profile_id' => $profileId,
                'current_rank_code' => $canonicalRank['rank_code'],
                'current_rank_name' => $canonicalRank['display_label'],
                'current_rank_status' => 'valid',
                'resolved_initial_rank_code' => $initialResolution['resolved_initial_rank_code'] ?? null,
                'resolved_initial_rank_name' => $initialResolution['resolved_initial_rank_name'] ?? null,
                'qualification_group' => $initialResolution['qualification_group'] ?? null,
                'qualification_verified' => $initialResolution['qualification_verified'] ?? false,
                'licensure_verified' => $initialResolution['licensure_verified'] ?? false,
                'seed_action' => 'preserve_current',
                'reason_code' => 'current_rank_valid',
                'source_reference' => self::SOURCE_DOCUMENT_ID,
                'requires_hr_review' => false,
                'message' => "Existing rank [{$canonicalRank['display_label']}] is valid and preserved. Initial rank seeding does not modify established ranks.",
            ];
        }

        // Case C: Unknown / Unmapped Current Rank -> Requires HR Reconciliation
        $initialResolution = $this->resolveInitialRank($context);

        return [
            'personnel_profile_id' => $profileId,
            'current_rank_code' => $currentRankRaw,
            'current_rank_name' => null,
            'current_rank_status' => 'unknown',
            'resolved_initial_rank_code' => $initialResolution['resolved_initial_rank_code'] ?? null,
            'resolved_initial_rank_name' => $initialResolution['resolved_initial_rank_name'] ?? null,
            'qualification_group' => $initialResolution['qualification_group'] ?? null,
            'qualification_verified' => $initialResolution['qualification_verified'] ?? false,
            'licensure_verified' => $initialResolution['licensure_verified'] ?? false,
            'seed_action' => 'requires_reconciliation',
            'reason_code' => 'rank_reconciliation_required',
            'source_reference' => self::SOURCE_DOCUMENT_ID,
            'requires_hr_review' => true,
            'message' => "Current rank [{$currentRankRaw}] is not found in the authoritative 26-rank catalog. HR reconciliation is required.",
        ];
    }

    /**
     * Resolves a rank string (code, label, or alias) to a canonical catalog rank record.
     *
     * @param string $rankIdentifier
     * @return array|null
     */
    public function resolveCanonicalRank(string $rankIdentifier): ?array
    {
        $id = trim($rankIdentifier);
        if ($id === '') {
            return null;
        }

        // 1. Direct code lookup
        $rank = $this->catalogService->getRankByCode($id);
        if ($rank) {
            return $rank;
        }

        // 2. Direct display label lookup
        $rank = $this->catalogService->getRankByLabel($id);
        if ($rank) {
            return $rank;
        }

        // 3. Normalized alias lookup
        $normalized = strtoupper($id);
        if (isset(self::RANK_ALIASES[$normalized])) {
            return $this->catalogService->getRankByCode(self::RANK_ALIASES[$normalized]);
        }

        return null;
    }

    /**
     * Helper to determine qualification group from text string.
     *
     * @param string $qual
     * @return string|null
     */
    protected function determineQualificationGroup(string $qual): ?string
    {
        $normalized = strtolower(trim($qual));
        $normalized = preg_replace('/[^\w\s\.]/', ' ', $normalized);

        // Check Doctoral
        foreach (self::DOCTORAL_KEYWORDS as $kw) {
            if ($this->matchKeyword($normalized, $kw)) {
                return 'doctoral';
            }
        }

        // Check Master's
        foreach (self::MASTERS_KEYWORDS as $kw) {
            if ($this->matchKeyword($normalized, $kw)) {
                return 'masters';
            }
        }

        // Check Professional Licensure
        foreach (self::BOARD_LICENSURE_KEYWORDS as $kw) {
            if ($this->matchKeyword($normalized, $kw)) {
                return 'board_licensure';
            }
        }

        // Check Baccalaureate
        foreach (self::BACCALAUREATE_KEYWORDS as $kw) {
            if ($this->matchKeyword($normalized, $kw)) {
                return 'baccalaureate';
            }
        }

        return null;
    }

    /**
     * Checks if keyword exists as exact token or phrase in text.
     */
    protected function matchKeyword(string $text, string $keyword): bool
    {
        $pattern = '/\b' . preg_quote($keyword, '/') . '\b/i';
        return (bool)preg_match($pattern, $text);
    }
}
