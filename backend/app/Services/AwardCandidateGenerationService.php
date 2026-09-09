<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;

class AwardCandidateGenerationService
{
    protected BaseConnection $db;
    protected AwardEvaluationService $evalService;

    public function __construct(?BaseConnection $db = null, ?AwardEvaluationService $evalService = null)
    {
        $this->db = $db ?? db_connect();
        $this->evalService = $evalService ?? new AwardEvaluationService($this->db);
    }

    /**
     * Evaluates basic student eligibility for an award definition and version.
     *
     * @param array $student
     * @param array $award
     * @param array|null $version
     * @return array
     */
    public function evaluateEligibility(array $student, array $award, ?array $version = null): array
    {
        $reasons = [];
        $checks = [];

        // 1. Active Account Status
        $isActive = ($student['status'] ?? '') === 'active';
        $checks['account_active'] = $isActive;
        if (! $isActive) {
            $reasons[] = 'Student account status is not active.';
        }

        // 2. Graduating-Only Restriction
        $graduatingOnly = (int) ($version['graduating_only'] ?? $award['graduating_only'] ?? 0);
        $checks['graduating_only_required'] = ($graduatingOnly === 1);
        if ($graduatingOnly === 1) {
            // Check student program enrollment year level
            $enrollment = $this->db->table('student_program_enrollments')
                ->where('student_profile_id', $student['id'])
                ->where('is_active', 1)
                ->get()->getRowArray();
            $yearLevel = strtolower(trim((string) ($enrollment['year_level'] ?? '')));
            $isGraduating = in_array($yearLevel, ['4', '4th year', 'fourth year', 'graduating', 'senior'], true);
            $checks['is_graduating'] = $isGraduating;
            if (! $isGraduating) {
                $reasons[] = 'Award requires a graduating student. Student current year level does not qualify.';
            }
        }

        // 3. Gender Requirement
        $genderReq = strtoupper(trim((string) ($version['gender_requirement'] ?? $award['gender_restriction'] ?? '')));
        $checks['gender_requirement'] = $genderReq;
        if ($genderReq !== '' && $genderReq !== 'NONE' && $genderReq !== 'ALL') {
            // Check student profile / metadata gender if present
            $studentGender = strtoupper(trim((string) ($student['gender'] ?? '')));
            // A restricted award requires an explicit structured match. Missing
            // gender data must never be treated as eligibility by default.
            if ($studentGender === '' || $studentGender !== $genderReq) {
                $reasons[] = "Award requires gender [{$genderReq}], student profile is [{$studentGender}].";
            }
        }

        $isEligible = empty($reasons);

        return [
            'is_eligible' => $isEligible,
            'reasons'     => $reasons,
            'checks'      => $checks,
        ];
    }

    /**
     * Generates and updates potential candidates for an award in a cycle.
     *
     * @param string $cycleId
     * @param string $awardId
     * @param string|null $evaluatorProfileId
     * @return array
     */
    public function generatePotentialCandidates(string $cycleId, string $awardId, ?string $evaluatorProfileId = null): array
    {
        $cycle = $this->evalService->resolveActiveCycle($cycleId);
        $award = $this->db->table('award_definitions')->where('id', $awardId)->get()->getRowArray();
        if ($award === null) {
            throw new RuntimeException("Award [{$awardId}] not found.");
        }

        $versionBuilder = $this->db->table('award_scoring_model_versions')
            ->where('award_definition_id', $awardId)
            ->where('status', 'published')
            ->groupStart()
                ->where('award_cycle_id', $cycle['id'])
                ->orWhere('award_cycle_id', null)
            ->groupEnd()
            ->orderBy('award_cycle_id IS NULL', 'ASC', false)
            ->orderBy('version_number', 'DESC');
        $version = $versionBuilder->get()->getRowArray();

        $thresholdPercent = (float) ($version['candidate_threshold_percent'] ?? $award['candidate_threshold_percent'] ?? 80.00);

        // Fetch all active students
        $students = $this->db->table('profiles')
            ->where('account_type', 'student')
            ->where('status', 'active')
            ->get()->getResultArray();

        $generatedCandidates = [];

        foreach ($students as $student) {
            $eligibility = $this->evaluateEligibility($student, $award, $version);
            if (! $eligibility['is_eligible']) {
                continue;
            }

            $evalResult = $this->evalService->evaluateStudentAward($cycle['id'], $awardId, $student['id'], $evaluatorProfileId);
            $potentialScore = (float) ($evalResult['potential_percent'] ?? 0.0);

            if ($potentialScore >= $thresholdPercent) {
                $generatedCandidates[] = [
                    'student_profile_id' => $student['id'],
                    'student_name'       => $student['full_name'],
                    'raw_score'          => $evalResult['raw_score'],
                    'potential_score'    => $potentialScore,
                    'threshold_percent'  => $thresholdPercent,
                    'pathway'            => 'automatic_portfolio',
                    'outcome'            => 'Potential Candidate',
                ];
            }
        }

        return $generatedCandidates;
    }

    /**
     * Retrieves the complete OSAD candidate review queue for an award and cycle with deterministic dense ranking.
     *
     * @param string $cycleId
     * @param string $awardId
     * @return array
     */
    public function getCandidatesReviewQueue(string $cycleId, string $awardId): array
    {
        $entries = $this->db->table('award_interview_eligibilities aie')
            ->select('aie.*, p.full_name as student_name, p.institutional_id, p.email as student_email')
            ->join('profiles p', 'p.id = aie.student_profile_id')
            ->where('aie.cycle_id', $cycleId)
            ->where('aie.award_definition_id', $awardId)
            ->where('aie.status', 'eligible')
            ->orderBy('aie.potential_score', 'DESC')
            ->orderBy('p.full_name', 'ASC')
            ->get()->getResultArray();

        // Calculate deterministic dense rank based on potential_score
        $rankedQueue = [];
        $currentRank = 0;
        $lastScore = null;

        foreach ($entries as $item) {
            $score = $item['potential_score'] !== null ? (float) $item['potential_score'] : null;

            if ($score !== null) {
                if ($lastScore === null || $score < $lastScore) {
                    $currentRank++;
                    $lastScore = $score;
                }
                $rankValue = $currentRank;
            } else {
                // Dean nomination with no computed score yet
                $rankValue = null;
            }

            $rankedQueue[] = [
                'id'                  => $item['id'],
                'student_profile_id'  => $item['student_profile_id'],
                'student_name'        => $item['student_name'],
                'institutional_id'    => $item['institutional_id'],
                'pathway'             => $item['pathway'] ?? $item['eligibility_source'],
                'potential_score'     => $score,
                'rank_position'       => $rankValue,
                'status'              => $item['status'],
                'eligible_at'         => $item['eligible_at'],
            ];
        }

        return $rankedQueue;
    }
}
