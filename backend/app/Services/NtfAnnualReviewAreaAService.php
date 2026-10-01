<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;

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
