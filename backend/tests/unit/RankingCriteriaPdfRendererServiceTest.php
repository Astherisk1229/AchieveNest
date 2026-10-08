<?php

namespace Tests\Unit;

use App\Controllers\Api\EvaluationScaleController;
use App\Services\AuthenticatedActorService;
use App\Services\RankingCriteriaPdfRendererService;
use App\Services\RubricAdministrationService;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Services;

final class RankingCriteriaPdfRendererServiceTest extends CIUnitTestCase
{
    public function testItCreatesMpdfCacheDirectoriesAndRendersPdf(): void
    {
        $tempDir = WRITEPATH . 'cache' . DIRECTORY_SEPARATOR . 'ranking-criteria-pdf-test';
        $pdf = (new RankingCriteriaPdfRendererService($tempDir))->render($this->criteriaTree());

        self::assertStringStartsWith('%PDF-', $pdf);
        self::assertStringContainsString('%%EOF', $pdf);
        self::assertGreaterThan(1000, strlen($pdf));
        self::assertDirectoryExists($tempDir . DIRECTORY_SEPARATOR . 'mpdf');
        self::assertDirectoryExists($tempDir . DIRECTORY_SEPARATOR . 'mpdf' . DIRECTORY_SEPARATOR . 'ttfontdata');
    }

    public function testDownloadEndpointReturnsGeneratedPdfAsAnAttachment(): void
    {
        $actorService = $this->createMock(AuthenticatedActorService::class);
        $actorService->method('resolveActor')->willReturn(['roles' => ['hr_admin']]);

        $adminService = $this->createMock(RubricAdministrationService::class);
        $adminService->method('getScaleVersionHierarchy')->with('scale-version-1')->willReturn($this->criteriaTree());

        $controller = new EvaluationScaleController(actorService: $actorService, adminService: $adminService);
        $controller->initController(Services::request(), Services::response(), Services::logger());
        $response = $controller->downloadScaleVersionPdf('scale-version-1');

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('application/pdf', $response->getHeaderLine('Content-Type'));
        self::assertStringContainsString('attachment; filename=', $response->getHeaderLine('Content-Disposition'));
        self::assertStringStartsWith('%PDF-', $response->getBody());
        self::assertStringContainsString('%%EOF', $response->getBody());
    }

    private function criteriaTree(): array
    {
        return [
            'sheet' => [
                'name' => 'Administrators Ranking Scale',
                'applies_to' => 'FACULTY',
                'overall_max_points' => 160,
                'passing_score' => 120,
            ],
            'version' => [
                'version_number' => '1.0.0',
                'effective_start_date' => '2025-06-01',
            ],
            'areas' => [[
                'area_code' => 'A',
                'name' => 'Area A: Professional Development',
                'max_points' => 70,
                'categories' => [[
                    'category_code' => 'A.1',
                    'name' => 'A.1 Degree/s',
                    'max_points' => 40,
                    'criteria' => [[
                        'name' => 'Ph.D. Holder',
                        'description' => 'Completed Ph.D.',
                        'max_points_per_entry' => 40,
                    ]],
                ]],
            ]],
        ];
    }
}
