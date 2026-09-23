<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AwardCatalogRuntimeCleanupAndQuarantine extends Migration
{
    public function up()
    {
        $db = $this->db;

        // 1. Add additive columns if not exist
        if (! $db->fieldExists('source_fidelity_status', 'award_definitions')) {
            $this->forge->addColumn('award_definitions', [
                'source_fidelity_status' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 50,
                    'default'    => 'PENDING_RECONCILIATION',
                    'after'      => 'authority_status',
                ],
            ]);
        }

        if (! $db->fieldExists('is_catalog_visible', 'award_definitions')) {
            $this->forge->addColumn('award_definitions', [
                'is_catalog_visible' => [
                    'type'       => 'TINYINT',
                    'constraint' => 1,
                    'default'    => 1,
                    'after'      => 'source_fidelity_status',
                ],
            ]);
        }

        // 2. Mark Notre Dame Award as VERIFIED
        $db->table('award_definitions')
            ->where('id', '50000001-0000-0000-0000-000000000001')
            ->update([
                'source_fidelity_status' => 'VERIFIED',
                'is_catalog_visible'     => 1,
                'status'                 => 'active',
                'authority_status'       => 'OFFICIAL',
            ]);

        // 3. Quarantine Legacy / Non-Source / Ambiguous Placeholder Award Rows
        $db->table('award_definitions')
            ->whereIn('code', [
                'ACADEMIC_EXCELLENCE',
                'DEANS_MEDAL_OF_DISTINCTION',
                'LOYALTY_AWARD',
                'PRESIDENTS_MEDAL_OF_EXCELLENCE',
                'RESEARCH_AND_INNOVATION',
                'OUTSTANDING_CHURCH_MINISTRY',
                'OUTSTANDING_EXTRA_CURRICULAR',
                'OUTSTANDING_LEADERSHIP',
                'OUTSTANDING_COMMUNITY_SERVICE',
                'OUTSTANDING_CAMPUS_JOURNALISM',
                'OUTSTANDING_ATHLETE_MALE',
                'OUTSTANDING_ATHLETE_FEMALE',
                'OUTSTANDING_CULTURAL_ARTIST',
                'OUTSTANDING_CO_CURRICULAR',
            ])
            ->update([
                'source_fidelity_status' => 'LEGACY_QUARANTINED',
                'is_catalog_visible'     => 0,
                'status'                 => 'archived',
            ]);

        // 4. Ensure Authoritative Baseline Awards Exist with Correct Progress States
        $baselineAwards = [
            [
                'id'                          => '50000001-0000-0000-0000-000000000021',
                'code'                        => 'SMC_AWARD',
                'name'                        => 'Saint Marcellin Champagnat (SMC) Award',
                'category'                    => 'service',
                'description'                 => 'Premier graduating award recognizing exceptional Christian leadership, apostolic zeal, Marist spirituality, and service to Church and community.',
                'candidate_threshold_percent' => 80.00,
                'gender_restriction'          => null,
                'graduating_only'             => 1,
                'status'                      => 'active',
                'authority_status'            => 'OFFICIAL',
                'source_fidelity_status'      => 'PENDING_RECONCILIATION',
                'is_catalog_visible'          => 1,
                'active_scoring_version'      => '1.0',
            ],
            [
                'id'                          => '50000001-0000-0000-0000-000000000022',
                'code'                        => 'LEADERSHIP_AWARD',
                'name'                        => 'Leadership Award',
                'category'                    => 'leadership',
                'description'                 => 'Graduating award honoring outstanding governance, club leadership, and university-wide service leadership.',
                'candidate_threshold_percent' => 80.00,
                'gender_restriction'          => null,
                'graduating_only'             => 1,
                'status'                      => 'active',
                'authority_status'            => 'OFFICIAL',
                'source_fidelity_status'      => 'PENDING_RECONCILIATION',
                'is_catalog_visible'          => 1,
                'active_scoring_version'      => '1.0',
            ],
            [
                'id'                          => '50000001-0000-0000-0000-000000000023',
                'code'                        => 'CAMPUS_JOURNALISM_AWARD',
                'name'                        => 'Campus Journalism Award',
                'category'                    => 'journalism',
                'description'                 => 'Graduating award honoring editorial excellence, investigative journalism, and campus publication management.',
                'candidate_threshold_percent' => 80.00,
                'gender_restriction'          => null,
                'graduating_only'             => 1,
                'status'                      => 'active',
                'authority_status'            => 'OFFICIAL',
                'source_fidelity_status'      => 'PENDING_RECONCILIATION',
                'is_catalog_visible'          => 1,
                'active_scoring_version'      => '1.0',
            ],
            [
                'id'                          => '50000001-0000-0000-0000-000000000024',
                'code'                        => 'SPORTS_AWARD_FEMALE',
                'name'                        => 'Outstanding Performance in Sports - Female',
                'category'                    => 'sports',
                'description'                 => 'Graduating honor for exemplary athletic prowess, varsity competition performance, sportsmanship, and academic balance (Female).',
                'candidate_threshold_percent' => 80.00,
                'gender_restriction'          => 'female',
                'graduating_only'             => 1,
                'status'                      => 'active',
                'authority_status'            => 'OFFICIAL',
                'source_fidelity_status'      => 'PENDING_RECONCILIATION',
                'is_catalog_visible'          => 1,
                'active_scoring_version'      => '1.0',
            ],
            [
                'id'                          => '50000001-0000-0000-0000-000000000025',
                'code'                        => 'SPORTS_AWARD_MALE',
                'name'                        => 'Outstanding Performance in Sports - Male',
                'category'                    => 'sports',
                'description'                 => 'Graduating honor for exemplary athletic prowess, varsity competition performance, sportsmanship, and academic balance (Male).',
                'candidate_threshold_percent' => 80.00,
                'gender_restriction'          => 'male',
                'graduating_only'             => 1,
                'status'                      => 'active',
                'authority_status'            => 'OFFICIAL',
                'source_fidelity_status'      => 'PENDING_RECONCILIATION',
                'is_catalog_visible'          => 1,
                'active_scoring_version'      => '1.0',
            ],
            [
                'id'                          => '50000001-0000-0000-0000-000000000026',
                'code'                        => 'SOCIO_CULTURAL_AWARD_FEMALE',
                'name'                        => 'Outstanding Performance in Socio-Cultural - Female',
                'category'                    => 'culture',
                'description'                 => 'Graduating honor for artistic brilliance, cultural troupe performance, music/theatre showcases, and cultural leadership (Female).',
                'candidate_threshold_percent' => 80.00,
                'gender_restriction'          => 'female',
                'graduating_only'             => 1,
                'status'                      => 'active',
                'authority_status'            => 'PROPOSED',
                'source_fidelity_status'      => 'PROPOSED_PENDING_APPROVAL',
                'is_catalog_visible'          => 1,
                'active_scoring_version'      => '1.0',
            ],
            [
                'id'                          => '50000001-0000-0000-0000-000000000027',
                'code'                        => 'SOCIO_CULTURAL_AWARD_MALE',
                'name'                        => 'Outstanding Performance in Socio-Cultural - Male',
                'category'                    => 'culture',
                'description'                 => 'Graduating honor for artistic brilliance, cultural troupe performance, music/theatre showcases, and cultural leadership (Male).',
                'candidate_threshold_percent' => 80.00,
                'gender_restriction'          => 'male',
                'graduating_only'             => 1,
                'status'                      => 'active',
                'authority_status'            => 'PROPOSED',
                'source_fidelity_status'      => 'PROPOSED_PENDING_APPROVAL',
                'is_catalog_visible'          => 1,
                'active_scoring_version'      => '1.0',
            ],
            [
                'id'                          => '50000001-0000-0000-0000-000000000028',
                'code'                        => 'STUDENT_LEADER_OF_THE_YEAR',
                'name'                        => 'Outstanding Student Leader of the Year',
                'category'                    => 'leadership',
                'description'                 => 'Annual non-graduating recognition for active student leadership, governance, and community involvement during the academic year.',
                'candidate_threshold_percent' => 80.00,
                'gender_restriction'          => null,
                'graduating_only'             => 0,
                'status'                      => 'active',
                'authority_status'            => 'OFFICIAL',
                'source_fidelity_status'      => 'PENDING_RECONCILIATION',
                'is_catalog_visible'          => 1,
                'active_scoring_version'      => '1.0',
            ],
            [
                'id'                          => '50000001-0000-0000-0000-000000000029',
                'code'                        => 'MEMBER_OF_THE_YEAR',
                'name'                        => 'Outstanding Member of the Year',
                'category'                    => 'leadership',
                'description'                 => 'Annual recognition honoring exemplary membership commitment, active involvement, and substantial organizational contribution.',
                'candidate_threshold_percent' => 80.00,
                'gender_restriction'          => null,
                'graduating_only'             => 0,
                'status'                      => 'active',
                'authority_status'            => 'OFFICIAL',
                'source_fidelity_status'      => 'PENDING_RECONCILIATION',
                'is_catalog_visible'          => 1,
                'active_scoring_version'      => '1.0',
            ],
            [
                'id'                          => '50000001-0000-0000-0000-000000000030',
                'code'                        => 'VOLUNTEER_OF_THE_YEAR',
                'name'                        => 'Outstanding Volunteer of the Year',
                'category'                    => 'service',
                'description'                 => 'Annual recognition celebrating selflessness, community service, disaster outreach, and social ministry volunteerism.',
                'candidate_threshold_percent' => 80.00,
                'gender_restriction'          => null,
                'graduating_only'             => 0,
                'status'                      => 'active',
                'authority_status'            => 'OFFICIAL',
                'source_fidelity_status'      => 'PENDING_RECONCILIATION',
                'is_catalog_visible'          => 1,
                'active_scoring_version'      => '1.0',
            ],
            [
                'id'                          => '50000001-0000-0000-0000-000000000031',
                'code'                        => 'ATHLETE_OF_THE_YEAR_FEMALE',
                'name'                        => 'Outstanding Athlete of the Year - Female',
                'category'                    => 'sports',
                'description'                 => 'Annual athletic award for top performance in university and national tournaments during the academic year (Female).',
                'candidate_threshold_percent' => 80.00,
                'gender_restriction'          => 'female',
                'graduating_only'             => 0,
                'status'                      => 'active',
                'authority_status'            => 'OFFICIAL',
                'source_fidelity_status'      => 'PENDING_RECONCILIATION',
                'is_catalog_visible'          => 1,
                'active_scoring_version'      => '1.0',
            ],
            [
                'id'                          => '50000001-0000-0000-0000-000000000032',
                'code'                        => 'ATHLETE_OF_THE_YEAR_MALE',
                'name'                        => 'Outstanding Athlete of the Year - Male',
                'category'                    => 'sports',
                'description'                 => 'Annual athletic award for top performance in university and national tournaments during the academic year (Male).',
                'candidate_threshold_percent' => 80.00,
                'gender_restriction'          => 'male',
                'graduating_only'             => 0,
                'status'                      => 'active',
                'authority_status'            => 'OFFICIAL',
                'source_fidelity_status'      => 'PENDING_RECONCILIATION',
                'is_catalog_visible'          => 1,
                'active_scoring_version'      => '1.0',
            ],
            [
                'id'                          => '50000001-0000-0000-0000-000000000033',
                'code'                        => 'PERFORMER_OF_THE_YEAR_FEMALE',
                'name'                        => 'Outstanding Performer of the Year - Female',
                'category'                    => 'culture',
                'description'                 => 'Annual socio-cultural award honoring highest artistic achievement in performing arts during the academic year (Female).',
                'candidate_threshold_percent' => 80.00,
                'gender_restriction'          => 'female',
                'graduating_only'             => 0,
                'status'                      => 'active',
                'authority_status'            => 'PROPOSED',
                'source_fidelity_status'      => 'PROPOSED_PENDING_APPROVAL',
                'is_catalog_visible'          => 1,
                'active_scoring_version'      => '1.0',
            ],
            [
                'id'                          => '50000001-0000-0000-0000-000000000034',
                'code'                        => 'PERFORMER_OF_THE_YEAR_MALE',
                'name'                        => 'Outstanding Performer of the Year - Male',
                'category'                    => 'culture',
                'description'                 => 'Annual socio-cultural award honoring highest artistic achievement in performing arts during the academic year (Male).',
                'candidate_threshold_percent' => 80.00,
                'gender_restriction'          => 'male',
                'graduating_only'             => 0,
                'status'                      => 'active',
                'authority_status'            => 'PROPOSED',
                'source_fidelity_status'      => 'PROPOSED_PENDING_APPROVAL',
                'is_catalog_visible'          => 1,
                'active_scoring_version'      => '1.0',
            ],
        ];

        foreach ($baselineAwards as $award) {
            $existing = $db->table('award_definitions')->where('id', $award['id'])->orWhere('code', $award['code'])->get()->getRowArray();
            if ($existing !== null) {
                $db->table('award_definitions')->where('id', $existing['id'])->update($award);
            } else {
                $db->table('award_definitions')->insert($award);
            }
        }
    }

    public function down()
    {
    }
}
