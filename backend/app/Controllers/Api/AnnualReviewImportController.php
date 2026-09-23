<?php

namespace App\Controllers\Api;

use App\Services\AnnualReviewImportService;
use App\Services\AuthorizationService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;

class AnnualReviewImportController extends Controller
{
    use ResponseTrait;
    public function __construct(private ?AuthorizationService $authz=null,private ?AnnualReviewImportService $service=null){$this->authz??=new AuthorizationService();$this->service??=new AnnualReviewImportService();}
    public function options():mixed{return$this->respond(null,204);}
    private function actor():array|false{$actor=$this->authz->resolveActor($this->request->getHeaderLine('Authorization'));return$actor?:false;}
    public function preview():mixed{$actor=$this->actor();if(!$actor)return$this->respond(['error'=>['code'=>'UNAUTHORIZED','message'=>'Authentication required.']],401);$files=$this->request->getFileMultiple('files')?:[];$period=(string)$this->request->getPost('evaluation_period_id');$expected=trim((string)$this->request->getPost('expected_personnel_profile_id'))?:null;if(!$files)return$this->respond(['error'=>['code'=>'FILES_REQUIRED','message'=>'Select one or more XLSX workbooks.']],422);try{return$this->respond(['data'=>$this->service->preview($actor,$files,$period,$expected)]);}catch(\Throwable $e){return$this->error($e);}}
    public function confirm(string $id=''):mixed{$actor=$this->actor();if(!$actor)return$this->respond(['error'=>['code'=>'UNAUTHORIZED','message'=>'Authentication required.']],401);$body=(array)($this->request->getJSON(true)??[]);try{return$this->respond(['data'=>$this->service->confirm($actor,$id,$body['personnel_profile_id']??null,$body['correction_reason']??null)]);}catch(\Throwable $e){return$this->error($e);}}
    public function history(string $personId=''):mixed{$actor=$this->actor();if(!$actor)return$this->respond(['error'=>['code'=>'UNAUTHORIZED','message'=>'Authentication required.']],401);try{return$this->respond(['data'=>$this->service->history($actor,$personId,(string)$this->request->getGet('evaluation_period_id'))]);}catch(\Throwable $e){return$this->error($e);}}
    public function file(string $id=''):mixed{$actor=$this->actor();if(!$actor)return$this->respond(['error'=>['code'=>'UNAUTHORIZED','message'=>'Authentication required.']],401);try{$file=$this->service->file($actor,$id);return$this->response->download($file['path'],null)->setFileName($file['filename']);}catch(\Throwable $e){return$this->error($e);}}
    private function error(\Throwable $e):mixed{$code=strtok($e->getMessage(),':')?:'IMPORT_ERROR';$status=in_array($code,['DUPLICATE_UPLOAD','CORRECTION_REASON_REQUIRED','HR_REOPENING_REQUIRED','EVALUATION_PERIOD_LOCKED'],true)?409:(str_starts_with($code,'FORBIDDEN')?403:422);return$this->respond(['error'=>['code'=>$code,'message'=>$e->getMessage()]],$status);}
}
