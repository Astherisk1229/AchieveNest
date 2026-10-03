<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class RemediateAthleteOfTheYearFemaleAward extends Migration
{
    public function up()
    {
        $db = $this->db;

        // 1. Reconcile Award Definition for Outstanding Athlete of the Year - Female
        $db->table('award_definitions')
            ->where('id', '50000001-0000-0000-0000-000000000031')
            ->update([
                'code'                        => 'ATHLETE_OF_THE_YEAR_FEMALE',
                'name'                        => 'Outstanding Athlete of the Year - Female',
                'category'                    => 'sports',
                'description'                 => 'Premier annual institutional athletic award honoring an exceptional female athlete who has excelled in sports competitions, manifested sportsmanship and attitude, and maintained moral character with no failing grades.',
                'authority_status'            => 'OFFICIAL',
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
            ->where('id', '0f85b20c-a461-11f1-a155-08453f707331')
            ->countAllResults();

        if ($versionExists === 0) {
            $db->table('award_scoring_model_versions')->insert([
                'id'                          => '0f85b20c-a461-11f1-a155-08453f707331',
                'award_definition_id'         => '50000001-0000-0000-0000-000000000031',
                'version_number'              => '1.0',
                'version_label'               => 'v1.0 Published',
                'status'                      => 'published',
                'candidate_threshold_percent' => 80.00,
                'graduating_only'              => 0,
                'gender_requirement'          => 'female',
                'authority_status'            => 'OFFICIAL',
                'published_at'                => '2026-08-30 00:00:00',
            ]);
        } else {
            $db->table('award_scoring_model_versions')
                ->where('id', '0f85b20c-a461-11f1-a155-08453f707331')
                ->update([
                    'status'                      => 'published',
                    'candidate_threshold_percent' => 80.00,
                    'graduating_only'              => 0,
                    'gender_requirement'          => 'female',
                ]);
        }

        // 3. Clear Existing Sub-Records
        $critIds = array_column(
            $db->table('award_criteria')->select('id')->where('award_definition_id', '50000001-0000-0000-0000-000000000031')->get()->getResultArray(),
            'id'
        );

        if (! empty($critIds)) {
            $db->table('student_award_criterion_scores')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_scoring_rules')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_evidence_mapping_rules')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_criterion_components')->whereIn('criterion_id', $critIds)->delete();
            $db->table('award_criteria')->whereIn('id', $critIds)->delete();
        }

        // 4. Re-insert 5 Official Criteria (Total 100 pts, Computable 55 pts)
        $db->table('award_criteria')->insertBatch([
            [
                'id'                       => '50000002-0031-0000-0000-000000000001',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000031',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707331',
                'code'                     => 'CRIT_ATHLETE_F_ACADEMIC',
                'name'                     => 'Academic Achievement',
                'weight'                   => 15.00,
                'max_points'               => 15.00,
                'sort_order'               => 1,
                'is_portfolio_computable'  => 0,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0031-0000-0000-000000000002',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000031',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707331',
                'code'                     => 'CRIT_ATHLETE_F_SKILLS_ATTITUDE',
                'name'                     => 'Skills and Attitude',
                'weight'                   => 40.00,
                'max_points'               => 20.00,
                'sort_order'               => 2,
                'is_portfolio_computable'  => 1,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0031-0000-0000-000000000003',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000031',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707331',
                'code'                     => 'CRIT_ATHLETE_F_PARTICIPATION',
                'name'                     => 'Participation in Sports and Athletic Meets',
                'weight'                   => 20.00,
                'max_points'               => 20.00,
                'sort_order'               => 3,
                'is_portfolio_computable'  => 1,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0031-0000-0000-000000000004',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000031',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707331',
                'code'                     => 'CRIT_ATHLETE_F_AWARDS',
                'name'                     => 'Awards Received',
                'weight'                   => 15.00,
                'max_points'               => 15.00,
                'sort_order'               => 4,
                'is_portfolio_computable'  => 1,
                'authority_status'         => 'OFFICIAL',
                'is_published'             => 1,
            ],
            [
                'id'                       => '50000002-0031-0000-0000-000000000005',
                'award_definition_id'      => '50000001-0000-0000-0000-000000000031',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707331',
                'code'                     => 'CRIT_ATHLETE_F_INTERVIEW',
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
                'id'               => '50000003-0031-0000-0000-000000000001',
                'criterion_id'     => '50000002-0031-0000-0000-000000000002',
                'code'             => 'COMP_ATHLETE_F_INDIV_SKILLS',
                'name'             => 'Individual Event Sports Skills Evidence',
                'description'      => 'Presence of at least one verified individual sports event participation (10.00 pts).',
                'max_points'       => 10.00,
                'sort_order'       => 1,
                'is_computable'    => 1,
                'authority_status' => 'OFFICIAL',
            ],
            [
                'id'               => '50000003-0031-0000-0000-000000000002',
                'criterion_id'     => '50000002-0031-0000-0000-000000000002',
                'code'             => 'COMP_ATHLETE_F_TEAM_SKILLS',
                'name'             => 'Team Sports Skills Evidence',
                'description'      => 'Presence of at least one verified team sports event participation (10.00 pts).',
                'max_points'       => 10.00,
                'sort_order'       => 2,
                'is_computable'    => 1,
                'authority_status' => 'OFFICIAL',
            ],
            [
                'id'               => '50000003-0031-0000-0000-000000000003',
                'criterion_id'     => '50000002-0031-0000-0000-000000000003',
                'code'             => 'COMP_ATHLETE_F_PARTICIPATION',
                'name'             => 'Participation in Sports and Athletic Meets',
                'description'      => 'PRISAA Nat=7, Reg=5, Local=2, NDEA=4, INTRAMS=2 (capped at 20).',
                'max_points'       => 20.00,
                'sort_order'       => 1,
                'is_computable'    => 1,
                'authority_status' => 'OFFICIAL',
            ],
            [
                'id'               => '50000003-0031-0000-0000-000000000004',
                'criterion_id'     => '50000002-0031-0000-0000-000000000004',
                'code'             => 'COMP_ATHLETE_F_AWARDS',
                'name'             => 'Awards Received in Sports Competitions',
                'description'      => 'Sports medals/honors: Gold: 7/5/3/4/2, Silver: 5/3/2/4/1, Bronze: 3/2/1/2/1 (capped at 15).',
                'max_points'       => 15.00,
                'sort_order'       => 1,
                'is_computable'    => 1,
                'authority_status' => 'OFFICIAL',
            ],
        ]);

        // 6. Evidence Mapping Rules
        $db->table('award_evidence_mapping_rules')->insertBatch([
            [
                'id'                       => '50000004-0031-0000-0000-000000000001',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707331',
                'criterion_id'             => '50000002-0031-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0031-0000-0000-000000000001',
                'rule_code'                => 'MAP_ATHLETE_F_INDIV_SKILLS',
                'name'                     => 'Individual Sports Skills Evidence Mapping',
                'portfolio_category_id'    => '2d20d412-bf34-46b4-a21d-d7131d4b514a',
                'portfolio_subcategory_id' => null,
                'priority'                 => 10,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0031-0000-0000-000000000002',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707331',
                'criterion_id'             => '50000002-0031-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0031-0000-0000-000000000002',
                'rule_code'                => 'MAP_ATHLETE_F_TEAM_SKILLS',
                'name'                     => 'Team Sports Skills Evidence Mapping',
                'portfolio_category_id'    => '2d20d412-bf34-46b4-a21d-d7131d4b514a',
                'portfolio_subcategory_id' => null,
                'priority'                 => 20,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0031-0000-0000-000000000003',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707331',
                'criterion_id'             => '50000002-0031-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0031-0000-0000-000000000003',
                'rule_code'                => 'MAP_ATHLETE_F_PARTICIPATION',
                'name'                     => 'Sports Meets Participation Mapping',
                'portfolio_category_id'    => '2d20d412-bf34-46b4-a21d-d7131d4b514a',
                'portfolio_subcategory_id' => null,
                'priority'                 => 10,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
            [
                'id'                       => '50000004-0031-0000-0000-000000000004',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707331',
                'criterion_id'             => '50000002-0031-0000-0000-000000000004',
                'criterion_component_id'   => '50000003-0031-0000-0000-000000000004',
                'rule_code'                => 'MAP_ATHLETE_F_AWARDS',
                'name'                     => 'Sports Awards & Honors Mapping',
                'portfolio_category_id'    => '2d20d412-bf34-46b4-a21d-d7131d4b514a',
                'portfolio_subcategory_id' => null,
                'priority'                 => 10,
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
            ],
        ]);

        // 7. Scoring Rules
        $db->table('award_scoring_rules')->insertBatch([
            [
                'id'                       => '50000005-0031-0000-0000-000000000001',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707331',
                'criterion_id'             => '50000002-0031-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0031-0000-0000-000000000001',
                'code'                     => 'RULE_ATHLETE_F_INDIV',
                'name'                     => 'Individual Sports Skills Presence Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 10.00,
                'max_points'               => 10.00,
                'rule_config'              => json_encode(['presence_points' => 10.0, 'cap' => 10.0, 'max_points' => 10.0]),
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
                'sort_order'               => 1,
            ],
            [
                'id'                       => '50000005-0031-0000-0000-000000000002',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707331',
                'criterion_id'             => '50000002-0031-0000-0000-000000000002',
                'criterion_component_id'   => '50000003-0031-0000-0000-000000000002',
                'code'                     => 'RULE_ATHLETE_F_TEAM',
                'name'                     => 'Team Sports Skills Presence Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 10.00,
                'max_points'               => 10.00,
                'rule_config'              => json_encode(['presence_points' => 10.0, 'cap' => 10.0, 'max_points' => 10.0]),
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
                'sort_order'               => 2,
            ],
            [
                'id'                       => '50000005-0031-0000-0000-000000000003',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707331',
                'criterion_id'             => '50000002-0031-0000-0000-000000000003',
                'criterion_component_id'   => '50000003-0031-0000-0000-000000000003',
                'code'                     => 'RULE_ATHLETE_F_PARTICIPATION',
                'name'                     => 'Sports Meets Participation Matrix Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 20.00,
                'max_points'               => 20.00,
                'rule_config'              => json_encode(['event_level_points' => ['prisaa_national' => 7.0, 'prisaa_regional' => 5.0, 'prisaa_local' => 2.0, 'ndea' => 4.0, 'intramurals' => 2.0], 'cap' => 20.0, 'max_points' => 20.0]),
                'authority_status'         => 'OFFICIAL',
                'is_active'                => 1,
                'sort_order'               => 1,
            ],
            [
                'id'                       => '50000005-0031-0000-0000-000000000004',
                'scoring_model_version_id' => '0f85b20c-a461-11f1-a155-08453f707331',
                'criterion_id'             => '50000002-0031-0000-0000-000000000004',
                'criterion_component_id'   => '50000003-0031-0000-0000-000000000004',
                'code'                     => 'RULE_ATHLETE_F_AWARDS',
                'name'                     => 'Sports Awards & Honors Medal Matrix Rule',
                'rule_type'                => 'sum_capped',
                'points'                   => 15.00,
                'max_points'               => 15.00,
                'rule_config'              => json_encode(['medal_matrix' => ['prisaa_national' => ['gold' => 7.0, 'silver' => 5.0, 'bronze' => 3.0], 'prisaa_regional' => ['gold' => 5.0, 'silver' => 3.0, 'bronze' => 2.0], 'prisaa_local' => ['gold' => 3.0, 'silver' => 2.0, 'bronze' => 1.0], 'ndea' => ['gold' => 4.0, 'silver' => 4.0, 'bronze' => 2.0], 'intramurals' => ['gold' => 2.0, 'silver' => 1.0, 'bronze' => 1.0]], 'cap' => 15.0, 'max_points' => 15.0]),
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
