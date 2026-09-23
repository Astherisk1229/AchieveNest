<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateEvaluationScaleCatalogue extends Migration
{
    public function up()
    {
        // 1. evaluation_scales
        $this->forge->addField([
            'id' => [
                'type'       => 'VARCHAR',
                'constraint' => 64,
            ],
            'scale_code' => [
                'type'       => 'VARCHAR',
                'constraint' => 64,
                'unique'     => true,
            ],
            'title' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
            ],
            'description' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'total_points' => [
                'type'       => 'DECIMAL',
                'constraint' => '8,2',
                'default'    => 160.00,
            ],
            'passing_score' => [
                'type'       => 'DECIMAL',
                'constraint' => '8,2',
                'default'    => 120.00,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('evaluation_scales', true);

        // 2. evaluation_scale_versions
        $this->forge->addField([
            'id' => [
                'type'       => 'VARCHAR',
                'constraint' => 64,
            ],
            'scale_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 64,
            ],
            'version_number' => [
                'type'       => 'VARCHAR',
                'constraint' => 32,
            ],
            'evaluation_cycle_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 32,
            ],
            'status' => [
                'type'       => 'ENUM',
                'constraint' => ['draft', 'approved', 'retired'],
                'default'    => 'approved',
            ],
            'total_max_points' => [
                'type'       => 'DECIMAL',
                'constraint' => '8,2',
            ],
            'passing_score' => [
                'type'       => 'DECIMAL',
                'constraint' => '8,2',
            ],
            'effective_start_date' => [
                'type' => 'DATE',
                'null' => true,
            ],
            'effective_end_date' => [
                'type' => 'DATE',
                'null' => true,
            ],
            'approved_by_user_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 64,
                'null'       => true,
            ],
            'approved_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'source_document_ref' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addKey(['scale_id', 'version_number'], false, 'idx_esv_scale_version');
        $this->forge->addKey(['scale_id', 'evaluation_cycle_id', 'status'], false, 'idx_esv_scale_cycle_status');
        $this->forge->createTable('evaluation_scale_versions', true);

        // 3. evaluation_scale_areas
        $this->forge->addField([
            'id' => [
                'type'       => 'VARCHAR',
                'constraint' => 64,
            ],
            'scale_version_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 64,
            ],
            'area_code' => [
                'type'       => 'VARCHAR',
                'constraint' => 8,
            ],
            'name' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
            ],
            'description' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'display_order' => [
                'type'       => 'INT',
                'constraint' => 11,
                'default'    => 1,
            ],
            'max_points' => [
                'type'       => 'DECIMAL',
                'constraint' => '8,2',
                'default'    => 0.00,
            ],
            'entry_policy' => [
                'type'       => 'ENUM',
                'constraint' => [
                    'personnel_entry_allowed',
                    'personnel_entry_disallowed_read_only',
                    'evaluator_only',
                    'informational_only'
                ],
                'default'    => 'personnel_entry_allowed',
            ],
            'source_ref' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addKey(['scale_version_id', 'area_code'], false, 'idx_esa_version_area');
        $this->forge->createTable('evaluation_scale_areas', true);

        // 4. evaluation_scale_categories
        $this->forge->addField([
            'id' => [
                'type'       => 'VARCHAR',
                'constraint' => 64,
            ],
            'scale_area_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 64,
            ],
            'category_code' => [
                'type'       => 'VARCHAR',
                'constraint' => 32,
            ],
            'name' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
            ],
            'description' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'display_order' => [
                'type'       => 'INT',
                'constraint' => 11,
                'default'    => 1,
            ],
            'max_points' => [
                'type'       => 'DECIMAL',
                'constraint' => '8,2',
                'default'    => 0.00,
            ],
            'source_ref' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addKey(['scale_area_id', 'category_code'], false, 'idx_esc_area_category');
        $this->forge->createTable('evaluation_scale_categories', true);

        // 5. evaluation_scale_subcategories
        $this->forge->addField([
            'id' => [
                'type'       => 'VARCHAR',
                'constraint' => 64,
            ],
            'scale_category_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 64,
            ],
            'subcategory_code' => [
                'type'       => 'VARCHAR',
                'constraint' => 32,
            ],
            'name' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
            ],
            'description' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'display_order' => [
                'type'       => 'INT',
                'constraint' => 11,
                'default'    => 1,
            ],
            'default_points' => [
                'type'       => 'DECIMAL',
                'constraint' => '8,2',
                'default'    => 0.00,
            ],
            'source_ref' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addKey(['scale_category_id', 'subcategory_code'], false, 'idx_ess_cat_subcat');
        $this->forge->createTable('evaluation_scale_subcategories', true);

        // 6. evaluation_scale_criteria
        $this->forge->addField([
            'id' => [
                'type'       => 'VARCHAR',
                'constraint' => 64,
            ],
            'scale_category_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 64,
            ],
            'scale_subcategory_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 64,
                'null'       => true,
            ],
            'criterion_code' => [
                'type'       => 'VARCHAR',
                'constraint' => 64,
            ],
            'name' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
            ],
            'description' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'field_schema' => [
                'type' => 'JSON',
                'null' => true,
            ],
            'evidence_rules' => [
                'type' => 'JSON',
                'null' => true,
            ],
            'formula_key' => [
                'type'       => 'VARCHAR',
                'constraint' => 64,
                'null'       => true,
            ],
            'formula_params' => [
                'type' => 'JSON',
                'null' => true,
            ],
            'max_points_per_entry' => [
                'type'       => 'DECIMAL',
                'constraint' => '8,2',
                'default'    => 0.00,
            ],
            'max_occurrences' => [
                'type'       => 'INT',
                'constraint' => 11,
                'null'       => true,
            ],
            'source_ref' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addKey(['scale_category_id', 'criterion_code'], false, 'idx_escr_cat_criterion');
        $this->forge->createTable('evaluation_scale_criteria', true);

        // 7. evaluation_scale_change_events
        $this->forge->addField([
            'id' => [
                'type'       => 'VARCHAR',
                'constraint' => 64,
            ],
            'scale_version_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 64,
            ],
            'action' => [
                'type'       => 'VARCHAR',
                'constraint' => 64,
            ],
            'actor_user_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 64,
            ],
            'reason' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'before_state' => [
                'type' => 'JSON',
                'null' => true,
            ],
            'after_state' => [
                'type' => 'JSON',
                'null' => true,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addKey(['scale_version_id', 'created_at'], false, 'idx_esce_version_time');
        $this->forge->createTable('evaluation_scale_change_events', true);

        // Seed Canonical Scales and Versions
        $this->seedCanonicalCatalogue();
    }

    private function seedCanonicalCatalogue()
    {
        $db = \Config\Database::connect();
        $now = date('Y-m-d H:i:s');

        // 1. ADMINISTRATORS_RANKING_SCALE
        $scaleAdminId = 'scale-admin-001';
        $db->table('evaluation_scales')->insert([
            'id' => $scaleAdminId,
            'scale_code' => 'ADMINISTRATORS_RANKING_SCALE',
            'title' => 'NDMU Administrators & Academic Faculty Ranking Scale',
            'description' => 'Official NDMU Faculty and Academic Administrator Point Schedule & Criteria (Total: 160 pts, Passing: 120 pts)',
            'total_points' => 160.00,
            'passing_score' => 120.00,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $scaleAdminVerId = 'ver-admin-2025-001';
        $db->table('evaluation_scale_versions')->insert([
            'id' => $scaleAdminVerId,
            'scale_id' => $scaleAdminId,
            'version_number' => '1.0.0',
            'evaluation_cycle_id' => '2025-2026',
            'status' => 'approved',
            'total_max_points' => 160.00,
            'passing_score' => 120.00,
            'effective_start_date' => '2025-06-01',
            'effective_end_date' => '2026-05-31',
            'approved_by_user_id' => 'hr_admin_system',
            'approved_at' => $now,
            'source_document_ref' => 'NDMU-RANK-ADMIN-2025-V1 (Official Faculty Ranking Manual)',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // Areas for Administrators Scale
        // Area A (70)
        $areaAId = 'area-admin-a';
        $db->table('evaluation_scale_areas')->insert([
            'id' => $areaAId,
            'scale_version_id' => $scaleAdminVerId,
            'area_code' => 'A',
            'name' => 'Area A: Professional Development',
            'description' => 'Educational attainment, advanced degree units, professional affiliations, and attendance to verified seminars/trainings.',
            'display_order' => 1,
            'max_points' => 70.00,
            'entry_policy' => 'personnel_entry_allowed',
            'source_ref' => 'NDMU-RANK-ADMIN-2025-V1, Sec 1 (p. 2-5)',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // Area B (50)
        $areaBId = 'area-admin-b';
        $db->table('evaluation_scale_areas')->insert([
            'id' => $areaBId,
            'scale_version_id' => $scaleAdminVerId,
            'area_code' => 'B',
            'name' => 'Area B: Productivity and Creative Work',
            'description' => 'Guest lectures, publications, conduct of research, professional recognitions, and production of instructional materials.',
            'display_order' => 2,
            'max_points' => 50.00,
            'entry_policy' => 'personnel_entry_allowed',
            'source_ref' => 'NDMU-RANK-ADMIN-2025-V1, Sec 2 (p. 6-12)',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // Area C (40)
        $areaCId = 'area-admin-c';
        $db->table('evaluation_scale_areas')->insert([
            'id' => $areaCId,
            'scale_version_id' => $scaleAdminVerId,
            'area_code' => 'C',
            'name' => 'Area C: Service and Leadership',
            'description' => 'Involvement in extra-curricular activities, institutional committees, community/civic involvement, and NDMU service credit.',
            'display_order' => 3,
            'max_points' => 40.00,
            'entry_policy' => 'personnel_entry_allowed',
            'source_ref' => 'NDMU-RANK-ADMIN-2025-V1, Sec 3 (p. 13-18)',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // Categories & Subcategories for Area A
        $catA1 = 'cat-admin-a1';
        $db->table('evaluation_scale_categories')->insert([
            'id' => $catA1,
            'scale_area_id' => $areaAId,
            'category_code' => 'A.1',
            'name' => 'A.1 Degree/s',
            'description' => 'Earned graduate degrees and graduate units from recognized institutions.',
            'display_order' => 1,
            'max_points' => 40.00,
            'source_ref' => 'NDMU-RANK-ADMIN-2025-V1, Table A.1',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $db->table('evaluation_scale_subcategories')->insertBatch([
            ['id' => 'sub-a1-1', 'scale_category_id' => $catA1, 'subcategory_code' => 'A.1.1', 'name' => 'Ph.D. Degree Holder', 'description' => 'Doctoral Degree in related discipline', 'display_order' => 1, 'default_points' => 40.00, 'source_ref' => 'Table A.1, Row 1', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 'sub-a1-2', 'scale_category_id' => $catA1, 'subcategory_code' => 'A.1.2', 'name' => 'Ph.D. Units Earned', 'description' => '2 points per 3 units (Max 10 pts)', 'display_order' => 2, 'default_points' => 10.00, 'source_ref' => 'Table A.1, Row 2', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 'sub-a1-3', 'scale_category_id' => $catA1, 'subcategory_code' => 'A.1.3', 'name' => 'MA Degree Holder', 'description' => 'Master\'s Degree in related discipline', 'display_order' => 3, 'default_points' => 20.00, 'source_ref' => 'Table A.1, Row 3', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 'sub-a1-4', 'scale_category_id' => $catA1, 'subcategory_code' => 'A.1.4', 'name' => 'MA Units Earned', 'description' => '1 point per 3 units (Max 10 pts)', 'display_order' => 4, 'default_points' => 10.00, 'source_ref' => 'Table A.1, Row 4', 'created_at' => $now, 'updated_at' => $now],
        ]);

        $catA2 = 'cat-admin-a2';
        $db->table('evaluation_scale_categories')->insert([
            'id' => $catA2,
            'scale_area_id' => $areaAId,
            'category_code' => 'A.2',
            'name' => 'A.2 Active Membership to Prof Orgs',
            'description' => 'Official active membership or executive leadership in professional societies.',
            'display_order' => 2,
            'max_points' => 10.00,
            'source_ref' => 'NDMU-RANK-ADMIN-2025-V1, Table A.2',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $db->table('evaluation_scale_subcategories')->insertBatch([
            ['id' => 'sub-a2-1', 'scale_category_id' => $catA2, 'subcategory_code' => 'A.2.1', 'name' => 'Regular Member', 'description' => 'Active registered member', 'display_order' => 1, 'default_points' => 5.00, 'source_ref' => 'Table A.2, Row 1', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 'sub-a2-2', 'scale_category_id' => $catA2, 'subcategory_code' => 'A.2.2', 'name' => 'Officer / Board Position', 'description' => 'Elected/appointed officer or board member', 'display_order' => 2, 'default_points' => 10.00, 'source_ref' => 'Table A.2, Row 2', 'created_at' => $now, 'updated_at' => $now],
        ]);

        $catA3 = 'cat-admin-a3';
        $db->table('evaluation_scale_categories')->insert([
            'id' => $catA3,
            'scale_area_id' => $areaAId,
            'category_code' => 'A.3',
            'name' => 'A.3 Attendance to Seminars/Trainings',
            'description' => 'Participation in certified institutional, local, national, or international conferences.',
            'display_order' => 3,
            'max_points' => 20.00,
            'source_ref' => 'NDMU-RANK-ADMIN-2025-V1, Table A.3',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $db->table('evaluation_scale_subcategories')->insertBatch([
            ['id' => 'sub-a3-1', 'scale_category_id' => $catA3, 'subcategory_code' => 'A.3.1', 'name' => 'In-House Seminar (NDMU)', 'description' => 'NDMU-organized seminar (3 pts)', 'display_order' => 1, 'default_points' => 3.00, 'source_ref' => 'Table A.3, Row 1', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 'sub-a3-2', 'scale_category_id' => $catA3, 'subcategory_code' => 'A.3.2', 'name' => 'City / Provincial Seminar', 'description' => 'Local/Provincial training (4 pts)', 'display_order' => 2, 'default_points' => 4.00, 'source_ref' => 'Table A.3, Row 2', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 'sub-a3-3', 'scale_category_id' => $catA3, 'subcategory_code' => 'A.3.3', 'name' => 'Regional Seminar', 'description' => 'Region XII / Regional conference (6 pts)', 'display_order' => 3, 'default_points' => 6.00, 'source_ref' => 'Table A.3, Row 3', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 'sub-a3-4', 'scale_category_id' => $catA3, 'subcategory_code' => 'A.3.4', 'name' => 'National Seminar', 'description' => 'National conference/symposium (8 pts)', 'display_order' => 4, 'default_points' => 8.00, 'source_ref' => 'Table A.3, Row 4', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 'sub-a3-5', 'scale_category_id' => $catA3, 'subcategory_code' => 'A.3.5', 'name' => 'International Seminar', 'description' => 'International conference (10 pts)', 'display_order' => 5, 'default_points' => 10.00, 'source_ref' => 'Table A.3, Row 5', 'created_at' => $now, 'updated_at' => $now],
        ]);

        // Categories for Area B
        $catB1 = 'cat-admin-b1';
        $db->table('evaluation_scale_categories')->insert([
            'id' => $catB1,
            'scale_area_id' => $areaBId,
            'category_code' => 'B.1',
            'name' => 'B.1 Guest Lecturer / Consultant / Judge',
            'description' => 'Resource speaker, consultant, contest judge, or session chair.',
            'display_order' => 1,
            'max_points' => 40.00,
            'source_ref' => 'NDMU-RANK-ADMIN-2025-V1, Table B.1',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $db->table('evaluation_scale_subcategories')->insertBatch([
            ['id' => 'sub-b1-1', 'scale_category_id' => $catB1, 'subcategory_code' => 'B.1.1', 'name' => 'Keynote Speaker', 'description' => '10 pts per keynote address', 'display_order' => 1, 'default_points' => 10.00, 'source_ref' => 'Table B.1, Row 1', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 'sub-b1-2', 'scale_category_id' => $catB1, 'subcategory_code' => 'B.1.2', 'name' => 'Resource Person / Consultant', 'description' => '8 pts per engagement', 'display_order' => 2, 'default_points' => 8.00, 'source_ref' => 'Table B.1, Row 2', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 'sub-b1-3', 'scale_category_id' => $catB1, 'subcategory_code' => 'B.1.3', 'name' => 'Facilitator / Event Organizer', 'description' => '6 pts per event', 'display_order' => 3, 'default_points' => 6.00, 'source_ref' => 'Table B.1, Row 3', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 'sub-b1-4', 'scale_category_id' => $catB1, 'subcategory_code' => 'B.1.4', 'name' => 'Judge / Evaluator', 'description' => '5 pts per competition', 'display_order' => 4, 'default_points' => 5.00, 'source_ref' => 'Table B.1, Row 4', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 'sub-b1-5', 'scale_category_id' => $catB1, 'subcategory_code' => 'B.1.5', 'name' => 'Reactor / Panelist', 'description' => '3 pts per panel', 'display_order' => 5, 'default_points' => 3.00, 'source_ref' => 'Table B.1, Row 5', 'created_at' => $now, 'updated_at' => $now],
        ]);

        $catB2 = 'cat-admin-b2';
        $db->table('evaluation_scale_categories')->insert([
            'id' => $catB2,
            'scale_area_id' => $areaBId,
            'category_code' => 'B.2',
            'name' => 'B.2 Publication',
            'description' => 'Peer-reviewed articles, books, monographs, and scholarly papers.',
            'display_order' => 2,
            'max_points' => 40.00,
            'source_ref' => 'NDMU-RANK-ADMIN-2025-V1, Table B.2',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $db->table('evaluation_scale_subcategories')->insertBatch([
            ['id' => 'sub-b2-1', 'scale_category_id' => $catB2, 'subcategory_code' => 'B.2.1', 'name' => 'Book (Authored / Co-authored)', 'description' => '5 pts per book', 'display_order' => 1, 'default_points' => 5.00, 'source_ref' => 'Table B.2, Row 1', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 'sub-b2-2', 'scale_category_id' => $catB2, 'subcategory_code' => 'B.2.2', 'name' => 'Scholarly Paper / Journal Article', 'description' => '5 pts per publication', 'display_order' => 2, 'default_points' => 5.00, 'source_ref' => 'Table B.2, Row 2', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 'sub-b2-3', 'scale_category_id' => $catB2, 'subcategory_code' => 'B.2.3', 'name' => 'Monograph / Review / Commentary', 'description' => '2-4 pts', 'display_order' => 3, 'default_points' => 4.00, 'source_ref' => 'Table B.2, Row 3', 'created_at' => $now, 'updated_at' => $now],
        ]);

        $catB3 = 'cat-admin-b3';
        $db->table('evaluation_scale_categories')->insert([
            'id' => $catB3,
            'scale_area_id' => $areaBId,
            'category_code' => 'B.3',
            'name' => 'B.3 Conduct of Research',
            'description' => 'Institutional and externally funded research projects.',
            'display_order' => 3,
            'max_points' => 40.00,
            'source_ref' => 'NDMU-RANK-ADMIN-2025-V1, Table B.3',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $db->table('evaluation_scale_subcategories')->insertBatch([
            ['id' => 'sub-b3-1', 'scale_category_id' => $catB3, 'subcategory_code' => 'B.3.1', 'name' => 'Completed Institutional Research', 'description' => '15 pts', 'display_order' => 1, 'default_points' => 15.00, 'source_ref' => 'Table B.3, Row 1', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 'sub-b3-2', 'scale_category_id' => $catB3, 'subcategory_code' => 'B.3.2', 'name' => 'Externally Funded Research Project', 'description' => '20 pts', 'display_order' => 2, 'default_points' => 20.00, 'source_ref' => 'Table B.3, Row 2', 'created_at' => $now, 'updated_at' => $now],
        ]);

        $catB4 = 'cat-admin-b4';
        $db->table('evaluation_scale_categories')->insert([
            'id' => $catB4,
            'scale_area_id' => $areaBId,
            'category_code' => 'B.4',
            'name' => 'B.4 Professional Recognition or Awards',
            'description' => 'Official institutional, regional, national, or international awards.',
            'display_order' => 4,
            'max_points' => 40.00,
            'source_ref' => 'NDMU-RANK-ADMIN-2025-V1, Table B.4',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $db->table('evaluation_scale_subcategories')->insertBatch([
            ['id' => 'sub-b4-1', 'scale_category_id' => $catB4, 'subcategory_code' => 'B.4.1', 'name' => 'Awardee (International / National)', 'description' => '40 pts', 'display_order' => 1, 'default_points' => 40.00, 'source_ref' => 'Table B.4, Row 1', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 'sub-b4-2', 'scale_category_id' => $catB4, 'subcategory_code' => 'B.4.2', 'name' => 'Awardee (Regional / Provincial)', 'description' => '30 pts', 'display_order' => 2, 'default_points' => 30.00, 'source_ref' => 'Table B.4, Row 2', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 'sub-b4-3', 'scale_category_id' => $catB4, 'subcategory_code' => 'B.4.3', 'name' => 'Awardee (Local / Institutional)', 'description' => '10 pts', 'display_order' => 3, 'default_points' => 10.00, 'source_ref' => 'Table B.4, Row 3', 'created_at' => $now, 'updated_at' => $now],
        ]);

        $catB5 = 'cat-admin-b5';
        $db->table('evaluation_scale_categories')->insert([
            'id' => $catB5,
            'scale_area_id' => $areaBId,
            'category_code' => 'B.5',
            'name' => 'B.5 Production of Instructional Materials',
            'description' => 'Workbooks, modules, reviewers, and educational software.',
            'display_order' => 5,
            'max_points' => 40.00,
            'source_ref' => 'NDMU-RANK-ADMIN-2025-V1, Table B.5',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $db->table('evaluation_scale_subcategories')->insertBatch([
            ['id' => 'sub-b5-1', 'scale_category_id' => $catB5, 'subcategory_code' => 'B.5.1', 'name' => 'Workbook / Lecture Notes (Bound)', 'description' => '20 pts', 'display_order' => 1, 'default_points' => 20.00, 'source_ref' => 'Table B.5, Row 1', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 'sub-b5-2', 'scale_category_id' => $catB5, 'subcategory_code' => 'B.5.2', 'name' => 'Modules / Reviewers / Software', 'description' => '10 pts', 'display_order' => 2, 'default_points' => 10.00, 'source_ref' => 'Table B.5, Row 2', 'created_at' => $now, 'updated_at' => $now],
        ]);

        // Categories for Area C
        $catC1 = 'cat-admin-c1';
        $db->table('evaluation_scale_categories')->insert([
            'id' => $catC1,
            'scale_area_id' => $areaCId,
            'category_code' => 'C.1',
            'name' => 'C.1 Involvement in Extra-Curricular Activities',
            'description' => 'Moderator, coach, committee member, or school service coordinator.',
            'display_order' => 1,
            'max_points' => 40.00,
            'source_ref' => 'NDMU-RANK-ADMIN-2025-V1, Table C.1',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $db->table('evaluation_scale_subcategories')->insertBatch([
            ['id' => 'sub-c1-1', 'scale_category_id' => $catC1, 'subcategory_code' => 'C.1.1', 'name' => 'Moderator of Clubs / Organizations', 'description' => '20 pts', 'display_order' => 1, 'default_points' => 20.00, 'source_ref' => 'Table C.1, Row 1', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 'sub-c1-2', 'scale_category_id' => $catC1, 'subcategory_code' => 'C.1.2', 'name' => 'Coach / Trainer / Committee Member', 'description' => '20 pts', 'display_order' => 2, 'default_points' => 20.00, 'source_ref' => 'Table C.1, Row 2', 'created_at' => $now, 'updated_at' => $now],
        ]);

        $catC2 = 'cat-admin-c2';
        $db->table('evaluation_scale_categories')->insert([
            'id' => $catC2,
            'scale_area_id' => $areaCId,
            'category_code' => 'C.2',
            'name' => 'C.2 Community Involvement',
            'description' => 'Parish, civic, community service, or outreach project support.',
            'display_order' => 2,
            'max_points' => 30.00,
            'source_ref' => 'NDMU-RANK-ADMIN-2025-V1, Table C.2',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $db->table('evaluation_scale_subcategories')->insertBatch([
            ['id' => 'sub-c2-1', 'scale_category_id' => $catC2, 'subcategory_code' => 'C.2.1', 'name' => 'Active Church / Civic Involvement', 'description' => '25 pts', 'display_order' => 1, 'default_points' => 25.00, 'source_ref' => 'Table C.2, Row 1', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 'sub-c2-2', 'scale_category_id' => $catC2, 'subcategory_code' => 'C.2.2', 'name' => 'Support to Charity / Community Projects', 'description' => '5 pts', 'display_order' => 2, 'default_points' => 5.00, 'source_ref' => 'Table C.2, Row 2', 'created_at' => $now, 'updated_at' => $now],
        ]);

        $catC3 = 'cat-admin-c3';
        $db->table('evaluation_scale_categories')->insert([
            'id' => $catC3,
            'scale_area_id' => $areaCId,
            'category_code' => 'C.3',
            'name' => 'C.3 NDMU Service Credit',
            'description' => '1 point per 2 full years of verified service (Max 10 pts).',
            'display_order' => 3,
            'max_points' => 10.00,
            'source_ref' => 'NDMU-RANK-ADMIN-2025-V1, Table C.3',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $db->table('evaluation_scale_subcategories')->insert([
            'id' => 'sub-c3-1',
            'scale_category_id' => $catC3,
            'subcategory_code' => 'C.3.1',
            'name' => 'Years of Service Credit',
            'description' => '1 pt per 2 full years (Max 10 pts)',
            'display_order' => 1,
            'default_points' => 10.00,
            'source_ref' => 'Table C.3, Row 1',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // 2. NON_TEACHING_PERSONNEL_RANKING_SCALE
        $scaleNtpId = 'scale-ntp-001';
        $db->table('evaluation_scales')->insert([
            'id' => $scaleNtpId,
            'scale_code' => 'NON_TEACHING_PERSONNEL_RANKING_SCALE',
            'title' => 'NDMU Non-Teaching Personnel Ranking Scale',
            'description' => 'Official NDMU Non-Teaching Staff Point Schedule & Criteria (Total: 150 pts, Passing: 75 pts). Area A is performance-based and read-only for personnel.',
            'total_points' => 150.00,
            'passing_score' => 75.00,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $scaleNtpVerId = 'ver-ntp-2025-001';
        $db->table('evaluation_scale_versions')->insert([
            'id' => $scaleNtpVerId,
            'scale_id' => $scaleNtpId,
            'version_number' => '1.0.0',
            'evaluation_cycle_id' => '2025-2026',
            'status' => 'approved',
            'total_max_points' => 150.00,
            'passing_score' => 75.00,
            'effective_start_date' => '2025-06-01',
            'effective_end_date' => '2026-05-31',
            'approved_by_user_id' => 'hr_admin_system',
            'approved_at' => $now,
            'source_document_ref' => 'NDMU-RANK-NTP-2025-V1 (Official Non-Teaching Ranking Manual)',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // Area A for NTP: Performance and Personal Indicators (70 pts) -> Disallowed / Read-Only for Personnel
        $areaNtpAId = 'area-ntp-a';
        $db->table('evaluation_scale_areas')->insert([
            'id' => $areaNtpAId,
            'scale_version_id' => $scaleNtpVerId,
            'area_code' => 'A',
            'name' => 'Area A: Performance and Personal Indicators',
            'description' => 'Annual performance rating and supervisor assessment indicators (Institutional evaluator-managed; read-only for personnel).',
            'display_order' => 1,
            'max_points' => 70.00,
            'entry_policy' => 'personnel_entry_disallowed_read_only',
            'source_ref' => 'NDMU-RANK-NTP-2025-V1, Sec 1 (p. 2-4)',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // Area B for NTP: Professional Development & Technical Capability (50 pts) -> Allowed
        $areaNtpBId = 'area-ntp-b';
        $db->table('evaluation_scale_areas')->insert([
            'id' => $areaNtpBId,
            'scale_version_id' => $scaleNtpVerId,
            'area_code' => 'B',
            'name' => 'Area B: Professional Development & Technical Capability',
            'description' => 'Trainings attended, technical certifications, skill workshops, and innovation projects.',
            'display_order' => 2,
            'max_points' => 50.00,
            'entry_policy' => 'personnel_entry_allowed',
            'source_ref' => 'NDMU-RANK-NTP-2025-V1, Sec 2 (p. 5-8)',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // Area C for NTP: Institutional Service & Community Extension (30 pts) -> Allowed
        $areaNtpCId = 'area-ntp-c';
        $db->table('evaluation_scale_areas')->insert([
            'id' => $areaNtpCId,
            'scale_version_id' => $scaleNtpVerId,
            'area_code' => 'C',
            'name' => 'Area C: Institutional Service & Community Extension',
            'description' => 'Committee involvement, institutional event assistance, community extension, and years of service.',
            'display_order' => 3,
            'max_points' => 30.00,
            'entry_policy' => 'personnel_entry_allowed',
            'source_ref' => 'NDMU-RANK-NTP-2025-V1, Sec 3 (p. 9-12)',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // NTP Area B Categories
        $catNtpB1 = 'cat-ntp-b1';
        $db->table('evaluation_scale_categories')->insert([
            'id' => $catNtpB1,
            'scale_area_id' => $areaNtpBId,
            'category_code' => 'B.1',
            'name' => 'B.1 Technical & Skills Training',
            'description' => 'Verified technical workshops, skill upgrades, and seminars.',
            'display_order' => 1,
            'max_points' => 30.00,
            'source_ref' => 'NDMU-RANK-NTP-2025-V1, Table B.1',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $db->table('evaluation_scale_subcategories')->insertBatch([
            ['id' => 'sub-ntp-b1-1', 'scale_category_id' => $catNtpB1, 'subcategory_code' => 'B.1.1', 'name' => 'In-House Technical Training', 'description' => '5 pts per training', 'display_order' => 1, 'default_points' => 5.00, 'source_ref' => 'Table B.1, Row 1', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 'sub-ntp-b1-2', 'scale_category_id' => $catNtpB1, 'subcategory_code' => 'B.1.2', 'name' => 'External / National Technical Certification', 'description' => '10 pts per certification', 'display_order' => 2, 'default_points' => 10.00, 'source_ref' => 'Table B.1, Row 2', 'created_at' => $now, 'updated_at' => $now],
        ]);

        $catNtpB2 = 'cat-ntp-b2';
        $db->table('evaluation_scale_categories')->insert([
            'id' => $catNtpB2,
            'scale_area_id' => $areaNtpBId,
            'category_code' => 'B.2',
            'name' => 'B.2 Process Improvements & Innovation Projects',
            'description' => 'Implemented operational improvements and administrative innovations.',
            'display_order' => 2,
            'max_points' => 20.00,
            'source_ref' => 'NDMU-RANK-NTP-2025-V1, Table B.2',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $db->table('evaluation_scale_subcategories')->insert([
            'id' => 'sub-ntp-b2-1',
            'scale_category_id' => $catNtpB2,
            'subcategory_code' => 'B.2.1',
            'name' => 'Implemented Departmental Innovation Project',
            'description' => '10 pts per project',
            'display_order' => 1,
            'default_points' => 10.00,
            'source_ref' => 'Table B.2, Row 1',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // NTP Area C Categories
        $catNtpC1 = 'cat-ntp-c1';
        $db->table('evaluation_scale_categories')->insert([
            'id' => $catNtpC1,
            'scale_area_id' => $areaNtpCId,
            'category_code' => 'C.1',
            'name' => 'C.1 Institutional Event & Committee Support',
            'description' => 'Working committees and institutional event support.',
            'display_order' => 1,
            'max_points' => 20.00,
            'source_ref' => 'NDMU-RANK-NTP-2025-V1, Table C.1',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $db->table('evaluation_scale_subcategories')->insert([
            'id' => 'sub-ntp-c1-1',
            'scale_category_id' => $catNtpC1,
            'subcategory_code' => 'C.1.1',
            'name' => 'Institutional Working Committee Member',
            'description' => '10 pts per committee',
            'display_order' => 1,
            'default_points' => 10.00,
            'source_ref' => 'Table C.1, Row 1',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $catNtpC2 = 'cat-ntp-c2';
        $db->table('evaluation_scale_categories')->insert([
            'id' => $catNtpC2,
            'scale_area_id' => $areaNtpCId,
            'category_code' => 'C.2',
            'name' => 'C.2 NDMU Service Credit',
            'description' => 'Years of service credit (1 pt per 2 full years, Max 10 pts).',
            'display_order' => 2,
            'max_points' => 10.00,
            'source_ref' => 'NDMU-RANK-NTP-2025-V1, Table C.2',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $db->table('evaluation_scale_subcategories')->insert([
            'id' => 'sub-ntp-c2-1',
            'scale_category_id' => $catNtpC2,
            'subcategory_code' => 'C.2.1',
            'name' => 'Years of Service Credit',
            'description' => '1 pt per 2 full years (Max 10 pts)',
            'display_order' => 1,
            'default_points' => 10.00,
            'source_ref' => 'Table C.2, Row 1',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    public function down()
    {
        $this->forge->dropTable('evaluation_scale_change_events', true);
        $this->forge->dropTable('evaluation_scale_criteria', true);
        $this->forge->dropTable('evaluation_scale_subcategories', true);
        $this->forge->dropTable('evaluation_scale_categories', true);
        $this->forge->dropTable('evaluation_scale_areas', true);
        $this->forge->dropTable('evaluation_scale_versions', true);
        $this->forge->dropTable('evaluation_scales', true);
    }
}
