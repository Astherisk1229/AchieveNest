<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class RemediateLeadershipAward extends Migration
{
    public function up()
    {
        $db = $this->db;

        // 1. Reconcile Award Definition for Leadership Award
        $db->table('award_definitions')
            ->where('id', '50000001-0000-0000-0000-000000000022')
            ->update([
                'code'                        => 'LEADERSHIP_AWARD',
                'name'                        => 'Leadership Award',
                'category'                    => 'leadership',
                'description'                 => 'Premier graduating award recognizing exemplary executive student governance, organizational stewardship, civic involvement, and church community leadership.',
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
            ->where('id', '0f85b20c-a461-11f1-a155-08453f707322')
            ->countAllResults();

        if ($versionExists === 0) {
            $db->table('award_scoring_model_versions')->insert([
                'id'                          => '0f85b20c-a461-11f1-a155-08453f707322',
                'award_definition_id'         => '50000001-0000-0000-0000-000000000022',
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
                ->where('id', '0f85b20c-a461-11f1-a155-08453f707322')
                ->update([
                    'status'                      => 'published',
                    'candidate_threshold_percent' => 80.00,
                ]);
        }

        // 3. Clear Existing Sub-Records
        $critIds = array_column(
            $db->table('award_criteria')->select('id')->where('award_definition_id', '50000001-0000-0000-0000-000000000022')->get()->getResultArray(),
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
                'id'                       => '50000002-0022-0000-0000-000000000001',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000022',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707322',
                'code'                     => 'CRIT_LEAD_SCHOLASTIC',
                'name'                     => 'Scholastic Achievement',
                'weight'                   => 20.00,
                'max_points'               => 20.00,
                'sort_order'               => 1,
                'is_portfolio_computable'  => 0,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0022-0000-0000-000000000002',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000022',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707322',
                'code'                     => 'CRIT_LEAD_CAMPUS_LEAD',
                'name'                     => 'Leadership: On and Off Campus',
                'weight'                   => 30.00,
                'max_points'               => 30.00,
                'sort_order'               => 2,
                'is_portfolio_computable'  => 1,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0022-0000-0000-000000000003',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000022',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707322',
                'code'                     => 'CRIT_LEAD_COMMUNITY',
                'name'                     => 'Community Involvement',
                'weight'                   => 20.00,
                'max_points'               => 20.00,
                'sort_order'               => 3,
                'is_portfolio_computable'  => 1,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0022-0000-0000-000000000004',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000022',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707322',
                'code'                     => 'CRIT_LEAD_CHARACTER',
                'name'                     => 'Character',
                'weight'                   => 20.00,
                'max_points'               => 20.00,
                'sort_order'               => 4,
                'is_portfolio_computable'  => 0,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0022-0000-0000-000000000005',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000022',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707322',
                'code'                     => 'CRIT_LEAD_INTERVIEW',
                'name'                     => 'Interview',
                'weight'                   => 10.00,
                'max_points'               => 10.00,
                'sort_order'               => 5,
                'is_portfolio_computable'  => 0,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
        ]);

        // 5. Criterion Components
        $db->table('award_criterion_components')->insertBatch([
            [
                'id'               => '50000003-0022-0000-0000-000000000001',
                'criterion_id'     => '50000002-0022-0000-0000-000000000002',
                'code'             => 'COMP_LEAD_INVOLVE',
                'name'             => 'Leadership Involvement',
                'description'      => 'Highest applicable verified student governance or organization leadership position.',
                'max_points'       => 10.00,
                'sort_order'       => 1,
                'is_computable'    => 1,
                'authority_status' => 'OFFICIAL',
            ],
            [
                'id'               => '50000003-0022-0000-0000-000000000002',
                'criterion_id'     => '50000002-0022-0000-0000-000000000002',
                'code'             => 'COMP_LEAD_AWARDS',
                'name'             => 'Leadership Awards, Citations, and Seminars',
                'description'      => 'Cumulative verified leadership awards (5 intl, 3 local) and leadership seminars (2 pts, capped at 10).',
                'max_points'       => 10.00,
                'sort_order'       => 2,
                'is_computable'    => 1,
                'authority_status' => 'OFFICIAL',
            ],
            [
                'id'               => '50000003-0022-0000-0000-000000000003',
                'criterion_id'     => '50000002-0022-0000-0000-000000000002',
                'code'             => 'COMP_LEAD_CIVIC',
                'name'             => 'Civic Involvement',
                'description'      => 'Highest applicable verified off-campus civic involvement level (Barangay=10, Municipal/Provincial/National=8).',
                'max_points'       => 10.00,
                'sort_order'       => 3,
                'is_computable'    => 1,
                'authority_status' => 'OFFICIAL',
            ],
            [
                'id'               => '50000003-0022-0000-0000-000000000004',
                'criterion_id'     => '50000002-0022-0000-0000-000000000003',
                'code'             => 'COMP_LEAD_CHURCH_MINISTRY',
                'name'             => 'Involvement in Church Ministries / Organizations',
                'description'      => 'Verified church ministry presence: School-based=4, Community-based=3, Church Org=3 (capped at 10).',
                'max_points'       => 10.00,
                'sort_order'       => 1,
                'is_computable'    => 1,
                'authority_status' => 'OFFICIAL',
            ],
            [
                'id'               => '50000003-0022-0000-0000-000000000005',
                'criterion_id'     => '50000002-0022-0000-0000-000000000003',
                'code'             => 'COMP_LEAD_CHURCH_INITIATED',
                'name'             => 'Initiated Church-Related Activities',
                'description'      => 'Verified leadership role in church-related activities: School-based=6, Community-based=4 (capped at 10).',
                'max_points'       => 10.00,
                'sort_order'       => 2,
                'is_computable'    => 1,
                'authority_status' => 'OFFICIAL',
            ],
        ]);

        // 6. Evidence Mapping Rules
        $db->table('award_evidence_mapping_rules')->insertBatch([
            [
                'id'                       => '50000004-0022-0000-0000-000000000001',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707322',
                'criterion_id'             => '50000002-0022-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0022-0000-0000-000000000001',
                'rule_code'                => 'MAP_LEAD_POS',
                'name'                     => 'Leadership Positions Matrix Mapping',
                'portfolio_category_id'    => '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646',
                'portfolio_subcategory_id' => null,
                'priority'                 => 10,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0022-0000-0000-000000000002',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707322',
                'criterion_id'             => '50000002-0022-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0022-0000-0000-000000000002',
                'rule_code'                => 'MAP_LEAD_AWARDS',
                'name'                     => 'Leadership Citations & Awards Mapping',
                'portfolio_category_id'    => '448beadb-a254-4cb6-84fb-a3d5f4f8822e',
                'portfolio_subcategory_id' => null,
                'priority'                 => 20,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0022-0000-0000-000000000003',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707322',
                'criterion_id'             => '50000002-0022-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0022-0000-0000-000000000002',
                'rule_code'                => 'MAP_LEAD_SEMINARS',
                'name'                     => 'Leadership Development Seminars Mapping',
                'portfolio_category_id'    => '802de57b-54d7-4d38-9433-052ca9636380',
                'portfolio_subcategory_id' => null,
                'priority'                 => 30,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0022-0000-0000-000000000004',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707322',
                'criterion_id'             => '50000002-0022-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0022-0000-0000-000000000003',
                'rule_code'                => 'MAP_LEAD_CIVIC',
                'name'                     => 'Civic Involvement Mapping',
                'portfolio_category_id'    => 'ace24637-66f7-4329-9451-ccc61e18eab9',
                'portfolio_subcategory_id' => null,
                'priority'                 => 10,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0022-0000-0000-000000000005',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707322',
                'criterion_id'             => '50000002-0022-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0022-0000-0000-000000000004',
                'rule_code'                => 'MAP_LEAD_CHURCH_MINISTRY',
                'name'                     => 'Church Ministries Involvement Mapping',
                'portfolio_category_id'    => '779a9653-d972-47ce-93dc-cb381150568b',
                'portfolio_subcategory_id' => null,
                'priority'                 => 10,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0022-0000-0000-000000000006',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707322',
                'criterion_id'             => '50000002-0022-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0022-0000-0000-000000000005',
                'rule_code'                => 'MAP_LEAD_CHURCH_INITIATED',
                'name'                     => 'Initiated Church Activities Mapping',
                'portfolio_category_id'    => '779a9653-d972-47ce-93dc-cb381150568b',
                'portfolio_subcategory_id' => null,
                'priority'                 => 20,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
        ]);

        // 7. Scoring Rules
        $db->table('award_scoring_rules')->insertBatch([
            [
                'id'                       => '50000005-0022-0000-0000-000000000001',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707322',
                'criterion_id'             => '50000002-0022-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0022-0000-0000-000000000001',
                'code'                     => 'RULE_LEAD_INVOLVE',
                'name'                     => 'Leadership Involvement Highest Level Rule',
                'rule_type'                => 'highest_only',
                'points'                   => 10.00,
                'max_points'               => 10.00,
                'rule_config'              => json_encode(['points_matrix' => ['university' => 10.0, 'college' => 8.0, 'club' => 6.0, 'year_level' => 4.0], 'max_points' => 10.0]),
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
                'sort_order'               => 1,
            ],
            [
                'id'                       => '50000005-0022-0000-0000-000000000002',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707322',
                'criterion_id'             => '50000002-0022-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0022-0000-0000-000000000002',
                'code'                     => 'RULE_LEAD_AWARDS',
                'name'                     => 'Leadership Awards & Seminars Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 10.00,
                'max_points'               => 10.00,
                'rule_config'              => json_encode(['points_per_record' => ['award_international' => 5.0, 'award_local' => 3.0, 'seminar' => 2.0], 'cap' => 10.0, 'max_points' => 10.0]),
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
                'sort_order'               => 2,
            ],
            [
                'id'                       => '50000005-0022-0000-0000-000000000003',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707322',
                'criterion_id'             => '50000002-0022-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0022-0000-0000-000000000003',
                'code'                     => 'RULE_LEAD_CIVIC',
                'name'                     => 'Civic Involvement Highest Level Rule',
                'rule_type'                => 'highest_only',
                'points'                   => 10.00,
                'max_points'               => 10.00,
                'rule_config'              => json_encode(['points_matrix' => ['barangay' => 10.0, 'municipal' => 8.0, 'provincial' => 8.0, 'national' => 8.0], 'max_points' => 10.0]),
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
                'sort_order'               => 3,
            ],
            [
                'id'                       => '50000005-0022-0000-0000-000000000004',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707322',
                'criterion_id'             => '50000002-0022-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0022-0000-0000-000000000004',
                'code'                     => 'RULE_LEAD_CHURCH_MINISTRY',
                'name'                     => 'Church Ministries Involvement Bucket Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 10.00,
                'max_points'               => 10.00,
                'rule_config'              => json_encode(['context_points' => ['school' => 4.0, 'community' => 3.0, 'organization' => 3.0], 'cap' => 10.0, 'max_points' => 10.0]),
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
                'sort_order'               => 1,
            ],
            [
                'id'                       => '50000005-0022-0000-0000-000000000005',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707322',
                'criterion_id'             => '50000002-0022-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0022-0000-0000-000000000005',
                'code'                     => 'RULE_LEAD_CHURCH_INITIATED',
                'name'                     => 'Initiated Church Activities Context Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 10.00,
                'max_points'               => 10.00,
                'rule_config'              => json_encode(['context_points' => ['school' => 6.0, 'community' => 4.0], 'cap' => 10.0, 'max_points' => 10.0]),
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
