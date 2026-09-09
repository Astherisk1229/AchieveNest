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
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated active session required.']], 401);
        }
        if (! $this->requireHrAdmin($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Admin access required.']], 403);
        }

        $db = db_connect();

        $search   = trim((string) $this->request->getGet('search'));
        $collegeId = trim((string) $this->request->getGet('college_id'));
        $status    = trim((string) $this->request->getGet('status'));
        $sortBy    = trim((string) ($this->request->getGet('sort_by') ?? 'full_name'));
        $sortDir   = ValidationHelper::validateSortDirection((string) ($this->request->getGet('sort_dir') ?? 'ASC'));
        $pagination = ValidationHelper::validatePagination(
            $this->request->getGet('page') ?? 1,
            $this->request->getGet('per_page') ?? 25
        );

        if (! ValidationHelper::validateSortColumn($sortBy)) {
            $sortBy = 'full_name';
        }

        $builder = $db->table('profiles p')
            ->select([
                'p.id',
                'p.institutional_id',
                'p.email AS institutional_email',
                'p.full_name',
                'p.first_name',
                'p.middle_name',
                'p.last_name',
                'p.designation_title AS designation',
                'p.status',
                'p.must_change_password',
                'p.created_at',
                'pp.personnel_classification',
                'pca.college_id',
                'c.name AS college_name',
                "(SELECT da.id FROM dean_assignments da
                   WHERE da.personnel_profile_id = p.id AND da.is_active = 1 LIMIT 1) AS dean_assignment_id",
                "(SELECT c2.name FROM dean_assignments da
                   JOIN colleges c2 ON c2.id = da.college_id
                   WHERE da.personnel_profile_id = p.id AND da.is_active = 1 LIMIT 1) AS dean_college_name",
                "(SELECT qr.eligibility_decision
                   FROM personnel_qualification_reviews qr
                   WHERE qr.personnel_profile_id = p.id
                   ORDER BY qr.created_at DESC
                   LIMIT 1) AS latest_qualification_decision",
            ])
            ->join('personnel_profiles pp', 'pp.profile_id = p.id', 'left')
            ->join('personnel_college_affiliations pca', 'pca.personnel_profile_id = p.id AND pca.is_active = 1', 'left')
            ->join('colleges c', 'c.id = pca.college_id', 'left')
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
        if ($status !== '' && in_array($status, ['active', 'suspended', 'archived'], true)) {
            $builder->where('p.status', $status);
        }

        $total = (clone $builder)->countAllResults(false);

        $results = $builder
            ->orderBy("p.{$sortBy}", $sortDir)
            ->limit($pagination['per_page'], $pagination['offset'])
            ->get()
            ->getResultArray();

        return $this->respond([
            'data' => [
                'total'     => $total,
                'page'      => $pagination['page'],
                'per_page'  => $pagination['per_page'],
                'personnel' => $results,
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
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated active session required.']], 401);
        }
        if (! $this->requireHrAdmin($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Admin access required.']], 403);
        }

        $db = db_connect();

        $totalPersonnel = $db->table('profiles')
            ->where('account_type', 'personnel')
            ->where('status', 'active')
            ->countAllResults();

        $pendingPasswordResets = $db->table('password_reset_requests')
            ->where('assigned_office', 'hr')
            ->where('status', 'pending')
            ->countAllResults();

        $pendingQualificationReviews = $db->table('personnel_qualification_reviews')
            ->where('eligibility_decision', 'pending')
            ->countAllResults();

        $evalStatusCounts = $db->query(
            "SELECT status, COUNT(*) AS cnt
             FROM personnel_evaluations
             GROUP BY status"
        )->getResultArray();

        $evalMap = array_column($evalStatusCounts, 'cnt', 'status');

        return $this->respond([
            'data' => [
                'total_personnel'               => (int) $totalPersonnel,
                'pending_password_resets'       => (int) $pendingPasswordResets,
                'pending_qualification_reviews' => (int) $pendingQualificationReviews,
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
