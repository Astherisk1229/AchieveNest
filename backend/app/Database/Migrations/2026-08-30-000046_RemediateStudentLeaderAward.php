<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class RemediateStudentLeaderAward extends Migration
{
    public function up()
    {
        $db = $this->db;

        // 1. Reconcile Award Definition for Outstanding Student Leader of the Year
        $db->table('award_definitions')
            ->where('id', '50000001-0000-0000-0000-000000000028')
            ->update([
                'code'                        => 'STUDENT_LEADER_OF_THE_YEAR',
                'name'                        => 'Outstanding Student Leader of the Year',
                'category'                    => 'leadership',
                'description'                 => 'Premier annual institutional leadership award honoring an exceptional student leader who manifests moral character, satisfactory academic performance with no failing grades, university/community impact, and organizational excellence.',
                'authority_status'            => 'OFFICIAL',
                'source_fidelity_status'      => 'VERIFIED',
                'is_catalog_visible'          => 1,
                'graduating_only'              => 0,
                'gender_restriction'          => null,
                'candidate_threshold_percent' => 80.00,
                'status'                      => 'active',
                'active_scoring_version'      => '1.0',
            ]);

        // 2. Published Scoring Model Version v1.0
        $versionExists = $db->table('award_scoring_model_versions')
            ->where('id', '0f85b20c-a461-11f1-a155-08453f707328')
            ->countAllResults();

        if ($versionExists === 0) {
            $db->table('award_scoring_model_versions')->insert([
                'id'                          => '0f85b20c-a461-11f1-a155-08453f707328',
                'award_definition_id'         => '50000001-0000-0000-0000-000000000028',
                'version_number'              => '1.0',
                'version_label'               => 'v1.0 Published',
                'status'                      => 'published',
                'candidate_threshold_percent' => 80.00,
                'graduating_only'              => 0,
                'gender_requirement'          => null,
                'authority_status'            => 'OFFICIAL',
                'published_at'                => '2026-08-30 00:00:00',
            ]);
        } else {
            $db->table('award_scoring_model_versions')
                ->where('id', '0f85b20c-a461-11f1-a155-08453f707328')
                ->update([
                    'status'                      => 'published',
                    'candidate_threshold_percent' => 80.00,
                    'graduating_only'              => 0,
                    'gender_requirement'          => null,
                ]);
        }

        // 3. Clear Existing Sub-Records
        $critIds = array_column(
            $db->table('award_criteria')->select('id')->where('award_definition_id', '50000001-0000-0000-0000-000000000028')->get()->getResultArray(),
            'id'
        );

        if (! empty($critIds)) {
            $db->table('student_award_criterion_scores')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_scoring_rules')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_evidence_mapping_rules')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_criterion_components')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_criteria')->whereIn('id', $critIds)->delete();
        }

        // 4. Re-insert 5 Official Criteria (Total 100 pts, Computable 50 pts)
        $db->table('award_criteria')->insertBatch([
            [
                'id'                       => '50000002-0028-0000-0000-000000000001',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000028',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707328',
                'code'                     => 'CRIT_LEADER_YR_SCHOLASTIC',
                'name'                     => 'Scholastic Achievement',
                'weight'                   => 15.00,
                'max_points'               => 15.00,
                'sort_order'               => 1,
                'is_portfolio_computable'  => 0,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0028-0000-0000-000000000002',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000028',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707328',
                'code'                     => 'CRIT_LEADER_YR_LEADERSHIP',
                'name'                     => 'Leadership: On and Off Campus',
                'weight'                   => 40.00,
                'max_points'               => 40.00,
                'sort_order'               => 2,
                'is_portfolio_computable'  => 1,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0028-0000-0000-000000000003',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000028',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707328',
                'code'                     => 'CRIT_LEADER_YR_COMMUNITY',
                'name'                     => 'Community Involvement',
                'weight'                   => 10.00,
                'max_points'               => 10.00,
                'sort_order'               => 3,
                'is_portfolio_computable'  => 1,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0028-0000-0000-000000000004',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000028',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707328',
                'code'                     => 'CRIT_LEADER_YR_CHARACTER',
                'name'                     => 'Character',
                'weight'                   => 20.00,
                'max_points'               => 20.00,
                'sort_order'               => 4,
                'is_portfolio_computable'  => 0,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0028-0000-0000-000000000005',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000028',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707328',
                'code'                     => 'CRIT_LEADER_YR_INTERVIEW',
                'name'                     => 'Interview',
                'weight'                   => 15.00,
                'max_points'               => 15.00,
                'sort_order'               => 5,
                'is_portfolio_computable'  => 0,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
        ]);

        // 5. Criterion Components
        $db->table('award_criterion_components')->insertBatch([
            [
                'id'               => '50000003-0028-0000-0000-000000000001',
                'criterion_id'     => '50000002-0028-0000-0000-000000000002',
                'code'             => 'COMP_LEADER_YR_INVOLVEMENT',
                'name'             => 'Leadership Involvement',
                'description'      => 'Accumulated verified leadership roles: SSG=12, Collegiate Council=8, Club=6, Year Level=4 (capped at 30).',
                'max_points'       => 30.00,
                'sort_order'       => 1,
                'is_computable'    => 1,
                'authority_status' => 'OFFICIAL',
            ],
            [
                'id'               => '50000003-0028-0000-0000-000000000002',
                'criterion_id'     => '50000002-0028-0000-0000-000000000002',
                'code'             => 'COMP_LEADER_YR_AWARDS_SEMINARS',
                'name'             => 'Leadership Awards, Citations, and Seminars',
                'description'      => 'Accumulated verified honors: Int/Nat Award=4, Local Award=2, Citation=2, Seminar=2 (capped at 10).',
                'max_points'       => 10.00,
                'sort_order'       => 2,
                'is_computable'    => 1,
                'authority_status' => 'OFFICIAL',
            ],
            [
                'id'               => '50000003-0028-0000-0000-000000000003',
                'criterion_id'     => '50000002-0028-0000-0000-000000000003',
                'code'             => 'COMP_LEADER_YR_COMMUNITY',
                'name'             => 'Community Involvement Buckets',
                'description'      => 'Verified community engagement: School/Univ=4, Community=3, Church=3 (presence-based, capped at 10).',
                'max_points'       => 10.00,
                'sort_order'       => 1,
                'is_computable'    => 1,
                'authority_status' => 'OFFICIAL',
            ],
        ]);

        // 6. Evidence Mapping Rules
        $db->table('award_evidence_mapping_rules')->insertBatch([
            [
                'id'                       => '50000004-0028-0000-0000-000000000001',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707328',
                'criterion_id'             => '50000002-0028-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0028-0000-0000-000000000001',
                'rule_code'                => 'MAP_LEADER_YR_POS',
                'name'                     => 'Leadership Position Mapping',
                'portfolio_category_id'    => '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646',
                'portfolio_subcategory_id' => null,
                'priority'                 => 10,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0028-0000-0000-000000000002',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707328',
                'criterion_id'             => '50000002-0028-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0028-0000-0000-000000000002',
                'rule_code'                => 'MAP_LEADER_YR_AWARDS',
                'name'                     => 'Leadership Honors & Citations Mapping',
                'portfolio_category_id'    => '448beadb-a254-4cb6-84fb-a3d5f4f8822e',
                'portfolio_subcategory_id' => null,
                'priority'                 => 10,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0028-0000-0000-000000000003',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707328',
                'criterion_id'             => '50000002-0028-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0028-0000-0000-000000000002',
                'rule_code'                => 'MAP_LEADER_YR_SEMINARS',
                'name'                     => 'Leadership Seminars & Training Mapping',
                'portfolio_category_id'    => '802de57b-54d7-4d38-9433-052ca9636380',
                'portfolio_subcategory_id' => null,
                'priority'                 => 20,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0028-0000-0000-000000000004',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707328',
                'criterion_id'             => '50000002-0028-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0028-0000-0000-000000000003',
                'rule_code'                => 'MAP_LEADER_YR_COMMUNITY',
                'name'                     => 'Community Service & Volunteerism Mapping',
                'portfolio_category_id'    => 'ace24637-66f7-4329-9451-ccc61e18eab9',
                'portfolio_subcategory_id' => null,
                'priority'                 => 10,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
        ]);

        // 7. Scoring Rules
        $db->table('award_scoring_rules')->insertBatch([
            [
                'id'                       => '50000005-0028-0000-0000-000000000001',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707328',
                'criterion_id'             => '50000002-0028-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0028-0000-0000-000000000001',
                'code'                     => 'RULE_LEADER_YR_INVOLVEMENT',
                'name'                     => 'Leadership Involvement Accumulation Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 30.00,
                'max_points'               => 30.00,
                'rule_config'              => json_encode(['level_points' => ['ssg_university' => 12.0, 'collegiate_council' => 8.0, 'club_organization' => 6.0, 'year_level' => 4.0], 'cap' => 30.0, 'max_points' => 30.0]),
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
                'sort_order'               => 1,
            ],
            [
                'id'                       => '50000005-0028-0000-0000-000000000002',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707328',
                'criterion_id'             => '50000002-0028-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0028-0000-0000-000000000002',
                'code'                     => 'RULE_LEADER_YR_AWARDS_SEMINARS',
                'name'                     => 'Leadership Awards & Seminars Matrix Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 10.00,
                'max_points'               => 10.00,
                'rule_config'              => json_encode(['type_points' => ['international_national_award' => 4.0, 'local_award' => 2.0, 'leadership_citation' => 2.0, 'leadership_seminar' => 2.0], 'cap' => 10.0, 'max_points' => 10.0]),
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
                'sort_order'               => 2,
            ],
            [
                'id'                       => '50000005-0028-0000-0000-000000000003',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707328',
                'criterion_id'             => '50000002-0028-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0028-0000-0000-000000000003',
                'code'                     => 'RULE_LEADER_YR_COMMUNITY',
                'name'                     => 'Community Involvement Presence Buckets Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 10.00,
                'max_points'               => 10.00,
                'rule_config'              => json_encode(['bucket_points' => ['school_university_based' => 4.0, 'community_based' => 3.0, 'church_based' => 3.0], 'cap' => 10.0, 'max_points' => 10.0]),
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
