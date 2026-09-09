<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;

/**
 * CampusJournalismScoringService
 *
 * Authoritative scoring engine and explainability generator for the
 * Campus Journalism Award (CAMPUS_JOURNALISM_AWARD).
 *
 * Scoring Model (70 Computable Points):
 * 1. Verified Publication Evidence (Max 60 pts)
 *    - News Item (COMP_JOURN_NEWS): 2 pts/record, cap 10
 *    - Literary (COMP_JOURN_LITERARY): 2 pts/record, cap 10
 *    - Column (COMP_JOURN_COLUMN): 4 pts/record, cap 20
 *    - Editorial (COMP_JOURN_EDITORIAL): 4 pts/record, cap 20
 * 2. Leadership in Campus Journalism (Max 10 pts)
 *    - Leadership Role (COMP_JOURN_LEAD_ROLE): Officer = 3 pts, Member = 2 pts, cap 5
 *    - Recognitions (COMP_JOURN_LEAD_AWARDS): Int/Nat = 3 pts, Local = 2 pts, Seminar = 0 pts, cap 5
 *
 * Threshold: Raw >= 56/70 (>= 80.00% potential score) -> POTENTIAL_CANDIDATE
 */
class CampusJournalismScoringService
{
    public const AWARD_CODE    = 'CAMPUS_JOURNALISM_AWARD';
    public const RAW_MAX_SCORE = 70.0;
    public const THRESHOLD_RAW = 56.0;
    public const THRESHOLD_PCT = 80.0;

    public const COMP_NEWS      = 'COMP_JOURN_NEWS';
    public const COMP_LITERARY  = 'COMP_JOURN_LITERARY';
    public const COMP_COLUMN    = 'COMP_JOURN_COLUMN';
    public const COMP_EDITORIAL = 'COMP_JOURN_EDITORIAL';
    public const COMP_ROLE      = 'COMP_JOURN_LEAD_ROLE';
    public const COMP_AWARDS    = 'COMP_JOURN_LEAD_AWARDS';

    protected BaseConnection $db;
    protected CampusJournalismEligibilityService $eligibilityService;

    public function __construct(
        ?BaseConnection $db = null,
        ?CampusJournalismEligibilityService $eligibilityService = null
    ) {
        $this->db = $db ?? db_connect();
        $this->eligibilityService = $eligibilityService ?? new CampusJournalismEligibilityService($this->db);
    }

    /**
     * Calculates score and detailed explainability payload for a student.
     */
    public function calculateForStudent(string $studentProfileId): array
    {
        // 1. Fetch Phase 3 verified-eligible records only
        $eligibleRecords = $this->eligibilityService->getEligibleRecordsForStudent($studentProfileId);

        // 2. Fetch evidence files for all eligible records
        $recordIds = array_column($eligibleRecords, 'id');
        $evidenceByRecord = [];
        if (! empty($recordIds)) {
            $evidenceRows = $this->db->table('student_portfolio_evidence')
                ->whereIn('portfolio_record_id', $recordIds)
                ->where('status', 'active')
                ->get()->getResultArray();
            foreach ($evidenceRows as $ev) {
                $evidenceByRecord[$ev['portfolio_record_id']][] = $ev;
            }
        }

        // 3. Bucket records by component
        $buckets = [
            self::COMP_NEWS      => [],
            self::COMP_LITERARY  => [],
            self::COMP_COLUMN    => [],
            self::COMP_EDITORIAL => [],
            self::COMP_ROLE      => [],
            self::COMP_AWARDS    => [],
        ];

        foreach ($eligibleRecords as $rec) {
            $rec['evidence_files'] = $evidenceByRecord[$rec['id']] ?? [];
            $subcatId = $rec['subcategory_id'] ?? '';
            $catId = $rec['category_id'] ?? '';

            if ($subcatId === CampusJournalismEligibilityService::PUB_NEWS_ID) {
                $buckets[self::COMP_NEWS][] = $rec;
            } elseif ($subcatId === CampusJournalismEligibilityService::PUB_LITERARY_ID) {
                $buckets[self::COMP_LITERARY][] = $rec;
            } elseif ($subcatId === CampusJournalismEligibilityService::PUB_COLUMN_ID) {
                $buckets[self::COMP_COLUMN][] = $rec;
            } elseif ($subcatId === CampusJournalismEligibilityService::PUB_EDITORIAL_ID) {
                $buckets[self::COMP_EDITORIAL][] = $rec;
            } elseif (in_array($subcatId, [CampusJournalismEligibilityService::ROLE_OFFICER_ID, CampusJournalismEligibilityService::ROLE_MEMBER_ID], true)) {
                $buckets[self::COMP_ROLE][] = $rec;
            } elseif ($catId === CampusJournalismEligibilityService::CATEGORY_CITATION_ID || $catId === CampusJournalismEligibilityService::CATEGORY_SEMINAR_ID) {
                $buckets[self::COMP_AWARDS][] = $rec;
            }
        }

        // 4. Score each component deterministically
        $compNews = $this->scorePublicationComponent(
            self::COMP_NEWS,
            'News Item',
            '2 points per verified published news item, maximum 10 points.',
            2.0,
            10.0,
            $buckets[self::COMP_NEWS]
        );

        $compLiterary = $this->scorePublicationComponent(
            self::COMP_LITERARY,
            'Literary Piece',
            '2 points per verified published literary piece, maximum 10 points.',
            2.0,
            10.0,
            $buckets[self::COMP_LITERARY]
        );

        $compColumn = $this->scorePublicationComponent(
            self::COMP_COLUMN,
            'Column',
            '4 points per verified published column, maximum 20 points.',
            4.0,
            20.0,
            $buckets[self::COMP_COLUMN]
        );

        $compEditorial = $this->scorePublicationComponent(
            self::COMP_EDITORIAL,
            'Editorial',
            '4 points per verified published editorial, maximum 20 points.',
            4.0,
            20.0,
            $buckets[self::COMP_EDITORIAL]
        );

        $compRole = $this->scoreLeadershipRoleComponent($buckets[self::COMP_ROLE]);
        $compAwards = $this->scoreRecognitionComponent($buckets[self::COMP_AWARDS]);

        // 5. Aggregate criterion totals
        $pubUncapped = $compNews['score'] + $compLiterary['score'] + $compColumn['score'] + $compEditorial['score'];
        $pubScore = min($pubUncapped, 60.0);

        $leadUncapped = $compRole['score'] + $compAwards['score'];
        $leadScore = min($leadUncapped, 10.0);

        $rawScore = round($pubScore + $leadScore, 2);
        $potentialScore = round(($rawScore / self::RAW_MAX_SCORE) * 100.0, 2);
        $result = ($rawScore >= self::THRESHOLD_RAW) ? 'POTENTIAL_CANDIDATE' : 'BELOW_THRESHOLD';

        return [
            'award_code'        => self::AWARD_CODE,
            'award_name'        => 'Campus Journalism Award',
            'student_id'        => $studentProfileId,
            'raw_score'         => $rawScore,
            'raw_max'           => self::RAW_MAX_SCORE,
            'potential_score'   => $potentialScore,
            'threshold_percent' => self::THRESHOLD_PCT,
            'threshold_raw'     => self::THRESHOLD_RAW,
            'result'            => $result,
            'calculated_at'     => date('Y-m-d H:i:s'),
            'sections'          => [
                [
                    'criterion_code' => 'CRIT_JOURN_PUB',
                    'label'          => 'Verified Publication Evidence',
                    'score'          => $pubScore,
                    'max_score'      => 60.0,
                    'cap_applied'    => ($pubUncapped > 60.0),
                    'components'     => [
                        $compNews,
                        $compLiterary,
                        $compColumn,
                        $compEditorial,
                    ],
                ],
                [
                    'criterion_code' => 'CRIT_JOURN_LEAD',
                    'label'          => 'Leadership in Campus Journalism',
                    'score'          => $leadScore,
                    'max_score'      => 10.0,
                    'cap_applied'    => ($leadUncapped > 10.0),
                    'components'     => [
                        $compRole,
                        $compAwards,
                    ],
                ],
            ],
        ];
    }

    /**
     * Scores a standard publication component (News, Literary, Column, Editorial).
     */
    protected function scorePublicationComponent(
        string $code,
        string $label,
        string $ruleSummary,
        float $pointsPerRecord,
        float $maxPoints,
        array $records
    ): array {
        // Deterministic sorting: occurrence_date ASC, created_at ASC, id ASC
        usort($records, function ($a, $b) {
            $dateA = $a['occurrence_date'] ?? $a['start_date'] ?? '';
            $dateB = $b['occurrence_date'] ?? $b['start_date'] ?? '';
            if ($dateA !== $dateB) {
                return strcmp($dateA, $dateB);
            }
            return strcmp($a['id'] ?? '', $b['id'] ?? '');
        });

        $qualifyingCount = count($records);
        $uncappedPoints = $qualifyingCount * $pointsPerRecord;
        $accumulated = 0.0;
        $contributingCount = 0;
        $explainedRecords = [];

        foreach ($records as $rec) {
            $pointsPossible = min($pointsPerRecord, max(0.0, $maxPoints - $accumulated));
            if ($pointsPossible > 0.0) {
                $accumulated += $pointsPossible;
                $contributingCount++;
                $contributionStatus = 'COUNTED';
                $awarded = $pointsPossible;
            } else {
                $contributionStatus = 'CAP_REACHED';
                $awarded = 0.0;
            }

            $explainedRecords[] = [
                'record_id'           => $rec['id'],
                'title'               => $rec['title'] ?? '',
                'publication_outlet'  => $rec['organizer_or_body'] ?? '',
                'publication_date'    => $rec['occurrence_date'] ?? $rec['start_date'] ?? '',
                'verification_status' => $rec['status'] ?? 'verified',
                'lifecycle_status'    => 'active',
                'base_points'         => $pointsPerRecord,
                'points_awarded'      => $awarded,
                'contribution_status' => $contributionStatus,
                'evidence_count'      => count($rec['evidence_files'] ?? []),
            ];
        }

        $finalScore = min($uncappedPoints, $maxPoints);

        return [
            'component_code'     => $code,
            'label'              => $label,
            'rule_summary'       => $ruleSummary,
            'points_per_record'  => $pointsPerRecord,
            'score'              => round($finalScore, 2),
            'max_score'          => $maxPoints,
            'qualifying_count'   => $qualifyingCount,
            'contributing_count' => $contributingCount,
            'uncapped_points'    => round($uncappedPoints, 2),
            'cap_applied'        => ($uncappedPoints > $maxPoints),
            'records'            => $explainedRecords,
        ];
    }

    /**
     * Scores leadership roles (Officer = 3 pts, Member = 2 pts, max 5).
     */
    protected function scoreLeadershipRoleComponent(array $records): array
    {
        $maxPoints = 5.0;
        $qualifyingCount = count($records);
        $accumulated = 0.0;
        $contributingCount = 0;
        $explainedRecords = [];
        $seenDistinctKeys = [];

        foreach ($records as $rec) {
            $subcatId = $rec['subcategory_id'] ?? '';
            $isOfficer = ($subcatId === CampusJournalismEligibilityService::ROLE_OFFICER_ID);
            $basePoints = $isOfficer ? 3.0 : 2.0;
            $roleFamily = $isOfficer ? 'Officer' : 'Member / Staff';

            $metadata = is_string($rec['structured_metadata'] ?? null)
                ? (json_decode($rec['structured_metadata'], true) ?? [])
                : ($rec['structured_metadata'] ?? []);

            $period = $metadata['academic_year'] ?? $rec['occurrence_date'] ?? $rec['start_date'] ?? 'unspecified';
            $outlet = $rec['organizer_or_body'] ?? 'unspecified';
            $distinctKey = strtolower("{$outlet}|{$roleFamily}|{$period}");

            if (isset($seenDistinctKeys[$distinctKey])) {
                $explainedRecords[] = [
                    'record_id'           => $rec['id'],
                    'title'               => $rec['title'] ?? '',
                    'role_family'         => $roleFamily,
                    'publication_outlet'  => $outlet,
                    'period'              => $period,
                    'verification_status' => 'verified',
                    'lifecycle_status'    => 'active',
                    'base_points'         => $basePoints,
                    'points_awarded'      => 0.0,
                    'contribution_status' => 'DUPLICATE_ROLE_EXCLUDED',
                    'evidence_count'      => count($rec['evidence_files'] ?? []),
                ];
                continue;
            }

            $seenDistinctKeys[$distinctKey] = true;
            $pointsPossible = min($basePoints, max(0.0, $maxPoints - $accumulated));

            if ($pointsPossible > 0.0) {
                $accumulated += $pointsPossible;
                $contributingCount++;
                $contributionStatus = 'COUNTED';
                $awarded = $pointsPossible;
            } else {
                $contributionStatus = 'CAP_REACHED';
                $awarded = 0.0;
            }

            $explainedRecords[] = [
                'record_id'           => $rec['id'],
                'title'               => $rec['title'] ?? '',
                'role_family'         => $roleFamily,
                'publication_outlet'  => $outlet,
                'period'              => $period,
                'verification_status' => 'verified',
                'lifecycle_status'    => 'active',
                'base_points'         => $basePoints,
                'points_awarded'      => $awarded,
                'contribution_status' => $contributionStatus,
                'evidence_count'      => count($rec['evidence_files'] ?? []),
            ];
        }

        $finalScore = min($accumulated, $maxPoints);

        return [
            'component_code'     => self::COMP_ROLE,
            'label'              => 'Leadership Involvement in Campus Journalism',
            'rule_summary'       => 'Officer roles contribute 3 points; Member/Staff contribute 2 points per distinct period. Maximum 5 points.',
            'points_per_record'  => null,
            'score'              => round($finalScore, 2),
            'max_score'          => $maxPoints,
            'qualifying_count'   => $qualifyingCount,
            'contributing_count' => $contributingCount,
            'uncapped_points'    => round($accumulated, 2),
            'cap_applied'        => ($accumulated > $maxPoints),
            'records'            => $explainedRecords,
        ];
    }

    /**
     * Scores recognitions (Int/Nat = 3 pts, Local = 2 pts, Seminar = 0 pts, max 5).
     */
    protected function scoreRecognitionComponent(array $records): array
    {
        $maxPoints = 5.0;
        $qualifyingCount = count($records);
        $accumulated = 0.0;
        $contributingCount = 0;
        $explainedRecords = [];

        foreach ($records as $rec) {
            $catId = $rec['category_id'] ?? '';
            $isSeminar = ($catId === CampusJournalismEligibilityService::CATEGORY_SEMINAR_ID);

            if ($isSeminar) {
                $explainedRecords[] = [
                    'record_id'           => $rec['id'],
                    'title'               => $rec['title'] ?? '',
                    'recognition_level'   => 'Seminar / Training',
                    'conferring_body'     => $rec['organizer_or_body'] ?? '',
                    'date'                => $rec['occurrence_date'] ?? $rec['start_date'] ?? '',
                    'verification_status' => 'verified',
                    'lifecycle_status'    => 'active',
                    'base_points'         => 0.0,
                    'points_awarded'      => 0.0,
                    'contribution_status' => 'SUPPORTING_ONLY',
                    'evidence_count'      => count($rec['evidence_files'] ?? []),
                ];
                continue;
            }

            $metadata = is_string($rec['structured_metadata'] ?? null)
                ? (json_decode($rec['structured_metadata'], true) ?? [])
                : ($rec['structured_metadata'] ?? []);

            $level = strtolower((string) ($metadata['recognition_level'] ?? 'local'));
            $basePoints = in_array($level, ['international', 'national'], true) ? 3.0 : 2.0;

            $pointsPossible = min($basePoints, max(0.0, $maxPoints - $accumulated));
            if ($pointsPossible > 0.0) {
                $accumulated += $pointsPossible;
                $contributingCount++;
                $contributionStatus = 'COUNTED';
                $awarded = $pointsPossible;
            } else {
                $contributionStatus = 'CAP_REACHED';
                $awarded = 0.0;
            }

            $explainedRecords[] = [
                'record_id'           => $rec['id'],
                'title'               => $rec['title'] ?? '',
                'recognition_level'   => ucfirst($level),
                'conferring_body'     => $rec['organizer_or_body'] ?? '',
                'date'                => $rec['occurrence_date'] ?? $rec['start_date'] ?? '',
                'verification_status' => 'verified',
                'lifecycle_status'    => 'active',
                'base_points'         => $basePoints,
                'points_awarded'      => $awarded,
                'contribution_status' => $contributionStatus,
                'evidence_count'      => count($rec['evidence_files'] ?? []),
            ];
        }

        $finalScore = min($accumulated, $maxPoints);

        return [
            'component_code'     => self::COMP_AWARDS,
            'label'              => 'Journalism Awards, Citations & Trainings',
            'rule_summary'       => 'International/National awards contribute 3 points; Local citations contribute 2 points; Seminars contribute 0 points. Maximum 5 points.',
            'points_per_record'  => null,
            'score'              => round($finalScore, 2),
            'max_score'          => $maxPoints,
            'qualifying_count'   => $qualifyingCount,
            'contributing_count' => $contributingCount,
            'uncapped_points'    => round($accumulated, 2),
            'cap_applied'        => ($accumulated > $maxPoints),
            'records'            => $explainedRecords,
        ];
    }

    /**
     * Generates and returns all qualifying potential candidates for the Campus Journalism Award.
     * Enforces:
     * - Graduating students (or active enrolled students)
     * - Threshold: raw >= 56/70 (potential >= 80.00%)
     * - No Top-N truncation (all qualifying candidates returned)
     * - Deterministic sort: potential DESC, raw DESC, name ASC
     */
    public function listCampusJournalismCandidates(): array
    {
        $students = $this->db->table('profiles p')
            ->select([
                'p.id AS student_id',
                'p.full_name AS student_name',
                'p.institutional_id',
                'p.email AS student_email',
                'ap.code AS program_code',
                'ap.name AS program_name',
                'c.name AS college_name',
                'spe.year_level',
            ])
            ->join('student_program_enrollments spe', 'spe.student_profile_id = p.id AND spe.is_active = 1', 'left')
            ->join('academic_programs ap', 'ap.id = spe.academic_program_id', 'left')
            ->join('colleges c', 'c.id = ap.college_id', 'left')
            ->where('p.account_type', 'student')
            ->where('p.status', 'active')
            ->get()->getResultArray();

        $candidates = [];

        foreach ($students as $student) {
            $scorePayload = $this->calculateForStudent($student['student_id']);

            if (($scorePayload['result'] ?? '') === 'POTENTIAL_CANDIDATE') {
                $candidates[] = [
                    'student_id'        => $student['student_id'],
                    'student_name'      => $student['student_name'],
                    'institutional_id'  => $student['institutional_id'],
                    'student_email'     => $student['student_email'],
                    'program_code'      => $student['program_code'] ?? 'N/A',
                    'program_name'      => $student['program_name'] ?? 'General Academic Program',
                    'college_name'      => $student['college_name'] ?? 'General College',
                    'year_level'        => $student['year_level'] ?? '4th Year',
                    'publication_score' => $scorePayload['sections'][0]['score'] ?? 0.0,
                    'leadership_score'  => $scorePayload['sections'][1]['score'] ?? 0.0,
                    'raw_score'         => $scorePayload['raw_score'],
                    'raw_max'           => $scorePayload['raw_max'],
                    'potential_score'   => $scorePayload['potential_score'],
                    'threshold_percent' => $scorePayload['threshold_percent'],
                    'threshold_raw'     => $scorePayload['threshold_raw'],
                    'status_label'      => 'Potential Campus Journalism Award Candidate — Portfolio-Based',
                    'pathway'           => 'Portfolio-Based Discovery',
                    'calculated_at'     => $scorePayload['calculated_at'],
                    'scoring_basis'     => $scorePayload,
                ];
            }
        }

        // Sort: potential_score DESC, raw_score DESC, student_name ASC
        usort($candidates, function ($a, $b) {
            if ($b['potential_score'] !== $a['potential_score']) {
                return $b['potential_score'] <=> $a['potential_score'];
            }
            if ($b['raw_score'] !== $a['raw_score']) {
                return $b['raw_score'] <=> $a['raw_score'];
            }
            return strcmp($a['student_name'], $b['student_name']);
        });

        return $candidates;
    }
}
