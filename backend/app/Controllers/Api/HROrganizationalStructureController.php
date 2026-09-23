<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
use App\Services\PersonnelClassificationService;
use App\Services\DeanAssignmentService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class HROrganizationalStructureController extends Controller
{
    use ResponseTrait;

    public function __construct(
        private ?AuthorizationService $authz = null,
        private ?PersonnelClassificationService $classifications = null,
        private ?DeanAssignmentService $deanAssignments = null
    ) {
        $this->authz ??= new AuthorizationService();
        $this->classifications ??= new PersonnelClassificationService();
        $this->deanAssignments ??= new DeanAssignmentService();
    }

    public function options(): mixed
    {
        return $this->respond(null, 204);
    }

    public function index(): mixed
    {
        $actor = $this->authz->resolveActor($this->request->getHeaderLine('Authorization'));
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }
        if (! $this->authz->hasRole($actor, 'hr_staff')) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Staff access required.']], 403);
        }

        try {
            $db = db_connect();
            $colleges = $db->table('colleges')
                ->select('id, code, name, status')
                ->where('status', 'active')->orderBy('name', 'ASC')->get()->getResultArray();

            // The WAMP schema retains the legacy table name; this API exposes these records as Departments only.
            $departments = $db->table('administrative_units')
                ->select('id, code, name, status')
                ->where('status', 'active')->orderBy('name', 'ASC')->get()->getResultArray();

            $deans = $db->table('dean_assignments da')
                ->select('da.id AS assignment_id, da.college_id, p.id AS profile_id, p.full_name, p.institutional_id, p.email, da.effective_from')
                ->join('profiles p', 'p.id = da.personnel_profile_id')
                ->where('da.is_active', 1)->where('p.status', 'active')->get()->getResultArray();

            $rows = $db->table('profiles p')
                ->select('p.id, p.full_name, p.institutional_id, p.email, p.status, p.designation_title, pp.personnel_classification, pp.personnel_group, pp.organizational_side, pp.employment_status, pp.position_title, pp.current_rank_title, pca.college_id, c.name AS college_name, c.code AS college_code, c.status AS college_status, pau.administrative_unit_id AS department_id, au.name AS department_name, au.code AS department_code, au.status AS department_status')
                ->join('personnel_profiles pp', 'pp.profile_id = p.id')
                ->join('personnel_college_affiliations pca', 'pca.personnel_profile_id = p.id AND pca.is_active = 1', 'left')
                ->join('colleges c', 'c.id = pca.college_id', 'left')
                ->join('personnel_administrative_unit_affiliations pau', 'pau.personnel_profile_id = p.id AND pau.is_active = 1', 'left')
                ->join('administrative_units au', 'au.id = pau.administrative_unit_id', 'left')
                ->where('p.account_type', 'personnel')->orderBy('p.full_name', 'ASC')->get()->getResultArray();

            $deanHistory = $db->table('dean_assignments da')
                ->select('da.id AS assignment_id, da.college_id, da.personnel_profile_id AS profile_id, p.full_name, p.institutional_id, da.effective_from, da.effective_until, da.is_active, da.end_reason')
                ->join('profiles p', 'p.id = da.personnel_profile_id')
                ->orderBy('da.effective_from', 'DESC')->get()->getResultArray();

            $personnel = [];
            foreach ($rows as $row) {
                $resolved = $this->classifications->resolveFromRecord($row);
                $personnel[] = [
                    'id' => $row['id'], 'full_name' => $row['full_name'],
                    'institutional_id' => $row['institutional_id'], 'email' => $row['email'],
                    'account_status' => $row['status'], 'employment_status' => $row['employment_status'],
                    'position_title' => $row['position_title'] ?: $row['designation_title'],
                    'current_rank_title' => $row['current_rank_title'],
                    'personnel_group' => $resolved['group'] ?? null,
                    'organizational_side' => $resolved['side'] ?? null,
                    'classification_code' => $resolved['code'] ?? null,
                    'classification_label' => $resolved['label'] ?? 'Unresolved classification',
                    'classification_valid' => (bool) ($resolved['valid'] ?? false),
                    'college_id' => $row['college_id'], 'college_name' => $row['college_name'],
                    'college_code' => $row['college_code'], 'college_status' => $row['college_status'],
                    'department_id' => $row['department_id'], 'department_name' => $row['department_name'],
                    'department_code' => $row['department_code'], 'department_status' => $row['department_status'],
                ];
            }

            return $this->respond(['data' => [
                'colleges' => $colleges,
                'departments' => $departments,
                'dean_assignments' => $deans,
                'dean_assignment_history' => $deanHistory,
                'personnel' => $personnel,
            ]], 200);
        } catch (Throwable $e) {
            log_message('error', '[HROrganizationalStructureController::index] ' . $e->getMessage());
            return $this->respond(['error' => ['code' => 'ORGANIZATIONAL_STRUCTURE_LOAD_FAILED', 'message' => 'Unable to load organizational structure.']], 500);
        }
    }

    public function reassignDean(string $collegeId): mixed
    {
        $actor = $this->authz->resolveActor($this->request->getHeaderLine('Authorization'));
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }
        if (! $this->authz->hasRole($actor, 'hr_staff')) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Staff access required.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $newPersonnelId = trim((string) ($json['personnel_profile_id'] ?? ($json['new_dean_profile_id'] ?? '')));
        $reason = trim((string) ($json['reason'] ?? ''));
        $effectiveDate = trim((string) ($json['effective_date'] ?? date('Y-m-d')));

        if ($collegeId === '' || $newPersonnelId === '') {
            return $this->respond(['error' => ['code' => 'INVALID_PAYLOAD', 'message' => 'College ID and New Dean Personnel Profile ID are required.']], 422);
        }

        if ($reason === '') {
            return $this->respond(['error' => ['code' => 'REASON_REQUIRED', 'message' => 'A reason for Dean reassignment is required.']], 422);
        }
        if (mb_strlen($reason) < 5) {
            return $this->respond(['error' => ['code' => 'REASON_TOO_SHORT', 'message' => 'Please provide a meaningful reason for reassignment (at least 5 characters).']], 422);
        }

        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $effectiveDate)) {
            return $this->respond(['error' => ['code' => 'INVALID_EFFECTIVE_DATE', 'message' => 'Effective Date must use YYYY-MM-DD format.']], 422);
        }

        $result = $this->deanAssignments->reassign(
            $collegeId,
            $newPersonnelId,
            $actor['profile']['id'],
            $effectiveDate,
            $reason
        );
        if (! $result['success']) {
            return $this->respond(['error' => $result['error']], $result['status']);
        }
        return $this->respond(['data' => ['message' => 'Dean reassigned successfully.', ...$result['data']]], 200);

        /* Legacy inline implementation retained temporarily for migration traceability; unreachable. */
        $db = db_connect();

        // 1. Verify College exists
        $college = $db->table('colleges')->where('id', $collegeId)->get()->getRowArray();
        if ($college === null) {
            return $this->respond(['error' => ['code' => 'COLLEGE_NOT_FOUND', 'message' => 'College not found.']], 404);
        }

        // 2. Verify Candidate eligibility: Active Academic Personnel affiliated with this College
        $candidate = $db->query(
            "SELECT p.id, p.full_name, p.institutional_id, p.email
             FROM profiles p
             JOIN personnel_profiles pp ON pp.profile_id=p.id AND pp.personnel_classification='academic'
             JOIN personnel_college_affiliations pca ON pca.personnel_profile_id=p.id AND pca.college_id=? AND pca.is_active=1
             WHERE p.id=? AND p.account_type='personnel' AND p.status='active'",
            [$collegeId, $newPersonnelId]
        )->getRowArray();

        if ($candidate === null) {
            return $this->respond(['error' => ['code' => 'INELIGIBLE_DEAN_CANDIDATE', 'message' => 'The selected candidate must be an active Academic Faculty member affiliated with this College.']], 422);
        }

        // 3. Find current active Dean for this College
        $currentDean = $db->table('dean_assignments da')
            ->select('da.id AS assignment_id, da.personnel_profile_id, p.full_name')
            ->join('profiles p', 'p.id = da.personnel_profile_id')
            ->where('da.college_id', $collegeId)
            ->where('da.is_active', 1)
            ->get()->getRowArray();

        if ($currentDean && $currentDean['personnel_profile_id'] === $newPersonnelId) {
            return $this->respond(['error' => ['code' => 'ALREADY_ACTIVE_DEAN', 'message' => 'The selected personnel is already the active Dean of this College.']], 422);
        }

        // 4. Begin Atomic Transaction
        $db->transBegin();
        try {
            $now = date('Y-m-d H:i:s');
            $actorId = $actor['profile']['id'] ?? $actor['id'] ?? null;

            // 4a. Deactivate previous Dean assignment if exists
            if ($currentDean) {
                $db->table('dean_assignments')
                    ->where('id', $currentDean['assignment_id'])
                    ->update([
                        'is_active' => 0,
                        'effective_until' => $effectiveDate,
                        'updated_at' => $now,
                        'active_college_dean_guard' => null,
                        'active_personnel_dean_guard' => null,
                    ]);
            }

            // Also deactivate any other active dean assignment for this candidate
            $db->table('dean_assignments')
                ->where('personnel_profile_id', $newPersonnelId)
                ->where('is_active', 1)
                ->update([
                    'is_active' => 0,
                    'effective_until' => $effectiveDate,
                    'updated_at' => $now,
                    'active_college_dean_guard' => null,
                    'active_personnel_dean_guard' => null,
                ]);

            // 4b. Insert new Dean assignment
            $newAssignmentId = sprintf(
                '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                random_int(0, 0xffff), random_int(0, 0xffff),
                random_int(0, 0xffff),
                random_int(0, 0x0fff) | 0x4000,
                random_int(0, 0x3fff) | 0x8000,
                random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff)
            );

            $db->table('dean_assignments')->insert([
                'id' => $newAssignmentId,
                'personnel_profile_id' => $newPersonnelId,
                'college_id' => $collegeId,
                'effective_from' => $effectiveDate,
                'effective_until' => null,
                'is_active' => 1,
                'assigned_by' => $actorId,
                'assigned_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
                'active_college_dean_guard' => $collegeId,
                'active_personnel_dean_guard' => $newPersonnelId,
            ]);

            // 4c. Audit Trail Logging in account_lifecycle_events
            if ($db->tableExists('account_lifecycle_events')) {
                $eventId = sprintf(
                    '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                    random_int(0, 0xffff), random_int(0, 0xffff),
                    random_int(0, 0xffff),
                    random_int(0, 0x0fff) | 0x4000,
                    random_int(0, 0x3fff) | 0x8000,
                    random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff)
                );

                $db->table('account_lifecycle_events')->insert([
                    'id' => $eventId,
                    'profile_id' => $newPersonnelId,
                    'actor_profile_id' => $actorId,
                    'event_type' => 'COLLEGE_DEAN_REASSIGNED',
                    'previous_status' => $currentDean ? 'active' : 'unassigned',
                    'new_status' => 'active',
                    'reason' => $reason,
                    'metadata' => json_encode([
                        'college_id' => $collegeId,
                        'college_code' => $college['code'],
                        'college_name' => $college['name'],
                        'previous_dean_id' => $currentDean['personnel_profile_id'] ?? null,
                        'previous_dean_name' => $currentDean['full_name'] ?? 'None',
                        'new_dean_id' => $newPersonnelId,
                        'new_dean_name' => $candidate['full_name'],
                        'effective_date' => $effectiveDate,
                        'reason' => $reason,
                    ]),
                    'occurred_at' => $now,
                ]);
            }

            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->respond(['error' => ['code' => 'REASSIGNMENT_FAILED', 'message' => 'Dean reassignment could not be completed.']], 500);
        }

        return $this->respond([
            'data' => [
                'message' => 'Dean reassigned successfully.',
                'assignment_id' => $newAssignmentId,
                'college_id' => $collegeId,
                'college_name' => $college['name'],
                'previous_dean' => $currentDean['full_name'] ?? 'Unassigned',
                'new_dean' => $candidate['full_name'],
                'new_dean_id' => $newPersonnelId,
                'effective_date' => $effectiveDate,
                'reason' => $reason,
            ]
        ], 200);
    }

    public function deanHistory(string $collegeId): mixed
    {
        $actor = $this->authz->resolveActor($this->request->getHeaderLine('Authorization'));
        if ($actor === null) return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        if (! $this->authz->hasRole($actor, 'hr_staff')) return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Staff access required.']], 403);
        return $this->respond(['data' => ['college_id' => $collegeId, 'history' => $this->deanAssignments->history($collegeId)]], 200);
    }
}
