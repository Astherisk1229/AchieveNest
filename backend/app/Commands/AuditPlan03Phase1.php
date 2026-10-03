<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;

class AuditPlan03Phase1 extends BaseCommand
{
    protected $group       = 'Audit';
    protected $name        = 'audit:plan03-phase1';
    protected $description = 'Audit database tables and data for Plan 03 Phase 1';

    public function run(array $params)
    {
        $db = Database::connect();

        CLI::write("=== PROFILES TABLE FIELDS ===", 'cyan');
        $fields = $db->getFieldData('profiles');
        foreach ($fields as $f) {
            CLI::write("  - {$f->name} ({$f->type}, max: {$f->max_length}, nullable: " . ($f->nullable ? 'YES' : 'NO') . ")");
        }

        CLI::write("\n=== STUDENT_PROFILES TABLE FIELDS ===", 'cyan');
        $fields = $db->getFieldData('student_profiles');
        foreach ($fields as $f) {
            CLI::write("  - {$f->name} ({$f->type}, max: {$f->max_length}, nullable: " . ($f->nullable ? 'YES' : 'NO') . ")");
        }

        CLI::write("\n=== STUDENT_PROGRAM_ENROLLMENTS TABLE FIELDS ===", 'cyan');
        $fields = $db->getFieldData('student_program_enrollments');
        foreach ($fields as $f) {
            CLI::write("  - {$f->name} ({$f->type}, max: {$f->max_length}, nullable: " . ($f->nullable ? 'YES' : 'NO') . ")");
        }

        CLI::write("\n=== SAMPLE PROFILES (STUDENT TYPE) ===", 'cyan');
        $students = $db->table('profiles')
            ->where('account_type', 'student')
            ->limit(5)
            ->get()
            ->getResultArray();
        foreach ($students as $s) {
            CLI::write("  ID: {$s['id']} | InstID: {$s['institutional_id']} | Name: {$s['full_name']} | Email: {$s['email']} | Sex: " . ($s['sex'] ?? 'NULL'));
        }

        CLI::write("\n=== SAMPLE STUDENT_PROFILES ===", 'cyan');
        $sp = $db->table('student_profiles')->limit(5)->get()->getResultArray();
        foreach ($sp as $s) {
            CLI::write("  ProfileID: {$s['profile_id']} | YearLevel: " . ($s['year_level'] ?? 'NULL') . " | Status: " . ($s['enrollment_status'] ?? 'NULL'));
        }

        CLI::write("\n=== SAMPLE STUDENT_PROGRAM_ENROLLMENTS ===", 'cyan');
        $spe = $db->table('student_program_enrollments')->limit(5)->get()->getResultArray();
        foreach ($spe as $s) {
            CLI::write("  ID: {$s['id']} | ProfileID: {$s['student_profile_id']} | ProgID: {$s['academic_program_id']} | YearLevel: " . ($s['year_level'] ?? 'NULL') . " | Active: {$s['is_active']}");
        }

        CLI::write("\n=== CACHE CONSISTENCY CHECK ===", 'cyan');
        $inconsistencies = $db->query("
            SELECT sp.profile_id, sp.year_level as sp_year, spe.year_level as spe_year
            FROM student_profiles sp
            JOIN student_program_enrollments spe ON spe.student_profile_id = sp.profile_id AND spe.is_active = 1
            WHERE sp.year_level != spe.year_level
        ")->getResultArray();
        CLI::write("Inconsistent year levels count: " . count($inconsistencies));
        foreach ($inconsistencies as $inc) {
            CLI::write("  Profile: {$inc['profile_id']} | student_profiles.year_level: {$inc['sp_year']} | student_program_enrollments.year_level: {$inc['spe_year']}");
        }

        CLI::write("\n=== SEARCHING ALL TABLES FOR 'sex' OR 'gender' COLUMNS ===", 'cyan');
        $allTables = $db->listTables();
        $found = false;
        foreach ($allTables as $table) {
            $fields = $db->getFieldData($table);
            foreach ($fields as $f) {
                if (stripos($f->name, 'sex') !== false || stripos($f->name, 'gender') !== false) {
                    CLI::write("  Found in table '{$table}': column '{$f->name}' ({$f->type}, max: {$f->max_length})");
                    $found = true;
                }
            }
        }
        if (!$found) {
            CLI::write("  NO 'sex' or 'gender' columns found in ANY database table!", 'yellow');
        }
    }
}
