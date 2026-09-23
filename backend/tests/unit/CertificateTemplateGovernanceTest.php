<?php

namespace Tests\Unit;

use App\Services\CertificateIdentityService;
use App\Services\CertificateTemplateContractService;
use App\Services\CertificateTemplateGovernanceService;
use CodeIgniter\Database\BaseConnection;
use CodeIgniter\Test\CIUnitTestCase;

final class CertificateTemplateGovernanceTest extends CIUnitTestCase
{
    private function service(): CertificateTemplateGovernanceService
    {
        return new CertificateTemplateGovernanceService(
            $this->createMock(BaseConnection::class),
            new CertificateTemplateContractService(),
            new CertificateIdentityService(),
        );
    }

    private function validDocument(): array
    {
        return [
            'content_schema' => [
                'heading' => 'Certificate of Appreciation',
                'recipient_lead_in' => 'This certificate is presented to',
                'body' => '{{recipient_name}} is recognized for {{activity_title}} as {{contribution_role}}.',
                'footer_note' => 'Issued by {{issuer_name}} on {{issued_date}}. Certificate {{certificate_number}}. Verify at {{verification_url}}.',
            ],
            'layout_schema' => [
                'page_size' => 'A4', 'orientation' => 'landscape', 'alignment' => 'center',
                'theme_id' => 'emerald_gold', 'border_style' => 'classic_ornate',
                'logo_placement' => 'top_center', 'signature_layout' => 'single_row', 'qr_placement' => 'bottom_right',
            ],
            'placeholder_contract' => [
                ['name' => 'recipient_name', 'requirement_type' => 'REQUIRED'],
                ['name' => 'activity_title', 'requirement_type' => 'REQUIRED'],
                ['name' => 'contribution_role', 'requirement_type' => 'REQUIRED'],
                ['name' => 'issuer_name', 'requirement_type' => 'REQUIRED'],
                ['name' => 'issued_date', 'requirement_type' => 'RESOLVED_AT_ISSUANCE'],
                ['name' => 'certificate_number', 'requirement_type' => 'RESOLVED_AT_ISSUANCE'],
                ['name' => 'verification_url', 'requirement_type' => 'RESOLVED_AT_ISSUANCE'],
            ],
            'signatory_slots' => [[
                'role_code' => 'OSAD_DIRECTOR', 'display_label' => 'OSAD Director',
                'requirement_type' => 'OPTIONAL', 'signature_required' => false, 'display_order' => 1,
            ]],
        ];
    }

    public function testValidGovernedDraftPassesPublicationValidation(): void
    {
        self::assertSame([], $this->service()->validateDocument($this->validDocument(), 'APPRECIATION'));
    }

    public function testUnknownPlaceholderAndInvalidSignatoryAreRejected(): void
    {
        $document = $this->validDocument();
        $document['content_schema']['body'] .= ' {{unknown_field}}';
        $document['signatory_slots'][0]['role_code'] = 'INVENTED_AUTHORITY';
        $codes = array_column($this->service()->validateDocument($document, 'APPRECIATION'), 'code');
        self::assertContains('UNKNOWN_PLACEHOLDER', $codes);
        self::assertContains('INVALID_SIGNATORY_SLOT', $codes);
    }

    public function testRoutesExposeGovernedLifecycleWithoutCertificateLifecycleEndpoints(): void
    {
        $routes = file_get_contents(APPPATH . 'Config/Routes.php');
        self::assertStringContainsString("certificate-template-versions/(:segment)/validate", $routes);
        self::assertStringContainsString("certificate-template-versions/(:segment)/publish", $routes);
        self::assertStringNotContainsString("certificate-template-versions/(:segment)/revoke", $routes);
        self::assertStringNotContainsString("certificates/(:segment)/reissue", $routes);
    }

    public function testImplementationEnforcesAuthorizationImmutabilityConcurrencyAndAuditContracts(): void
    {
        $controller = file_get_contents(APPPATH . 'Controllers/Api/CertificateTemplateController.php');
        $service = file_get_contents(APPPATH . 'Services/CertificateTemplateGovernanceService.php');
        self::assertStringContainsString("in_array('osad_staff'", $controller);
        self::assertStringContainsString('PUBLISHED_VERSION_IMMUTABLE', $service);
        self::assertStringContainsString('STALE_DRAFT', $service);
        self::assertStringContainsString('DRAFT_VALIDATION_REQUIRED', $service);
        self::assertStringContainsString('assertExpectedToken', $service);
        self::assertStringContainsString('TEMPLATE_PUBLISHED', $service);
        self::assertStringContainsString('TEMPLATE_VERSION_SUPERSEDED', $service);
        self::assertStringContainsString("'status' => self::DB_SUPERSEDED", $service);
    }
}
