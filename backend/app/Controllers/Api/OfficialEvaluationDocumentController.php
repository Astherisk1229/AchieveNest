<?php
namespace App\Controllers\Api;
use App\Services\AuthorizationService;use App\Services\OfficialEvaluationDocumentService;use CodeIgniter\API\ResponseTrait;use CodeIgniter\Controller;use InvalidArgumentException;use Throwable;
class OfficialEvaluationDocumentController extends Controller
{
 use ResponseTrait;
 public function __construct(private ?AuthorizationService $authz=null,private ?OfficialEvaluationDocumentService $service=null){$this->authz??=new AuthorizationService();$this->service??=new OfficialEvaluationDocumentService();}
 public function options():mixed{return$this->respond(null,204);}
 public function generate(string $id):mixed{$a=$this->actor();if(!$a)return$this->unauthorized();try{return$this->respondCreated(['data'=>$this->service->generate($a,$id)]);}catch(Throwable $e){return$this->error($e);}}
 public function show(string $id):mixed{$a=$this->actor();if(!$a)return$this->unauthorized();try{return$this->respond(['data'=>$this->service->get($a,$id)]);}catch(Throwable $e){return$this->error($e);}}
 public function download(string $id):mixed{$a=$this->actor();if(!$a)return$this->unauthorized();try{return$this->response->setHeader('Content-Type','text/html; charset=UTF-8')->setHeader('Content-Disposition','inline; filename="official-evaluation-'.$id.'.html"')->setBody($this->service->printableHtml($a,$id));}catch(Throwable $e){return$this->error($e);}}
 private function actor():?array{return$this->authz->resolveActor($this->request->getHeaderLine('Authorization'));}private function unauthorized():mixed{return$this->respond(['error'=>['code'=>'UNAUTHORIZED','message'=>'Authentication required.']],401);}private function error(Throwable $e):mixed{$status=$e->getMessage()==='OFFICIAL_PRINT_ACCESS_DENIED'?403:($e instanceof InvalidArgumentException?422:409);return$this->respond(['error'=>['code'=>$e->getMessage(),'message'=>'Official evaluation document action could not be completed.']],$status);}
}
