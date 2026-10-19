<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

/** Publishes the verified socio-cultural and performer award criteria. */
final class OfficializeVerifiedStudentAwards extends Migration
{
    private const AWARD_IDS = [
        '50000001-0000-0000-0000-000000000026', // Socio-cultural, female
        '50000001-0000-0000-0000-000000000027', // Socio-cultural, male
        '50000001-0000-0000-0000-000000000033', // Performer of the Year, female
        '50000001-0000-0000-0000-000000000034', // Performer of the Year, male
    ];

    public function up()
    {
        $awards = $this->db->table('award_definitions')
            ->select('id, code, source_fidelity_status')
            ->whereIn('id', self::AWARD_IDS)
            ->get()
            ->getResultArray();

        if (count($awards) !== count(self::AWARD_IDS)) {
            throw new RuntimeException('Cannot publish the student awards: one or more award definitions are missing.');
        }

        foreach ($awards as $award) {
            if ($award['source_fidelity_status'] !== 'VERIFIED') {
                throw new RuntimeException('Cannot publish ' . $award['code'] . ': its source fidelity is not verified.');
            }
        }

        $criteria = $this->db->table('award_criteria')
            ->select('id')
            ->whereIn('award_definition_id', self::AWARD_IDS)
            ->get()
            ->getResultArray();
        $criterionIds = array_column($criteria, 'id');

        if ($criterionIds === []) {
            throw new RuntimeException('Cannot publish the student awards: no criteria were found.');
        }

        $this->db->transBegin();

        try {
            $this->db->table('award_definitions')
                ->whereIn('id', self::AWARD_IDS)
                ->update([
                    'authority_status' => 'OFFICIAL',
                    'description'      => new \CodeIgniter\Database\RawSql(
                        "REPLACE(description, 'Proposed AchieveNest', 'AchieveNest')"
                    ),
                ]);

            $this->db->table('award_scoring_model_versions')
                ->whereIn('award_definition_id', self::AWARD_IDS)
                ->update([
                    'authority_status' => 'OFFICIAL',
                    'version_label'    => 'v1.0 Official Published',
                ]);

            $this->db->table('award_criteria')
                ->whereIn('id', $criterionIds)
                ->update(['authority_status' => 'OFFICIAL']);

            $this->db->table('award_criterion_components')
                ->whereIn('criterion_id', $criterionIds)
                ->update(['authority_status' => 'OFFICIAL']);

            $this->db->table('award_evidence_mapping_rules')
                ->whereIn('criterion_id', $criterionIds)
                ->update(['authority_status' => 'OFFICIAL']);

            $this->db->table('award_scoring_rules')
                ->whereIn('criterion_id', $criterionIds)
                ->update(['authority_status' => 'OFFICIAL']);

            if (! $this->db->transStatus()) {
                throw new RuntimeException('The student award criteria could not be published.');
            }

            $this->db->transCommit();
        } catch (\Throwable $exception) {
            $this->db->transRollback();
            throw $exception;
        }
    }

    public function down()
    {
        // Official publication is a governance decision and is not reversed automatically.
    }
}
