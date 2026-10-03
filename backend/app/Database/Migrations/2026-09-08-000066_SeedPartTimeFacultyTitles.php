<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class SeedPartTimeFacultyTitles extends Migration
{
    public function up()
    {
        $titles = [
            ['PT_PROFESSORIAL_LECTURER', 'Professorial Lecturer', 'doctoral', 'Ph.D./Ed.D.', 1, 'P2'],
            ['PT_ASSISTANT_PROFESSORIAL_LECTURER', 'Assistant Professorial Lecturer', 'masters', 'MA/MS/MAT/MD/LL.B./Priests or Equivalent', 2, 'P2'],
            ['PT_SENIOR_LECTURER', 'Senior Lecturer', 'board_licensure', 'CPA/ENGR./MEDTECH/CHEMIST/NURSE/DVM/ARCHITECT/DMD', 3, 'P2'],
            ['PT_LECTURER', 'Lecturer', 'baccalaureate', 'AB/BSE/BS or Equivalent', 4, 'P2'],
        ];

        $now = date('Y-m-d H:i:s');
        foreach ($titles as $t) {
            $existing = $this->db->table('faculty_rank_catalog')
                ->where('catalog_type', 'part_time_faculty_title')
                ->where('rank_code', $t[0])
                ->get()
                ->getRowArray();

            if (!$existing) {
                $this->db->table('faculty_rank_catalog')->insert([
                    'rank_code' => $t[0],
                    'display_label' => $t[1],
                    'catalog_type' => 'part_time_faculty_title',
                    'qualification_tier_code' => $t[2],
                    'qualification_source_label' => $t[3],
                    'display_order' => $t[4],
                    'source_document_id' => 'NDMU-DOC-ACAD-RANKS-2026-V1',
                    'source_row_id' => $t[5],
                    'is_active' => 1,
                    'seed_version' => '2026.1',
                    'created_at' => $now,
                ]);
            } else {
                if (
                    $existing['display_label'] !== $t[1] ||
                    $existing['qualification_tier_code'] !== $t[2] ||
                    $existing['qualification_source_label'] !== $t[3] ||
                    (int)$existing['display_order'] !== $t[4]
                ) {
                    throw new \RuntimeException(
                        "Integrity error: Pre-existing Part-Time title mismatch for code [{$t[0]}]."
                    );
                }
            }
        }
    }

    public function down()
    {
        $this->db->table('faculty_rank_catalog')
            ->where('catalog_type', 'part_time_faculty_title')
            ->where('seed_version', '2026.1')
            ->delete();
    }
}
