<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;
use Throwable;

class AwardEvaluationService
{
    protected BaseConnection $db;

    public function __construct(?BaseConnection $db = null)
    {
        $this->db = $db ?? db_connect();
    }

    private function genUuid(): string
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

    /**
     * Resolves the active award cycle.
     */
    public function resolveActiveCycle(?string $cycleId = null): ?array
    {
        if ($cycleId !== null && trim($cycleId) !== '') {
            return $this->db->table('award_cycles')
                ->where('id', trim($cycleId))
                ->get()->getRowArray();
        }

        return $this->db->table('award_cycles')
            ->whereIn('status', ['active', 'evaluating'])
            ->orderBy('start_date', 'DESC')
            ->get()->getRowArray();
    }

    /**
     * Evaluates a single student for a specific award definition and cycle.
     * Computes raw scores strictly from verified student portfolio records.
     * Transactional and idempotent.
     */
    public function evaluateStudentAward(
        string $cycleId,
        string $awardId,
        string $studentProfileId,
        ?string $evaluatorProfileId = null
    ): array {
        $cycle = $this->db->table('award_cycles')->where('id', $cycleId)->get()->getRowArray();
        if ($cycle === null || ! in_array($cycle['status'], ['active', 'evaluating'], true)) {
            throw new RuntimeException('Active award cycle not found.');
        }

        $award = $this->db->table('award_definitions')->where('id', $awardId)->get()->getRowArray();
        if ($award === null || $award['status'] !== 'active') {
            throw new RuntimeException('Active award definition not found.');
        }

        $student = $this->db->table('profiles')
            ->where('id', $studentProfileId)
            ->where('account_type', 'student')
            ->where('status', 'active')
            ->get()->getRowArray();
        if ($student === null) {
            throw new RuntimeException('Active student profile not found.');
        }

        // Fetch criteria for this award
        $criteria = $this->db->table('award_criteria')
            ->where('award_definition_id', $awardId)
            ->orderBy('sort_order', 'ASC')
            ->get()->getResultArray();

        // Fetch all verified portfolio records for this student
        $verifiedRecords = $this->db->table('student_portfolio_records')
            ->where('student_profile_id', $studentProfileId)
            ->where('status', 'verified')
            ->get()->getResultArray();

        $totalRawScore = 0.0;
        $totalMaxComputable = 0.0;
        $criterionEvaluations = [];

        foreach ($criteria as $criterion) {
            $critId = $criterion['id'];
            $critMaxPoints = (float) $criterion['max_points'];
            $totalMaxComputable += $critMaxPoints;

            // Fetch scoring rules for this criterion
            $rules = $this->db->table('award_scoring_rules')
                ->where('criterion_id', $critId)
                ->orderBy('sort_order', 'ASC')
                ->get()->getResultArray();

            $critEarnedPoints = 0.0;
            $evidenceItems = [];
            $usedRecordIds = [];

            if (empty($rules)) {
                // Direct criterion-level taxonomy domain mapping
                $critCode = strtoupper($criterion['code']);
                $targetCatCodes = [];

                if (str_contains($critCode, 'LEAD')) {
                    $targetCatCodes = ['LEADERSHIP_POSITION', 'ORG_MEMBERSHIP_PARTICIPATION'];
                } elseif (str_contains($critCode, 'COMMUNITY') || str_contains($critCode, 'SERVICE')) {
                    $targetCatCodes = ['COMMUNITY_SERVICE_VOLUNTEERISM', 'CHURCH_MINISTRY_INVOLVEMENT'];
                } elseif (str_contains($critCode, 'DEVELOPMENT') || str_contains($critCode, 'SEMINAR') || str_contains($critCode, 'GROWTH')) {
                    $targetCatCodes = ['SEMINAR_TRAINING', 'CITATION_RECOGNITION'];
                } elseif (str_contains($critCode, 'SPORT') || str_contains($critCode, 'ATHL')) {
                    $targetCatCodes = ['SPORTS'];
                } elseif (str_contains($critCode, 'CULT') || str_contains($critCode, 'ART')) {
                    $targetCatCodes = ['SOCIO_CULTURAL_PERFORMING_ARTS'];
                } elseif (str_contains($critCode, 'JOURN') || str_contains($critCode, 'PUB')) {
                    $targetCatCodes = ['CAMPUS_JOURNALISM'];
                } else {
                    $targetCatCodes = ['LEADERSHIP_POSITION', 'COMMUNITY_SERVICE_VOLUNTEERISM', 'SEMINAR_TRAINING'];
                }

                $matchingCats = $this->db->table('portfolio_categories')
                    ->whereIn('code', $targetCatCodes)
                    ->get()->getResultArray();
                $matchingCatIds = array_column($matchingCats, 'id');

                $pointsPerRecord = 15.0; // Standard 15 points per verified record up to max

                foreach ($verifiedRecords as $rec) {
                    $recId = $rec['id'];
                    if (in_array($recId, $usedRecordIds, true)) {
                        continue;
                    }

                    if (in_array($rec['category_id'], $matchingCatIds, true)) {
                        $pointsToAdd = min($pointsPerRecord, max(0.0, $critMaxPoints - $critEarnedPoints));
                        if ($pointsToAdd > 0) {
                            $critEarnedPoints += $pointsToAdd;
                            $usedRecordIds[] = $recId;
                            $evidenceItems[] = [
                                'portfolio_record_id' => $recId,
                                'scoring_rule_id'     => null,
                                'points_effect'       => $pointsToAdd,
                                'basis_snapshot'      => json_encode([
                                    'title'           => $rec['title'],
                                    'category_id'     => $rec['category_id'],
                                    'subcategory_id'  => $rec['subcategory_id'],
                                    'criterion_code'  => $criterion['code'],
                                ]),
                            ];
                        }
                    }
                }
            } else {
                foreach ($rules as $rule) {
                    $ruleId = $rule['id'];
                    $ruleType = $rule['rule_type'];
                    $rulePoints = (float) ($rule['points'] ?? 10.0);
                    $ruleMaxPoints = $rule['max_points'] !== null ? (float) $rule['max_points'] : $critMaxPoints;

                    // Load portfolio mappings for this rule
                    $mappings = $this->db->table('award_portfolio_mappings')
                        ->where('scoring_rule_id', $ruleId)
                        ->where('is_active', 1)
                        ->get()->getResultArray();

                    $ruleEarned = 0.0;

                    foreach ($mappings as $map) {
                        $mapCatId = $map['portfolio_category_id'];
                        $mapSubId = $map['portfolio_subcategory_id'];

                        foreach ($verifiedRecords as $rec) {
                            $recId = $rec['id'];

                            // Avoid double counting same record within the same criterion
                            if (in_array($recId, $usedRecordIds, true)) {
                                continue;
                            }

                            $matches = false;
                            if ($mapSubId !== null && $mapSubId !== '') {
                                $matches = ($rec['category_id'] === $mapCatId && $rec['subcategory_id'] === $mapSubId);
                            } else {
                                $matches = ($rec['category_id'] === $mapCatId);
                            }

                            if ($matches) {
                                $pointsToAdd = $rulePoints > 0 ? $rulePoints : 10.0;
                                if ($ruleEarned + $pointsToAdd > $ruleMaxPoints) {
                                    $pointsToAdd = max(0.0, $ruleMaxPoints - $ruleEarned);
                                }

                                if ($pointsToAdd > 0) {
                                    $ruleEarned += $pointsToAdd;
                                    $usedRecordIds[] = $recId;
                                    $evidenceItems[] = [
                                        'portfolio_record_id' => $recId,
                                        'scoring_rule_id'     => $ruleId,
                                        'points_effect'       => $pointsToAdd,
                                        'basis_snapshot'      => json_encode([
                                            'title'           => $rec['title'],
                                            'category_id'     => $rec['category_id'],
                                            'subcategory_id'  => $rec['subcategory_id'],
                                            'rule_code'       => $rule['code'],
                                            'rule_name'       => $rule['name'],
                                        ]),
                                    ];
                                }
                            }
                        }
                    }

                    $critEarnedPoints += $ruleEarned;
                }
            }

            // Cap criterion points at criterion max_points
            $finalCritPoints = min($critEarnedPoints, $critMaxPoints);
            $totalRawScore += $finalCritPoints;

            $criterionEvaluations[] = [
                'criterion_id'   => $critId,
                'awarded_points' => $finalCritPoints,
                'max_points'     => $critMaxPoints,
                'evidence'       => $evidenceItems,
            ];
        }

        if ($totalMaxComputable <= 0.0) {
            $totalMaxComputable = 100.0;
        }

        $potentialPercent = round(($totalRawScore / $totalMaxComputable) * 100.0, 2);
        $threshold = (float) $award['candidate_threshold_percent'];
        $qualifies = ($potentialPercent >= $threshold);
        $now = date('Y-m-d H:i:s');

        // Atomic Database Persistence
        $this->db->transStart();

        // Check if evaluation already exists for this cycle + award + student
        $existingEval = $this->db->table('student_award_evaluations')
            ->where('cycle_id', $cycleId)
            ->where('award_definition_id', $awardId)
            ->where('student_profile_id', $studentProfileId)
            ->get()->getRowArray();

        $evalId = $existingEval['id'] ?? $this->genUuid();

        if ($existingEval !== null) {
            // Remove existing child scores and evidence for clean recalculation
            $oldCritScores = $this->db->table('student_award_criterion_scores')
                ->where('evaluation_id', $evalId)
                ->get()->getResultArray();
            $oldCritIds = array_column($oldCritScores, 'id');
            if (! empty($oldCritIds)) {
                $this->db->table('student_award_score_evidence')
                    ->whereIn('criterion_score_id', $oldCritIds)
                    ->delete();
                $this->db->table('student_award_criterion_scores')
                    ->where('evaluation_id', $evalId)
                    ->delete();
            }

            $this->db->table('student_award_evaluations')->where('id', $evalId)->update([
                'evaluator_profile_id'      => $evaluatorProfileId,
                'status'                    => 'calculated',
                'raw_score'                 => $totalRawScore,
                'max_computable_score'      => $totalMaxComputable,
                'potential_score'           => $potentialPercent,
                'qualifies_portfolio_based' => $qualifies ? 1 : 0,
                'evaluated_at'              => $now,
                'updated_at'                => $now,
            ]);
        } else {
            $this->db->table('student_award_evaluations')->insert([
                'id'                        => $evalId,
                'cycle_id'                  => $cycleId,
                'award_definition_id'       => $awardId,
                'student_profile_id'        => $studentProfileId,
                'evaluator_profile_id'      => $evaluatorProfileId,
                'status'                    => 'calculated',
                'raw_score'                 => $totalRawScore,
                'max_computable_score'      => $totalMaxComputable,
                'potential_score'           => $potentialPercent,
                'qualifies_portfolio_based' => $qualifies ? 1 : 0,
                'evaluated_at'              => $now,
                'created_at'                => $now,
                'updated_at'                => $now,
            ]);
        }

        // Insert criterion scores & score evidence
        foreach ($criterionEvaluations as $ce) {
            $critScoreId = $this->genUuid();
            $this->db->table('student_award_criterion_scores')->insert([
                'id'             => $critScoreId,
                'evaluation_id'  => $evalId,
                'criterion_id'   => $ce['criterion_id'],
                'awarded_points' => $ce['awarded_points'],
                'max_points'     => $ce['max_points'],
                'created_at'     => $now,
                'updated_at'     => $now,
            ]);

            foreach ($ce['evidence'] as $ev) {
                $this->db->table('student_award_score_evidence')->insert([
                    'id'                  => $this->genUuid(),
                    'criterion_score_id'  => $critScoreId,
                    'portfolio_record_id' => $ev['portfolio_record_id'],
                    'scoring_rule_id'     => $ev['scoring_rule_id'],
                    'points_effect'       => $ev['points_effect'],
                    'basis_snapshot'      => $ev['basis_snapshot'],
                    'created_at'          => $now,
                ]);
            }
        }

        // Maintain award_interview_eligibilities for portfolio_based pathway
        $existingElig = $this->db->table('award_interview_eligibilities')
            ->where('cycle_id', $cycleId)
            ->where('award_definition_id', $awardId)
            ->where('student_profile_id', $studentProfileId)
            ->where('eligibility_source', 'portfolio_based')
            ->get()->getRowArray();

        if ($qualifies) {
            if ($existingElig !== null) {
                $this->db->table('award_interview_eligibilities')->where('id', $existingElig['id'])->update([
                    'evaluation_id'   => $evalId,
                    'potential_score' => $potentialPercent,
                    'status'          => 'eligible',
                ]);
            } else {
                $this->db->table('award_interview_eligibilities')->insert([
                    'id'                  => $this->genUuid(),
                    'cycle_id'            => $cycleId,
                    'award_definition_id' => $awardId,
                    'student_profile_id'  => $studentProfileId,
                    'eligibility_source'  => 'portfolio_based',
                    'pathway'             => 'automated_threshold',
                    'evaluation_id'       => $evalId,
                    'dean_nomination_id'  => null,
                    'potential_score'     => $potentialPercent,
                    'eligible_at'         => $now,
                    'status'              => 'eligible',
                ]);
            }
        } else {
            if ($existingElig !== null) {
                $this->db->table('award_interview_eligibilities')->where('id', $existingElig['id'])->delete();
            }
        }

        $this->db->transComplete();

        if ($this->db->transStatus() === false) {
            throw new RuntimeException('Failed to persist award evaluation.');
        }

        return [
            'evaluation_id'             => $evalId,
            'cycle_id'                  => $cycleId,
            'award_definition_id'       => $awardId,
            'student_profile_id'        => $studentProfileId,
            'raw_score'                 => $totalRawScore,
            'max_computable_score'      => $totalMaxComputable,
            'potential_percent'         => $potentialPercent,
            'candidate_threshold'       => $threshold,
            'qualifies_portfolio_based' => $qualifies,
            'outcome'                   => $qualifies ? 'Potential Candidate / Eligible for Interview' : 'Not Qualified for Interview',
            'criteria'                  => $criterionEvaluations,
        ];
    }

    /**
     * Runs automated evaluation for all students with verified records for a given award.
     */
    public function evaluateAwardForAllStudents(
        string $cycleId,
        string $awardId,
        ?string $evaluatorProfileId = null
    ): array {
        $verifiedStudents = $this->db->table('student_portfolio_records spr')
            ->select('DISTINCT(spr.student_profile_id) AS student_id')
            ->join('profiles p', 'p.id = spr.student_profile_id')
            ->where('spr.status', 'verified')
            ->where('p.account_type', 'student')
            ->where('p.status', 'active')
            ->get()->getResultArray();

        $results = [];
        $candidatesCount = 0;

        foreach ($verifiedStudents as $s) {
            $studentId = $s['student_id'];
            $eval = $this->evaluateStudentAward($cycleId, $awardId, $studentId, $evaluatorProfileId);
            $results[] = $eval;
            if ($eval['qualifies_portfolio_based']) {
                $candidatesCount++;
            }
        }

        return [
            'cycle_id'            => $cycleId,
            'award_definition_id' => $awardId,
            'total_evaluated'     => count($results),
            'candidates_count'    => $candidatesCount,
            'evaluations'         => $results,
        ];
    }

    /**
     * Records a Dean Nomination.
     * Does NOT fabricate any portfolio score or evaluation row.
     */
    public function createDeanNomination(
        string $deanProfileId,
        string $deanAssignmentId,
        string $studentProfileId,
        string $awardDefinitionId,
        ?string $cycleId,
        string $justification
    ): array {
        $deanAssignment = $this->db->table('dean_assignments')
            ->where('id', $deanAssignmentId)
            ->where('personnel_profile_id', $deanProfileId)
            ->where('is_active', 1)
            ->get()->getRowArray();
        if ($deanAssignment === null) {
            throw new RuntimeException('Active Dean assignment required.');
        }

        $student = $this->db->table('profiles')
            ->where('id', $studentProfileId)
            ->where('account_type', 'student')
            ->where('status', 'active')
            ->get()->getRowArray();
        if ($student === null) {
            throw new RuntimeException('Target student profile not found or inactive.');
        }

        $award = $this->db->table('award_definitions')
            ->where('id', $awardDefinitionId)
            ->where('status', 'active')
            ->get()->getRowArray();
        if ($award === null) {
            throw new RuntimeException('Target award definition not found or inactive.');
        }

        $cycle = $this->resolveActiveCycle($cycleId);
        if ($cycle === null || ! in_array($cycle['status'], ['active', 'evaluating'], true)) {
            throw new RuntimeException('Active award cycle not found.');
        }

        if (trim($justification) === '') {
            throw new RuntimeException('Nomination justification is required.');
        }

        $now = date('Y-m-d H:i:s');
        $nominationId = $this->genUuid();
        $eligibilityId = $this->genUuid();

        $this->db->transStart();

        $this->db->table('dean_student_nominations')->insert([
            'id'                  => $nominationId,
            'cycle_id'            => $cycle['id'],
            'award_definition_id' => $awardDefinitionId,
            'student_profile_id'  => $studentProfileId,
            'dean_assignment_id'  => $deanAssignmentId,
            'dean_profile_id'     => $deanProfileId,
            'college_id'          => $deanAssignment['college_id'],
            'justification'       => trim($justification),
            'status'              => 'active',
            'nominated_at'        => $now,
        ]);

        // Insert into interview eligibilities with source = dean_nomination (no fake score)
        $existingElig = $this->db->table('award_interview_eligibilities')
            ->where('cycle_id', $cycle['id'])
            ->where('award_definition_id', $awardDefinitionId)
            ->where('student_profile_id', $studentProfileId)
            ->where('eligibility_source', 'dean_nomination')
            ->get()->getRowArray();

        if ($existingElig === null) {
            $this->db->table('award_interview_eligibilities')->insert([
                'id'                  => $eligibilityId,
                'cycle_id'            => $cycle['id'],
                'award_definition_id' => $awardDefinitionId,
                'student_profile_id'  => $studentProfileId,
                'eligibility_source'  => 'dean_nomination',
                'pathway'             => 'dean_nomination',
                'evaluation_id'       => null,
                'dean_nomination_id'  => $nominationId,
                'potential_score'     => null,
                'eligible_at'         => $now,
                'status'              => 'eligible',
            ]);
        }

        $this->db->transComplete();

        if ($this->db->transStatus() === false) {
            throw new RuntimeException('Failed to record Dean nomination.');
        }

        return [
            'nomination_id'       => $nominationId,
            'cycle_id'            => $cycle['id'],
            'award_definition_id' => $awardDefinitionId,
            'student_profile_id'  => $studentProfileId,
            'eligibility_source'  => 'dean_nomination',
        ];
    }
}
