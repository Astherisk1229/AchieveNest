<?php
declare(strict_types=1);

namespace Tests\Feature;

use App\Services\CanonicalStudentAchievementDraftService;
use App\Services\LocalEvidenceStorageService;
use CodeIgniter\Test\CIUnitTestCase;
use RuntimeException;

#[\PHPUnit\Framework\Attributes\Group('manual-proof')]
final class StudentAchievementEvidenceReplacementTest extends CIUnitTestCase
{
    public static function setUpBeforeClass(): void
    {
        \Tests\Support\ManualProofGate::requireOptIn(false);
        parent::setUpBeforeClass();
    }

    protected $db;
    private array $students;
    private LocalEvidenceStorageService $storage;
    private array $paths = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->db = db_connect('local_defense');
        $config = new \Config\Database(); $config->default = $config->local_defense; $config->defaultGroup = 'local_defense';
        \CodeIgniter\Config\Factories::injectMock('config', 'Database', $config);
        $this->students = $this->db->table('profiles')->select('id')->where('account_type', 'student')->where('status', 'active')->get(2)->getResultArray();
        self::assertCount(2, $this->students);
        $this->storage = new LocalEvidenceStorageService();
        // Isolate each fixture transaction even if a preceding feature fixture
        // deliberately exercises a denied transition.
        $this->db->transStrict(false);
        $this->db->transBegin();
    }

    protected function tearDown(): void
    {
        foreach ($this->paths as $path) $this->storage->deletePhysicalFile($path);
        $this->db->transRollback();
        parent::tearDown();
    }

    public function testNonEditableCanonicalVersionRejectsReplacementDetachment(): void
    {
        [$service, $draft] = $this->draft();
        $old = $this->attach($draft, 'submitted.jpg');
        $this->db->table('achievement_record_versions')->where('id', $draft['version']['id'])->update(['contract_code' => 'S01-SSG', 'submission_state' => 'submitted']);
        try {
            $service->detachEvidence($this->students[0]['id'], $draft['achievement_record_id'], $old['id']);
            self::fail('Submitted records must not allow replacement.');
        } catch (RuntimeException $e) {
            self::assertSame('STUDENT_ACHIEVEMENT_VERSION_NOT_EDITABLE', $e->getMessage());
        }
        self::assertSame(1, $this->db->table('achievement_version_evidence')->where('record_version_id', $draft['version']['id'])->where('evidence_id', $old['id'])->countAllResults());
    }

    public function testDraftReplacementKeepsOldEvidenceRecoverableAndLeavesOneAttachment(): void
    {
        [$service, $draft] = $this->draft();
        $old = $this->attach($draft, 'old-certificate.jpg');
        $before = $this->snapshot($draft, $old['id']);
        $new = $this->attach($draft, 'replacement-certificate.jpg');

        $service->detachEvidence($this->students[0]['id'], $draft['achievement_record_id'], $old['id']);

        self::assertSame(1, $this->db->table('achievement_version_evidence')->where('record_version_id', $draft['version']['id'])->countAllResults());
        self::assertSame($new['id'], $this->db->table('achievement_version_evidence')->where('record_version_id', $draft['version']['id'])->get()->getRowArray()['evidence_id']);
        self::assertNotNull($this->db->table('achievement_evidence')->where('id', $old['id'])->get()->getRowArray());
        self::assertFileExists($old['path']);
        self::assertSame($before, $this->snapshot($draft, $old['id']));
    }

    public function testRevisionRequestedReplacementIsAllowedButOtherStudentsCannotDetach(): void
    {
        [$service, $draft] = $this->draft();
        $old = $this->attach($draft, 'revision-old.jpg');
        $this->db->table('achievement_record_versions')->where('id', $draft['version']['id'])->update(['submission_state' => 'revision_requested']);

        try {
            $service->detachEvidence($this->students[1]['id'], $draft['achievement_record_id'], $old['id']);
            self::fail('The other student must not access this attachment.');
        } catch (RuntimeException $e) {
            self::assertSame('STUDENT_ACHIEVEMENT_NOT_FOUND', $e->getMessage());
        }

        $service->detachEvidence($this->students[0]['id'], $draft['achievement_record_id'], $old['id']);
        self::assertSame(0, $this->db->table('achievement_version_evidence')->where('record_version_id', $draft['version']['id'])->where('evidence_id', $old['id'])->countAllResults());
        self::assertNotNull($this->db->table('achievement_evidence')->where('id', $old['id'])->get()->getRowArray());
    }

    private function draft(): array
    {
        $service = new CanonicalStudentAchievementDraftService($this->db);
        return [$service, $service->create($this->students[0]['id'])];
    }

    private function attach(array $draft, string $filename): array
    {
        $source = dirname(__DIR__, 2) . '/writable/ocr-audit/dataset/P01_clean_academic_certificate.jpg';
        $stored = $this->storage->storeFile($source, 'student', $this->students[0]['id'], $draft['achievement_record_id'], 'jpg');
        $this->paths[] = $stored['storage_path'];
        $id = $this->uuid();
        $this->db->table('achievement_evidence')->insert(['id' => $id, 'storage_path' => $stored['storage_path'], 'original_filename' => $filename, 'mime_type' => 'image/jpeg', 'detected_mime_type' => 'image/jpeg', 'byte_size' => $stored['byte_size'], 'sha256' => $stored['sha256'], 'uploaded_by' => $this->students[0]['id'], 'security_status' => 'clean', 'malware_scanner' => 'fixture', 'status' => 'active']);
        $this->db->table('achievement_version_evidence')->insert(['record_version_id' => $draft['version']['id'], 'evidence_id' => $id, 'association_type' => 'student_supporting_evidence', 'is_primary' => 1, 'attached_by' => $this->students[0]['id']]);
        return ['id' => $id, 'path' => $this->storage->resolveAbsolutePath($stored['storage_path'])];
    }

    private function snapshot(array $draft, string $oldEvidence): array
    {
        return [
            'record' => $this->db->table('achievement_records')->where('id', $draft['achievement_record_id'])->get()->getRowArray(),
            'version' => $this->db->table('achievement_record_versions')->where('id', $draft['version']['id'])->get()->getRowArray(),
            'old_evidence' => $this->db->table('achievement_evidence')->where('id', $oldEvidence)->get()->getRowArray(),
            'routes' => $this->db->table('student_achievement_verification_routes')->where('record_version_id', $draft['version']['id'])->get()->getResultArray(),
            'events' => $this->db->table('achievement_verification_events')->where('record_version_id', $draft['version']['id'])->get()->getResultArray(),
            'processing' => $this->db->table('document_processing_runs')->where('target_record_version_id', $draft['version']['id'])->get()->getResultArray(),
            'proposals' => $this->db->table('machine_field_proposals')->where('source_evidence_id', $oldEvidence)->get()->getResultArray(),
        ];
    }

    private function uuid(): string
    {
        return sprintf('%s-%s-%s-%s-%s', bin2hex(random_bytes(4)), bin2hex(random_bytes(2)), bin2hex(random_bytes(2)), bin2hex(random_bytes(2)), bin2hex(random_bytes(6)));
    }
}
