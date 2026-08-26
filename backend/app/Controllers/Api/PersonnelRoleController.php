<?php

namespace App\Controllers\Api;

use App\Services\AuthenticatedActorService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class PersonnelRoleController extends Controller
{
    use ResponseTrait;

    protected AuthenticatedActorService $actorService;

    public function __construct(?AuthenticatedActorService $actorService = null)
    {
        $this->actorService = $actorService ?? new AuthenticatedActorService();
    }

    public function options()
    {
        return $this->respond(null, 204);
    }

    protected function resolveActor(): ?array
    {
        return $this->actorService->resolveActor($this->request->getHeaderLine('Authorization'));
    }

    /**
     * GET /api/v1/personnel/roles
     * HR sees Dean assignments. OSAD sees Program Coordinator and Organization Moderator assignments.
     */
    public function index()
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated active session required.']], 401);
        }

        $isHr = (($actor['profile']['account_type'] ?? '') === 'hr_admin' && in_array('hr_staff', $actor['roles'], true));
        $isOsad = (($actor['profile']['account_type'] ?? '') === 'osad_admin' && in_array('osad_staff', $actor['roles'], true));

        if (! $isHr && ! $isOsad) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Dedicated HR or OSAD administrator required.']], 403);
        }

        $db = db_connect();
        $assignments = [];

        if ($isHr) {
            $assignments = array_merge($assignments, $db->query(
                "SELECT da.id AS assignment_id, da.personnel_profile_id AS profile_id,
                        'dean'::text AS role_key, 'Dean'::text AS role_display_name,
                        'college'::text AS scope_type, da.college_id AS scope_id,
                        c.code AS scope_code, c.name AS scope_name,
                        da.is_active, da.assigned_at, da.assigned_by,
                        p.institutional_id, p.institutional_email, p.full_name, p.designation
                 FROM public.dean_assignments da
                 JOIN public.profiles p ON p.id = da.personnel_profile_id
                 JOIN public.colleges c ON c.id = da.college_id
                 WHERE da.is_active = true
                 ORDER BY p.full_name"
            )->getResultArray());
        }

        if ($isOsad) {
            $assignments = array_merge($assignments, $db->query(
                "SELECT pca.id AS assignment_id, pca.personnel_profile_id AS profile_id,
                        'program_coordinator'::text AS role_key,
                        'Program Coordinator'::text AS role_display_name,
                        'academic_program'::text AS scope_type,
                        pca.academic_program_id AS scope_id,
                        ap.code AS scope_code, ap.name AS scope_name,
                        pca.is_active, pca.assigned_at, pca.assigned_by,
                        p.institutional_id, p.institutional_email, p.full_name, p.designation
                 FROM public.program_coordinator_assignments pca
                 JOIN public.profiles p ON p.id = pca.personnel_profile_id
                 JOIN public.academic_programs ap ON ap.id = pca.academic_program_id
                 WHERE pca.is_active = true
                 ORDER BY p.full_name"
            )->getResultArray());

            $assignments = array_merge($assignments, $db->query(
                "SELECT oma.id AS assignment_id, oma.personnel_profile_id AS profile_id,
                        'organization_moderator'::text AS role_key,
                        'Organization Moderator'::text AS role_display_name,
                        'organization'::text AS scope_type,
                        oma.organization_id AS scope_id,
                        o.code AS scope_code, o.name AS scope_name,
                        oma.is_active, oma.assigned_at, oma.assigned_by,
                        p.institutional_id, p.institutional_email, p.full_name, p.designation
                 FROM public.organization_moderator_assignments oma
                 JOIN public.profiles p ON p.id = oma.personnel_profile_id
                 JOIN public.organizations o ON o.id = oma.organization_id
                 WHERE oma.is_active = true
                 ORDER BY p.full_name"
            )->getResultArray());
        }

        return $this->respond(['data' => ['assignments' => $assignments]], 200);
    }

    /**
     * POST /api/v1/personnel/{id}/roles
     * Body: role_key + one of college_id / academic_program_id / organization_id.
     * scope_id remains accepted temporarily as a compatibility alias only.
     */
    public function assign(string $targetProfileId)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated active session required.']], 401);
        }

        $isHr = (($actor['profile']['account_type'] ?? '') === 'hr_admin' && in_array('hr_staff', $actor['roles'], true));
        $isOsad = (($actor['profile']['account_type'] ?? '') === 'osad_admin' && in_array('osad_staff', $actor['roles'], true));

        $json = $this->request->getJSON(true) ?? [];
        $roleKey = trim((string) ($json['role_key'] ?? ''));
        $compatScopeId = ! empty($json['scope_id']) ? (string) $json['scope_id'] : null;
        $reason = trim((string) ($json['reason'] ?? 'Specialized role appointment'));

        if ($roleKey === 'dean' && ! $isHr) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN_ROLE_ASSIGNMENT', 'message' => 'Only HR may assign Dean.']], 403);
        }
        if (in_array($roleKey, ['program_coordinator', 'organization_moderator'], true) && ! $isOsad) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN_ROLE_ASSIGNMENT', 'message' => 'Only OSAD may assign Program Coordinator or Organization Moderator.']], 403);
        }
        if (! in_array($roleKey, ['dean', 'program_coordinator', 'organization_moderator'], true)) {
            return $this->respond(['error' => ['code' => 'INVALID_ROLE_KEY', 'message' => 'Unsupported specialized role.']], 422);
        }

        $db = db_connect();
        $target = $db->query(
            "SELECT p.id, p.account_type, p.status, pp.personnel_classification
             FROM public.profiles p
             JOIN public.personnel_profiles pp ON pp.profile_id = p.id
             WHERE p.id = ?",
            [$targetProfileId]
        )->getRowArray();

        if ($target === null) {
            return $this->respond(['error' => ['code' => 'PROFILE_NOT_FOUND', 'message' => 'Personnel profile does not exist in the target personnel model.']], 404);
        }
        if (($target['account_type'] ?? '') !== 'personnel' || ($target['status'] ?? '') !== 'active') {
            return $this->respond(['error' => ['code' => 'INVALID_PERSONNEL_STATE', 'message' => 'Specialized roles require an active Personnel account.']], 422);
        }

        try {
            if ($roleKey === 'dean') {
                $scopeId = ! empty($json['college_id']) ? (string) $json['college_id'] : $compatScopeId;
                if ($scopeId === null) {
                    return $this->respond(['error' => ['code' => 'MISSING_COLLEGE', 'message' => 'college_id is required for Dean assignment.']], 422);
                }

                $eligible = $db->query(
                    "SELECT 1 FROM public.personnel_college_affiliations
                     WHERE personnel_profile_id = ? AND college_id = ? AND is_active = true",
                    [$targetProfileId, $scopeId]
                )->getRowArray();
                if ($eligible === null) {
                    return $this->respond(['error' => ['code' => 'INELIGIBLE_DEAN_AFFILIATION', 'message' => 'Personnel must have an active affiliation to the same College.']], 422);
                }

                $assignmentId = (string) service('uuid')->uuid4();
                $db->table('public.dean_assignments')->insert([
                    'id' => $assignmentId,
                    'personnel_profile_id' => $targetProfileId,
                    'college_id' => $scopeId,
                    'effective_from' => date('Y-m-d'),
                    'is_active' => true,
                    'assigned_by' => $actor['profile']['id'],
                    'assigned_at' => date('Y-m-d H:i:s'),
                ]);

                return $this->respondCreated(['data' => [
                    'message' => 'Dean assignment created.',
                    'assignment_id' => $assignmentId,
                    'profile_id' => $targetProfileId,
                    'role_key' => $roleKey,
                    'scope_type' => 'college',
                    'scope_id' => $scopeId,
                ]]);
            }

            if ($roleKey === 'program_coordinator') {
                $scopeId = ! empty($json['academic_program_id']) ? (string) $json['academic_program_id'] : $compatScopeId;
                if ($scopeId === null) {
                    return $this->respond(['error' => ['code' => 'MISSING_ACADEMIC_PROGRAM', 'message' => 'academic_program_id is required for Program Coordinator assignment.']], 422);
                }

                $eligible = $db->query(
                    "SELECT 1 FROM public.personnel_program_affiliations
                     WHERE personnel_profile_id = ? AND academic_program_id = ? AND is_active = true",
                    [$targetProfileId, $scopeId]
                )->getRowArray();
                if ($eligible === null) {
                    return $this->respond(['error' => ['code' => 'INELIGIBLE_PROGRAM_AFFILIATION', 'message' => 'Personnel must have an active affiliation to the exact Academic Program.']], 422);
                }

                $assignmentId = (string) service('uuid')->uuid4();
                $db->table('public.program_coordinator_assignments')->insert([
                    'id' => $assignmentId,
                    'personnel_profile_id' => $targetProfileId,
                    'academic_program_id' => $scopeId,
                    'effective_from' => date('Y-m-d'),
                    'is_active' => true,
                    'assigned_by' => $actor['profile']['id'],
                    'assigned_at' => date('Y-m-d H:i:s'),
                ]);

                return $this->respondCreated(['data' => [
                    'message' => 'Program Coordinator assignment created.',
                    'assignment_id' => $assignmentId,
                    'profile_id' => $targetProfileId,
                    'role_key' => $roleKey,
                    'scope_type' => 'academic_program',
                    'scope_id' => $scopeId,
                ]]);
            }

            $scopeId = ! empty($json['organization_id']) ? (string) $json['organization_id'] : $compatScopeId;
            if ($scopeId === null) {
                return $this->respond(['error' => ['code' => 'MISSING_ORGANIZATION', 'message' => 'organization_id is required for Organization Moderator assignment.']], 422);
            }

            $organization = $db->table('public.organizations')->where('id', $scopeId)->where('status', 'active')->get()->getRowArray();
            if ($organization === null) {
                return $this->respond(['error' => ['code' => 'INVALID_ORGANIZATION', 'message' => 'Active Organization not found.']], 422);
            }

            if (($organization['scope'] ?? '') === 'college') {
                $eligible = $db->query(
                    "SELECT 1 FROM public.personnel_college_affiliations
                     WHERE personnel_profile_id = ? AND college_id = ? AND is_active = true",
                    [$targetProfileId, $organization['college_id']]
                )->getRowArray();
                if ($eligible === null) {
                    return $this->respond(['error' => ['code' => 'INELIGIBLE_ORGANIZATION_AFFILIATION', 'message' => 'College-based Organization moderators must be affiliated with the Organization College.']], 422);
                }
            }

            $assignmentId = (string) service('uuid')->uuid4();
            $db->table('public.organization_moderator_assignments')->insert([
                'id' => $assignmentId,
                'organization_id' => $scopeId,
                'personnel_profile_id' => $targetProfileId,
                'effective_from' => date('Y-m-d'),
                'is_active' => true,
                'assigned_by' => $actor['profile']['id'],
                'assigned_at' => date('Y-m-d H:i:s'),
            ]);

            return $this->respondCreated(['data' => [
                'message' => 'Organization Moderator assignment created.',
                'assignment_id' => $assignmentId,
                'profile_id' => $targetProfileId,
                'role_key' => $roleKey,
                'scope_type' => 'organization',
                'scope_id' => $scopeId,
            ]]);
        } catch (Throwable $e) {
            return $this->respond(['error' => [
                'code' => 'ASSIGNMENT_FAILED',
                'message' => 'Failed to create assignment: ' . $e->getMessage(),
            ]], 500);
        }
    }

    /**
     * DELETE /api/v1/personnel/{id}/roles/{assignmentId}
     * Optional body role_key avoids ambiguous ID lookup across assignment tables.
     */
    public function revoke(string $targetProfileId, string $assignmentId)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated active session required.']], 401);
        }

        $isHr = (($actor['profile']['account_type'] ?? '') === 'hr_admin' && in_array('hr_staff', $actor['roles'], true));
        $isOsad = (($actor['profile']['account_type'] ?? '') === 'osad_admin' && in_array('osad_staff', $actor['roles'], true));
        $json = $this->request->getJSON(true) ?? [];
        $requestedRole = trim((string) ($json['role_key'] ?? ''));
        $reason = trim((string) ($json['reason'] ?? 'Specialized role revocation'));
        $db = db_connect();

        $candidates = $requestedRole !== '' ? [$requestedRole] : ['dean', 'program_coordinator', 'organization_moderator'];

        foreach ($candidates as $roleKey) {
            if ($roleKey === 'dean') {
                $row = $db->table('public.dean_assignments')
                    ->where('id', $assignmentId)->where('personnel_profile_id', $targetProfileId)
                    ->where('is_active', true)->get()->getRowArray();
                if ($row === null) {
                    continue;
                }
                if (! $isHr) {
                    return $this->respond(['error' => ['code' => 'FORBIDDEN_ROLE_REVOCATION', 'message' => 'Only HR may revoke Dean.']], 403);
                }
                $db->table('public.dean_assignments')->where('id', $assignmentId)->update([
                    'is_active' => false,
                    'effective_to' => date('Y-m-d'),
                    'ended_by' => $actor['profile']['id'],
                    'ended_at' => date('Y-m-d H:i:s'),
                    'end_reason' => $reason,
                ]);
                return $this->respond(['data' => ['message' => 'Dean assignment revoked.', 'assignment_id' => $assignmentId]], 200);
            }

            if ($roleKey === 'program_coordinator') {
                $row = $db->table('public.program_coordinator_assignments')
                    ->where('id', $assignmentId)->where('personnel_profile_id', $targetProfileId)
                    ->where('is_active', true)->get()->getRowArray();
                if ($row === null) {
                    continue;
                }
                if (! $isOsad) {
                    return $this->respond(['error' => ['code' => 'FORBIDDEN_ROLE_REVOCATION', 'message' => 'Only OSAD may revoke Program Coordinator.']], 403);
                }
                $db->table('public.program_coordinator_assignments')->where('id', $assignmentId)->update([
                    'is_active' => false,
                    'effective_to' => date('Y-m-d'),
                    'ended_by' => $actor['profile']['id'],
                    'ended_at' => date('Y-m-d H:i:s'),
                    'end_reason' => $reason,
                ]);
                return $this->respond(['data' => ['message' => 'Program Coordinator assignment revoked.', 'assignment_id' => $assignmentId]], 200);
            }

            if ($roleKey === 'organization_moderator') {
                $row = $db->table('public.organization_moderator_assignments')
                    ->where('id', $assignmentId)->where('personnel_profile_id', $targetProfileId)
                    ->where('is_active', true)->get()->getRowArray();
                if ($row === null) {
                    continue;
                }
                if (! $isOsad) {
                    return $this->respond(['error' => ['code' => 'FORBIDDEN_ROLE_REVOCATION', 'message' => 'Only OSAD may revoke Organization Moderator.']], 403);
                }
                $db->table('public.organization_moderator_assignments')->where('id', $assignmentId)->update([
                    'is_active' => false,
                    'effective_to' => date('Y-m-d'),
                    'ended_at' => date('Y-m-d H:i:s'),
                    'end_reason' => $reason,
                ]);
                return $this->respond(['data' => ['message' => 'Organization Moderator assignment revoked.', 'assignment_id' => $assignmentId]], 200);
            }
        }

        return $this->respond(['error' => ['code' => 'ASSIGNMENT_NOT_FOUND', 'message' => 'Active specialized assignment not found.']], 404);
    }
}
