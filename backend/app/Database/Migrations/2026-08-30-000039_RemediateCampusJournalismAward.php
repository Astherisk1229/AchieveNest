<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class RemediateCampusJournalismAward extends Migration
{
    public function up()
    {
        $db = $this->db;

        // 1. Reconcile Award Definition for Campus Journalism Award
        $db->table('award_definitions')
            ->where('id', '50000001-0000-0000-0000-000000000023')
            ->update([
                'code'                        => 'CAMPUS_JOURNALISM_AWARD',
                'name'                        => 'Campus Journalism Award',
                'category'                    => 'journalism',
                'description'                 => 'Premier graduating award recognizing exemplary journalistic dedication, verified publication excellence, editorial integrity, and campus publication leadership.',
                'authority_status'            => 'OFFICIAL',
                'source_fidelity_status'      => 'VERIFIED',
                'is_catalog_visible'          => 1,
                'graduating_only'              => 1,
                'gender_restriction'          => null,
                'candidate_threshold_percent' => 80.00,
                'status'                      => 'active',
                'active_scoring_version'      => '1.0',
            ]);

        // 2. Published Scoring Model Version v1.0
        $versionExists = $db->table('award_scoring_model_versions')
            ->where('id', '0f85b20c-a461-11f1-a155-08453f707323')
            ->countAllResults();

        if ($versionExists === 0) {
            $db->table('award_scoring_model_versions')->insert([
                'id'                          => '0f85b20c-a461-11f1-a155-08453f707323',
                'award_definition_id'         => '50000001-0000-0000-0000-000000000023',
                'version_number'              => '1.0',
                'version_label'               => 'v1.0 Published',
                'status'                      => 'published',
                'candidate_threshold_percent' => 80.00,
                'graduating_only'              => 1,
                'authority_status'            => 'OFFICIAL',
                'published_at'                => '2026-08-30 00:00:00',
            ]);
        } else {
            $db->table('award_scoring_model_versions')
                ->where('id', '0f85b20c-a461-11f1-a155-08453f707323')
                ->update([
                    'status'                      => 'published',
                    'candidate_threshold_percent' => 80.00,
                ]);
        }

        // 3. Clear Existing Sub-Records
        $critIds = array_column(
            $db->table('award_criteria')->select('id')->where('award_definition_id', '50000001-0000-0000-0000-000000000023')->get()->getResultArray(),
            'id'
        );

        if (! empty($critIds)) {
            $db->table('student_award_criterion_scores')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_scoring_rules')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_evidence_mapping_rules')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_criterion_components')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_criteria')->whereIn('id', $critIds)->delete();
        }

        // 4. Re-insert 4 Official Criteria
        $db->table('award_criteria')->insertBatch([
            [
                'id'                       => '50000002-0023-0000-0000-000000000001',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000023',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707323',
                'code'                     => 'CRIT_JOURN_CHARACTER',
                'name'                     => 'Character',
                'weight'                   => 20.00,
                'max_points'               => 20.00,
                'sort_order'               => 1,
                'is_portfolio_computable'  => 0,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0023-0000-0000-000000000002',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000023',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707323',
                'code'                     => 'CRIT_JOURN_PUB_QUALITY',
                'name'                     => 'Quality of Publication',
                'weight'                   => 60.00,
                'max_points'               => 60.00,
                'sort_order'               => 2,
                'is_portfolio_computable'  => 1,
                'authority_status'         => 'SYSTEM_OPERATIONALIZATION',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0023-0000-0000-000000000003',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000023',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707323',
                'code'                     => 'CRIT_JOURN_LEADERSHIP',
                'name'                     => 'Leadership',
                'weight'                   => 10.00,
                'max_points'               => 10.00,
                'sort_order'               => 3,
                'is_portfolio_computable'  => 1,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0023-0000-0000-000000000004',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000023',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707323',
                'code'                     => 'CRIT_JOURN_INTERVIEW',
                'name'                     => 'Interview',
                'weight'                   => 10.00,
                'max_points'               => 10.00,
                'sort_order'               => 4,
                'is_portfolio_computable'  => 0,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
        ]);

        // 5. Criterion Components
        $db->table('award_criterion_components')->insertBatch([
            [
                'id'               => '50000003-0023-0000-0000-000000000001',
                'criterion_id'     => '50000002-0023-0000-0000-000000000002',
                'code'             => 'COMP_JOURN_NEWS',
                'name'             => 'News Item Evidence',
                'description'      => 'Verified published news items (2 pts each, capped at 10).',
                'max_points'       => 10.00,
                'sort_order'       => 1,
                'is_computable'    => 1,
                'authority_status' => 'SYSTEM_OPERATIONALIZATION',
            ],
            [
                'id'               => '50000003-0023-0000-0000-000000000002',
                'criterion_id'     => '50000002-0023-0000-0000-000000000002',
                'code'             => 'COMP_JOURN_LITERARY',
                'name'             => 'Literary Evidence',
                'description'      => 'Verified published literary works (2 pts each, capped at 10).',
                'max_points'       => 10.00,
                'sort_order'       => 2,
                'is_computable'    => 1,
                'authority_status' => 'SYSTEM_OPERATIONALIZATION',
            ],
            [
                'id'               => '50000003-0023-0000-0000-000000000003',
                'criterion_id'     => '50000002-0023-0000-0000-000000000002',
                'code'             => 'COMP_JOURN_COLUMN',
                'name'             => 'Column Evidence',
                'description'      => 'Verified published columns (4 pts each, capped at 20).',
                'max_points'       => 20.00,
                'sort_order'       => 3,
                'is_computable'    => 1,
                'authority_status' => 'SYSTEM_OPERATIONALIZATION',
            ],
            [
                'id'               => '50000003-0023-0000-0000-000000000004',
                'criterion_id'     => '50000002-0023-0000-0000-000000000002',
                'code'             => 'COMP_JOURN_EDITORIAL',
                'name'             => 'Editorial Evidence',
                'description'      => 'Verified published editorials (4 pts each, capped at 20).',
                'max_points'       => 20.00,
                'sort_order'       => 4,
                'is_computable'    => 1,
                'authority_status' => 'SYSTEM_OPERATIONALIZATION',
            ],
            [
                'id'               => '50000003-0023-0000-0000-000000000005',
                'criterion_id'     => '50000002-0023-0000-0000-000000000003',
                'code'             => 'COMP_JOURN_LEAD_ROLE',
                'name'             => 'Leadership Involvement',
                'description'      => 'Verified publication staff role (Officer=3 pts, Member/contributor=2 pts, capped at 5).',
                'max_points'       => 5.00,
                'sort_order'       => 1,
                'is_computable'    => 1,
                'authority_status' => 'OFFICIAL',
            ],
            [
                'id'               => '50000003-0023-0000-0000-000000000006',
                'criterion_id'     => '50000002-0023-0000-0000-000000000003',
                'code'             => 'COMP_JOURN_LEAD_AWARDS',
                'name'             => 'Journalism Awards / Citations',
                'description'      => 'Verified journalism awards/citations (3 intl/natl, 2 local, capped at 5; seminars = 0 pts).',
                'max_points'       => 5.00,
                'sort_order'       => 2,
                'is_computable'    => 1,
                'authority_status' => 'OFFICIAL',
            ],
        ]);

        // 6. Evidence Mapping Rules
        $db->table('award_evidence_mapping_rules')->insertBatch([
            [
                'id'                       => '50000004-0023-0000-0000-000000000001',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707323',
                'criterion_id'             => '50000002-0023-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0023-0000-0000-000000000001',
                'rule_code'                => 'MAP_JOURN_NEWS',
                'name'                     => 'Published News Items Mapping',
                'portfolio_category_id'    => '2b09cd61-7a23-4466-be58-889398e8f201',
                'portfolio_subcategory_id' => '40000009-0001-0000-0000-000000000001',
                'priority'                 => 10,
                'authority_status'         => 'SYSTEM_OPERATIONALIZATION',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0023-0000-0000-000000000002',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707323',
                'criterion_id'             => '50000002-0023-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0023-0000-0000-000000000002',
                'rule_code'                => 'MAP_JOURN_LITERARY',
                'name'                     => 'Published Literary Works Mapping',
                'portfolio_category_id'    => '2b09cd61-7a23-4466-be58-889398e8f201',
                'portfolio_subcategory_id' => '40000009-0001-0000-0000-000000000002',
                'priority'                 => 20,
                'authority_status'         => 'SYSTEM_OPERATIONALIZATION',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0023-0000-0000-000000000003',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707323',
                'criterion_id'             => '50000002-0023-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0023-0000-0000-000000000003',
                'rule_code'                => 'MAP_JOURN_COLUMN',
                'name'                     => 'Published Columns Mapping',
                'portfolio_category_id'    => '2b09cd61-7a23-4466-be58-889398e8f201',
                'portfolio_subcategory_id' => '40000009-0001-0000-0000-000000000003',
                'priority'                 => 30,
                'authority_status'         => 'SYSTEM_OPERATIONALIZATION',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0023-0000-0000-000000000004',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707323',
                'criterion_id'             => '50000002-0023-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0023-0000-0000-000000000004',
                'rule_code'                => 'MAP_JOURN_EDITORIAL',
                'name'                     => 'Published Editorials Mapping',
                'portfolio_category_id'    => '2b09cd61-7a23-4466-be58-889398e8f201',
                'portfolio_subcategory_id' => '40000009-0001-0000-0000-000000000004',
                'priority'                 => 40,
                'authority_status'         => 'SYSTEM_OPERATIONALIZATION',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0023-0000-0000-000000000005',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707323',
                'criterion_id'             => '50000002-0023-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0023-0000-0000-000000000005',
                'rule_code'                => 'MAP_JOURN_OFFICER',
                'name'                     => 'Publication Officer Role Mapping',
                'portfolio_category_id'    => '2b09cd61-7a23-4466-be58-889398e8f201',
                'portfolio_subcategory_id' => '40000009-0001-0000-0000-000000000006',
                'priority'                 => 10,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0023-0000-0000-000000000006',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707323',
                'criterion_id'             => '50000002-0023-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0023-0000-0000-000000000005',
                'rule_code'                => 'MAP_JOURN_MEMBER',
                'name'                     => 'Publication Member / Contributor Role Mapping',
                'portfolio_category_id'    => '2b09cd61-7a23-4466-be58-889398e8f201',
                'portfolio_subcategory_id' => '40000009-0001-0000-0000-000000000005',
                'priority'                 => 20,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0023-0000-0000-000000000007',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707323',
                'criterion_id'             => '50000002-0023-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0023-0000-0000-000000000006',
                'rule_code'                => 'MAP_JOURN_AWARDS',
                'name'                     => 'Journalism Awards & Citations Mapping',
                'portfolio_category_id'    => '448beadb-a254-4cb6-84fb-a3d5f4f8822e',
                'portfolio_subcategory_id' => null,
                'priority'                 => 10,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0023-0000-0000-000000000008',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707323',
                'criterion_id'             => '50000002-0023-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0023-0000-0000-000000000006',
                'rule_code'                => 'MAP_JOURN_SEMINARS',
                'name'                     => 'Journalism Seminars Supporting Mapping (0 Pts)',
                'portfolio_category_id'    => '802de57b-54d7-4d38-9433-052ca9636380',
                'portfolio_subcategory_id' => null,
                'priority'                 => 20,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
        ]);

        // 7. Scoring Rules
        $db->table('award_scoring_rules')->insertBatch([
            [
                'id'                       => '50000005-0023-0000-0000-000000000001',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707323',
                'criterion_id'             => '50000002-0023-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0023-0000-0000-000000000001',
                'code'                     => 'RULE_JOURN_NEWS',
                'name'                     => 'Published News Items Capped Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 10.00,
                'max_points'               => 10.00,
                'rule_config'              => json_encode(['points_per_item' => 2.0, 'cap' => 10.0, 'max_points' => 10.0]),
                'authority_status'         => 'SYSTEM_OPERATIONALIZATION',
                'is_active'                => 1,
                'sort_order'               => 1,
            ],
            [
                'id'                       => '50000005-0023-0000-0000-000000000002',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707323',
                'criterion_id'             => '50000002-0023-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0023-0000-0000-000000000002',
                'code'                     => 'RULE_JOURN_LITERARY',
                'name'                     => 'Published Literary Works Capped Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 10.00,
                'max_points'               => 10.00,
                'rule_config'              => json_encode(['points_per_item' => 2.0, 'cap' => 10.0, 'max_points' => 10.0]),
                'authority_status'         => 'SYSTEM_OPERATIONALIZATION',
                'is_active'                => 1,
                'sort_order'               => 2,
            ],
            [
                'id'                       => '50000005-0023-0000-0000-000000000003',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707323',
                'criterion_id'             => '50000002-0023-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0023-0000-0000-000000000003',
                'code'                     => 'RULE_JOURN_COLUMN',
                'name'                     => 'Published Columns Capped Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 20.00,
                'max_points'               => 20.00,
                'rule_config'              => json_encode(['points_per_item' => 4.0, 'cap' => 20.0, 'max_points' => 20.0]),
                'authority_status'         => 'SYSTEM_OPERATIONALIZATION',
                'is_active'                => 1,
                'sort_order'               => 3,
            ],
            [
                'id'                       => '50000005-0023-0000-0000-000000000004',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707323',
                'criterion_id'             => '50000002-0023-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0023-0000-0000-000000000004',
                'code'                     => 'RULE_JOURN_EDITORIAL',
                'name'                     => 'Published Editorials Capped Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 20.00,
                'max_points'               => 20.00,
                'rule_config'              => json_encode(['points_per_item' => 4.0, 'cap' => 20.0, 'max_points' => 20.0]),
                'authority_status'         => 'SYSTEM_OPERATIONALIZATION',
                'is_active'                => 1,
                'sort_order'               => 4,
            ],
            [
                'id'                       => '50000005-0023-0000-0000-000000000005',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707323',
                'criterion_id'             => '50000002-0023-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0023-0000-0000-000000000005',
                'code'                     => 'RULE_JOURN_LEAD_ROLE',
                'name'                     => 'Publication Leadership Roles Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 5.00,
                'max_points'               => 5.00,
                'rule_config'              => json_encode(['role_points' => ['officer' => 3.0, 'member' => 2.0, 'contributor' => 2.0], 'cap' => 5.0, 'max_points' => 5.0]),
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
                'sort_order'               => 1,
            ],
            [
                'id'                       => '50000005-0023-0000-0000-000000000006',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707323',
                'criterion_id'             => '50000002-0023-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0023-0000-0000-000000000006',
                'code'                     => 'RULE_JOURN_LEAD_AWARDS',
                'name'                     => 'Journalism Awards & Citations Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 5.00,
                'max_points'               => 5.00,
                'rule_config'              => json_encode(['points_per_record' => ['award_international' => 3.0, 'award_national' => 3.0, 'award_local' => 2.0, 'seminar' => 0.0], 'cap' => 5.0, 'max_points' => 5.0]),
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
                'sort_order'               => 2,
            ],
        ]);
    }

    public function down()
    {
    }
}
