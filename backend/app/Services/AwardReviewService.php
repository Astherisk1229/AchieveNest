<?php

namespace App\Services;

use RuntimeException;
use InvalidArgumentException;
use Throwable;

/**
 * AwardReviewService
 *
 * Authoritative OSAD Award Evaluation Workflow & Committee Review Orchestrator for AchieveNest.
 * Orchestrates Phase 3 (Eligibility), Phase 4 (Evidence Mapping), Phase 5 (Scoring Engine & Traceability),
 * and Phase 6 (Manual/Panel Criteria, Review Statuses, Reviewer Notes, and Finalization).
 *
 * Invariant:
 * - Does NOT overwrite or alter Phase 5 computed portfolio scores.
 * - Does NOT compute Potential Candidate status (>= 80%), rankings, Top 3/5, or select winners.
 * - Keeps Computed Portfolio Scores and Manual/Panel Criteria strictly separated.
 */
class AwardReviewService
{
    protected $db = null;
    protected AwardEligibilityService $eligibilityService;
    protected AwardEvidenceMappingService $mappingService;
    protected AwardScoringService $scoringService;

    public const STATUS_NOT_REVIEWED = 'NOT_REVIEWED';
    public const STATUS_IN_PROGRESS  = 'IN_PROGRESS';
    public const STATUS_EVALUATED    = 'EVALUATED';

    public function __construct(
        $db = null,
        ?AwardEligibilityService $eligibilityService = null,
        ?AwardEvidenceMappingService $mappingService = null,
        ?AwardScoringService $scoringService = null
    ) {
        if ($db !== null) {
            $this->db = $db;
        } elseif (function_exists('db_connect')) {
            $this->db = db_connect();
        }
        $this->eligibilityService = $eligibilityService ?? new AwardEligibilityService($this->db);
        $this->mappingService = $mappingService ?? new AwardEvidenceMappingService($this->db, $this->eligibilityService);
        $this->scoringService = $scoringService ?? new AwardScoringService($this->db, $this->eligibilityService, $this->mappingService);
    }

    /**
     * Retrieves the complete, unified Student Review Workspace package for a student and selected award.
     *
     * @param string|array $award Award ID or entity
     * @param string|array $student Student ID or entity
     * @param string|null $actorId Current reviewer profile ID
     * @return array Full review workspace payload
     */
    public function getStudentReviewWorkspace($award, $student, ?string $actorId = null): array
    {
        $awardArr = is_string($award) ? $this->resolveAward($award) : (is_object($award) ? (array) $award : $award);
        $studentArr = is_string($student) ? $this->resolveStudent($student) : (is_object($student) ? (array) $student : $student);

        $awardId = $awardArr['id'] ?? '';
        $awardCode = strtoupper(trim((string) ($awardArr['code'] ?? '')));
        $studentId = $studentArr['id'] ?? '';

        // 1. Phase 3 Eligibility Check
        $eligibility = $this->eligibilityService->evaluateStudentEligibility($awardArr, $studentArr);

        // 2. Phase 4 Evidence Mapping
        $evidencePackage = $this->mappingService->mapStudentEvidenceForAward($awardArr, $studentArr);

        // 3. Phase 5 Portfolio Scoring (Read-Only)
        $portfolioScoring = $this->scoringService->scoreStudentForAward($awardArr, $studentArr);

        // 4. Load Non-Computable / Manual Panel Criteria for Award
        $manualCriteria = $this->loadManualCriteriaForAward($awardId, $awardCode, $studentId);

        // 5. Load Stored Evaluation State & Notes
        $savedState = $this->loadSavedEvaluationState($awardId, $studentId);

        // Reconcile review status
        $reviewStatus = $savedState['review_status'] ?? self::STATUS_NOT_REVIEWED;
        if ($reviewStatus === self::STATUS_NOT_REVIEWED && ! empty($savedState['manual_scores'])) {
            $reviewStatus = self::STATUS_IN_PROGRESS;
        }

        // Governance Badges & Adaptation Messages
        $governance = $this->resolveGovernanceMetadata($awardCode);

        return [
            'award' => [
                'id'                          => $awardId,
                'code'                        => $awardCode,
                'name'                        => $awardArr['name'] ?? '',
                'category'                    => $awardArr['category'] ?? '',
                'description'                 => $awardArr['description'] ?? '',
                'graduating_only'             => (bool) ($awardArr['graduating_only'] ?? true),
                'gender_restriction'          => $awardArr['gender_restriction'] ?? 'any',
                'computable_max_score'        => (float) ($portfolioScoring['computable_max_score'] ?? 0.0),
                'scoring_version'             => $awardArr['active_scoring_version'] ?? '1.0',
                'governance'                  => $governance,
            ],
            'student' => [
                'id'                          => $studentId,
                'full_name'                   => $studentArr['full_name'] ?? $studentArr['student_name'] ?? '',
                'student_id_number'           => $studentArr['student_id_number'] ?? $studentArr['id_number'] ?? '',
                'program'                     => $studentArr['program'] ?? '',
                'college'                     => $studentArr['college'] ?? '',
                'year_level'                  => $studentArr['year_level'] ?? '',
                'gender'                      => $studentArr['gender'] ?? '',
            ],
            'eligibility'                     => $eligibility,
            'evaluation_status'               => $reviewStatus,
            'is_finalized'                    => ($reviewStatus === self::STATUS_EVALUATED),
            'portfolio_scoring'               => [
                'raw_portfolio_score'         => $portfolioScoring['raw_portfolio_score'] ?? 0.0,
                'computable_max_score'        => $portfolioScoring['computable_max_score'] ?? 0.0,
                'formula_note'                => 'Portfolio Potential Score = (Raw Portfolio Score / Computable Maximum) * 100 [Calculated in Phase 7]',
                'criteria'                    => $portfolioScoring['criteria_scores'] ?? [],
                'evidence_traceability'       => $portfolioScoring['evidence_traceability'] ?? [],
                'is_read_only'                => true,
            ],
            'manual_panel_criteria'           => $manualCriteria,
            'relevant_verified_evidence'      => $evidencePackage['criteria'] ?? [],
            'all_relevant_records'            => $this->extractAllRelevantEvidenceRecords($evidencePackage),
            'review_notes'                    => $savedState['notes'] ?? '',
            'reviewer' => [
                'id'                          => $actorId ?? $savedState['reviewer_id'] ?? null,
                'last_reviewed_at'            => $savedState['updated_at'] ?? null,
            ],
            'summary' => [
                'has_relevant_evidence'       => (bool) ($evidencePackage['has_relevant_verified_evidence'] ?? false),
                'relevant_record_count'       => (int) ($evidencePackage['relevant_verified_record_count'] ?? 0),
                'computable_criteria_count'   => count($portfolioScoring['criteria_scores'] ?? []),
                'manual_criteria_count'       => count($manualCriteria),
            ],
        ];
    }

    /**
     * Saves draft or updates manual panel criterion scores with validation against official maximums.
     *
     * @param string $awardId Award ID
     * @param string $studentId Student Profile ID
     * @param array $manualScores Array of ['criterion_id' => score, ...]
     * @param string|null $notes Review notes
     * @param string|null $actorId Reviewer profile ID
     * @param bool $finalize If true, validates all required criteria and sets status to EVALUATED
     * @return array Updated evaluation state
     */
    public function saveManualCriteria(
        string $awardId,
        string $studentId,
        array $manualScores,
        ?string $notes = null,
        ?string $actorId = null,
        bool $finalize = false
    ): array {
        $award = $this->resolveAward($awardId);
        $student = $this->resolveStudent($studentId);

        $awardCode = strtoupper(trim((string) ($award['code'] ?? '')));
        $manualCriteriaList = $this->loadManualCriteriaForAward($awardId, $awardCode, $studentId);
        $manualCriteriaMap = [];
        foreach ($manualCriteriaList as $mc) {
            $manualCriteriaMap[$mc['criterion_id']] = $mc;
            $manualCriteriaMap[$mc['criterion_code']] = $mc;
        }

        // Validate each manual score
        $validatedScores = [];
        foreach ($manualScores as $critIdentifier => $scoreValue) {
            if (! isset($manualCriteriaMap[$critIdentifier])) {
                throw new InvalidArgumentException("Criterion [{$critIdentifier}] is not a valid manual/panel criterion for award [{$awardCode}]. Computed criteria cannot be overwritten manually.");
            }

            $criterionMeta = $manualCriteriaMap[$critIdentifier];
            $officialMax = (float) $criterionMeta['official_max_points'];

            if (! is_numeric($scoreValue)) {
                throw new InvalidArgumentException("Score for criterion [{$criterionMeta['criterion_name']}] must be numeric.");
            }

            $scoreFloat = (float) $scoreValue;
            if ($scoreFloat < 0.0) {
                throw new InvalidArgumentException("Score for criterion [{$criterionMeta['criterion_name']}] cannot be negative ({$scoreFloat} provided).");
            }
            if ($scoreFloat > $officialMax) {
                throw new InvalidArgumentException("Score for criterion [{$criterionMeta['criterion_name']}] ({$scoreFloat}) exceeds official maximum of {$officialMax}.");
            }

            $validatedScores[$criterionMeta['criterion_id']] = [
                'criterion_id'   => $criterionMeta['criterion_id'],
                'criterion_code' => $criterionMeta['criterion_code'],
                'criterion_name' => $criterionMeta['criterion_name'],
                'score'          => round($scoreFloat, 2),
                'official_max'   => $officialMax,
                'status'         => 'REVIEWED',
            ];
        }

        // Finalization Validation: Ensure all configured manual criteria are reviewed
        if ($finalize) {
            foreach ($manualCriteriaList as $mc) {
                $critId = $mc['criterion_id'];
                if (! isset($validatedScores[$critId]) && ($mc['current_score'] === null || $mc['current_score'] === '')) {
                    throw new InvalidArgumentException("Cannot finalize evaluation: Required manual criterion [{$mc['criterion_name']}] has not been reviewed.");
                }
            }
        }

        $newStatus = $finalize ? self::STATUS_EVALUATED : self::STATUS_IN_PROGRESS;

        // Persist to Database if available
        $this->persistEvaluationState($awardId, $studentId, $validatedScores, $notes, $actorId, $newStatus);

        return [
            'award_id'          => $awardId,
            'student_id'        => $studentId,
            'review_status'     => $newStatus,
            'is_finalized'      => $finalize,
            'saved_scores'      => array_values($validatedScores),
            'notes'             => $notes,
            'reviewer_id'       => $actorId,
            'message'           => $finalize
                ? 'Evaluation successfully finalized for committee review.'
                : 'Manual criteria draft saved successfully.',
        ];
    }

    /**
     * Loads the list of official manual/panel criteria for an award based on Phase 2 computability seeds.
     */
    public function loadManualCriteriaForAward(string $awardId, string $awardCode, ?string $studentId = null): array
    {
        $dbCriteria = [];
        if ($this->db !== null) {
            if (method_exists($this->db, 'table')) {
                $dbCriteria = $this->db->table('award_criteria')
                    ->where('award_definition_id', $awardId)
                    ->where('is_portfolio_computable', 0)
                    ->orderBy('sort_order', 'ASC')
                    ->get()->getResultArray();
            } elseif ($this->db instanceof \mysqli) {
                $escapedId = $this->db->real_escape_string($awardId);
                $res = $this->db->query("SELECT * FROM award_criteria WHERE award_definition_id = '{$escapedId}' AND is_portfolio_computable = 0 ORDER BY sort_order ASC");
                if ($res) {
                    while ($row = $res->fetch_assoc()) {
                        $dbCriteria[] = $row;
                    }
                }
            }
        }

        // Fallback to canonical Phase 2 manual criteria metadata if DB criteria table is not loaded
        if (empty($dbCriteria)) {
            $dbCriteria = $this->getCanonicalManualCriteriaFallback($awardCode, $awardId);
        }

        // Load any saved manual scores
        $savedScores = $studentId ? $this->loadSavedManualScores($awardId, $studentId) : [];

        $manualList = [];
        foreach ($dbCriteria as $crit) {
            $critId = $crit['id'] ?? "crit-manual-{$crit['code']}";
            $critCode = strtoupper(trim((string) ($crit['code'] ?? '')));
            $critName = $crit['name'] ?? '';
            $maxPts = (float) ($crit['max_points'] ?? 0.0);

            $currentScore = $savedScores[$critId]['score'] ?? $savedScores[$critCode]['score'] ?? null;
            $status = ($currentScore !== null) ? 'REVIEWED' : 'PENDING';

            $manualList[] = [
                'criterion_id'         => $critId,
                'criterion_code'       => $critCode,
                'criterion_name'       => $critName,
                'official_max_points'  => $maxPts,
                'current_score'        => $currentScore !== null ? (float) $currentScore : null,
                'status'               => $status,
                'source_type'          => 'PANEL_INSTITUTIONAL',
                'is_partial'           => str_contains($critCode, 'ATTITUDE') || str_contains($critCode, 'SKILLS_ATTITUDE'),
            ];
        }

        return $manualList;
    }

    /**
     * Resolves governance labels and badges for awards.
     */
    protected function resolveGovernanceMetadata(string $awardCode): array
    {
        if ($awardCode === 'CAMPUS_JOURNALISM_AWARD') {
            return [
                'badge_type'    => 'ADAPTATION',
                'badge_text'    => 'Official Criterion with Automated Portfolio Adaptation',
                'description'   => 'Publication quality points are adapted deterministically from verified published evidence (News 2, Literary 2, Column 4, Editorial 4). Subjective quality review is not automated.',
            ];
        }

        if (str_contains($awardCode, 'SPORTS') || str_contains($awardCode, 'ATHLETE')) {
            return [
                'badge_type'    => 'PARTIAL',
                'badge_text'    => 'Partially Portfolio Computable',
                'description'   => 'Skills evidence (20 pts) is computed automatically from verified competition participation; Attitude (20 pts) remains under panel review.',
            ];
        }

        if (str_contains($awardCode, 'SOCIO') || str_contains($awardCode, 'PERFORMER')) {
            return [
                'badge_type'    => 'PROPOSED_MODEL',
                'badge_text'    => 'Proposed AchieveNest Portfolio Model',
                'description'   => 'Evaluated under the standardized 55-point AchieveNest portfolio model for Performing Arts.',
            ];
        }

        return [
            'badge_type'    => 'OFFICIAL',
            'badge_text'    => 'Official OSAD Rubric',
            'description'   => 'Evaluated under the official University Student Affairs & Services award guidelines.',
        ];
    }

    /**
     * Extracts flat list of all relevant verified evidence records.
     */
    protected function extractAllRelevantEvidenceRecords(array $evidencePackage): array
    {
        $records = [];
        $seen = [];
        $criteria = $evidencePackage['criteria'] ?? [];

        foreach ($criteria as $crit) {
            foreach ($crit['evidence'] ?? [] as $ev) {
                $recId = $ev['record_id'] ?? '';
                if (! isset($seen[$recId])) {
                    $seen[$recId] = true;
                    $records[] = $ev;
                }
            }
        }

        return $records;
    }

    /**
     * Canonical manual criteria metadata fallback per award.
     */
    protected function getCanonicalManualCriteriaFallback(string $awardCode, string $awardId): array
    {
        return match ($awardCode) {
            'NOTRE_DAME_AWARD' => [
                ['id' => '50000002-0001-0000-0000-000000000004', 'code' => 'CRIT_NDA_SCHOLASTIC', 'name' => 'Scholastic Achievement', 'max_points' => 30.0],
                ['id' => '50000002-0001-0000-0000-000000000005', 'code' => 'CRIT_NDA_CHARACTER', 'name' => 'Character', 'max_points' => 20.0],
            ],
            'SMC_AWARD' => [
                ['id' => '50000002-0002-0000-0000-000000000004', 'code' => 'CRIT_SMC_SCHOLASTIC', 'name' => 'Scholastic Achievement', 'max_points' => 20.0],
                ['id' => '50000002-0002-0000-0000-000000000005', 'code' => 'CRIT_SMC_CHARACTER', 'name' => 'Character', 'max_points' => 20.0],
            ],
            'LEADERSHIP_AWARD' => [
                ['id' => '50000002-0003-0000-0000-000000000003', 'code' => 'CRIT_LEAD_SCHOLASTIC', 'name' => 'Scholastic Achievement', 'max_points' => 20.0],
                ['id' => '50000002-0003-0000-0000-000000000004', 'code' => 'CRIT_LEAD_CHARACTER', 'name' => 'Character', 'max_points' => 20.0],
                ['id' => '50000002-0003-0000-0000-000000000005', 'code' => 'CRIT_LEAD_INTERVIEW', 'name' => 'Interview', 'max_points' => 10.0],
            ],
            'CAMPUS_JOURNALISM_AWARD' => [
                ['id' => '50000002-0004-0000-0000-000000000003', 'code' => 'CRIT_JOURN_CHARACTER', 'name' => 'Character', 'max_points' => 20.0],
                ['id' => '50000002-0004-0000-0000-000000000004', 'code' => 'CRIT_JOURN_INTERVIEW', 'name' => 'Interview', 'max_points' => 10.0],
            ],
            'SPORTS_AWARD_FEMALE', 'SPORTS_AWARD_MALE', 'ATHLETE_OF_THE_YEAR_FEMALE', 'ATHLETE_OF_THE_YEAR_MALE' => [
                ['id' => 'crit-sports-acad', 'code' => 'CRIT_SPORTS_ACADEMIC', 'name' => 'Academic Achievement', 'max_points' => 15.0],
                ['id' => 'crit-sports-attitude', 'code' => 'CRIT_SPORTS_ATTITUDE', 'name' => 'Attitude (Panel Component)', 'max_points' => 20.0],
                ['id' => 'crit-sports-interview', 'code' => 'CRIT_SPORTS_INTERVIEW', 'name' => 'Interview', 'max_points' => 10.0],
            ],
            'STUDENT_LEADER_OF_THE_YEAR' => [
                ['id' => 'crit-sl-scholastic', 'code' => 'CRIT_SL_SCHOLASTIC', 'name' => 'Scholastic Achievement', 'max_points' => 20.0],
                ['id' => 'crit-sl-character', 'code' => 'CRIT_SL_CHARACTER', 'name' => 'Character', 'max_points' => 20.0],
                ['id' => 'crit-sl-interview', 'code' => 'CRIT_SL_INTERVIEW', 'name' => 'Interview', 'max_points' => 10.0],
            ],
            default => [],
        };
    }

    /**
     * Resolves award entity from ID or Code.
     */
    protected function resolveAward(string $awardIdentifier): array
    {
        if ($this->db !== null) {
            if (method_exists($this->db, 'table')) {
                $award = $this->db->table('award_definitions')
                    ->where('id', $awardIdentifier)
                    ->orWhere('code', $awardIdentifier)
                    ->get()->getRowArray();
                if ($award !== null) {
                    return $award;
                }
            } elseif ($this->db instanceof \mysqli) {
                $escaped = $this->db->real_escape_string($awardIdentifier);
                $res = $this->db->query("SELECT * FROM award_definitions WHERE id = '{$escaped}' OR code = '{$escaped}' LIMIT 1");
                if ($res && $row = $res->fetch_assoc()) {
                    return $row;
                }
            }
        }

        return ['id' => $awardIdentifier, 'code' => $awardIdentifier, 'name' => $awardIdentifier, 'status' => 'active'];
    }

    /**
     * Resolves student profile entity.
     */
    protected function resolveStudent(string $studentId): array
    {
        if ($this->db !== null) {
            if (method_exists($this->db, 'table')) {
                $student = $this->db->table('profiles')
                    ->where('id', $studentId)
                    ->where('account_type', 'student')
                    ->get()->getRowArray();
                if ($student !== null) {
                    return $student;
                }
            } elseif ($this->db instanceof \mysqli) {
                $escaped = $this->db->real_escape_string($studentId);
                $res = $this->db->query("SELECT * FROM profiles WHERE id = '{$escaped}' AND account_type = 'student' LIMIT 1");
                if ($res && $row = $res->fetch_assoc()) {
                    return $row;
                }
            }
        }

        return ['id' => $studentId, 'status' => 'active', 'year_level' => '4th Year', 'gender' => 'Male', 'full_name' => 'Student'];
    }

    /**
     * Maps domain review status to DB evaluation status.
     */
    public function mapToDbStatus(string $reviewStatus): string
    {
        return match ($reviewStatus) {
            self::STATUS_IN_PROGRESS => 'in_review',
            self::STATUS_EVALUATED   => 'completed',
            default                  => 'pending',
        };
    }

    /**
     * Maps DB evaluation status to domain review status.
     */
    public function mapFromDbStatus(?string $dbStatus): string
    {
        return match ($dbStatus) {
            'in_review' => self::STATUS_IN_PROGRESS,
            'completed' => self::STATUS_EVALUATED,
            default     => self::STATUS_NOT_REVIEWED,
        };
    }

    /**
     * Loads saved evaluation state from database.
     */
    protected function loadSavedEvaluationState(string $awardId, string $studentId): array
    {
        if ($this->db !== null) {
            if (method_exists($this->db, 'table')) {
                $row = $this->db->table('student_award_evaluations')
                    ->where('award_definition_id', $awardId)
                    ->where('student_profile_id', $studentId)
                    ->get()->getRowArray();
                if ($row) {
                    return [
                        'review_status' => $this->mapFromDbStatus($row['status'] ?? null),
                        'notes'         => $row['evaluator_remarks'] ?? $row['notes'] ?? '',
                        'reviewer_id'   => $row['evaluator_profile_id'] ?? null,
                        'updated_at'    => $row['updated_at'] ?? null,
                    ];
                }
            } elseif ($this->db instanceof \mysqli) {
                $eAward = $this->db->real_escape_string($awardId);
                $eStd = $this->db->real_escape_string($studentId);
                $res = $this->db->query("SELECT * FROM student_award_evaluations WHERE award_definition_id = '{$eAward}' AND student_profile_id = '{$eStd}' LIMIT 1");
                if ($res && $row = $res->fetch_assoc()) {
                    return [
                        'review_status' => $this->mapFromDbStatus($row['status'] ?? null),
                        'notes'         => $row['evaluator_remarks'] ?? $row['notes'] ?? '',
                        'reviewer_id'   => $row['evaluator_profile_id'] ?? null,
                        'updated_at'    => $row['updated_at'] ?? null,
                    ];
                }
            }
        }

        return ['review_status' => self::STATUS_NOT_REVIEWED, 'notes' => '', 'reviewer_id' => null, 'updated_at' => null];
    }

    /**
     * Loads saved manual scores for a student and award.
     */
    protected function loadSavedManualScores(string $awardId, string $studentId): array
    {
        $scores = [];
        if ($this->db !== null) {
            if (method_exists($this->db, 'table')) {
                $rows = $this->db->table('student_award_criterion_scores s')
                    ->select('s.*, c.code as crit_code')
                    ->join('student_award_evaluations e', 'e.id = s.evaluation_id', 'inner')
                    ->join('award_criteria c', 'c.id = s.criterion_id', 'left')
                    ->where('e.student_profile_id', $studentId)
                    ->where('e.award_definition_id', $awardId)
                    ->get()->getResultArray();
                foreach ($rows as $r) {
                    $pts = $r['awarded_points'] ?? $r['points_awarded'] ?? null;
                    $scores[$r['criterion_id']] = ['score' => $pts];
                    if (! empty($r['crit_code'])) {
                        $scores[$r['crit_code']] = ['score' => $pts];
                    }
                }
            } elseif ($this->db instanceof \mysqli) {
                $eStd = $this->db->real_escape_string($studentId);
                $eAward = $this->db->real_escape_string($awardId);
                $res = $this->db->query("SELECT s.*, c.code as crit_code FROM student_award_criterion_scores s INNER JOIN student_award_evaluations e ON e.id = s.evaluation_id LEFT JOIN award_criteria c ON c.id = s.criterion_id WHERE e.student_profile_id = '{$eStd}' AND e.award_definition_id = '{$eAward}'");
                if ($res) {
                    while ($r = $res->fetch_assoc()) {
                        $pts = $r['awarded_points'] ?? $r['points_awarded'] ?? null;
                        $scores[$r['criterion_id']] = ['score' => $pts];
                        if (! empty($r['crit_code'])) {
                            $scores[$r['crit_code']] = ['score' => $pts];
                        }
                    }
                }
            }
        }
        return $scores;
    }

    /**
     * Persists evaluation state and manual criterion scores to database.
     */
    protected function persistEvaluationState(
        string $awardId,
        string $studentId,
        array $validatedScores,
        ?string $notes,
        ?string $actorId,
        string $newStatus
    ): void {
        if ($this->db === null) {
            return;
        }

        $now = date('Y-m-d H:i:s');
        $dbStatus = $this->mapToDbStatus($newStatus);
        $evalId = null;

        if (method_exists($this->db, 'table')) {
            // Upsert student_award_evaluations
            $existing = $this->db->table('student_award_evaluations')
                ->where('award_definition_id', $awardId)
                ->where('student_profile_id', $studentId)
                ->get()->getRowArray();

            if ($existing) {
                $evalId = $existing['id'];
                $this->db->table('student_award_evaluations')
                    ->where('id', $evalId)
                    ->update([
                        'status'               => $dbStatus,
                        'evaluator_profile_id' => $actorId ?? $existing['evaluator_profile_id'] ?? null,
                        'updated_at'           => $now,
                    ]);
            } else {
                $evalId = $this->genUuid();
                $cycleId = $this->getActiveCycleId();
                $this->db->table('student_award_evaluations')->insert([
                    'id'                   => $evalId,
                    'cycle_id'             => $cycleId,
                    'award_definition_id'  => $awardId,
                    'student_profile_id'   => $studentId,
                    'evaluator_profile_id' => $actorId,
                    'status'               => $dbStatus,
                    'created_at'           => $now,
                    'updated_at'           => $now,
                ]);
            }
        } elseif ($this->db instanceof \mysqli) {
            $eAward = $this->db->real_escape_string($awardId);
            $eStd = $this->db->real_escape_string($studentId);
            $eStatus = $this->db->real_escape_string($dbStatus);
            $eActor = $actorId !== null ? "'" . $this->db->real_escape_string($actorId) . "'" : "NULL";

            $res = $this->db->query("SELECT id FROM student_award_evaluations WHERE award_definition_id = '{$eAward}' AND student_profile_id = '{$eStd}' LIMIT 1");
            if ($res && $row = $res->fetch_assoc()) {
                $evalId = $row['id'];
                $this->db->query("UPDATE student_award_evaluations SET status = '{$eStatus}', evaluator_profile_id = COALESCE({$eActor}, evaluator_profile_id), updated_at = '{$now}' WHERE id = '{$evalId}'");
            } else {
                $evalId = $this->genUuid();
                $cycleId = $this->getActiveCycleId();
                $this->db->query("INSERT INTO student_award_evaluations (id, cycle_id, award_definition_id, student_profile_id, evaluator_profile_id, status, created_at, updated_at) VALUES ('{$evalId}', '{$cycleId}', '{$eAward}', '{$eStd}', {$eActor}, '{$eStatus}', '{$now}', '{$now}')");
            }
        }

        // Upsert manual criterion scores
        if ($evalId !== null) {
            foreach ($validatedScores as $critId => $scoreData) {
                $pts = (float) $scoreData['score'];
                $maxPts = (float) $scoreData['official_max'];
                $snapshot = json_encode(['rule_type' => 'MANUAL_PANEL_REVIEW', 'official_max' => $maxPts, 'status' => 'REVIEWED']);
                
                if (method_exists($this->db, 'table')) {
                    $existingScore = $this->db->table('student_award_criterion_scores')
                        ->where('evaluation_id', $evalId)
                        ->where('criterion_id', $critId)
                        ->get()->getRowArray();
                    if ($existingScore) {
                        $this->db->table('student_award_criterion_scores')
                            ->where('id', $existingScore['id'])
                            ->update([
                                'awarded_points'   => $pts,
                                'max_points'       => $maxPts,
                                'scoring_snapshot' => $snapshot,
                                'updated_at'       => $now,
                            ]);
                    } else {
                        $this->db->table('student_award_criterion_scores')->insert([
                            'id'               => $this->genUuid(),
                            'evaluation_id'    => $evalId,
                            'criterion_id'     => $critId,
                            'awarded_points'   => $pts,
                            'max_points'       => $maxPts,
                            'scoring_snapshot' => $snapshot,
                            'created_at'       => $now,
                            'updated_at'       => $now,
                        ]);
                    }
                } elseif ($this->db instanceof \mysqli) {
                    $eCrit = $this->db->real_escape_string($critId);
                    $eSnap = $this->db->real_escape_string($snapshot);
                    $resScore = $this->db->query("SELECT id FROM student_award_criterion_scores WHERE evaluation_id = '{$evalId}' AND criterion_id = '{$eCrit}' LIMIT 1");
                    if ($resScore && $rowScore = $resScore->fetch_assoc()) {
                        $scoreId = $rowScore['id'];
                        $this->db->query("UPDATE student_award_criterion_scores SET awarded_points = {$pts}, max_points = {$maxPts}, scoring_snapshot = '{$eSnap}', updated_at = '{$now}' WHERE id = '{$scoreId}'");
                    } else {
                        $scoreId = $this->genUuid();
                        $this->db->query("INSERT INTO student_award_criterion_scores (id, evaluation_id, criterion_id, awarded_points, max_points, scoring_snapshot, created_at, updated_at) VALUES ('{$scoreId}', '{$evalId}', '{$eCrit}', {$pts}, {$maxPts}, '{$eSnap}', '{$now}', '{$now}')");
                    }
                }
            }
        }
    }

    /**
     * Helper to get active cycle ID.
     */
    protected function getActiveCycleId(): string
    {
        if ($this->db !== null) {
            if (method_exists($this->db, 'table')) {
                $cycle = $this->db->table('award_cycles')->where('status', 'active')->get()->getRowArray();
                if ($cycle) {
                    return $cycle['id'];
                }
            } elseif ($this->db instanceof \mysqli) {
                $res = $this->db->query("SELECT id FROM award_cycles WHERE status = 'active' LIMIT 1");
                if ($res && $row = $res->fetch_assoc()) {
                    return $row['id'];
                }
            }
        }
        return '50000000-0000-0000-0000-000000000001';
    }

    /**
     * Helper to generate UUID.
     */
    protected function genUuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            random_int(0, 0xffff), random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0x0fff) | 0x4000,
            random_int(0, 0x3fff) | 0x8000,
            random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff)
        );
    }
}
