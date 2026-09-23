<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;

class EvidenceMappingService
{
    protected BaseConnection $db;

    public function __construct(?BaseConnection $db = null)
    {
        $this->db = $db ?? db_connect();
    }

    /**
     * Resolves and evaluates all active mapping rules for a criterion.
     * Enforces:
     * - Hard verification gate (status = 'verified')
     * - Single-criterion canonical evidence deduplication
     * - Structured metadata matching
     *
     * @param string $scoringModelVersionId
     * @param string $criterionId
     * @param array $verifiedRecords
     * @return array
     */
    public function findQualifyingEvidenceForCriterion(
        string $scoringModelVersionId,
        string $criterionId,
        array $verifiedRecords
    ): array {
        // Fetch active mapping rules for this criterion under the scoring model version
        $rules = $this->db->table('award_evidence_mapping_rules')
            ->where('scoring_model_version_id', $scoringModelVersionId)
            ->where('criterion_id', $criterionId)
            ->where('is_active', 1)
            ->orderBy('priority', 'ASC')
            ->get()->getResultArray();

        if (empty($rules)) {
            return [];
        }

        $ruleIds = array_column($rules, 'id');
        $conditions = $this->db->table('award_evidence_mapping_conditions')
            ->whereIn('mapping_rule_id', $ruleIds)
            ->orderBy('group_number', 'ASC')
            ->orderBy('display_order', 'ASC')
            ->get()->getResultArray();

        $conditionsByRule = [];
        foreach ($conditions as $cond) {
            $conditionsByRule[$cond['mapping_rule_id']][] = $cond;
        }

        $qualifyingMatches = [];
        $seenEvidenceIds = [];

        foreach ($rules as $rule) {
            $targetCatId = $rule['portfolio_category_id'];
            $targetSubId = $rule['portfolio_subcategory_id'];
            $ruleConds = $conditionsByRule[$rule['id']] ?? [];

            foreach ($verifiedRecords as $rec) {
                $recId = $rec['id'];

                // Hard Verification Gate
                if (($rec['status'] ?? '') !== 'verified') {
                    continue;
                }

                // Deduplicate within the same criterion subsection
                if (in_array($recId, $seenEvidenceIds, true)) {
                    continue;
                }

                // Category match
                if ($rec['category_id'] !== $targetCatId) {
                    continue;
                }

                // Subcategory match if specified on rule
                if ($targetSubId !== null && $targetSubId !== '' && ($rec['subcategory_id'] ?? '') !== $targetSubId) {
                    continue;
                }

                // Structured metadata conditions evaluation
                if (! empty($ruleConds)) {
                    $metadata = is_string($rec['structured_metadata'] ?? null)
                        ? json_decode($rec['structured_metadata'], true)
                        : ($rec['structured_metadata'] ?? []);

                    $allConditionsPassed = true;
                    foreach ($ruleConds as $c) {
                        $fieldKey = $c['field_key'];
                        $operator = strtoupper($c['operator']);
                        $compVal = $c['comparison_value'];
                        $val = $metadata[$fieldKey] ?? null;

                        if ($operator === 'EQ' && (string) $val !== (string) $compVal) {
                            $allConditionsPassed = false;
                            break;
                        } elseif ($operator === 'IS_NOT_NULL' && $val === null) {
                            $allConditionsPassed = false;
                            break;
                        } elseif ($operator === 'IS_NULL' && $val !== null) {
                            $allConditionsPassed = false;
                            break;
                        }
                    }

                    if (! $allConditionsPassed) {
                        continue;
                    }
                }

                $seenEvidenceIds[] = $recId;
                $qualifyingMatches[] = [
                    'portfolio_record_id'      => $recId,
                    'scoring_model_version_id' => $scoringModelVersionId,
                    'criterion_id'             => $criterionId,
                    'criterion_component_id'   => $rule['criterion_component_id'],
                    'mapping_rule_id'          => $rule['id'],
                    'rule_code'                => $rule['rule_code'],
                    'rule_name'                => $rule['name'],
                    'authority_status'         => $rule['authority_status'],
                    'basis_snapshot'           => [
                        'record_id'      => $recId,
                        'title'          => $rec['title'] ?? '',
                        'category_id'    => $rec['category_id'] ?? '',
                        'subcategory_id' => $rec['subcategory_id'] ?? null,
                        'rule_code'      => $rule['rule_code'],
                    ],
                ];
            }
        }

        return $qualifyingMatches;
    }
}
