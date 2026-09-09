<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateFacultyRankTransitions extends Migration
{
    public function up()
    {
        $this->db->query("
            CREATE TABLE IF NOT EXISTS faculty_rank_transitions (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                from_rank_code VARCHAR(100) NOT NULL,
                to_rank_code VARCHAR(100) NOT NULL,
                transition_type VARCHAR(50) NOT NULL DEFAULT 'normal_sequential',
                requires_verified_phd TINYINT(1) NOT NULL DEFAULT 0,
                rule_reference VARCHAR(255) NOT NULL DEFAULT 'NDMU-DOC-ACAD-RANKS-2026-V1',
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_rank_transition (from_rank_code, to_rank_code, transition_type),
                INDEX idx_rank_transition_from (from_rank_code, is_active),
                INDEX idx_rank_transition_type (transition_type, is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // Canonical transitions
        $transitions = [
            // Baccalaureate Tier
            ['ASSISTANT_INSTRUCTOR', 'INSTRUCTOR_I', 'normal_sequential', 0, 'NDMU-DOC-ACAD-RANKS-2026-V1/P1-T4-ENTRY'],
            ['INSTRUCTOR_I', 'SENIOR_INSTRUCTOR_I', 'normal_sequential', 0, 'NDMU-DOC-ACAD-RANKS-2026-V1/P1-T4-STEP'],

            // Board Licensure Tier
            ['SENIOR_INSTRUCTOR', 'SENIOR_INSTRUCTOR_I', 'normal_sequential', 0, 'NDMU-DOC-ACAD-RANKS-2026-V1/P1-T3-BASE'],
            ['SENIOR_INSTRUCTOR_I', 'SENIOR_INSTRUCTOR_II', 'normal_sequential', 0, 'NDMU-DOC-ACAD-RANKS-2026-V1/P1-T3-STEP'],
            ['SENIOR_INSTRUCTOR_II', 'SENIOR_INSTRUCTOR_III', 'normal_sequential', 0, 'NDMU-DOC-ACAD-RANKS-2026-V1/P1-T3-STEP'],
            ['SENIOR_INSTRUCTOR_III', 'SENIOR_INSTRUCTOR_IV', 'normal_sequential', 0, 'NDMU-DOC-ACAD-RANKS-2026-V1/P1-T3-STEP'],
            ['SENIOR_INSTRUCTOR_IV', 'ASSISTANT_PROFESSOR_I', 'normal_sequential', 0, 'NDMU-DOC-ACAD-RANKS-2026-V1/P1-T3-BRACKET'],

            // Master's Tier (Assistant Professor)
            ['ASSISTANT_PROFESSOR', 'ASSISTANT_PROFESSOR_I', 'normal_sequential', 0, 'NDMU-DOC-ACAD-RANKS-2026-V1/P1-T2-BASE'],
            ['ASSISTANT_PROFESSOR_I', 'ASSISTANT_PROFESSOR_II', 'normal_sequential', 0, 'NDMU-DOC-ACAD-RANKS-2026-V1/P1-T2-STEP'],
            ['ASSISTANT_PROFESSOR_II', 'ASSISTANT_PROFESSOR_III', 'normal_sequential', 0, 'NDMU-DOC-ACAD-RANKS-2026-V1/P1-T2-STEP'],
            ['ASSISTANT_PROFESSOR_III', 'ASSISTANT_PROFESSOR_IV', 'normal_sequential', 0, 'NDMU-DOC-ACAD-RANKS-2026-V1/P1-T2-STEP'],
            ['ASSISTANT_PROFESSOR_IV', 'ASSOCIATE_PROFESSOR_I', 'normal_sequential', 0, 'NDMU-DOC-ACAD-RANKS-2026-V1/P1-T2-BRACKET'],

            // Confirmed PhD Exception (Assistant Professor I -> Professor I)
            ['ASSISTANT_PROFESSOR_I', 'PROFESSOR_I', 'phd_exception', 1, 'NDMU-DOC-ACAD-RANKS-2026-V1/PHD-EXCEPTION-AP1-P1'],

            // Master's Tier (Associate Professor)
            ['ASSOCIATE_PROFESSOR', 'ASSOCIATE_PROFESSOR_I', 'normal_sequential', 0, 'NDMU-DOC-ACAD-RANKS-2026-V1/P1-T2-BASE'],
            ['ASSOCIATE_PROFESSOR_I', 'ASSOCIATE_PROFESSOR_II', 'normal_sequential', 0, 'NDMU-DOC-ACAD-RANKS-2026-V1/P1-T2-STEP'],
            ['ASSOCIATE_PROFESSOR_II', 'ASSOCIATE_PROFESSOR_III', 'normal_sequential', 0, 'NDMU-DOC-ACAD-RANKS-2026-V1/P1-T2-STEP'],
            ['ASSOCIATE_PROFESSOR_III', 'ASSOCIATE_PROFESSOR_IV', 'normal_sequential', 0, 'NDMU-DOC-ACAD-RANKS-2026-V1/P1-T2-STEP'],
            ['ASSOCIATE_PROFESSOR_IV', 'PROFESSOR_I', 'normal_sequential', 0, 'NDMU-DOC-ACAD-RANKS-2026-V1/P1-T2-BRACKET'],

            // Doctoral Tier (Professor)
            ['PROFESSOR_I', 'PROFESSOR_II', 'normal_sequential', 0, 'NDMU-DOC-ACAD-RANKS-2026-V1/P1-T1-STEP'],
            ['PROFESSOR_II', 'PROFESSOR_III', 'normal_sequential', 0, 'NDMU-DOC-ACAD-RANKS-2026-V1/P1-T1-STEP'],
            ['PROFESSOR_III', 'PROFESSOR_IV', 'normal_sequential', 0, 'NDMU-DOC-ACAD-RANKS-2026-V1/P1-T1-STEP'],
            ['PROFESSOR_IV', 'UNIVERSITY_PROFESSOR_I', 'normal_sequential', 0, 'NDMU-DOC-ACAD-RANKS-2026-V1/P1-T1-BRACKET'],

            // Doctoral Tier (University Professor)
            ['UNIVERSITY_PROFESSOR_I', 'UNIVERSITY_PROFESSOR_II', 'normal_sequential', 0, 'NDMU-DOC-ACAD-RANKS-2026-V1/P1-T1-STEP'],
            ['UNIVERSITY_PROFESSOR_II', 'UNIVERSITY_PROFESSOR_III', 'normal_sequential', 0, 'NDMU-DOC-ACAD-RANKS-2026-V1/P1-T1-STEP'],
            ['UNIVERSITY_PROFESSOR_III', 'UNIVERSITY_PROFESSOR_IV', 'normal_sequential', 0, 'NDMU-DOC-ACAD-RANKS-2026-V1/P1-T1-STEP'],
            ['UNIVERSITY_PROFESSOR_IV', 'UNIVERSITY_PROFESSOR', 'normal_sequential', 0, 'NDMU-DOC-ACAD-RANKS-2026-V1/P1-T1-TOP'],
        ];

        $now = date('Y-m-d H:i:s');
        foreach ($transitions as $t) {
            $existing = $this->db->table('faculty_rank_transitions')
                ->where('from_rank_code', $t[0])
                ->where('to_rank_code', $t[1])
                ->where('transition_type', $t[2])
                ->get()
                ->getRowArray();

            if (!$existing) {
                $this->db->table('faculty_rank_transitions')->insert([
                    'from_rank_code' => $t[0],
                    'to_rank_code' => $t[1],
                    'transition_type' => $t[2],
                    'requires_verified_phd' => $t[3],
                    'rule_reference' => $t[4],
                    'is_active' => 1,
                    'created_at' => $now,
                ]);
            }
        }
    }

    public function down()
    {
        $this->db->query("DROP TABLE IF EXISTS faculty_rank_transitions;");
    }
}
