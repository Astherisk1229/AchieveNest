<?php

namespace App\Database\Seeds;

use App\Services\EvaluationInstrumentRegistry;
use App\Services\LocalEvidenceStorageService;
use App\Services\NtfAnnualReviewAreaAService;
use App\Services\NtfAnnualReviewSettingsService;
use App\Services\NtfAnnualReviewTemplateService;
use CodeIgniter\Database\Seeder;
use RuntimeException;

/**
 * LOCAL DEMO ONLY. Adds Area B accomplishments, PDF evidence and evaluation items to the open
 * NTF demo evaluations created by NtfRankingWorkspaceDemoSeeder, plus a confirmed NTF annual-review
 * import whose locked Area A scores are attached the same way portfolio submission does, so the
 * HR Evaluation Studio can be previewed with a fully populated Non-Teaching Faculty portfolio.
 *
 * - Refuses to run in production.
 * - Only touches its own records (deterministic ids prefixed d7100000-). Re-running replaces them.
 * - Point values come from EvaluationInstrumentRegistry (Appendix N); nothing is invented here.
 *
 * Run:    php spark db:seed NtfRankingWorkspaceDemoSeeder   (once, if not yet seeded)
 *         php spark db:seed NtfPortfolioEvidenceDemoSeeder
 * Remove: set NTF_DEMO_EVIDENCE=remove, then run php spark db:seed NtfPortfolioEvidenceDemoSeeder
 */
class NtfPortfolioEvidenceDemoSeeder extends Seeder
{
    public const ID_PREFIX = 'd7100000';
    private const MARKER = 'ntf_portfolio_evidence_demo';

    /** Evaluations from NtfRankingWorkspaceDemoSeeder that are still open for HR review. */
    public const EVALUATIONS = [
        'd7000000-0000-0000-0002-000000000002',
        'd7000000-0000-0000-0002-000000000001',
    ];

    protected ?LocalEvidenceStorageService $storage = null;

    public function run()
    {
        if (ENVIRONMENT === 'production') {
            throw new RuntimeException('NtfPortfolioEvidenceDemoSeeder is local-demo only and will not run in production.');
        }

        $remove = strtolower((string) getenv('NTF_DEMO_EVIDENCE')) === 'remove';
        $points = $this->instrumentPoints();
        $this->storage ??= new LocalEvidenceStorageService();

        foreach (self::EVALUATIONS as $evaluationId) {
            $evaluation = $this->db->table('personnel_evaluations')->where('id', $evaluationId)->get()->getRowArray();
            if (! $evaluation) {
                throw new RuntimeException("Demo evaluation {$evaluationId} not found. Run NtfRankingWorkspaceDemoSeeder first.");
            }
            if (! in_array($evaluation['status'], ['submitted', 'in_evaluation'], true)) {
                $this->say("Skipping {$evaluationId}: status is {$evaluation['status']} (only open evaluations are seeded).");
                continue;
            }

            $this->removeDemoRows($evaluationId);
            $this->removeAreaA($evaluation);
            if ($remove) {
                $this->say("Removed demo evidence from {$evaluationId}.");
                continue;
            }

            $owner = (string) $evaluation['personnel_profile_id'];
            $items = $this->demoItems($points);
            $this->db->transStart();
            foreach ($items as $order => $item) {
                $this->seedItem($evaluation, $owner, $order, $item);
            }
            $areaA = $this->seedAreaA($evaluation);
            $this->db->transComplete();
            if (! $this->db->transStatus()) {
                throw new RuntimeException("Demo evidence for {$evaluationId} could not be seeded.");
            }
            $this->say('Seeded ' . count($items) . " demo Area B items and {$areaA} locked Area A items into {$evaluationId} ({$evaluation['status']}).");
        }
    }

    /** Area B point values from the official NTF instrument (Appendix N). */
    public function instrumentPoints(): array
    {
        $instrument = EvaluationInstrumentRegistry::getInstrument(EvaluationInstrumentRegistry::SCALE_NON_TEACHING);
        $categories = $instrument['areas']['AREA_B']['categories'] ?? [];
        $points = [];
        foreach (['B.1', 'B.2'] as $code) {
            foreach ($categories[$code]['options'] ?? [] as $option) {
                $points[$option['code']] = (float) $option['points'];
            }
        }
        $points['B.4'] = (float) ($categories['B.4']['points_per_occurrence'] ?? 0);
        foreach (['moderator_officer', 'trainer_coach', 'working_committee', 'rendered_service', 'church_activities', 'community_civic', 'charity_projects', 'B.4'] as $required) {
            if (empty($points[$required])) {
                throw new RuntimeException("NTF instrument has no point value for {$required}.");
            }
        }
        return $points;
    }

    /** One realistic accomplishment for each NTF Area B criterion the HR studio renders. */
    public function demoItems(array $p): array
    {
        return [
            ['code' => 'B.1.a', 'option' => 'moderator_officer', 'points' => $p['moderator_officer'], 'title' => 'NDMU Office Staff Association — Treasurer', 'date' => '2025-08-15', 'role' => 'Treasurer', 'organizer' => 'NDMU Office Staff Association', 'file' => 'association-treasurer-appointment.pdf'],
            ['code' => 'B.1.b', 'option' => 'trainer_coach', 'points' => $p['trainer_coach'], 'title' => 'Coach, Personnel Volleyball Team — University Week 2025', 'date' => '2025-10-20', 'role' => 'Coach', 'organizer' => 'NDMU Sports Development Office', 'file' => 'volleyball-coach-certificate.pdf'],
            ['code' => 'B.1.c', 'option' => 'working_committee', 'points' => $p['working_committee'], 'title' => 'Registration Committee — NDMU Foundation Day 2025', 'date' => '2025-03-10', 'role' => 'Member', 'organizer' => 'Office of the President', 'file' => 'foundation-day-committee-memo.pdf'],
            ['code' => 'B.1.d', 'option' => 'rendered_service', 'points' => $p['rendered_service'], 'title' => 'Usher, 2025 Baccalaureate Mass and Commencement', 'date' => '2025-06-07', 'role' => 'Usher', 'organizer' => 'Campus Ministry Office', 'file' => 'commencement-service-certificate.pdf'],
            ['code' => 'B.2.a', 'option' => 'church_activities', 'points' => $p['church_activities'], 'title' => 'Lector, Christ the King Cathedral Parish', 'date' => '2025-01-05', 'role' => 'Lector', 'organizer' => 'Christ the King Cathedral Parish', 'file' => 'parish-lector-certification.pdf'],
            ['code' => 'B.2.b', 'option' => 'community_civic', 'points' => $p['community_civic'], 'title' => 'Barangay Zone III Clean-up Drive Volunteer', 'date' => '2025-09-21', 'role' => 'Volunteer', 'organizer' => 'Barangay Zone III, Koronadal City', 'file' => 'barangay-cleanup-certificate.pdf'],
            ['code' => 'B.2.c', 'option' => 'charity_projects', 'points' => $p['charity_projects'], 'title' => 'Donation to Typhoon Relief Operations', 'date' => '2025-11-04', 'role' => 'Donor', 'organizer' => 'NDMU Social Action Center', 'file' => 'relief-donation-acknowledgment.pdf'],
            ['code' => 'B.4', 'option' => 'resource_person', 'points' => $p['B.4'], 'title' => 'Resource Person — Records Management Seminar for School Staff', 'date' => '2025-07-12', 'role' => 'Resource Person', 'organizer' => 'DepEd Koronadal City Division', 'file' => 'resource-person-invitation.pdf'],
        ];
    }

    private function seedItem(array $evaluation, string $owner, int $order, array $item): void
    {
        $suffix = substr((string) $evaluation['id'], -4);
        $accomplishmentId = $this->demoId('0001', $suffix, $order);
        $evidenceId = $this->demoId('0002', $suffix, $order);
        $itemId = $this->demoId('0003', $suffix, $order);
        $now = date('Y-m-d H:i:s');
        $metadata = [
            'subcategory_code' => $item['code'],
            'option_code' => $item['option'],
            'details' => ['role' => $item['role'], 'activity' => $item['title']],
            'fixture' => self::MARKER,
        ];

        $this->insertExisting('personnel_accomplishments', [
            'id' => $accomplishmentId, 'personnel_profile_id' => $owner, 'domain' => 'productivity_creative_work',
            'title' => $item['title'], 'organizer_or_publisher' => $item['organizer'], 'occurrence_date' => $item['date'],
            'description' => 'Local demo record for the HR Evaluation Studio.', 'status' => 'submitted',
            'category_code' => $item['code'], 'category_area' => 'areaB', 'category_metadata' => json_encode($metadata),
            'created_at' => $now, 'updated_at' => $now,
        ]);

        $tmp = tempnam(sys_get_temp_dir(), 'ntfdemo');
        file_put_contents($tmp, $this->pdf($item['title'], $item['organizer'], $item['date']));
        $stored = $this->storage->storeFile($tmp, 'personnel', $owner, $accomplishmentId, 'pdf', false);
        @unlink($tmp);
        $evidence = [
            'id' => $evidenceId, 'accomplishment_id' => $accomplishmentId, 'storage_path' => $stored['storage_path'],
            'original_filename' => $item['file'], 'mime_type' => 'application/pdf', 'detected_mime_type' => 'application/pdf',
            'byte_size' => $stored['byte_size'], 'checksum' => $stored['sha256'], 'sha256' => $stored['sha256'],
            'uploaded_by' => $owner, 'uploaded_at' => $now, 'security_status' => 'pending',
            'malware_scanner' => 'none_deferred', 'status' => 'active',
        ];
        $this->insertExisting('personnel_accomplishment_evidence', $evidence);

        $snapshot = [
            'code' => $item['code'], 'option_code' => $item['option'], 'configured_points' => $item['points'],
            'criterion_reference' => 'APPENDIX_N/' . $item['code'],
            'source' => 'EvaluationInstrumentRegistry::' . EvaluationInstrumentRegistry::SCALE_NON_TEACHING,
        ];
        $this->insertExisting('personnel_evaluation_items', [
            'id' => $itemId, 'evaluation_id' => $evaluation['id'], 'accomplishment_id' => $accomplishmentId, 'evidence_id' => $evidenceId,
            'domain' => 'productivity_creative_work', 'item_description' => $item['title'], 'category_area' => 'areaB',
            'criterion_code' => $item['code'], 'criterion_key' => $snapshot['criterion_reference'], 'criterion_title' => $item['code'],
            'criterion_version_id' => $evaluation['evaluation_scale_version_id'] ?? null, 'criterion_snapshot' => json_encode($snapshot),
            'configured_points_snapshot' => $item['points'], 'portfolio_section' => 'productivity_creative_work', 'submission_order' => $order,
            'evidence_snapshot' => json_encode([array_intersect_key($evidence, array_flip(['id', 'original_filename', 'mime_type', 'storage_path', 'status']))]),
            'evidence_title' => $item['title'], 'file_name' => $item['file'], 'file_url' => $stored['storage_path'],
            'source_type' => 'accomplishment', 'verification_status' => 'pending', 'rating_status' => 'unrated',
            'scoring_payload' => json_encode([
                'occurrence_date' => $item['date'], 'organizer' => $item['organizer'], 'category_code' => $item['code'],
                'category_area' => 'areaB', 'category_metadata' => $metadata, 'original_remarks' => null,
            ]),
            'created_at' => $now, 'updated_at' => $now,
        ]);
    }

    /** Area A rows of the NTF annual-review workbook: code, name, max points, weight, DS for the two school years. */
    private const AREA_A = [
        ['A.1', 'Job Performance', 50, 0.50, [82, 79]],
        ['A.2', 'Personal Attitudes and Qualities', 10, 0.10, [85, 88]],
        ['A.3', 'Efficiency', 30, 0.30, [74, 78]],
    ];

    /**
     * Records a confirmed NTF annual-review workbook import for the evaluation's personnel and lets
     * NtfAnnualReviewAreaAService attach the locked Area A items, exactly as portfolio submission does.
     */
    private function seedAreaA(array $evaluation): int
    {
        if (! $this->db->tableExists('personnel_annual_review_imports') || ! $this->db->fieldExists('area_a_payload', 'personnel_annual_review_imports')) {
            $this->say('Skipping Area A: this database has no NTF annual-review workbook columns.');
            return 0;
        }
        $periodId = (string) ($evaluation['evaluation_period_id'] ?? '');
        if ($periodId === '') return 0;
        $owner = (string) $evaluation['personnel_profile_id'];
        $now = date('Y-m-d H:i:s');
        $years = $this->schoolYears((string) ($evaluation['academic_year'] ?? ''));

        $items = [];
        $totals = [0.0, 0.0];
        foreach (self::AREA_A as [$code, $name, $max, $weight, $ds]) {
            $points = [round($ds[0] * $weight, 2), round($ds[1] * $weight, 2)];
            $totals[0] += $points[0];
            $totals[1] += $points[1];
            $items[] = ['code' => $code, 'name' => $name, 'max_points' => $max, 'weight' => $weight, 'ds' => $ds, 'points' => $points, 'average_points' => round(($points[0] + $points[1]) / 2, 2)];
        }
        $areaMax = array_sum(array_column(self::AREA_A, 2));
        $percent = [round($totals[0] / $areaMax * 100, 2), round($totals[1] / $areaMax * 100, 2)];
        [$scaleVersion, $bands, $ratings] = $this->ratings($percent);
        $payload = [
            'template_identifier' => NtfAnnualReviewTemplateService::TEMPLATE_ID,
            'criteria_version_id' => $evaluation['evaluation_scale_version_id'] ?? null,
            'area_max' => $areaMax,
            'school_years' => $years,
            'items' => $items,
            'totals' => [round($totals[0], 2), round($totals[1], 2)],
            'percentages' => $percent,
            'ratings' => $ratings,
            'passing' => [true, true],
            'average_total' => round(array_sum(array_column($items, 'average_points')), 2),
            'rating_scale' => ['version' => $scaleVersion, 'bands' => $bands, 'is_provisional' => true],
            'workbook_personnel_profile_id' => $owner,
            'fixture' => self::MARKER,
        ];

        // The newest confirmed import is authoritative; ours is confirmed now, so it wins.
        $this->upsertExisting('personnel_annual_review_imports', [
            'id' => $this->areaAImportId($evaluation), 'personnel_profile_id' => $owner, 'expected_personnel_profile_id' => $owner,
            'evaluation_period_id' => $periodId, 'source' => 'demo_seed',
            'source_file_path' => 'demo/ntf-annual-review/' . $owner . '.xlsx', 'original_filename' => 'NTF_Annual_Review_Demo.xlsx',
            'file_hash' => hash('sha256', self::MARKER . $owner . $periodId), 'template_identifier' => NtfAnnualReviewTemplateService::TEMPLATE_ID,
            'detected_personnel_name' => (string) ($this->db->table('profiles')->select('full_name')->where('id', $owner)->get()->getRowArray()['full_name'] ?? ''),
            'review_1_school_year' => $years[0], 'review_1_rating' => $ratings[0],
            'review_2_school_year' => $years[1], 'review_2_rating' => $ratings[1],
            'two_review_status' => 'passed', 'two_review_reason' => null,
            'validation_status' => 'valid', 'validation_issues' => json_encode([]), 'match_status' => 'matched',
            'area_a_payload' => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'uploaded_by' => $owner, 'uploader_workspace' => 'hr', 'uploaded_at' => $now, 'confirmed_at' => $now,
            'supersedes_import_id' => null, 'superseded_at' => null, 'correction_reason' => null,
            'created_at' => $now, 'updated_at' => $now,
        ]);

        return (new NtfAnnualReviewAreaAService($this->db))->attach((string) $evaluation['id'], $now);
    }

    /** Removes this seeder's workbook import and the locked Area A items attached from it. */
    private function removeAreaA(array $evaluation): void
    {
        if (! $this->db->tableExists('personnel_annual_review_imports')) return;
        $importId = $this->areaAImportId($evaluation);
        foreach ($this->db->table('personnel_evaluation_items')->select('id,scoring_payload')->where(['evaluation_id' => $evaluation['id'], 'domain' => NtfAnnualReviewAreaAService::DOMAIN])->get()->getResultArray() as $row) {
            $payload = json_decode((string) ($row['scoring_payload'] ?? ''), true) ?: [];
            if (($payload['import_id'] ?? null) === $importId) $this->db->table('personnel_evaluation_items')->where('id', $row['id'])->delete();
        }
        $this->db->table('personnel_annual_review_imports')->where('id', $importId)->delete();
    }

    private function areaAImportId(array $evaluation): string
    {
        return $this->demoId('0004', substr((string) $evaluation['id'], -4), 0);
    }

    /** "2027-2028" → the two preceding school years the workbook covers. */
    private function schoolYears(string $academicYear): array
    {
        if (preg_match('/(\d{4})\D+(\d{4})/', $academicYear, $m)) {
            $start = (int) $m[1];
            return [($start - 2) . '-' . ($start - 1), ($start - 1) . '-' . $start];
        }
        return ['2025-2026', '2026-2027'];
    }

    /** Ratings from the active NTF rating scale when configured; a passing label otherwise. */
    private function ratings(array $percent): array
    {
        try {
            $scale = (new NtfAnnualReviewSettingsService($this->db))->active('rating_scale');
            return [$scale['version'] ?? null, $scale['value']['bands'] ?? [], [
                NtfAnnualReviewSettingsService::band($percent[0], $scale['value'])['key'] ?? 'very_satisfactory',
                NtfAnnualReviewSettingsService::band($percent[1], $scale['value'])['key'] ?? 'very_satisfactory',
            ]];
        } catch (\Throwable) {
            return [null, [], ['very_satisfactory', 'very_satisfactory']];
        }
    }

    private function upsertExisting(string $table, array $row): void
    {
        $fields = array_flip($this->db->getFieldNames($table));
        $this->db->table($table)->upsert(array_intersect_key($row, $fields));
    }

    private function removeDemoRows(string $evaluationId): void
    {
        $items = $this->db->table('personnel_evaluation_items')->where('evaluation_id', $evaluationId)->like('id', self::ID_PREFIX, 'after')->get()->getResultArray();
        $accomplishmentIds = array_values(array_filter(array_column($items, 'accomplishment_id'), fn ($id) => str_starts_with((string) $id, self::ID_PREFIX)));
        $this->db->table('personnel_evaluation_items')->where('evaluation_id', $evaluationId)->like('id', self::ID_PREFIX, 'after')->delete();
        if ($accomplishmentIds === []) {
            return;
        }
        foreach ($this->db->table('personnel_accomplishment_evidence')->whereIn('accomplishment_id', $accomplishmentIds)->get()->getResultArray() as $row) {
            $path = $this->storage->resolveAbsolutePath((string) $row['storage_path']);
            if ($path && is_file($path)) {
                @unlink($path);
            }
        }
        $this->db->table('personnel_accomplishment_evidence')->whereIn('accomplishment_id', $accomplishmentIds)->delete();
        $this->db->table('personnel_accomplishments')->whereIn('id', $accomplishmentIds)->delete();
    }

    private function demoId(string $kind, string $evaluationSuffix, int $order): string
    {
        return sprintf('%s-%s-%s-0000-%012d', self::ID_PREFIX, $kind, $evaluationSuffix, $order + 1);
    }

    /** Inserts only columns that exist in this database (schemas differ across local installs). */
    private function insertExisting(string $table, array $row): void
    {
        $fields = array_flip($this->db->getFieldNames($table));
        $this->db->table($table)->insert(array_intersect_key($row, $fields));
    }

    private function say(string $message): void
    {
        if (! is_cli() || ENVIRONMENT === 'testing') {
            return;
        }
        echo $message . PHP_EOL;
    }

    /** Minimal single-page PDF so the studio's proof preview has a real document to show. */
    public function pdf(string $title, string $organizer, string $date): string
    {
        $esc = static fn (string $s) => str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], preg_replace('/[^\x20-\x7E]/', '-', $s));
        $stream = implode("\n", [
            'BT /F1 18 Tf 72 720 Td (DEMO SUPPORTING DOCUMENT) Tj ET',
            'BT /F1 12 Tf 72 690 Td (' . $esc($title) . ') Tj ET',
            'BT /F1 12 Tf 72 670 Td (Issued by: ' . $esc($organizer) . ') Tj ET',
            'BT /F1 12 Tf 72 650 Td (Date: ' . $esc($date) . ') Tj ET',
            'BT /F1 10 Tf 72 610 Td (Local demonstration file for the AchieveNest HR Evaluation Studio.) Tj ET',
        ]);
        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
            '<< /Length ' . strlen($stream) . " >>\nstream\n{$stream}\nendstream",
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        ];
        $pdf = "%PDF-1.4\n";
        $offsets = [];
        foreach ($objects as $i => $object) {
            $offsets[] = strlen($pdf);
            $pdf .= ($i + 1) . " 0 obj\n{$object}\nendobj\n";
        }
        $xref = strlen($pdf);
        $pdf .= "xref\n0 " . (count($objects) + 1) . "\n0000000000 65535 f \n";
        foreach ($offsets as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }
        return $pdf . "trailer\n<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";
    }
}
