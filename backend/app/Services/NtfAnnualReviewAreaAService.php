<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use InvalidArgumentException;

/**
 * Turns the confirmed NTF annual-review workbook into locked Area A evaluation items.
 *
 * Each Area A criterion (A.1–A.3 in the current criteria) becomes one personnel_evaluation_items row
 * whose awarded/accepted points are the two-year average computed by NtfAnnualReviewWorkbookParser.
 * The rows are verified and rated on creation and marked locked, so evaluators see them but the item
 * decision endpoints refuse to change them.
 */
class NtfAnnualReviewAreaAService
{
    public const DOMAIN = 'ntf_annual_review';
    public const SOURCE = 'ntf_annual_review_workbook';

    public function __construct(private ?BaseConnection $db = null) { $this->db ??= db_connect(); }

    public static function isLocked(array $item): bool
    {
        if (($item['domain'] ?? '') === self::DOMAIN) return true;
        $payload = is_string($item['scoring_payload'] ?? null) ? (json_decode($item['scoring_payload'], true) ?: []) : ($item['scoring_payload'] ?? []);
        return ($payload['locked'] ?? false) === true && ($payload['source'] ?? '') === self::SOURCE;
    }

    /** The confirmed, not superseded NTF workbook import with complete two-year averages, if any. */
    public function authoritativeImport(string $personnelId, string $periodId): ?array
    {
        if (! $this->db->fieldExists('area_a_payload', 'personnel_annual_review_imports')) return null;
        $row = $this->db->table('personnel_annual_review_imports')
            ->where(['personnel_profile_id' => $personnelId, 'evaluation_period_id' => $periodId, 'template_identifier' => NtfAnnualReviewTemplateService::TEMPLATE_ID])
            ->where('confirmed_at !=', null)->where('superseded_at', null)->orderBy('confirmed_at', 'DESC')->get(1)->getRowArray();
        if (! $row) return null;
        $payload = json_decode((string) ($row['area_a_payload'] ?? ''), true);
        if (! is_array($payload) || ($payload['average_total'] ?? null) === null) return null;
        return $row + ['payload' => $payload];
    }

    /**
     * Idempotently attaches the locked Area A items to an NTF evaluation. Returns the number of rows written.
     * Existing locked rows are left untouched (the workbook cannot change after portfolio submission).
     */
    public function attach(string $evaluationId, ?string $now = null): int
    {
        $evaluation = $this->db->table('personnel_evaluations')->where('id', $evaluationId)->get()->getRowArray();
        if (! $evaluation) return 0;
        if (empty($evaluation['evaluation_period_id'])) return 0;
        // The ranking track decides the personnel group of the evaluation.
        $period = $this->db->table('personnel_evaluation_periods')->select('personnel_group')->where('id', $evaluation['evaluation_period_id'])->get()->getRowArray();
        if (strtoupper((string) ($period['personnel_group'] ?? '')) !== NtfAnnualReviewSettingsService::GROUP) return 0;
        $existing = $this->db->table('personnel_evaluation_items')->where(['evaluation_id' => $evaluationId, 'domain' => self::DOMAIN])->countAllResults();
        if ($existing > 0) return 0;
        $import = $this->authoritativeImport((string) $evaluation['personnel_profile_id'], (string) $evaluation['evaluation_period_id']);
        if (! $import) return 0;

        $now ??= date('Y-m-d H:i:s');
        $payload = $import['payload'];
        $evidence = [[
            'type' => 'annual_review_workbook', 'import_id' => $import['id'], 'original_filename' => $import['original_filename'],
            'file_hash' => $import['file_hash'], 'confirmed_at' => $import['confirmed_at'], 'school_years' => $payload['school_years'] ?? [],
        ]];
        $written = 0;
        foreach ($payload['items'] ?? [] as $order => $item) {
            $points = (float) ($item['average_points'] ?? 0);
            $row = [
                'id' => $this->uuid(),
                'evaluation_id' => $evaluationId,
                'domain' => self::DOMAIN,
                'item_description' => "{$item['name']} (annual review average)",
                'category_area' => 'areaA',
                'criterion_code' => $item['code'],
                'criterion_key' => 'ntf_area_a_' . strtolower(str_replace('.', '_', $item['code'])),
                'criterion_title' => $item['name'],
                'criterion_version_id' => $payload['criteria_version_id'] ?? ($evaluation['evaluation_scale_version_id'] ?? null),
                'criterion_snapshot' => json_encode(['code' => $item['code'], 'name' => $item['name'], 'max_points' => $item['max_points'], 'weight' => $item['weight'], 'criteria_version_id' => $payload['criteria_version_id'] ?? null, 'scoring_rule' => 'average of two school years of DS × weight'], JSON_UNESCAPED_UNICODE),
                'configured_points_snapshot' => $item['max_points'],
                'portfolio_section' => 'annual_review',
                'submission_order' => $order,
                'scoring_payload' => json_encode(['locked' => true, 'source' => self::SOURCE, 'import_id' => $import['id'], 'ds' => $item['ds'], 'points' => $item['points'], 'school_years' => $payload['school_years'] ?? [], 'rating_scale_version' => $payload['rating_scale']['version'] ?? null], JSON_UNESCAPED_UNICODE),
                'raw_points' => $points,
                'criterion_capped_points' => min($points, (float) $item['max_points']),
                'awarded_points' => min($points, (float) $item['max_points']),
                'accepted_points' => min($points, (float) $item['max_points']),
                'max_allowed_points' => $item['max_points'],
                'evaluator_judgment_required' => 0,
                'evidence_snapshot' => json_encode($evidence, JSON_UNESCAPED_UNICODE),
                'verification_status' => 'verified',
                'rating_status' => 'rated',
                'evaluator_remarks' => 'Locked from the confirmed NTF annual-review workbook.',
                'evaluated_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ];
            $this->db->table('personnel_evaluation_items')->insert($this->existingFieldsOnly($row));
            $written++;
        }
        return $written;
    }

    /**
     * HR sets (or corrects) the DS of one Area A criterion while the evaluation is in progress.
     *
     * Points Earned = DS × weight (weight = criterion max / 100), capped at the criterion maximum.
     * The imported workbook values are kept in the payload (imported_ds / imported_points) and every
     * change is appended to ds_history, so the final result shows the HR value with a full trail.
     * Rows stay in the locked annual-review domain, so the generic verify/rate endpoints still refuse them.
     */
    public function setDirectScore(array $evaluation, string $code, float $ds, string $actorId, string $reason = ''): array
    {
        $code = strtoupper(trim($code));
        $reason = trim($reason);
        if (! is_finite($ds) || $ds < 0 || $ds > 100) throw new InvalidArgumentException('DS_OUT_OF_RANGE: DS must be a number from 0 to 100.');
        if (mb_strlen($reason) > 500) throw new InvalidArgumentException('DS_REASON_TOO_LONG: Keep the reason under 500 characters.');

        $period = $this->db->table('personnel_evaluation_periods')->where('id', (string) ($evaluation['evaluation_period_id'] ?? ''))->get()->getRowArray();
        if (! $period || strtoupper((string) ($period['personnel_group'] ?? '')) !== NtfAnnualReviewSettingsService::GROUP) {
            throw new InvalidArgumentException('AREA_A_NOT_APPLICABLE: DS ratings apply only to Non-Teaching Personnel evaluations.');
        }
        $criteria = (new NtfAnnualReviewTemplateService($this->db))->criteria($period);
        $criterion = null;
        foreach ($criteria['items'] as $item) if (strtoupper((string) $item['code']) === $code) $criterion = $item;
        if ($criterion === null) throw new InvalidArgumentException("AREA_A_CRITERION_NOT_FOUND: {$code} is not an Area A criterion of this ranking period.");

        $max = (float) $criterion['max_points'];
        $points = round($ds * (float) $criterion['weight'], 2);
        $awarded = min($points, $max);
        $now = date('Y-m-d H:i:s');

        $existing = $this->db->table('personnel_evaluation_items')
            ->where(['evaluation_id' => $evaluation['id'], 'domain' => self::DOMAIN, 'criterion_code' => $criterion['code']])
            ->get(1)->getRowArray();

        if ($existing) {
            $payload = is_string($existing['scoring_payload'] ?? null) ? (json_decode($existing['scoring_payload'], true) ?: []) : ($existing['scoring_payload'] ?? []);
            $values = array_values(array_filter((array) ($payload['ds'] ?? []), 'is_numeric'));
            $previousDs = $values === [] ? null : round(array_sum($values) / count($values), 2);
            if ($previousDs !== null && abs($previousDs - $ds) < 0.005) return $existing;
            if ($previousDs !== null && $reason === '') throw new InvalidArgumentException('DS_REASON_REQUIRED: Give a reason for changing this DS.');
            if (! array_key_exists('imported_ds', $payload)) {
                $payload['imported_ds'] = $payload['ds'] ?? null;
                $payload['imported_points'] = $payload['points'] ?? null;
            }
            $payload['ds'] = [$ds];
            $payload['points'] = [$awarded];
            $payload['ds_source'] = 'hr';
            $payload['ds_history'][] = ['from' => $previousDs, 'to' => $ds, 'by' => $actorId, 'at' => $now, 'reason' => $reason];
            $this->db->table('personnel_evaluation_items')->where('id', $existing['id'])->update($this->existingFieldsOnly([
                'scoring_payload' => json_encode($payload, JSON_UNESCAPED_UNICODE),
                'raw_points' => $points,
                'criterion_capped_points' => $awarded,
                'awarded_points' => $awarded,
                'accepted_points' => $awarded,
                'evaluator_remarks' => $reason !== '' ? "DS set by HR: {$reason}" : 'DS set by HR.',
                'evaluated_by' => $actorId,
                'evaluated_at' => $now,
                'updated_at' => $now,
            ]));
            return $this->db->table('personnel_evaluation_items')->where('id', $existing['id'])->get()->getRowArray();
        }

        $id = $this->uuid();
        $order = array_search($criterion, $criteria['items'], true);
        $this->db->table('personnel_evaluation_items')->insert($this->existingFieldsOnly([
            'id' => $id,
            'evaluation_id' => $evaluation['id'],
            'domain' => self::DOMAIN,
            'item_description' => "{$criterion['name']} (DS entered by HR)",
            'category_area' => 'areaA',
            'criterion_code' => $criterion['code'],
            'criterion_key' => 'ntf_area_a_' . strtolower(str_replace('.', '_', $criterion['code'])),
            'criterion_title' => $criterion['name'],
            'criterion_version_id' => $criteria['version_id'],
            'criterion_snapshot' => json_encode(['code' => $criterion['code'], 'name' => $criterion['name'], 'max_points' => $max, 'weight' => $criterion['weight'], 'criteria_version_id' => $criteria['version_id'], 'scoring_rule' => 'DS × weight'], JSON_UNESCAPED_UNICODE),
            'configured_points_snapshot' => $max,
            'portfolio_section' => 'annual_review',
            'submission_order' => $order === false ? 0 : $order,
            'scoring_payload' => json_encode(['locked' => true, 'source' => 'hr_direct_entry', 'ds' => [$ds], 'points' => [$awarded], 'ds_source' => 'hr', 'ds_history' => [['from' => null, 'to' => $ds, 'by' => $actorId, 'at' => $now, 'reason' => $reason]]], JSON_UNESCAPED_UNICODE),
            'raw_points' => $points,
            'criterion_capped_points' => $awarded,
            'awarded_points' => $awarded,
            'accepted_points' => $awarded,
            'max_allowed_points' => $max,
            'evaluator_judgment_required' => 0,
            'evidence_snapshot' => json_encode([], JSON_UNESCAPED_UNICODE),
            'verification_status' => 'verified',
            'rating_status' => 'rated',
            'evaluator_remarks' => $reason !== '' ? "DS entered by HR: {$reason}" : 'DS entered by HR.',
            'evaluated_by' => $actorId,
            'evaluated_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]));
        return $this->db->table('personnel_evaluation_items')->where('id', $id)->get()->getRowArray();
    }

    private function existingFieldsOnly(array $row): array
    {
        static $fields = null;
        $fields ??= array_flip($this->db->getFieldNames('personnel_evaluation_items'));
        return array_intersect_key($row, $fields);
    }

    private function uuid(): string
    {
        $d = random_bytes(16); $d[6] = chr((ord($d[6]) & 0x0f) | 0x40); $d[8] = chr((ord($d[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($d), 4));
    }
}
