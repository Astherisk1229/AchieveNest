<?php

namespace App\Services;

final class AwardApiContractService
{
    public const AUTHORITY_OFFICIAL = 'OFFICIAL';
    public const AUTHORITY_OPERATIONALIZED = 'OPERATIONALIZED';
    public const AUTHORITY_PROPOSED = 'PROPOSED';

    public static function authority(?string $value): ?string
    {
        return match (strtoupper(trim((string) $value))) {
            'OFFICIAL' => self::AUTHORITY_OFFICIAL,
            'SYSTEM_OPERATIONALIZATION', 'OPERATIONALIZED' => self::AUTHORITY_OPERATIONALIZED,
            'PROPOSED' => self::AUTHORITY_PROPOSED,
            default => null,
        };
    }

    public static function award(array $award, ?array $version = null): array
    {
        $threshold = self::number($version['candidate_threshold_percent'] ?? $award['candidate_threshold_percent'] ?? null);
        $maximum = self::number($version['computable_max_score'] ?? $version['portfolio_max'] ?? $award['computable_max_score'] ?? $award['portfolio_max'] ?? null);
        $authority = self::authority($version['authority_status'] ?? $award['authority_status'] ?? null);
        $fullEvaluationThreshold = self::number($version['full_evaluation_threshold_percent'] ?? $award['full_evaluation_threshold_percent'] ?? null);
        $configurationStatus = $authority === null
            ? 'CONFIGURATION_ERROR'
            : ($authority === self::AUTHORITY_PROPOSED
            ? 'AWARD_AUTHORITY_PENDING'
            : ($threshold === null ? 'THRESHOLD_CONFIGURATION_ERROR' : 'VALID'));
        $rawQualifying = $threshold !== null && $maximum !== null && $maximum > 0.0
            ? round($maximum * $threshold / 100, 2)
            : null;
        $qualificationUnavailableReason = $authority === self::AUTHORITY_PROPOSED ? 'AUTHORITY_PENDING' : 'NOT_CONFIGURED';

        return array_merge($award, [
            'authority_status' => $authority,
            'source_fidelity_status' => $version['source_fidelity_status'] ?? $award['source_fidelity_status'] ?? null,
            'configuration_status' => $configurationStatus,
            'configuration_valid' => $configurationStatus === 'VALID',
            'candidate_threshold_percent' => $threshold,
            'computable_max_score' => $maximum,
            'raw_qualifying_score' => $rawQualifying,
            'threshold_purpose' => 'POTENTIAL_CANDIDATE_DISCOVERY',
            'thresholds' => [
                'potential_candidate_discovery' => ['value' => $threshold, 'purpose' => 'POTENTIAL_CANDIDATE_DISCOVERY', 'availability' => self::availability($threshold, 'MISSING_CONFIGURATION')],
                'full_evaluation' => ['value' => $fullEvaluationThreshold, 'purpose' => 'FULL_EVALUATION', 'availability' => self::availability($fullEvaluationThreshold, 'MISSING_CONFIGURATION')],
            ],
            'scoring_version_id' => $version['id'] ?? $award['scoring_model_version_id'] ?? null,
            'scoring_version_label' => $version['version_label'] ?? null,
            'source_document_id' => $version['source_document_id'] ?? $award['source_document_id'] ?? null,
            'source_document_label' => $version['source_document_label'] ?? $version['source_document_ref'] ?? $award['source_document_label'] ?? null,
            'source_effective_date' => $version['source_effective_date'] ?? $award['source_effective_date'] ?? null,
            'field_availability' => [
                'candidate_threshold_percent' => self::availability($threshold, $configurationStatus),
                'computable_max_score' => self::availability($maximum, 'MISSING_CONFIGURATION'),
                'raw_qualifying_score' => self::availability($rawQualifying, $qualificationUnavailableReason),
                'scoring_version' => self::availability($version['id'] ?? null, 'MISSING_CONFIGURATION'),
                'source_document' => self::availability($version['source_document_id'] ?? $version['source_document_ref'] ?? $award['source_document_id'] ?? null, 'MISSING_CONFIGURATION'),
                'authority_status' => self::availability($authority, 'MISSING_CONFIGURATION'),
            ],
        ]);
    }

    public static function criterion(array $criterion): array
    {
        $humanOnly = (bool) ($criterion['human_only'] ?? isset($criterion['is_portfolio_computable']) && (int) $criterion['is_portfolio_computable'] === 0);
        $config = self::ruleConfig($criterion['rule_config'] ?? $criterion['point_mapping'] ?? null);
        $semantic = $humanOnly ? self::humanSemantic() : self::semanticRule($criterion, $config);
        $components = is_array($criterion['components'] ?? null) ? $criterion['components'] : [];
        if (! $humanOnly && $semantic['criterion_type'] === null && $components !== []) {
            $componentMapping = array_map(static fn(array $component): array => [
                'component_id' => $component['criterion_id'] ?? $component['id'] ?? null,
                'label' => $component['criterion_name'] ?? $component['name'] ?? null,
                'max_points' => self::number($component['max_points'] ?? null),
            ], $components);
            $semantic = self::semantic(
                'ADDITIVE',
                'ADD_COMPONENTS_UNTIL_CAP',
                $componentMapping,
                self::number($criterion['max_points'] ?? null)
            );
        }
        $criterionType = $semantic['criterion_type'];
        $authorityWarnings = [];
        $unresolvedMappings = [];
        if (($criterion['code'] ?? null) === 'RULE_LEAD_AWARDS') {
            $unresolvedMappings = ['AWARD_REGIONAL', 'AWARD_NATIONAL'];
            $authorityWarnings[] = [
                'code' => 'UNRESOLVED_LEADERSHIP_SCOPE',
                'message' => 'Regional and National leadership award point mappings remain unresolved.',
            ];
        }
        $warnings = self::warnings(array_merge($criterion['scoring_warnings'] ?? [], $authorityWarnings), $criterion['criterion_id'] ?? $criterion['id'] ?? null);

        return [
            'criterion_id' => $criterion['criterion_id'] ?? $criterion['id'] ?? null,
            'criterion_code' => $criterion['criterion_code'] ?? $criterion['code'] ?? null,
            'criterion_name' => $criterion['criterion_name'] ?? $criterion['name'] ?? null,
            'criterion_type' => $criterionType,
            'max_points' => self::number($criterion['max_points'] ?? null),
            'aggregation_mode' => $semantic['aggregation_mode'],
            'point_mapping' => $semantic['point_mapping'],
            'cap' => $semantic['cap'],
            'evidence_requirement' => $criterion['evidence_requirement'] ?? null,
            'duplicate_rule' => $criterion['duplicate_rule'] ?? 'STABLE_EVIDENCE_IDENTITY',
            'scoring_status' => $humanOnly ? 'HUMAN_ONLY' : ($warnings === [] ? ($criterion['scoring_status'] ?? 'VALID') : 'PARTIALLY_UNSCORABLE'),
            'scoring_warnings' => $warnings,
            'human_only' => $humanOnly,
            'evaluation_stage' => $humanOnly ? ($criterion['evaluation_stage'] ?? 'OFFICIAL_REVIEW') : null,
            'unresolved_mappings' => $unresolvedMappings,
            'components' => $components,
            'field_availability' => [
                'criterion_type' => self::availability($criterionType, $humanOnly ? 'HUMAN_ONLY' : 'NOT_CONFIGURED'),
                'aggregation_mode' => self::availability($semantic['aggregation_mode'], $semantic['unavailable_reason']),
                'point_mapping' => self::availability($semantic['point_mapping'], $semantic['unavailable_reason']),
                'cap' => self::availability($semantic['cap'], $humanOnly ? 'HUMAN_ONLY' : $semantic['unavailable_reason']),
                'max_points' => self::availability(self::number($criterion['max_points'] ?? null), 'NOT_CONFIGURED'),
                'evidence_requirement' => self::availability($criterion['evidence_requirement'] ?? null, 'NOT_CONFIGURED'),
                'duplicate_rule' => self::availability($criterion['duplicate_rule'] ?? 'STABLE_EVIDENCE_IDENTITY', 'NOT_CONFIGURED'),
                'unresolved_mappings' => self::availability($unresolvedMappings !== [] ? $unresolvedMappings : null, 'SOURCE_UNRESOLVED'),
            ],
        ];
    }

    public static function criterionComponent(array $component, ?array $rule): array
    {
        return self::criterion(array_merge($component, $rule ?? [], [
            'criterion_id' => $component['id'] ?? null,
            'criterion_code' => $component['code'] ?? null,
            'criterion_name' => $component['name'] ?? null,
            'is_portfolio_computable' => $component['is_computable'] ?? 1,
        ]));
    }

    public static function score(array $score, array $award = [], string $thresholdPurpose = 'POTENTIAL_CANDIDATE_DISCOVERY'): array
    {
        $raw = self::number($score['raw_portfolio_score'] ?? $score['raw_score'] ?? null);
        $max = self::number($score['computable_max_score'] ?? $score['max_computable_score'] ?? null);
        $potential = self::number($score['portfolio_potential_score'] ?? $score['potential_score'] ?? $score['potential_percent'] ?? null);
        $threshold = self::number($score['candidate_threshold_percent'] ?? $award['candidate_threshold_percent'] ?? null);
        $status = $score['scoring_status'] ?? 'VALID';
        if ($threshold === null) {
            $status = 'THRESHOLD_CONFIGURATION_ERROR';
        } elseif ($max === null || $max <= 0.0) {
            $status = 'CONFIGURATION_ERROR';
        }
        if ($potential === null && $raw !== null && $max !== null && $max > 0.0 && ! in_array($status, ['CONFIGURATION_ERROR', 'THRESHOLD_CONFIGURATION_ERROR', 'AWARD_AUTHORITY_PENDING'], true)) {
            $potential = round($raw / $max * 100, 2);
        }
        $warnings = self::warnings($score['scoring_warnings'] ?? [], null);
        $rawQualifying = $threshold !== null && $max !== null && $max > 0.0 ? round($max * $threshold / 100, 2) : null;

        return array_merge($score, [
            'raw_portfolio_score' => $raw,
            'computable_max_score' => $max,
            'portfolio_potential_score' => $potential,
            'candidate_threshold_percent' => $threshold,
            'raw_qualifying_score' => $rawQualifying,
            'candidate_status' => $score['candidate_status'] ?? 'NOT_CLASSIFIED',
            'qualification_basis' => $score['qualification_basis'] ?? ($thresholdPurpose === 'POTENTIAL_CANDIDATE_DISCOVERY' ? 'PORTFOLIO_THRESHOLD' : 'FULL_EVALUATION'),
            'threshold_purpose' => $thresholdPurpose,
            'scoring_status' => $status,
            'scoring_warnings' => $warnings,
            'configuration_status' => $status,
            'configuration_valid' => in_array($status, ['VALID', 'SCORED'], true),
            'field_availability' => [
                'raw_portfolio_score' => self::availability($raw, 'NOT_EVALUATED'),
                'computable_max_score' => self::availability($max, 'MISSING_CONFIGURATION'),
                'portfolio_potential_score' => self::availability($potential, 'NOT_EVALUATED'),
                'candidate_threshold_percent' => self::availability($threshold, 'MISSING_CONFIGURATION'),
                'raw_qualifying_score' => self::availability($rawQualifying, 'MISSING_CONFIGURATION'),
            ],
            'deprecated_fields' => [
                'raw_score' => 'Use raw_portfolio_score.',
                'max_computable_score' => 'Use computable_max_score.',
                'potential_score' => 'Use portfolio_potential_score.',
                'potential_percent' => 'Use portfolio_potential_score.',
                'qualified' => 'Use candidate_status and qualification_basis.',
            ],
        ]);
    }

    public static function warnings(array $warnings, ?string $criterionId): array
    {
        return array_values(array_map(static function ($warning) use ($criterionId): array {
            if (is_array($warning)) {
                return [
                    'code' => $warning['code'] ?? 'SCORING_WARNING',
                    'severity' => $warning['severity'] ?? 'warning',
                    'message' => $warning['message'] ?? $warning['scoring_warning'] ?? 'Scoring requires review.',
                    'criterion_id' => $warning['criterion_id'] ?? $criterionId,
                    'evidence_id' => $warning['evidence_id'] ?? $warning['record_id'] ?? null,
                ];
            }
            return ['code' => 'SCORING_WARNING', 'severity' => 'warning', 'message' => (string) $warning, 'criterion_id' => $criterionId, 'evidence_id' => null];
        }, $warnings));
    }

    private static function semanticRule(array $criterion, array $config): array
    {
        $ruleType = strtoupper(trim((string) ($criterion['criterion_type'] ?? $criterion['aggregation_mode'] ?? $criterion['rule_type'] ?? '')));
        if (isset($config['points_per_item']) && is_numeric($config['points_per_item'])) {
            $perItem = (float) $config['points_per_item'];
            $pointCap = self::number($config['cap'] ?? $config['max_points'] ?? $criterion['max_points'] ?? null);
            $countCap = $perItem > 0.0 && $pointCap !== null ? (int) ceil($pointCap / $perItem) : null;
            $mapping = [];
            if ($countCap !== null) {
                for ($count = 0; $count < $countCap; $count++) {
                    $mapping[] = ['count' => $count, 'points' => min($pointCap, $count * $perItem)];
                }
                $mapping[] = ['count_min' => $countCap, 'points' => $pointCap];
            }
            return self::semantic('COUNT', 'ADD_UNTIL_CAP', $mapping !== [] ? $mapping : null, $countCap);
        }
        $presencePoints = $config['presence_points'] ?? $config['fixed_presence_points'] ?? null;
        if (is_numeric($presencePoints)) {
            return self::semantic('PRESENCE', 'ONCE', [
                'qualified' => (float) $presencePoints,
                'not_qualified' => 0.0,
            ], 1.0);
        }
        if (isset($config['medal_matrix']) && is_array($config['medal_matrix'])) {
            $columns = array_keys($config['medal_matrix']);
            $rows = [];
            foreach ($config['medal_matrix'] as $values) {
                foreach (array_keys(is_array($values) ? $values : []) as $row) {
                    if (! in_array($row, $rows, true)) {
                        $rows[] = $row;
                    }
                }
            }
            $values = array_map(static fn(string $row): array => array_map(
                static fn(string $column): mixed => $config['medal_matrix'][$column][$row] ?? null,
                $columns
            ), $rows);
            return self::semantic('MATRIX', 'ADD_DISTINCT_UNTIL_CAP', compact('rows', 'columns', 'values'), self::number($config['cap'] ?? null));
        }
        if (isset($config['points_matrix']) && is_array($config['points_matrix'])) {
            return self::semantic('HIGHEST_VALUE', 'HIGHEST_ONLY', self::valueMapping($config['points_matrix']), self::number($config['max_points'] ?? $criterion['max_points'] ?? null));
        }
        foreach (['points_per_record', 'role_points', 'event_level_points', 'context_points'] as $mappingKey) {
            if (isset($config[$mappingKey]) && is_array($config[$mappingKey])) {
                return self::semantic('ADDITIVE', 'ADD_DISTINCT_UNTIL_CAP', self::valueMapping($config[$mappingKey]), self::number($config['cap'] ?? $criterion['max_points'] ?? null));
            }
        }
        return match (true) {
            str_contains($ruleType, 'MATRIX') => self::semantic('MATRIX', 'ADD_DISTINCT_UNTIL_CAP', null, self::number($criterion['max_points'] ?? null), 'SOURCE_UNRESOLVED'),
            str_contains($ruleType, 'HIGHEST') => self::semantic('HIGHEST_VALUE', 'HIGHEST_ONLY', null, self::number($criterion['max_points'] ?? null), 'SOURCE_UNRESOLVED'),
            str_contains($ruleType, 'PRESENCE') => self::semantic('PRESENCE', 'ONCE', null, 1.0, 'SOURCE_UNRESOLVED'),
            str_contains($ruleType, 'ADDITIVE'), str_contains($ruleType, 'ACCUMULATE') => self::semantic('ADDITIVE', 'ADD_DISTINCT_UNTIL_CAP', null, self::number($criterion['max_points'] ?? null), 'SOURCE_UNRESOLVED'),
            str_contains($ruleType, 'COUNT'), str_contains($ruleType, 'PER_RECORD') => self::semantic('COUNT', 'ADD_UNTIL_CAP', null, null, 'SOURCE_UNRESOLVED'),
            default => self::semantic(null, null, null, null, 'NOT_CONFIGURED'),
        };
    }

    private static function humanSemantic(): array
    {
        return self::semantic('HUMAN_ONLY', null, null, null, 'HUMAN_ONLY');
    }

    private static function semantic(?string $type, ?string $aggregation, mixed $mapping, ?float $cap, string $reason = 'NOT_CONFIGURED'): array
    {
        return ['criterion_type' => $type, 'aggregation_mode' => $aggregation, 'point_mapping' => $mapping, 'cap' => $cap, 'unavailable_reason' => $reason];
    }

    private static function valueMapping(array $mapping): array
    {
        $result = [];
        foreach ($mapping as $value => $points) {
            if (is_numeric($points)) {
                $result[] = ['value' => strtoupper((string) $value), 'points' => (float) $points];
            }
        }
        return $result;
    }

    private static function ruleConfig(mixed $value): array
    {
        if (is_array($value)) {
            return $value;
        }
        if (! is_string($value) || trim($value) === '') {
            return [];
        }
        $decoded = json_decode($value, true);
        return is_array($decoded) ? $decoded : [];
    }

    private static function availability(mixed $value, string $reason): array
    {
        return ['status' => $value === null ? 'UNAVAILABLE' : 'AVAILABLE', 'reason' => $value === null ? $reason : null];
    }

    private static function number(mixed $value): ?float
    {
        return is_numeric($value) ? (float) $value : null;
    }
}
