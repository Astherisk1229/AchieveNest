<?php

namespace App\Controllers\Api;

use App\Services\AuthenticatedActorService;
use App\Services\StudentAchievementFormSchemaRegistry;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use RuntimeException;

final class StudentAchievementSchemaController extends Controller
{
    use ResponseTrait;

    public function __construct(
        private ?AuthenticatedActorService $actorService = null,
        private ?StudentAchievementFormSchemaRegistry $registry = null
    ) {
        $this->actorService ??= new AuthenticatedActorService();
        $this->registry ??= new StudentAchievementFormSchemaRegistry();
    }

    public function options()
    {
        return $this->respond(null, 204);
    }

    public function index()
    {
        $actor = $this->actorService->resolveActor(
            $this->request->getHeaderLine('Authorization')
        );

        if ($actor === null) {
            return $this->respond([
                'error' => [
                    'code' => 'UNAUTHORIZED',
                    'message' => 'Valid authenticated session required.',
                ],
            ], 401);
        }

        try {
            $catalogRows = $this->assertTrustedCatalog();
            $catalogByCode = [];
            foreach ($catalogRows as $row) {
                $catalogByCode[strtoupper((string) $row['contract_code'])] = $row;
            }
            $schema = $this->registry->all();
            foreach ($schema['categories'] as &$category) {
                foreach ($category['subcategories'] as &$contract) {
                    $catalog = $catalogByCode[strtoupper($contract['contract_code'])] ?? [];
                    $contract['legacy_category_id'] = $catalog['legacy_category_id'] ?? null;
                    $contract['legacy_subcategory_id'] = $catalog['legacy_subcategory_id'] ?? null;
                    $contract['schema_version'] = $schema['schema_version'];
                }
                unset($contract);
            }
            unset($category);

            return $this->respond(['data' => $schema], 200);
        } catch (RuntimeException) {
            return $this->respond([
                'error' => [
                    'code' => 'STUDENT_FORM_SCHEMA_CATALOG_UNTRUSTED',
                    'message' => 'Student achievement form metadata is temporarily unavailable.',
                ],
            ], 503);
        }
    }

    public function show(string $contractCode)
    {
        $actor = $this->actorService->resolveActor(
            $this->request->getHeaderLine('Authorization')
        );

        if ($actor === null) {
            return $this->respond([
                'error' => [
                    'code' => 'UNAUTHORIZED',
                    'message' => 'Valid authenticated session required.',
                ],
            ], 401);
        }

        try {
            $this->assertTrustedCatalog();

            return $this->respond([
                'data' => $this->registry->get($contractCode),
            ], 200);
        } catch (RuntimeException $error) {
            if (
                $error->getMessage()
                === 'STUDENT_FORM_SCHEMA_CONTRACT_CATALOG_MISMATCH'
            ) {
                return $this->respond([
                    'error' => [
                        'code' => 'STUDENT_FORM_SCHEMA_CATALOG_UNTRUSTED',
                        'message' => 'Student achievement form metadata is temporarily unavailable.',
                    ],
                ], 503);
            }

            return $this->respond([
                'error' => [
                    'code' => 'STUDENT_FORM_SCHEMA_CONTRACT_NOT_FOUND',
                    'message' => 'Student achievement form contract not found.',
                ],
            ], 404);
        }
    }

    private function assertTrustedCatalog(): array
    {
        $rows = db_connect()
            ->table('achievement_contracts')
            ->select('contract_code, display_name, category_code, legacy_category_id, legacy_subcategory_id')
            ->where('domain', 'STUDENT')
            ->where('is_active', 1)
            ->get()
            ->getResultArray();

        $this->registry->assertMatchesActiveContractRows($rows);
        return $rows;
    }
}
