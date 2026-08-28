<?php

namespace App\Controllers\Api;

use App\Services\AuthenticatedActorService;
use App\Services\LocalAuthService;
use App\Services\LocalTokenService;
use App\Services\SupabaseAdminAuthService;
use App\Services\SupabaseAuthService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class AuthController extends Controller
{
    use ResponseTrait;

    protected AuthenticatedActorService $actorService;
    protected LocalAuthService $localAuthService;
    protected LocalTokenService $localTokenService;
    protected bool $isLocalDefense;

    public function __construct()
    {
        $this->actorService = new AuthenticatedActorService();
        $this->localAuthService = new LocalAuthService();
        $this->localTokenService = new LocalTokenService();
        $this->isLocalDefense = (env('AUTH_MODE') === 'local-defense' || env('ACHIEVENEST_ENV') === 'local-defense');
    }

    public function options()
    {
        return $this->respond(null, 204);
    }

    /**
     * POST /api/v1/auth/login
     */
    public function login()
    {
        $json = $this->request->getJSON(true) ?? [];
        $email = (string) ($json['institutional_email'] ?? ($json['email'] ?? ''));
        $password = (string) ($json['password'] ?? '');
        $rememberMe = (bool) ($json['remember_me'] ?? false);
        $ip = $this->request->getIPAddress();
        $userAgent = $this->request->getUserAgent()->getAgentString();

        if ($this->isLocalDefense) {
            $result = $this->localAuthService->login($email, $password, $rememberMe, $ip, $userAgent);
            if (! $result['success']) {
                return $this->respond(['error' => $result['error']], $result['status']);
            }

            return $this->respond(['data' => $result['data']], 200);
        }

        // Hosted mode login fallback or delegation
        return $this->respond([
            'error' => [
                'code'    => 'HOSTED_AUTH_DELEGATED',
                'message' => 'In hosted mode, authentication is mediated directly by Supabase Auth.',
            ],
        ], 400);
    }

    /**
     * GET /api/v1/auth/me
     */
    public function me()
    {
        $authorization = $this->request->getHeaderLine('Authorization');
        if ($authorization === '') {
            return $this->respond([
                'error' => [
                    'code'    => 'MISSING_BEARER_TOKEN',
                    'message' => 'Authorization header with Bearer token is required.',
                ],
            ], 401);
        }

        if (! preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches)) {
            return $this->respond([
                'error' => [
                    'code'    => 'MISSING_BEARER_TOKEN',
                    'message' => 'Authorization header must use the Bearer scheme.',
                ],
            ], 401);
        }

        $actor = $this->actorService->resolveActor($authorization);
        if ($actor === null) {
            return $this->respond([
                'error' => [
                    'code'    => 'INVALID_ACCESS_TOKEN',
                    'message' => 'The provided access token is invalid, expired, or revoked.',
                ],
            ], 401);
        }

        $profile = $actor['profile'];
        $authUserId = $profile['id'];

        if (($profile['status'] ?? '') === 'suspended') {
            return $this->respond([
                'error' => [
                    'code'    => 'ACCOUNT_SUSPENDED',
                    'message' => 'This account has been suspended. Please contact administrative support.',
                ],
            ], 403);
        }

        if (($profile['status'] ?? '') === 'archived') {
            return $this->respond([
                'error' => [
                    'code'    => 'ACCOUNT_ARCHIVED',
                    'message' => 'This account has been archived and cannot access application features.',
                ],
            ], 403);
        }

        $assignments = $actor['assignments'] ?? [];
        $mappedRoles = array_map(static fn (array $assignment): array => [
            'role_key'      => $assignment['role_key'],
            'display_name'  => $assignment['display_name'] ?? $assignment['role_key'],
            'assignment_id' => $assignment['assignment_id'] ?? null,
            'scope_type'    => $assignment['scope_type'] ?? null,
            'scope_id'      => $assignment['scope_id'] ?? null,
            'scope_code'    => $assignment['scope_code'] ?? null,
            'scope_name'    => $assignment['scope_name'] ?? null,
        ], $assignments);

        $db = db_connect();
        $studentPlacement = null;
        $personnelAffiliation = null;
        $programAffiliations = [];

        if (($profile['account_type'] ?? '') === 'student') {
            $studentPlacement = $db->query(
                "SELECT e.academic_program_id, ap.code AS academic_program_code,
                        ap.name AS academic_program_name, ap.college_id,
                        c.code AS college_code, c.name AS college_name,
                        e.year_level, e.academic_year
                 FROM student_program_enrollments e
                 JOIN academic_programs ap ON ap.id = e.academic_program_id
                 JOIN colleges c ON c.id = ap.college_id
                 WHERE e.student_profile_id = ? AND e.is_active = 1
                 LIMIT 1",
                [$authUserId]
            )->getRowArray();
        }

        if (($profile['account_type'] ?? '') === 'personnel') {
            $personnelAffiliation = $db->query(
                "SELECT pp.personnel_classification,
                        pca.college_id, c.code AS college_code, c.name AS college_name,
                        pau.administrative_unit_id,
                        au.code AS administrative_unit_code,
                        au.name AS administrative_unit_name
                 FROM personnel_profiles pp
                 LEFT JOIN personnel_college_affiliations pca
                    ON pca.personnel_profile_id = pp.profile_id AND pca.is_active = 1
                 LEFT JOIN colleges c ON c.id = pca.college_id
                 LEFT JOIN personnel_administrative_unit_affiliations pau
                    ON pau.personnel_profile_id = pp.profile_id AND pau.is_active = 1
                 LEFT JOIN administrative_units au ON au.id = pau.administrative_unit_id
                 WHERE pp.profile_id = ?
                 LIMIT 1",
                [$authUserId]
            )->getRowArray();

            $programAffiliations = $db->query(
                "SELECT ppa.academic_program_id, ap.code AS academic_program_code,
                        ap.name AS academic_program_name, ap.college_id
                 FROM personnel_program_affiliations ppa
                 JOIN academic_programs ap ON ap.id = ppa.academic_program_id
                 WHERE ppa.personnel_profile_id = ? AND ppa.is_active = 1
                 ORDER BY ap.code",
                [$authUserId]
            )->getResultArray();
        }

        $primaryProgramId = $studentPlacement['academic_program_id']
            ?? ($programAffiliations[0]['academic_program_id'] ?? null);

        return $this->respond([
            'data' => [
                'authenticated' => true,
                'user'          => [
                    'id'                    => $profile['id'],
                    'institutional_id'      => $profile['institutional_id'],
                    'institutional_email'   => $profile['email'] ?? ($profile['institutional_email'] ?? ''),
                    'full_name'             => $profile['full_name'],
                    'account_type'          => $profile['account_type'],
                    'status'                => $profile['status'],
                    'designation'           => $profile['designation'] ?? null,
                    'year_level'            => $studentPlacement['year_level'] ?? ($profile['year_level'] ?? null),
                    'must_change_password'  => (bool) ($profile['must_change_password'] ?? false),
                    'academic_placement'    => $studentPlacement,
                    'personnel_affiliation' => $personnelAffiliation,
                    'program_affiliations'  => $programAffiliations,
                    'roles'                 => array_values(array_unique(array_column($mappedRoles, 'role_key'))),
                    'role_assignments'      => $mappedRoles,
                    // Compatibility aliases
                    'department_id'         => null,
                    'degree_program_id'     => $primaryProgramId,
                ],
            ],
        ], 200);
    }

    /**
     * POST /api/v1/auth/logout
     */
    public function logout()
    {
        $authorization = $this->request->getHeaderLine('Authorization');
        if ($authorization !== '' && preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches)) {
            $token = trim($matches[1]);
            if ($this->isLocalDefense) {
                $this->localTokenService->revokeSession($token, 'logout');
            }
        }

        return $this->respond([
            'data' => [
                'message' => 'Logged out successfully.',
            ],
        ], 200);
    }

    /**
     * POST /api/v1/auth/change-password
     */
    public function changePassword()
    {
        $authorization = $this->request->getHeaderLine('Authorization');
        if ($authorization === '') {
            return $this->respond([
                'error' => [
                    'code'    => 'MISSING_BEARER_TOKEN',
                    'message' => 'Authorization header with Bearer token is required.',
                ],
            ], 401);
        }

        $actor = $this->actorService->resolveActor($authorization);
        if ($actor === null) {
            return $this->respond([
                'error' => [
                    'code'    => 'INVALID_ACCESS_TOKEN',
                    'message' => 'The provided access token is invalid, expired, or revoked.',
                ],
            ], 401);
        }

        $profile = $actor['profile'];
        $authUserId = $profile['id'];

        $json = $this->request->getJSON(true) ?? [];
        $newPassword = (string) ($json['new_password'] ?? '');
        $confirmPassword = (string) ($json['confirm_password'] ?? '');
        $ip = $this->request->getIPAddress();

        if (strlen($newPassword) < 8) {
            return $this->respond([
                'error' => [
                    'code'    => 'INVALID_PASSWORD_LENGTH',
                    'message' => 'New password must be at least 8 characters long.',
                ],
            ], 422);
        }

        if ($confirmPassword !== '' && $newPassword !== $confirmPassword) {
            return $this->respond([
                'error' => [
                    'code'    => 'PASSWORD_MISMATCH',
                    'message' => 'New password and confirmation do not match.',
                ],
            ], 422);
        }

        if ($this->isLocalDefense) {
            $result = $this->localAuthService->changePassword($authUserId, $newPassword, $ip);
            if (! $result['success']) {
                return $this->respond(['error' => $result['error']], $result['status']);
            }

            return $this->respond(['data' => $result['data']], 200);
        }

        // Hosted Supabase password update
        try {
            (new SupabaseAdminAuthService())->updateUserPassword($authUserId, $newPassword);
        } catch (Throwable $e) {
            return $this->respond([
                'error' => [
                    'code'    => 'PASSWORD_UPDATE_FAILED',
                    'message' => 'Failed to update password: ' . $e->getMessage(),
                ],
            ], 500);
        }

        $db = db_connect();
        $db->table('profiles')->where('id', $authUserId)->update([
            'must_change_password' => 0,
            'updated_at'           => date('Y-m-d H:i:s'),
        ]);

        $db->table('password_reset_events')->insert([
            'actor_user_id'  => $authUserId,
            'target_user_id' => $authUserId,
            'action'         => 'mandatory_password_change_completed',
            'metadata'       => json_encode(['ip_address' => $ip]),
            'occurred_at'    => date('Y-m-d H:i:s'),
        ]);

        return $this->respond([
            'data' => [
                'message'              => 'Password has been updated successfully.',
                'must_change_password' => false,
            ],
        ], 200);
    }
}
