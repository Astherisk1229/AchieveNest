<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Migration: CreatePersonnelAnnualReviews
 *
 * Personnel Evaluation Track — Plan D1:
 * Dean Annual Review Input & Portfolio-Validation Eligibility.
 */
class CreatePersonnelAnnualReviews extends Migration
{
    public function up()
    {
        $db = $this->db;
        $forge = \Config\Database::forge();
        $isPg = ($db->DBDriver === 'Postgre');

        $tableName = $isPg ? 'public.personnel_annual_reviews' : 'personnel_annual_reviews';

        if (! $db->tableExists($tableName) && ! $db->tableExists('personnel_annual_reviews')) {
            $fields = [
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
                'college_id' => [
                    'type'       => $isPg ? 'UUID' : 'VARCHAR',
                    'constraint' => '64',
                    'null'       => false,
                ],
                'review_period_label' => [
                    'type'       => 'VARCHAR',
                    'constraint' => '100',
                    'null'       => false,
                    'default'    => 'AY 2025-2026 Annual Review',
                ],
                'decision' => [
                    'type'       => 'VARCHAR',
                    'constraint' => '32',
                    'null'       => false, // 'cleared', 'not_cleared'
                ],
                'decision_reason' => [
                    'type'       => 'TEXT',
                    'null'       => true,
                ],
                'evidence_document_id' => [
                    'type'       => $isPg ? 'UUID' : 'VARCHAR',
                    'constraint' => '64',
                    'null'       => true,
                ],
                'evidence_reference' => [
                    'type'       => 'TEXT',
                    'null'       => true,
                ],
                'review_summary_payload' => [
                    'type'       => 'TEXT',
                    'null'       => true,
                ],
                'recorded_by_dean_id' => [
                    'type'       => $isPg ? 'UUID' : 'VARCHAR',
                    'constraint' => '64',
                    'null'       => false,
                ],
                'recorded_at' => [
                    'type'       => 'DATETIME',
                    'null'       => false,
                ],
                'supersedes_review_id' => [
                    'type'       => $isPg ? 'UUID' : 'VARCHAR',
                    'constraint' => '64',
                    'null'       => true,
                ],
                'superseded_at' => [
                    'type'       => 'DATETIME',
                    'null'       => true,
                ],
                'superseded_by_dean_id' => [
                    'type'       => $isPg ? 'UUID' : 'VARCHAR',
                    'constraint' => '64',
                    'null'       => true,
                ],
                'created_at' => [
                    'type'       => 'DATETIME',
                    'null'       => true,
                ],
                'updated_at' => [
                    'type'       => 'DATETIME',
                    'null'       => true,
                ],
            ];

            $forge->addField($fields);
            $forge->addKey('id', true);
            $forge->addKey(['personnel_profile_id', 'evaluation_cycle_id'], false, false, 'idx_par_personnel_cycle');
            $forge->addKey(['college_id', 'evaluation_cycle_id', 'decision'], false, false, 'idx_par_college_cycle_dec');
            $forge->addKey('supersedes_review_id', false, false, 'idx_par_supersedes');
            $forge->createTable('personnel_annual_reviews', true);

            // Add Check Constraints
            if (! $isPg) {
                $db->query("ALTER TABLE personnel_annual_reviews ADD CONSTRAINT ck_par_decision CHECK (decision IN ('cleared', 'not_cleared'))");
            }
        }
    }

    public function down()
    {
        $forge = \Config\Database::forge();
        $forge->dropTable('personnel_annual_reviews', true);
    }
}
