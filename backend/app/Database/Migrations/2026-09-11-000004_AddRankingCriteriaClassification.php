<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddRankingCriteriaClassification extends Migration
{
    public function up()
    {
        if (! $this->db->fieldExists('personnel_group', 'evaluation_scales')) {
            $this->forge->addColumn('evaluation_scales', ['personnel_group' => ['type'=>'ENUM', 'constraint'=>['FACULTY','NON_TEACHING_FACULTY'], 'null'=>true, 'after'=>'description']]);
        }
        if (! $this->db->fieldExists('scoring_mode', 'evaluation_scale_categories')) {
            $this->forge->addColumn('evaluation_scale_categories', [
                'scoring_mode' => ['type'=>'ENUM', 'constraint'=>['FIXED','FORMULA','DIMENSIONAL','LOOKUP','CATEGORY_CAP','MANUAL'], 'default'=>'MANUAL', 'after'=>'max_points'],
                'requires_manual_hr_rule' => ['type'=>'TINYINT', 'constraint'=>1, 'default'=>0, 'after'=>'scoring_mode'],
            ]);
        }
        if (! $this->db->fieldExists('personnel_group', 'personnel_evaluation_periods')) {
            $this->forge->addColumn('personnel_evaluation_periods', ['personnel_group' => ['type'=>'ENUM', 'constraint'=>['FACULTY','NON_TEACHING_FACULTY'], 'default'=>'FACULTY', 'after'=>'evaluation_type']]);
            $this->db->query('CREATE INDEX idx_personnel_period_group ON personnel_evaluation_periods (personnel_group)');
        }
        if ($this->db->tableExists('personnel_evaluations')) {
            foreach ([
                'personnel_group_snapshot' => ['type'=>'VARCHAR', 'constraint'=>32, 'null'=>true],
                'criteria_snapshot' => ['type'=>'JSON', 'null'=>true],
                'position_title_snapshot' => ['type'=>'VARCHAR', 'constraint'=>160, 'null'=>true],
                'college_id_snapshot' => ['type'=>'VARCHAR', 'constraint'=>64, 'null'=>true],
                'college_name_snapshot' => ['type'=>'VARCHAR', 'constraint'=>255, 'null'=>true],
                'department_id_snapshot' => ['type'=>'VARCHAR', 'constraint'=>64, 'null'=>true],
                'department_name_snapshot' => ['type'=>'VARCHAR', 'constraint'=>255, 'null'=>true],
            ] as $field => $definition) if (! $this->db->fieldExists($field, 'personnel_evaluations')) $this->forge->addColumn('personnel_evaluations', [$field=>$definition]);
        }

        $this->db->table('evaluation_scales')->where('scale_code', 'ADMINISTRATORS_RANKING_SCALE')->update(['title'=>'Administrators Ranking Scale — Faculty', 'personnel_group'=>'FACULTY']);
        $this->db->table('evaluation_scales')->where('scale_code', 'NON_TEACHING_PERSONNEL_RANKING_SCALE')->update(['title'=>'Non-Teaching Personnel Ranking Scale — Non-Teaching Faculty', 'personnel_group'=>'NON_TEACHING_FACULTY']);
        $this->db->table('evaluation_scale_versions')->where('id', 'ver-admin-2025-001')->update(['source_document_ref'=>'Administrators_Ranking_Scale_Faculty_Intuitive_Breakdown_Tables.docx']);
        foreach (['cat-admin-b3','cat-admin-b6'] as $id) $this->db->table('evaluation_scale_categories')->where('id', $id)->update(['scoring_mode'=>'MANUAL','requires_manual_hr_rule'=>1]);
        foreach (['cat-non-a1','cat-non-a2','cat-non-a3','cat-non-b5'] as $id) $this->db->table('evaluation_scale_categories')->where('id', $id)->update(['scoring_mode'=>'MANUAL','requires_manual_hr_rule'=>1]);
        $this->seedFinalNonTeachingCriteria();
    }

    private function seedFinalNonTeachingCriteria(): void
    {
        $versionId = 'ver-ntp-2025-001';
        $used = $this->db->table('personnel_evaluation_periods')->where('evaluation_scale_version_id', $versionId)->countAllResults();
        if ($used > 0) return; // Never rewrite criteria already bound to a period.
        $areaIds = array_column($this->db->table('evaluation_scale_areas')->select('id')->where('scale_version_id', $versionId)->get()->getResultArray(), 'id');
        if ($areaIds) {
            $categoryIds = array_column($this->db->table('evaluation_scale_categories')->select('id')->whereIn('scale_area_id', $areaIds)->get()->getResultArray(), 'id');
            if ($categoryIds) {
                $this->db->table('evaluation_scale_criteria')->whereIn('scale_category_id', $categoryIds)->delete();
                $this->db->table('evaluation_scale_subcategories')->whereIn('scale_category_id', $categoryIds)->delete();
                $this->db->table('evaluation_scale_categories')->whereIn('id', $categoryIds)->delete();
            }
            $this->db->table('evaluation_scale_areas')->whereIn('id', $areaIds)->delete();
        }
        $now = date('Y-m-d H:i:s');
        $this->db->table('evaluation_scale_versions')->where('id', $versionId)->update(['source_document_ref'=>'Non_Teaching_Personnel_Ranking_Scale_Intuitive_Breakdown_Tables.docx','updated_at'=>$now]);
        $this->db->table('evaluation_scale_areas')->insertBatch([
            ['id'=>'area-ntp-final-a','scale_version_id'=>$versionId,'area_code'=>'A','name'=>'Area A — Performance and Personal Indicators','description'=>'Official performance indicators. Detailed rating bands are not defined in the source and remain manual.','display_order'=>1,'max_points'=>90,'entry_policy'=>'personnel_entry_disallowed_read_only','source_ref'=>'Source tables 1–3','created_at'=>$now,'updated_at'=>$now],
            ['id'=>'area-ntp-final-b','scale_version_id'=>$versionId,'area_code'=>'B','name'=>'Area B — Service and Leadership','description'=>'School involvement, community involvement, service, invited engagements, and recognition.','display_order'=>2,'max_points'=>60,'entry_policy'=>'personnel_entry_allowed','source_ref'=>'Source tables 4–8','created_at'=>$now,'updated_at'=>$now],
        ]);
        $categories = [
            ['cat-ntp-final-a1','area-ntp-final-a','A.1','Job Performance',1,50,'MANUAL',1,'Weight .50; no official lower-level rating bands.'],
            ['cat-ntp-final-a2','area-ntp-final-a','A.2','Personal Attitudes and Qualities',2,10,'MANUAL',1,'Weight .10; no official lower-level rating bands.'],
            ['cat-ntp-final-a3','area-ntp-final-a','A.3','Efficiency',3,30,'MANUAL',1,'Weight .30; no official lower-level rating bands.'],
            ['cat-ntp-final-b1','area-ntp-final-b','B.1','School Involvement',1,30,'CATEGORY_CAP',0,'Shared category cap of 30 points.'],
            ['cat-ntp-final-b2','area-ntp-final-b','B.2','Community Involvement',2,30,'CATEGORY_CAP',0,'Shared category cap of 30 points.'],
            ['cat-ntp-final-b3','area-ntp-final-b','B.3','Years of Service',3,10,'FORMULA',0,'One point per two completed years; maximum 10.'],
            ['cat-ntp-final-b4','area-ntp-final-b','B.4','Judge / Lecturer / Resource Person',4,30,'FORMULA',0,'Five points per eligible engagement; maximum 30.'],
            ['cat-ntp-final-b5','area-ntp-final-b','B.5','Recognition / Meritorious Award',5,30,'MANUAL',1,'No lower-level award breakdown is defined in the official source.'],
        ];
        foreach ($categories as $c) $this->db->table('evaluation_scale_categories')->insert(['id'=>$c[0],'scale_area_id'=>$c[1],'category_code'=>$c[2],'name'=>$c[3],'display_order'=>$c[4],'max_points'=>$c[5],'scoring_mode'=>$c[6],'requires_manual_hr_rule'=>$c[7],'description'=>$c[8],'source_ref'=>'Non-Teaching final criteria document','created_at'=>$now,'updated_at'=>$now]);
        $rules = [
            ['nt-b1-1','cat-ntp-final-b1','B.1.1','Moderator / Officer of Clubs',30,'Organization, role, period, and evidence.'],
            ['nt-b1-2','cat-ntp-final-b1','B.1.2','Trainer / Coach',20,'Activity or team, role, period, and evidence.'],
            ['nt-b1-3','cat-ntp-final-b1','B.1.3','Membership in Working Committees',20,'Committee, role, period, and evidence.'],
            ['nt-b1-4','cat-ntp-final-b1','B.1.4','Rendered Service in School Activities',10,'Activity, service, period, and evidence.'],
            ['nt-b2-1','cat-ntp-final-b2','B.2.1','Active Involvement in Church Activities',25,'Activity, church or organization, period, and evidence.'],
            ['nt-b2-2','cat-ntp-final-b2','B.2.2','Active Involvement in Community / Civic Activities',25,'Activity, organization, period, and evidence.'],
            ['nt-b2-3','cat-ntp-final-b2','B.2.3','Support to Charity and Community Projects',5,'Project or activity, support, period, and evidence.'],
            ['nt-b3-1','cat-ntp-final-b3','B.3.1','Years of Service',10,'2/4/6/8/10/12/14/16/18/20+ years = 1/2/3/4/5/6/7/8/9/10 points.'],
            ['nt-b4-1','cat-ntp-final-b4','B.4.1','Judge / Lecturer / Resource Person',5,'Five points per eligible engagement, capped at 30.'],
        ];
        foreach ($rules as $index=>$r) $this->db->table('evaluation_scale_subcategories')->insert(['id'=>$r[0],'scale_category_id'=>$r[1],'subcategory_code'=>$r[2],'name'=>$r[3],'description'=>$r[5],'display_order'=>$index+1,'default_points'=>$r[4],'source_ref'=>'Non-Teaching final criteria document','created_at'=>$now,'updated_at'=>$now]);
    }

    public function down()
    {
        foreach (['department_name_snapshot','department_id_snapshot','college_name_snapshot','college_id_snapshot','position_title_snapshot','criteria_snapshot','personnel_group_snapshot'] as $field) if ($this->db->tableExists('personnel_evaluations') && $this->db->fieldExists($field, 'personnel_evaluations')) $this->forge->dropColumn('personnel_evaluations', $field);
        if ($this->db->fieldExists('personnel_group', 'personnel_evaluation_periods')) $this->forge->dropColumn('personnel_evaluation_periods', 'personnel_group');
        foreach (['requires_manual_hr_rule','scoring_mode'] as $field) if ($this->db->fieldExists($field, 'evaluation_scale_categories')) $this->forge->dropColumn('evaluation_scale_categories', $field);
        if ($this->db->fieldExists('personnel_group', 'evaluation_scales')) $this->forge->dropColumn('evaluation_scales', 'personnel_group');
    }
}
