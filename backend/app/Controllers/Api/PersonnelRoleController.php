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

        $isHr = (($actor['profile']['account_type'] ?? '') === 'hr_admin' && in_array('hr_staff', $actor['roles'], true));
        $isOsad = (($actor['profile']['account_type'] ?? '') === 'osad_admin' && in_array('osad_staff', $actor['roles'], true));

        if (! $isHr && ! $isOsad) {
            return $this->respond([
                'error' => [
                    'code'    => 'FORBIDDEN',
                    'message' => 'Dedicated administrative account (hr_admin with hr_staff or osad_admin with osad_staff) required.',
                ],
            ], 403);
        }

        $db = db_connect();

        $allowedRoleKeys = [];
        if ($isHr) {
            $allowedRoleKeys[] = 'dean';
        }
        if ($isOsad) {
            $allowedRoleKeys[] = 'program_coordinator';
            $allowedRoleKeys[] = 'organization_moderator';
        }

        $assignments = $db->query(
            'SELECT pr.id AS assignment_id, pr.profile_id, pr.scope_type, pr.scope_id, pr.is_active, pr.assigned_at, pr.assigned_by,
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

        $isHr = (($actor['profile']['account_type'] ?? '') === 'hr_admin' && in_array('hr_staff', $actor['roles'], true));
        $isOsad = (($actor['profile']['account_type'] ?? '') === 'osad_admin' && in_array('osad_staff', $actor['roles'], true));

        if (! $isHr && ! $isOsad) {
            return $this->respond([
                'error' => [
                    'code'    => 'FORBIDDEN',
                    'message' => 'Dedicated administrative account required to assign specialized roles.',
                ],
            ], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $roleKey = trim((string) ($json['role_key'] ?? ''));
        $scopeType = trim((string) ($json['scope_type'] ?? 'university'));
        $scopeId = ! empty($json['scope_id']) ? (string) $json['scope_id'] : null;
        $reason = trim((string) ($json['reason'] ?? 'Specialized role appointment'));

        // Check assignment authority per governance rules
        if ($roleKey === 'dean' && ! $isHr) {
            return $this->respond([
                'error' => [
                    'code'    => 'FORBIDDEN_ROLE_ASSIGNMENT',
                    'message' => 'Only HR administrators may assign the dean role.',
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

        if (! in_array($roleKey, ['dean', 'program_coordinator', 'organization_moderator'], true)) {
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
        if ($roleKey === 'dean') {
            $scopeType = 'college';
            if ($scopeId === null) {
                return $this->respond([
                    'error' => [
                        'code'    => 'MISSING_SCOPE',
                        'message' => 'College scope_id is required for Dean assignment.',
                    ],
                ], 422);
            }
            $collegeExists = $db->table('public.colleges')->where('id', $scopeId)->countAllResults();
            if ($collegeExists === 0) {
                return $this->respond([
                    'error' => [
                        'code'    => 'INVALID_SCOPE',
                        'message' => 'Specified college scope does not exist.',
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
        } elseif ($roleKey === 'organization_moderator') {
            $scopeType = 'organization';
            if ($scopeId === null) {
                return $this->respond([
                    'error' => [
                        'code'    => 'MISSING_SCOPE',
                        'message' => 'Organization scope_id is required for Organization Moderator assignment.',
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

        $profileRoleId = (string) service('uuid')->uuid4();

        $db->transBegin();
        try {
            // Insert role assignment
            $db->table('public.profile_roles')->insert([
                'id'          => $profileRoleId,
                'profile_id'  => $targetProfileId,
                'role_id'     => $roleRecord['id'],
                'scope_type'  => $scopeType,
                'scope_id'    => $scopeId,
                'is_active'   => true,
                'assigned_by' => $actor['profile']['id'],
                'assigned_at' => date('Y-m-d H:i:s'),
                'revoked_at'  => null,
            ]);

            // Record audit in role_assignment_events
            $db->table('public.role_assignment_events')->insert([
                'id'                => (string) service('uuid')->uuid4(),
                'profile_role_id'   => $profileRoleId,
                'target_profile_id' => $targetProfileId,
                'role_id'           => $roleRecord['id'],
                'event_type'        => 'assigned',
                'scope_type'        => $scopeType,
                'scope_id'          => $scopeId,
                'performed_by'      => $actor['profile']['id'],
                'reason'            => $reason,
                'occurred_at'       => date('Y-m-d H:i:s'),
            ]);

            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->respond([
                'error' => [
                    'code'    => 'ASSIGNMENT_FAILED',
                    'message' => 'Failed to record role assignment: ' . $e->getMessage(),
                ],
            ], 500);
        }

        return $this->respondCreated([
            'data' => [
                'message'       => 'Role assigned successfully.',
                'assignment_id' => $profileRoleId,
                'profile_id'    => $targetProfileId,
                'role_key'      => $roleKey,
                'scope_type'    => $scopeType,
                'scope_id'      => $scopeId,
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

        $isHr = (($actor['profile']['account_type'] ?? '') === 'hr_admin' && in_array('hr_staff', $actor['roles'], true));
        $isOsad = (($actor['profile']['account_type'] ?? '') === 'osad_admin' && in_array('osad_staff', $actor['roles'], true));

        if (! $isHr && ! $isOsad) {
            return $this->respond([
                'error' => [
                    'code'    => 'FORBIDDEN',
                    'message' => 'Dedicated administrative account required to revoke specialized roles.',
                ],
            ], 403);
        }

        $db = db_connect();

        $assignment = $db->query(
            'SELECT pr.id, pr.profile_id, pr.role_id, pr.scope_type, pr.scope_id, r.role_key
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
        if ($roleKey === 'dean' && ! $isHr) {
            return $this->respond([
                'error' => [
                    'code'    => 'FORBIDDEN_ROLE_REVOCATION',
                    'message' => 'Only HR administrators may revoke the dean role.',
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

        $json = $this->request->getJSON(true) ?? [];
        $reason = trim((string) ($json['reason'] ?? 'Specialized role revocation'));

        $db->transBegin();
        try {
            // Soft revoke
            $db->table('public.profile_roles')
                ->where('id', $assignmentId)
                ->update([
                    'is_active'  => false,
                    'revoked_at' => date('Y-m-d H:i:s'),
                ]);

            // Record audit in role_assignment_events
            $db->table('public.role_assignment_events')->insert([
                'id'                => (string) service('uuid')->uuid4(),
                'profile_role_id'   => $assignmentId,
                'target_profile_id' => $targetProfileId,
                'role_id'           => $assignment['role_id'],
                'event_type'        => 'revoked',
                'scope_type'        => $assignment['scope_type'],
                'scope_id'          => $assignment['scope_id'],
                'performed_by'      => $actor['profile']['id'],
                'reason'            => $reason,
                'occurred_at'       => date('Y-m-d H:i:s'),
            ]);

            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->respond([
                'error' => [
                    'code'    => 'REVOCATION_FAILED',
                    'message' => 'Failed to revoke role assignment: ' . $e->getMessage(),
                ],
            ], 500);
        }

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
