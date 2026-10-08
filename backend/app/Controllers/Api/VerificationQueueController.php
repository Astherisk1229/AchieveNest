<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
use App\Services\StudentAchievementRecordSummaryService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class VerificationQueueController extends Controller
{
    use ResponseTrait;

    protected AuthorizationService $authz;

    public function __construct(?AuthorizationService $authz = null)
    {
        $this->authz = $authz ?? new AuthorizationService();
    }

    public function options()
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
     * GET /api/v1/verification/queue
     * Verifiers view pending submissions mapped from student_portfolio_records.
     */
    public function queue()
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $verifierRoles = ['dean', 'program_coordinator', 'organization_moderator', 'hr_staff', 'osad_staff'];
        $hasVerifierRole = count(array_intersect($verifierRoles, $actor['roles'] ?? [])) > 0;

        if (! $hasVerifierRole) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Authorized verifier role required.']], 403);
        }

        $db = db_connect();
        $builder = $db->table('student_portfolio_records spr')
            ->select([
                'spr.id AS request_id',
                'spr.id AS achievement_id',
                'spr.status AS request_status',
                'spr.submitted_at',
                'spr.title',
                'spr.category_id',
                'spr.subcategory_id',
                'spr.structured_metadata',
                'pc.name AS category',
                'spr.description',
                'spr.occurrence_date AS date_awarded',
                'spr.organizer_or_body AS venue',
                'p.id AS student_id',
                'p.institutional_id',
                'p.full_name AS student_name',
                'p.email AS institutional_email',
            ])
            ->join('portfolio_categories pc', 'pc.id = spr.category_id')
            ->join('profiles p', 'p.id = spr.student_profile_id')
            ->whereIn('spr.status', ['submitted', 'revision_requested'])
            ->orderBy('spr.submitted_at', 'ASC');

        $this->authz->portfolio()->scopeVerificationQuery($actor, $builder);

        $queue = $builder->get()->getResultArray();
        $summaryService = new StudentAchievementRecordSummaryService($db);
        foreach ($queue as &$item) {
            $metadata = json_decode((string) ($item['structured_metadata'] ?? '{}'), true) ?: [];
            $summary = $summaryService->derive(
                (string) ($item['category_id'] ?? ''),
                !empty($item['subcategory_id']) ? (string) $item['subcategory_id'] : null,
                $metadata
            );
            if ($summary !== null) {
                $item['title'] = $summary['title'];
                $item['description'] = $summary['description'];
                $item['date_awarded'] = $summary['occurrence_date'];
                $item['venue'] = $summary['organizer_or_body'];
            }
            unset($item['structured_metadata']);
        }
        unset($item);

        return $this->respond([
            'data' => [
                'queue' => $queue,
                'total' => count($queue),
            ],
        ], 200);
    }

}
