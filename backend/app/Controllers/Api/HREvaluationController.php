<?php

namespace App\Controllers\Api;

use App\Helpers\ValidationHelper;
use App\Services\AuthenticatedActorService;
use App\Services\HREvaluationService;
use App\Services\ReviewerResolverService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
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

    public function __construct(
        ?AuthenticatedActorService $actorService = null,
        ?ReviewerResolverService $reviewerResolver = null
    ) {
        $this->actorService     = $actorService     ?? new AuthenticatedActorService();
        $this->reviewerResolver = $reviewerResolver ?? new ReviewerResolverService();
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

    /**
     * Validates that the requested status transition is allowed.
     * Returns null on success, or an error message string.
     */
    private function validateTransition(string $from, string $to): ?string
    {
        $allowed = [
            'submitted'              => ['in_evaluation'],
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
        $review = $db->table('public.personnel_qualification_reviews')
            ->where('personnel_profile_id', $personnelProfileId)
            ->where('academic_year', $academicYear)
            ->where('eligibility_decision', 'cleared')
            ->get()
            ->getRowArray();
        return $review !== null;
    }

    /**
     * Counts unresolved deficiency requests for an evaluation.
     */
    private function countUnresolvedDeficiencies(string $evaluationId): int
    {
        $db = db_connect();
        return (int) $db->table('public.personnel_evaluation_deficiency_requests')
            ->where('evaluation_id', $evaluationId)
            ->whereIn('status', ['open', 'responded'])
            ->countAllResults();
    }

    // =========================================================================
    // GET /api/v1/hr/evaluations
    // =========================================================================
    public function list(): mixed
    {
        $actor = $this->resolveActor();
        if (! $this->isHrAdmin($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Admin authority required.']], 403);
        }

        $db     = db_connect();
        $status = $this->request->getGet('status');
        $search = trim((string) $this->request->getGet('search'));

        $builder = $db->table('public.personnel_evaluations pe')
            ->select([
                'pe.*',
                'p.full_name AS faculty_name',
                'p.institutional_id',
                'p.institutional_email AS email',
                'p.department_id',
                'p.designation',
                'd.name AS department_name',
                'evaluator.full_name AS evaluator_name',
            ])
            ->join('public.profiles p', 'p.id = pe.personnel_profile_id')
            ->join('public.departments d', 'd.id = p.department_id', 'left')
            ->join('public.profiles evaluator', 'evaluator.id = pe.evaluator_profile_id', 'left')
            ->orderBy('pe.submitted_at', 'DESC');

        if ($status && $status !== 'ALL') {
            $builder->where('pe.status', $status);
        }

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
        $evaluation = $db->table('public.personnel_evaluations pe')
            ->select([
                'pe.*',
                'p.full_name AS faculty_name',
                'p.institutional_id',
                'p.institutional_email AS email',
                'p.designation',
                'd.name AS department',
                'c.name AS college',
                'evaluator.full_name AS evaluator_name',
            ])
            ->join('public.profiles p', 'p.id = pe.personnel_profile_id')
            ->join('public.departments d', 'd.id = p.department_id', 'left')
            ->join('public.colleges c', 'c.id = d.college_id', 'left')
            ->join('public.profiles evaluator', 'evaluator.id = pe.evaluator_profile_id', 'left')
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

        $items = $db->table('public.personnel_evaluation_items')
            ->where('evaluation_id', $id)
            ->orderBy('category_area', 'ASC')
            ->orderBy('criterion_code', 'ASC')
            ->get()
            ->getResultArray();

        $scores = HREvaluationService::recalculateTotals($items, (int) ($evaluation['tenure_years'] ?? 0));

        $deficiencies = $db->table('public.personnel_evaluation_deficiency_requests')
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

        // Only HR Admin or Dean can start an evaluation (HR for directors/coordinators/deans; Dean for faculty)
        $isHr   = $this->isHrAdmin($actor);
        $isDean = in_array('dean', $actor['roles'], true);
        if (! $isHr && ! $isDean) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Admin or Dean role required to start an evaluation.']], 403);
        }

        if (! ValidationHelper::validateUuid($id)) {
            return $this->respond(['error' => ['code' => 'INVALID_ID', 'message' => 'Invalid evaluation ID.']], 422);
        }

        $db = db_connect();
        $evaluation = $db->table('public.personnel_evaluations')->where('id', $id)->get()->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation not found.']], 404);
        }

        // State machine: must be in 'submitted'
        $transitionError = $this->validateTransition($evaluation['status'], 'in_evaluation');
        if ($transitionError !== null) {
            return $this->respond(['error' => ['code' => 'INVALID_TRANSITION', 'message' => $transitionError]], 422);
        }

        $personnelProfileId = $evaluation['personnel_profile_id'];
        $academicYear       = $evaluation['academic_year'] ?? '';

        // Phase 8: Qualification Gate — must be cleared before evaluation can start
        if ($academicYear !== '' && ! $this->isQualificationCleared($personnelProfileId, $academicYear)) {
            return $this->respond([
                'error' => [
                    'code'    => 'QUALIFICATION_NOT_CLEARED',
                    'message' => "Personnel has not been cleared by the Prerequisite Qualification Report for academic year {$academicYear}. Evaluation cannot begin.",
                ],
            ], 422);
        }

        // Phase 8: Server-side reviewer resolution — frontend cannot supply evaluator
        try {
            $resolved = $this->reviewerResolver->resolve($personnelProfileId);
        } catch (Throwable $e) {
            return $this->respond([
                'error' => [
                    'code'    => 'REVIEWER_NOT_FOUND',
                    'message' => 'Cannot determine authorized reviewer: ' . $e->getMessage(),
                ],
            ], 422);
        }

        // Verify that the calling actor IS the resolved evaluator
        if ($actor['profile']['id'] !== $resolved['evaluator_profile_id']) {
            return $this->respond([
                'error' => [
                    'code'    => 'EVALUATOR_MISMATCH',
                    'message' => 'The authenticated user is not the authorized evaluator for this Personnel.',
                ],
            ], 403);
        }

        $db->transBegin();
        try {
            $db->table('public.personnel_evaluations')->where('id', $id)->update([
                'status'                => 'in_evaluation',
                'evaluator_profile_id'  => $resolved['evaluator_profile_id'],
                'evaluation_started_at' => date('Y-m-d H:i:s'),
                'updated_at'            => date('Y-m-d H:i:s'),
            ]);

            $db->table('public.personnel_evaluation_events')->insert([
                'evaluation_id' => $id,
                'event_type'    => 'evaluation_started',
                'performed_by'  => $actor['profile']['id'],
                'notes'         => "Evaluation started by {$actor['profile']['full_name']} (role: {$resolved['evaluator_role']})",
                'payload'       => json_encode([
                    'evaluator_profile_id' => $resolved['evaluator_profile_id'],
                    'evaluator_role'       => $resolved['evaluator_role'],
                    'evaluator_college_id' => $resolved['evaluator_college_id'],
                ]),
                'occurred_at'   => date('Y-m-d H:i:s'),
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
        $evaluation = $db->table('public.personnel_evaluations')->where('id', $id)->get()->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation not found.']], 404);
        }

        // Lock: completed evaluations are immutable
        if ($evaluation['status'] === 'completed') {
            return $this->respond(['error' => ['code' => 'EVALUATION_LOCKED', 'message' => 'Completed evaluations cannot be modified.']], 409);
        }

        // Only the assigned evaluator or HR Admin may verify
        if (! $this->isEvaluatorOrHr($actor, $evaluation)) {
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

        $item = $db->table('public.personnel_evaluation_items')
            ->where('id', $itemId)
            ->where('evaluation_id', $id)
            ->get()
            ->getRowArray();

        if ($item === null) {
            return $this->respond(['error' => ['code' => 'ITEM_NOT_FOUND', 'message' => 'Evaluation item not found.']], 404);
        }

        $db->table('public.personnel_evaluation_items')->where('id', $itemId)->update([
            'verification_status' => $status,
            'rating_status'       => $status === 'ineligible' ? 'not_applicable' : 'unrated',
            'awarded_points'      => $status === 'ineligible' ? 0.0 : null,
            'evaluator_remarks'   => $remarks,
            'evaluated_by'        => $actor['profile']['id'],
            'evaluated_at'        => date('Y-m-d H:i:s'),
            'updated_at'          => date('Y-m-d H:i:s'),
        ]);

        $db->table('public.personnel_evaluation_events')->insert([
            'evaluation_id' => $id,
            'event_type'    => 'item_verified',
            'performed_by'  => $actor['profile']['id'],
            'notes'         => "Item {$itemId} verification_status set to: {$status}",
            'payload'       => json_encode(['item_id' => $itemId, 'verification_status' => $status]),
            'occurred_at'   => date('Y-m-d H:i:s'),
        ]);

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
        $evaluation = $db->table('public.personnel_evaluations')->where('id', $id)->get()->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation not found.']], 404);
        }

        // Lock: completed evaluations are immutable
        if ($evaluation['status'] === 'completed') {
            return $this->respond(['error' => ['code' => 'EVALUATION_LOCKED', 'message' => 'Completed evaluations cannot be modified.']], 409);
        }

        // Only the assigned evaluator or HR Admin may rate
        if (! $this->isEvaluatorOrHr($actor, $evaluation)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only the assigned evaluator or HR Admin may rate items.']], 403);
        }

        $item = $db->table('public.personnel_evaluation_items')
            ->where('id', $itemId)
            ->where('evaluation_id', $id)
            ->get()
            ->getRowArray();

        if ($item === null) {
            return $this->respond(['error' => ['code' => 'ITEM_NOT_FOUND', 'message' => 'Evaluation item not found.']], 404);
        }

        // Enforce: item must be verified before rating
        if ($item['verification_status'] !== 'verified') {
            return $this->respond(['error' => ['code' => 'NOT_VERIFIED', 'message' => 'Item must be verified before it can be rated.']], 422);
        }

        $json    = $this->request->getJSON(true) ?? [];
        $payload = (array) ($json['scoring_payload'] ?? []);
        $remarks = trim((string) ($json['evaluator_remarks'] ?? ''));

        // MANUAL_BOUNDED requires justification
        if ($item['scoring_mode'] === 'MANUAL_BOUNDED') {
            $justification = trim((string) ($payload['justification'] ?? ''));
            if (strlen($justification) < 10) {
                return $this->respond(['error' => ['code' => 'JUSTIFICATION_REQUIRED', 'message' => 'Evaluator justification (minimum 10 characters) is required for manual bounded scoring.']], 422);
            }
        }

        if ($remarks !== '' && ! ValidationHelper::validateBoundedText($remarks, ValidationHelper::MAX_REMARKS_LENGTH)) {
            return $this->respond(['error' => ['code' => 'REMARKS_TOO_LONG', 'message' => 'Remarks exceed maximum allowed length.']], 422);
        }

        $awardedPoints = HREvaluationService::evaluateItemScore(
            $item['criterion_code'],
            $item['scoring_mode'],
            $payload
        );

        $db->table('public.personnel_evaluation_items')->where('id', $itemId)->update([
            'rating_status'   => 'rated',
            'awarded_points'  => $awardedPoints,
            'scoring_payload' => json_encode($payload),
            'evaluator_remarks' => $remarks,
            'evaluated_by'    => $actor['profile']['id'],
            'evaluated_at'    => date('Y-m-d H:i:s'),
            'updated_at'      => date('Y-m-d H:i:s'),
        ]);

        // Recalculate totals after every rating
        $allItems = $db->table('public.personnel_evaluation_items')
            ->where('evaluation_id', $id)
            ->get()
            ->getResultArray();

        $totals = HREvaluationService::recalculateTotals($allItems, (int) ($evaluation['tenure_years'] ?? 0));

        $db->table('public.personnel_evaluations')->where('id', $id)->update([
            'total_score'  => $totals['total_score'],
            'area_a_score' => $totals['areaA_score'],
            'area_b_score' => $totals['areaB_score'],
            'area_c_score' => $totals['areaC_score'],
            'updated_at'   => date('Y-m-d H:i:s'),
        ]);

        $db->table('public.personnel_evaluation_events')->insert([
            'evaluation_id' => $id,
            'event_type'    => 'item_rated',
            'performed_by'  => $actor['profile']['id'],
            'notes'         => "Item {$itemId} rated: {$awardedPoints} pts",
            'payload'       => json_encode(['item_id' => $itemId, 'awarded_points' => $awardedPoints]),
            'occurred_at'   => date('Y-m-d H:i:s'),
        ]);

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
        $evaluation = $db->table('public.personnel_evaluations')->where('id', $id)->get()->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation not found.']], 404);
        }

        $transitionError = $this->validateTransition($evaluation['status'], 'returned_for_revision');
        if ($transitionError !== null) {
            return $this->respond(['error' => ['code' => 'INVALID_TRANSITION', 'message' => $transitionError]], 422);
        }

        if (! $this->isEvaluatorOrHr($actor, $evaluation)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only the assigned evaluator or HR Admin may return an evaluation.']], 403);
        }

        $json   = $this->request->getJSON(true) ?? [];
        $reason = trim((string) ($json['reason'] ?? ''));

        if ($reason === '' || ! ValidationHelper::validateBoundedText($reason, ValidationHelper::MAX_REASON_LENGTH)) {
            return $this->respond(['error' => ['code' => 'REASON_REQUIRED', 'message' => 'A return reason (1-500 characters) is required.']], 422);
        }

        $db->table('public.personnel_evaluations')->where('id', $id)->update([
            'status'        => 'returned_for_revision',
            'return_reason' => $reason,
            'returned_at'   => date('Y-m-d H:i:s'),
            'updated_at'    => date('Y-m-d H:i:s'),
        ]);

        $db->table('public.personnel_evaluation_events')->insert([
            'evaluation_id' => $id,
            'event_type'    => 'returned_for_revision',
            'performed_by'  => $actor['profile']['id'],
            'notes'         => $reason,
            'payload'       => json_encode(['reason' => $reason]),
            'occurred_at'   => date('Y-m-d H:i:s'),
        ]);

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
        $evaluation = $db->table('public.personnel_evaluations')->where('id', $id)->get()->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation not found.']], 404);
        }

        $transitionError = $this->validateTransition($evaluation['status'], 'ready_for_finalization');
        if ($transitionError !== null) {
            return $this->respond(['error' => ['code' => 'INVALID_TRANSITION', 'message' => $transitionError]], 422);
        }

        // Only the assigned evaluator or HR Admin may mark ready
        if (! $this->isEvaluatorOrHr($actor, $evaluation)) {
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

        $db->table('public.personnel_evaluations')->where('id', $id)->update([
            'status'     => 'ready_for_finalization',
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        $db->table('public.personnel_evaluation_events')->insert([
            'evaluation_id' => $id,
            'event_type'    => 'marked_ready_for_finalization',
            'performed_by'  => $actor['profile']['id'],
            'notes'         => "Marked ready for finalization by {$actor['profile']['full_name']}",
            'occurred_at'   => date('Y-m-d H:i:s'),
        ]);

        return $this->respond(['data' => ['message' => 'Evaluation marked as ready for finalization.']], 200);
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

        $db = db_connect();

        // Load evaluation with all related data
        $evaluation = $db->table('public.personnel_evaluations pe')
            ->select([
                'pe.*',
                'p.full_name AS faculty_name',
                'p.institutional_id',
                'p.institutional_email AS faculty_email',
                'p.designation',
                'p.department_id',
                'd.name AS department_name',
                'c.name AS college_name',
                'c.id AS college_id',
            ])
            ->join('public.profiles p', 'p.id = pe.personnel_profile_id')
            ->join('public.departments d', 'd.id = p.department_id', 'left')
            ->join('public.colleges c', 'c.id = d.college_id', 'left')
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

        // Only the assigned evaluator or HR Admin may finalize
        if (! $this->isEvaluatorOrHr($actor, $evaluation)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only the assigned evaluator or HR Admin may finalize.']], 403);
        }

        $personnelProfileId = $evaluation['personnel_profile_id'];
        $academicYear       = $evaluation['academic_year'] ?? '';

        // Qualification gate must still be cleared at finalization time
        if ($academicYear !== '' && ! $this->isQualificationCleared($personnelProfileId, $academicYear)) {
            return $this->respond(['error' => ['code' => 'QUALIFICATION_NOT_CLEARED', 'message' => 'Personnel qualification gate is no longer cleared. Finalization is blocked.']], 422);
        }

        // Check all items have final disposition
        $items = $db->table('public.personnel_evaluation_items')
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
        $totals = HREvaluationService::recalculateTotals($items, (int) ($evaluation['tenure_years'] ?? 0));

        // Load qualification record for snapshot
        $qualReview = $db->table('public.personnel_qualification_reviews')
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
            $db->query("SELECT id FROM public.personnel_evaluations WHERE id = ? FOR UPDATE", [$id]);

            // Write immutable report snapshot
            $db->table('public.personnel_evaluation_reports')->insert([
                'evaluation_id' => $id,
                'report_type'   => 'points_summary',
                'snapshot'      => json_encode($snapshot),
                'generated_by'  => $actor['profile']['id'],
                'generated_at'  => $nowTs,
                'version'       => 1,
            ]);

            $report = $db->table('public.personnel_evaluation_reports')
                ->where('evaluation_id', $id)
                ->orderBy('generated_at', 'DESC')
                ->get()
                ->getRowArray();

            $reportId = $report['id'] ?? '';
            $snapshot['report_id'] = $reportId;

            // Mark evaluation completed
            $db->table('public.personnel_evaluations')->where('id', $id)->update([
                'status'         => 'completed',
                'total_score'    => $totals['total_score'],
                'area_a_score'   => $totals['areaA_score'],
                'area_b_score'   => $totals['areaB_score'],
                'area_c_score'   => $totals['areaC_score'],
                'final_snapshot' => json_encode($snapshot),
                'finalized_at'   => $nowTs,
                'updated_at'     => $nowTs,
            ]);

            $db->table('public.personnel_evaluation_events')->insert([
                'evaluation_id' => $id,
                'event_type'    => 'finalized',
                'performed_by'  => $actor['profile']['id'],
                'notes'         => "Finalized. Grand total: {$totals['total_score']}. Report ID: {$reportId}",
                'payload'       => json_encode(['report_id' => $reportId, 'grand_total' => $totals['total_score']]),
                'occurred_at'   => $nowTs,
            ]);

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

        $db = db_connect();
        $evaluation = $db->table('public.personnel_evaluations')->where('id', $id)->get()->getRowArray();

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

        if ($evaluation['status'] !== 'completed') {
            return $this->respond(['error' => ['code' => 'NOT_FINALIZED', 'message' => 'Report is only available for completed evaluations.']], 422);
        }

        $report = $db->table('public.personnel_evaluation_reports')
            ->where('evaluation_id', $id)
            ->orderBy('generated_at', 'DESC')
            ->get()
            ->getRowArray();

        if ($report === null) {
            return $this->respond(['error' => ['code' => 'REPORT_NOT_FOUND', 'message' => 'Report not found for this evaluation.']], 404);
        }

        return $this->respond(['data' => ['report' => $report]], 200);
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
        $evaluation = $db->table('public.personnel_evaluations')->where('id', $id)->get()->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation not found.']], 404);
        }

        if ($evaluation['status'] === 'completed') {
            return $this->respond(['error' => ['code' => 'EVALUATION_LOCKED', 'message' => 'Completed evaluations cannot have new deficiency requests.']], 409);
        }

        if (! $this->isEvaluatorOrHr($actor, $evaluation)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only the assigned evaluator or HR Admin may create deficiency requests.']], 403);
        }

        $json   = $this->request->getJSON(true) ?? [];
        $reason = trim((string) ($json['reason'] ?? ''));
        $itemId = trim((string) ($json['evaluation_item_id'] ?? ''));

        if (! ValidationHelper::validateBoundedText($reason, ValidationHelper::MAX_REASON_LENGTH)) {
            return $this->respond(['error' => ['code' => 'REASON_REQUIRED', 'message' => 'A reason (1-500 characters) is required.']], 422);
        }

        if ($itemId !== '' && ! ValidationHelper::validateUuid($itemId)) {
            return $this->respond(['error' => ['code' => 'INVALID_ITEM_ID', 'message' => 'Invalid evaluation_item_id.']], 422);
        }

        $db->table('public.personnel_evaluation_deficiency_requests')->insert([
            'evaluation_id'      => $id,
            'evaluation_item_id' => $itemId !== '' ? $itemId : null,
            'requested_by'       => $actor['profile']['id'],
            'requested_from'     => $evaluation['personnel_profile_id'],
            'reason'             => $reason,
            'status'             => 'open',
            'created_at'         => date('Y-m-d H:i:s'),
            'responded_at'       => null,
            'resolved_at'        => null,
        ]);

        return $this->respond(['data' => ['message' => 'Deficiency request created.', 'status' => 'open']], 201);
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
        $evaluation = $db->table('public.personnel_evaluations')->where('id', $id)->get()->getRowArray();

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

        $deficiencies = $db->table('public.personnel_evaluation_deficiency_requests')
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

        $db  = db_connect();
        $def = $db->table('public.personnel_evaluation_deficiency_requests')
            ->where('id', $defId)
            ->where('evaluation_id', $id)
            ->get()
            ->getRowArray();

        if ($def === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Deficiency request not found.']], 404);
        }

        // Only the Personnel who was requested_from may respond
        if ($actor['profile']['id'] !== $def['requested_from']) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only the subject Personnel may respond to this deficiency request.']], 403);
        }

        if ($def['status'] !== 'open') {
            return $this->respond(['error' => ['code' => 'ALREADY_RESPONDED', 'message' => 'This deficiency request has already been responded to or resolved.']], 422);
        }

        $db->table('public.personnel_evaluation_deficiency_requests')
            ->where('id', $defId)
            ->update([
                'status'       => 'responded',
                'responded_at' => date('Y-m-d H:i:s'),
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
        $evaluation = $db->table('public.personnel_evaluations')->where('id', $id)->get()->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation not found.']], 404);
        }

        if (! $this->isEvaluatorOrHr($actor, $evaluation)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only the assigned evaluator or HR Admin may resolve deficiency requests.']], 403);
        }

        $def = $db->table('public.personnel_evaluation_deficiency_requests')
            ->where('id', $defId)
            ->where('evaluation_id', $id)
            ->get()
            ->getRowArray();

        if ($def === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Deficiency request not found.']], 404);
        }

        if (! in_array($def['status'], ['open', 'responded'], true)) {
            return $this->respond(['error' => ['code' => 'ALREADY_RESOLVED', 'message' => 'Deficiency request is already resolved or cancelled.']], 422);
        }

        $db->table('public.personnel_evaluation_deficiency_requests')
            ->where('id', $defId)
            ->update([
                'status'       => 'resolved',
                'resolved_at'  => date('Y-m-d H:i:s'),
                'resolved_by'  => $actor['profile']['id'],
                'responded_at' => $def['responded_at'] ?? date('Y-m-d H:i:s'),
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
        $evaluation = $db->table('public.personnel_evaluations')->where('id', $id)->get()->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation not found.']], 404);
        }

        if (! $this->isEvaluatorOrHr($actor, $evaluation)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only the assigned evaluator or HR Admin may cancel deficiency requests.']], 403);
        }

        $def = $db->table('public.personnel_evaluation_deficiency_requests')
            ->where('id', $defId)
            ->where('evaluation_id', $id)
            ->get()
            ->getRowArray();

        if ($def === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Deficiency request not found.']], 404);
        }

        if (! in_array($def['status'], ['open', 'responded'], true)) {
            return $this->respond(['error' => ['code' => 'CANNOT_CANCEL', 'message' => 'Only open or responded deficiency requests can be cancelled.']], 422);
        }

        $db->table('public.personnel_evaluation_deficiency_requests')
            ->where('id', $defId)
            ->update([
                'status'       => 'cancelled',
                'resolved_at'  => date('Y-m-d H:i:s'),
                'resolved_by'  => $actor['profile']['id'],
                'responded_at' => $def['responded_at'] ?? date('Y-m-d H:i:s'),
            ]);

        return $this->respond(['data' => ['message' => 'Deficiency request cancelled.', 'status' => 'cancelled']], 200);
    }
}
