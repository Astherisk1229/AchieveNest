<?php
namespace App\Controllers\Api;
use App\Services\PublicOfficialEvaluationVerificationService;use CodeIgniter\API\ResponseTrait;use CodeIgniter\Controller;
class PublicOfficialEvaluationVerificationController extends Controller
{
 use ResponseTrait;
 public function __construct(private ?PublicOfficialEvaluationVerificationService $service=null){$this->service??=new PublicOfficialEvaluationVerificationService();}
 public function verify(string $reference):mixed{$data=$this->service->verify($reference);if(!$data)return$this->respond(['data'=>['verification_status'=>'Invalid / Not Found'],'error'=>['code'=>'OFFICIAL_EVALUATION_DOCUMENT_NOT_FOUND','message'=>'The supplied document reference is invalid or was not found.']],404);return$this->respond(['data'=>$data]);}
 public function options():mixed{return$this->respond(null,204);}
}
