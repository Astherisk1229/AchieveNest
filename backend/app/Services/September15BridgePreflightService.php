<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;

/** Read-only proof gate for the proposed Phase17Canonical September 15 bridge. */
class September15BridgePreflightService
{
    private const LEDGER = [
        ['2026-08-31-000001', 'Phase17Canonical\\Database\\Migrations\\CreateCanonicalMySQLBaseline', 1],
        ['2026-09-13-000009', 'Phase17Canonical\\Database\\Migrations\\ExtendAnnualReviewsForRatings', 2],
        ['2026-09-13-000010', 'Phase17Canonical\\Database\\Migrations\\CreateAnnualReviewImports', 3],
        ['2026-09-13-000011', 'Phase17Canonical\\Database\\Migrations\\BindAnnualReviewPreviewToPersonnel', 4],
        ['2026-09-13-000012', 'Phase17Canonical\\Database\\Migrations\\ReconcileDeanPortfolioEvaluation', 5],
        ['2026-09-13-000013', 'Phase17Canonical\\Database\\Migrations\\AddEvaluationStartedAt', 6],
    ];

    private const TARGET_TABLES = [
        'department_head_assignments', 'ranking_cycles', 'rank_placement_groups',
        'rank_placement_group_ranks', 'personnel_rank_placements', 'personnel_credentials',
        'personnel_credential_events', 'personnel_rank_placement_suggestions',
        'personnel_rank_placement_events', 'personnel_rank_applied_for_decisions',
        'personnel_rank_applied_for_events', 'personnel_recommended_rank_decisions',
        'personnel_recommended_rank_events', 'personnel_hr_final_rank_reviews',
        'personnel_hr_final_rank_events', 'personnel_official_evaluation_documents',
        'personnel_approved_rank_records', 'personnel_approved_rank_events',
        'personnel_rank_history', 'personnel_rank_activation_attempts', 'personnel_rank_corrections',
    ];

    private const PREREQUISITE_TABLES = [
        'profiles', 'profile_roles', 'roles', 'personnel_profiles', 'colleges',
        'academic_programs', 'administrative_units', 'personnel_college_affiliations',
        'personnel_program_affiliations', 'personnel_administrative_unit_affiliations',
        'dean_assignments', 'personnel_evaluation_periods', 'personnel_evaluations',
        'personnel_evaluation_roots', 'personnel_evaluation_items', 'evaluation_scales',
        'evaluation_scale_versions', 'evaluation_scale_areas', 'evaluation_scale_categories',
        'faculty_rank_catalog', 'faculty_rank_transitions', 'notifications', 'audit_logs',
        'personnel_accomplishment_evidence', 'file_security_audit_events',
    ];

    private const UNSUPPORTED = [
        ['INSTRUCTOR_I', 'SENIOR_INSTRUCTOR_I'],
        ['SENIOR_INSTRUCTOR_IV', 'ASSISTANT_PROFESSOR_I'],
        ['ASSISTANT_PROFESSOR_IV', 'ASSOCIATE_PROFESSOR_I'],
        ['ASSOCIATE_PROFESSOR_IV', 'PROFESSOR_I'],
        ['PROFESSOR_IV', 'UNIVERSITY_PROFESSOR_I'],
        ['UNIVERSITY_PROFESSOR_IV', 'UNIVERSITY_PROFESSOR'],
    ];

    private const REPLACEMENTS = [
        ['ASSISTANT_PROFESSOR_IV', 'ASSOCIATE_PROFESSOR'],
        ['PROFESSOR_IV', 'UNIVERSITY_PROFESSOR'],
        ['UNIVERSITY_PROFESSOR', 'UNIVERSITY_PROFESSOR_I'],
    ];

    public function audit(BaseConnection $db): array
    {
        $failures = [];
        $ledger = $this->ledger($db, $failures);
        $baseline = (new CanonicalBaselineProofService())->audit($db);
        if (! $baseline['proven']) {
            $failures[] = 'CANONICAL_BASELINE_NOT_PROVEN';
        }
        $expectedEvolution = [
            'personnel_evaluation_items.fk_evaluation_items_evaluation→foreign-key relationship',
            'profiles.must_change_password→local_auth_credentials.must_change_password',
        ];
        $actualEvolution = $baseline['accepted_evolution'];
        sort($expectedEvolution);
        sort($actualEvolution);
        if ($actualEvolution !== $expectedEvolution) {
            $failures[] = 'UNEXPECTED_CANONICAL_EVOLUTION:' . implode(',', $actualEvolution);
        }

        $presentTargets = [];
        foreach (self::TARGET_TABLES as $table) {
            if ($db->tableExists($table)) {
                $presentTargets[] = $table;
            }
        }
        if ($presentTargets !== []) {
            $failures[] = 'SEPTEMBER15_TARGETS_ALREADY_PRESENT:' . implode(',', $presentTargets);
        }

        $periodState = $this->periodState($db, $failures);
        $candidates = $this->compatibilityCandidates($db);
        $transitions = $this->transitionState($db, $failures);

        $missingPrerequisites = [];
        foreach (self::PREREQUISITE_TABLES as $table) {
            if (! $db->tableExists($table)) {
                $missingPrerequisites[] = $table;
            }
        }
        if ($missingPrerequisites !== []) {
            $failures[] = 'MISSING_KW_PREREQUISITES:' . implode(',', $missingPrerequisites);
        }

        return [
            'ready' => $failures === [],
            'failures' => $failures,
            'ledger' => $ledger,
            'baseline' => $baseline,
            'present_targets' => $presentTargets,
            'period_state' => $periodState,
            'compatibility_candidates' => $candidates,
            'transitions' => $transitions,
            'missing_prerequisites' => $missingPrerequisites,
            'bridge_order' => $this->bridgeOrder(),
        ];
    }

    private function ledger(BaseConnection $db, array &$failures): array
    {
        $rows = $db->table('migrations')->where('namespace', 'Phase17Canonical')->orderBy('batch')->orderBy('id')->get()->getResultArray();
        $group = (string) config('Database')->defaultGroup;
        if (count($rows) !== count(self::LEDGER)) {
            $failures[] = count($rows) > count(self::LEDGER) ? 'UNEXPECTED_LATER_CANONICAL_MIGRATION' : 'MISSING_CANONICAL_MIGRATION';
        }
        foreach (self::LEDGER as $index => [$version, $class, $batch]) {
            $row = $rows[$index] ?? null;
            if (! $row || $row['version'] !== $version || $row['class'] !== $class
                || $row['namespace'] !== 'Phase17Canonical' || $row['group'] !== $group
                || (int) $row['batch'] !== $batch) {
                $failures[] = "CANONICAL_LEDGER_MISMATCH_AT_BATCH_{$batch}";
            }
        }
        $appCount = $db->table('migrations')->where('namespace', 'App')->countAllResults();
        if ($appCount !== 0) {
            $failures[] = "APP_MIGRATIONS_UNEXPECTEDLY_APPLIED:{$appCount}";
        }
        return $rows;
    }

    private function periodState(BaseConnection $db, array &$failures): array
    {
        $database = (string) $db->getDatabase();
        if ($db->fieldExists('ranking_cycle_id', 'personnel_evaluation_periods')) {
            $failures[] = 'PERIOD_RANKING_CYCLE_ID_ALREADY_PRESENT';
        }
        $column = $db->query(
            "SELECT COLUMN_TYPE,GENERATION_EXPRESSION FROM information_schema.columns WHERE table_schema=? AND table_name='personnel_evaluation_periods' AND column_name='open_type_guard'",
            [$database]
        )->getRowArray();
        $expression = strtolower((string) ($column['GENERATION_EXPRESSION'] ?? ''));
        $legacyExpression = $column !== null
            && strtolower((string) $column['COLUMN_TYPE']) === 'varchar(64)'
            && str_contains($expression, 'open_for_submission')
            && str_contains($expression, 'evaluation_type')
            && ! str_contains($expression, 'personnel_group');
        if (! $legacyExpression) {
            $failures[] = 'LEGACY_OPEN_TYPE_GUARD_DEFINITION_MISMATCH';
        }

        $indexes = $db->query(
            "SELECT INDEX_NAME,NON_UNIQUE,GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) columns_csv FROM information_schema.statistics WHERE table_schema=? AND table_name='personnel_evaluation_periods' GROUP BY INDEX_NAME,NON_UNIQUE",
            [$database]
        )->getResultArray();
        $byName = [];
        foreach ($indexes as $index) {
            $byName[$index['INDEX_NAME']] = ['unique' => (int) $index['NON_UNIQUE'] === 0, 'columns' => strtolower((string) $index['columns_csv'])];
        }
        $expected = [
            'uq_personnel_period_open_type' => 'open_type_guard',
            'uq_personnel_period_identity' => 'evaluation_type,academic_year,coverage_identity',
        ];
        foreach ($expected as $name => $columns) {
            if (! isset($byName[$name]) || ! $byName[$name]['unique'] || $byName[$name]['columns'] !== $columns) {
                $failures[] = "LEGACY_PERIOD_INDEX_MISMATCH:{$name}";
            }
        }
        foreach (['uq_personnel_period_open_track', 'uq_personnel_period_track_identity'] as $name) {
            if (isset($byName[$name])) {
                $failures[] = "TRACK_PERIOD_INDEX_ALREADY_PRESENT:{$name}";
            }
        }
        return ['ranking_cycle_id_absent' => ! $db->fieldExists('ranking_cycle_id', 'personnel_evaluation_periods'), 'open_type_guard' => $column, 'indexes' => $byName];
    }

    private function compatibilityCandidates(BaseConnection $db): array
    {
        $rows = $db->table('personnel_evaluation_periods')
            ->select('id,period_code,period_name,evaluation_type,personnel_group,academic_year,coverage_identity,status,created_by,created_at')
            ->orderBy('created_at')->orderBy('id')->get()->getResultArray();
        foreach ($rows as &$row) {
            $peers = array_filter($rows, static fn (array $peer): bool => $peer['id'] !== $row['id']
                && $peer['academic_year'] === $row['academic_year']
                && $peer['coverage_identity'] === $row['coverage_identity']
                && $peer['personnel_group'] !== $row['personnel_group']);
            $row['proposed_logic'] = 'one compatibility cycle for this period only; no cross-track pairing';
            $row['proposed_cycle_code'] = 'LEGACY-' . substr(hash('sha256', (string) $row['id']), 0, 16);
            $row['pairing_ambiguity'] = $peers === [] ? null : 'Potential cross-track peer exists; intentionally not paired.';
        }
        unset($row);
        return $rows;
    }

    private function transitionState(BaseConnection $db, array &$failures): array
    {
        $unsupported = [];
        foreach (self::UNSUPPORTED as [$from, $to]) {
            $row = $this->transition($db, $from, $to, 'normal_sequential');
            $unsupported[] = ['from' => $from, 'to' => $to, 'active' => (int) ($row['is_active'] ?? 0) === 1, 'row' => $row];
        }
        $replacements = [];
        foreach (self::REPLACEMENTS as [$from, $to]) {
            $row = $this->transition($db, $from, $to, 'normal_sequential');
            $replacements[] = ['from' => $from, 'to' => $to, 'missing' => $row === null, 'active' => (int) ($row['is_active'] ?? 0) === 1, 'row' => $row];
        }
        $exception = $this->transition($db, 'ASSISTANT_PROFESSOR_I', 'PROFESSOR_I', 'phd_exception');
        if ($exception === null || (int) $exception['requires_verified_phd'] !== 1 || (int) $exception['is_active'] !== 1) {
            $failures[] = 'PHD_EXCEPTION_MISSING_OR_INVALID';
        }
        $alreadyReconciled = array_reduce($unsupported, static fn (bool $ok, array $item): bool => $ok && ! $item['active'], true)
            && array_reduce($replacements, static fn (bool $ok, array $item): bool => $ok && ! $item['missing'] && $item['active'], true)
            && str_contains((string) ($exception['rule_reference'] ?? ''), 'HR-INTERVIEW-ADDENDUM');
        return ['unsupported' => $unsupported, 'replacements' => $replacements, 'phd_exception' => $exception, 'already_reconciled' => $alreadyReconciled];
    }

    private function transition(BaseConnection $db, string $from, string $to, string $type): ?array
    {
        return $db->table('faculty_rank_transitions')->where(['from_rank_code' => $from, 'to_rank_code' => $to, 'transition_type' => $type])->get()->getRowArray() ?: null;
    }

    private function bridgeOrder(): array
    {
        return [
            'CreateDepartmentHeadAssignments', 'CreateRankingCycles', 'ScopePersonnelPeriodConcurrencyByTrack',
            'CreateRankPlacementDomain', 'ReconcileAuthoritativeFacultyRankTransitions',
            'CreateCanonicalPersonnelCredentials', 'CreatePlacementSuggestionLifecycle',
            'CreateRankAppliedForDecisions', 'CreateRecommendedRankDecisions', 'CreateHrFinalRankReviews',
            'CreateOfficialEvaluationDocuments', 'AddOfficialDocumentCaseSupersession',
            'CreateOfflineApprovedRanks', 'AddApprovedRankActivationRecovery', 'AddRankCorrectionAndCancellation',
        ];
    }
}
