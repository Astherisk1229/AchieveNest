<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;

class AwardEvaluationSummaryService
{
    protected BaseConnection $db;
    protected AwardEvaluationService $evalService;
    protected AwardCandidateGenerationService $candService;

    public function __construct(
        ?BaseConnection $db = null,
        ?AwardEvaluationService $evalService = null,
        ?AwardCandidateGenerationService $candService = null
    ) {
        $this->db = $db ?? db_connect();
        $this->evalService = $evalService ?? new AwardEvaluationService($this->db);
        $this->candService = $candService ?? new AwardCandidateGenerationService($this->db, $this->evalService);
    }

    /**
     * Builds and persists an authoritative Portfolio-Based Award Evaluation Summary for a student.
     *
     * @param string $cycleId
     * @param string $awardId
     * @param string $studentProfileId
     * @param string|null $evaluatorProfileId
     * @return array
     */
    public function buildEvaluationSummary(
        string $cycleId,
        string $awardId,
        string $studentProfileId,
        ?string $evaluatorProfileId = null
    ): array {
        $cycle = $this->evalService->resolveActiveCycle($cycleId);
        $award = $this->db->table('award_definitions')->where('id', $awardId)->get()->getRowArray();
        if ($award === null) {
            throw new RuntimeException("Award definition [{$awardId}] not found.");
        }
        if (strtoupper(trim((string) ($award['authority_status'] ?? ''))) === 'PROPOSED') {
            throw new RuntimeException('Proposed rubrics are unavailable for authoritative candidate evaluation summaries.');
        }

        $student = $this->db->table('profiles')
            ->where('id', $studentProfileId)
            ->where('account_type', 'student')
            ->get()->getRowArray();
        if ($student === null) {
            throw new RuntimeException("Student profile [{$studentProfileId}] not found.");
        }

        $version = $this->db->table('award_scoring_model_versions')
            ->where('award_definition_id', $awardId)
            ->where('status', 'published')
            ->orderBy('version_number', 'DESC')
            ->get()->getRowArray();

        $thresholdValue = $version['candidate_threshold_percent'] ?? $award['candidate_threshold_percent'] ?? null;
        if (! is_numeric($thresholdValue) || (float) $thresholdValue < 0.0 || (float) $thresholdValue > 100.0) {
            throw new RuntimeException('Candidate threshold configuration is missing or invalid.');
        }
        $thresholdPercent = (float) $thresholdValue;

        // Fetch or trigger evaluation calculation
        $evalResult = $this->evalService->evaluateStudentAward($cycle['id'], $awardId, $studentProfileId, $evaluatorProfileId);
        $evalId = $evalResult['evaluation_id'];

        // Determine pathway (check if Dean nomination exists)
        $deanNom = $this->db->table('dean_student_nominations')
            ->where('cycle_id', $cycle['id'])
            ->where('award_definition_id', $awardId)
            ->where('student_profile_id', $studentProfileId)
            ->where('status', 'active')
            ->get()->getRowArray();

        $pathway = $deanNom !== null ? 'dean_nomination' : 'automatic_portfolio';

        // Load all criteria for this award
        $allCriteria = $this->db->table('award_criteria')
            ->where('award_definition_id', $awardId)
            ->orderBy('sort_order', 'ASC')
            ->get()->getResultArray();

        $criteriaBreakdown = [];
        $nonComputableCriteria = [];

        foreach ($allCriteria as $crit) {
            $isComputable = (int) ($crit['is_portfolio_computable'] ?? 1) === 1;

            if (! $isComputable) {
                $nonComputableCriteria[] = [
                    'criterion_id'     => $crit['id'],
                    'code'             => $crit['code'],
                    'name'             => $crit['name'],
                    'status_label'     => 'Not Automatically Evaluated (Panel / Institutional Requirement)',
                    'max_points'       => (float) $crit['max_points'],
                    'authority_status' => AwardApiContractService::authority($crit['authority_status'] ?? null),
                ];
                continue;
            }

            // Fetch criterion score and evidence rows
            $critScoreRow = $this->db->table('student_award_criterion_scores')
                ->where('evaluation_id', $evalId)
                ->where('criterion_id', $crit['id'])
                ->get()->getRowArray();

            $evidenceRows = [];
            if ($critScoreRow !== null) {
                $evidenceRows = $this->db->table('student_award_score_evidence sase')
                    ->select('sase.*, spr.title, spr.category_id, spr.subcategory_id, spr.status as verification_status')
                    ->join('student_portfolio_records spr', 'spr.id = sase.portfolio_record_id', 'left')
                    ->where('sase.criterion_score_id', $critScoreRow['id'])
                    ->get()->getResultArray();
            }

            $rule = $this->db->table('award_scoring_rules')
                ->where('criterion_id', $crit['id'])
                ->where('is_active', 1)
                ->get()->getRowArray();

            $criteriaBreakdown[] = [
                'criterion_id'        => $crit['id'],
                'code'                => $crit['code'],
                'name'                => $crit['name'],
                'is_computable'       => true,
                'status_label'        => 'Portfolio Computable',
                'max_points'          => (float) $crit['max_points'],
                'awarded_points'      => $critScoreRow !== null ? (float) $critScoreRow['awarded_points'] : 0.0,
                'rule_applied'        => $rule['code'] ?? null,
                'rule_type'           => $rule['rule_type'] ?? null,
                'authority_status'    => AwardApiContractService::authority($rule['authority_status'] ?? $crit['authority_status'] ?? null),
                'evidence_count'      => count($evidenceRows),
                'evidence'            => array_map(function ($ev) {
                    return [
                        'portfolio_record_id' => $ev['portfolio_record_id'],
                        'title'               => $ev['title'] ?? 'Verified Evidence',
                        'verification_status' => $ev['verification_status'] ?? 'verified',
                        'points_effect'       => (float) $ev['points_effect'],
                        'selection_status'    => 'COUNTED',
                    ];
                }, $evidenceRows),
            ];
        }

        $criteriaBreakdown = array_map(static function (array $criterion): array {
            $contract = AwardApiContractService::criterion($criterion);
            $contract['achieved_points'] = $criterion['awarded_points'];
            $contract['calculation_text'] = $criterion['rule_applied'] !== null ? 'Calculated using ' . $criterion['rule_applied'] . '.' : null;
            $contract['verified_record_count'] = $criterion['evidence_count'];
            $contract['evidence_ids'] = array_values(array_filter(array_column($criterion['evidence'], 'portfolio_record_id')));
            return array_merge($criterion, $contract);
        }, $criteriaBreakdown);
        $nonComputableCriteria = array_map(static fn(array $criterion): array => array_merge($criterion, [
            'criterion_type' => 'HUMAN_ONLY',
            'human_only' => true,
            'evaluation_stage' => 'FULL_EVALUATION',
            'source_note' => null,
            'scoring_status' => 'HUMAN_ONLY',
            'scoring_warnings' => [],
        ]), $nonComputableCriteria);

        $rawScore = (float) $evalResult['raw_score'];
        $maxComputable = (float) $evalResult['max_computable_score'];
        $potentialScore = (float) $evalResult['potential_percent'];
        $qualifies = ($potentialScore >= $thresholdPercent);

        $scoreContract = AwardApiContractService::score([
            'raw_portfolio_score' => $rawScore,
            'computable_max_score' => $maxComputable,
            'portfolio_potential_score' => $potentialScore,
            'candidate_threshold_percent' => $thresholdPercent,
            'candidate_status' => $qualifies ? 'POTENTIAL_CANDIDATE' : 'BELOW_THRESHOLD',
            'scoring_status' => 'VALID',
        ], $award);
        $payload = [
            'summary_title'               => 'Portfolio-Based Award Evaluation Summary',
            'evaluation_id'               => $evalId,
            'student'                     => [
                'id'                      => $student['id'],
                'institutional_id'        => $student['institutional_id'],
                'full_name'               => $student['full_name'],
                'email'                   => $student['email'],
            ],
            'award'                       => [
                'id'                      => $award['id'],
                'code'                    => $award['code'],
                'name'                    => $award['name'],
                'authority_status'        => AwardApiContractService::authority($award['authority_status'] ?? null),
                'source_fidelity_status'  => $award['source_fidelity_status'] ?? null,
            ],
            'award_cycle'                 => [
                'id'                      => $cycle['id'],
                'name'                    => $cycle['name'],
                'academic_year'           => $cycle['academic_year'] ?? null,
            ],
            'scoring_model_version'       => [
                'id'                      => $version['id'] ?? null,
                'version_number'          => $version['version_number'] ?? null,
                'version_label'           => $version['version_label'] ?? null,
                'source_document_id'      => $version['source_document_id'] ?? null,
                'source_document_label'   => $version['source_document_label'] ?? $version['source_document_ref'] ?? null,
                'source_effective_date'   => $version['source_effective_date'] ?? null,
                'candidate_threshold_percent' => $thresholdPercent,
            ],
            'score_contract'              => $scoreContract,
            'totals'                      => [
                'portfolio_raw_score'     => $rawScore,
                'max_computable_score'    => $maxComputable,
                'official_rubric_total'   => $allCriteria === [] ? null : (float) array_sum(array_column($allCriteria, 'weight')),
                'portfolio_potential_score' => $potentialScore,
                'candidate_threshold_percent' => $thresholdPercent,
                'threshold_result'        => $qualifies ? 'Met' : 'Not Met',
                'qualifies_portfolio_based' => $qualifies,
            ],
            'candidate_intake'            => [
                'candidate_pathway'       => $pathway,
                'dean_nomination'         => $deanNom !== null ? [
                    'id'                  => $deanNom['id'],
                    'justification'       => $deanNom['justification'],
                    'nominated_at'        => $deanNom['nominated_at'],
                ] : null,
            ],
            'criteria_breakdown'          => $criteriaBreakdown,
            'not_automatically_evaluated' => $nonComputableCriteria,
            'generated_at'                => date('Y-m-d H:i:s'),
        ];

        // Persist summary snapshot
        $existingSummary = $this->db->table('award_student_evaluation_summaries')
            ->where('evaluation_id', $evalId)
            ->get()->getRowArray();

        $now = date('Y-m-d H:i:s');
        if ($existingSummary !== null) {
            $this->db->table('award_student_evaluation_summaries')->where('id', $existingSummary['id'])->update([
                'summary_payload'             => json_encode($payload),
                'raw_score'                   => $rawScore,
                'max_computable_score'        => $maxComputable,
                'potential_score'             => $potentialScore,
                'candidate_threshold_percent' => $thresholdPercent,
                'qualifies_portfolio_based'   => $qualifies ? 1 : 0,
                'candidate_pathway'           => $pathway,
                'generated_by'                => $evaluatorProfileId,
                'updated_at'                  => $now,
            ]);
        } else {
            $this->db->table('award_student_evaluation_summaries')->insert([
                'id'                          => sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000, mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)),
                'evaluation_id'               => $evalId,
                'student_profile_id'          => $studentProfileId,
                'award_definition_id'         => $awardId,
                'cycle_id'                    => $cycle['id'],
                'scoring_model_version_id'    => $version['id'] ?? null,
                'summary_payload'             => json_encode($payload),
                'raw_score'                   => $rawScore,
                'max_computable_score'        => $maxComputable,
                'potential_score'             => $potentialScore,
                'candidate_threshold_percent' => $thresholdPercent,
                'qualifies_portfolio_based'   => $qualifies ? 1 : 0,
                'candidate_pathway'           => $pathway,
                'generated_by'                => $evaluatorProfileId,
                'created_at'                  => $now,
                'updated_at'                  => $now,
            ]);
        }

        return $payload;
    }
}
