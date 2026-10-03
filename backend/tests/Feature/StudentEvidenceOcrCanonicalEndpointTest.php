<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Controllers\Api\StudentEvidenceOcrController;
use App\Services\AuthorizationService;
use App\Services\LocalEvidenceStorageService;
use App\Services\StudentEvidencePaddleOcrService;
use CodeIgniter\Database\BaseConnection;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\URI;
use CodeIgniter\HTTP\UserAgent;
use CodeIgniter\Test\CIUnitTestCase;
use Config\App;

/** Proves the endpoint reads only the current Phase 2 canonical evidence attachment. */
#[\PHPUnit\Framework\Attributes\Group('manual-proof')]
final class StudentEvidenceOcrCanonicalEndpointTest extends CIUnitTestCase
{
    public static function setUpBeforeClass(): void
    {
        \Tests\Support\ManualProofGate::requireOptIn(false);
        parent::setUpBeforeClass();
    }

    protected $db;
    private array $students;
    private array $fixture;
    private LocalEvidenceStorageService $storage;

    protected function setUp(): void
    {
        parent::setUp();
        $this->db = db_connect('local_defense');
        $config = new \Config\Database();
        $config->default = $config->local_defense;
        $config->defaultGroup = 'local_defense';
        \CodeIgniter\Config\Factories::injectMock('config', 'Database', $config);
        $this->students = $this->db->table('profiles')->select('id, account_type')->where('account_type', 'student')->where('status', 'active')->get(2)->getResultArray();
        self::assertCount(2, $this->students, 'Requires two active student profiles in local_defense.');
        $this->db->transBegin();
        $this->storage = new LocalEvidenceStorageService();
        $this->fixture = $this->createFixture();
    }

    protected function tearDown(): void
    {
        if (isset($this->fixture['storage_path'])) $this->storage->deletePhysicalFile($this->fixture['storage_path']);
        $this->db->transRollback();
        parent::tearDown();
    }

    public function testOwnerCanOcrDraftWithoutMutatingCanonicalOrProcessingTables(): void
    {
        $before = $this->snapshot();
        $response = $this->callAs($this->students[0]['id']);
        self::assertSame(200, $response->getStatusCode(), $response->getBody());
        $ocr = json_decode($response->getBody(), true)['data']['ocr'] ?? [];
        self::assertSame('paddleocr', $ocr['engine'] ?? null);
        self::assertTrue($ocr['advisory_only'] ?? false);
        self::assertArrayHasKey('pages', $ocr);
        self::assertArrayNotHasKey('category', $ocr);
        self::assertArrayNotHasKey('subcategory', $ocr);
        self::assertSame($before, $this->snapshot());
    }

    public function testCanonicalOwnerRequestUsesTheRealPinnedPaddleRuntimeWithoutMutation(): void
    {
        $before = $this->snapshot();
        $response = $this->callAs($this->students[0]['id'], new StudentEvidencePaddleOcrService());
        self::assertSame(200, $response->getStatusCode(), $response->getBody());
        $ocr = json_decode($response->getBody(), true)['data']['ocr'] ?? [];
        self::assertSame('paddleocr', $ocr['engine'] ?? null);
        self::assertTrue($ocr['advisory_only'] ?? false);
        self::assertNotEmpty($ocr['pages'] ?? []);
        self::assertSame($before, $this->snapshot());
    }

    public function testOwnerCanOcrRevisionRequested(): void
    {
        $this->db->table('achievement_record_versions')->where('id', $this->fixture['version_id'])->update(['submission_state' => 'revision_requested']);
        self::assertSame(200, $this->callAs($this->students[0]['id'])->getStatusCode());
    }

    public function testOtherStudentGetsNonRevealingNotFound(): void
    {
        $response = $this->callAs($this->students[1]['id']);
        self::assertSame(404, $response->getStatusCode());
        self::assertSame('EVIDENCE_NOT_FOUND', json_decode($response->getBody(), true)['error']['code'] ?? null);
    }

    /** @dataProvider nonEditableStates */
    public function testNonEditableCurrentStatesAreRejected(string $state): void
    {
        $this->db->table('achievement_record_versions')->where('id', $this->fixture['version_id'])->update(['submission_state' => $state]);
        self::assertSame(404, $this->callAs($this->students[0]['id'])->getStatusCode());
    }

    public static function nonEditableStates(): array
    {
        return [['submitted'], ['routing_pending'], ['resolved']];
    }

    public function testDetachedNonCurrentInactiveAndNonCleanEvidenceAreRejected(): void
    {
        $this->db->table('achievement_version_evidence')->where('evidence_id', $this->fixture['evidence_id'])->delete();
        self::assertSame(404, $this->callAs($this->students[0]['id'])->getStatusCode());
        $this->attach($this->fixture['version_id']);
        $this->db->table('achievement_evidence')->where('id', $this->fixture['evidence_id'])->update(['status' => 'inactive']);
        self::assertSame(404, $this->callAs($this->students[0]['id'])->getStatusCode());
        $this->db->table('achievement_evidence')->where('id', $this->fixture['evidence_id'])->update(['status' => 'active', 'security_status' => 'pending']);
        self::assertSame(404, $this->callAs($this->students[0]['id'])->getStatusCode());
    }

    public function testEvidenceAttachedOnlyToNonCurrentVersionIsRejected(): void
    {
        $this->db->table('achievement_version_evidence')->where('evidence_id', $this->fixture['evidence_id'])->delete();
        $oldVersion = $this->uuid();
        $this->db->table('achievement_record_versions')->insert([
            'id'=>$oldVersion, 'achievement_record_id'=>$this->fixture['record_id'], 'version_number'=>2,
            'previous_version_id'=>$this->fixture['version_id'], 'contract_code'=>$this->contractCode(),
            'submission_state'=>'draft', 'source_type'=>'OWNER_ENTRY', 'created_by_profile_id'=>$this->students[0]['id'],
            'revision_token'=>2, 'created_at'=>date('Y-m-d H:i:s'),
        ]);
        $this->attach($oldVersion);
        self::assertSame(404, $this->callAs($this->students[0]['id'])->getStatusCode());
    }

    public function testUnsupportedAndOversizePersistedEvidenceAreRejectedWithoutMutation(): void
    {
        $source = tempnam(sys_get_temp_dir(), 'ocr-'); file_put_contents($source, 'not an OCR evidence type');
        $this->replaceEvidence($source, 'txt', 'unsupported.txt'); unlink($source);
        $before = $this->snapshot(); $response = $this->callAs($this->students[0]['id']);
        self::assertSame(422, $response->getStatusCode()); self::assertSame($before, $this->snapshot());

        $source = tempnam(sys_get_temp_dir(), 'ocr-'); file_put_contents($source, str_repeat('A', LocalEvidenceStorageService::DEFAULT_MAX_BYTES + 1));
        $this->replaceEvidence($source, 'jpg', 'oversize.jpg'); unlink($source);
        $before = $this->snapshot(); $response = $this->callAs($this->students[0]['id']);
        self::assertSame(422, $response->getStatusCode()); self::assertSame($before, $this->snapshot());
    }

    public function testOneAndTwoPagePdfsAndPngReachAdvisoryOcr(): void
    {
        foreach ([['P02_sports_certificate.png', 'png'], ['P06_seminar_training_certificate.pdf', 'pdf'], ['P13_multipage_achievement_evidence.pdf', 'pdf']] as [$name, $extension]) {
            $this->replaceEvidence(dirname(__DIR__, 2) . '/writable/ocr-audit/dataset/' . $name, $extension, $name);
            $response = $this->callAs($this->students[0]['id']);
            self::assertSame(200, $response->getStatusCode(), $name . ': ' . $response->getBody());
        }
    }

    public function testThreePagePdfAndOcrFailuresPreserveEverySnapshot(): void
    {
        $source = tempnam(sys_get_temp_dir(), 'ocr-'); file_put_contents($source, $this->minimalPdf(3));
        $this->replaceEvidence($source, 'pdf', 'three-pages.pdf'); unlink($source);
        $before = $this->snapshot();
        self::assertSame(422, $this->callAs($this->students[0]['id'], new StudentEvidencePaddleOcrService())->getStatusCode());
        self::assertSame($before, $this->snapshot());

        foreach (['OCR_PROCESS_TIMEOUT', 'OCR_RUNTIME_UNAVAILABLE'] as $code) {
            $before = $this->snapshot(); $response = $this->callAs($this->students[0]['id'], new FailingOcrFake($code));
            self::assertSame(422, $response->getStatusCode());
            self::assertSame($code, json_decode($response->getBody(), true)['error']['code'] ?? null);
            self::assertSame($before, $this->snapshot());
        }
    }

    private function createFixture(): array
    {
        $record = $this->uuid(); $version = $this->uuid(); $evidence = $this->uuid(); $owner = $this->students[0]['id']; $now = date('Y-m-d H:i:s');
        $contract = $this->db->table('achievement_contracts')->select('contract_code')->where('domain', 'STUDENT')->where('is_active', 1)->get(1)->getRowArray();
        self::assertNotEmpty($contract, 'Requires an active Student achievement contract.');
        $this->db->table('achievement_records')->insert(['id'=>$record,'owner_profile_id'=>$owner,'owner_domain'=>'STUDENT','current_version_id'=>null,'canonical_status'=>'active','created_by_profile_id'=>$owner,'created_at'=>$now,'updated_at'=>$now]);
        $this->db->table('achievement_record_versions')->insert(['id'=>$version,'achievement_record_id'=>$record,'version_number'=>1,'previous_version_id'=>null,'contract_code'=>$contract['contract_code'],'submission_state'=>'draft','source_type'=>'OWNER_ENTRY','created_by_profile_id'=>$owner,'revision_token'=>1,'created_at'=>$now]);
        $this->db->table('achievement_records')->where('id', $record)->update(['current_version_id'=>$version]);
        $sample = dirname(__DIR__, 2) . '/writable/ocr-audit/dataset/P01_clean_academic_certificate.jpg';
        self::assertFileExists($sample);
        $stored = $this->storage->storeFile($sample, 'student', $owner, $record, 'jpg');
        $this->db->table('achievement_evidence')->insert(['id'=>$evidence,'storage_path'=>$stored['storage_path'],'original_filename'=>'representative-certificate.jpg','mime_type'=>'image/jpeg','detected_mime_type'=>$stored['detected_mime_type'],'byte_size'=>$stored['byte_size'],'sha256'=>$stored['sha256'],'uploaded_by'=>$owner,'uploaded_at'=>$now,'security_status'=>'clean','malware_scanner'=>'local_defense_fixture','security_validated_at'=>$now,'status'=>'active']);
        $this->fixture = ['record_id'=>$record,'version_id'=>$version,'evidence_id'=>$evidence,'storage_path'=>$stored['storage_path']];
        $this->attach($version);
        return $this->fixture;
    }

    private function attach(string $versionId): void
    {
        $this->db->table('achievement_version_evidence')->insert(['record_version_id'=>$versionId,'evidence_id'=>$this->fixture['evidence_id'],'association_type'=>'PRIMARY_EVIDENCE','is_primary'=>1,'attached_by'=>$this->students[0]['id'],'attached_at'=>date('Y-m-d H:i:s')]);
    }

    private function replaceEvidence(string $source, string $extension, string $filename): void
    {
        $this->storage->deletePhysicalFile($this->fixture['storage_path']);
        $stored = $this->storage->storeFile($source, 'student', $this->students[0]['id'], $this->fixture['record_id'], $extension);
        $this->db->table('achievement_evidence')->where('id', $this->fixture['evidence_id'])->update([
            'storage_path'=>$stored['storage_path'], 'original_filename'=>$filename,
            'mime_type'=>$stored['detected_mime_type'], 'detected_mime_type'=>$stored['detected_mime_type'],
            'byte_size'=>$stored['byte_size'], 'sha256'=>$stored['sha256'],
        ]);
        $this->fixture['storage_path'] = $stored['storage_path'];
    }

    private function callAs(string $profileId, ?StudentEvidencePaddleOcrService $ocr = null): \CodeIgniter\HTTP\ResponseInterface
    {
        $auth = $this->createMock(AuthorizationService::class);
        $auth->method('resolveActor')->willReturn(['profile'=>['id'=>$profileId,'account_type'=>'student']]);
        $controller = new StudentEvidenceOcrController($auth, $this->storage, $ocr ?? new CanonicalOcrFake(), $this->db);
        $controller->initController($this->request(), service('response'), service('logger'));
        return $controller->extract($this->fixture['evidence_id']);
    }

    private function request(): IncomingRequest
    {
        $request = new IncomingRequest(new App(), new URI('http://localhost/api/v1/student/evidence/x/ocr'), null, new UserAgent());
        $request->setMethod('POST'); $request->setHeader('Authorization', 'Bearer local-defense'); return $request;
    }

    private function snapshot(): array
    {
        $e = $this->fixture['evidence_id']; $v = $this->fixture['version_id']; $r = $this->fixture['record_id'];
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

    private function contractCode(): string
    {
        return (string) $this->db->table('achievement_record_versions')->select('contract_code')->where('id', $this->fixture['version_id'])->get()->getRowArray()['contract_code'];
    }

    private function minimalPdf(int $pages): string
    {
        $objects = [1 => '<< /Type /Catalog /Pages 2 0 R >>', 2 => '<< /Type /Pages /Kids [' . implode(' ', array_map(fn ($i) => $i . ' 0 R', range(3, $pages + 2))) . '] /Count ' . $pages . ' >>'];
        foreach (range(3, $pages + 2) as $id) $objects[$id] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>';
        $pdf = "%PDF-1.4\n"; $offsets = [0];
        foreach ($objects as $id => $body) { $offsets[$id] = strlen($pdf); $pdf .= "$id 0 obj\n$body\nendobj\n"; }
        $xref = strlen($pdf); $pdf .= 'xref' . "\n0 " . (count($objects) + 1) . "\n0000000000 65535 f \n";
        foreach ($objects as $id => $_) $pdf .= sprintf('%010d 00000 n ', $offsets[$id]) . "\n";
        return $pdf . "trailer\n<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>\nstartxref\n$xref\n%%EOF\n";
    }
}

final class CanonicalOcrFake extends StudentEvidencePaddleOcrService
{
    public function extract(string $path, string $mime): array
    {
        return ['ok'=>true,'engine'=>'paddleocr','advisory_only'=>true,'pages'=>[['page_index'=>1,'raw_text_lines'=>['Date Awarded: Agosto 12, 2026'],'confidence'=>0.9,'boxes'=>[]]],'suggestions'=>[['label'=>'date_awarded','value'=>'Agosto 12, 2026','source'=>'labelled_ocr']],'warnings'=>[]];
    }
}

final class FailingOcrFake extends StudentEvidencePaddleOcrService
{
    public function __construct(private string $code) {}
    public function extract(string $path, string $mime): array { throw new \RuntimeException($this->code); }
}
