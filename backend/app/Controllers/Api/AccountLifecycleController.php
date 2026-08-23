<?php

namespace App\Controllers\Api;

use App\Services\SupabaseAuthService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class AccountLifecycleController extends Controller
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
     * Helper to validate authority over target profile (HR Admin manages personnel, OSAD Admin manages students).
     */
    protected function checkLifecycleAuthority(array $actor, array $target): ?string
    {
        $isHrAdmin = (($actor['profile']['account_type'] ?? '') === 'hr_admin' && in_array('hr_staff', $actor['roles'], true));
        $isOsadAdmin = (($actor['profile']['account_type'] ?? '') === 'osad_admin' && in_array('osad_staff', $actor['roles'], true));

        if (in_array($target['account_type'], ['hr_admin', 'osad_admin'], true)) {
            return 'Top-level administrative accounts cannot be modified through standard lifecycle endpoints.';
        }

        if ($target['account_type'] === 'personnel' && ! $isHrAdmin) {
            return 'Only dedicated HR administrators (hr_admin) may manage personnel account lifecycles.';
        }

        if ($target['account_type'] === 'student' && ! $isOsadAdmin) {
            return 'Only dedicated OSAD administrators (osad_admin) may manage student account lifecycles.';
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
        $target = $db->table('public.profiles')->where('id', $targetId)->get()->getRowArray();
        if ($target === null) {
            return $this->respond(['error' => ['code' => 'PROFILE_NOT_FOUND', 'message' => 'Target account not found.']], 404);
        }

        $authErr = $this->checkLifecycleAuthority($actor, $target);
        if ($authErr !== null) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => $authErr]], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $reason = trim((string) ($json['reason'] ?? 'Administrative suspension'));

        $db->table('public.profiles')->where('id', $targetId)->update([
            'status'            => 'suspended',
            'suspended_at'      => date('Y-m-d H:i:s'),
            'suspended_by'      => $actor['profile']['id'],
            'suspension_reason' => $reason,
        ]);

        $db->table('public.account_lifecycle_events')->insert([
            'profile_id'   => $targetId,
            'event_type'   => 'suspended',
            'performed_by' => $actor['profile']['id'],
            'reason'       => $reason,
            'occurred_at'  => date('Y-m-d H:i:s'),
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
        $target = $db->table('public.profiles')->where('id', $targetId)->get()->getRowArray();
        if ($target === null) {
            return $this->respond(['error' => ['code' => 'PROFILE_NOT_FOUND', 'message' => 'Target account not found.']], 404);
        }

        $authErr = $this->checkLifecycleAuthority($actor, $target);
        if ($authErr !== null) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => $authErr]], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $reason = trim((string) ($json['reason'] ?? 'Administrative archive'));

        $db->table('public.profiles')->where('id', $targetId)->update([
            'status'         => 'archived',
            'archived_at'    => date('Y-m-d H:i:s'),
            'archived_by'    => $actor['profile']['id'],
            'archive_reason' => $reason,
        ]);

        $db->table('public.account_lifecycle_events')->insert([
            'profile_id'   => $targetId,
            'event_type'   => 'archived',
            'performed_by' => $actor['profile']['id'],
            'reason'       => $reason,
            'occurred_at'  => date('Y-m-d H:i:s'),
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
        $target = $db->table('public.profiles')->where('id', $targetId)->get()->getRowArray();
        if ($target === null) {
            return $this->respond(['error' => ['code' => 'PROFILE_NOT_FOUND', 'message' => 'Target account not found.']], 404);
        }

        $authErr = $this->checkLifecycleAuthority($actor, $target);
        if ($authErr !== null) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => $authErr]], 403);
        }

        $db->table('public.profiles')->where('id', $targetId)->update([
            'status'            => 'active',
            'suspended_at'      => null,
            'suspended_by'      => null,
            'suspension_reason' => null,
            'archived_at'       => null,
            'archived_by'       => null,
            'archive_reason'    => null,
            'restored_at'       => date('Y-m-d H:i:s'),
            'restored_by'       => $actor['profile']['id'],
        ]);

        $db->table('public.account_lifecycle_events')->insert([
            'profile_id'   => $targetId,
            'event_type'   => 'restored',
            'performed_by' => $actor['profile']['id'],
            'reason'       => sprintf('Restored to active status by %s', $actor['profile']['full_name']),
            'occurred_at'  => date('Y-m-d H:i:s'),
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
        $target = $db->table('public.profiles')->where('id', $targetId)->get()->getRowArray();
        if ($target === null) {
            return $this->respond(['error' => ['code' => 'PROFILE_NOT_FOUND', 'message' => 'Target account not found.']], 404);
        }

        $events = $db->table('public.account_lifecycle_events')
            ->where('profile_id', $targetId)
            ->orderBy('created_at', 'DESC')
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
