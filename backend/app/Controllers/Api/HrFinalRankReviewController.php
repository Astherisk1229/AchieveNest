<?php
namespace App\Controllers\Api;
use App\Services\AuthorizationService;
use App\Services\HrFinalRankReviewService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use InvalidArgumentException;
use Throwable;
class HrFinalRankReviewController extends Controller
{
 use ResponseTrait;
 public function __construct(private ?AuthorizationService $authz=null,private ?HrFinalRankReviewService $service=null){$this->authz??=new AuthorizationService();$this->service??=new HrFinalRankReviewService();}
 public function options():mixed{return$this->respond(null,204);}
 public function finalize(string $id):mixed{$a=$this->actor();if(!$a)return$this->unauthorized();$j=$this->json();try{return$this->respond(['data'=>$this->service->finalize($a,$id,(string)($j['rank_code']??''),$j['justification']??null)]);}catch(Throwable $e){return$this->error($e);}}
 public function returnForReconsideration(string $id):mixed{$a=$this->actor();if(!$a)return$this->unauthorized();$j=$this->json();try{return$this->respond(['data'=>$this->service->returnForReconsideration($a,$id,(string)($j['reason']??''))]);}catch(Throwable $e){return$this->error($e);}}
 public function beginReconsideration(string $id):mixed{$a=$this->actor();if(!$a)return$this->unauthorized();try{return$this->respondCreated(['data'=>$this->service->beginReconsideration($a,$id)]);}catch(Throwable $e){return$this->error($e);}}
 private function actor():?array{return$this->authz->resolveActor($this->request->getHeaderLine('Authorization'));}private function json():array{return(array)($this->request->getJSON(true)??[]);}private function unauthorized():mixed{return$this->respond(['error'=>['code'=>'UNAUTHORIZED','message'=>'Authentication required.']],401);}private function error(Throwable $e):mixed{return$this->respond(['error'=>['code'=>$e->getMessage(),'message'=>'HR final-rank review action could not be completed.']],$e instanceof InvalidArgumentException?422:409);}
}
