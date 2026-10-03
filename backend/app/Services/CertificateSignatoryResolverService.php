<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;

final class CertificateSignatoryResolverService
{
    public function resolve(BaseConnection $db, array $template, array $requested): array
    {
        $resolved=[]; $reasons=[]; $today=date('Y-m-d');
        foreach (($template['signatory_slots'] ?? []) as $slot) {
            $role=(string)($slot['role_code'] ?? '');
            $required=strtoupper((string)($slot['requirement_type'] ?? ''))==='REQUIRED';
            $selection=$requested[$role] ?? null;
            $personId=is_array($selection) ? (string)($selection['person_id'] ?? $selection['id'] ?? '') : (string)$selection;
            if ($personId==='') { if($required)$reasons[]='REQUIRED_SIGNATORY_UNAVAILABLE'; continue; }
            $authorization=$db->table('certificate_signatory_authorizations')->where(['person_id'=>$personId,'role_code'=>$role,'status'=>'ACTIVE'])->where('valid_from <=',$today)->groupStart()->where('valid_until IS NULL',null,false)->orWhere('valid_until >=',$today)->groupEnd()->get()->getRowArray();
            if(!$authorization){$reasons[]='SIGNATORY_NOT_AUTHORIZED';continue;}
            $asset=$db->table('certificate_signature_assets')->where(['person_id'=>$personId,'status'=>'APPROVED'])->groupStart()->where('valid_from IS NULL',null,false)->orWhere('valid_from <=',$today)->groupEnd()->groupStart()->where('valid_until IS NULL',null,false)->orWhere('valid_until >=',$today)->groupEnd()->get()->getRowArray();
            if(!$asset){$reasons[]='SIGNATURE_ASSET_UNAVAILABLE';continue;}
            $profile=$db->table('profiles')->select('id,full_name,designation_title')->where('id',$personId)->get()->getRowArray();
            $resolved[$role]=['role_code'=>$role,'person_id'=>$personId,'name'=>$profile['full_name']??null,'title'=>$profile['designation_title']??null,'authorization_id'=>$authorization['id'],'signature_asset_id'=>$asset['id'],'signature_storage_path'=>$asset['storage_path']];
        }
        return ['signatories'=>$resolved,'reason_codes'=>array_values(array_unique($reasons))];
    }
}
