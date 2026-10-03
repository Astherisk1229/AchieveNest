<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class SeedSourceDrivenRankingCriteria extends Migration
{
    public function up()
    {
        if (! $this->db->fieldExists('renderer_key', 'evaluation_scale_categories')) $this->forge->addColumn('evaluation_scale_categories', ['renderer_key'=>['type'=>'VARCHAR','constraint'=>64,'null'=>true,'after'=>'requires_manual_hr_rule']]);
        foreach (['source_title'=>['type'=>'VARCHAR','constraint'=>255,'null'=>true], 'source_reference'=>['type'=>'VARCHAR','constraint'=>255,'null'=>true], 'imported_at'=>['type'=>'DATETIME','null'=>true]] as $name=>$definition) if (! $this->db->fieldExists($name,'evaluation_scale_versions')) $this->forge->addColumn('evaluation_scale_versions',[$name=>$definition]);
        if (! $this->db->tableExists('evaluation_scale_criterion_options')) {
            $this->forge->addField([
                'id'=>['type'=>'VARCHAR','constraint'=>64], 'scale_category_id'=>['type'=>'VARCHAR','constraint'=>64],
                'option_group_code'=>['type'=>'VARCHAR','constraint'=>64], 'option_code'=>['type'=>'VARCHAR','constraint'=>64],
                'label'=>['type'=>'VARCHAR','constraint'=>255], 'points'=>['type'=>'DECIMAL','constraint'=>'8,2','null'=>true],
                'display_order'=>['type'=>'INT','default'=>1], 'source_ref'=>['type'=>'VARCHAR','constraint'=>255,'null'=>true],
                'created_at'=>['type'=>'DATETIME','null'=>true], 'updated_at'=>['type'=>'DATETIME','null'=>true],
            ]);
            $this->forge->addKey('id',true); $this->forge->addKey(['scale_category_id','option_group_code','option_code'],false,'idx_esco_category_group_code');
            $this->forge->createTable('evaluation_scale_criterion_options',true);
        }
        $now=date('Y-m-d H:i:s');
        $this->db->table('evaluation_scale_versions')->where('id','ver-admin-2025-001')->update(['source_title'=>'Administrators Ranking Scale - Faculty Intuitive Breakdown Tables','source_reference'=>'Official Administrators Ranking Scale, Faculty v1.0','imported_at'=>$now,'source_document_ref'=>'Administrators_Ranking_Scale_Faculty_Intuitive_Breakdown_Tables.docx']);
        $this->db->table('evaluation_scale_versions')->where('id','ver-ntp-2025-001')->update(['source_title'=>'Non-Teaching Personnel Ranking Scale - Intuitive Breakdown Tables','source_reference'=>'Official Non-Teaching Personnel Ranking Scale v1.0','imported_at'=>$now,'source_document_ref'=>'Non_Teaching_Personnel_Ranking_Scale_Intuitive_Breakdown_Tables.docx']);
        $this->seedFaculty($now); $this->seedNonTeaching($now);
    }

    private function seedFaculty(string $now): void
    {
        if ($this->used('ver-admin-2025-001')) return;
        $categories=[
            'cat-admin-a1'=>['DEGREES','LOOKUP',0], 'cat-admin-a2'=>['MEMBERSHIP','FIXED',0],
            'cat-admin-a3'=>['SEMINAR_LEVELS','LOOKUP',0], 'cat-admin-b1'=>['GUEST_LECTURER_MATRIX','DIMENSIONAL',0],
            'cat-admin-b2'=>['PUBLICATION_MATRIX','DIMENSIONAL',0], 'cat-admin-b3'=>['MANUAL_RESEARCH','MANUAL',1],
            'cat-admin-b4'=>['RECOGNITION_MATRIX','DIMENSIONAL',0], 'cat-admin-b5'=>['INSTRUCTIONAL_MATERIALS','LOOKUP',0],
            'cat-admin-c1'=>['SHARED_CAP','CATEGORY_CAP',0], 'cat-admin-c2'=>['SHARED_CAP','CATEGORY_CAP',0],
            'cat-admin-c3'=>['YEARS_SERVICE','FORMULA',0],
        ];
        foreach($categories as $id=>$metadata) {
            $update=['renderer_key'=>$metadata[0],'scoring_mode'=>$metadata[1],'requires_manual_hr_rule'=>$metadata[2],'updated_at'=>$now];
            if ($id === 'cat-admin-c1') $update['max_points']=30;
            $this->db->table('evaluation_scale_categories')->where('id',$id)->update($update);
        }
        $sourceRows=[
            'sub-a1-1'=>['name'=>'Ph.D. Holder','description'=>'Completed Ph.D.','default_points'=>40],
            'sub-a1-2'=>['name'=>'Ph.D. Units','description'=>'3 / 6 / 9 / 12 / 15+ units = 2 / 4 / 6 / 8 / 10 points','default_points'=>10],
            'sub-a1-3'=>['name'=>'MA Holder','description'=>'Completed MA','default_points'=>20],
            'sub-a1-4'=>['name'=>'MA Units','description'=>'3 / 6 / 9 / 12 / 15 / 18 / 21 / 24 / 27 / 30+ units = 1 / 2 / 3 / 4 / 5 / 6 / 7 / 8 / 9 / 10 points','default_points'=>10],
            'sub-a2-1'=>['name'=>'Member','description'=>'5 points per membership; organization name and active membership evidence required','default_points'=>5],
            'sub-a2-2'=>['name'=>'Officer / Position Held','description'=>'Organization name, office or position held, and evidence required','default_points'=>10],
        ];
        foreach($sourceRows as $id=>$row)$this->db->table('evaluation_scale_subcategories')->where('id',$id)->update(array_merge($row,['updated_at'=>$now]));
        $this->upsertCategory(['id'=>'cat-admin-b6','scale_area_id'=>'area-admin-b','category_code'=>'B.6','name'=>'B.6 Creative Work','description'=>'No lower-level point breakdown is visibly provided in the supplied official sheet.','display_order'=>6,'max_points'=>20,'scoring_mode'=>'MANUAL','requires_manual_hr_rule'=>1,'renderer_key'=>'MANUAL_CREATIVE','source_ref'=>'Faculty source Table 9','created_at'=>$now,'updated_at'=>$now]);
        foreach(['cat-admin-a3','cat-admin-b1','cat-admin-b2','cat-admin-b3','cat-admin-b4','cat-admin-b5','cat-admin-c1','cat-admin-c2'] as $categoryId) $this->db->table('evaluation_scale_subcategories')->where('scale_category_id',$categoryId)->delete();
        $subs=[
            ['fac-c1-1','cat-admin-c1','C.1.1','Moderator / Officer of Clubs / Organizations',20,'Date / school year / period covered'],['fac-c1-2','cat-admin-c1','C.1.2','Coach / Trainer',20,'Date / school year / period covered'],['fac-c1-3','cat-admin-c1','C.1.3','Membership in Working Committees',20,'Date / school year / period covered'],['fac-c1-4','cat-admin-c1','C.1.4','Rendered Service in School Activities',10,'Date / school year / period covered'],
            ['fac-c2-1','cat-admin-c2','C.2.1','Active Involvement in Church Activities',25,'Date / school year / period covered'],['fac-c2-2','cat-admin-c2','C.2.2','Active Involvement in Community / Civic Activities',25,'Date / school year / period covered'],['fac-c2-3','cat-admin-c2','C.2.3','Support to Charity and Community Projects',5,'Date / school year / period covered'],
        ];
        foreach($subs as $i=>$s) $this->db->table('evaluation_scale_subcategories')->insert(['id'=>$s[0],'scale_category_id'=>$s[1],'subcategory_code'=>$s[2],'name'=>$s[3],'description'=>$s[5],'display_order'=>$i+1,'default_points'=>$s[4],'source_ref'=>'Faculty source shared-cap tables','created_at'=>$now,'updated_at'=>$now]);
        $options=[];
        $add=function($cat,$group,$code,$label,$points,$order)use(&$options,$now){$options[]=['id'=>'opt-'.strtolower(str_replace(['.','_'],['-','-'],"$cat-$group-$code")),'scale_category_id'=>$cat,'option_group_code'=>$group,'option_code'=>$code,'label'=>$label,'points'=>$points,'display_order'=>$order,'source_ref'=>'Official Faculty source tables','created_at'=>$now,'updated_at'=>$now];};
        foreach([['IN_HOUSE','In-house',3],['CITY_PROV','City / Provincial',4],['REGIONAL','Regional',6],['NATIONAL','National',8],['INTERNATIONAL','International',10]] as $i=>$v)$add('cat-admin-a3','LEVEL',$v[0],$v[1],$v[2],$i+1);
        foreach([['NDMU','NDMU',1],['EXTERNAL','External / Other Schools',2]] as $i=>$v)$add('cat-admin-b1','SPONSOR',$v[0],$v[1],$v[2],$i+1);
        foreach([['1_HOUR','1 hr',1],['HALF_DAY','Half day',2],['1_DAY','1 day',3],['2_DAYS','2 days',4],['GT_2_DAYS','>2 days',5]] as $i=>$v)$add('cat-admin-b1','EXTENT',$v[0],$v[1],$v[2],$i+1);
        foreach([['LOCAL','Local',1],['REGIONAL','Regional',2],['NATIONAL','National',3],['INTERNATIONAL','International',4]] as $i=>$v)$add('cat-admin-b1','PARTICIPANTS',$v[0],$v[1],$v[2],$i+1);
        foreach([['JUDGE','Judge',3],['LECTURER','Lecturer / Consultant / Resource Person / Guest Speaker',5]] as $i=>$v)$add('cat-admin-b1','ROLE',$v[0],$v[1],$v[2],$i+1);
        foreach([['LOCAL','Local',3],['REGIONAL','Regional',4],['NATIONAL','National',6],['INTERNATIONAL','International',8]] as $i=>$v)$add('cat-admin-b2','SCOPE',$v[0],$v[1],$v[2],$i+1);
        foreach([['COMMENTARY','Commentary',2],['REVIEWS','Reviews',4],['COMPILATION','Compilation',5],['ARTICLE','Article',5],['SCHOLARLY_PAPER','Scholarly Paper',8],['MONOGRAPH','Monograph',8],['RESEARCH_OUTPUT','Research Output',10],['BOOK','Book',10]] as $i=>$v)$add('cat-admin-b2','TYPE',$v[0],$v[1],$v[2],$i+1);
        foreach([['LOCAL','Local',5],['PROV_REGIONAL','Provincial / Regional',15],['NATIONAL','National',20],['INTERNATIONAL','International',20]] as $i=>$v)$add('cat-admin-b4','NOMINEE',$v[0],$v[1],$v[2],$i+1);
        foreach([['LOCAL','Local',10],['PROV_REGIONAL','Provincial / Regional',30],['NATIONAL','National',40],['INTERNATIONAL','International',40]] as $i=>$v)$add('cat-admin-b4','AWARDEE',$v[0],$v[1],$v[2],$i+1);
        foreach([['AUDIO_VISUAL','Audio Visual Aids',10],['MODULES','Modules',10],['REVIEWERS','Reviewers (Bound)',10],['BOUND_WORKBOOKS','Other Bound Workbooks / Exercise Books',20]] as $i=>$v)$add('cat-admin-b5','MATERIAL_TYPE',$v[0],$v[1],$v[2],$i+1);
        foreach(range(1,10) as $i){$years=$i===10?'20+':(string)($i*2);$add('cat-admin-c3','YEARS','Y'.$years,$years,$i,$i);}
        foreach($options as $row)$this->upsertOption($row);
    }

    private function seedNonTeaching(string $now): void
    {
        if ($this->used('ver-ntp-2025-001')) return;
        $categories=[
            'cat-ntp-final-a1'=>['WEIGHTED_MANUAL','MANUAL',1], 'cat-ntp-final-a2'=>['WEIGHTED_MANUAL','MANUAL',1],
            'cat-ntp-final-a3'=>['WEIGHTED_MANUAL','MANUAL',1], 'cat-ntp-final-b1'=>['SHARED_CAP','CATEGORY_CAP',0],
            'cat-ntp-final-b2'=>['SHARED_CAP','CATEGORY_CAP',0], 'cat-ntp-final-b3'=>['YEARS_SERVICE','FORMULA',0],
            'cat-ntp-final-b4'=>['ENGAGEMENT','FORMULA',0], 'cat-ntp-final-b5'=>['MANUAL_RECOGNITION','MANUAL',1],
        ];
        foreach($categories as $id=>$metadata)$this->db->table('evaluation_scale_categories')->where('id',$id)->update(['renderer_key'=>$metadata[0],'scoring_mode'=>$metadata[1],'requires_manual_hr_rule'=>$metadata[2],'updated_at'=>$now]);
        $weights=['cat-ntp-final-a1'=>'.50','cat-ntp-final-a2'=>'.10','cat-ntp-final-a3'=>'.30'];
        foreach($weights as $id=>$weight)$this->upsertOption(['id'=>'opt-'.$id.'-weight','scale_category_id'=>$id,'option_group_code'=>'WEIGHT','option_code'=>'WEIGHT','label'=>$weight,'points'=>null,'display_order'=>1,'source_ref'=>'Official Non-Teaching source tables 1-3','created_at'=>$now,'updated_at'=>$now]);
        foreach(range(1,10) as $i){$years=$i===10?'20+':(string)($i*2);$this->upsertOption(['id'=>'opt-nt-years-'.$i,'scale_category_id'=>'cat-ntp-final-b3','option_group_code'=>'YEARS','option_code'=>'Y'.$years,'label'=>$years,'points'=>$i,'display_order'=>$i,'source_ref'=>'Official Non-Teaching source Table 6','created_at'=>$now,'updated_at'=>$now]);}
        $this->upsertOption(['id'=>'opt-nt-engagement-points','scale_category_id'=>'cat-ntp-final-b4','option_group_code'=>'CALCULATION','option_code'=>'POINTS_PER_ENGAGEMENT','label'=>'Eligible engagements × 5 points, capped at 30.','points'=>5,'display_order'=>1,'source_ref'=>'Official Non-Teaching source Table 7','created_at'=>$now,'updated_at'=>$now]);
    }

    private function used(string $versionId): bool { return $this->db->tableExists('personnel_evaluation_periods') && $this->db->table('personnel_evaluation_periods')->where('evaluation_scale_version_id',$versionId)->countAllResults()>0; }
    private function upsertCategory(array $row): void { $exists=$this->db->table('evaluation_scale_categories')->where('id',$row['id'])->countAllResults()>0; $exists?$this->db->table('evaluation_scale_categories')->where('id',$row['id'])->update($row):$this->db->table('evaluation_scale_categories')->insert($row); }
    private function upsertOption(array $row): void { $exists=$this->db->table('evaluation_scale_criterion_options')->where('id',$row['id'])->countAllResults()>0; $exists?$this->db->table('evaluation_scale_criterion_options')->where('id',$row['id'])->update($row):$this->db->table('evaluation_scale_criterion_options')->insert($row); }

    public function down()
    {
        $this->forge->dropTable('evaluation_scale_criterion_options',true);
        if($this->db->fieldExists('renderer_key','evaluation_scale_categories'))$this->forge->dropColumn('evaluation_scale_categories','renderer_key');
        foreach(['imported_at','source_reference','source_title'] as $field)if($this->db->fieldExists($field,'evaluation_scale_versions'))$this->forge->dropColumn('evaluation_scale_versions',$field);
    }
}
