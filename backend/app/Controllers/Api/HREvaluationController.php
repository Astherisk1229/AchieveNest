<?php

namespace App\Controllers\Api;

use App\Helpers\ValidationHelper;
use App\Services\AuthenticatedActorService;
use App\Services\ClassificationAwarePersonnelFinalizationService;
use App\Services\PersonnelCompletedEvaluationResultService;
use App\Services\ReviewerResolverService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use RuntimeException;
use Throwable;

/**
 * HREvaluationController
 *
 * Manages the full HR evaluation state machine with:
 * - Qualification gate enforcement (Phase 8)
 * - Server-side reviewer resolution — frontend cannot override (Phase 8)
 * - Full state machine with transition validation (Phase 9)
 * - Evidence verification (Phase 10)
 * - Scoring with source traceability (Phase 10)
 * - Deficiency/additional-evidence workflow (Phase 11)
 * - Immutable finalization with full snapshot (Phase 12-13)
 *
 * Evaluation State Machine:
 *   submitted → in_evaluation           (start)
 *   in_evaluation → returned_for_revision (return)
 *   returned_for_revision → submitted   (personnel resubmit — separate endpoint)
 *   in_evaluation → ready_for_finalization (ready)
 *   ready_for_finalization → completed  (finalize)
 */
class HREvaluationController extends Controller
{
    use ResponseTrait;

    protected AuthenticatedActorService $actorService;
    protected ReviewerResolverService $reviewerResolver;
    protected ClassificationAwarePersonnelFinalizationService $finalizationService;
    protected PersonnelCompletedEvaluationResultService $completedResultService;

    public function __construct(
        ?AuthenticatedActorService $actorService = null,
        ?ReviewerResolverService $reviewerResolver = null,
        ?ClassificationAwarePersonnelFinalizationService $finalizationService = null,
        ?PersonnelCompletedEvaluationResultService $completedResultService = null
    ) {
        $this->actorService     = $actorService     ?? new AuthenticatedActorService();
        $this->reviewerResolver = $reviewerResolver ?? new ReviewerResolverService();
        $this->finalizationService = $finalizationService ?? new ClassificationAwarePersonnelFinalizationService(null, $this->reviewerResolver);
        $this->completedResultService = $completedResultService ?? new PersonnelCompletedEvaluationResultService();
    }

    /** Archived ranking tracks are historical and read-only for every evaluation mutation. */
    private function archivedPeriodResponse(array $evaluation): mixed
    {
        $periodId = (string) ($evaluation['evaluation_period_id'] ?? '');
        if ($periodId === '') return null;
        $status = db_connect()->table('personnel_evaluation_periods')->select('status')->where('id', $periodId)->get()->getRowArray()['status'] ?? null;
        if ($status !== 'ARCHIVED') return null;
        return $this->respond(['error' => ['code' => 'EVALUATION_PERIOD_ARCHIVED', 'message' => 'This ranking cycle is archived and read-only.']], 409);
    }

    public function options(): mixed
    {
        return $this->respond(null, 204);
    }

    protected function resolveActor(): ?array
    {
        return $this->actorService->resolveActor($this->request->getHeaderLine('Authorization'));
    }

    private function genUuid(): string
    {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0x0fff) | 0x4000, random_int(0, 0x3fff) | 0x8000, random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff));
    }

    private function recordEvaluationEvent($db, string $evaluationId, string $actorId, string $action, ?string $previousStatus, string $newStatus, ?string $remarks = null, array $payload = []): array
    {
        $event = [
            'id' => $this->genUuid(),
            'evaluation_id' => $evaluationId,
            'actor_profile_id' => $actorId,
            'action' => $action,
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
            'remarks' => $remarks === null ? null : ($payload === [] ? $remarks : $remarks . "\n" . json_encode($payload, JSON_UNESCAPED_UNICODE)),
            'occurred_at' => date('Y-m-d H:i:s'),
        ];
        $db->table('personnel_evaluation_events')->insert($event);
        return $event + ['event_type' => $action, 'performed_by' => $actorId, 'notes' => $remarks, 'payload' => json_encode($payload)];
    }

    private function snapshotTotals(array $items): array
    {
        $categories = [];
        $categoryAreas = [];
        $categoryCaps = [];
        $areaCaps = [];
        foreach ($items as $item) {
            if (($item['verification_status'] ?? '') !== 'verified' || ($item['rating_status'] ?? '') !== 'rated') continue;
            $snapshot = is_string($item['criterion_snapshot'] ?? null) ? json_decode($item['criterion_snapshot'], true) : ($item['criterion_snapshot'] ?? []);
            $category = $snapshot['category'] ?? [];
            $code = (string) ($category['category_code'] ?? $item['criterion_code'] ?? 'UNMAPPED');
            $area = strtoupper((string) ($category['area_code'] ?? substr($code, 0, 1)));
            $categories[$code] = ($categories[$code] ?? 0.0) + (float) ($item['awarded_points'] ?? 0);
            $categoryAreas[$code] = $area;
            $categoryCaps[$code] = (float) ($snapshot['criterion_cap'] ?? $category['max_points'] ?? PHP_FLOAT_MAX);
            $areaCaps[$area] = (float) ($category['area_max_points'] ?? $areaCaps[$area] ?? PHP_FLOAT_MAX);
        }
        $areas = ['A' => 0.0, 'B' => 0.0, 'C' => 0.0];
        foreach ($categories as $code => $points) $areas[$categoryAreas[$code]] = ($areas[$categoryAreas[$code]] ?? 0) + min($points, $categoryCaps[$code]);
        foreach ($areas as $area => $points) $areas[$area] = min($points, $areaCaps[$area] ?? PHP_FLOAT_MAX);
        return ['areaA_score' => $areas['A'], 'areaB_score' => $areas['B'], 'areaC_score' => $areas['C'], 'total_score' => array_sum($areas), 'category_scores' => $categories];
    }

    private function createDeanSummary($db, array $evaluation, array $items, array $actor, array $totals, string $status): array
    {
        $existing = $db->table('personnel_evaluation_reports')->where('evaluation_id', $evaluation['id'])->orderBy('generated_at', 'DESC')->get()->getRowArray();
        if ($existing) return $existing;
        $person = $db->table('profiles')->select('id,full_name,institutional_id')->where('id', $evaluation['personnel_profile_id'])->get()->getRowArray() ?? [];
        $criteria = is_string($evaluation['criteria_snapshot'] ?? null) ? json_decode($evaluation['criteria_snapshot'], true) : ($evaluation['criteria_snapshot'] ?? []);
        $snapshot = [
            'evaluation_id' => $evaluation['id'], 'evaluation_version' => (int) ($evaluation['version_number'] ?? 1),
            'personnel' => $person, 'assignment' => ['college' => $evaluation['college_name_snapshot'] ?? null, 'department' => $evaluation['department_name_snapshot'] ?? null, 'position' => $evaluation['position_title_snapshot'] ?? null],
            'evaluation_period' => ['id' => $evaluation['evaluation_period_id'] ?? null, 'name' => $evaluation['period_name_snapshot'] ?? null, 'academic_year' => $evaluation['academic_year'] ?? null],
            'criteria_version_id' => $evaluation['evaluation_scale_version_id'] ?? null,
            'criteria_snapshot' => $criteria,
            'portfolio_version' => (int) ($evaluation['version_number'] ?? 1),
            'evaluator' => ['profile_id' => $actor['profile']['id'], 'full_name' => $actor['profile']['full_name'] ?? null, 'role' => in_array('dean', $actor['roles'] ?? [], true) ? 'Dean' : (in_array('department_head', $actor['roles'] ?? [], true) ? 'Department Head' : 'HR')],
            'items' => array_map(static fn(array $item): array => ['id'=>$item['id'],'achievement'=>$item['item_description'],'criterion_code'=>$item['criterion_code'] ?? null,'criterion_key'=>$item['criterion_key'] ?? null,'decision'=>($item['verification_status'] ?? '')==='verified'?'approved':'rejected','verification_status'=>$item['verification_status'] ?? null,'configured_points'=>(float)($item['configured_points_snapshot'] ?? 0),'awarded_points'=>(float)($item['awarded_points'] ?? 0),'rejection_reason'=>$item['rejection_reason'] ?? null,'criterion_snapshot'=>is_string($item['criterion_snapshot']??null)?json_decode($item['criterion_snapshot'],true):($item['criterion_snapshot']??[]),'evidence_snapshot'=>is_string($item['evidence_snapshot']??null)?json_decode($item['evidence_snapshot'],true):($item['evidence_snapshot']??[])], $items),
            'section_totals' => ['A'=>$totals['areaA_score'],'B'=>$totals['areaB_score'],'C'=>$totals['areaC_score']], 'grand_total'=>$totals['total_score'],
            'status'=>$status, 'completed_at'=>date('c'),
        ];
        $passingScore = (float) ($criteria['version']['passing_score'] ?? $criteria['sheet']['passing_score'] ?? 0);
        $snapshot['official_summary'] = (new \App\Services\PersonnelEvaluationSummaryService())->build($evaluation, $items, $criteria, $totals);
        $row=['id'=>$this->genUuid(),'evaluation_id'=>$evaluation['id'],'generated_by'=>$actor['profile']['id'],'report_payload'=>json_encode($snapshot,JSON_UNESCAPED_UNICODE),'summary_score'=>$totals['total_score'],'passing_status'=>$passingScore > 0 && $totals['total_score'] >= $passingScore ? 'passed' : 'not_passed','generated_at'=>date('Y-m-d H:i:s')];
        $db->table('personnel_evaluation_reports')->insert($row);
        return $row + ['snapshot'=>$snapshot];
    }

    /**
     * Confirms actor is HR Admin with hr_staff role.
     */
    protected function isHrAdmin(?array $actor): bool
    {
        if ($actor === null) {
            return false;
        }
        return ($actor['profile']['account_type'] ?? '') === 'hr_admin'
            && in_array('hr_staff', $actor['roles'], true);
    }

    /**
     * Confirms actor is the assigned evaluator. HR oversight visibility does
     * not grant authority to replace a college Dean's evaluation decisions.
     */
    protected function isEvaluatorOrHr(?array $actor, array $evaluation): bool
    {
        if ($actor === null) {
            return false;
        }
        return $actor['profile']['id'] === ($evaluation['evaluator_profile_id'] ?? null);
    }

    /** Assignment and current organizational scope must both authorize the initial evaluator. */
    private function authorityMayEvaluate(?array $actor, array $evaluation): bool
    {
        if ($actor === null) return false;
        $actorId = (string) ($actor['profile']['id'] ?? '');
        if ($actorId === '' || $actorId !== (string) ($evaluation['evaluator_profile_id'] ?? '') || $actorId === (string) ($evaluation['personnel_profile_id'] ?? '')) return false;
        try {
            $track = ! empty($evaluation['evaluation_period_id']) ? db_connect()->table('personnel_evaluation_periods')->where('id', $evaluation['evaluation_period_id'])->get()->getRowArray() : null;
            $resolved = $this->reviewerResolver->resolve((string) $evaluation['personnel_profile_id'], $track ?: null);
            return $this->reviewerResolver->isValidEvaluatorActor($actor, $resolved);
        } catch (Throwable) { return false; }
    }

    /**
     * Validates that the requested status transition is allowed.
     * Returns null on success, or an error message string.
     */
    private function validateTransition(string $from, string $to): ?string
    {
        $allowed = [
            'submitted'              => ['in_evaluation', 'returned_for_revision'],
            'in_evaluation'          => ['returned_for_revision', 'ready_for_finalization'],
            'returned_for_revision'  => ['submitted'],
            'ready_for_finalization' => ['completed'],
        ];

        if ($from === 'completed') {
            return "Evaluation is completed and locked. No further transitions allowed.";
        }

        if (! isset($allowed[$from]) || ! in_array($to, $allowed[$from], true)) {
            return "Invalid state transition from '{$from}' to '{$to}'.";
        }

        return null;
    }

    /**
     * Confirms Personnel qualification gate is cleared for an academic year.
     */
    private function isQualificationCleared(string $personnelProfileId, string $academicYear): bool
    {
        $db = db_connect();
        $review = $db->table('personnel_qualification_reviews')
            ->where('personnel_profile_id', $personnelProfileId)
            ->where('academic_year', $academicYear)
            ->where('eligibility_decision', 'cleared')
            ->get()
            ->getRowArray();
        return $review !== null;
    }

    /** Submission-time eligibility is authoritative; legacy rows retain the old qualification fallback. */
    private function isSubmissionEligibilityCleared(array $evaluation): bool
    {
        $snapshot = $evaluation['eligibility_snapshot'] ?? null;
        if (is_string($snapshot) && $snapshot !== '') $snapshot = json_decode($snapshot, true);
        if (is_array($snapshot) && array_key_exists('eligibility_status', $snapshot)) return ($snapshot['eligibility_status'] ?? '') === 'eligible';
        if (!empty($evaluation['evaluation_period_id'])) {
            $current = (new \App\Services\PersonnelEligibilityService())->evaluateEligibility((string) $evaluation['personnel_profile_id'], (string) $evaluation['evaluation_period_id']);
            return ($current['eligibility_status'] ?? '') === 'eligible';
        }
        $academicYear = (string) ($evaluation['academic_year'] ?? '');
        return $academicYear === '' || $this->isQualificationCleared((string) $evaluation['personnel_profile_id'], $academicYear);
    }

    /**
     * Counts unresolved deficiency requests for an evaluation.
     */
    private function countUnresolvedDeficiencies(string $evaluationId): int
    {
        $db = db_connect();
        return (int) $db->table('personnel_evaluation_deficiency_requests')
            ->where('evaluation_id', $evaluationId)
            ->whereIn('status', ['pending', 'open', 'responded'])
            ->countAllResults();
    }

    // =========================================================================
    // GET /api/v1/hr/evaluations
    // =========================================================================
    public function list(): mixed
    {
        $actor = $this->resolveActor();
        $isScopedReviewer = $actor !== null && count(array_intersect(['dean','department_head'], $actor['roles'] ?? [])) > 0;
        if (! $this->isHrAdmin($actor) && ! $isScopedReviewer) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Assigned HR, Dean, or Department Head reviewer authority required.']], 403);
        }

        $db     = db_connect();
        $status = $this->request->getGet('status');
        $search = trim((string) $this->request->getGet('search'));
        $periodId = trim((string) $this->request->getGet('evaluation_period_id'));

        $builder = $db->table('personnel_evaluations pe')
            ->select([
                'pe.*',
                'p.full_name AS faculty_name',
                'p.institutional_id',
                'pe.position_title_snapshot AS designation',
                'pe.department_id_snapshot AS department_id',
                'pe.department_name_snapshot AS department_name',
                'evaluator.full_name AS evaluator_name',
                'pp.personnel_group',
            ])
            ->select('NULL AS email', false)
            ->join('profiles p', 'p.id = pe.personnel_profile_id')
            ->join('personnel_profiles pp', 'pp.profile_id = pe.personnel_profile_id')
            ->join('profiles evaluator', 'evaluator.id = pe.evaluator_profile_id', 'left')
            ->orderBy('pe.submitted_at', 'DESC');

        // Organizational reviewers see only their assigned queue. HR must also
        // see Dean-endorsed Faculty cases so it can perform the mandatory Phase O review.
        if (! $this->isHrAdmin($actor)) {
            $builder->where('pe.evaluator_profile_id', $actor['profile']['id']);
        }

        if ($status && $status !== 'ALL') {
            $builder->where('pe.status', $status);
        }
        if ($periodId !== '') $builder->where('pe.evaluation_period_id', $periodId);

        if ($search !== '') {
            $builder->groupStart()
                ->like('p.full_name', $search, 'both', true, true)
                ->orLike('p.institutional_id', $search, 'both', true, true)
                ->groupEnd();
        }

        $results = $builder->get()->getResultArray();

        // Count unresolved deficiencies per evaluation
        foreach ($results as &$row) {
            $row['unresolved_deficiencies'] = $this->countUnresolvedDeficiencies($row['id']);
        }

        return $this->respond([
            'data' => [
                'evaluations' => $results,
                'counts' => [
                    'submitted'              => count(array_filter($results, fn($r) => $r['status'] === 'submitted')),
                    'in_evaluation'          => count(array_filter($results, fn($r) => $r['status'] === 'in_evaluation')),
                    'ready_for_finalization' => count(array_filter($results, fn($r) => $r['status'] === 'ready_for_finalization')),
                    'returned_for_revision'  => count(array_filter($results, fn($r) => $r['status'] === 'returned_for_revision')),
                    'completed'              => count(array_filter($results, fn($r) => $r['status'] === 'completed')),
                ],
            ],
        ], 200);
    }

    // =========================================================================
    // GET /api/v1/hr/evaluations/{id}
    // =========================================================================
    public function get(string $id): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        if (! ValidationHelper::validateUuid($id)) {
            return $this->respond(['error' => ['code' => 'INVALID_ID', 'message' => 'Invalid evaluation ID.']], 422);
        }

        $db = db_connect();
        $evaluation = $db->table('personnel_evaluations pe')
            ->select([
                'pe.*',
                'p.full_name AS faculty_name',
                'p.institutional_id',
                'pe.position_title_snapshot AS designation',
                'pe.department_name_snapshot AS department',
                'pe.college_name_snapshot AS college',
                'evaluator.full_name AS evaluator_name',
                'pp.personnel_group',
                'pp.employment_start_date',
            ])
            ->select('TIMESTAMPDIFF(YEAR, pp.employment_start_date, CURDATE()) AS tenure_years', false)
            ->select('NULL AS email', false)
            ->join('profiles p', 'p.id = pe.personnel_profile_id')
            ->join('personnel_profiles pp', 'pp.profile_id = pe.personnel_profile_id')
            ->join('profiles evaluator', 'evaluator.id = pe.evaluator_profile_id', 'left')
            ->where('pe.id', $id)
            ->get()
            ->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation not found.']], 404);
        }

        // Access control: HR Admin, assigned evaluator, or subject Personnel
        $actorId = $actor['profile']['id'];
        $canAccess = $this->isHrAdmin($actor)
            || $actorId === ($evaluation['evaluator_profile_id'] ?? null)
            || $actorId === ($evaluation['personnel_profile_id'] ?? null);

        if (! $canAccess) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Access denied.']], 403);
        }

        $items = $db->table('personnel_evaluation_items')
            ->where('evaluation_id', $id)
            ->orderBy('category_area', 'ASC')
            ->orderBy('criterion_code', 'ASC')
            ->get()
            ->getResultArray();

        $scores = $this->snapshotTotals($items);

        $deficiencies = $db->table('personnel_evaluation_deficiency_requests')
            ->where('evaluation_id', $id)
            ->orderBy('created_at', 'DESC')
            ->get()
            ->getResultArray();

        return $this->respond([
            'data' => [
                'evaluation'   => $evaluation,
                'items'        => $items,
                'scores'       => $scores,
                'deficiencies' => $deficiencies,
                'unresolved_deficiencies' => count(array_filter($deficiencies, fn($d) => in_array($d['status'], ['open', 'responded']))),
            ],
        ], 200);
    }

    // =========================================================================
    // POST /api/v1/hr/evaluations/{id}/start
    // Transitions: submitted → in_evaluation
    // Enforces: qualification gate, server-side reviewer resolution
    // =========================================================================
    public function start(string $id): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        // HR or the assigned organizational authority may start the single evaluation stage.
        $isHr   = $this->isHrAdmin($actor);
        $isScopedReviewer = count(array_intersect(['dean','department_head'], $actor['roles'] ?? [])) > 0;
        if (! $isHr && ! $isScopedReviewer) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR, Dean, or Department Head authority required to start an evaluation.']], 403);
        }

        if (! ValidationHelper::validateUuid($id)) {
            return $this->respond(['error' => ['code' => 'INVALID_ID', 'message' => 'Invalid evaluation ID.']], 422);
        }

        $db = db_connect();
        $evaluation = $db->table('personnel_evaluations')->where('id', $id)->get()->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation not found.']], 404);
        }
        if (($archived = $this->archivedPeriodResponse($evaluation)) !== null) return $archived;

        // State machine: must be in 'submitted'
        $transitionError = $this->validateTransition($evaluation['status'], 'in_evaluation');
        if ($transitionError !== null) {
            return $this->respond(['error' => ['code' => 'INVALID_TRANSITION', 'message' => $transitionError]], 422);
        }

        $personnelProfileId = $evaluation['personnel_profile_id'];
        $academicYear       = $evaluation['academic_year'] ?? '';

        if (! empty($evaluation['evaluation_period_id'])) {
            $period = $db->table('personnel_evaluation_periods')->where('id', $evaluation['evaluation_period_id'])->get()->getRowArray();
            if (! $period || $period['status'] !== 'EVALUATION_ONGOING') {
                return $this->respond(['error' => ['code' => 'EVALUATION_PERIOD_NOT_ONGOING', 'message' => 'Evaluation can begin only after HR starts evaluation for this period.']], 422);
            }
        }

        // Non-Teaching Faculty submissions made before the NTF workbook existed get their locked Area A items now.
        (new \App\Services\NtfAnnualReviewAreaAService($db))->attach($id);

        // Phase 8: Qualification Gate — must be cleared before evaluation can start
        if (! $this->isSubmissionEligibilityCleared($evaluation)) {
            return $this->respond([
                'error' => [
                    'code'    => 'QUALIFICATION_NOT_CLEARED',
                    'message' => "Personnel has not been cleared by the Prerequisite Qualification Report for academic year {$academicYear}. Evaluation cannot begin.",
                ],
            ], 422);
        }

        // Phase 8: Server-side reviewer resolution — frontend cannot supply evaluator
        try {
            $resolved = $this->reviewerResolver->resolve($personnelProfileId, $period ?? null);
        } catch (Throwable $e) {
            return $this->respond([
                'error' => [
                    'code'    => 'REVIEWER_NOT_FOUND',
                    'message' => 'Cannot determine authorized reviewer: ' . $e->getMessage(),
                ],
            ], 422);
        }

        // Verify that the calling actor is an authorized evaluator for this Personnel
        if (! $this->reviewerResolver->isValidEvaluatorActor($actor, $resolved)) {
            return $this->respond([
                'error' => [
                    'code'    => 'EVALUATOR_MISMATCH',
                    'message' => 'The authenticated user is not the authorized evaluator for this Personnel.',
                ],
            ], 403);
        }

        $activeEvaluatorId = $resolved['authority_type'] === 'HR' ? $actor['profile']['id'] : $resolved['evaluator_profile_id'];

        $db->transBegin();
        try {
            $db->table('personnel_evaluations')->where('id', $id)->update([
                'status'                => 'in_evaluation',
                'evaluator_profile_id'  => $activeEvaluatorId,
                'evaluation_started_at' => date('Y-m-d H:i:s'),
                'updated_at'            => date('Y-m-d H:i:s'),
            ]);

            $this->recordEvaluationEvent($db, $id, $actor['profile']['id'], 'evaluation_started', $evaluation['status'], 'in_evaluation', "Evaluation started by {$actor['profile']['full_name']} (role: {$resolved['evaluator_role']})", [
                    'evaluator_profile_id' => $activeEvaluatorId,
                    'evaluator_role'       => $resolved['evaluator_role'],
                    'evaluator_college_id' => $resolved['evaluator_college_id'],
                ]);

            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->respond(['error' => ['code' => 'START_FAILED', 'message' => 'Failed to start evaluation: ' . $e->getMessage()]], 500);
        }

        return $this->respond([
            'data' => [
                'message'              => 'Evaluation started.',
                'evaluator_role'       => $resolved['evaluator_role'],
                'evaluator_profile_id' => $resolved['evaluator_profile_id'],
            ],
        ], 200);
    }

    // =========================================================================
    // PATCH /api/v1/hr/evaluations/{id}/items/{itemId}/verify
    // Evidence verification — reject on completed evaluations
    // =========================================================================
    public function verifyItem(string $id, string $itemId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR evaluation authority required.']], 403);
        }

        $db = db_connect();
        $evaluation = $db->table('personnel_evaluations')->where('id', $id)->get()->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation not found.']], 404);
        }
        if (($archived = $this->archivedPeriodResponse($evaluation)) !== null) return $archived;

        // Decisions are mutable only inside the active Dean/HR evaluation stage.
        if ($evaluation['status'] !== 'in_evaluation') {
            return $this->respond(['error' => ['code' => 'EVALUATION_LOCKED', 'message' => 'Item decisions can be changed only while the evaluation is in progress.']], 409);
        }

        // Only the assigned evaluator or HR Admin may verify
        if (! $this->authorityMayEvaluate($actor, $evaluation)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only the assigned evaluator or HR Admin may verify evidence.']], 403);
        }

        $json   = $this->request->getJSON(true) ?? [];
        $status  = trim((string) ($json['verification_status'] ?? 'verified'));
        $remarks = trim((string) ($json['evaluator_remarks'] ?? ''));

        if (! ValidationHelper::validateEnum($status, ['verified', 'ineligible', 'needs_revision', 'pending'])) {
            return $this->respond(['error' => ['code' => 'INVALID_STATUS', 'message' => 'verification_status must be one of: verified, ineligible, needs_revision, pending.']], 422);
        }

        if ($remarks !== '' && ! ValidationHelper::validateBoundedText($remarks, ValidationHelper::MAX_REMARKS_LENGTH)) {
            return $this->respond(['error' => ['code' => 'REMARKS_TOO_LONG', 'message' => 'Remarks exceed maximum allowed length.']], 422);
        }
        if (in_array($status, ['ineligible', 'needs_revision'], true) && $remarks === '') {
            return $this->respond(['error' => ['code' => 'REJECTION_REASON_REQUIRED', 'message' => 'A rejection reason is required.']], 422);
        }

        $item = $db->table('personnel_evaluation_items')
            ->where('id', $itemId)
            ->where('evaluation_id', $id)
            ->get()
            ->getRowArray();

        if ($item === null) {
            return $this->respond(['error' => ['code' => 'ITEM_NOT_FOUND', 'message' => 'Evaluation item not found.']], 404);
        }
        if (\App\Services\NtfAnnualReviewAreaAService::isLocked($item)) return $this->respond(['error' => ['code' => 'ITEM_LOCKED', 'message' => 'This Area A item comes from the confirmed NTF annual-review workbook and cannot be changed here.']], 409);

        $db->table('personnel_evaluation_items')->where('id', $itemId)->update([
            'verification_status' => $status,
            'rating_status'       => $status === 'ineligible' ? 'not_applicable' : 'unrated',
            'awarded_points'      => $status === 'ineligible' ? 0.0 : null,
            'evaluator_remarks'   => $remarks,
            'rejection_reason'    => in_array($status, ['ineligible', 'needs_revision'], true) ? $remarks : null,
            'evaluated_by'        => $actor['profile']['id'],
            'evaluated_at'        => date('Y-m-d H:i:s'),
            'updated_at'          => date('Y-m-d H:i:s'),
        ]);

        $this->recordEvaluationEvent($db, $id, $actor['profile']['id'], 'item_verified', $evaluation['status'], $evaluation['status'], "Item {$itemId} verification status: {$status}", ['item_id' => $itemId, 'verification_status' => $status]);

        return $this->respond(['data' => ['message' => 'Evidence verification recorded.', 'verification_status' => $status]], 200);
    }

    // =========================================================================
    // PATCH /api/v1/hr/evaluations/{id}/items/{itemId}/rate
    // Score an item — must be verified first
    // =========================================================================
    public function rateItem(string $id, string $itemId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $db = db_connect();
        $evaluation = $db->table('personnel_evaluations')->where('id', $id)->get()->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation not found.']], 404);
        }
        if (($archived = $this->archivedPeriodResponse($evaluation)) !== null) return $archived;

        // Decisions are mutable only inside the active Dean/HR evaluation stage.
        if ($evaluation['status'] !== 'in_evaluation') {
            return $this->respond(['error' => ['code' => 'EVALUATION_LOCKED', 'message' => 'Item decisions can be changed only while the evaluation is in progress.']], 409);
        }

        // Only the assigned evaluator or HR Admin may rate
        if (! $this->authorityMayEvaluate($actor, $evaluation)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only the assigned evaluator or HR Admin may rate items.']], 403);
        }

        $item = $db->table('personnel_evaluation_items')
            ->where('id', $itemId)
            ->where('evaluation_id', $id)
            ->get()
            ->getRowArray();

        if ($item === null) {
            return $this->respond(['error' => ['code' => 'ITEM_NOT_FOUND', 'message' => 'Evaluation item not found.']], 404);
        }
        if (\App\Services\NtfAnnualReviewAreaAService::isLocked($item)) return $this->respond(['error' => ['code' => 'ITEM_LOCKED', 'message' => 'This Area A item comes from the confirmed NTF annual-review workbook and cannot be changed here.']], 409);

        // Enforce: item must be verified before rating
        if ($item['verification_status'] !== 'verified') {
            return $this->respond(['error' => ['code' => 'NOT_VERIFIED', 'message' => 'Item must be verified before it can be rated.']], 422);
        }

        $json    = $this->request->getJSON(true) ?? [];
        $remarks = trim((string) ($json['evaluator_remarks'] ?? ''));

        if ($remarks !== '' && ! ValidationHelper::validateBoundedText($remarks, ValidationHelper::MAX_REMARKS_LENGTH)) {
            return $this->respond(['error' => ['code' => 'REMARKS_TOO_LONG', 'message' => 'Remarks exceed maximum allowed length.']], 422);
        }

        $awardedPoints = (float) ($item['configured_points_snapshot'] ?? 0);
        if ($awardedPoints <= 0) return $this->respond(['error' => ['code' => 'CRITERION_POINTS_UNRESOLVED', 'message' => 'The submitted claim has no configured points in its locked criteria snapshot.']], 422);

        $db->table('personnel_evaluation_items')->where('id', $itemId)->update([
            'rating_status'   => 'rated',
            'awarded_points'  => $awardedPoints,
            'evaluator_remarks' => $remarks,
            'evaluated_by'    => $actor['profile']['id'],
            'evaluated_at'    => date('Y-m-d H:i:s'),
            'updated_at'      => date('Y-m-d H:i:s'),
        ]);

        // Recalculate totals after every rating
        $allItems = $db->table('personnel_evaluation_items')
            ->where('evaluation_id', $id)
            ->get()
            ->getResultArray();

        $totals = $this->snapshotTotals($allItems);

        $db->table('personnel_evaluations')->where('id', $id)->update([
            'total_score'  => $totals['total_score'],
            'area_a_score' => $totals['areaA_score'],
            'area_b_score' => $totals['areaB_score'],
            'area_c_score' => $totals['areaC_score'],
            'updated_at'   => date('Y-m-d H:i:s'),
        ]);

        $this->recordEvaluationEvent($db, $id, $actor['profile']['id'], 'item_rated', $evaluation['status'], $evaluation['status'], "Item {$itemId} rated: {$awardedPoints} pts", ['item_id' => $itemId, 'awarded_points' => $awardedPoints]);

        return $this->respond([
            'data' => [
                'awarded_points' => $awardedPoints,
                'scores'         => $totals,
            ],
        ], 200);
    }

    // =========================================================================
    // POST /api/v1/hr/evaluations/{id}/return
    // Transitions: in_evaluation → returned_for_revision
    // =========================================================================
    public function returnEvaluation(string $id): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $db = db_connect();
        $evaluation = $db->table('personnel_evaluations')->where('id', $id)->get()->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation not found.']], 404);
        }
        if (($archived = $this->archivedPeriodResponse($evaluation)) !== null) return $archived;

        $transitionError = $this->validateTransition($evaluation['status'], 'returned_for_revision');
        if ($transitionError !== null) {
            return $this->respond(['error' => ['code' => 'INVALID_TRANSITION', 'message' => $transitionError]], 422);
        }

        if (! $this->authorityMayEvaluate($actor, $evaluation)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only the assigned evaluator or HR Admin may return an evaluation.']], 403);
        }

        $json   = $this->request->getJSON(true) ?? [];
        $reason = trim((string) ($json['reason'] ?? ''));

        if ($reason === '' || ! ValidationHelper::validateBoundedText($reason, ValidationHelper::MAX_REASON_LENGTH)) {
            return $this->respond(['error' => ['code' => 'REASON_REQUIRED', 'message' => 'A return reason (1-500 characters) is required.']], 422);
        }

        $db->table('personnel_evaluations')->where('id', $id)->update([
            'status'        => 'returned_for_revision',
            'return_reason' => $reason,
            'returned_at'   => date('Y-m-d H:i:s'),
            'updated_at'    => date('Y-m-d H:i:s'),
        ]);

        $this->recordEvaluationEvent($db, $id, $actor['profile']['id'], 'returned_for_revision', $evaluation['status'], 'returned_for_revision', $reason, ['reason' => $reason]);

        return $this->respond(['data' => ['message' => 'Evaluation returned for revision.']], 200);
    }

    // =========================================================================
    // POST /api/v1/hr/evaluations/{id}/ready
    // Transitions: in_evaluation → ready_for_finalization
    // =========================================================================
    public function markReady(string $id): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $db = db_connect();
        $evaluation = $db->table('personnel_evaluations')->where('id', $id)->get()->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation not found.']], 404);
        }
        if (($archived = $this->archivedPeriodResponse($evaluation)) !== null) return $archived;

        $transitionError = $this->validateTransition($evaluation['status'], 'ready_for_finalization');
        if ($transitionError !== null) {
            return $this->respond(['error' => ['code' => 'INVALID_TRANSITION', 'message' => $transitionError]], 422);
        }

        // Only the assigned evaluator or HR Admin may mark ready
        if (! $this->authorityMayEvaluate($actor, $evaluation)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only the assigned evaluator or HR Admin may mark an evaluation as ready.']], 403);
        }

        // Check for unresolved deficiencies
        $unresolvedCount = $this->countUnresolvedDeficiencies($id);
        if ($unresolvedCount > 0) {
            return $this->respond([
                'error' => [
                    'code'    => 'UNRESOLVED_DEFICIENCIES',
                    'message' => "Cannot mark ready: {$unresolvedCount} deficiency request(s) are still open or awaiting review.",
                ],
            ], 422);
        }
        $items = $db->table('personnel_evaluation_items')->where('evaluation_id', $id)->get()->getResultArray();
        $remaining = count(array_filter($items, static fn(array $item): bool => ! in_array($item['verification_status'] ?? 'pending', ['verified', 'ineligible'], true) || (($item['verification_status'] ?? '') === 'verified' && ($item['rating_status'] ?? 'unrated') !== 'rated')));
        if ($remaining > 0) {
            return $this->respond(['error' => ['code' => 'EVALUATION_INCOMPLETE', 'message' => "{$remaining} submitted achievement(s) still require a final decision.", 'remaining' => $remaining]], 422);
        }

        $db->transBegin();
        try {
            $now = date('Y-m-d H:i:s');
            $nextEvaluator = null;
            if (! $this->isHrAdmin($actor)) {
                $nextEvaluator = $this->reviewerResolver->resolveHrReviewerForPersonnel($evaluation['personnel_profile_id']);
            }
            $update = ['status' => 'ready_for_finalization', 'updated_at' => $now];
            if ($nextEvaluator !== null) $update['evaluator_profile_id'] = $nextEvaluator['evaluator_profile_id'];
            $db->table('personnel_evaluations')->where('id', $id)->update($update);
            $totals = $this->snapshotTotals($items);
            $this->createDeanSummary($db, $evaluation, $items, $actor, $totals, 'endorsed_to_hr');
            $handoffSource = in_array('department_head', $actor['roles'] ?? [], true) ? 'department_head_endorsement' : ($nextEvaluator ? 'dean_endorsement' : 'hr_direct');
            $event = $this->recordEvaluationEvent($db, $id, $actor['profile']['id'], \App\Services\PersonnelWorkflowEventRegistry::EVENT_EVALUATION_READY_FOR_FINALIZATION, $evaluation['status'], 'ready_for_finalization', "Endorsed to HR by {$actor['profile']['full_name']}", ['version_number' => (int) ($evaluation['version_number'] ?? 1), 'handoff_source' => $handoffSource]);
            (new \App\Services\PersonnelWorkflowNotificationService($db))->handleWorkflowEvent($event, [
                'personnel_profile_id' => $evaluation['personnel_profile_id'],
                'version_number' => (int) ($evaluation['version_number'] ?? 1),
            ]);
            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->respond(['error' => ['code' => 'ENDORSEMENT_FAILED', 'message' => 'Portfolio endorsement and HR notification could not be completed: ' . $e->getMessage()]], 500);
        }

        return $this->respond(['data' => ['message' => 'Personnel portfolio endorsed to HR for finalization.', 'status' => 'ready_for_finalization']], 200);
    }

    // =========================================================================
    // POST /api/v1/hr/evaluations/{id}/finalize
    // Transitions: ready_for_finalization → completed
    // Immutable — creates snapshot + persists to personnel_evaluation_reports
    // =========================================================================
    public function finalizeEvaluation(string $id): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR evaluation authority required.']], 403);
        }

        if (! ValidationHelper::validateUuid($id)) {
            return $this->respond(['error' => ['code' => 'INVALID_ID', 'message' => 'Invalid evaluation ID.']], 422);
        }

        $evaluationRow = db_connect()->table('personnel_evaluations')->where('id', $id)->get()->getRowArray();
        if ($evaluationRow !== null && ($archived = $this->archivedPeriodResponse($evaluationRow)) !== null) return $archived;

        try {
            $result = $this->finalizationService->finalize($actor, $id);
            return $this->respond(['data' => [
                'message' => $result['idempotent']
                    ? 'Non-Teaching Faculty evaluation was already finalized.'
                    : 'Non-Teaching Faculty evaluation successfully finalized.',
                'report_id' => $result['report_id'],
                'grand_total' => $result['grand_total'],
                'final_snapshot' => $result['final_snapshot'],
                'idempotent' => $result['idempotent'],
            ]], 200);
        } catch (RuntimeException $e) {
            $code = $e->getMessage();
            $status = match ($code) {
                'EVALUATION_NOT_FOUND' => 404,
                'NTF_FINALIZATION_HR_AUTHORITY_REQUIRED', 'NTF_FINALIZATION_EVALUATOR_MISMATCH' => 403,
                'HR_FINAL_RANK_REVIEW_REQUIRED', 'EVALUATION_ALREADY_COMPLETED' => 409,
                default => 422,
            };
            return $this->respond(['error' => ['code' => $code, 'message' => 'Personnel evaluation finalization could not be completed.']], $status);
        }

        /* Superseded legacy score-only implementation retained temporarily for
         * Phase 8C report reconciliation. It is unreachable because the
         * classification-aware service above owns every terminal response. */

        $db = db_connect();

        // Load evaluation with all related data
        $evaluation = $db->table('personnel_evaluations pe')
            ->select([
                'pe.*',
                'p.full_name AS faculty_name',
                'p.institutional_id',
                'pe.position_title_snapshot AS designation',
                'pe.department_id_snapshot AS department_id',
                'pe.department_name_snapshot AS department_name',
                'pe.college_name_snapshot AS college_name',
                'pe.college_id_snapshot AS college_id',
            ])
            ->select('NULL AS faculty_email', false)
            ->join('profiles p', 'p.id = pe.personnel_profile_id')
            ->where('pe.id', $id)
            ->get()
            ->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation not found.']], 404);
        }

        // State machine: must be in ready_for_finalization
        $transitionError = $this->validateTransition($evaluation['status'], 'completed');
        if ($transitionError !== null) {
            return $this->respond(['error' => ['code' => 'INVALID_TRANSITION', 'message' => $transitionError]], 422);
        }

        // HR is the terminal authority, including cases initially evaluated by Dean or Department Head.
        if (! $this->isHrAdmin($actor) || ! $this->isEvaluatorOrHr($actor, $evaluation)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only the assigned HR authority may finalize.']], 403);
        }

        $personnelProfileId = $evaluation['personnel_profile_id'];
        $academicYear       = $evaluation['academic_year'] ?? '';

        // Qualification gate must still be cleared at finalization time
        if (! $this->isSubmissionEligibilityCleared($evaluation)) {
            return $this->respond(['error' => ['code' => 'QUALIFICATION_NOT_CLEARED', 'message' => 'Personnel qualification gate is no longer cleared. Finalization is blocked.']], 422);
        }

        // Check all items have final disposition
        $items = $db->table('personnel_evaluation_items')
            ->where('evaluation_id', $id)
            ->get()
            ->getResultArray();

        $pendingItems = array_filter($items, fn($item) =>
            $item['verification_status'] === 'pending'
            || ($item['verification_status'] === 'verified' && $item['rating_status'] !== 'rated')
        );

        if (count($pendingItems) > 0) {
            return $this->respond([
                'error' => [
                    'code'    => 'INCOMPLETE_EVALUATION',
                    'message' => sprintf('%d item(s) are still unrated or pending verification.', count($pendingItems)),
                ],
            ], 422);
        }

        // No unresolved deficiency requests
        $unresolvedCount = $this->countUnresolvedDeficiencies($id);
        if ($unresolvedCount > 0) {
            return $this->respond([
                'error' => [
                    'code'    => 'UNRESOLVED_DEFICIENCIES',
                    'message' => "Cannot finalize: {$unresolvedCount} deficiency request(s) are still open or awaiting review.",
                ],
            ], 422);
        }

        // Authoritative recalculation
        $totals = $this->snapshotTotals($items);

        // Load qualification record for snapshot
        $qualReview = $db->table('personnel_qualification_reviews')
            ->where('personnel_profile_id', $personnelProfileId)
            ->where('academic_year', $academicYear)
            ->where('eligibility_decision', 'cleared')
            ->orderBy('created_at', 'DESC')
            ->get()
            ->getRowArray();

        $json            = $this->request->getJSON(true) ?? [];
        $reviewerRemarks = trim((string) ($json['reviewer_remarks'] ?? ''));

        $nowTs           = date('Y-m-d H:i:s');
        $nowDate         = date('Y-m-d');
        $nowTime         = date('H:i:sP');
        $reportId        = '';

        // Build immutable snapshot (Phase 13)
        $snapshot = [
            'report_type'          => 'points_summary',
            'rating_rule_version'  => 'NDMU-RANKING-2026-V1',
            'scoring_scale_label'  => 'College Faculty Ranking Scale',
            'personnel'            => [
                'profile_id'          => $personnelProfileId,
                'full_name'           => $evaluation['faculty_name'],
                'institutional_id'    => $evaluation['institutional_id'],
                'institutional_email' => $evaluation['faculty_email'],
                'designation'         => $evaluation['designation'],
                'department'          => $evaluation['department_name'],
                'college'             => $evaluation['college_name'],
            ],
            'evaluation_period'    => $academicYear,
            'qualification'        => [
                'report_label'         => $qualReview['report_label'] ?? 'Prerequisite Qualification Report',
                'eligibility_decision' => 'cleared',
                'benchmark_reference'  => $qualReview['benchmark_reference'] ?? null,
                'decision_basis'       => $qualReview['decision_basis'] ?? null,
                'report_version'       => $qualReview['report_version'] ?? null,
                'evaluated_at'         => $qualReview['evaluated_at'] ?? null,
            ],
            'reviewer'             => [
                'profile_id'    => $actor['profile']['id'],
                'full_name'     => $actor['profile']['full_name'],
                'role'          => in_array('dean', $actor['roles'], true) ? 'dean' : 'hr_staff',
                'college_scope' => $evaluation['college_id'] ?? null,
            ],
            'items'                => $items,
            'area_a_score'         => $totals['areaA_score'],
            'area_b_score'         => $totals['areaB_score'],
            'area_c_score'         => $totals['areaC_score'],
            'grand_total'          => $totals['total_score'],
            'reviewer_remarks'     => $reviewerRemarks,
            'evaluation_date'      => $nowDate,
            'evaluation_time'      => $nowTime,
            'evaluation_started_at' => $evaluation['evaluation_started_at'] ?? null,
            'finalized_at'         => $nowTs,
            'report_generated_at'  => $nowTs,
            // rank_recommendation is explicitly null — deferred per confirmed HR decision
            'rank_recommendation'  => null,
        ];

        $db->transBegin();
        try {
            // Lock evaluation row
            $db->query("SELECT id FROM personnel_evaluations WHERE id = ? FOR UPDATE", [$id]);

            // Dean endorsement already created the immutable report. HR-direct
            // evaluations create it here using the same canonical payload shape.
            $this->createDeanSummary($db, $evaluation, $items, $actor, $totals, 'completed');

            $report = $db->table('personnel_evaluation_reports')
                ->where('evaluation_id', $id)
                ->orderBy('generated_at', 'DESC')
                ->get()
                ->getRowArray();

            $reportId = $report['id'] ?? '';
            $snapshot = json_decode((string) ($report['report_payload'] ?? '{}'), true) ?: [];
            $snapshot['report_id'] = $reportId;

            // Mark evaluation completed
            $db->table('personnel_evaluations')->where('id', $id)->update([
                'status'         => 'completed',
                'total_score'    => $totals['total_score'],
                'area_a_score'   => $totals['areaA_score'],
                'area_b_score'   => $totals['areaB_score'],
                'area_c_score'   => $totals['areaC_score'],
                'final_snapshot' => json_encode($snapshot),
                'finalized_at'   => $nowTs,
                'updated_at'     => $nowTs,
            ]);

            $this->recordEvaluationEvent($db, $id, $actor['profile']['id'], 'finalized', $evaluation['status'], 'completed', "Finalized. Grand total: {$totals['total_score']}. Report ID: {$reportId}", ['report_id' => $reportId, 'grand_total' => $totals['total_score']]);

            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->respond(['error' => ['code' => 'FINALIZATION_FAILED', 'message' => 'Failed to finalize evaluation: ' . $e->getMessage()]], 500);
        }

        return $this->respond([
            'data' => [
                'message'        => 'Personnel Ranking Evaluation successfully finalized.',
                'report_id'      => $reportId,
                'grand_total'    => $totals['total_score'],
                'final_snapshot' => $snapshot,
            ],
        ], 200);
    }

    // =========================================================================
    // GET /api/v1/hr/evaluations/{id}/report
    // =========================================================================
    public function getReport(string $id): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        try {
            $result = $this->completedResultService->get($actor, $id);
            $isOwner = (string) ($actor['profile']['id'] ?? '') === (string) $result['personnel']['profile_id'];
            if (! $isOwner) {
                $reviewerReport = db_connect()->table('personnel_evaluation_reports')
                    ->where('evaluation_id', $id)->orderBy('generated_at', 'DESC')->get()->getRowArray();
                if ($reviewerReport) {
                    $reviewerReport['snapshot'] = is_string($reviewerReport['report_payload'] ?? null)
                        ? json_decode($reviewerReport['report_payload'], true)
                        : ($reviewerReport['report_payload'] ?? null);
                    return $this->respond(['data' => ['report' => $reviewerReport, 'result' => $result]], 200);
                }
            }
            // Keep the established `report` envelope while making its payload a
            // sanitized, immutable completed-result read model.
            return $this->respond(['data' => ['report' => [
                'id' => $result['result_snapshot']['report_id'],
                'evaluation_id' => $result['evaluation']['version_id'],
                'summary_score' => $result['scores']['total'],
                'passing_status' => $result['scores']['passing_status'],
                'generated_at' => $result['result_snapshot']['generated_at'],
                'snapshot' => $result,
            ], 'result' => $result]], 200);
        } catch (RuntimeException $e) {
            $code = $e->getMessage();
            $status = match ($code) {
                'EVALUATION_NOT_FOUND', 'RESULT_REPORT_NOT_FOUND' => 404,
                'RESULT_ACCESS_DENIED' => 403,
                'RESULT_NOT_RELEASED' => 409,
                default => 422,
            };
            return $this->respond(['error' => ['code' => $code, 'message' => $code === 'RESULT_NOT_RELEASED'
                ? 'Evaluation results are released to Personnel only after completion.'
                : 'Evaluation result is unavailable.']], $status);
        }
    }

    public function getResult(string $id): mixed
    {
        return $this->getReport($id);
    }

    public function printableResult(string $id): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        try {
            $result = $this->completedResultService->get($actor, $id);
            $html = (new \App\Services\PersonnelCompletedEvaluationResultHtmlRenderer())->render($result);
            return $this->response->setStatusCode(200)->setHeader('Content-Type', 'text/html; charset=UTF-8')
                ->setHeader('Cache-Control', 'private, no-store')->setBody($html);
        } catch (RuntimeException $e) {
            $code = $e->getMessage();
            $status = match ($code) {'EVALUATION_NOT_FOUND', 'RESULT_REPORT_NOT_FOUND' => 404, 'RESULT_ACCESS_DENIED' => 403, 'RESULT_NOT_RELEASED' => 409, default => 422};
            return $this->respond(['error' => ['code' => $code, 'message' => 'Printable evaluation result is unavailable.']], $status);
        }
    }

    // =========================================================================
    // POST /api/v1/hr/evaluations/{id}/deficiencies
    // =========================================================================
    public function createDeficiency(string $id): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $db = db_connect();
        $evaluation = $db->table('personnel_evaluations')->where('id', $id)->get()->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation not found.']], 404);
        }
        if (($archived = $this->archivedPeriodResponse($evaluation)) !== null) return $archived;

        if ($evaluation['status'] === 'completed') {
            return $this->respond(['error' => ['code' => 'EVALUATION_LOCKED', 'message' => 'Completed evaluations cannot have new deficiency requests.']], 409);
        }

        if (! $this->isEvaluatorOrHr($actor, $evaluation)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only the assigned evaluator or HR Admin may create deficiency requests.']], 403);
        }

        $json   = $this->request->getJSON(true) ?? [];
        $reason = trim((string) ($json['reason'] ?? ''));
        $itemId = trim((string) ($json['evaluation_item_id'] ?? ''));
        if ($itemId !== '') {
            $lockedItem = $db->table('personnel_evaluation_items')->where(['id' => $itemId, 'evaluation_id' => $id])->get()->getRowArray();
            if ($lockedItem && \App\Services\NtfAnnualReviewAreaAService::isLocked($lockedItem)) return $this->respond(['error' => ['code' => 'ITEM_LOCKED', 'message' => 'Deficiency requests cannot target Area A items locked from the NTF annual-review workbook.']], 409);
        }

        if (! ValidationHelper::validateBoundedText($reason, ValidationHelper::MAX_REASON_LENGTH)) {
            return $this->respond(['error' => ['code' => 'REASON_REQUIRED', 'message' => 'A reason (1-500 characters) is required.']], 422);
        }

        if ($itemId !== '' && ! ValidationHelper::validateUuid($itemId)) {
            return $this->respond(['error' => ['code' => 'INVALID_ITEM_ID', 'message' => 'Invalid evaluation_item_id.']], 422);
        }

        $defId = $this->genUuid();
        $db->table('personnel_evaluation_deficiency_requests')->insert([
            'id'                     => $defId,
            'evaluation_id'          => $id,
            'item_id'                => $itemId !== '' ? $itemId : null,
            'requested_by'           => $actor['profile']['id'],
            'deficiency_description' => $reason,
            'status'                 => 'pending',
            'created_at'             => date('Y-m-d H:i:s'),
            'responded_at'           => null,
        ]);

        return $this->respond(['data' => ['message' => 'Deficiency request created.', 'id' => $defId, 'status' => 'pending']], 201);
    }

    // =========================================================================
    // GET /api/v1/hr/evaluations/{id}/deficiencies
    // =========================================================================
    public function listDeficiencies(string $id): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $db = db_connect();
        $evaluation = $db->table('personnel_evaluations')->where('id', $id)->get()->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation not found.']], 404);
        }

        $actorId   = $actor['profile']['id'];
        $canAccess = $this->isHrAdmin($actor)
            || $actorId === ($evaluation['evaluator_profile_id'] ?? null)
            || $actorId === ($evaluation['personnel_profile_id'] ?? null);

        if (! $canAccess) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Access denied.']], 403);
        }

        $deficiencies = $db->table('personnel_evaluation_deficiency_requests')
            ->where('evaluation_id', $id)
            ->orderBy('created_at', 'DESC')
            ->get()
            ->getResultArray();

        return $this->respond(['data' => ['deficiencies' => $deficiencies, 'total' => count($deficiencies)]], 200);
    }

    // =========================================================================
    // POST /api/v1/hr/evaluations/{id}/deficiencies/{defId}/respond
    // Personnel responds to deficiency request
    // =========================================================================
    public function respondDeficiency(string $id, string $defId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $db         = db_connect();
        $evaluation = $db->table('personnel_evaluations')->where('id', $id)->get()->getRowArray();
        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation not found.']], 404);
        }
        if (($archived = $this->archivedPeriodResponse($evaluation)) !== null) return $archived;

        $def = $db->table('personnel_evaluation_deficiency_requests')
            ->where('id', $defId)
            ->where('evaluation_id', $id)
            ->get()
            ->getRowArray();

        if ($def === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Deficiency request not found.']], 404);
        }

        // Only the subject Personnel may respond
        if ($actor['profile']['id'] !== $evaluation['personnel_profile_id']) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only the subject Personnel may respond to this deficiency request.']], 403);
        }

        if (! in_array($def['status'], ['pending', 'open'], true)) {
            return $this->respond(['error' => ['code' => 'ALREADY_RESPONDED', 'message' => 'This deficiency request has already been responded to or resolved.']], 422);
        }

        $json = $this->request->getJSON(true) ?? [];
        $responseText = trim((string) ($json['response_text'] ?? $json['response'] ?? ''));

        $db->table('personnel_evaluation_deficiency_requests')
            ->where('id', $defId)
            ->update([
                'status'        => 'responded',
                'response_text' => $responseText !== '' ? $responseText : null,
                'responded_at'  => date('Y-m-d H:i:s'),
                'updated_at'    => date('Y-m-d H:i:s'),
            ]);

        return $this->respond(['data' => ['message' => 'Response recorded. The evaluator will review your submission.', 'status' => 'responded']], 200);
    }

    // =========================================================================
    // POST /api/v1/hr/evaluations/{id}/deficiencies/{defId}/resolve
    // Reviewer resolves a deficiency request
    // =========================================================================
    public function resolveDeficiency(string $id, string $defId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $db         = db_connect();
        $evaluation = $db->table('personnel_evaluations')->where('id', $id)->get()->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation not found.']], 404);
        }
        if (($archived = $this->archivedPeriodResponse($evaluation)) !== null) return $archived;

        if (! $this->isEvaluatorOrHr($actor, $evaluation)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only the assigned evaluator or HR Admin may resolve deficiency requests.']], 403);
        }

        $def = $db->table('personnel_evaluation_deficiency_requests')
            ->where('id', $defId)
            ->where('evaluation_id', $id)
            ->get()
            ->getRowArray();

        if ($def === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Deficiency request not found.']], 404);
        }

        if (! in_array($def['status'], ['pending', 'open', 'responded'], true)) {
            return $this->respond(['error' => ['code' => 'ALREADY_RESOLVED', 'message' => 'Deficiency request is already resolved or cancelled.']], 422);
        }

        $db->table('personnel_evaluation_deficiency_requests')
            ->where('id', $defId)
            ->update([
                'status'       => 'resolved',
                'responded_at' => $def['responded_at'] ?? date('Y-m-d H:i:s'),
                'updated_at'   => date('Y-m-d H:i:s'),
            ]);

        return $this->respond(['data' => ['message' => 'Deficiency request resolved.', 'status' => 'resolved']], 200);
    }

    // =========================================================================
    // POST /api/v1/hr/evaluations/{id}/deficiencies/{defId}/cancel
    // =========================================================================
    public function cancelDeficiency(string $id, string $defId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $db         = db_connect();
        $evaluation = $db->table('personnel_evaluations')->where('id', $id)->get()->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation not found.']], 404);
        }
        if (($archived = $this->archivedPeriodResponse($evaluation)) !== null) return $archived;

        if (! $this->isEvaluatorOrHr($actor, $evaluation)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only the assigned evaluator or HR Admin may cancel deficiency requests.']], 403);
        }

        $def = $db->table('personnel_evaluation_deficiency_requests')
            ->where('id', $defId)
            ->where('evaluation_id', $id)
            ->get()
            ->getRowArray();

        if ($def === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Deficiency request not found.']], 404);
        }

        if (! in_array($def['status'], ['pending', 'open', 'responded'], true)) {
            return $this->respond(['error' => ['code' => 'CANNOT_CANCEL', 'message' => 'Only open or responded deficiency requests can be cancelled.']], 422);
        }

        $db->table('personnel_evaluation_deficiency_requests')
            ->where('id', $defId)
            ->update([
                'status'       => 'cancelled',
                'responded_at' => $def['responded_at'] ?? date('Y-m-d H:i:s'),
                'updated_at'   => date('Y-m-d H:i:s'),
            ]);

        return $this->respond(['data' => ['message' => 'Deficiency request cancelled.', 'status' => 'cancelled']], 200);
    }
}
