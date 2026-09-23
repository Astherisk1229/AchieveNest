<?php

namespace App\Controllers\Api;

use App\Helpers\ValidationHelper;
use App\Services\AuthorizationService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

/**
 * HRPersonnelController
 *
 * Provides HR Personnel Directory and related governance endpoints.
 */
class HRPersonnelController extends Controller
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

    protected function requireHrAdmin(?array $actor): bool
    {
        return $actor !== null && $this->authz->hasRole($actor, 'hr_staff');
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

    // =========================================================================
    // GET /api/v1/hr/personnel
    // =========================================================================
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
        $databaseDurationMs = 0.0;
        $queryCount = 0;

        $search                 = trim((string) ($this->request->getGet('search') ?? ''));
        $collegeId              = trim((string) ($this->request->getGet('college_id') ?? $this->request->getGet('college') ?? ''));
        $administrativeUnitId   = trim((string) ($this->request->getGet('administrative_unit_id') ?? $this->request->getGet('unit') ?? ''));
        $personnelClassification = trim((string) ($this->request->getGet('personnel_classification') ?? $this->request->getGet('organizational_side') ?? ''));
        $personnelGroup         = trim((string) ($this->request->getGet('personnel_group') ?? ''));
        $facultyEngagement      = trim((string) ($this->request->getGet('faculty_engagement') ?? ''));
        $employmentStatus       = trim((string) ($this->request->getGet('employment_status') ?? ''));
        $roleFilter             = trim((string) ($this->request->getGet('role') ?? ''));
        $status                 = trim((string) ($this->request->getGet('status') ?? ''));
        $sortBy                 = trim((string) ($this->request->getGet('sort_by') ?? 'full_name'));
        $sortDir                = ValidationHelper::validateSortDirection((string) ($this->request->getGet('sort_dir') ?? 'ASC'));
        $pagination             = ValidationHelper::validatePagination(
            $this->request->getGet('page') ?? 1,
            $this->request->getGet('per_page') ?? 25
        );

        $allowedSortColumns = ['full_name', 'institutional_id', 'created_at', 'status', 'email'];
        if (! in_array($sortBy, $allowedSortColumns, true)) {
            $sortBy = 'full_name';
        }

        $builder = $db->table('profiles p')
            ->select('
                p.id,
                p.institutional_id,
                p.email AS institutional_email,
                p.full_name,
                p.first_name,
                p.middle_name,
                p.last_name,
                NULL AS suffix,
                p.designation_title AS designation,
                p.status,
                lac.must_change_password,
                p.created_at,
                pp.personnel_classification,
                pp.personnel_group,
                pp.organizational_side,
                pp.faculty_engagement,
                pp.employment_status,
                pp.employment_start_date,
                pp.position_title,
                pp.current_rank_title,
                pp.qualification_summary,
                pca.college_id,
                c.code AS college_code,
                c.name AS college_name,
                paua.administrative_unit_id,
                au.code AS administrative_unit_code,
                au.name AS administrative_unit_name,
                da.id AS dean_assignment_id,
                dc.name AS dean_college_name,
                NULL AS latest_qualification_decision
            ', false)
            ->join('local_auth_credentials lac', 'lac.profile_id = p.id', 'left')
            ->join('personnel_profiles pp', 'pp.profile_id = p.id', 'left')
            ->join('personnel_college_affiliations pca', 'pca.personnel_profile_id = p.id AND pca.is_active = 1', 'left')
            ->join('colleges c', 'c.id = pca.college_id', 'left')
            ->join('personnel_administrative_unit_affiliations paua', 'paua.personnel_profile_id = p.id AND paua.is_active = 1', 'left')
            ->join('administrative_units au', 'au.id = paua.administrative_unit_id', 'left')
            ->join('dean_assignments da', 'da.personnel_profile_id = p.id AND da.is_active = 1', 'left')
            ->join('colleges dc', 'dc.id = da.college_id', 'left')
            ->where('p.account_type', 'personnel');

        if ($search !== '') {
            $builder->groupStart()
                ->like('p.full_name', $search)
                ->orLike('p.institutional_id', $search)
                ->orLike('p.email', $search)
                ->orLike('c.name', $search)
                ->orLike('c.code', $search)
                ->orLike('au.name', $search)
                ->orLike('au.code', $search)
                ->orLike('pp.position_title', $search)
                ->orLike('pp.current_rank_title', $search)
                ->groupEnd();
        }

        if ($collegeId !== '' && $collegeId !== 'ALL') {
            $builder->groupStart()
                ->where('pca.college_id', $collegeId)
                ->orWhere('c.code', $collegeId)
                ->groupEnd();
        }

        if ($administrativeUnitId !== '' && $administrativeUnitId !== 'ALL') {
            $builder->groupStart()
                ->where('paua.administrative_unit_id', $administrativeUnitId)
                ->orWhere('au.code', $administrativeUnitId)
                ->groupEnd();
        }

        if ($personnelClassification !== '' && $personnelClassification !== 'ALL') {
            $builder->groupStart()
                ->where('pp.personnel_classification', $personnelClassification)
                ->orWhere('pp.organizational_side', $personnelClassification)
                ->groupEnd();
        }

        if ($personnelGroup !== '' && $personnelGroup !== 'ALL') {
            $builder->where('pp.personnel_group', $personnelGroup);
        }

        if ($facultyEngagement !== '' && $facultyEngagement !== 'ALL') {
            $builder->where('pp.faculty_engagement', $facultyEngagement);
        }

        if ($employmentStatus !== '' && $employmentStatus !== 'ALL') {
            $builder->where('pp.employment_status', $employmentStatus);
        }

        if ($roleFilter !== '' && $roleFilter !== 'ALL') {
            $builder->where("p.id IN (
                SELECT pr.profile_id FROM profile_roles pr
                JOIN roles r ON r.id = pr.role_id
                WHERE r.role_key = {$db->escape($roleFilter)} AND pr.is_active = 1
            )");
        }

        if ($status !== '' && $status !== 'ALL' && in_array($status, ['active', 'suspended', 'archived'], true)) {
            $builder->where('p.status', $status);
        }

        $queryStartedAt = microtime(true);
        $total = (clone $builder)->countAllResults(false);
        $databaseDurationMs += (microtime(true) - $queryStartedAt) * 1000;
        $queryCount++;

        $queryStartedAt = microtime(true);
        $rawResults = $builder
            ->orderBy("p.{$sortBy}", $sortDir)
            ->limit($pagination['per_page'], $pagination['offset'])
            ->get()
            ->getResultArray();
        $databaseDurationMs += (microtime(true) - $queryStartedAt) * 1000;
        $queryCount++;

        $profileIds = array_filter(array_column($rawResults, 'id'));

        // Batch load roles for fetched profile IDs
        $rolesByProfile = [];
        if (! empty($profileIds)) {
            $queryStartedAt = microtime(true);
            $roleRows = $db->table('profile_roles pr')
                ->select('pr.profile_id, r.role_key')
                ->join('roles r', 'r.id = pr.role_id')
                ->whereIn('pr.profile_id', $profileIds)
                ->where('pr.is_active', 1)
                ->get()
                ->getResultArray();
            $databaseDurationMs += (microtime(true) - $queryStartedAt) * 1000;
            $queryCount++;
            foreach ($roleRows as $row) {
                $rolesByProfile[$row['profile_id']][] = $row['role_key'];
            }
        }

        // Batch load program affiliations for fetched profile IDs
        $programsByProfile = [];
        if (! empty($profileIds)) {
            $queryStartedAt = microtime(true);
            $progRows = $db->table('personnel_program_affiliations ppa')
                ->select('ppa.personnel_profile_id, ap.id, ap.code, ap.name')
                ->join('academic_programs ap', 'ap.id = ppa.academic_program_id')
                ->whereIn('ppa.personnel_profile_id', $profileIds)
                ->where('ppa.is_active', 1)
                ->get()
                ->getResultArray();
            $databaseDurationMs += (microtime(true) - $queryStartedAt) * 1000;
            $queryCount++;
            foreach ($progRows as $row) {
                $programsByProfile[$row['personnel_profile_id']][] = [
                    'id'   => $row['id'],
                    'code' => $row['code'],
                    'name' => $row['name'],
                ];
            }
        }

        // Format and normalize each record
        $personnel = array_map(static function (array $r) use ($rolesByProfile, $programsByProfile): array {
            $profileId = $r['id'];
            $isAcademic = ($r['personnel_classification'] === 'academic' || $r['organizational_side'] === 'academic');

            $assignedRoles = array_values(array_unique($rolesByProfile[$profileId] ?? ['personnel']));
            $academicPrograms = $programsByProfile[$profileId] ?? [];

            $placement = null;
            if ($isAcademic && ! empty($r['college_id'])) {
                $placement = [
                    'type' => 'college',
                    'id'   => $r['college_id'],
                    'name' => $r['college_name'],
                    'code' => $r['college_code'],
                ];
            } elseif (! $isAcademic && ! empty($r['administrative_unit_id'])) {
                $placement = [
                    'type' => 'administrative_unit',
                    'id'   => $r['administrative_unit_id'],
                    'name' => $r['administrative_unit_name'],
                    'code' => $r['administrative_unit_code'],
                ];
            }

            return [
                'id'                           => $profileId,
                'institutional_id'             => $r['institutional_id'],
                'employee_id'                  => $r['institutional_id'],
                'institutional_email'          => $r['institutional_email'],
                'email'                        => $r['institutional_email'],
                'full_name'                    => $r['full_name'],
                'first_name'                   => $r['first_name'],
                'middle_name'                  => $r['middle_name'],
                'last_name'                    => $r['last_name'],
                'suffix'                       => $r['suffix'] ?? null,
                'designation'                  => $r['position_title'] ?: ($r['designation'] ?: 'Personnel'),
                'position_title'               => $r['position_title'] ?: ($r['designation'] ?: 'Personnel'),
                'current_rank_title'           => $r['current_rank_title'] ?? null,
                'academic_rank'                => $r['current_rank_title'] ?? ($r['position_title'] ?: ($r['designation'] ?: 'Personnel')),
                'qualification_summary'        => $r['qualification_summary'] ?? null,
                'status'                       => $r['status'] ?? 'active',
                'account_status'               => $r['status'] ?? 'active',
                'personnel_classification'     => $r['personnel_classification'] ?? ($r['organizational_side'] ?? 'academic'),
                'personnel_group'              => $r['personnel_group'] ?? ($isAcademic ? 'faculty' : 'non_teaching_faculty'),
                'organizational_side'          => $r['organizational_side'] ?? ($r['personnel_classification'] ?? 'academic'),
                'faculty_engagement'           => $r['faculty_engagement'] ?? 'full_time_faculty',
                'employment_status'            => $r['employment_status'] ?? 'permanent',
                'employment_start_date'        => $r['employment_start_date'] ?? null,
                'service_duration'             => (new \App\Services\EmploymentServiceDurationService())->calculate($r['employment_start_date'] ?? null),
                'college_id'                   => $r['college_id'] ?? null,
                'college_code'                 => $r['college_code'] ?? null,
                'college_name'                 => $r['college_name'] ?? null,
                'college'                      => $r['college_name'] ?? ($r['college_code'] ?? null),
                'administrative_unit_id'       => $r['administrative_unit_id'] ?? null,
                'administrative_unit_code'     => $r['administrative_unit_code'] ?? null,
                'administrative_unit_name'     => $r['administrative_unit_name'] ?? null,
                'administrative_unit'          => $r['administrative_unit_name'] ?? null,
                'placement'                    => $placement,
                'academic_programs'            => $academicPrograms,
                'program_affiliations'         => $academicPrograms,
                'assigned_roles'               => $assignedRoles,
                'dean_assignment_id'           => $r['dean_assignment_id'] ?? null,
                'dean_college_name'            => $r['dean_college_name'] ?? null,
                'latest_qualification_decision' => $r['latest_qualification_decision'] ?? null,
                'must_change_password'         => (bool) ($r['must_change_password'] ?? false),
                'created_at'                   => $r['created_at'],
                'provisioned_at'               => $r['created_at'],
            ];
        }, $rawResults);

        $this->recordPerformanceTiming('GET /api/v1/hr/personnel', $requestStartedAt, $authDurationMs, $databaseDurationMs, $queryCount);

        return $this->respond([
            'data' => [
                'total'     => $total,
                'page'      => $pagination['page'],
                'per_page'  => $pagination['per_page'],
                'personnel' => $personnel,
            ],
        ], 200);
    }

    // =========================================================================
    // POST /api/v1/hr/personnel/{id}/qualification-reviews
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

        $academicYear        = trim((string) ($json['academic_year'] ?? ''));
        $eligibilityDecision = trim((string) ($json['eligibility_decision'] ?? ''));
        $reportLabel         = 'Prerequisite Qualification Report';
        $benchmarkType       = trim((string) ($json['benchmark_type'] ?? ''));
        $benchmarkPayload    = $json['benchmark_payload'] ?? [];
        $benchmarkReference  = trim((string) ($json['benchmark_reference'] ?? ''));
        $actualResultPayload = $json['actual_result_payload'] ?? [];
        $decisionBasis       = trim((string) ($json['decision_basis'] ?? ''));
        $reportReference     = trim((string) ($json['report_reference'] ?? ''));
        $reportVersion       = trim((string) ($json['report_version'] ?? '1'));
        $evaluationPeriod    = trim((string) ($json['evaluation_period'] ?? ''));
        $remarks             = trim((string) ($json['remarks'] ?? ''));
        $evaluatedAt         = trim((string) ($json['evaluated_at'] ?? date('Y-m-d')));

        if (! ValidationHelper::validateAcademicYear($academicYear)) {
            return $this->respond(['error' => ['code' => 'INVALID_ACADEMIC_YEAR', 'message' => 'academic_year must be in format YYYY-YYYY.']], 422);
        }

        if (! in_array($eligibilityDecision, ['pending', 'cleared', 'not_cleared'], true)) {
            return $this->respond(['error' => ['code' => 'INVALID_ELIGIBILITY_DECISION', 'message' => 'eligibility_decision must be one of: pending, cleared, not_cleared.']], 422);
        }

        $db = db_connect();

        $target = $db->table('profiles')
            ->where('id', $profileId)
            ->where('status', 'active')
            ->get()
            ->getRowArray();

        if ($target === null) {
            return $this->respond(['error' => ['code' => 'PERSONNEL_NOT_FOUND', 'message' => 'Personnel profile not found.']], 404);
        }

        $reviewId = $this->genUuid();
        $now = date('Y-m-d H:i:s');

        try {
            $db->table('personnel_qualification_reviews')->insert([
                'id'                   => $reviewId,
                'personnel_profile_id' => $profileId,
                'academic_year'        => $academicYear,
                'evaluation_period'    => $evaluationPeriod ?: null,
                'report_label'         => $reportLabel,
                'report_reference'     => $reportReference ?: null,
                'report_version'       => $reportVersion,
                'benchmark_type'       => $benchmarkType ?: null,
                'benchmark_payload'    => json_encode($benchmarkPayload),
                'benchmark_reference'  => $benchmarkReference ?: null,
                'actual_result_payload'=> json_encode($actualResultPayload),
                'eligibility_decision' => $eligibilityDecision,
                'status'               => $eligibilityDecision,
                'decision_basis'       => $decisionBasis ?: null,
                'remarks'              => $remarks ?: null,
                'recorded_by'          => $actor['profile']['id'],
                'evaluated_at'         => $evaluatedAt ?: null,
                'created_at'           => $now,
                'updated_at'           => $now,
            ]);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'RECORD_FAILED', 'message' => 'Failed to record qualification review.']], 500);
        }

        return $this->respondCreated([
            'data' => [
                'message'              => 'Qualification review recorded successfully.',
                'id'                   => $reviewId,
                'eligibility_decision' => $eligibilityDecision,
                'report_label'         => $reportLabel,
                'academic_year'        => $academicYear,
                'personnel_profile_id' => $profileId,
                'recorded_by'          => $actor['profile']['id'],
            ],
        ]);
    }

    // =========================================================================
    // GET /api/v1/hr/personnel/{id}/qualification-reviews
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
        $reviews = $db->table('personnel_qualification_reviews qr')
            ->select('qr.*, rec.full_name AS recorded_by_name')
            ->join('profiles rec', 'rec.id = qr.recorded_by', 'left')
            ->where('qr.personnel_profile_id', $profileId)
            ->orderBy('qr.created_at', 'DESC')
            ->get()
            ->getResultArray();

        return $this->respond([
            'data' => [
                'personnel_profile_id' => $profileId,
                'reviews'              => $reviews,
                'total'                => count($reviews),
            ],
        ], 200);
    }

    // =========================================================================
    // GET /api/v1/hr/dashboard
    // =========================================================================
    public function dashboard(): mixed
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

        $totalPersonnel = $db->table('profiles')
            ->where('account_type', 'personnel')
            ->where('status', 'active')
            ->countAllResults();

        $pendingPasswordResets = $db->table('password_reset_requests prr')
            ->join('profiles p', 'p.email = prr.institutional_email', 'inner')
            ->where('p.account_type', 'personnel')
            ->where('prr.status', 'pending')
            ->countAllResults();

        $pendingQualificationReviews = $db->table('personnel_qualification_reviews')
            ->where('eligibility_decision', 'pending')
            ->countAllResults();

        $totalColleges = $db->table('colleges')->where('status', 'active')->countAllResults();
        $totalOffices = $db->table('administrative_units')->where('status', 'active')->countAllResults();
        $collegesWithoutDean = $db->query(
            "SELECT COUNT(*) AS cnt
             FROM colleges c
             LEFT JOIN dean_assignments da ON da.college_id = c.id AND da.is_active = 1
             WHERE c.status = 'active' AND da.id IS NULL"
        )->getRowArray();

        $evalStatusCounts = $db->query(
            "SELECT status, COUNT(*) AS cnt
             FROM personnel_evaluations
             GROUP BY status"
        )->getResultArray();

        $evalMap = array_column($evalStatusCounts, 'cnt', 'status');

        $databaseDurationMs = (microtime(true) - $databaseStartedAt) * 1000;
        $this->recordPerformanceTiming('GET /api/v1/hr/dashboard', $requestStartedAt, $authDurationMs, $databaseDurationMs, 7);

        return $this->respond([
            'data' => [
                'total_personnel'               => (int) $totalPersonnel,
                'pending_password_resets'       => (int) $pendingPasswordResets,
                'pending_qualification_reviews' => (int) $pendingQualificationReviews,
                'total_colleges'                => (int) $totalColleges,
                'total_offices_units'           => (int) $totalOffices,
                'colleges_without_dean'         => (int) ($collegesWithoutDean['cnt'] ?? 0),
                'evaluations'                   => [
                    'submitted'              => (int) ($evalMap['submitted'] ?? 0),
                    'in_evaluation'          => (int) ($evalMap['in_evaluation'] ?? 0),
                    'returned_for_revision'  => (int) ($evalMap['returned_for_revision'] ?? 0),
                    'ready_for_finalization' => (int) ($evalMap['ready_for_finalization'] ?? 0),
                    'completed'              => (int) ($evalMap['completed'] ?? 0),
                ],
            ],
        ], 200);
    }

    private function recordPerformanceTiming(
        string $route,
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
            '[PERF] request_id=%s route="%s" auth_ms=%.1f database_ms=%.1f total_ms=%.1f queries=%d',
            $requestId,
            $route,
            $authDurationMs,
            $databaseDurationMs,
            $totalDurationMs,
            $queryCount
        ));
    }

    // =========================================================================
    // GET /api/v1/hr/audit
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
        $fromDate        = trim((string) $this->request->getGet('from_date'));
        $toDate          = trim((string) $this->request->getGet('to_date'));
        $pagination      = ValidationHelper::validatePagination(
            $this->request->getGet('page') ?? 1,
            $this->request->getGet('per_page') ?? 50
        );

        $bindings   = [];
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
            ale.actor_profile_id AS performed_by,
            pb.full_name AS performed_by_name,
            ale.reason AS detail,
            ale.occurred_at
          FROM account_lifecycle_events ale
          LEFT JOIN profiles sp ON sp.id = ale.profile_id
          LEFT JOIN profiles pb ON pb.id = ale.actor_profile_id
          WHERE {$lcWhere}

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
