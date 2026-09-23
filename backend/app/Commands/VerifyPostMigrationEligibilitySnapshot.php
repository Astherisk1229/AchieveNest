<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use RuntimeException;

/** Disposable fixture and live-MySQL assertions for post-migration eligibility snapshots. */
class VerifyPostMigrationEligibilitySnapshot extends BaseCommand
{
    protected $group = 'Verification';
    protected $name = 'verify:post-migration-eligibility-snapshot';
    protected $description = 'Prepare, inspect, or clean up the disposable post-migration eligibility snapshot fixture.';

    private const PERSON = 'd0000000-0000-0000-0001-000000000008';
    private const ACCOMPLISHMENT = 'acceptance-snapshot-accomplishment';
    private const EVIDENCE = 'acceptance-snapshot-evidence';

    public function run(array $params)
    {
        $db = db_connect();
        if ($db->DBDriver !== 'MySQLi' || $db->getDatabase() !== 'achievenest_local') {
            throw new RuntimeException('Snapshot verification is restricted to achievenest_local MySQL.');
        }
        $mode = $params[0] ?? 'prepare';
        if ($mode === 'prepare') { $this->prepare($db); return; }
        $evaluationId = $params[1] ?? '';
        if ($evaluationId === '') throw new RuntimeException('Evaluation ID is required.');
        if ($mode === 'cleanup-preview') { $this->cleanupPreview($db, $evaluationId); return; }
        if ($mode === 'inspect') { $this->inspect($db, $evaluationId); return; }
        if ($mode === 'cleanup') { $this->cleanup($db, $evaluationId); return; }
        throw new RuntimeException('Mode must be prepare, inspect, or cleanup.');
    }

    private function prepare($db): void
    {
        if ($db->table('personnel_evaluations')->where('personnel_profile_id', self::PERSON)->where('submitted_at !=', null)->countAllResults()) {
            throw new RuntimeException('Disposable personnel already has a submitted evaluation.');
        }
        $source = $db->table('personnel_accomplishments pa')->select('pa.*')->join('personnel_accomplishment_evidence pae', 'pae.accomplishment_id=pa.id AND pae.status="active"')->where('pa.personnel_profile_id', 'd0000000-0000-0000-0001-000000000003')->get()->getRowArray();
        if (!$source) throw new RuntimeException('Safe source accomplishment is unavailable.');
        $sourceEvidence = $db->table('personnel_accomplishment_evidence')->where('accomplishment_id', $source['id'])->where('status', 'active')->get()->getRowArray();
        unset($source['id']);
        $source['id'] = self::ACCOMPLISHMENT; $source['personnel_profile_id'] = self::PERSON;
        $source['title'] = 'Post-migration eligibility snapshot acceptance fixture';
        $source['created_at'] = $source['updated_at'] = date('Y-m-d H:i:s');
        $db->table('personnel_accomplishments')->upsert($source);
        unset($sourceEvidence['id']);
        $sourceEvidence['id'] = self::EVIDENCE; $sourceEvidence['accomplishment_id'] = self::ACCOMPLISHMENT;
        $sourceEvidence['uploaded_by'] = self::PERSON; $sourceEvidence['uploaded_at'] = date('Y-m-d H:i:s');
        $db->table('personnel_accomplishment_evidence')->upsert($sourceEvidence);
        $db->table('personnel_profiles')->where('profile_id', self::PERSON)->update(['employment_status'=>'permanent','employment_start_date'=>'2020-06-01']);
        CLI::write('SNAPSHOT_FIXTURE_READY personnel='.self::PERSON, 'green');
    }

    private function inspect($db, string $evaluationId): void
    {
        $row = $db->table('personnel_evaluations')->where('id', $evaluationId)->where('personnel_profile_id', self::PERSON)->get()->getRowArray();
        if (!$row) throw new RuntimeException('Disposable post-migration submission was not found.');
        $raw = (string) ($row['eligibility_snapshot'] ?? ''); $snapshot = json_decode($raw, true);
        if (!is_array($snapshot)) throw new RuntimeException('eligibility_snapshot is not populated JSON.');
        foreach (['evaluation_period_id','personnel_id','eligibility_status','eligibility_reasons','annual_review_requirement','service_requirement','employment_status','service_years','decision_timestamp'] as $key) {
            if (!array_key_exists($key, $snapshot)) throw new RuntimeException("Snapshot key missing: {$key}");
        }
        $before = hash('sha256', $raw);
        $db->transBegin();
        try {
            $db->table('personnel_profiles')->where('profile_id', self::PERSON)->update(['employment_status'=>'probationary','employment_start_date'=>date('Y-m-d')]);
            $afterRaw = (string) ($db->table('personnel_evaluations')->select('eligibility_snapshot')->where('id', $evaluationId)->get()->getRowArray()['eligibility_snapshot'] ?? '');
            if (!hash_equals($before, hash('sha256', $afterRaw))) throw new RuntimeException('Stored snapshot changed after upstream fact mutation.');
        } finally { $db->transRollback(); }
        CLI::write('SNAPSHOT_POPULATED=PASS', 'green');
        CLI::write('SNAPSHOT_FIELDS=PASS status='.$snapshot['eligibility_status'].' ratings='.implode(',',array_filter([$snapshot['annual_review_requirement']['review_1_rating']??null,$snapshot['annual_review_requirement']['review_2_rating']??null])).' employment='.$snapshot['employment_status'].' service_years='.$snapshot['service_years'].' reasons='.count($snapshot['eligibility_reasons']), 'green');
        CLI::write('SNAPSHOT_RETENTION=PASS hash='.$before, 'green');
        CLI::write('DECISION_TIMESTAMP='.$snapshot['decision_timestamp'], 'green');
        $legacy = $db->table('personnel_evaluations')->where('id', '718c431f-c78c-4777-8222-e4acdf73afdd')->get()->getRowArray();
        CLI::write('OLD_PRE_MIGRATION_SUBMISSION_UNCHANGED='.(($legacy && empty($legacy['eligibility_snapshot'])) ? 'PASS' : 'FAIL'), 'green');
    }

    private function cleanup($db, string $evaluationId): void
    {
        $row = $db->table('personnel_evaluations')->where('id', $evaluationId)->where('personnel_profile_id', self::PERSON)->get()->getRowArray();
        $rootId = $row['evaluation_root_id'] ?? null;
        $imports = $db->table('personnel_annual_review_imports')->where('personnel_profile_id', self::PERSON)->get()->getResultArray();
        $db->transBegin();
        try {
            foreach (['personnel_evaluation_events','personnel_evaluation_items'] as $table) if ($db->tableExists($table)) $db->table($table)->where('evaluation_id', $evaluationId)->delete();
            if ($db->tableExists('personnel_evaluation_idempotency')) $db->table('personnel_evaluation_idempotency')->where('resource_id', $evaluationId)->delete();
            $db->table('personnel_evaluations')->where('id', $evaluationId)->delete();
            if ($rootId && $db->tableExists('personnel_evaluation_roots')) $db->table('personnel_evaluation_roots')->where('id', $rootId)->delete();
            foreach($imports as $import){if($db->tableExists('notifications'))$db->table('notifications')->where(['reference_type'=>'personnel_annual_review_imports','reference_id'=>$import['id']])->delete();$absolute=(new \App\Services\LocalEvidenceStorageService())->resolveAbsolutePath($import['source_file_path']);if($absolute&&is_file($absolute))unlink($absolute);$db->table('personnel_annual_review_imports')->where('id',$import['id'])->delete();}
            $db->table('personnel_accomplishment_evidence')->where('id', self::EVIDENCE)->delete();
            $db->table('personnel_accomplishments')->where('id', self::ACCOMPLISHMENT)->delete();
            $db->table('personnel_profiles')->where('profile_id', self::PERSON)->update(['employment_start_date'=>null]);
            $db->transCommit();
        } catch (\Throwable $e) { $db->transRollback(); throw $e; }
        CLI::write('SNAPSHOT_FIXTURE_CLEANED evaluation='.$evaluationId, 'green');
    }

    private function cleanupPreview($db, string $importId): void
    {
        $row=$db->table('personnel_annual_review_imports')->where('id',$importId)->where('confirmed_at',null)->get()->getRowArray();
        if(!$row)throw new RuntimeException('Unconfirmed import preview was not found.');
        $absolute=(new \App\Services\LocalEvidenceStorageService())->resolveAbsolutePath($row['source_file_path']);
        if($absolute&&is_file($absolute))unlink($absolute);
        $db->table('personnel_annual_review_imports')->where('id',$importId)->delete();
        CLI::write('IMPORT_PREVIEW_CLEANED id='.$importId,'green');
    }
}
