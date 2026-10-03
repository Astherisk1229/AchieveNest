<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\LocalEvidenceStorageService;
use App\Services\LocalTokenService;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * @group http-proof
 * Runs only when explicitly selected: it exercises WAMP routing and local auth.
 */
#[\PHPUnit\Framework\Attributes\Group('manual-proof')]
final class StudentEvidenceOcrHttpProofTest extends CIUnitTestCase
{
    public static function setUpBeforeClass(): void
    {
        \Tests\Support\ManualProofGate::requireOptIn(false);
        parent::setUpBeforeClass();
    }

    protected $db;
    private LocalEvidenceStorageService $storage;
    private array $fixture;
    private string $token = '';

    protected function setUp(): void
    {
        parent::setUp();
        $this->db = db_connect('local_defense');
        $config = new \Config\Database();
        $config->default = $config->local_defense;
        $config->defaultGroup = 'local_defense';
        \CodeIgniter\Config\Factories::injectMock('config', 'Database', $config);
        $this->storage = new LocalEvidenceStorageService();
        $this->cleanupPriorProofFixtures();
        $this->fixture = $this->createFixture();
    }

    protected function tearDown(): void
    {
        if ($this->token !== '') {
            $this->db->table('local_auth_sessions')->where('token_hash', hash('sha256', $this->token))->delete();
        }
        if (isset($this->fixture['evidence_id'])) {
            $this->db->table('achievement_version_evidence')->where('evidence_id', $this->fixture['evidence_id'])->delete();
            $this->db->table('achievement_evidence')->where('id', $this->fixture['evidence_id'])->delete();
        }
        if (isset($this->fixture['record_id'])) {
            $this->db->table('achievement_records')->where('id', $this->fixture['record_id'])->update(['current_version_id' => null]);
        }
        if (isset($this->fixture['version_id'])) $this->db->table('achievement_record_versions')->where('id', $this->fixture['version_id'])->delete();
        if (isset($this->fixture['record_id'])) $this->db->table('achievement_records')->where('id', $this->fixture['record_id'])->delete();
        if (isset($this->fixture['storage_path'])) $this->storage->deletePhysicalFile($this->fixture['storage_path']);
        parent::tearDown();
    }

    public function testAuthenticatedCanonicalOcrEndpointIsAdvisoryAndNonMutating(): void
    {
        $before = $this->snapshot();
        $issued = (new LocalTokenService($this->db))->issueToken($this->fixture['owner_id'], false, '127.0.0.1', 'http-proof');
        $this->token = $issued['access_token'];

        $context = stream_context_create(['http' => ['method' => 'POST', 'ignore_errors' => true, 'timeout' => 70, 'header' => [
            'Authorization: Bearer ' . $this->token,
            'Accept: application/json',
            'Content-Length: 0',
        ]]]);
        $body = file_get_contents('http://127.0.0.1:8080/api/v1/student/evidence/' . rawurlencode($this->fixture['evidence_id']) . '/ocr', false, $context);
        $statusLine = $http_response_header[0] ?? '';
        self::assertStringContainsString(' 200 ', $statusLine, (string) $body);
        $response = json_decode((string) $body, true, 512, JSON_THROW_ON_ERROR);
        $ocr = $response['data']['ocr'] ?? [];
        self::assertSame('paddleocr', $ocr['engine'] ?? null);
        self::assertTrue($ocr['advisory_only'] ?? false);
        self::assertNotEmpty($ocr['pages'] ?? []);
        self::assertArrayNotHasKey('category', $ocr);
        self::assertArrayNotHasKey('subcategory', $ocr);
        self::assertSame($before, $this->snapshot());
    }

    private function createFixture(): array
    {
        $owner = $this->db->table('profiles p')
            ->select('p.id')
            ->join('local_auth_credentials c', 'c.profile_id = p.id AND c.status = \'active\' AND c.must_change_password = 0')
            ->where('p.account_type', 'student')
            ->where('p.status', 'active')
            ->get(1)
            ->getRowArray();
        self::assertNotEmpty($owner, 'HTTP proof requires an active student permitted into the protected portal.');
        $contract = $this->db->table('achievement_contracts')->select('contract_code')->where('domain', 'STUDENT')->where('is_active', 1)->get(1)->getRowArray();
        self::assertNotEmpty($contract, 'HTTP proof requires an active Student contract.');
        $record = $this->uuid(); $version = $this->uuid(); $evidence = $this->uuid(); $now = date('Y-m-d H:i:s');
        $this->db->table('achievement_records')->insert(['id'=>$record,'owner_profile_id'=>$owner['id'],'owner_domain'=>'STUDENT','current_version_id'=>null,'canonical_status'=>'active','created_by_profile_id'=>$owner['id'],'created_at'=>$now,'updated_at'=>$now]);
        $this->db->table('achievement_record_versions')->insert(['id'=>$version,'achievement_record_id'=>$record,'version_number'=>1,'previous_version_id'=>null,'contract_code'=>$contract['contract_code'],'submission_state'=>'draft','source_type'=>'OWNER_ENTRY','created_by_profile_id'=>$owner['id'],'revision_token'=>1,'created_at'=>$now]);
        $this->db->table('achievement_records')->where('id', $record)->update(['current_version_id'=>$version]);
        $sample = dirname(__DIR__, 2) . '/writable/ocr-audit/dataset/P01_clean_academic_certificate.jpg';
        self::assertFileExists($sample);
        $stored = $this->storage->storeFile($sample, 'student', $owner['id'], $record, 'jpg');
        $this->db->table('achievement_evidence')->insert(['id'=>$evidence,'storage_path'=>$stored['storage_path'],'original_filename'=>'http-proof-certificate.jpg','mime_type'=>'image/jpeg','detected_mime_type'=>$stored['detected_mime_type'],'byte_size'=>$stored['byte_size'],'sha256'=>$stored['sha256'],'uploaded_by'=>$owner['id'],'uploaded_at'=>$now,'security_status'=>'clean','malware_scanner'=>'http_proof_fixture','security_validated_at'=>$now,'status'=>'active']);
        $this->db->table('achievement_version_evidence')->insert(['record_version_id'=>$version,'evidence_id'=>$evidence,'association_type'=>'PRIMARY_EVIDENCE','is_primary'=>1,'attached_by'=>$owner['id'],'attached_at'=>$now]);
        return ['owner_id'=>$owner['id'],'record_id'=>$record,'version_id'=>$version,'evidence_id'=>$evidence,'storage_path'=>$stored['storage_path']];
    }

    private function snapshot(): array
    {
        $r=$this->fixture['record_id']; $v=$this->fixture['version_id']; $e=$this->fixture['evidence_id'];
        return [
            'records'=>$this->db->table('achievement_records')->where('id',$r)->get()->getResultArray(),
            'versions'=>$this->db->table('achievement_record_versions')->where('id',$v)->get()->getResultArray(),
            'evidence'=>$this->db->table('achievement_evidence')->where('id',$e)->get()->getResultArray(),
            'attachments'=>$this->db->table('achievement_version_evidence')->where('evidence_id',$e)->get()->getResultArray(),
            'routes'=>$this->db->table('student_achievement_verification_routes')->where('record_version_id',$v)->get()->getResultArray(),
            'routing_events'=>$this->db->table('student_achievement_routing_events')->where('record_version_id',$v)->get()->getResultArray(),
            'verification_events'=>$this->db->table('achievement_verification_events')->where('record_version_id',$v)->get()->getResultArray(),
            'processing_runs'=>$this->db->table('document_processing_runs')->where('target_record_version_id',$v)->get()->getResultArray(),
            'processing_evidence'=>$this->db->table('document_processing_run_evidence')->where('evidence_id',$e)->get()->getResultArray(),
            'proposals'=>$this->db->table('machine_field_proposals')->where('source_evidence_id',$e)->get()->getResultArray(),
        ];
    }

    private function uuid(): string { return sprintf('%s-%s-%s-%s-%s', bin2hex(random_bytes(4)), bin2hex(random_bytes(2)), bin2hex(random_bytes(2)), bin2hex(random_bytes(2)), bin2hex(random_bytes(6))); }

    private function cleanupPriorProofFixtures(): void
    {
        $rows = $this->db->table('achievement_evidence')->select('id, storage_path')->where('malware_scanner', 'http_proof_fixture')->get()->getResultArray();
        foreach ($rows as $row) {
            $versionIds = array_column($this->db->table('achievement_version_evidence')->select('record_version_id')->where('evidence_id', $row['id'])->get()->getResultArray(), 'record_version_id');
            $recordIds = array_column($this->db->table('achievement_record_versions')->select('achievement_record_id')->whereIn('id', $versionIds)->get()->getResultArray(), 'achievement_record_id');
            $this->db->table('achievement_version_evidence')->where('evidence_id', $row['id'])->delete();
            $this->db->table('achievement_evidence')->where('id', $row['id'])->delete();
            if ($recordIds !== []) $this->db->table('achievement_records')->whereIn('id', $recordIds)->update(['current_version_id' => null]);
            if ($versionIds !== []) $this->db->table('achievement_record_versions')->whereIn('id', $versionIds)->delete();
            if ($recordIds !== []) $this->db->table('achievement_records')->whereIn('id', $recordIds)->delete();
            $this->storage->deletePhysicalFile((string) $row['storage_path']);
        }
    }
}
