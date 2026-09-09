<?php

namespace App\Controllers\Api;

use App\Helpers\ValidationHelper;
use App\Services\AccountLifecycleResolver;
use App\Services\AuthorizationService;
use App\Services\FacultyStatusService;
use App\Services\PersonnelClassificationService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class TargetHRPersonnelController extends Controller
{
    use ResponseTrait;

    protected AuthorizationService $authz;
    protected PersonnelClassificationService $classificationService;
    protected FacultyStatusService $facultyStatusService;

    public function __construct(
        ?AuthorizationService $authz = null,
        ?PersonnelClassificationService $classificationService = null,
        ?FacultyStatusService $facultyStatusService = null
    ) {
        $this->authz = $authz ?? new AuthorizationService();
        $this->classificationService = $classificationService ?? new PersonnelClassificationService();
        $this->facultyStatusService = $facultyStatusService ?? new FacultyStatusService();
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
        $personnelGroup = trim((string) $this->request->getGet('personnel_group'));
        $organizationalSide = trim((string) $this->request->getGet('organizational_side'));
        $facultyEngagement = trim((string) $this->request->getGet('faculty_engagement'));
        $employmentStatus = trim((string) $this->request->getGet('employment_status'));
        $status = trim((string) $this->request->getGet('status'));
        $pagination = ValidationHelper::validatePagination(
            $this->request->getGet('page') ?? 1,
            $this->request->getGet('per_page') ?? 25
        );

        $hasGroupCol      = $db->fieldExists('personnel_group', 'personnel_profiles');
        $hasSideCol       = $db->fieldExists('organizational_side', 'personnel_profiles');
        $hasEngagementCol = $db->fieldExists('faculty_engagement', 'personnel_profiles');
        $hasPositionCol   = $db->fieldExists('position_title', 'personnel_profiles');
        $hasRankCol       = $db->fieldExists('current_rank_title', 'personnel_profiles');
        $hasQualCol       = $db->fieldExists('qualification_summary', 'personnel_profiles');

        $selectCols = [
            'p.id', 'p.institutional_id', 'p.email AS institutional_email', 'p.full_name',
            'p.first_name', 'p.middle_name', 'p.last_name',
            'p.designation_title AS designation', 'p.status',
            'lac.must_change_password AS credential_must_change_password',
            "CASE WHEN lac.profile_id IS NULL THEN 'missing' WHEN lac.must_change_password IS NULL THEN 'invalid' ELSE 'valid' END AS credential_integrity_status",
            'p.created_at',
            'pp.personnel_classification',
            'pp.employment_status',
            $hasGroupCol ? 'pp.personnel_group' : "CASE WHEN pp.personnel_classification='academic' THEN 'faculty' ELSE 'non_teaching_faculty' END AS personnel_group",
            $hasSideCol  ? 'pp.organizational_side' : "pp.personnel_classification AS organizational_side",
            $hasEngagementCol ? 'pp.faculty_engagement' : "NULL AS faculty_engagement",
            $hasPositionCol   ? 'pp.position_title' : "p.designation_title AS position_title",
            $hasRankCol       ? 'pp.current_rank_title' : "pp.rank_level AS current_rank_title",
            $hasQualCol       ? 'pp.qualification_summary' : "NULL AS qualification_summary",
            'pca.college_id', 'c.code AS college_code', 'c.name AS college_name',
            'pau.administrative_unit_id', 'au.code AS administrative_unit_code',
            'au.name AS administrative_unit_name',
            "(SELECT da.id FROM dean_assignments da
               WHERE da.personnel_profile_id = p.id AND da.is_active = 1 LIMIT 1) AS dean_assignment_id",
            "(SELECT c2.name FROM dean_assignments da
               JOIN colleges c2 ON c2.id = da.college_id
               WHERE da.personnel_profile_id = p.id AND da.is_active = 1 LIMIT 1) AS dean_college_name",
            "(SELECT qr.qualification_status FROM personnel_qualification_reviews qr
               WHERE qr.personnel_profile_id = p.id
               ORDER BY qr.reviewed_at DESC LIMIT 1) AS latest_qualification_decision",
        ];

        $builder = $db->table('profiles p')
            ->select($selectCols, false)
            ->join('local_auth_credentials lac', 'lac.profile_id = p.id', 'left')
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
        if ($hasGroupCol && in_array($personnelGroup, ['faculty', 'non_teaching_faculty'], true)) {
            $builder->where('pp.personnel_group', $personnelGroup);
        }
        if ($hasSideCol && in_array($organizationalSide, ['academic', 'non_academic'], true)) {
            $builder->where('pp.organizational_side', $organizationalSide);
        }
        if ($hasEngagementCol && in_array($facultyEngagement, ['full_time_faculty', 'part_time_faculty'], true)) {
            $builder->where('pp.faculty_engagement', $facultyEngagement);
        }
        if (in_array($employmentStatus, ['permanent', 'probationary'], true)) {
            $builder->where('pp.employment_status', $employmentStatus);
        }
        if (in_array($status, ['active', 'suspended', 'archived'], true)) {
            $builder->where('p.status', $status);
        }

        $total = (clone $builder)->countAllResults(false);
        $rows = $builder->orderBy('p.full_name', 'ASC')
            ->limit($pagination['per_page'], $pagination['offset'])
            ->get()->getResultArray();

        foreach ($rows as &$row) {
            $lifecycle = AccountLifecycleResolver::resolve(
                $row['status'] ?? 'active',
                $row['credential_must_change_password'] ?? null,
                false,
                $row['credential_integrity_status'] ?? null
            );
            $row['administrative_status']       = $lifecycle['administrative_status'];
            $row['account_lifecycle_status']    = $lifecycle['account_lifecycle_status'];
            $row['credential_integrity_status'] = $lifecycle['credential_integrity_status'];
            $row['must_change_password']        = $lifecycle['must_change_password'];
            $row['required_next_action']        = $lifecycle['required_next_action'];

            // Resolved canonical classification details
            $resolvedCls = $this->classificationService->resolveFromRecord($row);
            $row['personnel_group']             = $resolvedCls['group'];
            $row['organizational_side']         = $resolvedCls['side'];
            $row['classification_code']        = $resolvedCls['code'];
            $row['classification_label']       = $resolvedCls['label'];

            // Resolved master data DTO details
            $dto = $this->facultyStatusService->buildMasterDataDto($row);
            $row['faculty_engagement_label']    = $dto['faculty_engagement_label'];
            $row['employment_status_label']     = $dto['employment_status_label'];
            $row['is_dean_review_eligible']     = $dto['is_dean_review_eligible'];

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

    /**
     * GET /api/v1/hr/personnel/{id}/master-data
     * Plan D — Phase D2: Master Data & Faculty Status DTO Read.
     */
    public function getMasterData(string $profileId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        if (! ValidationHelper::validateUuid($profileId)) {
            return $this->respond(['error' => ['code' => 'INVALID_PROFILE_ID', 'message' => 'Invalid personnel profile ID UUID.']], 422);
        }

        $actorId = (string) ($actor['profile']['id'] ?? '');
        $isHr    = $this->requireHrAdmin($actor);
        $isSelf  = ($actorId === $profileId);
        $isDean  = $this->authz->hasRole($actor, 'dean');

        if (! $isHr && ! $isSelf && ! $isDean) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Access denied to personnel master data.']], 403);
        }

        $db = db_connect();
        $row = $db->table('profiles p')
            ->select([
                'p.id', 'p.institutional_id', 'p.email AS institutional_email', 'p.full_name',
                'p.first_name', 'p.middle_name', 'p.last_name', 'p.designation_title AS designation', 'p.status',
                'pp.personnel_classification', 'pp.employment_status',
                'pp.personnel_group', 'pp.organizational_side',
                'pp.faculty_engagement', 'pp.position_title', 'pp.current_rank_title', 'pp.qualification_summary',
                'pca.college_id', 'c.code AS college_code', 'c.name AS college_name',
                'pau.administrative_unit_id', 'au.code AS administrative_unit_code', 'au.name AS administrative_unit_name',
            ])
            ->join('personnel_profiles pp', 'pp.profile_id = p.id')
            ->join('personnel_college_affiliations pca', 'pca.personnel_profile_id = p.id AND pca.is_active = 1', 'left')
            ->join('colleges c', 'c.id = pca.college_id', 'left')
            ->join('personnel_administrative_unit_affiliations pau', 'pau.personnel_profile_id = p.id AND pau.is_active = 1', 'left')
            ->join('administrative_units au', 'au.id = pau.administrative_unit_id', 'left')
            ->where('p.id', $profileId)
            ->where('p.account_type', 'personnel')
            ->get()->getRowArray();

        if ($row === null) {
            return $this->respond(['error' => ['code' => 'PERSONNEL_NOT_FOUND', 'message' => 'Personnel profile not found.']], 404);
        }

        $dto = $this->facultyStatusService->buildMasterDataDto($row);
        return $this->respond(['data' => $dto], 200);
    }

    /**
     * PUT /api/v1/hr/personnel/{id}/master-data
     * Plan D — Phase D2: HR-Only Master Data & Faculty Status Update.
     */
    public function updateMasterData(string $profileId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }
        if (! $this->requireHrAdmin($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only HR Admin may update personnel master data.']], 403);
        }

        if (! ValidationHelper::validateUuid($profileId)) {
            return $this->respond(['error' => ['code' => 'INVALID_PROFILE_ID', 'message' => 'Invalid personnel profile ID UUID.']], 422);
        }

        $json = $this->request->getJSON(true) ?? [];
        $validation = $this->facultyStatusService->validateMasterDataPayload($json);
        if (! $validation['valid']) {
            return $this->respond(['error' => $validation['error']], 422);
        }

        $db = db_connect();
        $targetProfile = $db->table('profiles')->where('id', $profileId)->where('account_type', 'personnel')->get()->getRowArray();
        if ($targetProfile === null) {
            return $this->respond(['error' => ['code' => 'PERSONNEL_NOT_FOUND', 'message' => 'Active personnel profile not found.']], 404);
        }

        $currentPersonnel = $db->table('personnel_profiles')->where('profile_id', $profileId)->get()->getRowArray();
        if ($currentPersonnel === null) {
            return $this->respond(['error' => ['code' => 'PERSONNEL_PROFILE_NOT_FOUND', 'message' => 'Personnel profile record missing.']], 404);
        }

        $now = date('Y-m-d H:i:s');
        $priorEngagement = $currentPersonnel['faculty_engagement'] ?? null;
        $priorStatus     = $currentPersonnel['employment_status'] ?? 'permanent';
        $priorPosition   = $currentPersonnel['position_title'] ?? ($targetProfile['designation_title'] ?? '');
        $priorRank       = $currentPersonnel['current_rank_title'] ?? ($currentPersonnel['rank_level'] ?? '');

        $db->transBegin();
        try {
            $updateData = [
                'employment_status'     => $validation['employment_status'],
                'position_title'        => $validation['position_title'],
                'current_rank_title'    => $validation['current_rank_title'],
                'rank_level'            => $validation['current_rank_title'],
                'qualification_summary' => $validation['qualification_summary'],
                'updated_at'            => $now,
            ];

            if ($validation['faculty_engagement'] !== null) {
                $updateData['faculty_engagement'] = $validation['faculty_engagement'];
            }

            $db->table('personnel_profiles')->where('profile_id', $profileId)->update($updateData);

            // Sync profiles designation_title
            $db->table('profiles')->where('id', $profileId)->update([
                'designation_title' => $validation['position_title'],
                'updated_at'        => $now,
            ]);

            // Audit Trail
            if ($db->tableExists('account_lifecycle_events')) {
                $db->table('account_lifecycle_events')->insert([
                    'id'           => $this->genUuid(),
                    'profile_id'   => $profileId,
                    'event_type'   => 'master_data_updated',
                    'performed_by' => $actor['profile']['id'],
                    'reason'       => json_encode([
                        'prior_engagement' => $priorEngagement,
                        'new_engagement'   => $validation['faculty_engagement'],
                        'prior_status'     => $priorStatus,
                        'new_status'       => $validation['employment_status'],
                        'prior_position'   => $priorPosition,
                        'new_position'     => $validation['position_title'],
                        'prior_rank'       => $priorRank,
                        'new_rank'         => $validation['current_rank_title'],
                        'justification'    => trim((string) ($json['reason'] ?? 'HR Admin updated faculty status and master data.')),
                    ]),
                    'occurred_at'  => $now,
                ]);
            }

            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->respond(['error' => ['code' => 'UPDATE_FAILED', 'message' => 'Failed to update personnel master data: ' . $e->getMessage()]], 500);
        }

        return $this->respond([
            'data' => [
                'message'                  => 'Personnel master data updated successfully.',
                'profile_id'               => $profileId,
                'faculty_engagement'       => $validation['faculty_engagement'],
                'faculty_engagement_label' => $validation['faculty_engagement_label'],
                'employment_status'        => $validation['employment_status'],
                'employment_status_label'  => $validation['employment_status_label'],
                'position_title'           => $validation['position_title'],
                'current_rank_title'       => $validation['current_rank_title'],
                'qualification_summary'    => $validation['qualification_summary'],
                'updated_at'               => $now,
            ],
        ], 200);
    }

    /**
     * PUT /api/v1/hr/personnel/{id}/classification
     * Plan D — Phase D1: HR-Only Personnel Classification Update.
     */
    public function updateClassification(string $profileId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }
        if (! $this->requireHrAdmin($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only HR Admin may update personnel classifications.']], 403);
        }

        if (! ValidationHelper::validateUuid($profileId)) {
            return $this->respond(['error' => ['code' => 'INVALID_PROFILE_ID', 'message' => 'Invalid personnel profile ID UUID.']], 422);
        }

        $json = $this->request->getJSON(true) ?? [];
        $group = $json['personnel_group'] ?? null;
        $side = $json['organizational_side'] ?? ($json['personnel_classification'] ?? null);
        $reason = trim((string) ($json['reason'] ?? ''));

        $validation = $this->classificationService->validatePair($group, $side);
        if (! $validation['valid']) {
            return $this->respond(['error' => $validation['error']], 422);
        }

        $db = db_connect();
        $targetProfile = $db->table('profiles')->where('id', $profileId)->where('account_type', 'personnel')->get()->getRowArray();
        if ($targetProfile === null) {
            return $this->respond(['error' => ['code' => 'PERSONNEL_NOT_FOUND', 'message' => 'Active personnel profile not found.']], 404);
        }

        $currentPersonnel = $db->table('personnel_profiles')->where('profile_id', $profileId)->get()->getRowArray();
        if ($currentPersonnel === null) {
            return $this->respond(['error' => ['code' => 'PERSONNEL_PROFILE_NOT_FOUND', 'message' => 'Personnel profile record missing.']], 404);
        }

        $now = date('Y-m-d H:i:s');
        $priorGroup = $currentPersonnel['personnel_group'] ?? ($currentPersonnel['personnel_classification'] === 'academic' ? 'faculty' : 'non_teaching_faculty');
        $priorSide  = $currentPersonnel['organizational_side'] ?? $currentPersonnel['personnel_classification'];

        $db->transBegin();
        try {
            $updateData = [
                'personnel_classification' => $validation['side'],
                'updated_at'               => $now,
            ];

            if ($db->fieldExists('personnel_group', 'personnel_profiles')) {
                $updateData['personnel_group'] = $validation['group'];
            }
            if ($db->fieldExists('organizational_side', 'personnel_profiles')) {
                $updateData['organizational_side'] = $validation['side'];
            }

            $db->table('personnel_profiles')->where('profile_id', $profileId)->update($updateData);

            // Audit Trail
            if ($db->tableExists('account_lifecycle_events')) {
                $db->table('account_lifecycle_events')->insert([
                    'id'           => $this->genUuid(),
                    'profile_id'   => $profileId,
                    'event_type'   => 'classification_updated',
                    'performed_by' => $actor['profile']['id'],
                    'reason'       => json_encode([
                        'prior_group'         => $priorGroup,
                        'prior_side'          => $priorSide,
                        'new_group'           => $validation['group'],
                        'new_side'            => $validation['side'],
                        'classification_code' => $validation['code'],
                        'justification'       => $reason ?: 'HR Admin updated personnel classification.',
                    ]),
                    'occurred_at'  => $now,
                ]);
            }

            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->respond(['error' => ['code' => 'UPDATE_FAILED', 'message' => 'Failed to update personnel classification: ' . $e->getMessage()]], 500);
        }

        return $this->respond([
            'data' => [
                'message'             => 'Personnel classification updated successfully.',
                'profile_id'          => $profileId,
                'personnel_group'     => $validation['group'],
                'organizational_side' => $validation['side'],
                'classification_code' => $validation['code'],
                'classification_label'=> $validation['label'],
                'updated_at'          => $now,
            ],
        ], 200);
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
