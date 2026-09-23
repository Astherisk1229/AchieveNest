<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class RemediatePerformerOfTheYearFemaleAward extends Migration
{
    public function up()
    {
        $db = $this->db;

        // 1. Reconcile Award Definition for Outstanding Performer of the Year - Female
        $db->table('award_definitions')
            ->where('id', '50000001-0000-0000-0000-000000000033')
            ->update([
                'code'                        => 'PERFORMER_OF_THE_YEAR_FEMALE',
                'name'                        => 'Outstanding Performer of the Year - Female',
                'category'                    => 'performing_arts',
                'description'                 => 'Proposed AchieveNest portfolio-based model for annual recognition of an outstanding female student performer who has demonstrated excellence in socio-cultural competitions, musical, dance, or theatrical arts while maintaining academic standing.',
                'authority_status'            => 'PROPOSED',
                'source_fidelity_status'      => 'VERIFIED',
                'is_catalog_visible'          => 1,
                'graduating_only'              => 0,
                'gender_restriction'          => 'female',
                'candidate_threshold_percent' => 80.00,
                'status'                      => 'active',
                'active_scoring_version'      => '1.0',
            ]);

        // 2. Published Scoring Model Version v1.0
        $versionExists = $db->table('award_scoring_model_versions')
            ->where('id', '0f85b20c-a461-11f1-a155-08453f707333')
            ->countAllResults();

        if ($versionExists === 0) {
            $db->table('award_scoring_model_versions')->insert([
                'id'                          => '0f85b20c-a461-11f1-a155-08453f707333',
                'award_definition_id'         => '50000001-0000-0000-0000-000000000033',
                'version_number'              => '1.0',
                'version_label'               => 'v1.0 Proposed Published',
                'status'                      => 'published',
                'candidate_threshold_percent' => 80.00,
                'graduating_only'              => 0,
                'gender_requirement'          => 'female',
                'authority_status'            => 'PROPOSED',
                'published_at'                => '2026-08-30 00:00:00',
            ]);
        } else {
            $db->table('award_scoring_model_versions')
                ->where('id', '0f85b20c-a461-11f1-a155-08453f707333')
                ->update([
                    'status'                      => 'published',
                    'candidate_threshold_percent' => 80.00,
                    'graduating_only'              => 0,
                    'gender_requirement'          => 'female',
                    'authority_status'            => 'PROPOSED',
                ]);
        }

        // 3. Clear Existing Sub-Records
        $critIds = array_column(
            $db->table('award_criteria')->select('id')->where('award_definition_id', '50000001-0000-0000-0000-000000000033')->get()->getResultArray(),
            'id'
        );

        if (! empty($critIds)) {
            $db->table('student_award_criterion_scores')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_scoring_rules')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_evidence_mapping_rules')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_criterion_components')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_criteria')->whereIn('id', $critIds)->delete();
        }

        // 4. Re-insert 3 Proposed Criteria (Total 55 pts Computable)
        $db->table('award_criteria')->insertBatch([
            [
                'id'                       => '50000002-0033-0000-0000-000000000001',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000033',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707333',
                'code'                     => 'CRIT_PERFORMER_F_SKILLS',
                'name'                     => 'Socio-Cultural Skills Evidence',
                'weight'                   => 20.00,
                'max_points'               => 20.00,
                'sort_order'               => 1,
                'is_portfolio_computable'  => 1,
                'authority_status'         => 'PROPOSED',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0033-0000-0000-000000000002',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000033',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707333',
                'code'                     => 'CRIT_PERFORMER_F_PARTICIPATION',
                'name'                     => 'Participation in Socio-Cultural Meets / Competitions',
                'weight'                   => 20.00,
                'max_points'               => 20.00,
                'sort_order'               => 2,
                'is_portfolio_computable'  => 1,
                'authority_status'         => 'PROPOSED',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0033-0000-0000-000000000003',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000033',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707333',
                'code'                     => 'CRIT_PERFORMER_F_AWARDS',
                'name'                     => 'Awards Received',
                'weight'                   => 15.00,
                'max_points'               => 15.00,
                'sort_order'               => 3,
                'is_portfolio_computable'  => 1,
                'authority_status'         => 'PROPOSED',
                'is_published'             => 1,
            ],
        ]);

        // 5. Proposed Criterion Components
        $db->table('award_criterion_components')->insertBatch([
            [
                'id'               => '50000003-0033-0000-0000-000000000001',
                'criterion_id'     => '50000002-0033-0000-0000-000000000001',
                'code'             => 'COMP_PERFORMER_F_INDIV_SKILLS',
                'name'             => 'Individual Socio-Cultural Performance Evidence',
                'description'      => 'Presence of at least one verified individual socio-cultural performance record (10.00 pts).',
                'max_points'       => 10.00,
                'sort_order'       => 1,
                'is_computable'    => 1,
                'authority_status' => 'PROPOSED',
            ],
            [
                'id'               => '50000003-0033-0000-0000-000000000002',
                'criterion_id'     => '50000002-0033-0000-0000-000000000001',
                'code'             => 'COMP_PERFORMER_F_GROUP_SKILLS',
                'name'             => 'Group / Ensemble Socio-Cultural Performance Evidence',
                'description'      => 'Presence of at least one verified group/ensemble socio-cultural performance record (10.00 pts).',
                'max_points'       => 10.00,
                'sort_order'       => 2,
                'is_computable'    => 1,
                'authority_status' => 'PROPOSED',
            ],
            [
                'id'               => '50000003-0033-0000-0000-000000000003',
                'criterion_id'     => '50000002-0033-0000-0000-000000000002',
                'code'             => 'COMP_PERFORMER_F_PARTICIPATION',
                'name'             => 'Participation in Socio-Cultural Meets / Competitions',
                'description'      => 'PRISAA Nat=7, Reg=5, Local=2, NDEA=4, Univ=2 (capped at 20).',
                'max_points'       => 20.00,
                'sort_order'       => 1,
                'is_computable'    => 1,
                'authority_status' => 'PROPOSED',
            ],
            [
                'id'               => '50000003-0033-0000-0000-000000000004',
                'criterion_id'     => '50000002-0033-0000-0000-000000000003',
                'code'             => 'COMP_PERFORMER_F_AWARDS',
                'name'             => 'Awards Received in Socio-Cultural Competitions',
                'description'      => 'Socio-cultural awards: Gold: 7/5/3/4/2, Silver: 5/3/2/3/1, Bronze: 3/2/1/2/1 (capped at 15).',
                'max_points'       => 15.00,
                'sort_order'       => 1,
                'is_computable'    => 1,
                'authority_status' => 'PROPOSED',
            ],
        ]);

        // 6. Evidence Mapping Rules
        $db->table('award_evidence_mapping_rules')->insertBatch([
            [
                'id'                       => '50000004-0033-0000-0000-000000000001',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707333',
                'criterion_id'             => '50000002-0033-0000-0000-000000000001',
                'criterion_component_id'   => '50000003-0033-0000-0000-000000000001',
                'rule_code'                => 'MAP_PERFORMER_F_INDIV_SKILLS',
                'name'                     => 'Individual Socio-Cultural Skills Evidence Mapping',
                'portfolio_category_id'    => '6514e620-b5a0-4ff2-9353-0ee8787b5ce6',
                'portfolio_subcategory_id' => null,
                'priority'                 => 10,
                'authority_status'         => 'PROPOSED',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0033-0000-0000-000000000002',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707333',
                'criterion_id'             => '50000002-0033-0000-0000-000000000001',
                'criterion_component_id'   => '50000003-0033-0000-0000-000000000002',
                'rule_code'                => 'MAP_PERFORMER_F_GROUP_SKILLS',
                'name'                     => 'Group Socio-Cultural Skills Evidence Mapping',
                'portfolio_category_id'    => '6514e620-b5a0-4ff2-9353-0ee8787b5ce6',
                'portfolio_subcategory_id' => null,
                'priority'                 => 20,
                'authority_status'         => 'PROPOSED',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0033-0000-0000-000000000003',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707333',
                'criterion_id'             => '50000002-0033-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0033-0000-0000-000000000003',
                'rule_code'                => 'MAP_PERFORMER_F_PARTICIPATION',
                'name'                     => 'Socio-Cultural Meets Participation Mapping',
                'portfolio_category_id'    => '6514e620-b5a0-4ff2-9353-0ee8787b5ce6',
                'portfolio_subcategory_id' => null,
                'priority'                 => 10,
                'authority_status'         => 'PROPOSED',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0033-0000-0000-000000000004',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707333',
                'criterion_id'             => '50000002-0033-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0033-0000-0000-000000000004',
                'rule_code'                => 'MAP_PERFORMER_F_AWARDS',
                'name'                     => 'Socio-Cultural Awards & Honors Mapping',
                'portfolio_category_id'    => '6514e620-b5a0-4ff2-9353-0ee8787b5ce6',
                'portfolio_subcategory_id' => null,
                'priority'                 => 10,
                'authority_status'         => 'PROPOSED',
                'is_active'                => 1,
            ],
        ]);

        // 7. Scoring Rules
        $db->table('award_scoring_rules')->insertBatch([
            [
                'id'                       => '50000005-0033-0000-0000-000000000001',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707333',
                'criterion_id'             => '50000002-0033-0000-0000-000000000001',
                'criterion_component_id'   => '50000003-0033-0000-0000-000000000001',
                'code'                     => 'RULE_PERFORMER_F_INDIV',
                'name'                     => 'Individual Performance Presence Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 10.00,
                'max_points'               => 10.00,
                'rule_config'              => json_encode(['presence_points' => 10.0, 'cap' => 10.0, 'max_points' => 10.0]),
                'authority_status'         => 'PROPOSED',
                'is_active'                => 1,
                'sort_order'               => 1,
            ],
            [
                'id'                       => '50000005-0033-0000-0000-000000000002',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707333',
                'criterion_id'             => '50000002-0033-0000-0000-000000000001',
                'criterion_component_id'   => '50000003-0033-0000-0000-000000000002',
                'code'                     => 'RULE_PERFORMER_F_GROUP',
                'name'                     => 'Group Performance Presence Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 10.00,
                'max_points'               => 10.00,
                'rule_config'              => json_encode(['presence_points' => 10.0, 'cap' => 10.0, 'max_points' => 10.0]),
                'authority_status'         => 'PROPOSED',
                'is_active'                => 1,
                'sort_order'               => 2,
            ],
            [
                'id'                       => '50000005-0033-0000-0000-000000000003',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707333',
                'criterion_id'             => '50000002-0033-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0033-0000-0000-000000000003',
                'code'                     => 'RULE_PERFORMER_F_PARTICIPATION',
                'name'                     => 'Socio-Cultural Meets Participation Matrix Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 20.00,
                'max_points'               => 20.00,
                'rule_config'              => json_encode(['event_level_points' => ['prisaa_national' => 7.0, 'prisaa_regional' => 5.0, 'prisaa_local' => 2.0, 'ndea_inter_school' => 4.0, 'university_level' => 2.0], 'cap' => 20.0, 'max_points' => 20.0]),
                'authority_status'         => 'PROPOSED',
                'is_active'                => 1,
                'sort_order'               => 1,
            ],
            [
                'id'                       => '50000005-0033-0000-0000-000000000004',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707333',
                'criterion_id'             => '50000002-0033-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0033-0000-0000-000000000004',
                'code'                     => 'RULE_PERFORMER_F_AWARDS',
                'name'                     => 'Socio-Cultural Awards Placement Matrix Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 15.00,
                'max_points'               => 15.00,
                'rule_config'              => json_encode(['medal_matrix' => ['prisaa_national' => ['gold' => 7.0, 'silver' => 5.0, 'bronze' => 3.0], 'prisaa_regional' => ['gold' => 5.0, 'silver' => 3.0, 'bronze' => 2.0], 'prisaa_local' => ['gold' => 3.0, 'silver' => 2.0, 'bronze' => 1.0], 'ndea_inter_school' => ['gold' => 4.0, 'silver' => 3.0, 'bronze' => 2.0], 'university_level' => ['gold' => 2.0, 'silver' => 1.0, 'bronze' => 1.0]], 'cap' => 15.0, 'max_points' => 15.0]),
                'authority_status'         => 'PROPOSED',
                'is_active'                => 1,
                'sort_order'               => 1,
            ],
        ]);
    }

    public function down()
    {
    }
}
