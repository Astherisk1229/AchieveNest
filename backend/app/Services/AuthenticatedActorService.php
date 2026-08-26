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
     *
     * Generic account roles (student, personnel, hr_staff, osad_staff) remain
     * sourced from profile_roles during the compatibility period. Business-scoped
     * governance roles are sourced exclusively from their final assignment tables
     * with scope metadata (scope_code, scope_name).
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

        // Generic/global roles only. Specialized governance roles are resolved below.
        $genericRoleRows = $db->query(
            "SELECT r.role_key, r.display_name, pr.id AS assignment_id,
                    'university'::text AS scope_type, NULL::uuid AS scope_id,
                    NULL::text AS scope_code, 'University'::text AS scope_name
             FROM public.profile_roles pr
             JOIN public.roles r ON r.id = pr.role_id
             WHERE pr.profile_id = ?
               AND pr.is_active = true
               AND r.role_key NOT IN ('dean', 'program_coordinator', 'organization_moderator')",
            [$authUserId]
        )->getResultArray();

        $deanRows = $db->query(
            "SELECT 'dean'::text AS role_key, 'Dean'::text AS display_name,
                    da.id AS assignment_id, 'college'::text AS scope_type,
                    da.college_id AS scope_id, c.code AS scope_code, c.name AS scope_name
             FROM public.dean_assignments da
             JOIN public.colleges c ON c.id = da.college_id
             WHERE da.personnel_profile_id = ? AND da.is_active = true",
            [$authUserId]
        )->getResultArray();

        $coordinatorRows = $db->query(
            "SELECT 'program_coordinator'::text AS role_key,
                    'Program Coordinator'::text AS display_name,
                    pca.id AS assignment_id, 'academic_program'::text AS scope_type,
                    pca.academic_program_id AS scope_id, ap.code AS scope_code, ap.name AS scope_name
             FROM public.program_coordinator_assignments pca
             JOIN public.academic_programs ap ON ap.id = pca.academic_program_id
             WHERE pca.personnel_profile_id = ? AND pca.is_active = true",
            [$authUserId]
        )->getResultArray();

        $moderatorRows = $db->query(
            "SELECT 'organization_moderator'::text AS role_key,
                    'Organization Moderator'::text AS display_name,
                    oma.id AS assignment_id, 'organization'::text AS scope_type,
                    oma.organization_id AS scope_id, o.code AS scope_code, o.name AS scope_name
             FROM public.organization_moderator_assignments oma
             JOIN public.organizations o ON o.id = oma.organization_id
             WHERE oma.personnel_profile_id = ? AND oma.is_active = true",
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
