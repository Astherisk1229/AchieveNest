<?php

namespace App\Controllers\Api;

use App\Services\SupabaseAuthService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class PersonnelRoleController extends Controller
{
    use ResponseTrait;

    public function options()
    {
        return $this->respond(null, 204);
    }

    /**
     * Resolves and verifies authenticated actor, ensuring active status and returning roles.
     */
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

        $roleKeys = array_column($roles, 'role_key');

        return [
            'profile' => $profile,
            'roles'   => $roleKeys,
        ];
    }

    /**
     * GET /api/v1/personnel/roles
     * Lists personnel and their active specialized role assignments.
     */
    public function index()
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond([
                'error' => [
                    'code'    => 'UNAUTHORIZED',
                    'message' => 'Valid authenticated active session required.',
                ],
            ], 401);
        }

        $isHr = in_array('hr_staff', $actor['roles'], true);
        $isOsad = in_array('osad_staff', $actor['roles'], true);

        if (! $isHr && ! $isOsad) {
            return $this->respond([
                'error' => [
                    'code'    => 'FORBIDDEN',
                    'message' => 'Administrative role (hr_staff or osad_staff) required to access role management.',
                ],
            ], 403);
        }

        $db = db_connect();

        $allowedRoleKeys = [];
        if ($isHr) {
            $allowedRoleKeys[] = 'department_secretary';
        }
        if ($isOsad) {
            $allowedRoleKeys[] = 'program_coordinator';
            $allowedRoleKeys[] = 'organization_moderator';
        }

        $assignments = $db->query(
            'SELECT pr.id AS assignment_id, pr.profile_id, pr.scope_type, pr.scope_id, pr.is_active, pr.created_at AS assigned_at,
                    p.institutional_id, p.institutional_email, p.full_name, p.designation,
                    r.role_key, r.display_name AS role_display_name
             FROM public.profile_roles pr
             JOIN public.profiles p ON p.id = pr.profile_id
             JOIN public.roles r ON r.id = pr.role_id
             WHERE pr.is_active = true AND r.role_key IN ?
             ORDER BY p.full_name ASC',
            [$allowedRoleKeys]
        )->getResultArray();

        return $this->respond([
            'data' => [
                'assignments' => $assignments,
            ],
        ], 200);
    }

    /**
     * POST /api/v1/personnel/{id}/roles
     * Assigns a specialized role to a personnel account.
     */
    public function assign(string $targetProfileId)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond([
                'error' => [
                    'code'    => 'UNAUTHORIZED',
                    'message' => 'Valid authenticated active session required.',
                ],
            ], 401);
        }

        $isHr = in_array('hr_staff', $actor['roles'], true);
        $isOsad = in_array('osad_staff', $actor['roles'], true);

        if (! $isHr && ! $isOsad) {
            return $this->respond([
                'error' => [
                    'code'    => 'FORBIDDEN',
                    'message' => 'Administrative role required to assign specialized roles.',
                ],
            ], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $roleKey = trim((string) ($json['role_key'] ?? ''));
        $scopeType = trim((string) ($json['scope_type'] ?? 'university'));
        $scopeId = ! empty($json['scope_id']) ? (string) $json['scope_id'] : null;

        // Check assignment authority per governance rules
        if ($roleKey === 'department_secretary' && ! $isHr) {
            return $this->respond([
                'error' => [
                    'code'    => 'FORBIDDEN_ROLE_ASSIGNMENT',
                    'message' => 'Only HR administrators may assign the department_secretary role.',
                ],
            ], 403);
        }

        if (in_array($roleKey, ['program_coordinator', 'organization_moderator'], true) && ! $isOsad) {
            return $this->respond([
                'error' => [
                    'code'    => 'FORBIDDEN_ROLE_ASSIGNMENT',
                    'message' => 'Only OSAD administrators may assign program_coordinator or organization_moderator roles.',
                ],
            ], 403);
        }

        if (! in_array($roleKey, ['department_secretary', 'program_coordinator', 'organization_moderator'], true)) {
            return $this->respond([
                'error' => [
                    'code'    => 'INVALID_ROLE_KEY',
                    'message' => 'Invalid or unsupported specialized role key.',
                ],
            ], 422);
        }

        $db = db_connect();

        // Validate target profile
        $targetProfile = $db->table('public.profiles')
            ->where('id', $targetProfileId)
            ->get()
            ->getRowArray();

        if ($targetProfile === null) {
            return $this->respond([
                'error' => [
                    'code'    => 'PROFILE_NOT_FOUND',
                    'message' => 'Target profile does not exist.',
                ],
            ], 404);
        }

        if (($targetProfile['account_type'] ?? '') !== 'personnel') {
            return $this->respond([
                'error' => [
                    'code'    => 'INVALID_ACCOUNT_TYPE',
                    'message' => 'Specialized roles can only be assigned to personnel accounts.',
                ],
            ], 422);
        }

        if (($targetProfile['status'] ?? '') !== 'active') {
            return $this->respond([
                'error' => [
                    'code'    => 'INACTIVE_ACCOUNT',
                    'message' => 'Cannot assign roles to an inactive, suspended, or archived account.',
                ],
            ], 422);
        }

        // Validate role exists in catalog
        $roleRecord = $db->table('public.roles')
            ->where('role_key', $roleKey)
            ->get()
            ->getRowArray();

        if ($roleRecord === null) {
            return $this->respond([
                'error' => [
                    'code'    => 'ROLE_NOT_FOUND',
                    'message' => 'Role definition not found in catalog.',
                ],
            ], 404);
        }

        // Validate scope compatibility
        if ($roleKey === 'department_secretary') {
            $scopeType = 'department';
            if ($scopeId === null && ! empty($targetProfile['department_id'])) {
                $scopeId = $targetProfile['department_id'];
            }
            if ($scopeId === null) {
                return $this->respond([
                    'error' => [
                        'code'    => 'MISSING_SCOPE',
                        'message' => 'Department scope_id is required for Department Secretary assignment.',
                    ],
                ], 422);
            }
            $depExists = $db->table('public.departments')->where('id', $scopeId)->countAllResults();
            if ($depExists === 0) {
                return $this->respond([
                    'error' => [
                        'code'    => 'INVALID_SCOPE',
                        'message' => 'Specified department scope does not exist.',
                    ],
                ], 422);
            }
        } elseif ($roleKey === 'program_coordinator') {
            $scopeType = 'degree_program';
            if ($scopeId === null && ! empty($targetProfile['degree_program_id'])) {
                $scopeId = $targetProfile['degree_program_id'];
            }
            if ($scopeId === null) {
                return $this->respond([
                    'error' => [
                        'code'    => 'MISSING_SCOPE',
                        'message' => 'Degree program scope_id is required for Program Coordinator assignment.',
                    ],
                ], 422);
            }
            $progExists = $db->table('public.degree_programs')->where('id', $scopeId)->countAllResults();
            if ($progExists === 0) {
                return $this->respond([
                    'error' => [
                        'code'    => 'INVALID_SCOPE',
                        'message' => 'Specified degree program scope does not exist.',
                    ],
                ], 422);
            }
        }

        // Check if active duplicate assignment already exists
        $existing = $db->table('public.profile_roles')
            ->where('profile_id', $targetProfileId)
            ->where('role_id', $roleRecord['id'])
            ->where('is_active', true)
            ->get()
            ->getRowArray();

        if ($existing !== null) {
            return $this->respond([
                'error' => [
                    'code'    => 'ROLE_ALREADY_ASSIGNED',
                    'message' => 'This personnel profile already holds an active assignment for this role.',
                ],
            ], 409);
        }

        // Insert role assignment
        $db->table('public.profile_roles')->insert([
            'profile_id' => $targetProfileId,
            'role_id'    => $roleRecord['id'],
            'scope_type' => $scopeType,
            'scope_id'   => $scopeId,
            'is_active'  => true,
        ]);

        // Record audit lifecycle event
        $db->table('public.account_lifecycle_events')->insert([
            'profile_id' => $targetProfileId,
            'event_type' => 'role_assigned',
            'reason'     => sprintf(
                'Assigned role %s (scope: %s) by %s',
                $roleKey,
                $scopeType . ($scopeId ? ':' . $scopeId : ''),
                $actor['profile']['full_name']
            ),
        ]);

        return $this->respondCreated([
            'data' => [
                'message'    => 'Role assigned successfully.',
                'profile_id' => $targetProfileId,
                'role_key'   => $roleKey,
                'scope_type' => $scopeType,
                'scope_id'   => $scopeId,
            ],
        ]);
    }

    /**
     * DELETE /api/v1/personnel/{id}/roles/{assignmentId}
     * Soft-revokes an active specialized role assignment.
     */
    public function revoke(string $targetProfileId, string $assignmentId)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond([
                'error' => [
                    'code'    => 'UNAUTHORIZED',
                    'message' => 'Valid authenticated active session required.',
                ],
            ], 401);
        }

        $isHr = in_array('hr_staff', $actor['roles'], true);
        $isOsad = in_array('osad_staff', $actor['roles'], true);

        if (! $isHr && ! $isOsad) {
            return $this->respond([
                'error' => [
                    'code'    => 'FORBIDDEN',
                    'message' => 'Administrative role required to revoke specialized roles.',
                ],
            ], 403);
        }

        $db = db_connect();

        $assignment = $db->query(
            'SELECT pr.id, pr.profile_id, r.role_key
             FROM public.profile_roles pr
             JOIN public.roles r ON r.id = pr.role_id
             WHERE pr.id = ? AND pr.profile_id = ? AND pr.is_active = true',
            [$assignmentId, $targetProfileId]
        )->getRowArray();

        if ($assignment === null) {
            return $this->respond([
                'error' => [
                    'code'    => 'ASSIGNMENT_NOT_FOUND',
                    'message' => 'Active role assignment not found for this personnel.',
                ],
            ], 404);
        }

        $roleKey = $assignment['role_key'];

        // Validate office revocation authority
        if ($roleKey === 'department_secretary' && ! $isHr) {
            return $this->respond([
                'error' => [
                    'code'    => 'FORBIDDEN_ROLE_REVOCATION',
                    'message' => 'Only HR administrators may revoke the department_secretary role.',
                ],
            ], 403);
        }

        if (in_array($roleKey, ['program_coordinator', 'organization_moderator'], true) && ! $isOsad) {
            return $this->respond([
                'error' => [
                    'code'    => 'FORBIDDEN_ROLE_REVOCATION',
                    'message' => 'Only OSAD administrators may revoke program_coordinator or organization_moderator roles.',
                ],
            ], 403);
        }

        // Soft revoke
        $db->table('public.profile_roles')
            ->where('id', $assignmentId)
            ->update([
                'is_active' => false,
            ]);

        // Record lifecycle audit event
        $db->table('public.account_lifecycle_events')->insert([
            'profile_id' => $targetProfileId,
            'event_type' => 'role_revoked',
            'reason'     => sprintf(
                'Revoked role %s by %s',
                $roleKey,
                $actor['profile']['full_name']
            ),
        ]);

        return $this->respond([
            'data' => [
                'message'       => 'Role assignment revoked successfully.',
                'assignment_id' => $assignmentId,
                'profile_id'    => $targetProfileId,
                'role_key'      => $roleKey,
            ],
        ], 200);
    }
}
