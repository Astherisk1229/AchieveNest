<?php

namespace App\Controllers\Api;

use App\Services\AuthenticatedActorService;
use App\Services\CertificateAssetService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

final class CertificateAssetController extends Controller
{
    use ResponseTrait;
    public function __construct(private ?AuthenticatedActorService $actors=null,private ?CertificateAssetService $assets=null){$this->actors??=new AuthenticatedActorService();$this->assets??=new CertificateAssetService();}
    public function options():mixed{return $this->respond(null,204);}
    public function index():mixed{if(!$actor=$this->authorized())return $this->forbiddenResponse();return $this->respond(['data'=>['assets'=>$this->assets->list($this->request->getGet())]]);}
    public function create():mixed
    {
        if(!$actor=$this->authorized())return $this->forbiddenResponse();
        try{$file=$this->request->getFile('file');if(!$file||!$file->isValid())return $this->respond(['error'=>['code'=>'ASSET_FILE_INVALID','message'=>'Choose a valid certificate asset file.']],422);
            $input=$this->request->getPost();$input['original_filename']=$file->getClientName();$asset=$this->assets->create($input,$file->getTempName(),(string)$actor['profile']['id']);return $this->respond(['data'=>$asset],201);
        }catch(Throwable $e){return $this->error($e);}
    }
    public function usage(string $id):mixed{if(!$this->authorized())return $this->forbiddenResponse();try{return $this->respond(['data'=>['usage'=>$this->assets->usage($id)]]);}catch(Throwable $e){return $this->error($e);}}
    public function archive(string $id):mixed{if(!$actor=$this->authorized())return $this->forbiddenResponse();try{return $this->respond(['data'=>$this->assets->archive($id,(string)$actor['profile']['id'])]);}catch(Throwable $e){return $this->error($e);}}
    public function content(string $versionId):mixed
    {
        if(!$this->authorized())return $this->forbiddenResponse();
        try{$row=$this->assets->versionForDelivery($versionId);return $this->response->download($row['absolute_path'],null)->setFileName('certificate-asset-'.$row['id'].'.'.pathinfo($row['storage_key'],PATHINFO_EXTENSION))->setHeader('Content-Type',$row['mime_type'])->setHeader('Cache-Control','private, max-age=31536000, immutable');}catch(Throwable $e){return $this->error($e);}
    }
    private function authorized():?array{$actor=$this->actors->resolveActor($this->request->getHeaderLine('Authorization'));return $actor&&in_array('osad_staff',$actor['roles']??[],true)?$actor:null;}
    private function forbiddenResponse():mixed{return $this->respond(['error'=>['code'=>'FORBIDDEN','message'=>'OSAD authorization is required to manage certificate assets.']],403);}
    private function error(Throwable $e):mixed{$raw=$e->getMessage();$code=str_contains($raw,':')?strstr($raw,':',true):$raw;$status=in_array($code,['ASSET_NOT_FOUND'],true)?404:(str_contains($code,'INVALID')||str_contains($code,'REQUIRED')||$code==='ASSET_DUPLICATE'?422:500);$message=match($code){'FONT_INVALID'=>'This font file is malformed or unsupported. Choose a valid TTF, OTF, or WOFF2 file.','FONT_LICENSE_ACKNOWLEDGEMENT_REQUIRED'=>'Confirm that NDMU is authorized to use this font.','ASSET_IMAGE_INVALID'=>'This image is malformed or unsupported. Choose a valid PNG or JPEG file.','ASSET_DUPLICATE'=>'This file already exists. Use the existing governed asset.','ASSET_FILE_SIZE_INVALID'=>'The asset exceeds the allowed size or is empty.',default=>$status===500?'The certificate asset operation could not be completed.':str_replace('_',' ',ucfirst(strtolower($code)))};return $this->respond(['error'=>['code'=>$code,'message'=>$message,'existing_asset_id'=>$code==='ASSET_DUPLICATE'?substr($raw,strlen($code)+1):null]],$status);}
}
