<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
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
            ->whereIn('spr.status', ['submitted', 'under_review', 'revisions_requested'])
            ->orderBy('spr.submitted_at', 'ASC');

        $this->authz->portfolio()->scopeVerificationQuery($actor, $builder);

        $queue = $builder->get()->getResultArray();

        return $this->respond([
            'data' => [
                'queue' => $queue,
                'total' => count($queue),
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

        $verifierRoles = ['dean', 'program_coordinator', 'organization_moderator', 'hr_staff', 'osad_staff'];
        $hasVerifierRole = count(array_intersect($verifierRoles, $actor['roles'] ?? [])) > 0;

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
        $record = $db->table('student_portfolio_records')->where('id', $requestId)->get()->getRowArray();
        if ($record === null) {
            return $this->respond(['error' => ['code' => 'REQUEST_NOT_FOUND', 'message' => 'Verification request not found.']], 404);
        }

        if (! $this->authz->portfolio()->canVerify($actor, $record)) {
            if ($record['student_profile_id'] === $actor['profile']['id']) {
                return $this->respond(['error' => ['code' => 'SELF_VERIFICATION_FORBIDDEN', 'message' => 'Students cannot verify their own submissions.']], 403);
            }
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'You are not the authorized active Program Coordinator for this student program.']], 403);
        }

        $targetStatus = $decision === 'approved' ? 'verified' : ($decision === 'rejected' ? 'rejected' : 'revisions_requested');
        $now = date('Y-m-d H:i:s');

        $db->transStart();
        try {
            $db->table('student_portfolio_records')->where('id', $requestId)->update([
                'status'      => $targetStatus,
                'verified_at' => $targetStatus === 'verified' ? $now : null,
                'updated_at'  => $now,
            ]);

            $db->table('student_portfolio_verification_events')->insert([
                'id'                  => $this->genUuid(),
                'portfolio_record_id' => $requestId,
                'actor_profile_id'    => $actor['profile']['id'],
                'action'              => $decision,
                'previous_status'     => $record['status'],
                'new_status'          => $targetStatus,
                'remarks'             => $remarks !== '' ? $remarks : null,
                'occurred_at'         => $now,
            ]);

            $db->transComplete();
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->respond(['error' => ['code' => 'DECISION_FAILED', 'message' => 'Failed to record decision: ' . $e->getMessage()]], 500);
        }

        return $this->respond([
            'data' => [
                'message'            => sprintf('Achievement %s successfully.', $targetStatus),
                'request_id'         => $requestId,
                'achievement_id'     => $requestId,
                'achievement_status' => $targetStatus,
                'decision'           => $decision,
            ],
        ], 200);
    }
}
