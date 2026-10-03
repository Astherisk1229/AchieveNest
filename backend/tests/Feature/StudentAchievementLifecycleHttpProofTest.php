<?php
declare(strict_types=1);
namespace Tests\Feature;
use App\Services\LocalEvidenceStorageService;use App\Services\LocalTokenService;use CodeIgniter\Test\CIUnitTestCase;

/** @group http-proof Real WAMP proof for the canonical student lifecycle. */
#[\PHPUnit\Framework\Attributes\Group('manual-proof')]
final class StudentAchievementLifecycleHttpProofTest extends CIUnitTestCase
{
    public static function setUpBeforeClass(): void
    {
        \Tests\Support\ManualProofGate::requireOptIn(false);
        parent::setUpBeforeClass();
    }

    protected $db; private string $token=''; private ?array $draft=null; private ?string $evidenceId=null;
    protected function setUp():void{parent::setUp();$this->db=db_connect('local_defense');$c=new \Config\Database();$c->default=$c->local_defense;$c->defaultGroup='local_defense';\CodeIgniter\Config\Factories::injectMock('config','Database',$c);}
    protected function tearDown():void{$this->cleanup();parent::tearDown();}
    public function testRealAuthenticatedCanonicalLifecycle():void
    {
        $owner=$this->db->table('profiles p')->select('p.id')->join('local_auth_credentials c',"c.profile_id=p.id AND c.status='active' AND c.must_change_password=0")->where('p.account_type','student')->where('p.status','active')->get(1)->getRowArray();self::assertNotEmpty($owner);
        $this->token=(new LocalTokenService($this->db))->issueToken($owner['id'],false,'127.0.0.1','lifecycle-http-proof')['access_token'];
        $created=$this->json('POST','/api/v1/student/achievements/drafts',[]);self::assertSame(201,$created['status']);$this->draft=$created['body']['data'];self::assertNull($this->draft['version']['contract_code']);
        $record=$this->draft['achievement_record_id'];$sample=dirname(__DIR__,2).'/writable/ocr-audit/dataset/P01_clean_academic_certificate.jpg';self::assertFileExists($sample);
        $upload=$this->upload($record,$sample,'representative-proof.jpg','image/jpeg');self::assertSame(201,$upload['status'],json_encode($upload));$this->evidenceId=$upload['body']['data']['evidence_id'];self::assertSame('pending',$upload['body']['data']['security_status']);
        $pending=$this->db->table('achievement_evidence')->where('id',$this->evidenceId)->get()->getRowArray();self::assertSame('pending',$pending['security_status']);
        $scan=$this->json('POST','/api/v1/student/achievements/'.$record.'/evidence/'.$this->evidenceId.'/scan',[]);self::assertSame(200,$scan['status'],json_encode($scan));self::assertSame('clean',$scan['body']['data']['scan']['status']);self::assertSame('paddleocr',$scan['body']['data']['ocr']['engine']??null);self::assertTrue($scan['body']['data']['ocr']['advisory_only']??false);
        $afterScan=$this->db->table('achievement_evidence')->where('id',$this->evidenceId)->get()->getRowArray();self::assertSame('clean',$afterScan['security_status']);self::assertSame('clamav_1_5_4',$afterScan['malware_scanner']);
        self::assertSame(0,$this->db->table('document_processing_runs')->where('target_record_version_id',$this->draft['version']['id'])->countAllResults());self::assertSame(0,$this->db->table('machine_field_proposals')->where('source_evidence_id',$this->evidenceId)->countAllResults());
        $save=$this->json('PUT','/api/v1/student/achievements/'.$record,['contract_code'=>'S01-SSG','fields'=>['governing_body_name'=>'Student Government','position_held'=>'Secretary','academic_year_start'=>2026]]);self::assertSame(200,$save['status'],json_encode($save));
        $submit=$this->json('POST','/api/v1/student/achievements/'.$record.'/submit',[]);self::assertSame(200,$submit['status'],json_encode($submit));self::assertContains($submit['body']['data']['routing_status'],['routed','routing_pending']);
        self::assertSame(1,$this->db->table('student_leadership_position_details')->where('record_version_id',$this->draft['version']['id'])->countAllResults());self::assertSame(1,$this->db->table('student_achievement_verification_routes')->where('record_version_id',$this->draft['version']['id'])->countAllResults());
    }
    private function json(string $method,string $path,array $payload):array{$data=json_encode($payload);$ctx=stream_context_create(['http'=>['method'=>$method,'ignore_errors'=>true,'timeout'=>75,'header'=>['Authorization: Bearer '.$this->token,'Content-Type: application/json','Accept: application/json','Content-Length: '.strlen($data)],'content'=>$data]]);$raw=file_get_contents('http://127.0.0.1:8080'.$path,false,$ctx);return ['status'=>(int)preg_replace('/^.*\s(\d{3})\s.*$/','$1',$http_response_header[0]??'0'),'body'=>json_decode((string)$raw,true,512,JSON_THROW_ON_ERROR)];}
    private function upload(string $record,string $path,string $name,string $mime):array{$b='----AchieveNest'.bin2hex(random_bytes(8));$body="--$b\r\nContent-Disposition: form-data; name=\"file\"; filename=\"$name\"\r\nContent-Type: $mime\r\n\r\n".file_get_contents($path)."\r\n--$b--\r\n";$ctx=stream_context_create(['http'=>['method'=>'POST','ignore_errors'=>true,'timeout'=>75,'header'=>['Authorization: Bearer '.$this->token,'Accept: application/json','Content-Type: multipart/form-data; boundary='.$b,'Content-Length: '.strlen($body)],'content'=>$body]]);$raw=file_get_contents('http://127.0.0.1:8080/api/v1/student/achievements/'.$record.'/evidence',false,$ctx);return ['status'=>(int)preg_replace('/^.*\s(\d{3})\s.*$/','$1',$http_response_header[0]??'0'),'body'=>json_decode((string)$raw,true,512,JSON_THROW_ON_ERROR)];}
    private function cleanup():void{if($this->token!=='')$this->db->table('local_auth_sessions')->where('token_hash',hash('sha256',$this->token))->delete();if($this->draft===null)return;$v=$this->draft['version']['id'];$r=$this->draft['achievement_record_id'];$rows=$this->db->table('achievement_evidence')->select('id,storage_path')->join('achievement_version_evidence ave','ave.evidence_id=achievement_evidence.id')->where('ave.record_version_id',$v)->get()->getResultArray();$this->db->table('student_achievement_routing_events')->where('record_version_id',$v)->delete();$this->db->table('student_achievement_verification_routes')->where('record_version_id',$v)->delete();$this->db->table('student_leadership_position_details')->where('record_version_id',$v)->delete();$this->db->table('achievement_version_draft_fields')->where('record_version_id',$v)->delete();$this->db->table('achievement_version_evidence')->where('record_version_id',$v)->delete();foreach($rows as $row){$this->db->table('achievement_evidence')->where('id',$row['id'])->delete();(new LocalEvidenceStorageService())->deletePhysicalFile($row['storage_path']);}$this->db->table('achievement_records')->where('id',$r)->update(['current_version_id'=>null]);$this->db->table('achievement_record_versions')->where('id',$v)->delete();$this->db->table('achievement_records')->where('id',$r)->delete();}
}
