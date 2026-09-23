<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Migration: CreatePersonnelEvaluationRootsAndLineage
 *
 * Plan C — C5 Corrective Plan:
 * One Evaluation Root per Cycle & Immutable Version Lineage.
 */
class CreatePersonnelEvaluationRootsAndLineage extends Migration
{
    private function genUuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            random_int(0, 0xffff), random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0x0fff) | 0x4000,
            random_int(0, 0x3fff) | 0x8000,
            random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff)
        );
    }

    public function up()
    {
        $db = $this->db;
        $forge = \Config\Database::forge();
        $isPg = ($db->DBDriver === 'Postgre');

        $rootsTableName = $isPg ? 'public.personnel_evaluation_roots' : 'personnel_evaluation_roots';
        $evalTableName = $isPg ? 'public.personnel_evaluations' : 'personnel_evaluations';

        // 1. Create personnel_evaluation_roots table if not exists
        if (! $db->tableExists($rootsTableName) && ! $db->tableExists('personnel_evaluation_roots')) {
            $rootFields = [
                'id' => [
                    'type'       => $isPg ? 'UUID' : 'VARCHAR',
                    'constraint' => '64',
                    'null'       => false,
                ],
                'personnel_profile_id' => [
                    'type'       => $isPg ? 'UUID' : 'VARCHAR',
                    'constraint' => '64',
                    'null'       => false,
                ],
                'evaluation_cycle_id' => [
                    'type'       => 'VARCHAR',
                    'constraint' => '64',
                    'null'       => false,
                ],
                'academic_year' => [
                    'type'       => 'VARCHAR',
                    'constraint' => '32',
                    'null'       => false,
                    'default'    => '2025-2026',
                ],
                'created_by' => [
                    'type'       => $isPg ? 'UUID' : 'VARCHAR',
                    'constraint' => '64',
                    'null'       => true,
                    'default'    => null,
                ],
                'created_at' => [
                    'type'       => $isPg ? 'TIMESTAMP' : 'DATETIME',
                    'null'       => true,
                    'default'    => null,
                ],
                'updated_at' => [
                    'type'       => $isPg ? 'TIMESTAMP' : 'DATETIME',
                    'null'       => true,
                    'default'    => null,
                ],
            ];

            $forge->addField($rootFields);
            $forge->addPrimaryKey('id');
            $forge->createTable($rootsTableName, true);

            // Add Unique Index on (personnel_profile_id, evaluation_cycle_id)
            if ($isPg) {
                $db->query("CREATE UNIQUE INDEX IF NOT EXISTS uq_personnel_eval_roots_profile_cycle ON {$rootsTableName} (personnel_profile_id, evaluation_cycle_id)");
                $db->query("CREATE INDEX IF NOT EXISTS idx_personnel_eval_roots_profile ON {$rootsTableName} (personnel_profile_id)");
            } else {
                $db->query("CREATE UNIQUE INDEX `uq_personnel_eval_roots_profile_cycle` ON `{$rootsTableName}` (`personnel_profile_id`, `evaluation_cycle_id`)");
                $db->query("CREATE INDEX `idx_personnel_eval_roots_profile` ON `{$rootsTableName}` (`personnel_profile_id`)");
            }
        }

        // 2. Add evaluation_root_id column to personnel_evaluations
        $targetEvalTable = $db->tableExists('public.personnel_evaluations') ? 'public.personnel_evaluations' : ($db->tableExists('personnel_evaluations') ? 'personnel_evaluations' : null);

        if ($targetEvalTable !== null) {
            if (! $db->fieldExists('evaluation_root_id', $targetEvalTable)) {
                $forge->addColumn($targetEvalTable, [
                    'evaluation_root_id' => [
                        'type'       => $isPg ? 'UUID' : 'VARCHAR',
                        'constraint' => '64',
                        'null'       => true,
                        'default'    => null,
                    ],
                ]);
            }

            // 3. Deterministic backfill of evaluation roots
            $existingEvaluations = $db->table($targetEvalTable)->get()->getResultArray();
            $now = date('Y-m-d H:i:s');

            $groupedByProfileAndCycle = [];
            foreach ($existingEvaluations as $eval) {
                $profileId = $eval['personnel_profile_id'] ?? null;
                if (! $profileId) {
                    continue;
                }
                $cycleId = $eval['evaluation_cycle_id'] ?? $eval['academic_year'] ?? '2025-2026';
                $key = $profileId . '::' . $cycleId;
                $groupedByProfileAndCycle[$key][] = $eval;
            }

            foreach ($groupedByProfileAndCycle as $key => $evals) {
                [$profileId, $cycleId] = explode('::', $key);
                $acadYear = $evals[0]['academic_year'] ?? '2025-2026';

                // Check if root already exists
                $existingRoot = $db->table($rootsTableName)
                    ->where('personnel_profile_id', $profileId)
                    ->where('evaluation_cycle_id', $cycleId)
                    ->get()
                    ->getRowArray();

                if ($existingRoot === null) {
                    $rootId = $this->genUuid();
                    $db->table($rootsTableName)->insert([
                        'id'                   => $rootId,
                        'personnel_profile_id' => $profileId,
                        'evaluation_cycle_id'  => $cycleId,
                        'academic_year'        => $acadYear,
                        'created_by'           => $profileId,
                        'created_at'           => $evals[0]['submitted_at'] ?? $evals[0]['created_at'] ?? $now,
                        'updated_at'           => $now,
                    ]);
                } else {
                    $rootId = $existingRoot['id'];
                }

                // Update evaluation rows with root id and ensure cycle id
                foreach ($evals as $eval) {
                    $db->table($targetEvalTable)
                        ->where('id', $eval['id'])
                        ->update([
                            'evaluation_root_id'  => $rootId,
                            'evaluation_cycle_id' => $cycleId,
                        ]);
                }
            }

            // 4. Add index on (evaluation_root_id, version_number)
            if ($isPg) {
                $db->query("CREATE UNIQUE INDEX IF NOT EXISTS uq_personnel_eval_root_version ON {$targetEvalTable} (evaluation_root_id, version_number)");
                $db->query("CREATE INDEX IF NOT EXISTS idx_personnel_eval_root_id ON {$targetEvalTable} (evaluation_root_id)");
                $db->query("CREATE INDEX IF NOT EXISTS idx_personnel_eval_prev_version ON {$targetEvalTable} (previous_version_id)");
            } else {
                $db->query("CREATE UNIQUE INDEX `uq_personnel_eval_root_version` ON `{$targetEvalTable}` (`evaluation_root_id`, `version_number`)");
                $db->query("CREATE INDEX `idx_personnel_eval_root_id` ON `{$targetEvalTable}` (`evaluation_root_id`)");
                $db->query("CREATE INDEX `idx_personnel_eval_prev_version` ON `{$targetEvalTable}` (`previous_version_id`)");
            }
        }
    }

    public function down()
    {
        // Additive safe migration
    }
}
