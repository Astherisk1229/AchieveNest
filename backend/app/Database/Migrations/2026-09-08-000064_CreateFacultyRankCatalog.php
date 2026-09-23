<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateFacultyRankCatalog extends Migration
{
    public function up()
    {
        $this->db->query("
            CREATE TABLE IF NOT EXISTS faculty_rank_catalog (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                rank_code VARCHAR(100) NOT NULL,
                display_label VARCHAR(150) NOT NULL,
                catalog_type VARCHAR(50) NOT NULL DEFAULT 'full_time_academic_rank',
                qualification_tier_code VARCHAR(50) NOT NULL,
                qualification_source_label VARCHAR(255) NOT NULL,
                display_order INT UNSIGNED NOT NULL,
                source_document_id VARCHAR(100) NOT NULL DEFAULT 'NDMU-DOC-ACAD-RANKS-2026-V1',
                source_row_id VARCHAR(100) NOT NULL DEFAULT 'P1',
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                seed_version VARCHAR(50) NOT NULL DEFAULT '2026.1',
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_faculty_rank_type_code (catalog_type, rank_code),
                UNIQUE KEY uq_faculty_rank_type_label (catalog_type, display_label),
                INDEX idx_faculty_rank_tier (catalog_type, qualification_tier_code, display_order)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // Seed 26 Full-time Academic Ranks transactionally & idempotently
        $ranks = [
            // Doctoral Tier (9 ranks)
            ['UNIVERSITY_PROFESSOR', 'University Professor', 'doctoral', 'Ph.D./Ed.D.', 1, 'P1'],
            ['UNIVERSITY_PROFESSOR_IV', 'University Professor IV', 'doctoral', 'Ph.D./Ed.D.', 2, 'P1'],
            ['UNIVERSITY_PROFESSOR_III', 'University Professor III', 'doctoral', 'Ph.D./Ed.D.', 3, 'P1'],
            ['UNIVERSITY_PROFESSOR_II', 'University Professor II', 'doctoral', 'Ph.D./Ed.D.', 4, 'P1'],
            ['UNIVERSITY_PROFESSOR_I', 'University Professor I', 'doctoral', 'Ph.D./Ed.D.', 5, 'P1'],
            ['PROFESSOR_IV', 'Professor IV', 'doctoral', 'Ph.D./Ed.D.', 6, 'P1'],
            ['PROFESSOR_III', 'Professor III', 'doctoral', 'Ph.D./Ed.D.', 7, 'P1'],
            ['PROFESSOR_II', 'Professor II', 'doctoral', 'Ph.D./Ed.D.', 8, 'P1'],
            ['PROFESSOR_I', 'Professor I', 'doctoral', 'Ph.D./Ed.D.', 9, 'P1'],

            // Master's Tier (10 ranks)
            ['ASSOCIATE_PROFESSOR', 'Associate Professor', 'masters', 'MA/MS/MAT/MD/LL.B./Priests or Equivalent', 10, 'P1'],
            ['ASSOCIATE_PROFESSOR_IV', 'Associate Professor IV', 'masters', 'MA/MS/MAT/MD/LL.B./Priests or Equivalent', 11, 'P1'],
            ['ASSOCIATE_PROFESSOR_III', 'Associate Professor III', 'masters', 'MA/MS/MAT/MD/LL.B./Priests or Equivalent', 12, 'P1'],
            ['ASSOCIATE_PROFESSOR_II', 'Associate Professor II', 'masters', 'MA/MS/MAT/MD/LL.B./Priests or Equivalent', 13, 'P1'],
            ['ASSOCIATE_PROFESSOR_I', 'Associate Professor I', 'masters', 'MA/MS/MAT/MD/LL.B./Priests or Equivalent', 14, 'P1'],
            ['ASSISTANT_PROFESSOR', 'Assistant Professor', 'masters', 'MA/MS/MAT/MD/LL.B./Priests or Equivalent', 15, 'P1'],
            ['ASSISTANT_PROFESSOR_IV', 'Assistant Professor IV', 'masters', 'MA/MS/MAT/MD/LL.B./Priests or Equivalent', 16, 'P1'],
            ['ASSISTANT_PROFESSOR_III', 'Assistant Professor III', 'masters', 'MA/MS/MAT/MD/LL.B./Priests or Equivalent', 17, 'P1'],
            ['ASSISTANT_PROFESSOR_II', 'Assistant Professor II', 'masters', 'MA/MS/MAT/MD/LL.B./Priests or Equivalent', 18, 'P1'],
            ['ASSISTANT_PROFESSOR_I', 'Assistant Professor I', 'masters', 'MA/MS/MAT/MD/LL.B./Priests or Equivalent', 19, 'P1'],

            // Board Licensure Tier (5 ranks)
            ['SENIOR_INSTRUCTOR', 'Senior Instructor', 'board_licensure', 'CPA/ENGR./MEDTECH/CHEMIST/NURSE/DVM/SOCIAL WORKER/ARCHITECT/DMD', 20, 'P1'],
            ['SENIOR_INSTRUCTOR_IV', 'Senior Instructor IV', 'board_licensure', 'CPA/ENGR./MEDTECH/CHEMIST/NURSE/DVM/SOCIAL WORKER/ARCHITECT/DMD', 21, 'P1'],
            ['SENIOR_INSTRUCTOR_III', 'Senior Instructor III', 'board_licensure', 'CPA/ENGR./MEDTECH/CHEMIST/NURSE/DVM/SOCIAL WORKER/ARCHITECT/DMD', 22, 'P1'],
            ['SENIOR_INSTRUCTOR_II', 'Senior Instructor II', 'board_licensure', 'CPA/ENGR./MEDTECH/CHEMIST/NURSE/DVM/SOCIAL WORKER/ARCHITECT/DMD', 23, 'P1'],
            ['SENIOR_INSTRUCTOR_I', 'Senior Instructor I', 'board_licensure', 'CPA/ENGR./MEDTECH/CHEMIST/NURSE/DVM/SOCIAL WORKER/ARCHITECT/DMD', 24, 'P1'],

            // Baccalaureate Tier (2 ranks)
            ['INSTRUCTOR_I', 'Instructor I', 'baccalaureate', 'AB/BSE/BS or Equivalent', 25, 'P1'],
            ['ASSISTANT_INSTRUCTOR', 'Assistant Instructor', 'baccalaureate', 'AB/BSE/BS or Equivalent', 26, 'P1'],
        ];

        $now = date('Y-m-d H:i:s');
        foreach ($ranks as $r) {
            $existing = $this->db->table('faculty_rank_catalog')
                ->where('catalog_type', 'full_time_academic_rank')
                ->where('rank_code', $r[0])
                ->get()
                ->getRowArray();

            if (!$existing) {
                $this->db->table('faculty_rank_catalog')->insert([
                    'rank_code' => $r[0],
                    'display_label' => $r[1],
                    'catalog_type' => 'full_time_academic_rank',
                    'qualification_tier_code' => $r[2],
                    'qualification_source_label' => $r[3],
                    'display_order' => $r[4],
                    'source_document_id' => 'NDMU-DOC-ACAD-RANKS-2026-V1',
                    'source_row_id' => $r[5],
                    'is_active' => 1,
                    'seed_version' => '2026.1',
                    'created_at' => $now,
                ]);
            } else {
                // Verify source-controlled attributes match exactly
                if (
                    $existing['display_label'] !== $r[1] ||
                    $existing['qualification_tier_code'] !== $r[2] ||
                    $existing['qualification_source_label'] !== $r[3] ||
                    (int)$existing['display_order'] !== $r[4]
                ) {
                    throw new \RuntimeException(
                        "Integrity error: Pre-existing faculty rank mismatch for rank_code [{$r[0]}]. Expected '{$r[1]}', found '{$existing['display_label']}'."
                    );
                }
            }
        }
    }

    public function down()
    {
        $this->db->table('faculty_rank_catalog')
            ->where('catalog_type', 'full_time_academic_rank')
            ->where('seed_version', '2026.1')
            ->delete();
    }
}
