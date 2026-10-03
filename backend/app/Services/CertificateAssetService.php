<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;
use Throwable;

final class CertificateAssetService
{
    public const TYPES=['BACKGROUND','BORDER_FRAME','LOGO','SEAL','WATERMARK','DECORATIVE_ELEMENT','FONT'];
    public function __construct(private ?BaseConnection $db=null, private ?CertificateAssetStorageService $storage=null, private ?CertificateIdentityService $identity=null)
    { $this->db??=db_connect(); $this->storage??=new CertificateAssetStorageService(); $this->identity??=new CertificateIdentityService(); }

    public function list(array $filters=[]): array
    {
        $builder=$this->db->table('certificate_assets a')->select('a.*,v.id asset_version_id,v.version_number,v.mime_type,v.file_size,v.checksum,v.metadata_json,v.renderer_compatible')->join('certificate_asset_versions v','v.asset_id=a.id')->where('v.version_number = (SELECT MAX(v2.version_number) FROM certificate_asset_versions v2 WHERE v2.asset_id=a.id)',null,false);
        if (!empty($filters['asset_type'])) $builder->where('a.asset_type',strtoupper((string)$filters['asset_type']));
        if (!empty($filters['status'])) $builder->where('a.status',strtoupper((string)$filters['status']));
        else $builder->where('a.status','ACTIVE');
        return array_map(fn($row)=>$this->present($row),$builder->orderBy('a.display_name')->get()->getResultArray());
    }

    public function create(array $input, string $path, string $actorId): array
    {
        $type=strtoupper(trim((string)($input['asset_type']??''))); $name=trim((string)($input['display_name']??''));
        if (!in_array($type,self::TYPES,true)||$name==='') throw new RuntimeException('ASSET_VALIDATION_FAILED');
        if ($type==='FONT' && empty($input['license_acknowledged'])) throw new RuntimeException('FONT_LICENSE_ACKNOWLEDGEMENT_REQUIRED');
        $validated=$this->storage->validate($path,$type); $duplicate=$this->db->table('certificate_asset_versions')->where('checksum',$validated['checksum'])->get()->getRowArray();
        if ($duplicate) throw new RuntimeException('ASSET_DUPLICATE:'.$duplicate['asset_id']);
        $assetId=$this->identity->uuid(); $versionId=$this->identity->uuid(); $now=date('Y-m-d H:i:s');
        $metadata=$validated['metadata']+['original_filename'=>basename((string)($input['original_filename']??'asset')),'license_note'=>trim((string)($input['license_note']??'')),'license_acknowledged'=>$type==='FONT'];
        $this->db->transBegin();
        try { $key=$this->storage->store($path,$assetId,$versionId,$validated['extension']);
            $this->must($this->db->table('certificate_assets')->insert(['id'=>$assetId,'asset_type'=>$type,'display_name'=>$name,'status'=>'ACTIVE','system_owned'=>0,'created_by'=>$actorId,'created_at'=>$now,'updated_at'=>$now]));
            $this->must($this->db->table('certificate_asset_versions')->insert(['id'=>$versionId,'asset_id'=>$assetId,'version_number'=>1,'mime_type'=>$validated['mime_type'],'file_size'=>$validated['file_size'],'storage_key'=>$key,'checksum'=>$validated['checksum'],'metadata_json'=>json_encode($metadata),'renderer_compatible'=>$type==='FONT'?0:1,'created_by'=>$actorId,'created_at'=>$now]));
            $this->audit($actorId,'CERTIFICATE_ASSET_CREATED',$assetId,['asset_version_id'=>$versionId,'asset_type'=>$type]); $this->commit(); return $this->get($assetId);
        } catch(Throwable $e){$this->db->transRollback();throw $e;}
    }

    public function get(string $id): array { $rows=$this->list(['status'=>'ACTIVE']); foreach($rows as $row) if($row['id']===$id)return $row; $row=$this->db->table('certificate_assets')->where('id',$id)->get()->getRowArray(); if(!$row)throw new RuntimeException('ASSET_NOT_FOUND'); return $row; }
    public function usage(string $id): array { return $this->db->table('certificate_template_asset_bindings b')->select('b.binding_role,tv.id template_version_id,tv.version_number,tv.status,tf.name template_name')->join('certificate_asset_versions av','av.id=b.asset_version_id')->join('certificate_template_versions tv','tv.id=b.template_version_id')->join('certificate_template_families tf','tf.id=tv.family_id')->where('av.asset_id',$id)->orderBy('tv.version_number','DESC')->get()->getResultArray(); }
    public function archive(string $id,string $actorId): array { if(!$this->db->table('certificate_assets')->where('id',$id)->countAllResults())throw new RuntimeException('ASSET_NOT_FOUND'); $this->must($this->db->table('certificate_assets')->where('id',$id)->update(['status'=>'ARCHIVED','archived_at'=>date('Y-m-d H:i:s'),'updated_at'=>date('Y-m-d H:i:s')])); $this->audit($actorId,'CERTIFICATE_ASSET_ARCHIVED',$id,['usage_count'=>count($this->usage($id))]); return ['id'=>$id,'status'=>'ARCHIVED']; }
    public function versionForDelivery(string $versionId): array { $row=$this->db->table('certificate_asset_versions v')->select('v.*,a.status,a.asset_type,a.display_name')->join('certificate_assets a','a.id=v.asset_id')->where('v.id',$versionId)->get()->getRowArray(); if(!$row)throw new RuntimeException('ASSET_NOT_FOUND'); $row['absolute_path']=$this->storage->resolve($row['storage_key']); return $row; }
    private function present(array $row): array { $row['metadata']=json_decode((string)($row['metadata_json']??'{}'),true)?:[]; unset($row['metadata_json']); $row['preview_url']='/api/certificate-asset-versions/'.$row['asset_version_id'].'/content'; $row['usage_count']=count($this->usage((string)$row['id'])); return $row; }
    private function audit(string $actor,string $code,string $target,array $context):void{$this->must($this->db->table('audit_logs')->insert(['id'=>$this->identity->uuid(),'actor_profile_id'=>$actor,'event_code'=>$code,'category'=>'certificate_asset_governance','target_type'=>'certificate_asset','target_id'=>$target,'outcome'=>'success','details'=>$code,'safe_context'=>json_encode($context),'created_at'=>date('Y-m-d H:i:s')]));}
    private function must(bool $ok):void{if(!$ok)throw new RuntimeException('ASSET_WRITE_FAILED');} private function commit():void{if($this->db->transStatus()===false)throw new RuntimeException('ASSET_TRANSACTION_FAILED');$this->db->transCommit();}
}
