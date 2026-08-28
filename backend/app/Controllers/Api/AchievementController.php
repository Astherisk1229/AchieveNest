<?php

namespace App\Controllers\Api;

use App\Helpers\ValidationHelper;
use App\Services\AuthorizationService;
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

        return $this->respond([
            'data' => [
                'achievements' => $records,
                'total'        => count($records),
            ],
        ], 200);
    }

    /**
     * POST /api/v1/achievements
     * Student submits external achievement.
     */
    public function create(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        if (! $this->authz->portfolio()->canCreate($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only students can submit external achievements.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];

        $title = trim((string) ($json['title'] ?? ''));
        $categoryId = trim((string) ($json['category_id'] ?? ''));
        $categoryNameOrCode = trim((string) ($json['category'] ?? ''));
        $description = trim((string) ($json['description'] ?? ''));
        $dateAwarded = ! empty($json['date_awarded']) ? trim((string) $json['date_awarded']) : date('Y-m-d');
        $venue = ! empty($json['venue']) ? trim((string) $json['venue']) : null;

        if ($title === '') {
            return $this->respond(['error' => ['code' => 'MISSING_TITLE', 'message' => 'Achievement title is required.']], 422);
        }

        $db = db_connect();

        // Resolve category
        $category = null;
        if ($categoryId !== '' && ValidationHelper::validateUuid($categoryId)) {
            $category = $db->table('portfolio_categories')
                ->where('id', $categoryId)
                ->where('status', 'active')
                ->get()
                ->getRowArray();
        }

        if ($category === null && $categoryNameOrCode !== '') {
            $category = $db->table('portfolio_categories')
                ->groupStart()
                    ->where('code', strtolower($categoryNameOrCode))
                    ->orLike('name', $categoryNameOrCode)
                ->groupEnd()
                ->where('status', 'active')
                ->get()
                ->getRowArray();
        }

        if ($category === null) {
            // Fallback to the first active category if unspecified
            $category = $db->table('portfolio_categories')
                ->where('status', 'active')
                ->orderBy('sort_order', 'ASC')
                ->get()
                ->getRowArray();
        }

        if ($category === null) {
            return $this->respond(['error' => ['code' => 'INVALID_CATEGORY', 'message' => 'Active portfolio category could not be resolved.']], 422);
        }

        $recordId = $this->genUuid();
        $now = date('Y-m-d H:i:s');

        $db->transStart();
        try {
            $db->table('student_portfolio_records')->insert([
                'id'                  => $recordId,
                'student_profile_id'  => $actor['profile']['id'],
                'category_id'         => $category['id'],
                'subcategory_id'      => null,
                'title'               => $title,
                'organizer_or_body'   => $venue,
                'occurrence_date'     => $dateAwarded,
                'description'         => $description !== '' ? $description : null,
                'status'              => 'submitted',
                'submitted_at'        => $now,
                'created_at'          => $now,
                'updated_at'          => $now,
            ]);

            $db->table('student_portfolio_verification_events')->insert([
                'id'                  => $this->genUuid(),
                'portfolio_record_id' => $recordId,
                'actor_profile_id'    => $actor['profile']['id'],
                'action'              => 'submitted',
                'previous_status'     => null,
                'new_status'          => 'submitted',
                'remarks'             => 'Submitted for verification',
                'occurred_at'         => $now,
            ]);

            $db->transComplete();
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->respond(['error' => ['code' => 'SUBMISSION_FAILED', 'message' => 'Failed to record achievement submission.']], 500);
        }

        if ($db->transStatus() === false) {
            return $this->respond(['error' => ['code' => 'SUBMISSION_FAILED', 'message' => 'Failed to record achievement submission.']], 500);
        }

        return $this->respondCreated([
            'data' => [
                'message'        => 'Achievement submitted for verification successfully.',
                'id'             => $recordId,
                'achievement_id' => $recordId,
                'title'          => $title,
                'status'         => 'submitted',
            ],
        ]);
    }
}
