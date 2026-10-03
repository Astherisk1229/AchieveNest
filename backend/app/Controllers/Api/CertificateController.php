<?php

namespace App\Controllers\Api;

use App\Services\AuthenticatedActorService;
use App\Services\CertificateDataResolver;
use App\Services\CertificateEligibilityService;
use App\Services\CertificateIssuanceReadinessService;
use App\Services\CertificateIssuanceService;
use App\Services\CertificatePdfRendererService;
use App\Services\CertificateSignatoryResolverService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use CodeIgniter\Database\BaseConnection;
use Throwable;

final class CertificateController extends Controller
{
    use ResponseTrait;

    public function __construct(
        private ?AuthenticatedActorService $actors = null,
        private ?CertificateIssuanceService $issuance = null,
        private ?CertificatePdfRendererService $pdfRenderer = null,
        private ?BaseConnection $db = null
    ) {
        $this->db ??= \Config\Database::connect('default');
        $this->actors ??= new AuthenticatedActorService();
        $this->issuance ??= new CertificateIssuanceService(db: $this->db);
        $this->pdfRenderer ??= new CertificatePdfRendererService(db: $this->db);
    }

    public function options(): mixed { return $this->respond(null,204); }

    public function templates(): mixed
    {
        $actor=$this->actor();if(!$actor)return $this->unauthorized();
        $purpose=strtoupper(trim((string)$this->request->getGet('purpose')));$db=$this->db;
        $builder=$db->table('certificate_template_families ctf')
            ->select('ctf.*,ctv.id template_version_id,ctv.version_number,ctv.layout_config,ctv.signatories_config,ctv.placeholder_contract_json,ctv.signatory_slots_json')
            ->join('certificate_template_versions ctv','ctv.family_id=ctf.id')->where('ctf.status','active')->where('ctv.status','active');
        if($purpose!=='')$builder->where('ctf.certificate_purpose',$purpose);
        return $this->respond(['data'=>array_map(fn($row)=>$this->decodeTemplate($row),$builder->orderBy('ctf.is_default','DESC')->orderBy('ctv.version_number','DESC')->get()->getResultArray())]);
    }

    public function readiness(): mixed
    {
        $actor=$this->actor();if(!$actor)return $this->unauthorized();$payload=$this->request->getJSON(true)?:[];
        $context=$this->context($payload);if(isset($context['error']))return $this->respond(['error'=>$context['error']],$context['status']);
        return $this->respond(['data'=>$context['readiness']]);
    }

    public function issue(): mixed
    {
        $actor=$this->actor();if(!$actor)return $this->unauthorized();
        if(!$this->canIssue($actor))return $this->respond(['error'=>['code'=>'FORBIDDEN','message'=>'Certificate issuance requires OSAD staff or an organization moderator assignment.']],403);
        try{$result=$this->issuance->issue($actor,$this->request->getJSON(true)?:[]);$status=$result['issued']?201:(($result['status']??'')==='ALREADY_ISSUED'?200:422);return $this->respond(['data'=>$result],$status);}
        catch(Throwable $e){$code=$e->getMessage();$status=match(true){$code==='SOURCE_RECORD_NOT_FOUND'=>404,$code==='UNAUTHORIZED_CERTIFICATE_ISSUANCE'=>403,str_starts_with($code,'IDEMPOTENCY_')=>409,default=>422};return $this->respond(['error'=>['code'=>$code,'message'=>$this->errorMessage($code)]],$status);}
    }

    public function verify(string $publicId): mixed
    {
        $certificate=$this->issuance->verify($publicId);
        if($certificate===null)return $this->respond(['error'=>['code'=>'CERTIFICATE_NOT_FOUND','message'=>'No certificate matches this verification ID.']],404);
        return $this->respond(['data'=>$certificate]);
    }

    public function revoke(string $certificateId): mixed
    {
        $actor = $this->actor();
        if (!$actor) return $this->unauthorized();
        if (!in_array('osad_staff', $actor['roles'] ?? [], true)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Certificate revocation requires OSAD staff role.']], 403);
        }
        try {
            $result = $this->issuance->revoke($actor, $certificateId, $this->request->getJSON(true) ?: []);
            return $this->respond(['data' => $result], 200);
        } catch (Throwable $e) {
            $code = $e->getMessage();
            $status = match (true) {
                $code === 'CERTIFICATE_NOT_FOUND' => 404,
                $code === 'FORBIDDEN' || $code === 'UNAUTHORIZED_REVOCATION' => 403,
                str_starts_with($code, 'IDEMPOTENCY_KEY_REUSED') || str_starts_with($code, 'IDEMPOTENCY_REQUEST_IN_PROGRESS') || in_array($code, ['CERTIFICATE_ALREADY_REVOKED', 'CERTIFICATE_ALREADY_SUPERSEDED', 'CERTIFICATE_NOT_IN_ISSUABLE_STATE'], true) => 409,
                default => 422
            };
            return $this->respond(['error' => ['code' => $code, 'message' => $this->errorMessage($code)]], $status);
        }
    }

    public function reissue(string $certificateId): mixed
    {
        $actor = $this->actor();
        if (!$actor) return $this->unauthorized();
        if (!in_array('osad_staff', $actor['roles'] ?? [], true)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Certificate reissue requires OSAD staff role.']], 403);
        }
        try {
            $result = $this->issuance->reissue($actor, $certificateId, $this->request->getJSON(true) ?: []);
            return $this->respond(['data' => $result], 200);
        } catch (Throwable $e) {
            $code = $e->getMessage();
            $status = match (true) {
                $code === 'CERTIFICATE_NOT_FOUND' => 404,
                $code === 'FORBIDDEN' || $code === 'UNAUTHORIZED_REISSUE' => 403,
                str_starts_with($code, 'IDEMPOTENCY_KEY_REUSED') || str_starts_with($code, 'IDEMPOTENCY_REQUEST_IN_PROGRESS') || in_array($code, ['CERTIFICATE_REVOKED', 'CERTIFICATE_ALREADY_SUPERSEDED', 'CERTIFICATE_NOT_IN_ISSUABLE_STATE'], true) => 409,
                default => 422
            };
            return $this->respond(['error' => ['code' => $code, 'message' => $this->errorMessage($code)]], $status);
        }
    }

    public function pdf(string $certificateId): mixed
    {
        $actor = $this->actor();
        if (!$actor) return $this->unauthorized();

        $db = $this->db;
        $issuance = $db->table('certificate_issuances')->where('id', $certificateId)->get()->getRowArray();
        if (!$issuance) {
            return $this->respond(['error' => ['code' => 'CERTIFICATE_NOT_FOUND', 'message' => 'The target certificate was not found.']], 404);
        }

        if (!$this->canDownload($actor, $issuance)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'You are not authorized to download this certificate.']], 403);
        }

        if ($issuance['status'] === 'REVOKED') {
            return $this->respond(['error' => ['code' => 'CERTIFICATE_REVOKED', 'message' => 'This certificate has been revoked.']], 409);
        }
        if ($issuance['status'] === 'SUPERSEDED') {
            $replacementPublicId = null;
            if (!empty($issuance['superseded_by_certificate_id'])) {
                $rep = $db->table('certificate_issuances')->select('public_verification_id')->where('id', $issuance['superseded_by_certificate_id'])->get()->getRowArray();
                $replacementPublicId = $rep['public_verification_id'] ?? null;
            }
            return $this->respond([
                'error' => [
                    'code' => 'CERTIFICATE_SUPERSEDED',
                    'message' => 'This certificate has been superseded.',
                    'replacement_available' => !empty($replacementPublicId),
                    'replacement_public_verification_id' => $replacementPublicId,
                    'replacement_url' => $replacementPublicId ? '/verify/certificate/' . $replacementPublicId : null,
                ]
            ], 409);
        }
        if ($issuance['status'] !== 'ISSUED') {
            return $this->respond(['error' => ['code' => 'CERTIFICATE_NOT_IN_ISSUABLE_STATE', 'message' => 'The certificate is not in an active issued state.']], 409);
        }

        try {
            $pdfBinary = $this->pdfRenderer->render($certificateId);
            $safeNumber = preg_replace('/[^A-Za-z0-9_\-]/', '', (string)$issuance['certificate_number']) ?: 'certificate';
            $filename = 'AchieveNest-Certificate-' . $safeNumber . '.pdf';

            return $this->response
                ->setHeader('Content-Type', 'application/pdf')
                ->setHeader('Content-Disposition', 'attachment; filename="' . $filename . '"')
                ->setHeader('Cache-Control', 'private, no-store')
                ->setBody($pdfBinary);
        } catch (Throwable $e) {
            $code = $e->getMessage();
            $status = match (true) {
                $code === 'CERTIFICATE_NOT_FOUND' => 404,
                $code === 'CERTIFICATE_REVOKED' || $code === 'CERTIFICATE_SUPERSEDED' => 409,
                default => 500,
            };
            return $this->respond(['error' => ['code' => $code, 'message' => $e->getMessage()]], $status);
        }
    }

    private function context(array $payload): array
    {
        $db = $this->db;
        $source=$db->table('student_portfolio_records spr')->select('spr.*,pc.code category_code,pc.name category_name,ps.code subcategory_code')->join('portfolio_categories pc','pc.id=spr.category_id')->join('portfolio_subcategories ps','ps.id=spr.subcategory_id','left')->where('spr.id',$payload['source_record_id']??'')->get()->getRowArray();
        if(!$source)return ['error'=>['code'=>'SOURCE_RECORD_NOT_FOUND','message'=>'The source record was not found.'],'status'=>404];
        $student=$db->table('profiles')->where('id',$source['student_profile_id'])->get()->getRowArray();
        $eligibility=(new CertificateEligibilityService())->resolve($source+['structured_attributes'=>json_decode($source['structured_metadata']??'{}',true)?:[]]);
        $template=$db->table('certificate_template_versions ctv')->select('ctv.*,ctf.certificate_purpose,ctf.id template_family_id')->join('certificate_template_families ctf','ctf.id=ctv.family_id')->where('ctv.id',$payload['template_version_id']??'')->where('ctv.status','active')->where('ctf.status','active')->get()->getRowArray();
        if($template)$template=$this->decodeTemplate($template);
        $data=(new CertificateDataResolver())->resolve($source,$student?:[],(string)($eligibility['eligible_purpose']??''),['name'=>'Notre Dame of Marbel University / OSAD']);
        $current=$eligibility['eligible_purpose']&&$db->tableExists('certificate_issuances')?$db->table('certificate_issuances')->where(['student_id'=>$source['student_profile_id'],'source_record_id'=>$source['id'],'certificate_purpose'=>$eligibility['eligible_purpose'],'status'=>'ISSUED'])->get()->getRowArray():null;
        $resolved=$template?(new CertificateSignatoryResolverService())->resolve($db,$template,(array)($payload['signatories']??[])):['signatories'=>[],'reason_codes'=>[]];
        $readiness=(new CertificateIssuanceReadinessService())->evaluate($eligibility,$template,$data,$resolved['signatories'],(bool)$current);
        $readiness['blocking_reasons']=array_values(array_unique([...$readiness['blocking_reasons'],...$resolved['reason_codes'],...(new \App\Services\EventSourceRecordBridgeService($db))->certificateAttendanceReasons($source)]));
        if($readiness['blocking_reasons']!==[]&&$eligibility['eligibility_status']==='ELIGIBLE')$readiness['status']='ELIGIBLE_NOT_ISSUABLE';
        if($current)$readiness['existing_certificate']=['id'=>$current['id'],'certificate_number'=>$current['certificate_number'],'public_verification_id'=>$current['public_verification_id'],'verification_url'=>'/verify/certificate/'.$current['public_verification_id'],'issued_at'=>$current['issued_at'],'status'=>$current['status']];
        return ['readiness'=>$readiness];
    }

    private function decodeTemplate(array $row): array { $row['placeholder_contract']=json_decode($row['placeholder_contract_json']??'[]',true)?:[];$row['signatory_slots']=json_decode($row['signatory_slots_json']??'[]',true)?:[];$row['status']='PUBLISHED';return $row; }
    private function actor(): ?array { return $this->actors->resolveActor($this->request->getHeaderLine('Authorization')); }
    private function canIssue(array $actor): bool { return in_array('osad_staff',$actor['roles']??[],true)||in_array('organization_moderator',$actor['roles']??[],true); }
    private function canDownload(array $actor, array $issuance): bool
    {
        $roles = $actor['roles'] ?? [];
        if (in_array('osad_staff', $roles, true)) {
            return true;
        }
        $actorProfileId = (string)($actor['profile']['id'] ?? '');
        if ($actorProfileId !== '' && $actorProfileId === (string)($issuance['student_id'] ?? '')) {
            return true;
        }
        if (in_array('organization_moderator', $roles, true)) {
            $db = $this->db;
            $source = $db->table('student_portfolio_records')->where('id', $issuance['source_record_id'])->get()->getRowArray();
            if ($source) {
                $meta = json_decode($source['structured_metadata'] ?? '{}', true) ?: [];
                $eventId = (string)($meta['origin_event_id'] ?? '');
                if ($eventId !== '') {
                    $event = $db->table('events')->select('organization_id')->where('id', $eventId)->get()->getRowArray();
                    if ($event && !empty($event['organization_id'])) {
                        return $db->table('organization_moderator_assignments')
                            ->where(['personnel_profile_id' => $actorProfileId, 'organization_id' => $event['organization_id'], 'is_active' => 1])
                            ->groupStart()->where('effective_until IS NULL', null, false)->orWhere('effective_until >=', date('Y-m-d'))->groupEnd()
                            ->where('effective_from <=', date('Y-m-d'))
                            ->countAllResults() > 0;
                    }
                }
            }
        }
        return false;
    }
    private function unauthorized(): mixed { return $this->respond(['error'=>['code'=>'UNAUTHORIZED','message'=>'Valid active authenticated session required.']],401); }
    private function errorMessage(string $code): string {
        return match($code){
            'UNAUTHORIZED_CERTIFICATE_ISSUANCE'=>'You are not authorized to issue this certificate for the source event.',
            'UNAUTHORIZED_REVOCATION'=>'Certificate revocation requires OSAD staff role.',
            'UNAUTHORIZED_REISSUE'=>'Certificate reissue requires OSAD staff role.',
            'CERTIFICATE_NOT_FOUND'=>'The target certificate was not found.',
            'CERTIFICATE_ALREADY_REVOKED'=>'This certificate has already been revoked.',
            'CERTIFICATE_ALREADY_SUPERSEDED'=>'This certificate has already been superseded.',
            'CERTIFICATE_REVOKED'=>'A revoked certificate cannot be directly reissued.',
            'CERTIFICATE_NOT_IN_ISSUABLE_STATE'=>'The certificate is not in an active issued state.',
            'REVOCATION_REASON_REQUIRED'=>'A valid revocation reason is required.',
            'REISSUE_REASON_REQUIRED'=>'A valid reissue reason is required.',
            'IDEMPOTENCY_KEY_REQUIRED'=>'An idempotency key is required.',
            'SOURCE_RECORD_NOT_FOUND'=>'The source record was not found.',
            'RECIPIENT_MUST_BE_STUDENT'=>'Certificate issuance is limited to student recipients.',
            'IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST'=>'This request key was already used for a different request.',
            'IDEMPOTENCY_REQUEST_IN_PROGRESS'=>'The original request is still being processed.',
            'CERTIFICATE_ISSUANCE_SCHEMA_MISSING'=>'Certificate issuance is not available because its database schema is missing.',
            default=>'The certificate operation could not be completed.'
        };
    }
}
