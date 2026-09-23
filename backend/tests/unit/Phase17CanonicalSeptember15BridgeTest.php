<?php

use Phase17Canonical\Database\Migrations\September15BridgeGuard;
use Phase17Canonical\Database\Migrations\September15BridgeSchemaInspector;
use PHPUnit\Framework\TestCase;

final class Phase17CanonicalSeptember15BridgeTest extends TestCase
{
    private const NAMES = [
        'BridgeCreateDepartmentHeadAssignments', 'BridgeCreateRankingCycles',
        'BridgeScopePersonnelPeriodConcurrencyByTrack', 'BridgeCreateRankPlacementDomain',
        'BridgeReconcileAuthoritativeFacultyRankTransitions', 'BridgeCreateCanonicalPersonnelCredentials',
        'BridgeCreatePlacementSuggestionLifecycle', 'BridgeCreateRankAppliedForDecisions',
        'BridgeCreateRecommendedRankDecisions', 'BridgeCreateHrFinalRankReviews',
        'BridgeCreateOfficialEvaluationDocuments', 'BridgeAddOfficialDocumentCaseSupersession',
        'BridgeCreateOfflineApprovedRanks', 'BridgeAddApprovedRankActivationRecovery',
        'BridgeAddRankCorrectionAndCancellation',
    ];

    private function files(): array
    {
        $files = glob(APPPATH . 'Phase17Canonical/Database/Migrations/2026-09-16-*.php');
        sort($files);
        return $files;
    }

    private function source(int $step): string
    {
        return file_get_contents($this->files()[$step - 1]);
    }

    public function testAllFifteenMigrationsUseFreshCanonicalVersionsInExactOrder(): void
    {
        $files = $this->files();
        self::assertCount(15, $files);
        foreach ($files as $index => $file) {
            $step = $index + 1;
            self::assertStringContainsString(sprintf('2026-09-16-%06d_', $step), basename($file));
            $source = file_get_contents($file);
            self::assertStringContainsString('namespace Phase17Canonical\\Database\\Migrations;', $source);
            self::assertStringContainsString('class ' . self::NAMES[$index] . ' extends Migration', $source);
            self::assertStringContainsString("assertBridgeStep({$step})", $source);
        }
    }

    public function testEveryMigrationIsForwardOnlyThroughSharedGuard(): void
    {
        $guard = file_get_contents(APPPATH . 'Phase17Canonical/Database/Migrations/September15BridgeGuard.php');
        self::assertStringContainsString('public function down()', $guard);
        self::assertStringNotContainsString('DROP TABLE', substr($guard, strpos($guard, 'public function down()')));
        foreach ($this->files() as $file) {
            $source = file_get_contents($file);
            self::assertStringContainsString('use September15BridgeGuard;', $source);
            self::assertStringNotContainsString('function down', $source);
        }
    }

    public function testNoPostgresSupabaseOrMigrationLedgerSqlWasIntroduced(): void
    {
        $source = implode("\n", array_map('file_get_contents', $this->files()));
        foreach (['CREATE POLICY', 'ROW LEVEL SECURITY', 'auth.uid', 'storage.objects', 'gen_random_uuid', 'uuid_generate', "table('migrations')->insert", 'namespace App\\'] as $forbidden) {
            self::assertStringNotContainsString($forbidden, $source);
        }
    }

    public function testStartingStateAndPartialStateGuardsArePresent(): void
    {
        $guard = file_get_contents(APPPATH . 'Phase17Canonical/Database/Migrations/September15BridgeGuard.php');
        foreach (['BRIDGE_STEP_', 'BRIDGE_UNEXPECTED_PARTIAL_COLUMN', 'BRIDGE_COMPATIBILITY_PERIOD_SET_CHANGED', 'BRIDGE_LEGACY_PERIOD_GUARD_CHANGED', 'BRIDGE_LEGACY_PERIOD_INDEX_CHANGED', 'BRIDGE_TRACK_PERIOD_INDEX_ALREADY_PRESENT'] as $expected) {
            self::assertStringContainsString($expected, $guard);
        }
        self::assertStringContainsString('September15BridgeSchemaInspector', $guard);
        self::assertStringNotContainsString('$this->db->tableExists(', $guard);
        self::assertStringNotContainsString('$this->db->fieldExists(', $guard);
        self::assertStringContainsString('BRIDGE_STEP_{$step}_UNEXPECTED_TARGET', $guard);
    }

    public function testMissingPrerequisiteStillFailsClosed(): void
    {
        $inspector = $this->createMock(September15BridgeSchemaInspector::class);
        $inspector->expects(self::once())->method('tableExists')->with('department_head_assignments')->willReturn(false);
        $guard = $this->guardProbe($inspector);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('BRIDGE_STEP_2_PREREQUISITE_MISSING:department_head_assignments');
        $guard->validateStep(2);
    }

    public function testUnexpectedPartialTargetStillFailsClosed(): void
    {
        $inspector = $this->createMock(September15BridgeSchemaInspector::class);
        $inspector->expects(self::exactly(2))->method('tableExists')->willReturnMap([
            ['department_head_assignments', true],
            ['ranking_cycles', true],
        ]);
        $guard = $this->guardProbe($inspector);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('BRIDGE_STEP_2_UNEXPECTED_TARGET:ranking_cycles');
        $guard->validateStep(2);
    }

    private function guardProbe(September15BridgeSchemaInspector $inspector): object
    {
        return new class ($inspector) {
            use September15BridgeGuard {
                assertBridgeStep as public validateStep;
            }

            public object $db;

            public function __construct(private readonly September15BridgeSchemaInspector $inspector)
            {
                $this->db = new class {
                    public string $DBDriver = 'MySQLi';
                };
            }

            protected function bridgeSchemaInspector(): September15BridgeSchemaInspector
            {
                return $this->inspector;
            }
        };
    }

    public function testCompatibilityCyclesAreDeterministicAndSeparate(): void
    {
        $source = $this->source(2);
        self::assertStringContainsString("hash('sha256', 'ranking-cycle:' . \$periodId)", $source);
        self::assertStringContainsString("'LEGACY-' . substr(hash('sha256', (string) \$period['id']), 0, 16)", $source);
        $guard = file_get_contents(APPPATH . 'Phase17Canonical/Database/Migrations/September15BridgeGuard.php');
        self::assertStringContainsString('acceptance-closed-period-2026-09', $guard);
        self::assertStringContainsString('d198ba23-1571-4c5d-98e2-f57d50eee79d', $guard);
        self::assertStringContainsString('BRIDGE_COMPATIBILITY_PERIOD_SET_CHANGED', $guard);
    }

    public function testTrackScopedConcurrencyMatchesApprovedDefinitions(): void
    {
        $source = $this->source(3);
        self::assertStringContainsString("CONCAT(evaluation_type, ':', personnel_group)", $source);
        self::assertStringContainsString('uq_personnel_period_open_track', $source);
        self::assertStringContainsString('uq_personnel_period_track_identity (evaluation_type, personnel_group, academic_year, coverage_identity)', $source);
    }

    public function testRankPlacementAndCredentialSchemasMatchServices(): void
    {
        $placement = $this->source(4) . $this->source(7);
        foreach (['rank_placement_groups', 'rank_placement_group_ranks', 'personnel_rank_placements', 'personnel_rank_placement_suggestions', 'personnel_rank_placement_events', 'pending_personnel_guard', 'activation_failed', 'corrected', 'cancelled'] as $expected) {
            self::assertStringContainsString($expected, $placement);
        }
        $credentials = $this->source(6);
        foreach (['personnel_credentials', 'personnel_credential_events', 'degree_level', 'board_licensure_status', 'verification_status', 'provenance', 'supporting_document_reference', 'superseded', 'revoked'] as $expected) {
            self::assertStringContainsString($expected, $credentials);
        }
    }

    public function testFacultyReconciliationContainsOnlyApprovedExceptionAndReplacements(): void
    {
        $source = $this->source(5);
        foreach (['ASSISTANT_PROFESSOR_IV', 'ASSOCIATE_PROFESSOR', 'PROFESSOR_IV', 'UNIVERSITY_PROFESSOR', 'ASSISTANT_PROFESSOR_I', 'PROFESSOR_I', 'phd_exception', 'requires_verified_phd'] as $expected) {
            self::assertStringContainsString($expected, $source);
        }
        self::assertSame(1, substr_count($source, "'phd_exception'"));
    }

    public function testDecisionAndFinalReviewSchemasArePresent(): void
    {
        foreach ([8 => ['personnel_rank_applied_for_decisions', 'context_hash', 'deviation_reason'], 9 => ['personnel_recommended_rank_decisions', 'context_hash', 'retained_present_rank'], 10 => ['personnel_hr_final_rank_reviews', 'return_reason', 'hr_justification', 'reconsideration']] as $step => $tokens) {
            $source = $this->source($step);
            foreach ($tokens as $token) {
                self::assertStringContainsString($token, $source);
            }
        }
    }

    public function testOfficialDocumentsAndSupersessionSchemasArePresent(): void
    {
        $source = $this->source(11) . $this->source(12);
        foreach (['personnel_official_evaluation_documents', 'reference_number', 'qr_payload', 'summary_payload', 'evaluation_version', 'evaluation_root_id', 'idx_official_eval_document_case', 'superseded'] as $expected) {
            self::assertStringContainsString($expected, $source);
        }
        self::assertStringNotContainsString('public_document_url', $source);
    }

    public function testApprovedRankRecoveryAndCorrectionSchemasArePresent(): void
    {
        $source = $this->source(13) . $this->source(14) . $this->source(15);
        foreach (['personnel_approved_rank_records', 'personnel_approved_rank_events', 'personnel_rank_history', 'pending_personnel_guard', 'personnel_rank_activation_attempts', 'activation_failure_code', 'retry_succeeded', 'personnel_rank_corrections', 'source_approved_rank_record_id', 'original_case_guard', 'cancellation'] as $expected) {
            self::assertStringContainsString($expected, $source);
        }
    }
}
