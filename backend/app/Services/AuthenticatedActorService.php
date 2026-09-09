<?php

namespace App\Services;

class AuthenticatedActorService
{
    protected LocalTokenService $localTokenService;

    public function __construct(?LocalTokenService $localTokenService = null)
    {
        $this->localTokenService = $localTokenService ?? new LocalTokenService();
    }

    /**
     * Resolves the authenticated actor from Authorization Bearer header.
     *
     * Uses LocalTokenService with the server-side session registry.
     *
     * Generic account roles (student, personnel, hr_staff, osad_staff) remain
     * sourced from profile_roles. Business-scoped governance roles are sourced
     * exclusively from their final assignment tables with scope metadata.
     *
     * @return array|null Actor with profile, role keys, normalized assignments, claims.
     */
    public function resolveActor(?string $authorizationHeader = null): ?array
    {
        $header = trim((string) $authorizationHeader);
        if ($header === '' || ! preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
            return null;
        }

        $token = trim($matches[1]);
        $claims = null;

        $claims = $this->localTokenService->verifyToken($token);
        if ($claims === null) {
            return null;
        }

        $authUserId = (string) ($claims->sub ?? '');
        if ($authUserId === '') {
            return null;
        }

        $db = db_connect();
        $profile = $db->table('profiles')
            ->where('id', $authUserId)
            ->get()
            ->getRowArray();

        if ($profile === null || ($profile['status'] ?? '') !== 'active') {
            return null;
        }

        // Generic/global roles only. Specialized governance roles are resolved below.
        $genericRoleRows = $db->query(
            "SELECT r.role_key, r.display_name, pr.id AS assignment_id,
                    'university' AS scope_type, NULL AS scope_id,
                    NULL AS scope_code, 'University' AS scope_name
             FROM profile_roles pr
             JOIN roles r ON r.id = pr.role_id
             WHERE pr.profile_id = ?
               AND pr.is_active = 1
               AND r.role_key NOT IN ('dean', 'program_coordinator', 'organization_moderator')",
            [$authUserId]
        )->getResultArray();

        $deanRows = $db->query(
            "SELECT 'dean' AS role_key, 'Dean' AS display_name,
                    da.id AS assignment_id, 'college' AS scope_type,
                    da.college_id AS scope_id, c.code AS scope_code, c.name AS scope_name
             FROM dean_assignments da
             JOIN colleges c ON c.id = da.college_id
             WHERE da.personnel_profile_id = ? AND da.is_active = 1",
            [$authUserId]
        )->getResultArray();

        $coordinatorRows = $db->query(
            "SELECT 'program_coordinator' AS role_key,
                    'Program Coordinator' AS display_name,
                    pca.id AS assignment_id, 'academic_program' AS scope_type,
                    pca.academic_program_id AS scope_id, ap.code AS scope_code, ap.name AS scope_name
             FROM program_coordinator_assignments pca
             JOIN academic_programs ap ON ap.id = pca.academic_program_id
             WHERE pca.personnel_profile_id = ? AND pca.is_active = 1",
            [$authUserId]
        )->getResultArray();

        $moderatorRows = $db->query(
            "SELECT 'organization_moderator' AS role_key,
                    'Organization Moderator' AS display_name,
                    oma.id AS assignment_id, 'organization' AS scope_type,
                    oma.organization_id AS scope_id, o.code AS scope_code, o.name AS scope_name
             FROM organization_moderator_assignments oma
             JOIN organizations o ON o.id = oma.organization_id
             WHERE oma.personnel_profile_id = ? AND oma.is_active = 1",
            [$authUserId]
        )->getResultArray();

        $assignments = array_merge($genericRoleRows, $deanRows, $coordinatorRows, $moderatorRows);
        $roles = array_values(array_unique(array_column($assignments, 'role_key')));

        return [
            'profile'      => $profile,
            'roles'        => $roles,
            'scopes'       => $assignments, // compatibility alias
            'assignments'  => $assignments,
            'claims'       => $claims,
        ];
    }
}
