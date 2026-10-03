<?php

namespace Phase17Canonical\Database\Migrations;

use RuntimeException;

require_once APPPATH . 'Database/Migrations/2026-09-08-000063_CreateEvaluationScaleCatalogue.php';

/**
 * Canonical port of the authoritative evaluation-scale catalogue migration.
 *
 * Clean replays delegate to the unchanged App migration so its schema and
 * canonical seed data remain the single source of truth. Existing catalogue
 * installations are accepted only when their schema and seed state are
 * materially compatible.
 */
class CreateEvaluationScaleCatalogue extends \App\Database\Migrations\CreateEvaluationScaleCatalogue
{
    private const TABLES = [
        'evaluation_scales',
        'evaluation_scale_versions',
        'evaluation_scale_areas',
        'evaluation_scale_categories',
        'evaluation_scale_subcategories',
        'evaluation_scale_criteria',
        'evaluation_scale_change_events',
    ];

    public function up()
    {
        if ($this->db->DBDriver !== 'MySQLi') {
            throw new RuntimeException('Canonical evaluation-scale catalogue requires MySQLi.');
        }
        $this->db->resetDataCache();

        $existing = array_values(array_filter(
            self::TABLES,
            fn (string $table): bool => $this->db->tableExists($table)
        ));

        if ($existing === []) {
            parent::up();
            $this->convertCatalogueToInnoDB();
            $this->assertCompatibleSchema();
            $this->assertInnoDB();
            $this->assertCompatibleSeedState();

            return;
        }

        if (count($existing) !== count(self::TABLES)) {
            throw new RuntimeException(
                'Existing evaluation-scale catalogue is incomplete: found ' . implode(', ', $existing) . '.'
            );
        }

        $this->assertCompatibleSchema();
        $this->assertInnoDB();
        $this->assertCompatibleSeedState();
    }

    public function down()
    {
        if ($this->db->DBDriver !== 'MySQLi') {
            throw new RuntimeException('Canonical evaluation-scale catalogue requires MySQLi.');
        }

        parent::down();
    }

    private function assertCompatibleSchema(): void
    {
        $requiredFields = [
            'evaluation_scales' => [
                'id', 'scale_code', 'title', 'description', 'total_points',
                'passing_score', 'created_at', 'updated_at',
            ],
            'evaluation_scale_versions' => [
                'id', 'scale_id', 'version_number', 'evaluation_cycle_id', 'status',
                'total_max_points', 'passing_score', 'effective_start_date',
                'effective_end_date', 'approved_by_user_id', 'approved_at',
                'source_document_ref', 'created_at', 'updated_at',
            ],
            'evaluation_scale_areas' => [
                'id', 'scale_version_id', 'area_code', 'name', 'description',
                'display_order', 'max_points', 'entry_policy', 'source_ref',
                'created_at', 'updated_at',
            ],
            'evaluation_scale_categories' => [
                'id', 'scale_area_id', 'category_code', 'name', 'description',
                'display_order', 'max_points', 'source_ref', 'created_at', 'updated_at',
            ],
            'evaluation_scale_subcategories' => [
                'id', 'scale_category_id', 'subcategory_code', 'name', 'description',
                'display_order', 'default_points', 'source_ref', 'created_at', 'updated_at',
            ],
            'evaluation_scale_criteria' => [
                'id', 'scale_category_id', 'scale_subcategory_id', 'criterion_code',
                'name', 'description', 'field_schema', 'evidence_rules', 'formula_key',
                'formula_params', 'max_points_per_entry', 'max_occurrences',
                'source_ref', 'created_at', 'updated_at',
            ],
            'evaluation_scale_change_events' => [
                'id', 'scale_version_id', 'action', 'actor_user_id', 'reason',
                'before_state', 'after_state', 'created_at',
            ],
        ];

        foreach ($requiredFields as $table => $fields) {
            foreach ($fields as $field) {
                if (! $this->db->fieldExists($field, $table)) {
                    throw new RuntimeException(
                        "Existing {$table} table is incompatible: missing {$field}."
                    );
                }
            }
        }
    }

    private function assertCompatibleSeedState(): void
    {
        $expectedCounts = [
            'evaluation_scales' => 2,
            'evaluation_scale_versions' => 2,
            'evaluation_scale_areas' => 6,
            'evaluation_scale_categories' => 15,
            'evaluation_scale_subcategories' => 36,
        ];

        foreach ($expectedCounts as $table => $expected) {
            $actual = $this->db->table($table)->countAllResults();
            if ($actual !== $expected) {
                throw new RuntimeException(
                    "Existing {$table} seed state is incompatible: expected {$expected}, found {$actual}."
                );
            }
        }

        foreach ([
            'evaluation_scales' => ['scale-admin-001', 'scale-ntp-001'],
            'evaluation_scale_versions' => ['ver-admin-2025-001', 'ver-ntp-2025-001'],
        ] as $table => $ids) {
            foreach ($ids as $id) {
                if ($this->db->table($table)->where('id', $id)->countAllResults() !== 1) {
                    throw new RuntimeException("Existing {$table} is missing canonical seed {$id}.");
                }
            }
        }
    }

    private function convertCatalogueToInnoDB(): void
    {
        foreach (self::TABLES as $table) {
            $this->db->query("ALTER TABLE {$table} ENGINE=InnoDB");
        }
    }

    private function assertInnoDB(): void
    {
        foreach (self::TABLES as $table) {
            $row = $this->db->query(
                'SELECT ENGINE FROM information_schema.TABLES '
                . 'WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
                [$table]
            )->getRowArray();

            if (strcasecmp((string) ($row['ENGINE'] ?? ''), 'InnoDB') !== 0) {
                throw new RuntimeException("Existing {$table} table must use InnoDB.");
            }
        }
    }
}
