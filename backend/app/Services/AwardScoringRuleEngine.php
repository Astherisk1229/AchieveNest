<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;

class AwardScoringRuleEngine
{
    protected BaseConnection $db;

    public function __construct(?BaseConnection $db = null)
    {
        $this->db = $db ?? db_connect();
    }

    /**
     * Evaluates points for a criterion from matched qualifying evidence.
     * Produces deterministic score and explainability payload.
     *
     * @param array $criterion
     * @param array $qualifyingEvidence
     * @return array
     */
    public function evaluateCriterionScore(array $criterion, array $qualifyingEvidence): array
    {
        $critId = $criterion['id'];
        $critMaxPoints = (float) ($criterion['max_points'] ?? 100.0);
        $isComputable = (int) ($criterion['is_portfolio_computable'] ?? 1);

        // Non-computable criteria (e.g. Panel Interview / Moral Character)
        if ($isComputable === 0) {
            return [
                'criterion_id'        => $critId,
                'criterion_code'      => $criterion['code'] ?? '',
                'criterion_name'      => $criterion['name'] ?? '',
                'is_computable'       => false,
                'status_label'        => 'Not Automatically Evaluated (Panel / Institutional Requirement)',
                'awarded_points'      => 0.0,
                'max_points'          => $critMaxPoints,
                'pre_cap_points'      => 0.0,
                'cap_adjustment'      => 0.0,
                'selected_evidence'   => [],
                'excluded_evidence'   => [],
                'rule_effects'        => [],
            ];
        }

        // Fetch active scoring rule for this criterion
        $rule = $this->db->table('award_scoring_rules')
            ->where('criterion_id', $critId)
            ->where('is_active', 1)
            ->orderBy('sort_order', 'ASC')
            ->get()->getRowArray();

        $ruleType = $rule['rule_type'] ?? 'sum_capped';
        $ruleConfig = is_string($rule['rule_config'] ?? null)
            ? json_decode($rule['rule_config'], true)
            : ($rule['rule_config'] ?? []);

        $defaultPointsPerRecord = (float) ($rule['points'] ?? 15.0);
        if ($defaultPointsPerRecord <= 0.0) {
            $defaultPointsPerRecord = 15.0;
        }

        $rawPointsAccumulated = 0.0;
        $selectedEvidence = [];
        $excludedEvidence = [];
        $usedRecordIds = [];

        if ($ruleType === 'highest_only') {
            // Pick highest scoring single evidence item
            $highestItem = null;
            $highestScore = 0.0;

            foreach ($qualifyingEvidence as $ev) {
                $recId = $ev['portfolio_record_id'];
                $itemPoints = $defaultPointsPerRecord;

                if ($itemPoints > $highestScore) {
                    if ($highestItem !== null) {
                        $excludedEvidence[] = array_merge($highestItem, ['reason' => 'LOWER_THAN_HIGHEST_SELECTED']);
                    }
                    $highestScore = $itemPoints;
                    $highestItem = array_merge($ev, ['points_earned' => $itemPoints]);
                } else {
                    $excludedEvidence[] = array_merge($ev, ['reason' => 'LOWER_THAN_HIGHEST_SELECTED']);
                }
            }

            if ($highestItem !== null) {
                $rawPointsAccumulated = $highestScore;
                $selectedEvidence[] = $highestItem;
            }
        } elseif ($ruleType === 'fixed_presence') {
            // Fixed presence
            if (! empty($qualifyingEvidence)) {
                $rawPointsAccumulated = min($defaultPointsPerRecord, $critMaxPoints);
                $selectedEvidence[] = array_merge($qualifyingEvidence[0], ['points_earned' => $rawPointsAccumulated]);
                for ($i = 1; $i < count($qualifyingEvidence); $i++) {
                    $excludedEvidence[] = array_merge($qualifyingEvidence[$i], ['reason' => 'FIXED_PRESENCE_ALREADY_SATISFIED']);
                }
            }
        } else {
            // sum_capped / matrix_mapping / count_mapping (Default additive with cap)
            foreach ($qualifyingEvidence as $ev) {
                $recId = $ev['portfolio_record_id'];
                if (in_array($recId, $usedRecordIds, true)) {
                    $excludedEvidence[] = array_merge($ev, ['reason' => 'DUPLICATE_WITHIN_SUBSECTION']);
                    continue;
                }

                $pointsToAdd = min($defaultPointsPerRecord, max(0.0, $critMaxPoints - $rawPointsAccumulated));
                if ($pointsToAdd > 0) {
                    $rawPointsAccumulated += $pointsToAdd;
                    $usedRecordIds[] = $recId;
                    $selectedEvidence[] = array_merge($ev, [
                        'points_effect'  => $pointsToAdd,
                        'points_earned'  => $pointsToAdd,
                        'scoring_rule_id'=> $rule['id'] ?? null,
                    ]);
                } else {
                    $excludedEvidence[] = array_merge($ev, ['reason' => 'CAP_REACHED']);
                }
            }
        }

        $preCap = $rawPointsAccumulated;
        $finalEarned = min($rawPointsAccumulated, $critMaxPoints);
        $capAdjustment = max(0.0, $preCap - $finalEarned);

        return [
            'criterion_id'        => $critId,
            'criterion_code'      => $criterion['code'] ?? '',
            'criterion_name'      => $criterion['name'] ?? '',
            'is_computable'       => true,
            'status_label'        => 'Portfolio Computable',
            'rule_type'           => $ruleType,
            'rule_code'           => $rule['code'] ?? 'DEFAULT_SUM_CAP',
            'authority_status'    => $rule['authority_status'] ?? 'OFFICIAL',
            'awarded_points'      => round($finalEarned, 2),
            'max_points'          => $critMaxPoints,
            'pre_cap_points'      => round($preCap, 2),
            'cap_adjustment'      => round($capAdjustment, 2),
            'selected_evidence'   => $selectedEvidence,
            'excluded_evidence'   => $excludedEvidence,
            'evidence'            => $selectedEvidence, // backward compatibility
        ];
    }
}
