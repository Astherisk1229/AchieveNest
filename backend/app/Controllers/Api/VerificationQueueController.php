<?php

namespace App\Controllers\Api;

use App\Services\SupabaseAuthService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class VerificationQueueController extends Controller
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
     * GET /api/v1/verification/queue
     * Verifiers view pending submissions.
     */
    public function queue()
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $verifierRoles = ['department_secretary', 'program_coordinator', 'organization_moderator', 'hr_staff', 'osad_staff'];
        $hasVerifierRole = count(array_intersect($verifierRoles, $actor['roles'])) > 0;

        if (! $hasVerifierRole) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Authorized verifier role required.']], 403);
        }

        $db = db_connect();

        $queue = $db->query(
            'SELECT vr.id AS request_id, vr.status AS request_status, vr.submitted_at,
                    a.id AS achievement_id, a.title, a.category, a.description, a.date_awarded, a.venue, a.evidence_url,
                    p.id AS student_id, p.institutional_id, p.full_name AS student_name, p.institutional_email
             FROM public.verification_requests vr
             JOIN public.achievements a ON a.id = vr.achievement_id
             JOIN public.profiles p ON p.id = a.student_id
             WHERE vr.status = \'pending\'
             ORDER BY vr.submitted_at ASC'
        )->getResultArray();

        return $this->respond([
            'data' => [
                'queue' => $queue,
            ],
        ], 200);
    }

    /**
     * POST /api/v1/verification/{id}/decide
     * Approve, reject, or return achievement for correction.
     */
    public function decide(string $requestId)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $verifierRoles = ['department_secretary', 'program_coordinator', 'organization_moderator', 'hr_staff', 'osad_staff'];
        $hasVerifierRole = count(array_intersect($verifierRoles, $actor['roles'])) > 0;

        if (! $hasVerifierRole) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Authorized verifier role required to make verification decisions.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $decision = trim((string) ($json['decision'] ?? 'approved')); // 'approved' | 'rejected' | 'returned'
        $remarks = trim((string) ($json['remarks'] ?? ''));

        if (! in_array($decision, ['approved', 'rejected', 'returned'], true)) {
            return $this->respond(['error' => ['code' => 'INVALID_DECISION', 'message' => 'Decision must be approved, rejected, or returned.']], 422);
        }

        $db = db_connect();

        $request = $db->table('public.verification_requests')->where('id', $requestId)->get()->getRowArray();
        if ($request === null) {
            return $this->respond(['error' => ['code' => 'REQUEST_NOT_FOUND', 'message' => 'Verification request not found.']], 404);
        }

        $achievementStatus = $decision === 'approved' ? 'verified' : ($decision === 'rejected' ? 'rejected' : 'returned');

        $db->transBegin();
        try {
            $db->table('public.verification_requests')->where('id', $requestId)->update([
                'status'      => $decision,
                'reviewed_at' => date('Y-m-d H:i:s'),
                'reviewer_id' => $actor['profile']['id'],
                'remarks'     => $remarks,
            ]);

            $db->table('public.achievements')->where('id', $request['achievement_id'])->update([
                'status'     => $achievementStatus,
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->respond(['error' => ['code' => 'DECISION_FAILED', 'message' => 'Failed to record decision: ' . $e->getMessage()]], 500);
        }

        return $this->respond([
            'data' => [
                'message'            => sprintf('Achievement %s successfully.', $achievementStatus),
                'request_id'         => $requestId,
                'achievement_id'     => $request['achievement_id'],
                'achievement_status' => $achievementStatus,
                'decision'           => $decision,
            ],
        ], 200);
    }
}
