<?php

namespace App\Controllers\Api;

use App\Services\SupabaseAuthService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class AchievementController extends Controller
{
    use ResponseTrait;

    public function options()
    {
        return $this->respond(null, 204);
    }

    protected function resolveActor(): ?array
    {
        $authorization = $this->request->getHeaderLine('Authorization');
        if ($authorization === '' || ! preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches)) {
            return null;
        }

        $token = trim($matches[1]);

        try {
            $claims = (new SupabaseAuthService())->verifyAccessToken($token);
        } catch (Throwable) {
            return null;
        }

        $authUserId = (string) ($claims->sub ?? '');
        if ($authUserId === '') {
            return null;
        }

        $db = db_connect();
        $profile = $db->table('public.profiles')
            ->where('id', $authUserId)
            ->get()
            ->getRowArray();

        if ($profile === null || ($profile['status'] ?? '') !== 'active') {
            return null;
        }

        $roles = $db->query(
            'SELECT r.role_key
             FROM public.profile_roles pr
             JOIN public.roles r ON r.id = pr.role_id
             WHERE pr.profile_id = ? AND pr.is_active = true',
            [$authUserId]
        )->getResultArray();

        return [
            'profile' => $profile,
            'roles'   => array_column($roles, 'role_key'),
        ];
    }

    /**
     * GET /api/v1/achievements
     */
    public function index()
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $db = db_connect();

        // If student: return their achievements
        if ($actor['profile']['account_type'] === 'student') {
            $achievements = $db->query(
                'SELECT a.*, p.full_name AS student_name, p.institutional_id AS student_id_number
                 FROM public.achievements a
                 JOIN public.profiles p ON p.id = a.student_id
                 WHERE a.student_id = ?
                 ORDER BY a.created_at DESC',
                [$actor['profile']['id']]
            )->getResultArray();
        } else {
            // Personnel / Verifiers can view verified achievements or query by student_id
            $studentIdParam = $this->request->getGet('student_id');
            if ($studentIdParam !== null) {
                $achievements = $db->query(
                    'SELECT a.*, p.full_name AS student_name, p.institutional_id AS student_id_number
                     FROM public.achievements a
                     JOIN public.profiles p ON p.id = a.student_id
                     WHERE a.student_id = ?
                     ORDER BY a.created_at DESC',
                    [$studentIdParam]
                )->getResultArray();
            } else {
                $achievements = $db->query(
                    'SELECT a.*, p.full_name AS student_name, p.institutional_id AS student_id_number
                     FROM public.achievements a
                     JOIN public.profiles p ON p.id = a.student_id
                     WHERE a.status = \'verified\'
                     ORDER BY a.created_at DESC LIMIT 100'
                )->getResultArray();
            }
        }

        return $this->respond([
            'data' => [
                'achievements' => $achievements,
            ],
        ], 200);
    }

    /**
     * POST /api/v1/achievements
     * Student submits external achievement.
     */
    public function create()
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        if ($actor['profile']['account_type'] !== 'student') {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only students can submit external achievements.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];

        $title = trim((string) ($json['title'] ?? ''));
        $category = trim((string) ($json['category'] ?? 'Academic Competition'));
        $description = trim((string) ($json['description'] ?? ''));
        $dateAwarded = ! empty($json['date_awarded']) ? trim((string) $json['date_awarded']) : date('Y-m-d');
        $venue = ! empty($json['venue']) ? trim((string) $json['venue']) : null;
        $evidenceUrl = ! empty($json['evidence_url']) ? trim((string) $json['evidence_url']) : null;

        if ($title === '') {
            return $this->respond(['error' => ['code' => 'MISSING_TITLE', 'message' => 'Achievement title is required.']], 422);
        }

        $db = db_connect();
        $achievementId = (string) service('uuid')->uuid4();

        $db->transBegin();
        try {
            $db->table('public.achievements')->insert([
                'id'           => $achievementId,
                'student_id'   => $actor['profile']['id'],
                'title'        => $title,
                'category'     => $category,
                'description'  => $description,
                'date_awarded' => $dateAwarded,
                'venue'        => $venue,
                'evidence_url' => $evidenceUrl,
                'status'       => 'submitted',
                'created_at'   => date('Y-m-d H:i:s'),
                'updated_at'   => date('Y-m-d H:i:s'),
            ]);

            // Create verification queue request
            $db->table('public.verification_requests')->insert([
                'id'             => (string) service('uuid')->uuid4(),
                'achievement_id' => $achievementId,
                'submitted_by'   => $actor['profile']['id'],
                'status'         => 'pending',
                'submitted_at'   => date('Y-m-d H:i:s'),
            ]);

            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->respond(['error' => ['code' => 'SUBMISSION_FAILED', 'message' => 'Failed to record achievement submission: ' . $e->getMessage()]], 500);
        }

        return $this->respondCreated([
            'data' => [
                'message'        => 'Achievement successfully submitted for verification.',
                'id'             => $achievementId,
                'title'          => $title,
                'status'         => 'submitted',
            ],
        ]);
    }
}
