<?php

namespace App\Services;

use InvalidArgumentException;
use RuntimeException;

/**
 * AwardPotentialCandidateService
 * 
 * Authoritative Phase 7 Service for Portfolio Potential Score Normalization,
 * Universal 80% Threshold Evaluation, and Potential Candidate Preselection.
 * 
 * Strict Invariant: Potential Candidate != Final Awardee / Winner.
 * Manual non-computable criteria are strictly excluded from the potential score formula.
 */
class AwardPotentialCandidateService
{
    protected $db;
    protected AwardEligibilityService $eligibilityService;
    protected AwardEvidenceMappingService $mappingService;
    protected AwardScoringService $scoringService;
    protected AwardReviewService $reviewService;

    public function __construct(
        $db = null,
        ?AwardEligibilityService $eligibilityService = null,
        ?AwardEvidenceMappingService $mappingService = null,
        ?AwardScoringService $scoringService = null,
        ?AwardReviewService $reviewService = null
    ) {
        $this->db = $db ?? (\Config\Database::connect());
        $this->eligibilityService = $eligibilityService ?? new AwardEligibilityService();
        $this->mappingService = $mappingService ?? new AwardEvidenceMappingService($this->db, $this->eligibilityService);
        $this->scoringService = $scoringService ?? new AwardScoringService($this->db, $this->eligibilityService, $this->mappingService);
        $this->reviewService = $reviewService ?? new AwardReviewService($this->db, $this->eligibilityService, $this->mappingService, $this->scoringService);
    }

    /**
     * Evaluates and classifies a student for an award against the 80% threshold.
     */
    public function evaluatePotentialCandidate(array $award, array $student, ?array $evaluation = null, ?string $cycleId = null): array
    {
        $reasons = [];
        $cycleId = $this->resolveEvaluationCycleId($cycleId, $evaluation);

        // 1. Award Precondition Validation
        if (empty($award['id']) || ($award['status'] ?? 'active') !== 'active') {
            return $this->buildErrorResult($award, $student, 'AWARD_INACTIVE', 'Award is not active or missing.', $reasons);
        }
        if (strtoupper(trim((string) ($award['authority_status'] ?? ''))) === 'PROPOSED') {
            return $this->buildErrorResult($award, $student, 'AWARD_AUTHORITY_PENDING', 'Proposed rubrics are unavailable for authoritative candidate generation.', $reasons);
        }

        // 2. Eligibility & Relevant Evidence Preconditions
        $eligibility = $this->eligibilityService->evaluateStudentEligibility($award, $student);
        $isEligible = $eligibility['eligible'] ?? $eligibility['is_eligible'] ?? false;
        if (!$isEligible) {
            return $this->buildErrorResult($award, $student, 'STUDENT_INELIGIBLE', 'Student does not meet award-level eligibility.', $eligibility['reasons'] ?? []);
        }

        // 3. Load or Verify Evaluation State (Phase 6 Review Status)
        $evaluationRecord = $evaluation ?? $this->loadEvaluationRecord($award['id'], $student['id'], $cycleId);
        $reviewStatus = $evaluationRecord['status'] ?? 'pending';
        $isEvaluated = in_array(strtolower($reviewStatus), ['completed', 'evaluated'], true);

        if (!$isEvaluated) {
            $code = (strtolower($reviewStatus) === 'in_review' || strtolower($reviewStatus) === 'in_progress')
                ? 'EVALUATION_IN_PROGRESS'
                : 'EVALUATION_NOT_COMPLETE';
            return $this->buildErrorResult($award, $student, $code, 'Evaluation must be in EVALUATED status before candidate classification.', [
                ['code' => $code, 'message' => 'Review status is ' . strtoupper($reviewStatus)]
            ]);
        }

        // 4. Calculate or Load Authoritative Phase 5 Portfolio Score
        if ($evaluation !== null && isset($evaluation['raw_score']) && isset($evaluation['max_computable_score'])) {
            $rawScore = (float)$evaluation['raw_score'];
            $computableMax = (float)$evaluation['max_computable_score'];
        } elseif ($evaluationRecord !== null && isset($evaluationRecord['raw_score']) && isset($evaluationRecord['max_computable_score'])) {
            $rawScore = (float)$evaluationRecord['raw_score'];
            $computableMax = (float)$evaluationRecord['max_computable_score'];
        } else {
            $scoringResult = $this->scoringService->scoreStudentAwardPortfolio($award, $student);
            $rawScore = (float)($scoringResult['raw_portfolio_score'] ?? 0.0);
            $computableMax = (float)($scoringResult['computable_max_score'] ?? 0.0);
        }

        if ($computableMax <= 0.0) {
            return $this->buildErrorResult($award, $student, 'INVALID_COMPUTABLE_MAX', 'Computable maximum score cannot be zero or negative.', [
                ['code' => 'INVALID_COMPUTABLE_MAX', 'message' => 'Computable maximum score is ' . $computableMax]
            ]);
        }

        if ($rawScore < 0.0) {
            return $this->buildErrorResult($award, $student, 'RAW_SCORE_INVALID', 'Raw portfolio score cannot be negative.', [
                ['code' => 'RAW_SCORE_INVALID', 'message' => 'Raw score is ' . $rawScore]
            ]);
        }

        if ($rawScore > $computableMax) {
            return $this->buildErrorResult($award, $student, 'CLASSIFICATION_ERROR', 'Raw score exceeds computable maximum score.', [
                ['code' => 'RAW_SCORE_EXCEEDS_MAX', 'message' => "Raw score {$rawScore} > Max {$computableMax}"]
            ]);
        }

        // 5. Authoritative Normalization Formula
        // Portfolio Potential Score = (Raw Score / Computable Max) * 100
        $unroundedPercentage = ($rawScore / $computableMax) * 100.0;
        $potentialScore = round($unroundedPercentage, 4); // Full backend numeric precision
        $displayScore = round($unroundedPercentage, 2);

        $thresholdPercent = $this->resolveThreshold($award);
        if ($thresholdPercent === null) {
            return $this->buildErrorResult($award, $student, 'THRESHOLD_CONFIGURATION_ERROR', 'Candidate threshold is missing or invalid.', [
                ['code' => 'THRESHOLD_CONFIGURATION_ERROR', 'message' => 'A numeric threshold from 0 through 100 is required.'],
            ]);
        }

        // 6. Universal 80% Threshold Evaluation (Inclusive >= 80.00%)
        $isQualified = ($unroundedPercentage >= $thresholdPercent);
        $candidateStatus = $isQualified ? 'POTENTIAL_CANDIDATE' : 'BELOW_THRESHOLD';

        if ($isQualified) {
            $reasons[] = [
                'code'    => 'PORTFOLIO_THRESHOLD_MET',
                'message' => "Portfolio Potential Score of {$displayScore}% meets or exceeds the {$thresholdPercent}% threshold."
            ];
        } else {
            $reasons[] = [
                'code'    => 'PORTFOLIO_THRESHOLD_NOT_MET',
                'message' => "Portfolio Potential Score of {$displayScore}% is below the {$thresholdPercent}% Potential Candidate threshold."
            ];
        }

        $result = AwardApiContractService::score([
            'award_id'                    => $award['id'],
            'award_code'                  => $award['code'],
            'award_name'                  => $award['name'],
            'student_id'                  => $student['id'],
            'student_name'                => $student['full_name'] ?? '',
            'student_id_number'           => $student['student_id_number'] ?? ($student['student_id'] ?? ''),
            'program'                     => $student['program'] ?? '',
            'college'                     => $student['college'] ?? '',
            'review_status'               => 'EVALUATED',
            'scoring_status'              => 'SCORED',
            'raw_portfolio_score'         => round($rawScore, 2),
            'computable_max_score'        => round($computableMax, 2),
            'portfolio_potential_score'   => $displayScore,
            'unrounded_potential_score'   => $potentialScore,
            'candidate_threshold_percent' => $thresholdPercent,
            'candidate_status'            => $candidateStatus,
            'qualified'                   => $isQualified,
            'scoring_version'             => $award['scoring_version'] ?? 'v1.0',
            'classified_at'               => date('Y-m-d H:i:s'),
            'cycle_id'                    => $cycleId,
            'reasons'                     => $reasons
        ], $award);

        // 7. Persist Candidate Classification to DB
        $this->persistCandidateClassification($result);

        return $result;
    }

    /**
     * Evaluates potential candidate by award ID and student ID.
     */
    public function evaluatePotentialCandidateByIds(string $awardId, string $studentId, ?string $cycleId = null): array
    {
        $award = $this->loadAwardById($awardId);
        $student = $this->loadStudentById($studentId);

        return $this->evaluatePotentialCandidate($award, $student, null, $cycleId);
    }

    /**
     * Recalculates candidate status from current master portfolio scores.
     */
    public function recalculatePotentialCandidateStatus(string $awardId, string $studentId, ?string $cycleId = null): array
    {
        return $this->evaluatePotentialCandidateByIds($awardId, $studentId, $cycleId);
    }

    /**
     * Retrieves all qualified Potential Candidates for an award (>= 80% threshold).
     * Ordered by Portfolio Potential Score DESC, Student Name ASC for presentation.
     * Guaranteed: No Top-N cutoff, no winner declaration.
     */
    public function getPotentialCandidatesForAward(string $awardId, ?string $cycleId = null): array
    {
        $award = $this->loadAwardById($awardId);
        $threshold = $this->resolveThreshold($award);
        if ($threshold === null) {
            throw new RuntimeException('Candidate threshold is missing or invalid.');
        }

        $cycleId = $this->resolveEvaluationCycleId($cycleId);
        $evaluations = $this->loadEvaluationsForAward($awardId, $cycleId, ['completed', 'evaluated']);
        $candidates = [];

        foreach ($evaluations as $eval) {
            $student = $this->loadStudentById($eval['student_profile_id']);
            if (!$student) continue;

            $classification = $this->evaluatePotentialCandidate($award, $student, $eval, $cycleId);

            if ($classification['candidate_status'] === 'POTENTIAL_CANDIDATE' && $classification['qualified']) {
                $candidates[] = $classification;
            }
        }

        // Sort by Portfolio Potential Score DESC, then Student Name ASC (Presentation Order Only)
        usort($candidates, function ($a, $b) {
            if ($b['portfolio_potential_score'] !== $a['portfolio_potential_score']) {
                return ($b['portfolio_potential_score'] < $a['portfolio_potential_score']) ? -1 : 1;
            }
            return strcmp($a['student_name'], $b['student_name']);
        });

        return [
            'award'                        => AwardApiContractService::award($award),
            'total_potential_candidates'  => count($candidates),
            'potential_candidates'        => $candidates
        ];
    }

    /**
     * Retrieves all evaluated results (both Potential Candidates and Below Threshold) for transparency.
     */
    public function getEvaluatedResultsForAward(string $awardId, ?string $cycleId = null): array
    {
        $award = $this->loadAwardById($awardId);
        $threshold = $this->resolveThreshold($award);
        if ($threshold === null) {
            throw new RuntimeException('Candidate threshold is missing or invalid.');
        }

        $cycleId = $this->resolveEvaluationCycleId($cycleId);
        $evaluations = $this->loadEvaluationsForAward($awardId, $cycleId, ['completed', 'evaluated']);
        $results = [];

        foreach ($evaluations as $eval) {
            $student = $this->loadStudentById($eval['student_profile_id']);
            if (!$student) continue;

            $classification = $this->evaluatePotentialCandidate($award, $student, $eval, $cycleId);
            $results[] = $classification;
        }

        usort($results, function ($a, $b) {
            if ($b['portfolio_potential_score'] !== $a['portfolio_potential_score']) {
                return ($b['portfolio_potential_score'] < $a['portfolio_potential_score']) ? -1 : 1;
            }
            return strcmp($a['student_name'], $b['student_name']);
        });

        return [
            'award'                        => AwardApiContractService::award($award),
            'total_evaluated'             => count($results),
            'evaluated_results'           => $results
        ];
    }

    /**
     * Performs bulk classification of all completed evaluations for an award.
     */
    public function classifyEvaluatedStudentsForAward(string $awardId): array
    {
        $award = $this->loadAwardById($awardId);
        $evaluations = $this->loadEvaluationsForAward($awardId, ['completed', 'evaluated']);
        
        $classified = [];
        $potentialCount = 0;
        $belowCount = 0;

        foreach ($evaluations as $eval) {
            $student = $this->loadStudentById($eval['student_profile_id']);
            if (!$student) continue;

            $res = $this->evaluatePotentialCandidate($award, $student, $eval);
            $classified[] = $res;

            if ($res['candidate_status'] === 'POTENTIAL_CANDIDATE') {
                $potentialCount++;
            } else {
                $belowCount++;
            }
        }

        return [
            'award_id'                   => $awardId,
            'total_processed'            => count($classified),
            'potential_candidate_count'  => $potentialCount,
            'below_threshold_count'      => $belowCount,
            'results'                    => $classified
        ];
    }

    /**
     * Invalidates candidate classification when evaluation is reopened or modified.
     */
    public function invalidateCandidateClassification(string $awardId, string $studentId, string $cycleId): void
    {
        $now = date('Y-m-d H:i:s');
        if (method_exists($this->db, 'table')) {
            $this->db->table('student_award_evaluations')
                ->where('award_definition_id', $awardId)
                ->where('student_profile_id', $studentId)
                ->where('cycle_id', $cycleId)
                ->update([
                    'candidate_status'        => 'STALE',
                    'qualifies_portfolio_based' => 0,
                    'updated_at'              => $now
                ]);
        } elseif ($this->db instanceof \mysqli) {
            $eAward = $this->db->real_escape_string($awardId);
            $eStudent = $this->db->real_escape_string($studentId);
            $eCycle = $this->db->real_escape_string($cycleId);
            $this->db->query("UPDATE student_award_evaluations SET candidate_status = 'STALE', qualifies_portfolio_based = 0, updated_at = '{$now}' WHERE award_definition_id = '{$eAward}' AND student_profile_id = '{$eStudent}' AND cycle_id = '{$eCycle}'");
        }
    }

    // -------------------------------------------------------------------------
    // Protected Persistence & Loading Helpers
    // -------------------------------------------------------------------------

    protected function persistCandidateClassification(array $result): void
    {
        $now = date('Y-m-d H:i:s');
        $rawScore = $result['raw_portfolio_score'];
        $maxScore = $result['computable_max_score'];
        $potentialScore = $result['portfolio_potential_score'];
        $qualifies = $result['qualified'] ? 1 : 0;
        $candidateStatus = $result['candidate_status'];

        if (method_exists($this->db, 'table')) {
            $existing = $this->db->table('student_award_evaluations')
                ->where('award_definition_id', $result['award_id'])
                ->where('student_profile_id', $result['student_id'])
                ->where('cycle_id', $result['cycle_id'])
                ->get()->getRowArray();

            if ($existing) {
                $this->db->table('student_award_evaluations')
                    ->where('id', $existing['id'])
                    ->update([
                        'raw_score'                  => $rawScore,
                        'max_computable_score'       => $maxScore,
                        'potential_score'            => $potentialScore,
                        'qualifies_portfolio_based'  => $qualifies,
                        'candidate_status'           => $candidateStatus,
                        'candidate_classified_at'    => $now,
                        'updated_at'                 => $now
                    ]);
            }
        } elseif ($this->db instanceof \mysqli) {
            $eAward = $this->db->real_escape_string($result['award_id']);
            $eStudent = $this->db->real_escape_string($result['student_id']);
            $eCycle = $this->db->real_escape_string($result['cycle_id']);
            $this->db->query("UPDATE student_award_evaluations SET 
                raw_score = {$rawScore},
                max_computable_score = {$maxScore},
                potential_score = {$potentialScore},
                qualifies_portfolio_based = {$qualifies},
                candidate_status = '{$candidateStatus}',
                candidate_classified_at = '{$now}',
                updated_at = '{$now}'
                WHERE award_definition_id = '{$eAward}' AND student_profile_id = '{$eStudent}' AND cycle_id = '{$eCycle}'");
        }
    }

    protected function loadAwardById(string $awardId): array
    {
        if (method_exists($this->db, 'table')) {
            $row = $this->db->table('award_definitions')->where('id', $awardId)->get()->getRowArray();
        } elseif ($this->db instanceof \mysqli) {
            $eId = $this->db->real_escape_string($awardId);
            $res = $this->db->query("SELECT * FROM award_definitions WHERE id = '{$eId}' LIMIT 1");
            $row = $res ? $res->fetch_assoc() : null;
        } else {
            $row = null;
        }

        if (!$row) {
            throw new InvalidArgumentException("Authoritative award [{$awardId}] not found.");
        }
        return $row;
    }

    protected function loadStudentById(string $studentId): ?array
    {
        if (method_exists($this->db, 'table')) {
            return $this->db->table('profiles')->where('id', $studentId)->get()->getRowArray();
        } elseif ($this->db instanceof \mysqli) {
            $eId = $this->db->real_escape_string($studentId);
            $res = $this->db->query("SELECT * FROM profiles WHERE id = '{$eId}' LIMIT 1");
            return $res ? $res->fetch_assoc() : null;
        }
        return null;
    }

    protected function loadEvaluationRecord(string $awardId, string $studentId, string $cycleId): ?array
    {
        if (method_exists($this->db, 'table')) {
            return $this->db->table('student_award_evaluations')
                ->where('award_definition_id', $awardId)
                ->where('student_profile_id', $studentId)
                ->where('cycle_id', $cycleId)
                ->get()->getRowArray();
        } elseif ($this->db instanceof \mysqli) {
            $eAward = $this->db->real_escape_string($awardId);
            $eStudent = $this->db->real_escape_string($studentId);
            $eCycle = $this->db->real_escape_string($cycleId);
            $res = $this->db->query("SELECT * FROM student_award_evaluations WHERE award_definition_id = '{$eAward}' AND student_profile_id = '{$eStudent}' AND cycle_id = '{$eCycle}' LIMIT 1");
            return $res ? $res->fetch_assoc() : null;
        }
        return null;
    }

    protected function loadEvaluationsForAward(string $awardId, string $cycleId, array $statuses): array
    {
        if (method_exists($this->db, 'table')) {
            return $this->db->table('student_award_evaluations')
                ->where('award_definition_id', $awardId)
                ->where('cycle_id', $cycleId)
                ->whereIn('status', $statuses)
                ->get()->getResultArray();
        } elseif ($this->db instanceof \mysqli) {
            $eAward = $this->db->real_escape_string($awardId);
            $eCycle = $this->db->real_escape_string($cycleId);
            $quotedStatuses = "'" . implode("','", array_map([$this->db, 'real_escape_string'], $statuses)) . "'";
            $res = $this->db->query("SELECT * FROM student_award_evaluations WHERE award_definition_id = '{$eAward}' AND cycle_id = '{$eCycle}' AND status IN ({$quotedStatuses})");
            $rows = [];
            if ($res) {
                while ($r = $res->fetch_assoc()) {
                    $rows[] = $r;
                }
            }
            return $rows;
        }
        return [];
    }

    protected function buildErrorResult(array $award, array $student, string $code, string $message, array $reasons): array
    {
        return AwardApiContractService::score([
            'award_id'                    => $award['id'] ?? null,
            'award_code'                  => $award['code'] ?? null,
            'award_name'                  => $award['name'] ?? null,
            'student_id'                  => $student['id'] ?? null,
            'student_name'                => $student['full_name'] ?? '',
            'review_status'               => 'NOT_EVALUATED',
            'scoring_status'              => 'INCOMPLETE',
            'raw_portfolio_score'         => 0.0,
            'computable_max_score'        => (float)($award['portfolio_max'] ?? 0.0),
            'portfolio_potential_score'   => 0.0,
            'candidate_threshold_percent' => $this->resolveThreshold($award),
            'candidate_status'            => 'NOT_CLASSIFIED',
            'qualified'                   => false,
            'error_code'                  => $code,
            'error_message'               => $message,
            'reasons'                     => !empty($reasons) ? $reasons : [['code' => $code, 'message' => $message]]
        ], $award);
    }

    protected function resolveThreshold(array $award): ?float
    {
        $value = $award['candidate_threshold_percent'] ?? null;
        if (! is_numeric($value)) {
            return null;
        }
        $threshold = (float) $value;
        return $threshold >= 0.0 && $threshold <= 100.0 ? $threshold : null;
    }
}
