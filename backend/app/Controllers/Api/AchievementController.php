<?php

namespace App\Controllers\Api;

use App\Helpers\ValidationHelper;
use App\Services\AuthorizationService;
use App\Services\StudentAchievementRecordSummaryService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

/**
 * AchievementController
 *
 * Provides compatibility adapter over the authoritative student_portfolio_records model
 * for legacy /api/v1/achievements endpoints in local-defense mode.
 */
class AchievementController extends Controller
{
    use ResponseTrait;

    protected AuthorizationService $authz;

    public function __construct(?AuthorizationService $authz = null)
    {
        $this->authz = $authz ?? new AuthorizationService();
    }

    public function options(): mixed
    {
        return $this->respond(null, 204);
    }

    protected function resolveActor(): ?array
    {
        return $this->authz->resolveActor($this->request->getHeaderLine('Authorization'));
    }

    private function genUuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            random_int(0, 0xffff), random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0x0fff) | 0x4000,
            random_int(0, 0x3fff) | 0x8000,
            random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff)
        );
    }

    /**
     * GET /api/v1/achievements
     * Lists achievements/portfolio records scoped to the authenticated actor.
     */
    public function index(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $db = db_connect();
        $isStudent = ($actor['profile']['account_type'] ?? '') === 'student';
        $studentParam = trim((string) $this->request->getGet('student_id'));

        $builder = $db->table('student_portfolio_records spr')
            ->select([
                'spr.id',
                'spr.student_profile_id AS student_id',
                'spr.title',
                'spr.category_id',
                'spr.subcategory_id',
                'pc.name AS category',
                'pc.code AS category_code',
                'spr.description',
                'spr.occurrence_date AS date_awarded',
                'spr.organizer_or_body AS venue',
                'spr.structured_metadata',
                'spr.status',
                'spr.created_at',
                'spr.updated_at',
                'p.full_name AS student_name',
                'p.institutional_id AS student_id_number',
            ])
            ->join('portfolio_categories pc', 'pc.id = spr.category_id')
            ->join('profiles p', 'p.id = spr.student_profile_id')
            ->orderBy('spr.created_at', 'DESC');

        // Apply centralized application-layer scope policy
        $this->authz->portfolio()->scopeListQuery($actor, $builder);

        if (! $isStudent && $studentParam !== '') {
            $builder->where('spr.student_profile_id', $studentParam);
        }

        $records = $builder->get()->getResultArray();
        $summaryService = new StudentAchievementRecordSummaryService($db);
        foreach ($records as &$record) {
            $metadata = json_decode((string) ($record['structured_metadata'] ?? '{}'), true) ?: [];
            $summary = $summaryService->derive(
                (string) ($record['category_id'] ?? ''),
                !empty($record['subcategory_id']) ? (string) $record['subcategory_id'] : null,
                $metadata
            );
            if ($summary !== null) {
                $record['title'] = $summary['title'];
                $record['description'] = $summary['description'];
                $record['date_awarded'] = $summary['occurrence_date'];
                $record['venue'] = $summary['organizer_or_body'];
            }
            unset($record['structured_metadata']);
        }
        unset($record);

        return $this->respond([
            'data' => [
                'achievements' => $records,
                'total'        => count($records),
            ],
        ], 200);
    }

}
