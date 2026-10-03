<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class RemediateSocioCulturalFemaleAward extends Migration
{
    public function up()
    {
        $db = $this->db;

        // 1. Reconcile Award Definition for Outstanding Performance in Socio-Cultural - Female
        $db->table('award_definitions')
            ->where('id', '50000001-0000-0000-0000-000000000026')
            ->update([
                'code'                        => 'SOCIO_CULTURAL_AWARD_FEMALE',
                'name'                        => 'Outstanding Performance in Socio-Cultural - Female',
                'category'                    => 'socio_cultural',
                'description'                 => 'Proposed AchieveNest portfolio-based criteria recognizing exemplary female performing arts distinction, cultural competition excellence, stage discipline, and institutional artistic representation.',
                'authority_status'            => 'PROPOSED',
                'source_fidelity_status'      => 'VERIFIED',
                'is_catalog_visible'          => 1,
                'graduating_only'              => 1,
                'gender_restriction'          => 'female',
                'candidate_threshold_percent' => 80.00,
                'status'                      => 'active',
                'active_scoring_version'      => '1.0',
            ]);

        // 2. Published Scoring Model Version v1.0 (PROPOSED)
        $versionExists = $db->table('award_scoring_model_versions')
            ->where('id', '0f85b20c-a461-11f1-a155-08453f707326')
            ->countAllResults();

        if ($versionExists === 0) {
            $db->table('award_scoring_model_versions')->insert([
                'id'                          => '0f85b20c-a461-11f1-a155-08453f707326',
                'award_definition_id'         => '50000001-0000-0000-0000-000000000026',
                'version_number'              => '1.0',
                'version_label'               => 'v1.0 Proposed Published',
                'status'                      => 'published',
                'candidate_threshold_percent' => 80.00,
                'graduating_only'              => 1,
                'gender_requirement'          => 'female',
                'authority_status'            => 'PROPOSED',
                'published_at'                => '2026-08-30 00:00:00',
            ]);
        } else {
            $db->table('award_scoring_model_versions')
                ->where('id', '0f85b20c-a461-11f1-a155-08453f707326')
                ->update([
                    'status'                      => 'published',
                    'candidate_threshold_percent' => 80.00,
                    'gender_requirement'          => 'female',
                    'authority_status'            => 'PROPOSED',
                ]);
        }

        // 3. Clear Existing Sub-Records
        $critIds = array_column(
            $db->table('award_criteria')->select('id')->where('award_definition_id', '50000001-0000-0000-0000-000000000026')->get()->getResultArray(),
            'id'
        );

        if (! empty($critIds)) {
            $db->table('student_award_criterion_scores')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_scoring_rules')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_evidence_mapping_rules')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_criterion_components')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_criteria')->whereIn('id', $critIds)->delete();
        }

        // 4. Re-insert 3 Proposed Criteria (Total 55 pts, All Computable)
        $db->table('award_criteria')->insertBatch([
            [
                'id'                       => '50000002-0026-0000-0000-000000000001',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000026',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707326',
                'code'                     => 'CRIT_SOCIO_F_SKILLS',
                'name'                     => 'Socio-Cultural Skills Evidence',
                'weight'                   => 20.00,
                'max_points'               => 20.00,
                'sort_order'               => 1,
                'is_portfolio_computable'  => 1,
                'authority_status'         => 'PROPOSED',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0026-0000-0000-000000000002',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000026',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707326',
                'code'                     => 'CRIT_SOCIO_F_PARTICIPATION',
                'name'                     => 'Participation in Socio-Cultural Meets / Competitions',
                'weight'                   => 20.00,
                'max_points'               => 20.00,
                'sort_order'               => 2,
                'is_portfolio_computable'  => 1,
                'authority_status'         => 'PROPOSED',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0026-0000-0000-000000000003',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000026',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707326',
                'code'                     => 'CRIT_SOCIO_F_AWARDS',
                'name'                     => 'Awards Received',
                'weight'                   => 15.00,
                'max_points'               => 15.00,
                'sort_order'               => 3,
                'is_portfolio_computable'  => 1,
                'authority_status'         => 'PROPOSED',
                'is_published'             => 1,
            ],
        ]);

        // 5. Criterion Components
        $db->table('award_criterion_components')->insertBatch([
            [
                'id'               => '50000003-0026-0000-0000-000000000001',
                'criterion_id'     => '50000002-0026-0000-0000-000000000001',
                'code'             => 'COMP_SOCIO_F_INDIV_SKILLS',
                'name'             => 'Individual Performance Skills Evidence',
                'description'      => 'Verified participation in individual socio-cultural performances (10 pts presence).',
                'max_points'       => 10.00,
                'sort_order'       => 1,
                'is_computable'    => 1,
                'authority_status' => 'PROPOSED',
            ],
            [
                'id'               => '50000003-0026-0000-0000-000000000002',
                'criterion_id'     => '50000002-0026-0000-0000-000000000001',
                'code'             => 'COMP_SOCIO_F_GROUP_SKILLS',
                'name'             => 'Group / Ensemble Performance Skills Evidence',
                'description'      => 'Verified participation in group/ensemble socio-cultural performances (10 pts presence).',
                'max_points'       => 10.00,
                'sort_order'       => 2,
                'is_computable'    => 1,
                'authority_status' => 'PROPOSED',
            ],
            [
                'id'               => '50000003-0026-0000-0000-000000000003',
                'criterion_id'     => '50000002-0026-0000-0000-000000000002',
                'code'             => 'COMP_SOCIO_F_PARTICIPATION',
                'name'             => 'Participation in Socio-Cultural Meets',
                'description'      => 'Accumulated verified participation: PRISAA Nat=7, Reg=5, Local=2, NDEA=4, University=2 (capped at 20).',
                'max_points'       => 20.00,
                'sort_order'       => 1,
                'is_computable'    => 1,
                'authority_status' => 'PROPOSED',
            ],
            [
                'id'               => '50000003-0026-0000-0000-000000000004',
                'criterion_id'     => '50000002-0026-0000-0000-000000000003',
                'code'             => 'COMP_SOCIO_F_AWARDS',
                'name'             => 'Awards Received in Socio-Cultural Events',
                'description'      => 'Accumulated verified socio-cultural awards across PRISAA, NDEA (Silver=3), and University meets (capped at 15).',
                'max_points'       => 15.00,
                'sort_order'       => 1,
                'is_computable'    => 1,
                'authority_status' => 'PROPOSED',
            ],
        ]);

        // 6. Evidence Mapping Rules
        $db->table('award_evidence_mapping_rules')->insertBatch([
            [
                'id'                       => '50000004-0026-0000-0000-000000000001',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707326',
                'criterion_id'             => '50000002-0026-0000-0000-000000000001',
                'criterion_component_id'   => '50000003-0026-0000-0000-000000000001',
                'rule_code'                => 'MAP_SOCIO_F_INDIV',
                'name'                     => 'Individual Socio-Cultural Skills Mapping',
                'portfolio_category_id'    => '6514e620-b5a0-4ff2-9353-0ee8787b5ce6',
                'portfolio_subcategory_id' => null,
                'priority'                 => 10,
                'authority_status'         => 'PROPOSED',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0026-0000-0000-000000000002',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707326',
                'criterion_id'             => '50000002-0026-0000-0000-000000000001',
                'criterion_component_id'   => '50000003-0026-0000-0000-000000000002',
                'rule_code'                => 'MAP_SOCIO_F_GROUP',
                'name'                     => 'Group Socio-Cultural Skills Mapping',
                'portfolio_category_id'    => '6514e620-b5a0-4ff2-9353-0ee8787b5ce6',
                'portfolio_subcategory_id' => null,
                'priority'                 => 20,
                'authority_status'         => 'PROPOSED',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0026-0000-0000-000000000003',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707326',
                'criterion_id'             => '50000002-0026-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0026-0000-0000-000000000003',
                'rule_code'                => 'MAP_SOCIO_F_PARTICIPATION',
                'name'                     => 'Socio-Cultural Meets Participation Mapping',
                'portfolio_category_id'    => '6514e620-b5a0-4ff2-9353-0ee8787b5ce6',
                'portfolio_subcategory_id' => null,
                'priority'                 => 10,
                'authority_status'         => 'PROPOSED',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0026-0000-0000-000000000004',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707326',
                'criterion_id'             => '50000002-0026-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0026-0000-0000-000000000004',
                'rule_code'                => 'MAP_SOCIO_F_AWARDS',
                'name'                     => 'Socio-Cultural Honors & Placements Mapping',
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
                'id'                       => '50000005-0026-0000-0000-000000000001',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707326',
                'criterion_id'             => '50000002-0026-0000-0000-000000000001',
                'criterion_component_id'   => '50000003-0026-0000-0000-000000000001',
                'code'                     => 'RULE_SOCIO_F_INDIV',
                'name'                     => 'Individual Socio-Cultural Skills Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 10.00,
                'max_points'               => 10.00,
                'rule_config'              => json_encode(['fixed_presence_points' => 10.0, 'cap' => 10.0, 'max_points' => 10.0]),
                'authority_status'         => 'PROPOSED',
                'is_active'                => 1,
                'sort_order'               => 1,
            ],
            [
                'id'                       => '50000005-0026-0000-0000-000000000002',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707326',
                'criterion_id'             => '50000002-0026-0000-0000-000000000001',
                'criterion_component_id'   => '50000003-0026-0000-0000-000000000002',
                'code'                     => 'RULE_SOCIO_F_GROUP',
                'name'                     => 'Group Socio-Cultural Skills Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 10.00,
                'max_points'               => 10.00,
                'rule_config'              => json_encode(['fixed_presence_points' => 10.0, 'cap' => 10.0, 'max_points' => 10.0]),
                'authority_status'         => 'PROPOSED',
                'is_active'                => 1,
                'sort_order'               => 2,
            ],
            [
                'id'                       => '50000005-0026-0000-0000-000000000003',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707326',
                'criterion_id'             => '50000002-0026-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0026-0000-0000-000000000003',
                'code'                     => 'RULE_SOCIO_F_PARTICIPATION',
                'name'                     => 'Socio-Cultural Meets Participation Matrix Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 20.00,
                'max_points'               => 20.00,
                'rule_config'              => json_encode(['event_level_points' => ['prisaa_national' => 7.0, 'prisaa_regional' => 5.0, 'prisaa_local' => 2.0, 'ndea' => 4.0, 'university_level' => 2.0, 'intramurals' => 2.0], 'cap' => 20.0, 'max_points' => 20.0]),
                'authority_status'         => 'PROPOSED',
                'is_active'                => 1,
                'sort_order'               => 1,
            ],
            [
                'id'                       => '50000005-0026-0000-0000-000000000004',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707326',
                'criterion_id'             => '50000002-0026-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0026-0000-0000-000000000004',
                'code'                     => 'RULE_SOCIO_F_AWARDS',
                'name'                     => 'Socio-Cultural Awards Matrix Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 15.00,
                'max_points'               => 15.00,
                'rule_config'              => json_encode(['medal_matrix' => ['prisaa_national' => ['gold' => 7.0, 'silver' => 5.0, 'bronze' => 3.0], 'prisaa_regional' => ['gold' => 5.0, 'silver' => 3.0, 'bronze' => 2.0], 'prisaa_local' => ['gold' => 3.0, 'silver' => 2.0, 'bronze' => 1.0], 'ndea' => ['gold' => 4.0, 'silver' => 3.0, 'bronze' => 2.0], 'university_level' => ['gold' => 2.0, 'silver' => 1.0, 'bronze' => 1.0], 'intramurals' => ['gold' => 2.0, 'silver' => 1.0, 'bronze' => 1.0]], 'cap' => 15.0, 'max_points' => 15.0]),
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
