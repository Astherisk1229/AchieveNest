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
                    'roles' => $mappedRoles,
                ],
            ],
        ], 200);
    }
}
