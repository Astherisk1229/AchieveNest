<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class RemediateMemberOfTheYearAward extends Migration
{
    public function up()
    {
        $db = $this->db;

        // 1. Reconcile Award Definition for Outstanding Member of the Year
        $db->table('award_definitions')
            ->where('id', '50000001-0000-0000-0000-000000000029')
            ->update([
                'code'                        => 'MEMBER_OF_THE_YEAR',
                'name'                        => 'Outstanding Member of the Year',
                'category'                    => 'organization',
                'description'                 => 'Premier annual institutional award honoring an active member of a recognized student organization who has manifested outstanding membership commitment, significant contribution, leadership, and moral character.',
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
            ->where('id', '0f85b20c-a461-11f1-a155-08453f707329')
            ->countAllResults();

        if ($versionExists === 0) {
            $db->table('award_scoring_model_versions')->insert([
                'id'                          => '0f85b20c-a461-11f1-a155-08453f707329',
                'award_definition_id'         => '50000001-0000-0000-0000-000000000029',
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
                ->where('id', '0f85b20c-a461-11f1-a155-08453f707329')
                ->update([
                    'status'                      => 'published',
                    'candidate_threshold_percent' => 80.00,
                    'graduating_only'              => 0,
                    'gender_requirement'          => null,
                ]);
        }

        // 3. Clear Existing Sub-Records
        $critIds = array_column(
            $db->table('award_criteria')->select('id')->where('award_definition_id', '50000001-0000-0000-0000-000000000029')->get()->getResultArray(),
            'id'
        );

        if (! empty($critIds)) {
            $db->table('student_award_criterion_scores')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_scoring_rules')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_evidence_mapping_rules')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_criterion_components')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_criteria')->whereIn('id', $critIds)->delete();
        }

        // 4. Re-insert 5 Official Criteria (Total 100 pts, Computable 40 pts)
        $db->table('award_criteria')->insertBatch([
            [
                'id'                       => '50000002-0029-0000-0000-000000000001',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000029',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707329',
                'code'                     => 'CRIT_MEMBER_YR_SCHOLASTIC',
                'name'                     => 'Scholastic Achievement',
                'weight'                   => 15.00,
                'max_points'               => 15.00,
                'sort_order'               => 1,
                'is_portfolio_computable'  => 0,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0029-0000-0000-000000000002',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000029',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707329',
                'code'                     => 'CRIT_MEMBER_YR_MEMBERSHIP_QUALITY',
                'name'                     => 'Quality of Membership Involvement',
                'weight'                   => 40.00,
                'max_points'               => 30.00,
                'sort_order'               => 2,
                'is_portfolio_computable'  => 1,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0029-0000-0000-000000000003',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000029',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707329',
                'code'                     => 'CRIT_MEMBER_YR_LEADERSHIP',
                'name'                     => 'Leadership',
                'weight'                   => 10.00,
                'max_points'               => 10.00,
                'sort_order'               => 3,
                'is_portfolio_computable'  => 1,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0029-0000-0000-000000000004',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000029',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707329',
                'code'                     => 'CRIT_MEMBER_YR_CHARACTER',
                'name'                     => 'Character',
                'weight'                   => 20.00,
                'max_points'               => 20.00,
                'sort_order'               => 4,
                'is_portfolio_computable'  => 0,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0029-0000-0000-000000000005',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000029',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707329',
                'code'                     => 'CRIT_MEMBER_YR_INTERVIEW',
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
                'id'               => '50000003-0029-0000-0000-000000000001',
                'criterion_id'     => '50000002-0029-0000-0000-000000000002',
                'code'             => 'COMP_MEMBER_YR_INVOLVEMENT',
                'name'             => 'Membership Involvement and Participation',
                'description'      => 'Documented participation: activity=2, outreach=3, extra/co-curricular=3, committee=4, sustained=5 (capped at 20).',
                'max_points'       => 20.00,
                'sort_order'       => 1,
                'is_computable'    => 1,
                'authority_status' => 'OFFICIAL',
            ],
            [
                'id'               => '50000003-0029-0000-0000-000000000002',
                'criterion_id'     => '50000002-0029-0000-0000-000000000002',
                'code'             => 'COMP_MEMBER_YR_CONTRIBUTION',
                'name'             => 'Important Contribution to the Organization',
                'description'      => 'Documented responsibility: support=2, committee responsibility=3, organizer=4, major project=5 (capped at 10).',
                'max_points'       => 10.00,
                'sort_order'       => 2,
                'is_computable'    => 1,
                'authority_status' => 'OFFICIAL',
            ],
            [
                'id'               => '50000003-0029-0000-0000-000000000003',
                'criterion_id'     => '50000002-0029-0000-0000-000000000003',
                'code'             => 'COMP_MEMBER_YR_LEAD_INVOLVEMENT',
                'name'             => 'Leadership Involvement',
                'description'      => 'Verified leadership roles: SSG/Collegiate Council=3, Club/Org=2 (capped at 5).',
                'max_points'       => 5.00,
                'sort_order'       => 1,
                'is_computable'    => 1,
                'authority_status' => 'OFFICIAL',
            ],
            [
                'id'               => '50000003-0029-0000-0000-000000000004',
                'criterion_id'     => '50000002-0029-0000-0000-000000000003',
                'code'             => 'COMP_MEMBER_YR_LEAD_AWARDS',
                'name'             => 'Leadership Awards & Citations',
                'description'      => 'Verified leadership recognition: Int/Nat Award=3, Local Award/Citation=2 (capped at 5).',
                'max_points'       => 5.00,
                'sort_order'       => 2,
                'is_computable'    => 1,
                'authority_status' => 'OFFICIAL',
            ],
        ]);

        // 6. Evidence Mapping Rules
        $db->table('award_evidence_mapping_rules')->insertBatch([
            [
                'id'                       => '50000004-0029-0000-0000-000000000001',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707329',
                'criterion_id'             => '50000002-0029-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0029-0000-0000-000000000001',
                'rule_code'                => 'MAP_MEMBER_YR_INVOLVEMENT',
                'name'                     => 'Organization Membership & Participation Mapping',
                'portfolio_category_id'    => 'c9a6d837-78f4-4516-b2db-d438ae717be5',
                'portfolio_subcategory_id' => null,
                'priority'                 => 10,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0029-0000-0000-000000000002',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707329',
                'criterion_id'             => '50000002-0029-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0029-0000-0000-000000000002',
                'rule_code'                => 'MAP_MEMBER_YR_CONTRIBUTION',
                'name'                     => 'Organization Contribution Mapping',
                'portfolio_category_id'    => 'c9a6d837-78f4-4516-b2db-d438ae717be5',
                'portfolio_subcategory_id' => null,
                'priority'                 => 20,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0029-0000-0000-000000000003',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707329',
                'criterion_id'             => '50000002-0029-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0029-0000-0000-000000000003',
                'rule_code'                => 'MAP_MEMBER_YR_LEAD_POS',
                'name'                     => 'Leadership Position Mapping',
                'portfolio_category_id'    => '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646',
                'portfolio_subcategory_id' => null,
                'priority'                 => 10,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0029-0000-0000-000000000004',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707329',
                'criterion_id'             => '50000002-0029-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0029-0000-0000-000000000004',
                'rule_code'                => 'MAP_MEMBER_YR_LEAD_AWARDS',
                'name'                     => 'Leadership Citations & Awards Mapping',
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
                'id'                       => '50000005-0029-0000-0000-000000000001',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707329',
                'criterion_id'             => '50000002-0029-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0029-0000-0000-000000000001',
                'code'                     => 'RULE_MEMBER_YR_INVOLVEMENT',
                'name'                     => 'Membership Involvement Participation Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 20.00,
                'max_points'               => 20.00,
                'rule_config'              => json_encode(['type_points' => ['activity_program' => 2.0, 'outreach_extension' => 3.0, 'extra_co_curricular' => 3.0, 'committee_involvement' => 4.0, 'sustained_participation' => 5.0], 'cap' => 20.0, 'max_points' => 20.0]),
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
                'sort_order'               => 1,
            ],
            [
                'id'                       => '50000005-0029-0000-0000-000000000002',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707329',
                'criterion_id'             => '50000002-0029-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0029-0000-0000-000000000002',
                'code'                     => 'RULE_MEMBER_YR_CONTRIBUTION',
                'name'                     => 'Important Contribution Responsibility Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 10.00,
                'max_points'               => 10.00,
                'rule_config'              => json_encode(['role_points' => ['contributor_support' => 2.0, 'committee_responsibility' => 3.0, 'facilitator_organizer' => 4.0, 'major_project_responsibility' => 5.0], 'cap' => 10.0, 'max_points' => 10.0]),
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
                'sort_order'               => 2,
            ],
            [
                'id'                       => '50000005-0029-0000-0000-000000000003',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707329',
                'criterion_id'             => '50000002-0029-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0029-0000-0000-000000000003',
                'code'                     => 'RULE_MEMBER_YR_LEAD_INVOLVEMENT',
                'name'                     => 'Leadership Involvement Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 5.00,
                'max_points'               => 5.00,
                'rule_config'              => json_encode(['level_points' => ['ssg_collegiate_council' => 3.0, 'club_organization' => 2.0], 'cap' => 5.0, 'max_points' => 5.0]),
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
                'sort_order'               => 1,
            ],
            [
                'id'                       => '50000005-0029-0000-0000-000000000004',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707329',
                'criterion_id'             => '50000002-0029-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0029-0000-0000-000000000004',
                'code'                     => 'RULE_MEMBER_YR_LEAD_AWARDS',
                'name'                     => 'Leadership Citations & Awards Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 5.00,
                'max_points'               => 5.00,
                'rule_config'              => json_encode(['type_points' => ['international_national_award' => 3.0, 'local_award_citation' => 2.0], 'cap' => 5.0, 'max_points' => 5.0]),
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
