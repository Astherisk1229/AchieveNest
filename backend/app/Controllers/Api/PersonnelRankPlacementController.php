<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
use App\Services\OrganizationalAuthorityResolver;
use App\Services\PersonnelRankPlacementService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

class PersonnelRankPlacementController extends Controller
{
    use ResponseTrait;
    public function __construct(private ?AuthorizationService $authz=null,private ?PersonnelRankPlacementService $placements=null,private ?OrganizationalAuthorityResolver $authority=null){$this->authz??=new AuthorizationService();$this->placements??=new PersonnelRankPlacementService();$this->authority??=new OrganizationalAuthorityResolver();}
    public function options():mixed{return$this->respond(null,204);}

    public function suggest(string $personnelId):mixed{return$this->hrAction(fn(array $a)=>$this->placements->suggest($personnelId,(string)$a['profile']['id']));}
    public function confirm(string $suggestionId):mixed{$j=$this->json();return$this->hrAction(fn(array $a)=>$this->placements->confirm($suggestionId,(string)$a['profile']['id'],trim((string)($j['effective_date']??''))));}
    public function retry(string $placementId):mixed{return$this->hrAction(fn(array $a)=>$this->placements->activateDue($placementId,(string)$a['profile']['id']));}
    public function cancel(string $placementId):mixed{$j=$this->json();return$this->hrAction(fn(array $a)=>$this->placements->cancel($placementId,(string)$a['profile']['id'],(string)($j['reason']??'')));}
    public function correct(string $placementId):mixed{$j=$this->json();return$this->hrAction(fn(array $a)=>$this->placements->correct($placementId,(string)$a['profile']['id'],(string)($j['reason']??''),(string)($j['effective_date']??'')));}

    public function hrHistory(string $personnelId):mixed{return$this->hrAction(fn()=> $this->placements->history($personnelId));}
    public function ownHistory():mixed{$a=$this->actor();if(!$a)return$this->unauthorized();$id=(string)($a['profile']['id']??'');if(!$this->authz->hasRole($a,'personnel')||$id==='')return$this->forbidden();return$this->respond(['data'=>$this->placements->history($id)]);}
    public function reviewerCurrent(string $personnelId):mixed
    {
        $a=$this->actor();if(!$a)return$this->unauthorized();$id=(string)($a['profile']['id']??'');
        if(!$this->authz->hasAnyRole($a,['dean','department_head']))return$this->forbidden();
        try{$resolved=$this->authority->resolveResponsibleAuthority($personnelId);if(!$this->authority->actorMayAct($resolved,$id))return$this->forbidden();return$this->respond(['data'=>$this->placements->history($personnelId,true)]);}catch(Throwable $e){return$this->error($e);}
    }

    private function hrAction(callable $action):mixed{$a=$this->actor();if(!$a)return$this->unauthorized();if(!$this->authz->hasRole($a,'hr_staff')&&!$this->authz->hasRole($a,'hr_admin'))return$this->forbidden();try{return$this->respond(['data'=>$action($a)]);}catch(Throwable $e){return$this->error($e);}}
    private function error(Throwable $e):mixed{$status=$e instanceof InvalidArgumentException?422:409;return$this->respond(['error'=>['code'=>$e->getMessage(),'message'=>'Rank placement action could not be completed.']],$status);}
    private function json():array{return(array)($this->request->getJSON(true)??[]);}
    private function actor():?array{return$this->authz->resolveActor($this->request->getHeaderLine('Authorization'));}
    private function unauthorized():mixed{return$this->respond(['error'=>['code'=>'UNAUTHORIZED','message'=>'Valid authenticated active session required.']],401);}
    private function forbidden():mixed{return$this->respond(['error'=>['code'=>'FORBIDDEN','message'=>'Rank placement access is not authorized.']],403);}
}
