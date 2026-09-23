<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

/**
 * Class PersonnelRevisionRequestService
 *
 * Authoritative Whole-Portfolio Revision Request Service for Plan J — Phase J2.
 * Coordinates whole-portfolio returns, subordinate entry/criterion comments,
 * authority and state validation, snapshot immutability, resolution on resubmission,
 * and deterministic J1 event logging.
 */
class PersonnelRevisionRequestService
{
    public const RESOLUTION_STATUS_OPEN = 'open';
    public const RESOLUTION_STATUS_RESOLVED = 'resolved';

    public const REASON_AUTHORIZED = 'authorized';
    public const REASON_UNAUTHORIZED_REVIEWER = 'revision_request_unauthorized';
    public const REASON_INVALID_STATE = 'revision_request_invalid_state';
    public const REASON_ALREADY_OPEN = 'revision_request_already_open';
    public const REASON_OVERALL_MESSAGE_REQUIRED = 'revision_message_required';
    public const REASON_SUBMITTED_VERSION_MISSING = 'submitted_version_missing';
    public const REASON_SELF_REVIEW_PROHIBITED = 'self_evaluation_prohibited';
    public const REASON_DEPT_SECRETARY_EXCLUDED = 'department_secretary_excluded';
    public const REASON_CROSS_COLLEGE_DENIED = 'cross_college_evaluation_prohibited';

    protected BaseConnection $db;
    protected PersonnelWorkflowEventService $eventService;

    public function __construct(?BaseConnection $db = null, ?PersonnelWorkflowEventService $eventService = null)
    {
        $this->db = $db ?? db_connect();
        $this->eventService = $eventService ?? new PersonnelWorkflowEventService($this->db);
    }

    /**
     * Validates if an actor is authorized and the evaluation is in a valid state to request revision.
     *
     * @param array $actor [ 'profile_id' => string, 'roles' => array, 'assigned_college_id' => ?string ]
     * @param array $evaluation [ 'id' => string, 'personnel_profile_id' => string, 'status' => string, 'version_number' => int, ... ]
     * @return array [ 'allowed' => bool, 'reason_code' => string, 'message' => string ]
     */
    public function canRequestRevision(array $actor, array $evaluation): array
    {
        $actorProfileId = (string)($actor['profile_id'] ?? $actor['id'] ?? '');
        $personnelProfileId = (string)($evaluation['personnel_profile_id'] ?? '');

        // 1. Self-review check
        if ($actorProfileId !== '' && $actorProfileId === $personnelProfileId) {
            return [
                'allowed' => false,
                'reason_code' => self::REASON_SELF_REVIEW_PROHIBITED,
                'message' => 'Personnel cannot review or return their own evaluation portfolio.',
            ];
        }

        $roles = (array)($actor['roles'] ?? []);

        // 2. Department Secretary Exclusion
        if (in_array('department_secretary', $roles, true) && !in_array('dean', $roles, true) && !in_array('hr_staff', $roles, true) && !in_array('hr_admin', $roles, true)) {
            return [
                'allowed' => false,
                'reason_code' => self::REASON_DEPT_SECRETARY_EXCLUDED,
                'message' => 'Department Secretary is strictly excluded from returning portfolios for revision.',
            ];
        }

        // 3. Personnel Role Cannot Create Reviewer Request
        if (in_array('personnel', $roles, true) && !in_array('dean', $roles, true) && !in_array('hr_staff', $roles, true) && !in_array('hr_admin', $roles, true)) {
            return [
                'allowed' => false,
                'reason_code' => self::REASON_UNAUTHORIZED_REVIEWER,
                'message' => 'Personnel role cannot create reviewer revision requests.',
            ];
        }

        // 4. Plan G Reviewer Authority
        if (!PersonnelReviewerRoutingRegistry::isAuthorizedReviewer($actor, $evaluation)) {
            $assignedRole = $evaluation['assigned_reviewer_role'] ?? 'reviewer';
            $targetCollegeId = $evaluation['target_college_id'] ?? null;
            $actorCollegeId = $actor['assigned_college_id'] ?? null;

            if ($assignedRole === 'dean' && in_array('dean', $roles, true) && $targetCollegeId !== null && $actorCollegeId !== $targetCollegeId) {
                return [
                    'allowed' => false,
                    'reason_code' => self::REASON_CROSS_COLLEGE_DENIED,
                    'message' => 'Cross-college Dean cannot return portfolio outside assigned academic college scope.',
                ];
            }

            return [
                'allowed' => false,
                'reason_code' => self::REASON_UNAUTHORIZED_REVIEWER,
                'message' => 'Actor is not the authorized reviewer or HR administrator for this evaluation.',
            ];
        }

        // 5. Lifecycle Transition Guard: only 'submitted' or 'in_evaluation' can be returned
        $currentStatus = strtolower((string)($evaluation['status'] ?? ''));
        if (!in_array($currentStatus, ['submitted', 'in_evaluation'], true)) {
            return [
                'allowed' => false,
                'reason_code' => self::REASON_INVALID_STATE,
                'message' => "Cannot return portfolio in '{$currentStatus}' status. Only 'submitted' or 'in_evaluation' submissions can be returned for revision.",
            ];
        }

        return [
            'allowed' => true,
            'reason_code' => self::REASON_AUTHORIZED,
            'message' => 'Actor is authorized to request revision for this portfolio.',
        ];
    }

    /**
     * Creates a whole-portfolio revision request with optional subordinate comments.
     *
     * @param array $actor
     * @param array $evaluation
     * @param array $payload {
     *   overall_message: string (required),
     *   deficiency_reason: ?string,
     *   requested_evidence: ?string,
     *   item_comments: ?array,
     *   criterion_comments: ?array,
     *   idempotency_key: ?string
     * }
     * @return array Standardized revision request DTO
     * @throws InvalidArgumentException|RuntimeException
     */
    public function createRevisionRequest(array $actor, array $evaluation, array $payload): array
    {
        // 1. Authorization & State Guard
        $check = $this->canRequestRevision($actor, $evaluation);
        if (!$check['allowed']) {
            throw new RuntimeException($check['message'], 403);
        }

        // 2. Validate Overall Message (Mandatory)
        $overallMessage = trim((string)($payload['overall_message'] ?? $payload['reason'] ?? ''));
        if ($overallMessage === '') {
            throw new InvalidArgumentException('An overall revision message is required.');
        }
        if (strlen($overallMessage) > 2000) {
            throw new InvalidArgumentException('Overall revision message cannot exceed 2000 characters.');
        }

        $deficiencyReason = trim((string)($payload['deficiency_reason'] ?? $payload['reason'] ?? $overallMessage));
        $requestedEvidence = trim((string)($payload['requested_evidence'] ?? $payload['required_corrections'] ?? ''));
        if ($requestedEvidence === '') {
            $requestedEvidence = $overallMessage;
        }

        $evaluationId = (string)$evaluation['id'];
        $versionNumber = isset($evaluation['version_number']) ? (int)$evaluation['version_number'] : 1;
        $evalsTable = $this->resolveEvaluationsTable();
        $itemsTable = $this->resolveItemsTable();

        // 3. Prevent duplicate open revision requests for the same version
        $existing = $this->getActiveRevisionForEvaluation($evaluationId);
        if ($existing !== null && ($existing['status'] ?? '') === self::RESOLUTION_STATUS_OPEN) {
            // If already open for this exact evaluation, check idempotency
            $idempotencyNonce = $payload['idempotency_nonce'] ?? null;
            if ($idempotencyNonce && isset($existing['idempotency_nonce']) && $existing['idempotency_nonce'] === $idempotencyNonce) {
                return $existing;
            }
            throw new RuntimeException("A revision request is already open for evaluation [{$evaluationId}].", 409);
        }

        $now = date('Y-m-d H:i:s');
        $actorId = (string)($actor['profile_id'] ?? $actor['id'] ?? '');
        $actorRole = (string)($actor['role'] ?? (is_array($actor['roles'] ?? null) ? ($actor['roles'][0] ?? 'reviewer') : 'reviewer'));
        $reviewerName = (string)($actor['full_name'] ?? $actor['name'] ?? 'Authorized Reviewer');

        // Subordinate comments validation
        $rawItemComments = (array)($payload['item_comments'] ?? $payload['item_deficiencies'] ?? []);
        $rawCriterionComments = (array)($payload['criterion_comments'] ?? []);
        $validatedComments = [];

        if (!empty($rawItemComments) || !empty($rawCriterionComments)) {
            $existingItems = $this->db->table($itemsTable)
                ->where('evaluation_id', $evaluationId)
                ->get()
                ->getResultArray();
            $itemMap = array_column($existingItems, null, 'id');

            foreach ($rawItemComments as $itemComm) {
                $itemId = trim((string)($itemComm['portfolio_item_id'] ?? $itemComm['evaluation_item_id'] ?? $itemComm['item_id'] ?? ''));
                $commentText = trim((string)($itemComm['comment_text'] ?? $itemComm['comment'] ?? $itemComm['remarks'] ?? ''));
                $itemEvidenceReq = trim((string)($itemComm['requested_evidence'] ?? ''));

                if ($itemId !== '' && !isset($itemMap[$itemId])) {
                    throw new InvalidArgumentException("Item comment references invalid evaluation item: [{$itemId}]");
                }
                if ($commentText === '') {
                    throw new InvalidArgumentException("Comment text is required for item [{$itemId}].");
                }

                $validatedComments[] = [
                    'id'                 => $this->generateUuid(),
                    'portfolio_item_id'  => $itemId,
                    'criterion_code'     => $itemMap[$itemId]['criterion_code'] ?? ($itemComm['criterion_code'] ?? null),
                    'criterion_title'    => $itemMap[$itemId]['criterion_title'] ?? null,
                    'comment_text'       => $commentText,
                    'requested_evidence' => $itemEvidenceReq !== '' ? $itemEvidenceReq : null,
                    'created_by'         => $actorId,
                    'created_at'         => $now,
                ];
            }

            foreach ($rawCriterionComments as $critComm) {
                $critCode = trim((string)($critComm['criterion_code'] ?? ''));
                $commentText = trim((string)($critComm['comment_text'] ?? $critComm['comment'] ?? ''));
                $critEvidenceReq = trim((string)($critComm['requested_evidence'] ?? ''));

                if ($critCode === '' || $commentText === '') {
                    continue;
                }

                $validatedComments[] = [
                    'id'                 => $this->generateUuid(),
                    'portfolio_item_id'  => null,
                    'criterion_code'     => $critCode,
                    'criterion_title'    => $critComm['criterion_title'] ?? null,
                    'comment_text'       => $commentText,
                    'requested_evidence' => $critEvidenceReq !== '' ? $critEvidenceReq : null,
                    'created_by'         => $actorId,
                    'created_at'         => $now,
                ];
            }
        }

        $requestId = $this->generateUuid();
        $revisionRecord = [
            'id'                     => $requestId,
            'evaluation_id'          => $evaluationId,
            'portfolio_version_id'   => $evaluationId,
            'version_number'         => $versionNumber,
            'personnel_profile_id'   => $evaluation['personnel_profile_id'] ?? null,
            'reviewer_id'            => $actorId,
            'reviewer_role'          => $actorRole,
            'reviewer_name'          => $reviewerName,
            'overall_message'        => $overallMessage,
            'deficiency_reason'      => $deficiencyReason,
            'requested_evidence'     => $requestedEvidence,
            'comments'               => $validatedComments,
            'status'                 => self::RESOLUTION_STATUS_OPEN,
            'requested_at'           => $now,
            'resolved_at'            => null,
            'resolved_by_version_id' => null,
            'idempotency_nonce'      => $payload['idempotency_nonce'] ?? null,
            'created_at'             => $now,
        ];

        // Begin Transaction: atomically update status, remarks, items, and log canonical event
        $this->db->transBegin();
        try {
            // 1. Update Evaluation status to 'returned_for_revision'
            $this->db->table($evalsTable)->where('id', $evaluationId)->update([
                'status'            => PersonnelWorkflowEventRegistry::STATUS_RETURNED_FOR_REVISION,
                'return_reason'     => $deficiencyReason,
                'evaluator_remarks' => json_encode($revisionRecord),
                'returned_at'       => $now,
                'updated_at'        => $now,
            ]);

            // 2. Update item-level remarks and verification status if comments exist
            foreach ($validatedComments as $comm) {
                if (!empty($comm['portfolio_item_id'])) {
                    $this->db->table($itemsTable)->where('id', $comm['portfolio_item_id'])->update([
                        'evaluator_remarks'   => $comm['comment_text'],
                        'verification_status' => 'needs_revision',
                        'updated_at'          => $now,
                    ]);
                }
            }

            // 3. Record Deterministic J1 Event: revision_requested
            $this->eventService->recordEvent([
                'event_key'            => PersonnelWorkflowEventRegistry::EVENT_REVISION_REQUESTED,
                'evaluation_id'        => $evaluationId,
                'actor_user_id'        => $actorId,
                'actor_role'           => $actorRole,
                'subject_personnel_id' => $evaluation['personnel_profile_id'] ?? null,
                'version_number'       => $versionNumber,
                'source_plan'          => 'Plan J Phase J2',
                'metadata'             => [
                    'revision_request_id' => $requestId,
                    'reason'              => $deficiencyReason,
                    'required_corrections'=> $requestedEvidence,
                    'overall_message'     => $overallMessage,
                    'reviewer_name'       => $reviewerName,
                    'comments_count'      => count($validatedComments),
                ],
                'idempotency_nonce'    => $payload['idempotency_nonce'] ?? null,
            ]);

            $this->db->transCommit();
        } catch (Throwable $e) {
            $this->db->transRollback();
            throw new RuntimeException("Failed to persist revision request: " . $e->getMessage(), 500, $e);
        }

        return $revisionRecord;
    }

    /**
     * Resolves an open revision request when Personnel successfully resubmits the portfolio (Plan C).
     *
     * @param string $priorEvaluationId
     * @param string $newVersionId
     * @param int $newVersionNumber
     * @return array|null Resolved revision request DTO
     */
    public function resolveRevisionRequest(string $priorEvaluationId, string $newVersionId, int $newVersionNumber): ?array
    {
        $evalsTable = $this->resolveEvaluationsTable();
        $evaluation = $this->db->table($evalsTable)->where('id', $priorEvaluationId)->get()->getRowArray();
        if ($evaluation === null) {
            return null;
        }

        $rawRemarks = $evaluation['evaluator_remarks'] ?? '';
        $revisionRecord = json_decode($rawRemarks, true);
        if (!is_array($revisionRecord) || ($revisionRecord['status'] ?? '') !== self::RESOLUTION_STATUS_OPEN) {
            return null;
        }

        $now = date('Y-m-d H:i:s');
        $revisionRecord['status'] = self::RESOLUTION_STATUS_RESOLVED;
        $revisionRecord['resolved_at'] = $now;
        $revisionRecord['resolved_by_version_id'] = $newVersionId;
        $revisionRecord['resolved_by_version_number'] = $newVersionNumber;

        $this->db->table($evalsTable)->where('id', $priorEvaluationId)->update([
            'evaluator_remarks' => json_encode($revisionRecord),
            'updated_at'        => $now,
        ]);

        return $revisionRecord;
    }

    /**
     * Retrieves the active or latest revision request for an evaluation.
     */
    public function getActiveRevisionForEvaluation(string $evaluationId): ?array
    {
        $evalsTable = $this->resolveEvaluationsTable();
        $evaluation = $this->db->table($evalsTable)->where('id', $evaluationId)->get()->getRowArray();
        if ($evaluation === null) {
            return null;
        }

        $rawRemarks = $evaluation['evaluator_remarks'] ?? '';
        $parsed = json_decode($rawRemarks, true);
        if (is_array($parsed) && isset($parsed['id']) && isset($parsed['status'])) {
            return $parsed;
        }

        if (!empty($evaluation['return_reason']) || strtolower((string)$evaluation['status']) === PersonnelWorkflowEventRegistry::STATUS_RETURNED_FOR_REVISION) {
            return [
                'id'                     => 'legacy-rev-' . $evaluation['id'],
                'evaluation_id'          => $evaluation['id'],
                'portfolio_version_id'   => $evaluation['id'],
                'version_number'         => (int)($evaluation['version_number'] ?? 1),
                'personnel_profile_id'   => $evaluation['personnel_profile_id'] ?? null,
                'reviewer_id'            => $evaluation['evaluator_profile_id'] ?? null,
                'reviewer_role'          => 'reviewer',
                'reviewer_name'          => 'Authorized Reviewer',
                'overall_message'        => $evaluation['return_reason'] ?? 'Revision requested.',
                'deficiency_reason'      => $evaluation['return_reason'] ?? 'Revision requested.',
                'requested_evidence'     => $evaluation['return_reason'] ?? 'Revision requested.',
                'comments'               => [],
                'status'                 => self::RESOLUTION_STATUS_OPEN,
                'requested_at'           => $evaluation['returned_at'] ?? $evaluation['updated_at'] ?? date('Y-m-d H:i:s'),
                'resolved_at'            => null,
                'resolved_by_version_id' => null,
                'created_at'             => $evaluation['returned_at'] ?? $evaluation['created_at'] ?? date('Y-m-d H:i:s'),
            ];
        }

        return null;
    }

    /**
     * Builds Personnel-facing revision read model.
     */
    public function formatPersonnelRevisionReadModel(array $evaluation, ?array $revisionRequest): array
    {
        $status = strtolower((string)($evaluation['status'] ?? ''));
        $displayStatus = PersonnelWorkflowEventRegistry::getStatusDisplayLabel($status);

        return [
            'evaluation_id'        => $evaluation['id'] ?? null,
            'status'               => $status,
            'display_status'       => $displayStatus,
            'version_number'       => (int)($evaluation['version_number'] ?? 1),
            'has_active_revision'  => ($revisionRequest !== null && ($revisionRequest['status'] ?? '') === self::RESOLUTION_STATUS_OPEN),
            'revision_request'     => $revisionRequest ? [
                'request_id'             => $revisionRequest['id'] ?? null,
                'overall_message'        => $revisionRequest['overall_message'] ?? '',
                'deficiency_reason'      => $revisionRequest['deficiency_reason'] ?? '',
                'requested_evidence'     => $revisionRequest['requested_evidence'] ?? '',
                'reviewer_name'          => $revisionRequest['reviewer_name'] ?? 'Authorized Reviewer',
                'reviewer_role'          => $revisionRequest['reviewer_role'] ?? 'reviewer',
                'requested_at'           => $revisionRequest['requested_at'] ?? null,
                'resolution_status'      => $revisionRequest['status'] ?? self::RESOLUTION_STATUS_OPEN,
                'resolved_at'            => $revisionRequest['resolved_at'] ?? null,
                'resolved_by_version_id' => $revisionRequest['resolved_by_version_id'] ?? null,
                'comments'               => $revisionRequest['comments'] ?? [],
            ] : null,
        ];
    }

    /**
     * Builds Reviewer-facing revision read model.
     */
    public function formatReviewerRevisionReadModel(array $evaluation, ?array $revisionRequest): array
    {
        $readModel = $this->formatPersonnelRevisionReadModel($evaluation, $revisionRequest);
        $readModel['evaluator_profile_id'] = $evaluation['evaluator_profile_id'] ?? null;
        $readModel['academic_year'] = $evaluation['academic_year'] ?? '2025-2026';
        $readModel['submission_type'] = $evaluation['submission_type'] ?? 'Personnel Ranking Evaluation';
        return $readModel;
    }

    protected function resolveEvaluationsTable(): string
    {
        return $this->db->tableExists('public.personnel_evaluations') 
            ? 'public.personnel_evaluations' 
            : 'personnel_evaluations';
    }

    protected function resolveItemsTable(): string
    {
        return $this->db->tableExists('public.personnel_evaluation_items') 
            ? 'public.personnel_evaluation_items' 
            : 'personnel_evaluation_items';
    }

    protected function generateUuid(): string
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
}
