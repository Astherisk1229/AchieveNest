<?php

namespace App\Controllers\Api;

use App\Helpers\ValidationHelper;
use App\Services\AuthorizationService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class TargetHRPersonnelController extends Controller
{
    use ResponseTrait;

    protected AuthorizationService $authz;

    public function __construct(?AuthorizationService $authz = null)
    {
        $this->authz = $authz ?? new AuthorizationService();
    }

    public function options(): mixed
    {
        return $this->respond(null, 204);
    }

    protected function resolveActor(): ?array
    {
        return $this->authz->resolveActor($this->request->getHeaderLine('Authorization'));
    }

    private function genUuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            random_int(0, 0xffff), random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0x0fff) | 0x4000,
            random_int(0, 0x3fff) | 0x8000,
            random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff)
        );
    }

    protected function requireHrAdmin(?array $actor): bool
    {
        return $actor !== null && $this->authz->hasRole($actor, 'hr_staff');
    }

    public function directory(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated active session required.']], 401);
        }
        if (! $this->requireHrAdmin($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Admin access required.']], 403);
        }

        $db = db_connect();
        $search = trim((string) $this->request->getGet('search'));
        $collegeId = trim((string) $this->request->getGet('college_id'));
        $administrativeUnitId = trim((string) $this->request->getGet('administrative_unit_id'));
        $classification = trim((string) $this->request->getGet('personnel_classification'));
        $status = trim((string) $this->request->getGet('status'));
        $pagination = ValidationHelper::validatePagination(
            $this->request->getGet('page') ?? 1,
            $this->request->getGet('per_page') ?? 25
        );

        $builder = $db->table('profiles p')
            ->select([
                'p.id', 'p.institutional_id', 'p.email AS institutional_email', 'p.full_name',
                'p.first_name', 'p.middle_name', 'p.last_name',
                'p.designation_title AS designation', 'p.status', 'p.must_change_password',
                'p.created_at',
                'pp.personnel_classification',
                'pca.college_id', 'c.code AS college_code', 'c.name AS college_name',
                'pau.administrative_unit_id', 'au.code AS administrative_unit_code',
                'au.name AS administrative_unit_name',
                "(SELECT da.id FROM dean_assignments da
                   WHERE da.personnel_profile_id = p.id AND da.is_active = 1 LIMIT 1) AS dean_assignment_id",
                "(SELECT c2.name FROM dean_assignments da
                   JOIN colleges c2 ON c2.id = da.college_id
                   WHERE da.personnel_profile_id = p.id AND da.is_active = 1 LIMIT 1) AS dean_college_name",
                "(SELECT qr.eligibility_decision FROM personnel_qualification_reviews qr
                   WHERE qr.personnel_profile_id = p.id
                   ORDER BY qr.created_at DESC LIMIT 1) AS latest_qualification_decision",
            ])
            ->join('personnel_profiles pp', 'pp.profile_id = p.id')
            ->join('personnel_college_affiliations pca', 'pca.personnel_profile_id = p.id AND pca.is_active = 1', 'left')
            ->join('colleges c', 'c.id = pca.college_id', 'left')
            ->join('personnel_administrative_unit_affiliations pau', 'pau.personnel_profile_id = p.id AND pau.is_active = 1', 'left')
            ->join('administrative_units au', 'au.id = pau.administrative_unit_id', 'left')
            ->where('p.account_type', 'personnel');

        if ($search !== '') {
            $builder->groupStart()
                ->like('p.full_name', $search)
                ->orLike('p.institutional_id', $search)
                ->orLike('p.email', $search)
                ->groupEnd();
        }
        if ($collegeId !== '') {
            $builder->where('pca.college_id', $collegeId);
        }
        if ($administrativeUnitId !== '') {
            $builder->where('pau.administrative_unit_id', $administrativeUnitId);
        }
        if (in_array($classification, ['academic', 'non_academic'], true)) {
            $builder->where('pp.personnel_classification', $classification);
        }
        if (in_array($status, ['active', 'suspended', 'archived'], true)) {
            $builder->where('p.status', $status);
        }

        $total = (clone $builder)->countAllResults(false);
        $rows = $builder->orderBy('p.full_name', 'ASC')
            ->limit($pagination['per_page'], $pagination['offset'])
            ->get()->getResultArray();

        foreach ($rows as &$row) {
            $row['program_affiliations'] = $db->query(
                "SELECT ap.id AS academic_program_id, ap.code, ap.name
                 FROM personnel_program_affiliations ppa
                 JOIN academic_programs ap ON ap.id = ppa.academic_program_id
                 WHERE ppa.personnel_profile_id = ? AND ppa.is_active = 1
                 ORDER BY ap.code",
                [$row['id']]
            )->getResultArray();

            $roleRows = $db->query(
                "SELECT 'dean' AS role_key FROM dean_assignments WHERE personnel_profile_id=? AND is_active=1
                 UNION ALL
                 SELECT 'program_coordinator' AS role_key FROM program_coordinator_assignments WHERE personnel_profile_id=? AND is_active=1
                 UNION ALL
                 SELECT 'organization_moderator' AS role_key FROM organization_moderator_assignments WHERE personnel_profile_id=? AND is_active=1",
                [$row['id'], $row['id'], $row['id']]
            )->getResultArray();
            $row['assigned_roles'] = array_values(array_unique(array_column($roleRows, 'role_key')));
        }
        unset($row);

        return $this->respond(['data' => [
            'total'     => $total,
            'page'      => $pagination['page'],
            'per_page'  => $pagination['per_page'],
            'personnel' => $rows,
        ]], 200);
    }

    public function assignDean(string $profileId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }
        if (! $this->authz->governance()->canAssignDean($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Admin access required.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $collegeId = trim((string) ($json['college_id'] ?? ''));
        if (! ValidationHelper::validateUuid($profileId) || ! ValidationHelper::validateUuid($collegeId)) {
            return $this->respond(['error' => ['code' => 'INVALID_IDS', 'message' => 'Valid Personnel profile_id and college_id UUIDs are required.']], 422);
        }

        $db = db_connect();
        $eligible = $db->query(
            "SELECT 1 FROM profiles p
             JOIN personnel_profiles pp ON pp.profile_id=p.id AND pp.personnel_classification='academic'
             JOIN personnel_college_affiliations pca ON pca.personnel_profile_id=p.id AND pca.college_id=? AND pca.is_active=1
             WHERE p.id=? AND p.account_type='personnel' AND p.status='active'",
            [$collegeId, $profileId]
        )->getRowArray();
        if ($eligible === null) {
            return $this->respond(['error' => ['code' => 'INELIGIBLE_DEAN_AFFILIATION', 'message' => 'Dean must be active Academic Personnel affiliated with the selected College.']], 422);
        }

        $assignmentId = $this->genUuid();
        try {
            $db->table('dean_assignments')->insert([
                'id'                   => $assignmentId,
                'personnel_profile_id' => $profileId,
                'college_id'           => $collegeId,
                'effective_from'       => date('Y-m-d'),
                'is_active'            => 1,
                'assigned_by'          => $actor['profile']['id'],
                'assigned_at'          => date('Y-m-d H:i:s'),
            ]);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'ASSIGNMENT_FAILED', 'message' => 'Failed to assign Dean: ' . $e->getMessage()]], 409);
        }

        return $this->respondCreated(['data' => [
            'message'       => 'Dean assignment created.',
            'assignment_id' => $assignmentId,
            'profile_id'    => $profileId,
            'college_id'    => $collegeId,
        ]]);
    }

    public function revokeDean(string $profileId, string $assignmentId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }
        if (! $this->authz->governance()->canAssignDean($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Admin access required.']], 403);
        }

        $db = db_connect();
        $assignment = $db->table('dean_assignments')
            ->where('id', $assignmentId)
            ->where('personnel_profile_id', $profileId)
            ->where('is_active', 1)
            ->get()->getRowArray();
        if ($assignment === null) {
            return $this->respond(['error' => ['code' => 'ASSIGNMENT_NOT_FOUND', 'message' => 'Active Dean assignment not found.']], 404);
        }

        $db->table('dean_assignments')->where('id', $assignmentId)->update([
            'is_active'       => 0,
            'effective_until' => date('Y-m-d'),
        ]);

        return $this->respond(['data' => ['message' => 'Dean assignment revoked.', 'assignment_id' => $assignmentId]], 200);
    }
}
