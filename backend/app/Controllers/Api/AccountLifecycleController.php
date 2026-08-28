<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;

class AccountLifecycleController extends Controller
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
     * Helper to validate authority over target profile (HR Admin manages personnel, OSAD Admin manages students).
     */
    protected function checkLifecycleAuthority(array $actor, array $target): ?string
    {
        if (in_array($target['account_type'], ['hr_admin', 'osad_admin'], true)) {
            return 'Top-level administrative accounts cannot be modified through standard lifecycle endpoints.';
        }

        if (! $this->authz->governance()->canManageLifecycle($actor, $target['account_type'] ?? '')) {
            if ($target['account_type'] === 'personnel') {
                return 'Only dedicated HR administrators (hr_admin) may manage personnel account lifecycles.';
            }
            if ($target['account_type'] === 'student') {
                return 'Only dedicated OSAD administrators (osad_admin) may manage student account lifecycles.';
            }
            return 'Unauthorized lifecycle management action.';
        }

        return null;
    }

    /**
     * POST /api/v1/accounts/{id}/suspend
     */
    public function suspend(string $targetId)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $db = db_connect();
        $target = $db->table('profiles')->where('id', $targetId)->get()->getRowArray();
        if ($target === null) {
            return $this->respond(['error' => ['code' => 'PROFILE_NOT_FOUND', 'message' => 'Target account not found.']], 404);
        }

        $authErr = $this->checkLifecycleAuthority($actor, $target);
        if ($authErr !== null) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => $authErr]], 403);
        }

        // Validate state transition
        $currentStatus = $target['status'] ?? 'active';
        if ($currentStatus === 'suspended') {
            return $this->respond(['error' => ['code' => 'INVALID_STATE_TRANSITION', 'message' => 'Account is already suspended.']], 422);
        }
        if ($currentStatus === 'archived') {
            return $this->respond(['error' => ['code' => 'INVALID_STATE_TRANSITION', 'message' => 'Archived accounts cannot be directly suspended. Restore first if necessary.']], 422);
        }

        $json = $this->request->getJSON(true) ?? [];
        $reason = trim((string) ($json['reason'] ?? 'Administrative suspension'));

        $db->table('profiles')->where('id', $targetId)->update([
            'status'     => 'suspended',
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        $db->table('account_lifecycle_events')->insert([
            'id'               => $this->genUuid(),
            'profile_id'       => $targetId,
            'actor_profile_id' => $actor['profile']['id'],
            'event_type'       => 'suspended',
            'previous_status'  => $currentStatus,
            'new_status'       => 'suspended',
            'reason'           => $reason,
            'occurred_at'      => date('Y-m-d H:i:s'),
        ]);

        return $this->respond([
            'data' => [
                'message'    => 'Account suspended successfully.',
                'account_id' => $targetId,
                'status'     => 'suspended',
            ],
        ], 200);
    }

    /**
     * POST /api/v1/accounts/{id}/archive
     */
    public function archive(string $targetId)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $db = db_connect();
        $target = $db->table('profiles')->where('id', $targetId)->get()->getRowArray();
        if ($target === null) {
            return $this->respond(['error' => ['code' => 'PROFILE_NOT_FOUND', 'message' => 'Target account not found.']], 404);
        }

        $authErr = $this->checkLifecycleAuthority($actor, $target);
        if ($authErr !== null) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => $authErr]], 403);
        }

        // Validate state transition
        $currentStatus = $target['status'] ?? 'active';
        if ($currentStatus === 'archived') {
            return $this->respond(['error' => ['code' => 'INVALID_STATE_TRANSITION', 'message' => 'Account is already archived.']], 422);
        }

        $json = $this->request->getJSON(true) ?? [];
        $reason = trim((string) ($json['reason'] ?? 'Administrative archive'));

        $db->table('profiles')->where('id', $targetId)->update([
            'status'     => 'archived',
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        $db->table('account_lifecycle_events')->insert([
            'id'               => $this->genUuid(),
            'profile_id'       => $targetId,
            'actor_profile_id' => $actor['profile']['id'],
            'event_type'       => 'archived',
            'previous_status'  => $currentStatus,
            'new_status'       => 'archived',
            'reason'           => $reason,
            'occurred_at'      => date('Y-m-d H:i:s'),
        ]);

        return $this->respond([
            'data' => [
                'message'    => 'Account archived successfully.',
                'account_id' => $targetId,
                'status'     => 'archived',
            ],
        ], 200);
    }

    /**
     * POST /api/v1/accounts/{id}/restore
     */
    public function restore(string $targetId)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $db = db_connect();
        $target = $db->table('profiles')->where('id', $targetId)->get()->getRowArray();
        if ($target === null) {
            return $this->respond(['error' => ['code' => 'PROFILE_NOT_FOUND', 'message' => 'Target account not found.']], 404);
        }

        $authErr = $this->checkLifecycleAuthority($actor, $target);
        if ($authErr !== null) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => $authErr]], 403);
        }

        // Validate state transition
        $currentStatus = $target['status'] ?? 'active';
        if ($currentStatus === 'active') {
            return $this->respond(['error' => ['code' => 'INVALID_STATE_TRANSITION', 'message' => 'Account is already active.']], 422);
        }

        $db->table('profiles')->where('id', $targetId)->update([
            'status'     => 'active',
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        $db->table('account_lifecycle_events')->insert([
            'id'               => $this->genUuid(),
            'profile_id'       => $targetId,
            'actor_profile_id' => $actor['profile']['id'],
            'event_type'       => 'restored',
            'previous_status'  => $currentStatus,
            'new_status'       => 'active',
            'reason'           => sprintf('Restored to active status by %s', $actor['profile']['full_name']),
            'occurred_at'      => date('Y-m-d H:i:s'),
        ]);

        return $this->respond([
            'data' => [
                'message'    => 'Account restored successfully.',
                'account_id' => $targetId,
                'status'     => 'active',
            ],
        ], 200);
    }

    /**
     * GET /api/v1/accounts/{id}/lifecycle
     */
    public function events(string $targetId)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $db = db_connect();
        $target = $db->table('profiles')->where('id', $targetId)->get()->getRowArray();
        if ($target === null) {
            return $this->respond(['error' => ['code' => 'PROFILE_NOT_FOUND', 'message' => 'Target account not found.']], 404);
        }

        $events = $db->table('account_lifecycle_events')
            ->where('profile_id', $targetId)
            ->orderBy('occurred_at', 'DESC')
            ->get()
            ->getResultArray();

        return $this->respond([
            'data' => [
                'account_id' => $targetId,
                'events'     => $events,
            ],
        ], 200);
    }
}
