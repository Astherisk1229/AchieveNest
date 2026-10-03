<?php

namespace Phase17Canonical\Database\Migrations;

use RuntimeException;

/** Fail-closed structural guards shared by the forward-only September 15 bridge. */
trait September15BridgeGuard
{
    private function assertBridgeStep(int $step): void
    {
        if ($this->db->DBDriver !== 'MySQLi') {
            throw new RuntimeException('September 15 canonical bridge requires MySQLi.');
        }

        $checks = [
            1 => [[], ['department_head_assignments']],
            2 => [['department_head_assignments'], ['ranking_cycles']],
            3 => [['ranking_cycles'], []],
            4 => [['ranking_cycles'], ['rank_placement_groups', 'rank_placement_group_ranks', 'personnel_rank_placements']],
            5 => [['rank_placement_groups', 'faculty_rank_transitions'], []],
            6 => [['rank_placement_groups'], ['personnel_credentials', 'personnel_credential_events']],
            7 => [['personnel_credentials', 'personnel_rank_placements'], ['personnel_rank_placement_suggestions', 'personnel_rank_placement_events']],
            8 => [['personnel_rank_placements'], ['personnel_rank_applied_for_decisions', 'personnel_rank_applied_for_events']],
            9 => [['personnel_rank_applied_for_decisions'], ['personnel_recommended_rank_decisions', 'personnel_recommended_rank_events']],
            10 => [['personnel_recommended_rank_decisions'], ['personnel_hr_final_rank_reviews', 'personnel_hr_final_rank_events']],
            11 => [['personnel_hr_final_rank_reviews'], ['personnel_official_evaluation_documents']],
            12 => [['personnel_official_evaluation_documents'], []],
            13 => [['personnel_official_evaluation_documents'], ['personnel_approved_rank_records', 'personnel_approved_rank_events', 'personnel_rank_history']],
            14 => [['personnel_approved_rank_records'], ['personnel_rank_activation_attempts']],
            15 => [['personnel_approved_rank_records'], ['personnel_rank_corrections']],
        ];
        [$required, $absent] = $checks[$step] ?? throw new RuntimeException("Unknown bridge step {$step}.");
        $schema = $this->bridgeSchemaInspector();
        foreach ($required as $table) {
            if (! $schema->tableExists($table)) {
                throw new RuntimeException("BRIDGE_STEP_{$step}_PREREQUISITE_MISSING:{$table}");
            }
        }
        foreach ($absent as $table) {
            if ($schema->tableExists($table)) {
                throw new RuntimeException("BRIDGE_STEP_{$step}_UNEXPECTED_TARGET:{$table}");
            }
        }

        if ($step === 2) {
            $this->assertRankingCycleStartingState();
        } elseif ($step === 3) {
            $this->assertLegacyPeriodConcurrency();
        } elseif ($step === 5) {
            $this->assertLegacyFacultyTransitions();
        } elseif ($step === 7) {
             $this->assertColumnsPresent('personnel_rank_placements',['activation_failed_at', 'activation_failure_reason']
    );
        } elseif ($step === 12) {
            $this->assertColumnsAbsent('personnel_official_evaluation_documents', ['evaluation_root_id']);
        } elseif ($step === 14) {
            $this->assertColumnsAbsent('personnel_approved_rank_records', ['activation_failure_code', 'activation_failure_reason', 'last_activation_attempt_at', 'recovery_reason']);
            $this->assertColumnsAbsent('personnel_approved_rank_events', ['actor_context']);
        } elseif ($step === 15) {
            $this->assertColumnsAbsent('personnel_approved_rank_records', ['source_approved_rank_record_id', 'record_kind', 'correction_type', 'original_case_guard']);
        }
    }

    private function assertColumnsAbsent(string $table, array $columns): void
    {
        $schema = $this->bridgeSchemaInspector();
        foreach ($columns as $column) {
            if ($schema->columnExists($table, $column)) {
                throw new RuntimeException("BRIDGE_UNEXPECTED_PARTIAL_COLUMN:{$table}.{$column}");
            }
        }
    }
    private function assertColumnsPresent(string $table, array $columns): void
{
    $schema = $this->bridgeSchemaInspector();

    foreach ($columns as $column) {
        if (! $schema->columnExists($table, $column)) {
            throw new RuntimeException(
                "BRIDGE_STEP_PREREQUISITE_COLUMN_MISSING:{$table}.{$column}"
            );
        }
    }
}

    private function assertRankingCycleStartingState(): void
    {
        if ($this->bridgeSchemaInspector()->columnExists('personnel_evaluation_periods', 'ranking_cycle_id')) {
            throw new RuntimeException('BRIDGE_RANKING_CYCLE_COLUMN_ALREADY_PRESENT');
        }
        $expected = ['acceptance-closed-period-2026-09', 'd198ba23-1571-4c5d-98e2-f57d50eee79d'];
        $actual = array_column($this->db->table('personnel_evaluation_periods')->select('id')->orderBy('id')->get()->getResultArray(), 'id');
        if ($actual !== $expected) {
            throw new RuntimeException('BRIDGE_COMPATIBILITY_PERIOD_SET_CHANGED:' . implode(',', $actual));
        }
    }

    private function assertLegacyPeriodConcurrency(): void
    {
        $schema = $this->bridgeSchemaInspector();
        $column = $schema->column('personnel_evaluation_periods', 'open_type_guard');
        $expression = strtolower((string) ($column['generation_expression'] ?? ''));
        if (! $column || strtolower((string) $column['column_type']) !== 'varchar(64)'
            || ! str_contains($expression, 'evaluation_type') || str_contains($expression, 'personnel_group')) {
            throw new RuntimeException('BRIDGE_LEGACY_PERIOD_GUARD_CHANGED');
        }
        $expected = [
            'uq_personnel_period_open_type' => 'open_type_guard',
            'uq_personnel_period_identity' => 'evaluation_type,academic_year,coverage_identity',
        ];
        foreach ($expected as $name => $columns) {
            $rows = $schema->index('personnel_evaluation_periods', $name);
            if ($rows === [] || (int) $rows[0]['non_unique'] !== 0 || implode(',', array_column($rows, 'column_name')) !== $columns) {
                throw new RuntimeException("BRIDGE_LEGACY_PERIOD_INDEX_CHANGED:{$name}");
            }
        }
        foreach (['uq_personnel_period_open_track', 'uq_personnel_period_track_identity'] as $name) {
            if ($schema->indexExists('personnel_evaluation_periods', $name)) {
                throw new RuntimeException("BRIDGE_TRACK_PERIOD_INDEX_ALREADY_PRESENT:{$name}");
            }
        }
    }

    protected function bridgeSchemaInspector(): September15BridgeSchemaInspector
    {
        return new September15BridgeSchemaInspector($this->db);
    }

    private function assertLegacyFacultyTransitions(): void
    {
        $unsupported = [
            ['INSTRUCTOR_I', 'SENIOR_INSTRUCTOR_I'], ['SENIOR_INSTRUCTOR_IV', 'ASSISTANT_PROFESSOR_I'],
            ['ASSISTANT_PROFESSOR_IV', 'ASSOCIATE_PROFESSOR_I'], ['ASSOCIATE_PROFESSOR_IV', 'PROFESSOR_I'],
            ['PROFESSOR_IV', 'UNIVERSITY_PROFESSOR_I'], ['UNIVERSITY_PROFESSOR_IV', 'UNIVERSITY_PROFESSOR'],
        ];
        foreach ($unsupported as [$from, $to]) {
            if ($this->transitionCount($from, $to, 'normal_sequential', 1) !== 1) {
                throw new RuntimeException("BRIDGE_UNSUPPORTED_TRANSITION_STATE_CHANGED:{$from}:{$to}");
            }
        }
        foreach ([['ASSISTANT_PROFESSOR_IV', 'ASSOCIATE_PROFESSOR'], ['PROFESSOR_IV', 'UNIVERSITY_PROFESSOR'], ['UNIVERSITY_PROFESSOR', 'UNIVERSITY_PROFESSOR_I']] as [$from, $to]) {
            if ($this->transitionCount($from, $to, 'normal_sequential', null) !== 0) {
                throw new RuntimeException("BRIDGE_REPLACEMENT_TRANSITION_ALREADY_PRESENT:{$from}:{$to}");
            }
        }
        $exception = $this->db->table('faculty_rank_transitions')->where([
            'from_rank_code' => 'ASSISTANT_PROFESSOR_I', 'to_rank_code' => 'PROFESSOR_I',
            'transition_type' => 'phd_exception', 'requires_verified_phd' => 1, 'is_active' => 1,
        ])->countAllResults();
        if ($exception !== 1) {
            throw new RuntimeException('BRIDGE_PHD_EXCEPTION_STATE_CHANGED');
        }
    }

    private function transitionCount(string $from, string $to, string $type, ?int $active): int
    {
        $query = $this->db->table('faculty_rank_transitions')->where(['from_rank_code' => $from, 'to_rank_code' => $to, 'transition_type' => $type]);
        if ($active !== null) {
            $query->where('is_active', $active);
        }
        return $query->countAllResults();
    }

    public function down()
    {
        // Forward-only: reversal could destroy authoritative history or live workflow data.
    }
}
