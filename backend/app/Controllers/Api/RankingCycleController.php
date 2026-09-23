<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
use App\Services\RankingCycleService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

class RankingCycleController extends Controller
{
    use ResponseTrait;
    public function __construct(private ?AuthorizationService $authz=null, private ?RankingCycleService $cycles=null) { $this->authz ??= new AuthorizationService(); $this->cycles ??= new RankingCycleService(); }
    public function options(): mixed { return $this->respond(null, 204); }
    public function index(): mixed { if (($a=$this->hr()) instanceof \CodeIgniter\HTTP\ResponseInterface) return $a; return $this->respond(['data'=>['cycles'=>$this->cycles->list()]]); }
    public function show(string $id): mixed { if (($a=$this->hr()) instanceof \CodeIgniter\HTTP\ResponseInterface) return $a; return $this->run(fn()=>($cycle=$this->cycles->find($id)) ? $this->respond(['data'=>['cycle'=>$cycle]]) : $this->respond(['error'=>['code'=>'RANKING_CYCLE_NOT_FOUND','message'=>'Ranking cycle not found.']],404)); }
    public function create(): mixed { if (($a=$this->hr()) instanceof \CodeIgniter\HTTP\ResponseInterface) return $a; return $this->run(fn()=>$this->respondCreated(['data'=>['cycle'=>$this->cycles->create((array)($this->request->getJSON(true)??[]),$a['profile']['id'])]])); }
    public function update(string $id): mixed { if (($a=$this->hr()) instanceof \CodeIgniter\HTTP\ResponseInterface) return $a; return $this->run(fn()=>$this->respond(['data'=>['cycle'=>$this->cycles->update($id,(array)($this->request->getJSON(true)??[]),$a['profile']['id'])]])); }
    public function delete(string $id): mixed { if (($a=$this->hr()) instanceof \CodeIgniter\HTTP\ResponseInterface) return $a; return $this->run(function() use($id){$this->cycles->delete($id); return $this->respond(null,204);}); }
    private function hr(): array|\CodeIgniter\HTTP\ResponseInterface { $a=$this->authz->resolveActor($this->request->getHeaderLine('Authorization')); if(!$a)return $this->respond(['error'=>['code'=>'AUTH_TOKEN_INVALID','message'=>'Authentication is required.']],401); if(!$this->authz->hasRole($a,'hr_staff'))return $this->respond(['error'=>['code'=>'HR_ROLE_REQUIRED','message'=>'Only authorized HR staff may manage ranking cycles.']],403); return $a; }
    private function run(callable $op): mixed { try{return $op();}catch(InvalidArgumentException $e){return $this->error($e,422);}catch(RuntimeException $e){return $this->error($e,409);}catch(Throwable $e){log_message('error','Ranking cycle error: '.$e->getMessage());return $this->failServerError('Ranking cycle operation failed.');} }
    private function error(Throwable $e,int $status): mixed { [$code,$message]=array_pad(explode(':',$e->getMessage(),2),2,'Ranking cycle request failed.');return $this->respond(['error'=>['code'=>trim($code),'message'=>trim($message)]],$status); }
}
