<?php

namespace App\Services;

use Throwable;

class AuthenticatedActorService
{
    protected SupabaseAuthService $authService;

    public function __construct(?SupabaseAuthService $authService = null)
    {
        $this->authService = $authService ?? new SupabaseAuthService();
    }

    /**
     * Resolves the authenticated actor from Authorization Bearer header.
     * Checks token validity, profile existence, active status, and active roles.
     *
     * @param string|null $authorizationHeader
     * @return array|null Returns actor array with 'profile', 'roles', 'scopes', and 'claims' or null if unauthorized/inactive.
     */
    public function resolveActor(?string $authorizationHeader = null): ?array
    {
        $header = trim((string) $authorizationHeader);
        if ($header === '' || ! preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
            return null;
        }

        $token = trim($matches[1]);

        try {
            $claims = $this->authService->verifyAccessToken($token);
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

        $roleRows = $db->query(
            'SELECT r.role_key, r.display_name, pr.id AS assignment_id, pr.scope_type, pr.scope_id
             FROM public.profile_roles pr
             JOIN public.roles r ON r.id = pr.role_id
             WHERE pr.profile_id = ? AND pr.is_active = true',
            [$authUserId]
        )->getResultArray();

        $roles = array_column($roleRows, 'role_key');

        return [
            'profile' => $profile,
            'roles'   => $roles,
            'scopes'  => $roleRows,
            'claims'  => $claims,
        ];
    }
}
