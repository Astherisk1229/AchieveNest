<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use RuntimeException;

class AuditJmorteIdentity extends BaseCommand
{
    protected $group='Verification'; protected $name='audit:jmorte-identity'; protected $description='Read-only exact-identity and dependency audit for reported jmorte records.';
    public function run(array $params){$db=db_connect();if($db->DBDriver!=='MySQLi')throw new RuntimeException('This audit targets canonical MySQL.');$profiles=$db->table('profiles p')->select('p.*,pp.personnel_group,pp.organizational_side,pp.personnel_classification,pp.position_title,c.name AS college_name,ap.name AS program_name')->join('personnel_profiles pp','pp.profile_id=p.id','left')->join('personnel_college_affiliations pca','pca.personnel_profile_id=p.id AND pca.is_active=1','left')->join('colleges c','c.id=pca.college_id','left')->join('personnel_program_affiliations ppa','ppa.personnel_profile_id=p.id AND ppa.is_active=1','left')->join('academic_programs ap','ap.id=ppa.academic_program_id','left')->groupStart()->whereIn('p.institutional_id',['20239948','2023234r4355'])->orWhere('p.full_name','Jessa Mae Morte')->groupEnd()->get()->getResultArray();foreach($profiles as $p){$deps=[];foreach($db->listTables() as $table){foreach($db->getFieldNames($table) as $field){if(in_array($field,['profile_id','personnel_profile_id','student_profile_id','user_id','account_id','uploaded_by','created_by','performed_by','actor_profile_id','recipient_profile_id'],true)){$count=$db->table($table)->where($field,$p['id'])->countAllResults();if($count)$deps[]=$table.'.'.$field.'='.$count;}}}CLI::write(json_encode(['id'=>$p['id'],'institutional_id'=>$p['institutional_id'],'email'=>$p['email']??null,'name'=>$p['full_name'],'status'=>$p['status'],'created_at'=>$p['created_at']??null,'personnel_group'=>$p['personnel_group'],'organizational_side'=>$p['organizational_side'],'classification'=>$p['personnel_classification'],'position'=>$p['position_title'],'college'=>$p['college_name'],'program'=>$p['program_name'],'dependencies'=>$deps],JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT));}CLI::write('RECORD_COUNT='.count($profiles));}
}
