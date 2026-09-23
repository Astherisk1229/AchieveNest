<?php

namespace Tests\Unit;

use CodeIgniter\Test\CIUnitTestCase;

final class CanonicalPersonnelCredentialFoundationTest extends CIUnitTestCase
{
    private function source(string $path): string { return file_get_contents(ROOTPATH . $path); }

    public function testSchemaStoresStructuredCredentialFactsWithoutRankingDecision(): void
    {
        $migration = $this->source('app/Database/Migrations/2026-09-15-000006_CreateCanonicalPersonnelCredentials.php');
        foreach (['credential_type', 'degree_level', 'board_licensure_status', 'credential_title',
            'issuing_institution_authority', 'earned_issued_on', 'verification_status',
            'verified_by_profile_id', 'verified_at', 'provenance', 'supporting_document_reference',
            'supporting_evidence_id', 'record_state', 'supersedes_credential_id'] as $field) {
            self::assertStringContainsString($field, $migration);
        }
        self::assertStringNotContainsString('rank_placement_group_id', $migration);
        self::assertStringNotContainsString('recommended_rank', $migration);
    }

    public function testSchemaRestrictsOnlyExplicitDegreeAndBoardFacts(): void
    {
        $migration = $this->source('app/Database/Migrations/2026-09-15-000006_CreateCanonicalPersonnelCredentials.php');
        self::assertStringContainsString("degree_level IN ('baccalaureate','masters','doctorate')", $migration);
        self::assertStringContainsString("board_licensure_status IN ('board_passer','non_board')", $migration);
        self::assertStringContainsString("record_state IN ('active','superseded','revoked')", $migration);
        self::assertStringNotContainsString('qualification_summary', $migration);
    }

    public function testVerifiedCredentialFactsCannotBeResubmittedAsAnUpdate(): void
    {
        $service = $this->source('app/Services/PersonnelCredentialService.php');
        self::assertStringContainsString('CREDENTIAL_NOT_PENDING_VERIFICATION', $service);
        self::assertStringContainsString("['record_state' => 'superseded']", $service);
        self::assertStringContainsString("'supersedes_credential_id'", $service);
        self::assertStringNotContainsString('qualification_summary', $service);
        self::assertStringNotContainsString('keyword', strtolower($service));
    }

    public function testAuthorizationSeparatesPersonnelOwnershipFromHrVerification(): void
    {
        $controller = $this->source('app/Controllers/Api/PersonnelCredentialController.php');
        self::assertStringContainsString("hasRole(\$actor, 'personnel')", $controller);
        self::assertStringContainsString("hasRole(\$actor, 'hr_staff')", $controller);
        self::assertStringContainsString('public function ownVerified()', $controller);
        self::assertStringContainsString('public function verify(', $controller);
    }

    public function testRoutesExposeOnlySubmissionVerificationAndHistoryFoundation(): void
    {
        $routes = $this->source('app/Config/Routes.php');
        self::assertStringContainsString("post('personnel/credentials'", $routes);
        self::assertStringContainsString("get('personnel/credentials'", $routes);
        self::assertStringContainsString("post('hr/personnel/(:segment)/credentials/(:segment)/verify'", $routes);
        self::assertStringNotContainsString("credentials/suggest-placement", $routes);
    }
}
