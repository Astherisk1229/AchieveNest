<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class RemediateNotreDameAward extends Migration
{
    public function up()
    {
        // 1. Reconcile Award Definition
        $this->db->table('award_definitions')
            ->where('id', '50000001-0000-0000-0000-000000000001')
            ->update([
                'code'                        => 'NOTRE_DAME_AWARD',
                'name'                        => 'Notre Dame Award',
                'description'                 => 'Highest institutional award for graduating students demonstrating excellence across leadership, church involvement, non-academic citations, scholastic achievement, and character.',
                'authority_status'            => 'OFFICIAL',
                'graduating_only'             => 1,
                'gender_restriction'          => null,
                'candidate_threshold_percent' => 80.00,
            ]);

        // 2. Clear old criteria and dependent records for this award
        $subQuery = $this->db->table('award_criteria')
            ->select('id')
            ->where('award_definition_id', '50000001-0000-0000-0000-000000000001')
            ->getCompiledSelect();

        $this->db->query("DELETE FROM student_award_criterion_scores WHERE criterion_id IN ($subQuery)");
        $this->db->query("DELETE FROM award_scoring_rules WHERE criterion_id IN ($subQuery)");
        $this->db->query("DELETE FROM award_evidence_mapping_rules WHERE criterion_id IN ($subQuery)");
        $this->db->query("DELETE FROM award_criterion_components WHERE criterion_id IN ($subQuery)");

        $this->db->table('award_criteria')
            ->where('award_definition_id', '50000001-0000-0000-0000-000000000001')
            ->delete();

        // 3. Re-insert 5 Official Criteria
        $this->db->table('award_criteria')->insertBatch([
            [
                'id'                       => '50000002-0001-0000-0000-000000000011',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000001',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f7073ee',
                'code'                     => 'CRIT_NDA_SCHOLASTIC',
                'name'                     => 'Scholastic Achievement',
                'weight'                   => 30.00,
                'max_points'               => 30.00,
                'sort_order'               => 1,
                'is_portfolio_computable'  => 0,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0001-0000-0000-000000000001',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000001',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f7073ee',
                'code'                     => 'CRIT_NDA_LEADERSHIP',
                'name'                     => 'Leadership: On and Off Campus',
                'weight'                   => 20.00,
                'max_points'               => 20.00,
                'sort_order'               => 2,
                'is_portfolio_computable'  => 1,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0001-0000-0000-000000000002',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000001',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f7073ee',
                'code'                     => 'CRIT_NDA_CHURCH',
                'name'                     => 'Church Activities',
                'weight'                   => 20.00,
                'max_points'               => 20.00,
                'sort_order'               => 3,
                'is_portfolio_computable'  => 1,
                'authority_status'         => 'SYSTEM_OPERATIONALIZATION',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0001-0000-0000-000000000003',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000001',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f7073ee',
                'code'                     => 'CRIT_NDA_CITATIONS',
                'name'                     => 'Citations Received Other than Academics',
                'weight'                   => 10.00,
                'max_points'               => 10.00,
                'sort_order'               => 4,
                'is_portfolio_computable'  => 1,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0001-0000-0000-000000000012',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000001',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f7073ee',
                'code'                     => 'CRIT_NDA_CHARACTER',
                'name'                     => 'Character',
                'weight'                   => 20.00,
                'max_points'               => 20.00,
                'sort_order'               => 5,
                'is_portfolio_computable'  => 0,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
        ]);

        // 4. Criterion Components
        $this->db->table('award_criterion_components')->insertBatch([
            [
                'id'               => '50000003-0001-0000-0000-000000000001',
                'criterion_id'     => '50000002-0001-0000-0000-000000000001',
                'code'             => 'COMP_NDA_LEAD_INVOLVE',
                'name'             => 'Leadership Involvement',
                'description'      => 'Highest applicable verified student governance or organization leadership position.',
                'max_points'       => 10.00,
                'sort_order'       => 1,
                'is_computable'    => 1,
                'authority_status' => 'OFFICIAL',
            ],
            [
                'id'               => '50000003-0001-0000-0000-000000000002',
                'criterion_id'     => '50000002-0001-0000-0000-000000000001',
                'code'             => 'COMP_NDA_LEAD_AWARDS',
                'name'             => 'Leadership Awards, Citations, and Seminars',
                'description'      => 'Cumulative verified leadership-related awards, citations, and leadership development seminars (capped at 10).',
                'max_points'       => 10.00,
                'sort_order'       => 2,
                'is_computable'    => 1,
                'authority_status' => 'OFFICIAL',
            ],
            [
                'id'               => '50000003-0001-0000-0000-000000000003',
                'criterion_id'     => '50000002-0001-0000-0000-000000000002',
                'code'             => 'COMP_NDA_CHURCH_MINISTRY',
                'name'             => 'Involvement in Church Ministries / Organizations',
                'description'      => 'Count-based points for verified church ministry, parish, or campus ministry involvements (capped at 10).',
                'max_points'       => 10.00,
                'sort_order'       => 1,
                'is_computable'    => 1,
                'authority_status' => 'SYSTEM_OPERATIONALIZATION',
            ],
            [
                'id'               => '50000003-0001-0000-0000-000000000004',
                'criterion_id'     => '50000002-0001-0000-0000-000000000002',
                'code'             => 'COMP_NDA_CHURCH_INITIATED',
                'name'             => 'Initiated Church-Related Activities',
                'description'      => 'Role-based points for organizing, facilitating, or heading church-related activities (capped at 10).',
                'max_points'       => 10.00,
                'sort_order'       => 2,
                'is_computable'    => 1,
                'authority_status' => 'SYSTEM_OPERATIONALIZATION',
            ],
        ]);

        // 5. Evidence Mapping Rules
        $this->db->table('award_evidence_mapping_rules')->insertBatch([
            [
                'id'                       => '50000004-0001-0000-0000-000000000001',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f7073ee',
                'criterion_id'             => '50000002-0001-0000-0000-000000000001',
                'criterion_component_id'   => '50000003-0001-0000-0000-000000000001',
                'rule_code'                => 'MAP_NDA_LEAD_POS',
                'name'                     => 'Leadership Positions Matrix Mapping',
                'portfolio_category_id'    => '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646',
                'portfolio_subcategory_id' => null,
                'priority'                 => 10,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0001-0000-0000-000000000002',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f7073ee',
                'criterion_id'             => '50000002-0001-0000-0000-000000000001',
                'criterion_component_id'   => '50000003-0001-0000-0000-000000000002',
                'rule_code'                => 'MAP_NDA_LEAD_AWARDS',
                'name'                     => 'Leadership Citations & Awards Mapping',
                'portfolio_category_id'    => '448beadb-a254-4cb6-84fb-a3d5f4f8822e',
                'portfolio_subcategory_id' => null,
                'priority'                 => 20,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0001-0000-0000-000000000003',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f7073ee',
                'criterion_id'             => '50000002-0001-0000-0000-000000000001',
                'criterion_component_id'   => '50000003-0001-0000-0000-000000000002',
                'rule_code'                => 'MAP_NDA_LEAD_SEMINARS',
                'name'                     => 'Leadership Development Seminars Mapping',
                'portfolio_category_id'    => '802de57b-54d7-4d38-9433-052ca9636380',
                'portfolio_subcategory_id' => null,
                'priority'                 => 30,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0001-0000-0000-000000000004',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f7073ee',
                'criterion_id'             => '50000002-0001-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0001-0000-0000-000000000003',
                'rule_code'                => 'MAP_NDA_CHURCH_MINISTRY',
                'name'                     => 'Church Ministries & Organizations Mapping',
                'portfolio_category_id'    => '779a9653-d972-47ce-93dc-cb381150568b',
                'portfolio_subcategory_id' => null,
                'priority'                 => 10,
                'authority_status'         => 'SYSTEM_OPERATIONALIZATION',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0001-0000-0000-000000000005',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f7073ee',
                'criterion_id'             => '50000002-0001-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0001-0000-0000-000000000004',
                'rule_code'                => 'MAP_NDA_CHURCH_INITIATED',
                'name'                     => 'Initiated Church Activities Mapping',
                'portfolio_category_id'    => '779a9653-d972-47ce-93dc-cb381150568b',
                'portfolio_subcategory_id' => null,
                'priority'                 => 20,
                'authority_status'         => 'SYSTEM_OPERATIONALIZATION',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0001-0000-0000-000000000006',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f7073ee',
                'criterion_id'             => '50000002-0001-0000-0000-000000000003',
                'criterion_component_id'   => null,
                'rule_code'                => 'MAP_NDA_NONACAD_CITATIONS',
                'name'                     => 'Non-Academic Citations Mapping',
                'portfolio_category_id'    => '448beadb-a254-4cb6-84fb-a3d5f4f8822e',
                'portfolio_subcategory_id' => null,
                'priority'                 => 10,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
        ]);

        // 6. Scoring Rules
        $this->db->table('award_scoring_rules')->insertBatch([
            [
                'id'                       => '50000005-0001-0000-0000-000000000001',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f7073ee',
                'criterion_id'             => '50000002-0001-0000-0000-000000000001',
                'criterion_component_id'   => '50000003-0001-0000-0000-000000000001',
                'code'                     => 'RULE_NDA_LEAD_INVOLVE',
                'name'                     => 'Leadership Involvement Highest Level Rule',
                'rule_type'                => 'highest_only',
                'points'                   => 10.00,
                'max_points'               => 10.00,
                'rule_config'              => json_encode([
                    'points_matrix' => [
                        'university' => 10.0,
                        'college'    => 8.0,
                        'club'       => 6.0,
                        'year_level' => 4.0,
                    ],
                    'max_points'    => 10.0,
                ]),
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
                'sort_order'               => 1,
            ],
            [
                'id'                       => '50000005-0001-0000-0000-000000000002',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f7073ee',
                'criterion_id'             => '50000002-0001-0000-0000-000000000001',
                'criterion_component_id'   => '50000003-0001-0000-0000-000000000002',
                'code'                     => 'RULE_NDA_LEAD_AWARDS',
                'name'                     => 'Leadership Awards & Seminars Capped Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 10.00,
                'max_points'               => 10.00,
                'rule_config'              => json_encode([
                    'points_per_record' => [
                        'award_international' => 5.0,
                        'award_local'         => 2.0,
                        'seminar'             => 2.0,
                    ],
                    'cap'               => 10.0,
                    'max_points'        => 10.0,
                ]),
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
                'sort_order'               => 2,
            ],
            [
                'id'                       => '50000005-0001-0000-0000-000000000003',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f7073ee',
                'criterion_id'             => '50000002-0001-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0001-0000-0000-000000000003',
                'code'                     => 'RULE_NDA_CHURCH_MINISTRY',
                'name'                     => 'Church Ministries Count Matrix Rule',
                'rule_type'                => 'matrix_mapping',
                'points'                   => 10.00,
                'max_points'               => 10.00,
                'rule_config'              => json_encode([
                    'count_matrix' => [
                        '1' => 2.0,
                        '2' => 4.0,
                        '3' => 6.0,
                        '4' => 8.0,
                        '5' => 10.0,
                    ],
                    'max_points'   => 10.0,
                ]),
                'authority_status'         => 'SYSTEM_OPERATIONALIZATION',
                'is_active'                => 1,
                'sort_order'               => 1,
            ],
            [
                'id'                       => '50000005-0001-0000-0000-000000000004',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f7073ee',
                'criterion_id'             => '50000002-0001-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0001-0000-0000-000000000004',
                'code'                     => 'RULE_NDA_CHURCH_INITIATED',
                'name'                     => 'Initiated Church Activities Capped Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 10.00,
                'max_points'               => 10.00,
                'rule_config'              => json_encode([
                    'role_points' => [
                        'organizer'   => 2.0,
                        'facilitator' => 3.0,
                        'head'        => 4.0,
                        'initiator'   => 5.0,
                    ],
                    'cap'         => 10.0,
                    'max_points'  => 10.0,
                ]),
                'authority_status'         => 'SYSTEM_OPERATIONALIZATION',
                'is_active'                => 1,
                'sort_order'               => 2,
            ],
            [
                'id'                       => '50000005-0001-0000-0000-000000000005',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f7073ee',
                'criterion_id'             => '50000002-0001-0000-0000-000000000003',
                'criterion_component_id'   => null,
                'code'                     => 'RULE_NDA_NONACAD_CITATIONS',
                'name'                     => 'Non-Academic Citations Formula Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 10.00,
                'max_points'               => 10.00,
                'rule_config'              => json_encode([
                    'points_per_item' => 2.0,
                    'cap'             => 10.0,
                    'max_points'      => 10.0,
                ]),
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
                'sort_order'               => 1,
            ],
        ]);
    }

    public function down()
    {
    }
}
