<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Migration: AddFacultyStatusAndMasterDataFields
 *
 * Plan D — Phase D2: Faculty Status & Master Data.
 * Adds HR-controlled faculty engagement, employment status constraints,
 * separate position title, rank title, and structured qualifications.
 */
class AddFacultyStatusAndMasterDataFields extends Migration
{
    public function up()
    {
        $db = $this->db;
        $forge = \Config\Database::forge();
        $isPg = ($db->DBDriver === 'Postgre');

        $tableName = $db->tableExists('public.personnel_profiles') ? 'public.personnel_profiles' : ($db->tableExists('personnel_profiles') ? 'personnel_profiles' : null);

        if ($tableName !== null) {
            // 1. Drop legacy employment_status check constraint so we can update to permanent/probationary
            if ($isPg) {
                $db->query("
                    DO $$
                    BEGIN
                        IF EXISTS (
                            SELECT 1 FROM pg_constraint WHERE conname = 'ck_personnel_profiles_employment_status'
                        ) THEN
                            ALTER TABLE {$tableName} DROP CONSTRAINT ck_personnel_profiles_employment_status;
                        END IF;
                    END $$;
                ");
            } else {
                try {
                    $db->query("ALTER TABLE `{$tableName}` DROP CONSTRAINT `ck_personnel_profiles_employment_status`");
                } catch (\Throwable $e) {}
                try {
                    $db->query("ALTER TABLE `{$tableName}` DROP CHECK `ck_personnel_profiles_employment_status`");
                } catch (\Throwable $e) {}
            }

            // 2. Add new columns if not present
            $fieldsToAdd = [];

            if (! $db->fieldExists('faculty_engagement', $tableName)) {
                $fieldsToAdd['faculty_engagement'] = [
                    'type'       => 'VARCHAR',
                    'constraint' => '32',
                    'null'       => true,
                    'default'    => null,
                ];
            }

            if (! $db->fieldExists('position_title', $tableName)) {
                $fieldsToAdd['position_title'] = [
                    'type'       => 'VARCHAR',
                    'constraint' => '150',
                    'null'       => true,
                    'default'    => null,
                ];
            }

            if (! $db->fieldExists('current_rank_title', $tableName)) {
                $fieldsToAdd['current_rank_title'] = [
                    'type'       => 'VARCHAR',
                    'constraint' => '100',
                    'null'       => true,
                    'default'    => null,
                ];
            }

            if (! $db->fieldExists('qualification_summary', $tableName)) {
                $fieldsToAdd['qualification_summary'] = [
                    'type'       => 'VARCHAR',
                    'constraint' => '255',
                    'null'       => true,
                    'default'    => null,
                ];
            }

            if (! empty($fieldsToAdd)) {
                $forge->addColumn($tableName, $fieldsToAdd);
            }

            // 3. Deterministic Backfill & Legacy Reconciliation
            $existingRows = $db->table($tableName)->get()->getResultArray();
            foreach ($existingRows as $row) {
                $profileId = $row['profile_id'];
                $profileRow = $db->table('profiles')->where('id', $profileId)->get()->getRowArray();

                $rawEmpStatus = strtolower(trim((string) ($row['employment_status'] ?? '')));
                $rawGroup = strtolower(trim((string) ($row['personnel_group'] ?? '')));
                $rawCls   = strtolower(trim((string) ($row['personnel_classification'] ?? '')));
                $isFaculty = ($rawGroup === 'faculty' || $rawGroup === 'non_teaching_faculty' || $rawCls === 'academic');

                // Map faculty engagement
                $targetEngagement = $row['faculty_engagement'] ?? null;
                if (empty($targetEngagement) && $isFaculty) {
                    $targetEngagement = ($rawEmpStatus === 'part_time') ? 'part_time_faculty' : 'full_time_faculty';
                }

                // Map employment status to permanent / probationary
                $targetEmploymentStatus = 'permanent';
                if ($rawEmpStatus === 'probationary') {
                    $targetEmploymentStatus = 'probationary';
                }

                // Map position title and current rank title
                $designation = $profileRow['designation_title'] ?? 'Faculty Member';
                $existingRank = $row['rank_level'] ?? null;
                $targetPosition = $row['position_title'] ?? $designation;
                $targetRank = $row['current_rank_title'] ?? ($existingRank ?: $designation);

                $db->table($tableName)
                    ->where('profile_id', $profileId)
                    ->update([
                        'faculty_engagement'    => $targetEngagement,
                        'employment_status'     => $targetEmploymentStatus,
                        'position_title'        => $targetPosition,
                        'current_rank_title'    => $targetRank,
                        'rank_level'            => $targetRank,
                        'qualification_summary' => $row['qualification_summary'] ?? 'Bachelor Degree / Masteral Units',
                    ]);
            }

            // 4. Create Structured Qualifications table if not exists
            if (! $db->tableExists('personnel_qualifications')) {
                $forge->addField([
                    'id' => [
                        'type'       => 'CHAR',
                        'constraint' => '36',
                        'null'       => false,
                    ],
                    'personnel_profile_id' => [
                        'type'       => 'CHAR',
                        'constraint' => '36',
                        'null'       => false,
                    ],
                    'qualification_type' => [
                        'type'       => 'VARCHAR',
                        'constraint' => '50',
                        'default'    => 'degree',
                    ],
                    'title' => [
                        'type'       => 'VARCHAR',
                        'constraint' => '255',
                        'null'       => false,
                    ],
                    'institution' => [
                        'type'       => 'VARCHAR',
                        'constraint' => '255',
                        'null'       => true,
                    ],
                    'year_obtained' => [
                        'type'       => 'VARCHAR',
                        'constraint' => '10',
                        'null'       => true,
                    ],
                    'is_highest' => [
                        'type'       => 'TINYINT',
                        'constraint' => '1',
                        'default'    => 0,
                    ],
                    'created_at' => [
                        'type'       => 'DATETIME',
                        'null'       => true,
                    ],
                    'updated_at' => [
                        'type'       => 'DATETIME',
                        'null'       => true,
                    ],
                ]);
                $forge->addKey('id', true);
                $forge->addKey('personnel_profile_id');
                $forge->createTable('personnel_qualifications', true);
            }

            // 5. Add Constraints and Indexes
            if ($isPg) {
                $db->query("
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint WHERE conname = 'ck_personnel_faculty_engagement'
                        ) THEN
                            ALTER TABLE {$tableName}
                            ADD CONSTRAINT ck_personnel_faculty_engagement CHECK (
                                faculty_engagement IS NULL OR faculty_engagement IN ('full_time_faculty', 'part_time_faculty')
                            );
                        END IF;

                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint WHERE conname = 'ck_personnel_employment_status_d2'
                        ) THEN
                            ALTER TABLE {$tableName}
                            ADD CONSTRAINT ck_personnel_employment_status_d2 CHECK (
                                employment_status IN ('permanent', 'probationary')
                            );
                        END IF;
                    END $$;
                ");

                $db->query("CREATE INDEX IF NOT EXISTS idx_personnel_status_engagement ON {$tableName} (faculty_engagement, employment_status)");
            } else {
                try {
                    $db->query("CREATE INDEX `idx_personnel_status_engagement` ON `{$tableName}` (`faculty_engagement`, `employment_status`)");
                } catch (\Throwable $e) {}

                try {
                    $db->query("
                        ALTER TABLE `{$tableName}`
                        ADD CONSTRAINT `ck_personnel_faculty_engagement` CHECK (
                            faculty_engagement IS NULL OR faculty_engagement IN ('full_time_faculty', 'part_time_faculty')
                        )
                    ");
                } catch (\Throwable $e) {}

                try {
                    $db->query("
                        ALTER TABLE `{$tableName}`
                        ADD CONSTRAINT `ck_personnel_employment_status_d2` CHECK (
                            employment_status IN ('permanent', 'probationary')
                        )
                    ");
                } catch (\Throwable $e) {}
            }
        }
    }

    public function down()
    {
        // Additive-safe: no destructive drops
    }
}
