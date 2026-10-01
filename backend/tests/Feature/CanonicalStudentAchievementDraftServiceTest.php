<?php
declare(strict_types=1);
namespace Tests\Feature;
use App\Services\CanonicalStudentAchievementDraftService;
use App\Services\LocalEvidenceStorageService;
use CodeIgniter\Test\CIUnitTestCase;

#[\PHPUnit\Framework\Attributes\Group('manual-proof')]
final class CanonicalStudentAchievementDraftServiceTest extends CIUnitTestCase
{
    public static function setUpBeforeClass(): void
    {
        \Tests\Support\ManualProofGate::requireOptIn(false);
        parent::setUpBeforeClass();
    }

    protected $db; private string $student;
    protected function setUp(): void { parent::setUp(); $this->db=db_connect('local_defense'); $config=new \Config\Database();$config->default=$config->local_defense;$config->defaultGroup='local_defense';\CodeIgniter\Config\Factories::injectMock('config','Database',$config);$row=$this->db->table('profiles')->select('id')->where('account_type','student')->where('status','active')->get(1)->getRowArray();self::assertNotNull($row);$this->student=$row['id'];$this->db->transBegin(); }
    protected function tearDown(): void { $this->db->transRollback(); parent::tearDown(); }
    public function testCreatesUnclassifiedDraftAndPersistsPartialTrustedFields(): void
    {
        $service=new CanonicalStudentAchievementDraftService($this->db);$draft=$service->create($this->student);
        self::assertSame('draft',$draft['version']['submission_state']);self::assertNull($draft['version']['contract_code']);
        $saved=$service->save($this->student,$draft['achievement_record_id'],'S01-SSG',['governing_body_name'=>'Student Government']);
        self::assertSame('S01-SSG',$saved['version']['contract_code']);self::assertSame('Student Government',$saved['draft_fields']['governing_body_name']);
        self::assertSame(1,$this->db->table('achievement_version_draft_fields')->where('record_version_id',$saved['version']['id'])->countAllResults());
    }
    public function testRefusesFieldsBeforeTrustedContract(): void
    {
        $service=new CanonicalStudentAchievementDraftService($this->db);$draft=$service->create($this->student);
        $this->expectException(\RuntimeException::class);$this->expectExceptionMessage('STUDENT_ACHIEVEMENT_CONTRACT_REQUIRED_FOR_FIELDS');
        $service->save($this->student,$draft['achievement_record_id'],null,['governing_body_name'=>'x']);
    }

    public function testSubmitMaterializesTypedDetailAndUsesCanonicalRouting(): void
    {
        $service=new CanonicalStudentAchievementDraftService($this->db);$draft=$service->create($this->student);
        $saved=$service->save($this->student,$draft['achievement_record_id'],'S01-SSG',['governing_body_name'=>'Student Government','position_held'=>'Secretary','academic_year_start'=>2026]);
        $storage=new LocalEvidenceStorageService();$source=dirname(__DIR__,2).'/writable/ocr-audit/dataset/P01_clean_academic_certificate.jpg';self::assertFileExists($source);$stored=$storage->storeFile($source,'student',$this->student,$draft['achievement_record_id'],'jpg');
        try {$e=$this->uuid();$this->db->table('achievement_evidence')->insert(['id'=>$e,'storage_path'=>$stored['storage_path'],'original_filename'=>'evidence.jpg','mime_type'=>'image/jpeg','detected_mime_type'=>'image/jpeg','byte_size'=>$stored['byte_size'],'sha256'=>$stored['sha256'],'uploaded_by'=>$this->student,'security_status'=>'clean','malware_scanner'=>'fixture','security_validated_at'=>date('Y-m-d H:i:s'),'status'=>'active']);$this->db->table('achievement_version_evidence')->insert(['record_version_id'=>$saved['version']['id'],'evidence_id'=>$e,'association_type'=>'PRIMARY_EVIDENCE','is_primary'=>1,'attached_by'=>$this->student]);$result=$service->submit($this->student,$draft['achievement_record_id']);self::assertContains($result['routing_status'],['routed','routing_pending']);self::assertSame(1,$this->db->table('student_leadership_position_details')->where('record_version_id',$saved['version']['id'])->countAllResults());self::assertSame(1,$this->db->table('student_achievement_verification_routes')->where('record_version_id',$saved['version']['id'])->countAllResults());} finally {$storage->deletePhysicalFile($stored['storage_path']);}
    }
    private function uuid():string{return sprintf('%s-%s-%s-%s-%s',bin2hex(random_bytes(4)),bin2hex(random_bytes(2)),bin2hex(random_bytes(2)),bin2hex(random_bytes(2)),bin2hex(random_bytes(6)));}
}
