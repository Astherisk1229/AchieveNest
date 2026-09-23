<?php
namespace App\Controllers\Api;
use App\Services\AuthorizationService;
use App\Services\RecommendedRankService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use InvalidArgumentException;
use Throwable;
class RecommendedRankController extends Controller
{
 use ResponseTrait;
 public function __construct(private ?AuthorizationService $authz=null,private ?RecommendedRankService $service=null){$this->authz??=new AuthorizationService();$this->service??=new RecommendedRankService();}
 public function options():mixed{return$this->respond(null,204);}
 public function suggest(string $evaluationId):mixed{$a=$this->actor();if(!$a)return$this->respond(['error'=>['code'=>'UNAUTHORIZED','message'=>'Authentication required.']],401);try{return$this->respondCreated(['data'=>$this->service->suggest($a,$evaluationId)]);}catch(Throwable $e){return$this->error($e);}}
 public function confirm(string $decisionId):mixed{$a=$this->actor();if(!$a)return$this->respond(['error'=>['code'=>'UNAUTHORIZED','message'=>'Authentication required.']],401);$j=(array)($this->request->getJSON(true)??[]);try{return$this->respond(['data'=>$this->service->confirm($a,$decisionId,(string)($j['rank_code']??''),$j['justification']??null)]);}catch(Throwable $e){return$this->error($e);}}
 private function actor():?array{return$this->authz->resolveActor($this->request->getHeaderLine('Authorization'));}
 private function error(Throwable $e):mixed{return$this->respond(['error'=>['code'=>$e->getMessage(),'message'=>'Recommended Rank action could not be completed.']],$e instanceof InvalidArgumentException?422:409);}
}
