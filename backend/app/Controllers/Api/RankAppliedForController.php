<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
use App\Services\RankAppliedForService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use InvalidArgumentException;
use Throwable;

class RankAppliedForController extends Controller
{
    use ResponseTrait;
    public function __construct(private ?AuthorizationService $authz=null,private ?RankAppliedForService $service=null){$this->authz??=new AuthorizationService();$this->service??=new RankAppliedForService();}
    public function options():mixed{return$this->respond(null,204);}
    public function suggest(string $personnelId):mixed{$a=$this->actor();if(!$a)return$this->respond(['error'=>['code'=>'UNAUTHORIZED','message'=>'Authentication required.']],401);$j=(array)($this->request->getJSON(true)??[]);try{return$this->respondCreated(['data'=>$this->service->suggest($a,$personnelId,trim((string)($j['ranking_cycle_id']??'')),trim((string)($j['ranking_track_id']??'')))]);}catch(Throwable $e){return$this->error($e);}}
    public function confirm(string $decisionId):mixed{$a=$this->actor();if(!$a)return$this->respond(['error'=>['code'=>'UNAUTHORIZED','message'=>'Authentication required.']],401);$j=(array)($this->request->getJSON(true)??[]);try{return$this->respond(['data'=>$this->service->confirm($a,$decisionId,(string)($j['rank_code']??''),$j['justification']??null)]);}catch(Throwable $e){return$this->error($e);}}
    private function actor():?array{return$this->authz->resolveActor($this->request->getHeaderLine('Authorization'));}
    private function error(Throwable $e):mixed{return$this->respond(['error'=>['code'=>$e->getMessage(),'message'=>'Rank Applied For action could not be completed.']],$e instanceof InvalidArgumentException?422:409);}
}
