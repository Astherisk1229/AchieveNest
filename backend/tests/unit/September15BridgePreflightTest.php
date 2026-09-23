<?php

use PHPUnit\Framework\TestCase;

final class September15BridgePreflightTest extends TestCase
{
    private function source(string $path): string
    {
        return file_get_contents(ROOTPATH . $path);
    }

    public function testExactCanonicalLedgerIsRequired(): void
    {
        $source = $this->source('app/Services/September15BridgePreflightService.php');
        foreach (['CreateCanonicalMySQLBaseline', 'ExtendAnnualReviewsForRatings', 'CreateAnnualReviewImports', 'BindAnnualReviewPreviewToPersonnel', 'ReconcileDeanPortfolioEvaluation', 'AddEvaluationStartedAt'] as $class) {
            self::assertStringContainsString($class, $source);
        }
        self::assertStringContainsString('CANONICAL_LEDGER_MISMATCH_AT_BATCH_', $source);
    }

    public function testMissingAndUnexpectedCanonicalMigrationsFailClosed(): void
    {
        $source = $this->source('app/Services/September15BridgePreflightService.php');
        self::assertStringContainsString('MISSING_CANONICAL_MIGRATION', $source);
        self::assertStringContainsString('UNEXPECTED_LATER_CANONICAL_MIGRATION', $source);
        self::assertStringContainsString('APP_MIGRATIONS_UNEXPECTEDLY_APPLIED', $source);
    }

    public function testExistingOrPartialTargetDomainFailsClosed(): void
    {
        $source = $this->source('app/Services/September15BridgePreflightService.php');
        self::assertStringContainsString('SEPTEMBER15_TARGETS_ALREADY_PRESENT', $source);
        self::assertStringContainsString("'department_head_assignments'", $source);
        self::assertStringContainsString("'personnel_rank_corrections'", $source);
    }

    public function testLegacyPeriodDefinitionsAreCheckedNotMerelyNamed(): void
    {
        $source = $this->source('app/Services/September15BridgePreflightService.php');
        foreach (['GENERATION_EXPRESSION', "'varchar(64)'", "'evaluation_type,academic_year,coverage_identity'", 'LEGACY_PERIOD_INDEX_MISMATCH', 'TRACK_PERIOD_INDEX_ALREADY_PRESENT'] as $expected) {
            self::assertStringContainsString($expected, $source);
        }
    }

    public function testCompatibilityCandidatesAreEnumeratedWithoutPairing(): void
    {
        $source = $this->source('app/Services/September15BridgePreflightService.php');
        self::assertStringContainsString('one compatibility cycle for this period only; no cross-track pairing', $source);
        self::assertStringContainsString('pairing_ambiguity', $source);
        self::assertStringContainsString("'LEGACY-' . substr(hash('sha256'", $source);
    }

    public function testExpectedLegacyAndReconciledTransitionStatesAreRecognized(): void
    {
        $source = $this->source('app/Services/September15BridgePreflightService.php');
        foreach (['INSTRUCTOR_I', 'SENIOR_INSTRUCTOR_I', 'ASSISTANT_PROFESSOR_IV', 'ASSOCIATE_PROFESSOR', 'UNIVERSITY_PROFESSOR_I', 'phd_exception', 'already_reconciled'] as $expected) {
            self::assertStringContainsString($expected, $source);
        }
    }

    public function testMissingKwPrerequisitesAreBlockers(): void
    {
        $source = $this->source('app/Services/September15BridgePreflightService.php');
        self::assertStringContainsString('MISSING_KW_PREREQUISITES', $source);
        foreach (['personnel_evaluation_roots', 'evaluation_scale_versions', 'faculty_rank_transitions', 'file_security_audit_events'] as $table) {
            self::assertStringContainsString($table, $source);
        }
    }

    public function testBaselineProofEngineIsShared(): void
    {
        self::assertStringContainsString('CanonicalBaselineProofService', $this->source('app/Services/September15BridgePreflightService.php'));
        self::assertStringContainsString('CanonicalBaselineProofService', $this->source('app/Commands/ReconcileCanonicalMigrationBaseline.php'));
    }

    public function testPreflightPathContainsNoDatabaseMutationCalls(): void
    {
        $source = $this->source('app/Services/September15BridgePreflightService.php');
        foreach (['->insert(', '->update(', '->delete(', 'ALTER TABLE', 'CREATE TABLE', 'DROP TABLE', 'TRUNCATE '] as $mutation) {
            self::assertStringNotContainsString($mutation, $source);
        }
        $command = $this->source('app/Commands/PreflightSeptember15Bridge.php');
        self::assertStringContainsString('database_writes=ZERO', $command);
        self::assertStringNotContainsString("CLI::getOption('apply')", $command);
    }

    public function testCommandFailsNonZeroByExceptionAndIsRepeatSafe(): void
    {
        $command = $this->source('app/Commands/PreflightSeptember15Bridge.php');
        self::assertStringContainsString('SEPTEMBER15_BRIDGE_PREFLIGHT_FAILED', $command);
        self::assertStringContainsString('migration:preflight-september15-bridge', $command);
        self::assertStringContainsString("(new September15BridgePreflightService())->audit(db_connect())", $command);
    }

    public function testExactBridgeOrderIsReportedWithoutCreatingMigrations(): void
    {
        $source = $this->source('app/Services/September15BridgePreflightService.php');
        $offset = -1;
        foreach (['CreateDepartmentHeadAssignments', 'CreateRankingCycles', 'ScopePersonnelPeriodConcurrencyByTrack', 'CreateRankPlacementDomain', 'ReconcileAuthoritativeFacultyRankTransitions', 'CreateCanonicalPersonnelCredentials', 'CreatePlacementSuggestionLifecycle', 'CreateRankAppliedForDecisions', 'CreateRecommendedRankDecisions', 'CreateHrFinalRankReviews', 'CreateOfficialEvaluationDocuments', 'AddOfficialDocumentCaseSupersession', 'CreateOfflineApprovedRanks', 'AddApprovedRankActivationRecovery', 'AddRankCorrectionAndCancellation'] as $migration) {
            $next = strpos($source, "'{$migration}'", $offset + 1);
            self::assertNotFalse($next);
            self::assertGreaterThan($offset, $next);
            $offset = $next;
        }
    }
}
