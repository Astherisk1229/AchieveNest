<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class RemediateSMCAward extends Migration
{
    public function up()
    {
        $db = $this->db;

        // 1. Reconcile Award Definition for SMC Award
        $db->table('award_definitions')
            ->where('id', '50000001-0000-0000-0000-000000000021')
            ->update([
                'code'                        => 'SMC_AWARD',
                'name'                        => 'Saint Marcellin Champagnat (SMC) Award',
                'category'                    => 'service',
                'description'                 => 'Premier graduating award recognizing exceptional Christian leadership, apostolic zeal, Marist spirituality, and service to Church and community.',
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
            ->where('id', '0f85b20c-a461-11f1-a155-08453f707321')
            ->countAllResults();

        if ($versionExists === 0) {
            $db->table('award_scoring_model_versions')->insert([
                'id'                          => '0f85b20c-a461-11f1-a155-08453f707321',
                'award_definition_id'         => '50000001-0000-0000-0000-000000000021',
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
                ->where('id', '0f85b20c-a461-11f1-a155-08453f707321')
                ->update([
                    'status'                      => 'published',
                    'candidate_threshold_percent' => 80.00,
                ]);
        }

        // 3. Clear Existing Sub-Records
        $critIds = array_column(
            $db->table('award_criteria')->select('id')->where('award_definition_id', '50000001-0000-0000-0000-000000000021')->get()->getResultArray(),
            'id'
        );

        if (! empty($critIds)) {
            $db->table('student_award_criterion_scores')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_scoring_rules')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_evidence_mapping_rules')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_criterion_components')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_criteria')->whereIn('id', $critIds)->delete();
        }

        // 4. Re-insert 5 Official Criteria
        $db->table('award_criteria')->insertBatch([
            [
                'id'                       => '50000002-0021-0000-0000-000000000001',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000021',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707321',
                'code'                     => 'CRIT_SMC_SCHOLASTIC',
                'name'                     => 'Scholastic Achievement',
                'weight'                   => 20.00,
                'max_points'               => 20.00,
                'sort_order'               => 1,
                'is_portfolio_computable'  => 0,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0021-0000-0000-000000000002',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000021',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707321',
                'code'                     => 'CRIT_SMC_LEADERSHIP',
                'name'                     => 'Leadership: On and Off Campus',
                'weight'                   => 20.00,
                'max_points'               => 20.00,
                'sort_order'               => 2,
                'is_portfolio_computable'  => 1,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0021-0000-0000-000000000003',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000021',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707321',
                'code'                     => 'CRIT_SMC_COMMUNITY',
                'name'                     => 'Community Involvement',
                'weight'                   => 30.00,
                'max_points'               => 30.00,
                'sort_order'               => 3,
                'is_portfolio_computable'  => 1,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0021-0000-0000-000000000004',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000021',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707321',
                'code'                     => 'CRIT_SMC_CITATIONS',
                'name'                     => 'Citations Received Other than Academics',
                'weight'                   => 10.00,
                'max_points'               => 10.00,
                'sort_order'               => 4,
                'is_portfolio_computable'  => 1,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0021-0000-0000-000000000005',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000021',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707321',
                'code'                     => 'CRIT_SMC_CHARACTER',
                'name'                     => 'Character',
                'weight'                   => 20.00,
                'max_points'               => 20.00,
                'sort_order'               => 5,
                'is_portfolio_computable'  => 0,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
        ]);

        // 5. Criterion Components
        $db->table('award_criterion_components')->insertBatch([
            [
                'id'               => '50000003-0021-0000-0000-000000000001',
                'criterion_id'     => '50000002-0021-0000-0000-000000000002',
                'code'             => 'COMP_SMC_LEAD_INVOLVE',
                'name'             => 'Leadership Involvement',
                'description'      => 'Highest applicable verified student governance or organization leadership position.',
                'max_points'       => 10.00,
                'sort_order'       => 1,
                'is_computable'    => 1,
                'authority_status' => 'OFFICIAL',
            ],
            [
                'id'               => '50000003-0021-0000-0000-000000000002',
                'criterion_id'     => '50000002-0021-0000-0000-000000000002',
                'code'             => 'COMP_SMC_LEAD_AWARDS',
                'name'             => 'Leadership Awards, Citations, and Seminars',
                'description'      => 'Cumulative verified leadership-related awards, citations, and leadership development seminars (capped at 10).',
                'max_points'       => 10.00,
                'sort_order'       => 2,
                'is_computable'    => 1,
                'authority_status' => 'OFFICIAL',
            ],
            [
                'id'               => '50000003-0021-0000-0000-000000000003',
                'criterion_id'     => '50000002-0021-0000-0000-000000000003',
                'code'             => 'COMP_SMC_COMM_INVOLVE',
                'name'             => 'Community & Ministry Involvement',
                'description'      => 'Count-based points for verified involvements in community outreach, civic extension, and parish/church ministries (capped at 15).',
                'max_points'       => 15.00,
                'sort_order'       => 1,
                'is_computable'    => 1,
                'authority_status' => 'OFFICIAL',
            ],
            [
                'id'               => '50000003-0021-0000-0000-000000000004',
                'criterion_id'     => '50000002-0021-0000-0000-000000000003',
                'code'             => 'COMP_SMC_COMM_INITIATED',
                'name'             => 'Initiated Community / Church Activities',
                'description'      => 'Role-based points for organizing, facilitating, or heading community outreach or ministry initiatives (capped at 15).',
                'max_points'       => 15.00,
                'sort_order'       => 2,
                'is_computable'    => 1,
                'authority_status' => 'OFFICIAL',
            ],
        ]);

        // 6. Evidence Mapping Rules
        $db->table('award_evidence_mapping_rules')->insertBatch([
            [
                'id'                       => '50000004-0021-0000-0000-000000000001',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707321',
                'criterion_id'             => '50000002-0021-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0021-0000-0000-000000000001',
                'rule_code'                => 'MAP_SMC_LEAD_POS',
                'name'                     => 'Leadership Positions Matrix Mapping',
                'portfolio_category_id'    => '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646',
                'portfolio_subcategory_id' => null,
                'priority'                 => 10,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0021-0000-0000-000000000002',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707321',
                'criterion_id'             => '50000002-0021-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0021-0000-0000-000000000002',
                'rule_code'                => 'MAP_SMC_LEAD_AWARDS',
                'name'                     => 'Leadership Citations & Awards Mapping',
                'portfolio_category_id'    => '448beadb-a254-4cb6-84fb-a3d5f4f8822e',
                'portfolio_subcategory_id' => null,
                'priority'                 => 20,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0021-0000-0000-000000000003',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707321',
                'criterion_id'             => '50000002-0021-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0021-0000-0000-000000000002',
                'rule_code'                => 'MAP_SMC_LEAD_SEMINARS',
                'name'                     => 'Leadership Development Seminars Mapping',
                'portfolio_category_id'    => '802de57b-54d7-4d38-9433-052ca9636380',
                'portfolio_subcategory_id' => null,
                'priority'                 => 30,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0021-0000-0000-000000000004',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707321',
                'criterion_id'             => '50000002-0021-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0021-0000-0000-000000000003',
                'rule_code'                => 'MAP_SMC_COMM_SERVICE',
                'name'                     => 'Community Service & Volunteerism Mapping',
                'portfolio_category_id'    => 'ace24637-66f7-4329-9451-ccc61e18eab9',
                'portfolio_subcategory_id' => null,
                'priority'                 => 10,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0021-0000-0000-000000000005',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707321',
                'criterion_id'             => '50000002-0021-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0021-0000-0000-000000000003',
                'rule_code'                => 'MAP_SMC_CHURCH_MINISTRY',
                'name'                     => 'Church & Ministry Involvement Mapping',
                'portfolio_category_id'    => '779a9653-d972-47ce-93dc-cb381150568b',
                'portfolio_subcategory_id' => null,
                'priority'                 => 20,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0021-0000-0000-000000000006',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707321',
                'criterion_id'             => '50000002-0021-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0021-0000-0000-000000000004',
                'rule_code'                => 'MAP_SMC_COMM_INITIATED',
                'name'                     => 'Initiated Community Activities Mapping',
                'portfolio_category_id'    => 'ace24637-66f7-4329-9451-ccc61e18eab9',
                'portfolio_subcategory_id' => null,
                'priority'                 => 10,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0021-0000-0000-000000000007',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707321',
                'criterion_id'             => '50000002-0021-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0021-0000-0000-000000000004',
                'rule_code'                => 'MAP_SMC_CHURCH_INITIATED',
                'name'                     => 'Initiated Ministry Activities Mapping',
                'portfolio_category_id'    => '779a9653-d972-47ce-93dc-cb381150568b',
                'portfolio_subcategory_id' => null,
                'priority'                 => 20,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0021-0000-0000-000000000008',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707321',
                'criterion_id'             => '50000002-0021-0000-0000-000000000004',
                'criterion_component_id'   => null,
                'rule_code'                => 'MAP_SMC_NONACAD_CITATIONS',
                'name'                     => 'Non-Academic Citations Mapping',
                'portfolio_category_id'    => '448beadb-a254-4cb6-84fb-a3d5f4f8822e',
                'portfolio_subcategory_id' => null,
                'priority'                 => 10,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
        ]);

        // 7. Scoring Rules
        $db->table('award_scoring_rules')->insertBatch([
            [
                'id'                       => '50000005-0021-0000-0000-000000000001',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707321',
                'criterion_id'             => '50000002-0021-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0021-0000-0000-000000000001',
                'code'                     => 'RULE_SMC_LEAD_INVOLVE',
                'name'                     => 'SMC Leadership Involvement Highest Level Rule',
                'rule_type'                => 'highest_only',
                'points'                   => 10.00,
                'max_points'               => 10.00,
                'rule_config'              => json_encode(['points_matrix' => ['university' => 10.0, 'college' => 8.0, 'club' => 6.0, 'year_level' => 4.0], 'max_points' => 10.0]),
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
                'sort_order'               => 1,
            ],
            [
                'id'                       => '50000005-0021-0000-0000-000000000002',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707321',
                'criterion_id'             => '50000002-0021-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0021-0000-0000-000000000002',
                'code'                     => 'RULE_SMC_LEAD_AWARDS',
                'name'                     => 'SMC Leadership Awards & Seminars Capped Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 10.00,
                'max_points'               => 10.00,
                'rule_config'              => json_encode(['points_per_record' => ['award_international' => 5.0, 'award_local' => 2.0, 'seminar' => 2.0], 'cap' => 10.0, 'max_points' => 10.0]),
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
                'sort_order'               => 2,
            ],
            [
                'id'                       => '50000005-0021-0000-0000-000000000003',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707321',
                'criterion_id'             => '50000002-0021-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0021-0000-0000-000000000003',
                'code'                     => 'RULE_SMC_COMM_INVOLVE',
                'name'                     => 'SMC Community & Ministry Count Matrix Rule',
                'rule_type'                => 'matrix_mapping',
                'points'                   => 15.00,
                'max_points'               => 15.00,
                'rule_config'              => json_encode(['count_matrix' => ['1' => 3.0, '2' => 6.0, '3' => 9.0, '4' => 12.0, '5' => 15.0], 'max_points' => 15.0]),
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
                'sort_order'               => 1,
            ],
            [
                'id'                       => '50000005-0021-0000-0000-000000000004',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707321',
                'criterion_id'             => '50000002-0021-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0021-0000-0000-000000000004',
                'code'                     => 'RULE_SMC_COMM_INITIATED',
                'name'                     => 'SMC Initiated Community Activities Capped Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 15.00,
                'max_points'               => 15.00,
                'rule_config'              => json_encode(['role_points' => ['organizer' => 3.0, 'facilitator' => 4.0, 'head' => 6.0, 'initiator' => 8.0], 'cap' => 15.0, 'max_points' => 15.0]),
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
                'sort_order'               => 2,
            ],
            [
                'id'                       => '50000005-0021-0000-0000-000000000005',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707321',
                'criterion_id'             => '50000002-0021-0000-0000-000000000004',
                'criterion_component_id'   => null,
                'code'                     => 'RULE_SMC_NONACAD_CITATIONS',
                'name'                     => 'SMC Non-Academic Citations Formula Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 10.00,
                'max_points'               => 10.00,
                'rule_config'              => json_encode(['points_per_item' => 2.0, 'cap' => 10.0, 'max_points' => 10.0]),
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
