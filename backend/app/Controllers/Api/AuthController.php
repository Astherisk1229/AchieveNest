<?php

namespace App\Controllers\Api;

use App\Services\SupabaseAuthService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;

class AuthController extends Controller
{
    use ResponseTrait;

    public function options()
    {
        return $this->respond(null, 204);
    }

    public function me()
    {
        $authorization = $this->request->getHeaderLine('Authorization');
        if ($authorization === '') {
            return $this->respond([
                'error' => [
                    'code' => 'MISSING_BEARER_TOKEN',
                    'message' => 'Authorization header with Bearer token is required.',
                ],
            ], 401);
        }

        if (! preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches)) {
            return $this->respond([
                'error' => [
                    'code' => 'MISSING_BEARER_TOKEN',
                    'message' => 'Authorization header must use the Bearer scheme.',
                ],
            ], 401);
        }

        $token = trim($matches[1]);

        try {
            $claims = (new SupabaseAuthService())->verifyAccessToken($token);
        } catch (\Throwable $e) {
            return $this->respond([
                'error' => [
                    'code' => 'INVALID_ACCESS_TOKEN',
                    'message' => 'The provided access token is invalid or expired.',
                ],
            ], 401);
        }

        $authUserId = (string) ($claims->sub ?? '');
        if ($authUserId === '') {
            return $this->respond([
                'error' => [
                    'code' => 'INVALID_ACCESS_TOKEN',
                    'message' => 'The provided access token does not contain a valid subject.',
                ],
            ], 401);
        }

        $db = db_connect();
        $profile = $db->table('public.profiles')
            ->where('id', $authUserId)
            ->get()
            ->getRowArray();

        if ($profile === null) {
            return $this->respond([
                'error' => [
                    'code' => 'PROFILE_NOT_FOUND',
                    'message' => 'Authenticated user has no application profile yet.',
                ],
            ], 403);
        }

        if (($profile['status'] ?? '') === 'suspended') {
            return $this->respond([
                'error' => [
                    'code' => 'ACCOUNT_SUSPENDED',
                    'message' => 'This account has been suspended. Please contact administrative support.',
                ],
            ], 403);
        }

        if (($profile['status'] ?? '') === 'archived') {
            return $this->respond([
                'error' => [
                    'code' => 'ACCOUNT_ARCHIVED',
                    'message' => 'This account has been archived and cannot access application features.',
                ],
            ], 403);
        }

        $roles = $db->query(
            'SELECT r.role_key, r.display_name, r.description
             FROM public.profile_roles pr
             JOIN public.roles r ON r.id = pr.role_id
             WHERE pr.profile_id = ? AND pr.is_active = true',
            [$authUserId]
        )->getResultArray();

        $mappedRoles = array_map(static fn (array $role): array => [
            'role_key' => $role['role_key'],
            'display_name' => $role['display_name'],
            'description' => $role['description'] ?? null,
        ], $roles);

        return $this->respond([
            'data' => [
                'authenticated' => true,
                'user' => [
                    'id' => $profile['id'],
                    'institutional_id' => $profile['institutional_id'],
                    'institutional_email' => $profile['institutional_email'],
                    'full_name' => $profile['full_name'],
                    'account_type' => $profile['account_type'],
                    'status' => $profile['status'],
                    'department_id' => $profile['department_id'],
                    'degree_program_id' => $profile['degree_program_id'],
                    'designation' => $profile['designation'],
                    'year_level' => $profile['year_level'],
                    'must_change_password' => (bool) ($profile['must_change_password'] ?? false),
                    'roles' => $mappedRoles,
                ],
            ],
        ], 200);
    }

    /**
     * POST /api/v1/auth/change-password
     * Allows an authenticated user to change their password and clears must_change_password flag.
     */
    public function changePassword()
    {
        $authorization = $this->request->getHeaderLine('Authorization');
        if ($authorization === '') {
            return $this->respond([
                'error' => [
                    'code' => 'MISSING_BEARER_TOKEN',
                    'message' => 'Authorization header with Bearer token is required.',
                ],
            ], 401);
        }

        if (! preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches)) {
            return $this->respond([
                'error' => [
                    'code' => 'MISSING_BEARER_TOKEN',
                    'message' => 'Authorization header must use the Bearer scheme.',
                ],
            ], 401);
        }

        $token = trim($matches[1]);

        try {
            $claims = (new SupabaseAuthService())->verifyAccessToken($token);
        } catch (\Throwable $e) {
            return $this->respond([
                'error' => [
                    'code' => 'INVALID_ACCESS_TOKEN',
                    'message' => 'The provided access token is invalid or expired.',
                ],
            ], 401);
        }

        $authUserId = (string) ($claims->sub ?? '');
        if ($authUserId === '') {
            return $this->respond([
                'error' => [
                    'code' => 'INVALID_ACCESS_TOKEN',
                    'message' => 'The provided access token does not contain a valid subject.',
                ],
            ], 401);
        }

        $db = db_connect();
        $profile = $db->table('public.profiles')->where('id', $authUserId)->get()->getRowArray();
        if ($profile === null) {
            return $this->respond([
                'error' => [
                    'code' => 'PROFILE_NOT_FOUND',
                    'message' => 'User profile not found.',
                ],
            ], 404);
        }

        $json = $this->request->getJSON(true) ?? [];
        $newPassword = (string) ($json['new_password'] ?? '');
        $confirmPassword = (string) ($json['confirm_password'] ?? '');

        if (strlen($newPassword) < 8) {
            return $this->respond([
                'error' => [
                    'code' => 'INVALID_PASSWORD_LENGTH',
                    'message' => 'New password must be at least 8 characters long.',
                ],
            ], 422);
        }

        if ($confirmPassword !== '' && $newPassword !== $confirmPassword) {
            return $this->respond([
                'error' => [
                    'code' => 'PASSWORD_MISMATCH',
                    'message' => 'New password and confirmation do not match.',
                ],
            ], 422);
        }

        try {
            (new \App\Services\SupabaseAdminAuthService())->updateUserPassword($authUserId, $newPassword);
        } catch (\Throwable $e) {
            return $this->respond([
                'error' => [
                    'code' => 'PASSWORD_UPDATE_FAILED',
                    'message' => 'Failed to update password: ' . $e->getMessage(),
                ],
            ], 500);
        }

        $db->table('public.profiles')->where('id', $authUserId)->update([
            'must_change_password' => false,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        $db->table('public.password_reset_events')->insert([
            'actor_user_id'  => $authUserId,
            'target_user_id' => $authUserId,
            'action'         => 'mandatory_password_change_completed',
            'metadata'       => json_encode(['ip_address' => $this->request->getIPAddress()]),
            'occurred_at'    => date('Y-m-d H:i:s'),
        ]);

        return $this->respond([
            'data' => [
                'message' => 'Password has been updated successfully.',
                'must_change_password' => false,
            ],
        ], 200);
    }
}

