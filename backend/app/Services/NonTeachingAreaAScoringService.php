<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use InvalidArgumentException;

/** HR-entered Area A ratings for Non-Teaching Personnel ranking evaluations. */
final class NonTeachingAreaAScoringService
{
    public const DOMAIN = 'productivity_creative_work';
    public const SOURCE = 'ntf_evaluator_rating';

    public function __construct(private ?BaseConnection $db = null) { $this->db ??= db_connect(); }

    /** Compatibility guard for historical rows created by the retired NTF annual-review workbook. */
    public static function isLegacyWorkbookItem(array $item): bool
    {
        $payload = is_string($item['scoring_payload'] ?? null) ? (json_decode($item['scoring_payload'], true) ?: []) : ($item['scoring_payload'] ?? []);
        return ($item['domain'] ?? '') === 'ntf_annual_review'
            || (($payload['locked'] ?? false) === true && ($payload['source'] ?? '') === 'ntf_annual_review_workbook');
    }

    public function setDirectScore(array $evaluation, string $code, float $ds, string $actorId, string $reason = ''): array
    {
        $code = strtoupper(trim($code));
        $reason = trim($reason);
        if (! is_finite($ds) || $ds < 0 || $ds > 100) throw new InvalidArgumentException('DS_OUT_OF_RANGE: DS must be a number from 0 to 100.');
        if (floor($ds) !== $ds) throw new InvalidArgumentException('DS_WHOLE_NUMBER_REQUIRED: DS must be a whole number from 0 to 100.');
        if (mb_strlen($reason) > 500) throw new InvalidArgumentException('DS_REASON_TOO_LONG: Keep the reason under 500 characters.');

        $period = $this->db->table('personnel_evaluation_periods')->where('id', (string) ($evaluation['evaluation_period_id'] ?? ''))->get()->getRowArray();
        if (! $period || strtoupper((string) ($period['personnel_group'] ?? '')) !== 'NON_TEACHING_FACULTY') {
            throw new InvalidArgumentException('AREA_A_NOT_APPLICABLE: DS ratings apply only to Non-Teaching Personnel evaluations.');
        }
        RankingCycleOperationalAvailability::assertEnabled($this->db, (string) $evaluation['evaluation_period_id']);
        $versionId = (string) ($period['evaluation_scale_version_id'] ?? '');
        $area = $this->db->table('evaluation_scale_areas')->where(['scale_version_id' => $versionId, 'area_code' => 'A'])->get()->getRowArray();
        $criterion = $area ? $this->db->table('evaluation_scale_categories')->where(['scale_area_id' => $area['id'], 'category_code' => $code])->get()->getRowArray() : null;
        if (! $criterion) throw new InvalidArgumentException("AREA_A_CRITERION_NOT_FOUND: {$code} is not an Area A criterion of this ranking period.");

        $max = (float) $criterion['max_points'];
        $weight = $max / 100;
        $points = round($ds * $weight, 2);
        $awarded = min($points, $max);
        $now = date('Y-m-d H:i:s');
        $existing = $this->db->table('personnel_evaluation_items')->where([
            'evaluation_id' => $evaluation['id'], 'domain' => self::DOMAIN, 'criterion_code' => $code,
            'source_type' => 'computed',
        ])->get(1)->getRowArray();
        $payload = $existing && is_string($existing['scoring_payload'] ?? null)
            ? (json_decode($existing['scoring_payload'], true) ?: [])
            : ($existing['scoring_payload'] ?? []);
        $previous = $payload['ds'][0] ?? null;
        $payload['source'] = self::SOURCE;
        $payload['ds'] = [$ds];
        $payload['points'] = [$awarded];
        $payload['ds_source'] = 'hr';
        $payload['ds_history'][] = ['from' => $previous, 'to' => $ds, 'by' => $actorId, 'at' => $now, 'reason' => $reason];
        $row = [
            'id' => $existing['id'] ?? $this->uuid(), 'evaluation_id' => $evaluation['id'], 'domain' => self::DOMAIN,
            'item_description' => $criterion['name'] . ' (rated by HR)', 'category_area' => 'areaA',
            'criterion_code' => $code, 'criterion_key' => 'ntf_area_a_' . strtolower(str_replace('.', '_', $code)),
            'criterion_title' => $criterion['name'], 'criterion_version_id' => $versionId,
            'criterion_snapshot' => json_encode(['code' => $code, 'name' => $criterion['name'], 'max_points' => $max, 'weight' => $weight, 'criteria_version_id' => $versionId, 'scoring_rule' => 'DS × weight'], JSON_UNESCAPED_UNICODE),
            'configured_points_snapshot' => $max, 'portfolio_section' => 'evaluator_rating', 'submission_order' => 0,
            'scoring_payload' => json_encode($payload, JSON_UNESCAPED_UNICODE), 'raw_points' => $points,
            'criterion_capped_points' => $awarded, 'awarded_points' => $awarded, 'accepted_points' => $awarded,
            'max_allowed_points' => $max, 'evaluator_judgment_required' => 0, 'evidence_snapshot' => json_encode([]),
            'verification_status' => 'verified', 'rating_status' => 'rated',
            'evaluator_remarks' => $reason !== '' ? "DS set by HR: {$reason}" : 'DS set by HR.',
            'evaluated_by' => $actorId, 'evaluated_at' => $now, 'created_at' => $now, 'updated_at' => $now,
        ];
        $fields = array_flip($this->db->getFieldNames('personnel_evaluation_items'));
        if ($existing) $this->db->table('personnel_evaluation_items')->where('id', $existing['id'])->update(array_diff_key(array_intersect_key($row, $fields), ['id' => true, 'evaluation_id' => true, 'domain' => true, 'criterion_code' => true, 'source_type' => true]));
        else { $row['source_type'] = 'computed'; $this->db->table('personnel_evaluation_items')->insert(array_intersect_key($row, $fields)); }
        return $this->db->table('personnel_evaluation_items')->where('id', $row['id'])->get()->getRowArray();
    }

    private function uuid(): string
    {
        $d = random_bytes(16); $d[6] = chr((ord($d[6]) & 0x0f) | 0x40); $d[8] = chr((ord($d[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($d), 4));
    }
}
