<?php

namespace App\Controllers\Api;

use App\Services\AuthenticatedActorService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class StudentProfileController extends Controller
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
     * GET /api/v1/student/profile
     * Returns the normalized, student-safe profile with authoritative institutional relationships.
     */
    public function show()
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond([
                'error' => [
                    'code'    => 'UNAUTHORIZED',
                    'message' => 'Valid authenticated student session required.',
                ],
            ], 401);
        }

        $profile = $actor['profile'] ?? [];
        if (($profile['account_type'] ?? '') !== 'student') {
            return $this->respond([
                'error' => [
                    'code'    => 'FORBIDDEN',
                    'message' => 'This endpoint is restricted to authenticated students.',
                ],
            ], 403);
        }

        $studentProfileId = $profile['id'];
        $db = db_connect();

        try {
            // 1. Identity
            $identity = [
                'student_id'          => $profile['institutional_id'] ?? '',
                'full_name'           => $profile['full_name'] ?? trim(($profile['first_name'] ?? '') . ' ' . ($profile['last_name'] ?? '')),
                'first_name'          => $profile['first_name'] ?? '',
                'last_name'           => $profile['last_name'] ?? '',
                'middle_name'         => $profile['middle_name'] ?? null,
                'sex'                 => $profile['sex'] ?? null,
                'institutional_email' => $profile['email'] ?? '',
                'avatar_url'          => $profile['avatar_url'] ?? null,
            ];

            // 2. Academic Placement (Program & College)
            $placementRow = $db->query(
                "SELECT e.academic_program_id, e.year_level, e.academic_year,
                        ap.code AS program_code, ap.name AS program_name, ap.degree_level,
                        c.id AS college_id, c.code AS college_code, c.name AS college_name,
                        c.acronym_badge_color
                 FROM student_program_enrollments e
                 JOIN academic_programs ap ON ap.id = e.academic_program_id
                 JOIN colleges c ON c.id = ap.college_id
                 WHERE e.student_profile_id = ? AND e.is_active = 1
                 LIMIT 1",
                [$studentProfileId]
            )->getRowArray();

            $academic = null;
            $college = null;
            $coordinator = null;
            $hasProgram = false;
            $hasCollege = false;
            $hasCoordinator = false;

            if ($placementRow !== null) {
                $hasProgram = true;
                $hasCollege = true;

                $academic = [
                    'program_id'   => $placementRow['academic_program_id'],
                    'program_code' => $placementRow['program_code'],
                    'program_name' => $placementRow['program_name'],
                    'degree_level' => $placementRow['degree_level'],
                    'year_level'   => $placementRow['year_level'],
                    'academic_year'=> $placementRow['academic_year'],
                ];

                $college = [
                    'college_id'          => $placementRow['college_id'],
                    'college_code'        => $placementRow['college_code'],
                    'college_name'        => $placementRow['college_name'],
                    'acronym_badge_color' => $placementRow['acronym_badge_color'] ?: '#15803d',
                ];

                // Active Program Coordinator
                $coordRow = $db->query(
                    "SELECT p.id, p.full_name, p.first_name, p.last_name, p.email,
                            p.designation_title, p.avatar_url
                     FROM program_coordinator_assignments pca
                     JOIN profiles p ON p.id = pca.personnel_profile_id
                     WHERE pca.academic_program_id = ? AND pca.is_active = 1 AND p.status = 'active'
                     LIMIT 1",
                    [$placementRow['academic_program_id']]
                )->getRowArray();

                if ($coordRow !== null) {
                    $hasCoordinator = true;
                    $coordinator = [
                        'full_name'           => $coordRow['full_name'] ?: trim($coordRow['first_name'] . ' ' . $coordRow['last_name']),
                        'institutional_email' => $coordRow['email'],
                        'designation_title'   => $coordRow['designation_title'] ?: 'Program Coordinator',
                        'avatar_url'          => $coordRow['avatar_url'] ?? null,
                    ];
                }
            }

            // 3. Organization & Moderator
            $orgRow = null;
            if ($placementRow !== null) {
                $orgRow = $db->query(
                    "SELECT o.id, o.code, o.name, o.scope, o.category, o.logo_storage_key
                     FROM organization_program_affiliations opa
                     JOIN organizations o ON o.id = opa.organization_id
                     WHERE opa.academic_program_id = ? AND o.status = 'active'
                     LIMIT 1",
                    [$placementRow['academic_program_id']]
                )->getRowArray();
            }

            $organization = null;
            $moderator = null;
            $hasOrganization = false;
            $hasModerator = false;

            if ($orgRow !== null) {
                $hasOrganization = true;
                $organization = [
                    'organization_id'   => $orgRow['id'],
                    'organization_code' => $orgRow['code'],
                    'organization_name' => $orgRow['name'],
                    'scope'             => $orgRow['scope'],
                    'category'          => $orgRow['category'],
                    'logo_storage_key'  => $orgRow['logo_storage_key'] ?? null,
                ];

                // Active Organization Moderator
                $modRow = $db->query(
                    "SELECT p.id, p.full_name, p.first_name, p.last_name, p.email,
                            p.designation_title, p.avatar_url
                     FROM organization_moderator_assignments oma
                     JOIN profiles p ON p.id = oma.personnel_profile_id
                     WHERE oma.organization_id = ? AND oma.is_active = 1 AND p.status = 'active'
                     LIMIT 1",
                    [$orgRow['id']]
                )->getRowArray();

                if ($modRow !== null) {
                    $hasModerator = true;
                    $moderator = [
                        'full_name'           => $modRow['full_name'] ?: trim($modRow['first_name'] . ' ' . $modRow['last_name']),
                        'institutional_email' => $modRow['email'],
                        'designation_title'   => $modRow['designation_title'] ?: 'Organization Moderator',
                        'avatar_url'          => $modRow['avatar_url'] ?? null,
                    ];
                }
            }

            // 4. Safe Account State
            $account = [
                'status'        => $profile['status'] ?? 'active',
                'account_type'  => 'student',
                'created_at'    => $profile['created_at'] ?? null,
            ];

            // 5. Availability Summary
            $availability = [
                'has_program'      => $hasProgram,
                'has_college'      => $hasCollege,
                'has_coordinator'  => $hasCoordinator,
                'has_organization' => $hasOrganization,
                'has_moderator'    => $hasModerator,
            ];

            return $this->respond([
                'data' => [
                    'identity'     => $identity,
                    'academic'     => $academic,
                    'college'      => $college,
                    'organization' => $organization,
                    'moderator'    => $moderator,
                    'coordinator'  => $coordinator,
                    'account'      => $account,
                    'availability' => $availability,
                ]
            ], 200);

        } catch (Throwable $e) {
            return $this->respond([
                'error' => [
                    'code'    => 'FETCH_FAILED',
                    'message' => 'Unable to resolve student institutional profile: ' . $e->getMessage(),
                ]
            ], 500);
        }
    }
}
