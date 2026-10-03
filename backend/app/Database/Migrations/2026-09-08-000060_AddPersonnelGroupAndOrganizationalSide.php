<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Migration: AddPersonnelGroupAndOrganizationalSide
 *
 * Plan D — Phase D1: Final Personnel Classification Model.
 * Adds constrained `personnel_group` and `organizational_side` fields to `personnel_profiles`
 * with pair constraint enforcing the 3 valid combinations:
 * 1. Faculty + Academic
 * 2. Non-Teaching Faculty + Academic
 * 3. Non-Teaching Faculty + Non-Academic
 */
class AddPersonnelGroupAndOrganizationalSide extends Migration
{
    public function up()
    {
        $db = $this->db;
        $forge = \Config\Database::forge();
        $isPg = ($db->DBDriver === 'Postgre');

        $tableName = $db->tableExists('public.personnel_profiles') ? 'public.personnel_profiles' : ($db->tableExists('personnel_profiles') ? 'personnel_profiles' : null);

        if ($tableName !== null) {
            // 1. Add columns if not already existing
            if (! $db->fieldExists('personnel_group', $tableName)) {
                $forge->addColumn($tableName, [
                    'personnel_group' => [
                        'type'       => 'VARCHAR',
                        'constraint' => '32',
                        'null'       => true,
                        'default'    => null,
                    ],
                ]);
            }

            if (! $db->fieldExists('organizational_side', $tableName)) {
                $forge->addColumn($tableName, [
                    'organizational_side' => [
                        'type'       => 'VARCHAR',
                        'constraint' => '32',
                        'null'       => true,
                        'default'    => null,
                    ],
                ]);
            }

            // 2. Deterministic Backfill for existing records
            $existingRows = $db->table($tableName)->get()->getResultArray();
            foreach ($existingRows as $row) {
                $legacyCls = strtolower(trim((string) ($row['personnel_classification'] ?? '')));
                $currentGroup = $row['personnel_group'] ?? null;
                $currentSide = $row['organizational_side'] ?? null;

                if (empty($currentGroup) || empty($currentSide)) {
                    if ($legacyCls === 'academic') {
                        $targetGroup = 'faculty';
                        $targetSide  = 'academic';
                    } else {
                        $targetGroup = 'non_teaching_faculty';
                        $targetSide  = 'non_academic';
                    }

                    $db->table($tableName)
                        ->where('profile_id', $row['profile_id'])
                        ->update([
                            'personnel_group'     => $targetGroup,
                            'organizational_side' => $targetSide,
                        ]);
                }
            }

            // 3. Add Pair Constraints & Indexes
            if ($isPg) {
                $db->query("
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint WHERE conname = 'ck_personnel_valid_classification_pair'
                        ) THEN
                            ALTER TABLE {$tableName}
                            ADD CONSTRAINT ck_personnel_valid_classification_pair CHECK (
                                (personnel_group = 'faculty' AND organizational_side = 'academic')
                                OR (personnel_group = 'non_teaching_faculty' AND organizational_side = 'academic')
                                OR (personnel_group = 'non_teaching_faculty' AND organizational_side = 'non_academic')
                            );
                        END IF;
                    END $$;
                ");

                $db->query("CREATE INDEX IF NOT EXISTS idx_personnel_group_side ON {$tableName} (personnel_group, organizational_side)");
            } else {
                $db->query("CREATE INDEX IF NOT EXISTS `idx_personnel_group_side` ON `{$tableName}` (`personnel_group`, `organizational_side`)");
            }
        }
    }

    public function down()
    {
        // Additive-safe: no destructive drop
    }
}
