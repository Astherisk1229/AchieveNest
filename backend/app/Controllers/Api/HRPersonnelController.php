<?php

namespace App\Controllers\Api;

use App\Helpers\ValidationHelper;
use App\Services\AuthenticatedActorService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;

/**
 * HRPersonnelController
 *
 * Provides the authoritative HR Personnel Directory and related governance endpoints:
 *   GET  /api/v1/hr/personnel             — Personnel Directory (paginated, filtered)
 *   POST /api/v1/hr/personnel/{id}/dean-role    — Assign Dean role
 *   DELETE /api/v1/hr/personnel/{id}/dean-role/{assignmentId} — Revoke Dean role
 *   POST /api/v1/hr/personnel/{id}/qualification-reviews  — Record qualification gate
 *   GET  /api/v1/hr/personnel/{id}/qualification-reviews  — List qualification reviews
 *   GET  /api/v1/hr/dashboard             — Live HR dashboard metrics
 *   GET  /api/v1/hr/audit                 — HR audit trail
 */
class HRPersonnelController extends Controller
{
    use ResponseTrait;

    protected AuthenticatedActorService $actorService;

    public function __construct(?AuthenticatedActorService $actorService = null)
    {
        $this->actorService = $actorService ?? new AuthenticatedActorService();
    }

    public function options(): mixed
    {
        return $this->respond(null, 204);
    }

    protected function resolveActor(): ?array
    {
        return $this->actorService->resolveActor($this->request->getHeaderLine('Authorization'));
    }

    /**
     * Confirms the actor is an active HR Admin with hr_staff role.
     */
    protected function requireHrAdmin(?array $actor): bool
    {
        if ($actor === null) {
            return false;
        }
        return ($actor['profile']['account_type'] ?? '') === 'hr_admin'
            && in_array('hr_staff', $actor['roles'], true);
    }

    // =========================================================================
    // GET /api/v1/hr/personnel
    // Authoritative Personnel Directory
    // =========================================================================
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

        // --- Query params ---
        $search   = trim((string) $this->request->getGet('search'));
        $collegeId = trim((string) $this->request->getGet('college_id'));
        $deptId    = trim((string) $this->request->getGet('department_id'));
        $status    = trim((string) $this->request->getGet('status'));
        $sortBy    = trim((string) ($this->request->getGet('sort_by') ?? 'full_name'));
        $sortDir   = ValidationHelper::validateSortDirection((string) ($this->request->getGet('sort_dir') ?? 'ASC'));
        $pagination = ValidationHelper::validatePagination(
            $this->request->getGet('page') ?? 1,
            $this->request->getGet('per_page') ?? 25
        );

        // Allowlist sort
        if (! ValidationHelper::validateSortColumn($sortBy)) {
            $sortBy = 'full_name';
        }

        // --- Build query ---
        $builder = $db->table('public.profiles p')
            ->select([
                'p.id',
                'p.institutional_id',
                'p.institutional_email',
                'p.full_name',
                'p.first_name',
                'p.middle_name',
                'p.last_name',
                'p.suffix',
                'p.designation',
                'p.status',
                'p.department_id',
                'p.must_change_password',
                'p.provisioned_at',
                'p.activated_at',
                'p.created_at',
                'd.name AS department_name',
                'd.college_id',
                'c.name AS college_name',
                // Latest active dean role assignment for this person
                "(SELECT c.name FROM public.profile_roles dr
                   JOIN public.roles rl ON rl.id = dr.role_id
                   LEFT JOIN public.colleges c ON c.id = dr.scope_id
                   WHERE dr.profile_id = p.id
                     AND rl.role_key = 'dean'
                     AND dr.is_active = true
                   LIMIT 1) AS dean_college_name",
                "(SELECT dr.id FROM public.profile_roles dr
                   JOIN public.roles rl ON rl.id = dr.role_id
                   WHERE dr.profile_id = p.id
                     AND rl.role_key = 'dean'
                     AND dr.is_active = true
                   LIMIT 1) AS dean_role_assignment_id",
                // Qualification gate status for current academic year (latest cleared or pending)
                "(SELECT qr.eligibility_decision
                   FROM public.personnel_qualification_reviews qr
                   WHERE qr.personnel_profile_id = p.id
                   ORDER BY qr.created_at DESC
                   LIMIT 1) AS latest_qualification_decision",
            ])
            ->join('public.departments d', 'd.id = p.department_id', 'left')
            ->join('public.colleges c', 'c.id = d.college_id', 'left')
            ->where('p.account_type', 'personnel');

        // Search
        if ($search !== '') {
            $safeLike = '%' . $db->escapeLikeString($search) . '%';
            $builder->groupStart()
                ->like('p.full_name', $search, 'both', true, true)
                ->orLike('p.institutional_id', $search, 'both', true, true)
                ->orLike('p.institutional_email', $search, 'both', true, true)
                ->groupEnd();
        }

        // Filters
        if ($deptId !== '') {
            $builder->where('p.department_id', $deptId);
        }
        if ($collegeId !== '') {
            $builder->where('d.college_id', $collegeId);
        }
        if ($status !== '' && in_array($status, ['active', 'suspended', 'archived'], true)) {
            $builder->where('p.status', $status);
        }

        // Total count
        $total = (clone $builder)->countAllResults(false);

        // Fetch page
        $results = $builder
            ->orderBy("p.{$sortBy}", $sortDir)
            ->limit($pagination['per_page'], $pagination['offset'])
            ->get()
            ->getResultArray();

        return $this->respond([
            'data' => [
                'total'    => $total,
                'page'     => $pagination['page'],
                'per_page' => $pagination['per_page'],
                'personnel' => $results,
            ],
        ], 200);
    }

    // =========================================================================
    // POST /api/v1/hr/personnel/{id}/dean-role
    // Assign Dean role to a Personnel (college-scoped)
    // =========================================================================
    public function assignDean(string $profileId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated active session required.']], 401);
        }
        if (! $this->requireHrAdmin($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only HR Admin may assign Dean roles.']], 403);
        }

        if (! ValidationHelper::validateUuid($profileId)) {
            return $this->respond(['error' => ['code' => 'INVALID_PROFILE_ID', 'message' => 'Invalid personnel profile ID.']], 422);
        }

        $json = $this->request->getJSON(true) ?? [];
        $collegeId = trim((string) ($json['college_id'] ?? ''));

        if (! ValidationHelper::validateUuid($collegeId)) {
            return $this->respond(['error' => ['code' => 'INVALID_COLLEGE_ID', 'message' => 'A valid college_id UUID is required.']], 422);
        }

        $db = db_connect();

        // Verify target profile is active Personnel
        $target = $db->table('public.profiles')
            ->where('id', $profileId)
            ->where('account_type', 'personnel')
            ->where('status', 'active')
            ->get()
            ->getRowArray();

        if ($target === null) {
            return $this->respond(['error' => ['code' => 'PERSONNEL_NOT_FOUND', 'message' => 'Active personnel account not found.']], 404);
        }

        // Verify college exists
        $college = $db->table('public.colleges')
            ->where('id', $collegeId)
            ->get()
            ->getRowArray();

        if ($college === null) {
            return $this->respond(['error' => ['code' => 'COLLEGE_NOT_FOUND', 'message' => 'Specified college not found.']], 422);
        }

        $deanRole = $db->table('public.roles')
            ->where('role_key', 'dean')
            ->get()
            ->getRowArray();

        if ($deanRole === null) {
            return $this->respond(['error' => ['code' => 'ROLE_NOT_FOUND', 'message' => 'Dean role definition missing from catalog.']], 500);
        }

        // Block duplicate active dean for same person+college
        $existing = $db->table('public.profile_roles')
            ->where('profile_id', $profileId)
            ->where('role_id', $deanRole['id'])
            ->where('scope_type', 'college')
            ->where('scope_id', $collegeId)
            ->where('is_active', true)
            ->get()
            ->getRowArray();

        if ($existing !== null) {
            return $this->respond(['error' => ['code' => 'DUPLICATE_DEAN_ASSIGNMENT', 'message' => 'This Personnel already has an active Dean role for this college.']], 409);
        }

        $db->transBegin();
        try {
            // Revoke any existing active dean role for this person in any college
            $existingAny = $db->table('public.profile_roles pr')
                ->join('public.roles r', 'r.id = pr.role_id')
                ->where('pr.profile_id', $profileId)
                ->where('r.role_key', 'dean')
                ->where('pr.is_active', true)
                ->get()
                ->getResultArray();

            foreach ($existingAny as $old) {
                $db->table('public.profile_roles')
                    ->where('id', $old['id'])
                    ->update([
                        'is_active'  => false,
                        'revoked_at' => date('Y-m-d H:i:s'),
                    ]);

                $db->table('public.role_assignment_events')->insert([
                    'target_profile_id' => $profileId,
                    'role_id'           => $deanRole['id'],
                    'event_type'        => 'revoked',
                    'profile_role_id'   => $old['id'],
                    'scope_type'        => $old['scope_type'],
                    'scope_id'          => $old['scope_id'],
                    'performed_by'      => $actor['profile']['id'],
                    'occurred_at'       => date('Y-m-d H:i:s'),
                    'reason'            => 'Automatically revoked on Dean scope change',
                ]);
            }

            // Assign new dean role
            $db->table('public.profile_roles')->insert([
                'profile_id'  => $profileId,
                'role_id'     => $deanRole['id'],
                'scope_type'  => 'college',
                'scope_id'    => $collegeId,
                'is_active'   => true,
                'assigned_by' => $actor['profile']['id'],
                'assigned_at' => date('Y-m-d H:i:s'),
            ]);

            $newAssignment = $db->table('public.profile_roles')
                ->where('profile_id', $profileId)
                ->where('role_id', $deanRole['id'])
                ->where('scope_id', $collegeId)
                ->where('is_active', true)
                ->orderBy('assigned_at', 'DESC')
                ->get()
                ->getRowArray();

            $db->table('public.role_assignment_events')->insert([
                'target_profile_id' => $profileId,
                'profile_role_id'   => $newAssignment['id'] ?? null,
                'role_id'           => $deanRole['id'],
                'event_type'        => 'assigned',
                'scope_type'        => 'college',
                'scope_id'          => $collegeId,
                'performed_by'      => $actor['profile']['id'],
                'occurred_at'       => date('Y-m-d H:i:s'),
                'reason'            => "Assigned as Dean for college: {$college['name']}",
            ]);

            $db->transCommit();
        } catch (\Throwable $e) {
            $db->transRollback();
            return $this->respond(['error' => ['code' => 'ASSIGNMENT_FAILED', 'message' => 'Failed to assign Dean role: ' . $e->getMessage()]], 500);
        }

        return $this->respond([
            'data' => [
                'message'     => "Dean role assigned for college: {$college['name']}",
                'profile_id'  => $profileId,
                'college_id'  => $collegeId,
                'college_name' => $college['name'],
                'assignment_id' => $newAssignment['id'] ?? null,
            ],
        ], 201);
    }

    // =========================================================================
    // DELETE /api/v1/hr/personnel/{id}/dean-role/{assignmentId}
    // Revoke Dean role assignment
    // =========================================================================
    public function revokeDean(string $profileId, string $assignmentId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated active session required.']], 401);
        }
        if (! $this->requireHrAdmin($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only HR Admin may revoke Dean roles.']], 403);
        }

        if (! ValidationHelper::validateUuid($profileId) || ! ValidationHelper::validateUuid($assignmentId)) {
            return $this->respond(['error' => ['code' => 'INVALID_IDS', 'message' => 'Invalid profile or assignment ID.']], 422);
        }

        $db = db_connect();

        $assignment = $db->table('public.profile_roles pr')
            ->join('public.roles r', 'r.id = pr.role_id')
            ->select('pr.*, r.role_key')
            ->where('pr.id', $assignmentId)
            ->where('pr.profile_id', $profileId)
            ->where('r.role_key', 'dean')
            ->where('pr.is_active', true)
            ->get()
            ->getRowArray();

        if ($assignment === null) {
            return $this->respond(['error' => ['code' => 'ASSIGNMENT_NOT_FOUND', 'message' => 'Active Dean assignment not found.']], 404);
        }

        $db->transBegin();
        try {
            $db->table('public.profile_roles')
                ->where('id', $assignmentId)
                ->update([
                    'is_active'  => false,
                    'revoked_at' => date('Y-m-d H:i:s'),
                ]);

            $db->table('public.role_assignment_events')->insert([
                'target_profile_id' => $profileId,
                'profile_role_id'   => $assignmentId,
                'role_id'           => $assignment['role_id'],
                'event_type'        => 'revoked',
                'scope_type'        => $assignment['scope_type'],
                'scope_id'          => $assignment['scope_id'],
                'performed_by'      => $actor['profile']['id'],
                'occurred_at'       => date('Y-m-d H:i:s'),
                'reason'            => 'Dean role revoked by HR Admin',
            ]);

            $db->transCommit();
        } catch (\Throwable $e) {
            $db->transRollback();
            return $this->respond(['error' => ['code' => 'REVOCATION_FAILED', 'message' => 'Failed to revoke Dean role: ' . $e->getMessage()]], 500);
        }

        return $this->respond([
            'data' => [
                'message'       => 'Dean role successfully revoked.',
                'assignment_id' => $assignmentId,
                'profile_id'    => $profileId,
            ],
        ], 200);
    }

    // =========================================================================
    // POST /api/v1/hr/personnel/{id}/qualification-reviews
    // Record the Prerequisite Qualification Report gate decision
    // =========================================================================
    public function recordQualification(string $profileId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated active session required.']], 401);
        }
        if (! $this->requireHrAdmin($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only HR Admin may record qualification reviews.']], 403);
        }

        if (! ValidationHelper::validateUuid($profileId)) {
            return $this->respond(['error' => ['code' => 'INVALID_PROFILE_ID', 'message' => 'Invalid personnel profile ID.']], 422);
        }

        $json = $this->request->getJSON(true) ?? [];

        // Required fields
        $academicYear       = trim((string) ($json['academic_year'] ?? ''));
        $eligibilityDecision = trim((string) ($json['eligibility_decision'] ?? ''));
        $reportLabel        = 'Prerequisite Qualification Report';
        $benchmarkType      = trim((string) ($json['benchmark_type'] ?? ''));
        $benchmarkPayload   = $json['benchmark_payload'] ?? [];
        $benchmarkReference = trim((string) ($json['benchmark_reference'] ?? ''));
        $actualResultPayload = $json['actual_result_payload'] ?? [];
        $decisionBasis      = trim((string) ($json['decision_basis'] ?? ''));
        $reportReference    = trim((string) ($json['report_reference'] ?? ''));
        $reportVersion      = trim((string) ($json['report_version'] ?? '1'));
        $evaluationPeriod   = trim((string) ($json['evaluation_period'] ?? ''));
        $remarks            = trim((string) ($json['remarks'] ?? ''));
        $evaluatedAt        = trim((string) ($json['evaluated_at'] ?? date('Y-m-d')));

        // Validate required fields
        if (! ValidationHelper::validateAcademicYear($academicYear)) {
            return $this->respond(['error' => ['code' => 'INVALID_ACADEMIC_YEAR', 'message' => 'academic_year must be in format YYYY-YYYY (consecutive years).']], 422);
        }

        if (! ValidationHelper::validateEnum($eligibilityDecision, ['pending', 'cleared', 'not_cleared'])) {
            return $this->respond(['error' => ['code' => 'INVALID_ELIGIBILITY_DECISION', 'message' => 'eligibility_decision must be one of: pending, cleared, not_cleared.']], 422);
        }

        if ($reportLabel === '' || strlen($reportLabel) > ValidationHelper::MAX_LABEL_LENGTH) {
            return $this->respond(['error' => ['code' => 'INVALID_REPORT_LABEL', 'message' => 'report_label is required and must not exceed ' . ValidationHelper::MAX_LABEL_LENGTH . ' characters.']], 422);
        }

        if ($remarks !== '' && strlen($remarks) > ValidationHelper::MAX_REMARKS_LENGTH) {
            return $this->respond(['error' => ['code' => 'REMARKS_TOO_LONG', 'message' => 'Remarks must not exceed ' . ValidationHelper::MAX_REMARKS_LENGTH . ' characters.']], 422);
        }

        if (! is_array($benchmarkPayload) || ! is_array($actualResultPayload)) {
            return $this->respond(['error' => ['code' => 'INVALID_QUALIFICATION_PAYLOAD', 'message' => 'benchmark_payload and actual_result_payload must be JSON objects.']], 422);
        }

        if ($eligibilityDecision !== 'pending'
            && ($benchmarkReference === '' || $decisionBasis === '' || $reportVersion === '')) {
            return $this->respond(['error' => ['code' => 'INCOMPLETE_DECISION_BASIS', 'message' => 'A final eligibility decision requires benchmark_reference, report_version, and decision_basis.']], 422);
        }

        $db = db_connect();

        // Verify target is active Personnel
        $target = $db->table('public.profiles')
            ->where('id', $profileId)
            ->where('account_type', 'personnel')
            ->where('status', 'active')
            ->get()
            ->getRowArray();

        if ($target === null) {
            return $this->respond(['error' => ['code' => 'PERSONNEL_NOT_FOUND', 'message' => 'Personnel profile not found.']], 404);
        }

        try {
            $db->table('public.personnel_qualification_reviews')->insert([
                'personnel_profile_id' => $profileId,
                'academic_year'        => $academicYear,
                'evaluation_period'    => $evaluationPeriod ?: null,
                'report_label'         => $reportLabel,
                'report_reference'     => $reportReference ?: null,
                'report_version'       => $reportVersion,
                'benchmark_type'       => $benchmarkType ?: null,
                'benchmark_payload'    => json_encode($benchmarkPayload),
                'benchmark_reference'  => $benchmarkReference ?: null,
                'actual_result_payload' => json_encode($actualResultPayload),
                'eligibility_decision' => $eligibilityDecision,
                'status'               => $eligibilityDecision,
                'decision_basis'       => $decisionBasis ?: null,
                'remarks'              => $remarks ?: null,
                'recorded_by'          => $actor['profile']['id'],
                'evaluated_at'         => $evaluatedAt ?: null,
                'created_at'           => date('Y-m-d H:i:s'),
                'updated_at'           => date('Y-m-d H:i:s'),
            ]);
        } catch (\Throwable $e) {
            // If unique constraint violation, clarify the error
            if (str_contains($e->getMessage(), 'uq_qualification_review_personnel_year')) {
                return $this->respond(['error' => ['code' => 'DUPLICATE_REVIEW', 'message' => 'A cleared or pending qualification review already exists for this Personnel and academic year.']], 409);
            }
            return $this->respond(['error' => ['code' => 'RECORD_FAILED', 'message' => 'Failed to record qualification review: ' . $e->getMessage()]], 500);
        }

        $created = $db->table('public.personnel_qualification_reviews')
            ->where('personnel_profile_id', $profileId)
            ->where('academic_year', $academicYear)
            ->orderBy('created_at', 'DESC')
            ->get()
            ->getRowArray();

        return $this->respond([
            'data' => [
                'message'              => 'Qualification review recorded successfully.',
                'id'                   => $created['id'] ?? null,
                'eligibility_decision' => $eligibilityDecision,
                'report_label'         => $reportLabel,
                'academic_year'        => $academicYear,
                'personnel_profile_id' => $profileId,
                'recorded_by'          => $actor['profile']['id'],
            ],
        ], 201);
    }

    // =========================================================================
    // GET /api/v1/hr/personnel/{id}/qualification-reviews
    // List all qualification reviews for a Personnel
    // =========================================================================
    public function listQualificationReviews(string $profileId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated active session required.']], 401);
        }
        if (! $this->requireHrAdmin($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Admin access required.']], 403);
        }

        if (! ValidationHelper::validateUuid($profileId)) {
            return $this->respond(['error' => ['code' => 'INVALID_PROFILE_ID', 'message' => 'Invalid personnel profile ID.']], 422);
        }

        $db = db_connect();
        $reviews = $db->table('public.personnel_qualification_reviews qr')
            ->select('qr.*, rec.full_name AS recorded_by_name')
            ->join('public.profiles rec', 'rec.id = qr.recorded_by', 'left')
            ->where('qr.personnel_profile_id', $profileId)
            ->orderBy('qr.created_at', 'DESC')
            ->get()
            ->getResultArray();

        return $this->respond([
            'data' => [
                'personnel_profile_id' => $profileId,
                'reviews'  => $reviews,
                'total'    => count($reviews),
            ],
        ], 200);
    }

    // =========================================================================
    // GET /api/v1/hr/dashboard
    // Live HR dashboard metrics
    // =========================================================================
    public function dashboard(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated active session required.']], 401);
        }
        if (! $this->requireHrAdmin($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Admin access required.']], 403);
        }

        $db = db_connect();

        $totalPersonnel = $db->table('public.profiles')
            ->where('account_type', 'personnel')
            ->where('status', 'active')
            ->countAllResults();

        $pendingPasswordResets = $db->table('public.password_reset_requests')
            ->where('assigned_office', 'hr')
            ->where('status', 'pending')
            ->countAllResults();

        $pendingQualificationReviews = $db->table('public.personnel_qualification_reviews')
            ->where('eligibility_decision', 'pending')
            ->countAllResults();

        // Evaluation status counts
        $evalStatusCounts = $db->query(
            "SELECT status, COUNT(*) AS cnt
             FROM public.personnel_evaluations
             GROUP BY status"
        )->getResultArray();

        $evalMap = array_column($evalStatusCounts, 'cnt', 'status');

        return $this->respond([
            'data' => [
                'total_personnel'              => (int) $totalPersonnel,
                'pending_password_resets'      => (int) $pendingPasswordResets,
                'pending_qualification_reviews' => (int) $pendingQualificationReviews,
                'evaluations' => [
                    'submitted'              => (int) ($evalMap['submitted'] ?? 0),
                    'in_evaluation'          => (int) ($evalMap['in_evaluation'] ?? 0),
                    'returned_for_revision'  => (int) ($evalMap['returned_for_revision'] ?? 0),
                    'ready_for_finalization' => (int) ($evalMap['ready_for_finalization'] ?? 0),
                    'completed'              => (int) ($evalMap['completed'] ?? 0),
                ],
            ],
        ], 200);
    }

    // =========================================================================
    // GET /api/v1/hr/audit
    // HR Audit Trail — aggregated from all event tables
    // =========================================================================
    public function audit(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated active session required.']], 401);
        }
        if (! $this->requireHrAdmin($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Admin access required.']], 403);
        }

        $db = db_connect();

        $filterProfileId = trim((string) $this->request->getGet('profile_id'));
        $filterEventType = trim((string) $this->request->getGet('event_type'));
        $fromDate        = trim((string) $this->request->getGet('from_date'));
        $toDate          = trim((string) $this->request->getGet('to_date'));
        $pagination      = ValidationHelper::validatePagination(
            $this->request->getGet('page') ?? 1,
            $this->request->getGet('per_page') ?? 50
        );

        // Build audit union query
        $conditions = [];
        $bindings   = [];

        // -- 1. account_lifecycle_events
        $lcWhere = "1=1";
        if ($filterProfileId !== '') {
            $lcWhere .= " AND ale.profile_id = ?";
            $bindings[] = $filterProfileId;
        }
        if ($fromDate !== '' && ValidationHelper::validateDateString($fromDate)) {
            $lcWhere .= " AND ale.occurred_at >= ?";
            $bindings[] = $fromDate . ' 00:00:00';
        }
        if ($toDate !== '' && ValidationHelper::validateDateString($toDate)) {
            $lcWhere .= " AND ale.occurred_at <= ?";
            $bindings[] = $toDate . ' 23:59:59';
        }

        $auditQuery = <<<SQL
          SELECT
            ale.id,
            'lifecycle' AS source_table,
            ale.event_type,
            ale.profile_id AS subject_profile_id,
            sp.full_name AS subject_name,
            ale.performed_by,
            pb.full_name AS performed_by_name,
            ale.reason AS detail,
            ale.occurred_at
          FROM public.account_lifecycle_events ale
          LEFT JOIN public.profiles sp ON sp.id = ale.profile_id
          LEFT JOIN public.profiles pb ON pb.id = ale.performed_by
          WHERE {$lcWhere}

        UNION ALL

          SELECT
            rae.id,
            'role_assignment' AS source_table,
            rae.event_type,
            rae.target_profile_id AS subject_profile_id,
            tp.full_name AS subject_name,
            rae.performed_by,
            pb.full_name AS performed_by_name,
            rae.reason AS detail,
            rae.occurred_at
          FROM public.role_assignment_events rae
          LEFT JOIN public.profiles tp ON tp.id = rae.target_profile_id
          LEFT JOIN public.profiles pb ON pb.id = rae.performed_by
          WHERE 1=1

        UNION ALL

          SELECT
            pre.id,
            'password_reset' AS source_table,
            pre.action AS event_type,
            pre.target_user_id AS subject_profile_id,
            tp.full_name AS subject_name,
            pre.actor_user_id AS performed_by,
            pb.full_name AS performed_by_name,
            '' AS detail,
            pre.occurred_at
          FROM public.password_reset_events pre
          LEFT JOIN public.profiles tp ON tp.id = pre.target_user_id
          LEFT JOIN public.profiles pb ON pb.id = pre.actor_user_id
          WHERE 1=1

        UNION ALL

          SELECT
            pee.id,
            'evaluation_event' AS source_table,
            pee.event_type,
            pe.personnel_profile_id AS subject_profile_id,
            sp.full_name AS subject_name,
            pee.performed_by,
            pb.full_name AS performed_by_name,
            pee.notes AS detail,
            pee.occurred_at
          FROM public.personnel_evaluation_events pee
          JOIN public.personnel_evaluations pe ON pe.id = pee.evaluation_id
          LEFT JOIN public.profiles sp ON sp.id = pe.personnel_profile_id
          LEFT JOIN public.profiles pb ON pb.id = pee.performed_by
          WHERE 1=1

        ORDER BY occurred_at DESC
        LIMIT ? OFFSET ?
SQL;

        $bindings[] = $pagination['per_page'];
        $bindings[] = $pagination['offset'];

        $events = $db->query($auditQuery, $bindings)->getResultArray();

        return $this->respond([
            'data' => [
                'page'     => $pagination['page'],
                'per_page' => $pagination['per_page'],
                'events'   => $events,
            ],
        ], 200);
    }
}
