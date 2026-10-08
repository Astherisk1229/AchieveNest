<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Converts personnel profiles to full-time engagement and retires the
 * part-time catalog from active database selection.
 * Existing rank titles and historical evaluation snapshots are preserved.
 */
class RetirePartTimeFaculty extends Migration
{
    private const BACKUP_TABLE = 'faculty_engagement_retirement_backup';

    public function up()
    {
        if ($this->db->tableExists('personnel_profiles') && $this->db->fieldExists('faculty_engagement', 'personnel_profiles')) {
            if (! $this->db->tableExists(self::BACKUP_TABLE)) {
                $this->forge->addField([
                    'profile_id' => ['type' => 'CHAR', 'constraint' => 36, 'null' => false],
                    'converted_at' => ['type' => 'DATETIME', 'null' => false],
                ]);
                $this->forge->addKey('profile_id', true);
                $this->forge->createTable(self::BACKUP_TABLE, true);
            }

            $affected = $this->db->table('personnel_profiles')
                ->select('profile_id, faculty_engagement')
                ->where('faculty_engagement', 'part_time_faculty')
                ->get()->getResultArray();

            foreach ($affected as $row) {
                $this->db->table(self::BACKUP_TABLE)->ignore(true)->insert([
                    'profile_id' => $row['profile_id'],
                    'converted_at' => date('Y-m-d H:i:s'),
                ]);
            }

            $update = ['faculty_engagement' => 'full_time_faculty'];
            if ($this->db->fieldExists('updated_at', 'personnel_profiles')) {
                $update['updated_at'] = date('Y-m-d H:i:s');
            }
            $this->db->table('personnel_profiles')
                ->where('faculty_engagement', 'part_time_faculty')
                ->update($update);

            $this->replaceEngagementConstraint("faculty_engagement IS NULL OR faculty_engagement = 'full_time_faculty'");
        }

        if ($this->db->tableExists('faculty_rank_catalog')) {
            $this->db->table('faculty_rank_catalog')
                ->where('catalog_type', 'part_time_faculty_title')
                ->update(['is_active' => 0]);
        }

        if ($this->db->tableExists('rank_placement_groups')) {
            $this->db->table('rank_placement_groups')
                ->where('catalog_type', 'part_time_faculty_title')
                ->update(['is_active' => 0]);
        }
    }

    public function down()
    {
        if ($this->db->tableExists('personnel_profiles') && $this->db->fieldExists('faculty_engagement', 'personnel_profiles')) {
            $this->replaceEngagementConstraint("faculty_engagement IS NULL OR faculty_engagement IN ('full_time_faculty', 'part_time_faculty')");

            if ($this->db->tableExists(self::BACKUP_TABLE)) {
                foreach ($this->db->table(self::BACKUP_TABLE)->get()->getResultArray() as $row) {
                    $this->db->table('personnel_profiles')
                        ->where('profile_id', $row['profile_id'])
                        ->update(['faculty_engagement' => 'part_time_faculty']);
                }
            }
        }

        if ($this->db->tableExists('faculty_rank_catalog')) {
            $this->db->table('faculty_rank_catalog')
                ->where('catalog_type', 'part_time_faculty_title')
                ->update(['is_active' => 1]);
        }

        if ($this->db->tableExists('rank_placement_groups')) {
            $this->db->table('rank_placement_groups')
                ->where('catalog_type', 'part_time_faculty_title')
                ->update(['is_active' => 1]);
        }

        if ($this->db->tableExists(self::BACKUP_TABLE)) {
            $this->forge->dropTable(self::BACKUP_TABLE, true);
        }
    }

    private function replaceEngagementConstraint(string $expression): void
    {
        if (! $this->db->tableExists('personnel_profiles')) return;

        if ($this->db->DBDriver === 'Postgre') {
            $this->db->query('ALTER TABLE personnel_profiles DROP CONSTRAINT IF EXISTS ck_personnel_faculty_engagement');
            $this->db->query("ALTER TABLE personnel_profiles ADD CONSTRAINT ck_personnel_faculty_engagement CHECK ({$expression})");
            return;
        }

        try {
            $this->db->query('ALTER TABLE personnel_profiles DROP CHECK ck_personnel_faculty_engagement');
        } catch (\Throwable $error) {
            // The constraint may not exist in installations using an older baseline.
        }

        try {
            $this->db->query("ALTER TABLE personnel_profiles ADD CONSTRAINT ck_personnel_faculty_engagement CHECK ({$expression})");
        } catch (\Throwable $error) {
            throw $error;
        }
    }
}
