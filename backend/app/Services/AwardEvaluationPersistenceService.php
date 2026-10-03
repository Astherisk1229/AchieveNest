<?php

namespace App\Services;

use RuntimeException;

/**
 * AwardEvaluationPersistenceService
 *
 * The single place that writes a portfolio scoring result produced by AwardScoringService into
 * student_award_evaluations, student_award_criterion_scores, student_award_score_evidence and the
 * portfolio-based award_interview_eligibilities row. It never computes points itself.
 *
 * Invariants:
 * - One evaluation row per (cycle, award, student); enforced by uq_student_award_evaluation_scope.
 * - Only portfolio-computable criterion scores are replaced; manual panel scores are kept.
 * - Score evidence is aggregated per (criterion score, portfolio record) to honour uq_critscore_portrec.
 * - All writes happen in one transaction.
 */
class AwardEvaluationPersistenceService
{
    protected const REVIEW_STATUSES = ['in_review', 'completed', 'verified', 'finalized'];

    protected $db;

    public function __construct($db = null)
    {
        $this->db = $db ?? db_connect();
    }

    /**
     * Resolves the published scoring model version bound to the award's active scoring version.
     *
     * @return array{id: ?string, version: ?string}
     */
    public function resolveScoringVersion(array $award): array
    {
        $versionNumber = trim((string) ($award['active_scoring_version'] ?? ''));
        if ($versionNumber === '' || empty($award['id'])) {
            return ['id' => null, 'version' => $versionNumber !== '' ? $versionNumber : null];
        }

        $row = $this->db->table('award_scoring_model_versions')
            ->select('id, version_number')
            ->where('award_definition_id', $award['id'])
            ->where('version_number', $versionNumber)
            ->where('status', 'published')
            ->get()->getRowArray();

        return ['id' => $row['id'] ?? null, 'version' => $versionNumber];
    }

    /**
     * Persists one AwardScoringService::scoreStudentForAward() result.
     */
    public function persistPortfolioEvaluation(
        array $cycle,
        array $award,
        string $studentProfileId,
        array $scoring,
        ?string $evaluatorProfileId = null
    ): array {
        $status = (string) ($scoring['scoring_status'] ?? '');
        if ($status === 'CONFIGURATION_ERROR') {
            throw new RuntimeException('SCORING_CONFIGURATION_ERROR: ' . implode(' ', (array) ($scoring['diagnostics'] ?? [])));
        }

        $cycleId = (string) $cycle['id'];
        $awardId = (string) $award['id'];
        $computableCriteria = $this->db->table('award_criteria')
            ->select('id, max_points')
            ->where('award_definition_id', $awardId)
            ->where('is_portfolio_computable', 1)
            ->get()->getResultArray();
        $computableIds = array_column($computableCriteria, 'id');

        $raw = round((float) ($scoring['raw_portfolio_score'] ?? 0.0), 2);
        $max = (float) ($scoring['computable_max_score'] ?? 0.0);
        if ($max <= 0.0) {
            // Ineligible students have no scored criteria; the maximum is still the rubric's computable total.
            $max = round(array_sum(array_map(static fn(array $c): float => (float) $c['max_points'], $computableCriteria)), 2);
        }
        if ($max <= 0.0) {
            throw new RuntimeException('SCORING_CONFIGURATION_ERROR: award has no portfolio-computable maximum.');
        }
        $potential = round(($raw / $max) * 100.0, 2);
        $threshold = $award['candidate_threshold_percent'] ?? null;
        if (! is_numeric($threshold)) {
            throw new RuntimeException('THRESHOLD_CONFIGURATION_ERROR: candidate threshold is missing.');
        }
        $threshold = (float) $threshold;
        $isEligible = (bool) ($scoring['is_eligible'] ?? false);
        $qualifies = $isEligible && $potential >= $threshold;
        $version = $this->resolveScoringVersion($award);
        $now = date('Y-m-d H:i:s');

        $this->db->transBegin();
        try {
            $existing = $this->db->table('student_award_evaluations')
                ->where('cycle_id', $cycleId)
                ->where('award_definition_id', $awardId)
                ->where('student_profile_id', $studentProfileId)
                ->get()->getRowArray();

            $row = [
                'raw_score'                 => $raw,
                'max_computable_score'      => $max,
                'potential_score'           => $potential,
                'qualifies_portfolio_based' => $qualifies ? 1 : 0,
                'scoring_model_version_id'  => $version['id'],
                'scoring_version'           => $version['version'],
                'evaluated_at'              => $now,
                'updated_at'                => $now,
            ];
            if ($evaluatorProfileId !== null) {
                $row['evaluator_profile_id'] = $evaluatorProfileId;
            }

            if ($existing !== null) {
                $evaluationId = (string) $existing['id'];
                if (! in_array((string) ($existing['status'] ?? ''), self::REVIEW_STATUSES, true)) {
                    $row['status'] = 'calculated';
                }
                $this->db->table('student_award_evaluations')->where('id', $evaluationId)->update($row);
            } else {
                $evaluationId = $this->uuid();
                $this->db->table('student_award_evaluations')->insert(array_merge($row, [
                    'id'                   => $evaluationId,
                    'cycle_id'             => $cycleId,
                    'award_definition_id'  => $awardId,
                    'student_profile_id'   => $studentProfileId,
                    'evaluator_profile_id' => $evaluatorProfileId,
                    'status'               => 'calculated',
                    'created_at'           => $now,
                ]));
            }

            // Replace portfolio-computed criterion scores only; manual panel criteria are untouched.
            if ($computableIds !== []) {
                $oldScoreIds = array_column($this->db->table('student_award_criterion_scores')
                    ->select('id')
                    ->where('evaluation_id', $evaluationId)
                    ->whereIn('criterion_id', $computableIds)
                    ->get()->getResultArray(), 'id');
                if ($oldScoreIds !== []) {
                    $this->db->table('student_award_score_evidence')->whereIn('criterion_score_id', $oldScoreIds)->delete();
                    $this->db->table('student_award_criterion_scores')->whereIn('id', $oldScoreIds)->delete();
                }
            }

            $persistedCriteria = [];
            foreach (($scoring['criteria_scores'] ?? []) as $criterion) {
                $criterionId = (string) ($criterion['criterion_id'] ?? '');
                if ($criterionId === '' || ! in_array($criterionId, $computableIds, true)) {
                    throw new RuntimeException("SCORING_UNKNOWN_CRITERION: {$criterionId}");
                }
                $scoreId = $this->uuid();
                $components = array_map(static fn(array $c): array => [
                    'component_id'   => $c['component_id'] ?? null,
                    'component_code' => $c['component_code'] ?? null,
                    'component_name' => $c['component_name'] ?? null,
                    'rule_type'      => $c['rule_type'] ?? null,
                    'earned_points'  => (float) ($c['earned_points'] ?? 0.0),
                    'max_points'     => (float) ($c['max_points'] ?? 0.0),
                ], $criterion['components'] ?? []);

                $this->db->table('student_award_criterion_scores')->insert([
                    'id'               => $scoreId,
                    'evaluation_id'    => $evaluationId,
                    'criterion_id'     => $criterionId,
                    'awarded_points'   => (float) ($criterion['earned_points'] ?? 0.0),
                    'max_points'       => (float) ($criterion['max_points'] ?? 0.0),
                    'scoring_snapshot' => json_encode([
                        'source'           => 'PORTFOLIO_SCORING_ENGINE',
                        'scoring_version'  => $version['version'],
                        'scoring_model_version_id' => $version['id'],
                        'criterion_code'   => $criterion['criterion_code'] ?? null,
                        'components'       => $components,
                        'scoring_status'   => $criterion['scoring_status'] ?? null,
                        'scoring_warnings' => $criterion['scoring_warnings'] ?? [],
                    ]),
                    'created_at'       => $now,
                    'updated_at'       => $now,
                ]);

                // Aggregate contributions per portfolio record (one evidence row per criterion score + record).
                $byRecord = [];
                foreach (($criterion['contributions'] ?? []) as $contribution) {
                    $recordId = (string) ($contribution['evidence_id'] ?? '');
                    $points = (float) ($contribution['allocated_points'] ?? 0.0);
                    if ($recordId === '' || $points <= 0.0) {
                        continue;
                    }
                    $byRecord[$recordId]['points'] = round(($byRecord[$recordId]['points'] ?? 0.0) + $points, 2);
                    $byRecord[$recordId]['title'] = $contribution['evidence_title'] ?? '';
                    $byRecord[$recordId]['components'][] = [
                        'component_id'     => $contribution['component_id'] ?? null,
                        'component_code'   => $contribution['component_code'] ?? null,
                        'component_name'   => $contribution['component_name'] ?? null,
                        'allocated_points' => $points,
                    ];
                }
                foreach ($byRecord as $recordId => $entry) {
                    $this->db->table('student_award_score_evidence')->insert([
                        'id'                  => $this->uuid(),
                        'criterion_score_id'  => $scoreId,
                        'portfolio_record_id' => $recordId,
                        'scoring_rule_id'     => $this->resolveRuleId($criterionId, $entry['components']),
                        'points_effect'       => $entry['points'],
                        'basis_snapshot'      => json_encode([
                            'title'          => $entry['title'],
                            'criterion_code' => $criterion['criterion_code'] ?? null,
                            'components'     => $entry['components'],
                        ]),
                        'created_at'          => $now,
                    ]);
                }

                $persistedCriteria[] = $criterion + ['criterion_score_id' => $scoreId];
            }

            $this->syncPortfolioEligibility($cycleId, $awardId, $studentProfileId, $evaluationId, $potential, $qualifies, $now);

            if ($this->db->transStatus() === false) {
                throw new RuntimeException('Failed to persist award evaluation.');
            }
            $this->db->transCommit();
        } catch (\Throwable $e) {
            $this->db->transRollback();
            throw $e;
        }

        return [
            'evaluation_id'             => $evaluationId,
            'raw_score'                 => $raw,
            'max_computable_score'      => $max,
            'potential_percent'         => $potential,
            'candidate_threshold'       => $threshold,
            'qualifies_portfolio_based' => $qualifies,
            'scoring_model_version_id'  => $version['id'],
            'scoring_version'           => $version['version'],
            'criteria'                  => $persistedCriteria,
        ];
    }

    /**
     * Uses the rule bound to the contributing component only when exactly one rule identifies it.
     */
    protected function resolveRuleId(string $criterionId, array $components): ?string
    {
        $componentIds = array_values(array_unique(array_filter(array_column($components, 'component_id'))));
        if (count($componentIds) !== 1) {
            return null;
        }
        $rules = $this->db->table('award_scoring_rules')
            ->select('id')
            ->where('criterion_id', $criterionId)
            ->where('criterion_component_id', $componentIds[0])
            ->get()->getResultArray();

        return count($rules) === 1 ? (string) $rules[0]['id'] : null;
    }

    protected function syncPortfolioEligibility(
        string $cycleId,
        string $awardId,
        string $studentProfileId,
        string $evaluationId,
        float $potential,
        bool $qualifies,
        string $now
    ): void {
        $existing = $this->db->table('award_interview_eligibilities')
            ->where('cycle_id', $cycleId)
            ->where('award_definition_id', $awardId)
            ->where('student_profile_id', $studentProfileId)
            ->where('eligibility_source', 'portfolio_based')
            ->get()->getRowArray();

        if ($qualifies) {
            if ($existing !== null) {
                $this->db->table('award_interview_eligibilities')->where('id', $existing['id'])->update([
                    'evaluation_id'   => $evaluationId,
                    'potential_score' => $potential,
                    'status'          => 'eligible',
                ]);
                return;
            }
            $this->db->table('award_interview_eligibilities')->insert([
                'id'                  => $this->uuid(),
                'cycle_id'            => $cycleId,
                'award_definition_id' => $awardId,
                'student_profile_id'  => $studentProfileId,
                'eligibility_source'  => 'portfolio_based',
                'pathway'             => 'automated_threshold',
                'evaluation_id'       => $evaluationId,
                'dean_nomination_id'  => null,
                'potential_score'     => $potential,
                'eligible_at'         => $now,
                'status'              => 'eligible',
            ]);
            return;
        }

        if ($existing !== null) {
            $this->db->table('award_interview_eligibilities')->where('id', $existing['id'])->delete();
        }
    }

    protected function uuid(): string
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
