<?php

namespace App\Controllers\Api;

use App\Helpers\ValidationHelper;
use App\Services\AccountLifecycleResolver;
use App\Services\AuthorizationService;
use App\Services\FacultyStatusService;
use App\Services\PersonnelClassificationService;
use App\Services\PersonnelLoginReadinessService;
use App\Services\DeanAssignmentService;
use App\Services\DepartmentSecretaryOccupancyService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class TargetHRPersonnelController extends Controller
{
    use ResponseTrait;

    protected AuthorizationService $authz;
    protected PersonnelClassificationService $classificationService;
    protected FacultyStatusService $facultyStatusService;
    protected \App\Services\PersonnelImportService $importService;
    protected PersonnelLoginReadinessService $loginReadinessService;
    protected DeanAssignmentService $deanAssignmentService;
    protected DepartmentSecretaryOccupancyService $secretaryOccupancyService;

    public function __construct(
        ?AuthorizationService $authz = null,
        ?PersonnelClassificationService $classificationService = null,
        ?FacultyStatusService $facultyStatusService = null,
        ?\App\Services\PersonnelImportService $importService = null,
        ?PersonnelLoginReadinessService $loginReadinessService = null,
        ?DeanAssignmentService $deanAssignmentService = null,
        ?DepartmentSecretaryOccupancyService $secretaryOccupancyService = null
    ) {
        $this->authz = $authz ?? new AuthorizationService();
        $this->classificationService = $classificationService ?? new PersonnelClassificationService();
        $this->facultyStatusService = $facultyStatusService ?? new FacultyStatusService();
        $this->importService = $importService ?? new \App\Services\PersonnelImportService();
        $this->loginReadinessService = $loginReadinessService ?? new PersonnelLoginReadinessService();
        $this->deanAssignmentService = $deanAssignmentService ?? new DeanAssignmentService();
        $this->secretaryOccupancyService = $secretaryOccupancyService ?? new DepartmentSecretaryOccupancyService();
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
        $requestStartedAt = microtime(true);
        $actor = $this->resolveActor();
        $authDurationMs = (microtime(true) - $requestStartedAt) * 1000;
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated active session required.']], 401);
        }
        if (! $this->requireHrAdmin($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Admin access required.']], 403);
        }

        $db = db_connect();
        $databaseStartedAt = microtime(true);
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
            'p.designation_title AS designation', 'p.status', 'p.account_type',
            '1 AS profile_exists', '1 AS has_personnel_profile',
            '(lac.profile_id IS NOT NULL) AS has_credential',
            "(COALESCE(lac.password_hash, '') <> '') AS has_password_hash",
            'lac.status AS credential_status',
            'lac.must_change_password AS credential_must_change_password',
            "CASE WHEN lac.profile_id IS NULL THEN 'missing' WHEN lac.must_change_password IS NULL THEN 'invalid' ELSE 'valid' END AS credential_integrity_status",
            'p.created_at',
            'pp.personnel_classification',
            'pp.employment_status',
            'pp.employment_start_date',
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
            "(SELECT COUNT(*) FROM profile_roles pr2 JOIN roles r2 ON r2.id=pr2.role_id
               WHERE pr2.profile_id=p.id AND pr2.is_active=1 AND r2.role_key='personnel') AS active_personnel_roles",
            "(SELECT COUNT(*) FROM dean_assignments da2 WHERE da2.personnel_profile_id=p.id AND da2.is_active=1) AS active_dean_assignments",
            "(SELECT COUNT(*) FROM program_coordinator_assignments ca2 WHERE ca2.personnel_profile_id=p.id AND ca2.is_active=1) AS active_coordinator_assignments",
            "(SELECT COUNT(*) FROM organization_moderator_assignments ma2 WHERE ma2.personnel_profile_id=p.id AND ma2.is_active=1) AS active_moderator_assignments",
            "(SELECT COUNT(*) FROM profiles pe WHERE LOWER(TRIM(pe.email))=LOWER(TRIM(p.email))) AS duplicate_email_count",
            "(SELECT COUNT(*) FROM profiles pi WHERE pi.institutional_id=p.institutional_id) AS duplicate_employee_id_count",
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

        $profileIds = array_values(array_filter(array_column($rows, 'id')));
        $programsByProfile = [];
        $rolesByProfile = [];
        $evaluationsByProfile = [];

        if ($profileIds !== []) {
            $programRows = $db->table('personnel_program_affiliations ppa')
                ->select('ppa.personnel_profile_id, ap.id AS academic_program_id, ap.code, ap.name')
                ->join('academic_programs ap', 'ap.id = ppa.academic_program_id')
                ->whereIn('ppa.personnel_profile_id', $profileIds)
                ->where('ppa.is_active', 1)
                ->orderBy('ap.code', 'ASC')
                ->get()->getResultArray();
            foreach ($programRows as $programRow) {
                $programsByProfile[$programRow['personnel_profile_id']][] = [
                    'academic_program_id' => $programRow['academic_program_id'],
                    'code' => $programRow['code'],
                    'name' => $programRow['name'],
                ];
            }

            foreach ([
                ['dean_assignments', 'dean'],
                ['program_coordinator_assignments', 'program_coordinator'],
                ['organization_moderator_assignments', 'organization_moderator'],
            ] as [$table, $roleKey]) {
                $assignmentRows = $db->table($table)
                    ->select('personnel_profile_id')
                    ->whereIn('personnel_profile_id', $profileIds)
                    ->where('is_active', 1)
                    ->get()->getResultArray();
                foreach ($assignmentRows as $assignmentRow) {
                    $rolesByProfile[$assignmentRow['personnel_profile_id']][] = $roleKey;
                }
            }

            $evaluationRows = $db->table('personnel_evaluations')
                ->select('personnel_profile_id, status, evaluation_cycle_id, total_score, created_at')
                ->whereIn('personnel_profile_id', $profileIds)
                ->orderBy('created_at', 'DESC')
                ->get()->getResultArray();
            foreach ($evaluationRows as $evaluationRow) {
                $profileId = $evaluationRow['personnel_profile_id'];
                if (! isset($evaluationsByProfile[$profileId])) {
                    $evaluationsByProfile[$profileId] = $evaluationRow;
                }
            }
        }

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
            $row['login_readiness']             = $this->loginReadinessService->evaluate($row);

            unset(
                $row['profile_exists'],
                $row['has_personnel_profile'],
                $row['has_credential'],
                $row['has_password_hash'],
                $row['credential_status'],
                $row['credential_must_change_password'],
                $row['active_personnel_roles'],
                $row['active_dean_assignments'],
                $row['active_coordinator_assignments'],
                $row['active_moderator_assignments'],
                $row['duplicate_email_count'],
                $row['duplicate_employee_id_count']
            );

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
            $row['employment_start_date']       = $dto['employment_start_date'];
            $row['service_duration']            = $dto['service_duration'];
            $row['is_dean_review_eligible']     = $dto['is_dean_review_eligible'];

            $row['program_affiliations'] = $programsByProfile[$row['id']] ?? [];
            $row['assigned_roles'] = array_values(array_unique($rolesByProfile[$row['id']] ?? []));

            // Authoritative Reviewer Routing Resolution
            $routing = \App\Services\PersonnelReviewerRoutingRegistry::resolveReviewerRoute([
                'personnel_group'     => $row['personnel_group'],
                'organizational_side' => $row['organizational_side'],
                'is_dean'             => in_array('dean', $row['assigned_roles'], true),
                'college_id'          => $row['college_id'] ?? null,
            ]);
            $row['reviewer_route'] = $routing['authorized_reviewer_role'] ?? 'unresolved';
            $row['reviewer_scope_type'] = $routing['scope_type'] ?? 'UNRESOLVED_SCOPE';

            // Latest Evaluation Record (Real Persisted Data)
            $evalRecord = $evaluationsByProfile[$row['id']] ?? null;
            $row['latest_evaluation_status'] = $evalRecord['status'] ?? 'not_started';
            $row['latest_evaluation_cycle']  = $evalRecord['evaluation_cycle_id'] ?? null;
            $row['latest_evaluation_score']  = $evalRecord['total_score'] ?? null;
        }
        unset($row);

        $databaseDurationMs = (microtime(true) - $databaseStartedAt) * 1000;
        $this->recordPerformanceTiming($requestStartedAt, $authDurationMs, $databaseDurationMs, $profileIds === [] ? 8 : 13);

        return $this->respond(['data' => [
            'total'     => $total,
            'page'      => $pagination['page'],
            'per_page'  => $pagination['per_page'],
            'personnel' => $rows,
        ]], 200);
    }

    private function recordPerformanceTiming(
        float $requestStartedAt,
        float $authDurationMs,
        float $databaseDurationMs,
        int $queryCount
    ): void {
        if (ENVIRONMENT !== 'development') {
            return;
        }

        $totalDurationMs = (microtime(true) - $requestStartedAt) * 1000;
        $requestId = $this->request->getHeaderLine('X-Request-ID') ?: bin2hex(random_bytes(8));
        $this->response
            ->setHeader('X-Request-ID', $requestId)
            ->setHeader('X-Query-Count', (string) $queryCount)
            ->setHeader('Server-Timing', sprintf(
                'auth;dur=%.1f, db;dur=%.1f, total;dur=%.1f',
                $authDurationMs,
                $databaseDurationMs,
                $totalDurationMs
            ));

        log_message('info', sprintf(
            '[PERF] request_id=%s route="GET /api/v1/hr/personnel" auth_ms=%.1f database_ms=%.1f total_ms=%.1f queries=%d',
            $requestId,
            $authDurationMs,
            $databaseDurationMs,
            $totalDurationMs,
            $queryCount
        ));
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
                'pp.personnel_classification', 'pp.employment_status', 'pp.employment_start_date',
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
        $priorEmploymentStartDate = $currentPersonnel['employment_start_date'] ?? null;
        $priorPosition   = $currentPersonnel['position_title'] ?? ($targetProfile['designation_title'] ?? '');
        $priorRank       = $currentPersonnel['current_rank_title'] ?? ($currentPersonnel['rank_level'] ?? '');

        $db->transBegin();
        try {
            $collegeAffiliation = $db->table('personnel_college_affiliations')
                ->select('college_id')->where('personnel_profile_id', $profileId)->where('is_active', 1)->get()->getRowArray();
            $unitAffiliation = $db->table('personnel_administrative_unit_affiliations')
                ->select('administrative_unit_id')->where('personnel_profile_id', $profileId)->where('is_active', 1)->get()->getRowArray();
            $secretaryConflict = $this->secretaryOccupancyService->findConflict(
                $db,
                $validation['position_title'],
                $collegeAffiliation['college_id'] ?? null,
                $unitAffiliation['administrative_unit_id'] ?? null,
                $profileId
            );
            if ($secretaryConflict !== null) {
                throw new \DomainException(json_encode($secretaryConflict));
            }
            $updateData = [
                'employment_status'     => $validation['employment_status'],
                'employment_start_date' => $validation['employment_start_date'],
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
                        'prior_employment_start_date' => $priorEmploymentStartDate,
                        'new_employment_start_date' => $validation['employment_start_date'],
                        'employment_start_date_changed' => $priorEmploymentStartDate !== $validation['employment_start_date'],
                        'employment_status_changed' => $priorStatus !== $validation['employment_status'],
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
            if ($e instanceof \DomainException) {
                $details = json_decode($e->getMessage(), true);
                if (is_array($details) && ($details['code'] ?? null) === 'POSITION_OCCUPIED') {
                    return $this->respond(['error' => $details], 409);
                }
            }
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
                'employment_start_date'    => $validation['employment_start_date'],
                'service_duration'         => (new \App\Services\EmploymentServiceDurationService())->calculate($validation['employment_start_date']),
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

        $effectiveFrom = trim((string) ($json['effective_date'] ?? date('Y-m-d')));
        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $effectiveFrom)) {
            return $this->respond(['error' => ['code' => 'INVALID_EFFECTIVE_DATE', 'message' => 'Effective Date must use YYYY-MM-DD format.']], 422);
        }
        $result = $this->deanAssignmentService->assign($profileId, $collegeId, $actor['profile']['id'], $effectiveFrom);
        if (! $result['success']) return $this->respond(['error' => $result['error']], $result['status']);
        return $this->respondCreated(['data' => ['message' => 'Dean assignment created.', ...$result['data']]]);
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

    /**
     * GET /api/v1/hr/personnel/import/template
     * Generates and downloads the authoritative XLSX batch import template.
     */
    public function downloadTemplate(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }
        if (!$this->requireHrAdmin($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Admin access required.']], 403);
        }

        $xlsxContent = $this->importService->generateTemplate();

        return $this->response
            ->setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            ->setHeader('Content-Disposition', 'attachment; filename="AchieveNest_Personnel_Import_Template.xlsx"')
            ->setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->setBody($xlsxContent);
    }

    /**
     * POST /api/v1/hr/personnel/import/preview
     * Parses uploaded XLSX or JSON rows and returns row-by-row validation preview.
     */
    public function previewImport(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }
        if (!$this->requireHrAdmin($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Admin access required.']], 403);
        }

        $rawRows = [];
        $file = $this->request->getFile('file');
        if ($file !== null && $file->isValid()) {
            $ext = strtolower($file->getClientExtension());
            if (!in_array($ext, ['xlsx', 'csv'], true)) {
                return $this->respond(['error' => ['code' => 'INVALID_FILE_FORMAT', 'message' => 'Only .xlsx and .csv files are supported.']], 422);
            }
            try {
                $rawRows = $this->importService->parseFile($file->getTempName(), $file->getClientMimeType());
            } catch (Throwable $e) {
                return $this->respond(['error' => ['code' => 'PARSE_ERROR', 'message' => $e->getMessage()]], 422);
            }
        } else {
            $json = $this->request->getJSON(true);
            $rawRows = is_array($json) ? ($json['rows'] ?? $json) : [];
        }

        if (empty($rawRows) || !is_array($rawRows)) {
            return $this->respond(['error' => ['code' => 'EMPTY_FILE', 'message' => 'Uploaded file or payload contains no data rows.']], 422);
        }

        $previewResult = $this->importService->validateRows($rawRows);

        return $this->respond(['data' => $previewResult], 200);
    }

    /**
     * POST /api/v1/hr/personnel/import/commit
     * Commits validated rows with atomic transaction guarantees.
     */
    public function commitImport(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }
        if (!$this->requireHrAdmin($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Admin access required.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $rows = (array) ($json['rows'] ?? []);

        if (empty($rows)) {
            return $this->respond(['error' => ['code' => 'NO_ROWS_TO_COMMIT', 'message' => 'No valid rows provided to commit.']], 422);
        }

        try {
            $result = $this->importService->commitRows($rows, $actor);
            return $this->respondCreated(['data' => $result]);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'IMPORT_FAILED', 'message' => $e->getMessage()]], 500);
        }
    }
}
