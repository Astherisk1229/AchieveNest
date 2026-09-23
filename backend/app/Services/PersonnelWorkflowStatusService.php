<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use InvalidArgumentException;
use RuntimeException;

/**
 * Class PersonnelWorkflowStatusService
 *
 * Authoritative Cross-Role Status Visibility & Lifecycle Synchronization Service for Plan J — Phase J4.
 * Computes canonical status read models across Personnel, Dean, and HR views,
 * ensures strict separation between lifecycle status, evaluation results, and promotion decisions,
 * and extracts the latest meaningful workflow event from persisted audit data.
 */
class PersonnelWorkflowStatusService
{
    protected BaseConnection $db;
    protected string $evaluationsTable;
    protected string $eventsTable;

    public function __construct(?BaseConnection $db = null)
    {
        $this->db = $db ?? db_connect();
        $this->evaluationsTable = $this->resolveEvaluationsTable();
        $this->eventsTable = $this->resolveEventsTable();
    }

    protected function resolveEvaluationsTable(): string
    {
        return $this->db->tableExists('public.personnel_evaluations') 
            ? 'public.personnel_evaluations' 
            : 'personnel_evaluations';
    }

    protected function resolveEventsTable(): string
    {
        return $this->db->tableExists('public.personnel_evaluation_events') 
            ? 'public.personnel_evaluation_events' 
            : 'personnel_evaluation_events';
    }

    /**
     * Retrieves the authoritative canonical status read model for an evaluation.
     *
     * @param string $evaluationId
     * @param array|null $actor [ 'profile_id' => string, 'roles' => array, 'assigned_college_id' => ?string ]
     * @return array Standardized cross-role status read model
     * @throws InvalidArgumentException|RuntimeException
     */
    public function getStatusReadModel(string $evaluationId, ?array $actor = null): array
    {
        $evaluation = $this->db->table($this->evaluationsTable)
            ->where('id', $evaluationId)
            ->get()
            ->getRowArray();

        if ($evaluation === null) {
            throw new RuntimeException("Evaluation submission not found: [{$evaluationId}]", 404);
        }

        // Authorization check if actor is provided
        if ($actor !== null) {
            $this->validateStatusAccess($actor, $evaluation);
        }

        $rawStatus = strtolower((string)($evaluation['status'] ?? PersonnelWorkflowEventRegistry::STATUS_SUBMITTED));
        $lifecycleStatus = PersonnelWorkflowEventRegistry::isValidStatus($rawStatus) 
            ? $rawStatus 
            : PersonnelWorkflowEventRegistry::STATUS_SUBMITTED;
        
        $lifecycleLabel = PersonnelWorkflowEventRegistry::getStatusDisplayLabel($lifecycleStatus);
        $versionNumber = (int)($evaluation['version_number'] ?? 1);
        $lastEvent = $this->getLastMeaningfulEvent($evaluationId);

        $readModel = [
            'evaluation_id'             => $evaluation['id'],
            'personnel_profile_id'      => $evaluation['personnel_profile_id'],
            'lifecycle_status'          => $lifecycleStatus,
            'lifecycle_label'           => $lifecycleLabel,
            'portfolio_version_id'      => $evaluation['id'],
            'portfolio_version_number'  => $versionNumber,
            'last_meaningful_event'     => $lastEvent ? [
                'event_key'    => $lastEvent['event_type'] ?? $lastEvent['event_key'],
                'event_label'  => PersonnelWorkflowEventRegistry::getStatusDisplayLabel($lastEvent['event_type'] ?? $lastEvent['event_key']),
                'occurred_at'  => $lastEvent['created_at'] ?? $lastEvent['occurred_at'] ?? null,
                'performed_by' => $lastEvent['performed_by'] ?? null,
            ] : null,
            'evaluation_result'         => $this->extractEvaluationResult($evaluation),
            'promotion_decision'        => $this->extractPromotionDecision($evaluation),
            'revision_request_status'   => ($lifecycleStatus === PersonnelWorkflowEventRegistry::STATUS_RETURNED_FOR_REVISION) ? 'open' : 'none',
            'assigned_reviewer_role'    => $evaluation['assigned_reviewer_role'] ?? 'dean',
            'is_locked'                 => in_array($lifecycleStatus, [
                PersonnelWorkflowEventRegistry::STATUS_READY_FOR_FINALIZATION,
                PersonnelWorkflowEventRegistry::STATUS_COMPLETED
            ], true),
            'last_synchronized_at'      => date('Y-m-d H:i:s'),
        ];

        // Format role-specific projection if actor role is known
        if ($actor !== null) {
            $role = (string)($actor['role'] ?? (is_array($actor['roles'] ?? null) ? ($actor['roles'][0] ?? 'personnel') : 'personnel'));
            if ($role === 'personnel') {
                return $this->buildPersonnelStatusView($readModel);
            }
            if ($role === 'dean') {
                return $this->buildReviewerStatusView($readModel);
            }
            if (in_array($role, ['hr_admin', 'hr_staff'], true)) {
                return $this->buildHrStatusView($readModel);
            }
        }

        return $readModel;
    }

    /**
     * Validates if an actor is authorized to view the evaluation status.
     */
    public function validateStatusAccess(array $actor, array $evaluation): void
    {
        $actorId = (string)($actor['profile_id'] ?? $actor['id'] ?? '');
        $roles = (array)($actor['roles'] ?? []);

        // 1. Department Secretary strictly denied evaluator visibility
        if (in_array('department_secretary', $roles, true) && !in_array('dean', $roles, true) && !in_array('hr_staff', $roles, true) && !in_array('hr_admin', $roles, true)) {
            throw new RuntimeException('Department Secretary is not authorized to access evaluator status views.', 403);
        }

        // 2. HR Admin / HR Staff has institutional access
        if (in_array('hr_admin', $roles, true) || in_array('hr_staff', $roles, true)) {
            return;
        }

        // 3. Personnel can access their own evaluation
        if ($actorId !== '' && $actorId === (string)$evaluation['personnel_profile_id']) {
            return;
        }

        // 4. Dean can access evaluations within assigned college scope
        if (in_array('dean', $roles, true)) {
            $actorCollege = $actor['assigned_college_id'] ?? null;
            $targetCollege = $evaluation['target_college_id'] ?? null;
            if ($targetCollege !== null && $actorCollege !== $targetCollege) {
                throw new RuntimeException('Cross-college Dean access denied.', 403);
            }
            return;
        }

        // 5. Otherwise unauthorized
        throw new RuntimeException('Unauthorized to view this evaluation status.', 403);
    }

    /**
     * Extracts the latest meaningful workflow event for an evaluation.
     */
    public function getLastMeaningfulEvent(string $evaluationId): ?array
    {
        $meaningfulEvents = PersonnelWorkflowEventRegistry::CANONICAL_EVENTS;

        $event = $this->db->table($this->eventsTable)
            ->where('evaluation_id', $evaluationId)
            ->whereIn('event_type', $meaningfulEvents)
            ->orderBy('created_at', 'DESC')
            ->get(1)
            ->getRowArray();

        return $event ?: null;
    }

    /**
     * Extracts Evaluation Result if recorded.
     */
    protected function extractEvaluationResult(array $evaluation): ?string
    {
        $rawRemarks = $evaluation['evaluator_remarks'] ?? '';
        $parsed = json_decode($rawRemarks, true);
        if (is_array($parsed) && isset($parsed['evaluation_result'])) {
            return $parsed['evaluation_result'];
        }
        return null;
    }

    /**
     * Extracts Promotion Decision if recorded.
     */
    protected function extractPromotionDecision(array $evaluation): ?string
    {
        $rawRemarks = $evaluation['evaluator_remarks'] ?? '';
        $parsed = json_decode($rawRemarks, true);
        if (is_array($parsed) && isset($parsed['promotion_decision'])) {
            return $parsed['promotion_decision'];
        }
        return null;
    }

    /**
     * Builds candidate-safe Personnel status projection.
     */
    public function buildPersonnelStatusView(array $readModel): array
    {
        return [
            'evaluation_id'            => $readModel['evaluation_id'],
            'lifecycle_status'         => $readModel['lifecycle_status'],
            'lifecycle_label'          => $readModel['lifecycle_label'],
            'portfolio_version_number' => $readModel['portfolio_version_number'],
            'last_meaningful_event'    => $readModel['last_meaningful_event'],
            'evaluation_result'        => $readModel['evaluation_result'],
            'is_locked'                => $readModel['is_locked'],
            'has_open_revision'        => ($readModel['lifecycle_status'] === PersonnelWorkflowEventRegistry::STATUS_RETURNED_FOR_REVISION),
        ];
    }

    /**
     * Builds Reviewer status projection.
     */
    public function buildReviewerStatusView(array $readModel): array
    {
        return [
            'evaluation_id'            => $readModel['evaluation_id'],
            'personnel_profile_id'     => $readModel['personnel_profile_id'],
            'lifecycle_status'         => $readModel['lifecycle_status'],
            'lifecycle_label'          => $readModel['lifecycle_label'],
            'portfolio_version_number' => $readModel['portfolio_version_number'],
            'last_meaningful_event'    => $readModel['last_meaningful_event'],
            'assigned_reviewer_role'   => $readModel['assigned_reviewer_role'],
            'is_locked'                => $readModel['is_locked'],
            'has_open_revision'        => ($readModel['lifecycle_status'] === PersonnelWorkflowEventRegistry::STATUS_RETURNED_FOR_REVISION),
        ];
    }

    /**
     * Builds HR governance status projection.
     */
    public function buildHrStatusView(array $readModel): array
    {
        return [
            'evaluation_id'            => $readModel['evaluation_id'],
            'personnel_profile_id'     => $readModel['personnel_profile_id'],
            'lifecycle_status'         => $readModel['lifecycle_status'],
            'lifecycle_label'          => $readModel['lifecycle_label'],
            'portfolio_version_number' => $readModel['portfolio_version_number'],
            'last_meaningful_event'    => $readModel['last_meaningful_event'],
            'evaluation_result'        => $readModel['evaluation_result'],
            'promotion_decision'       => $readModel['promotion_decision'],
            'assigned_reviewer_role'   => $readModel['assigned_reviewer_role'],
            'is_locked'                => $readModel['is_locked'],
            'has_open_revision'        => ($readModel['lifecycle_status'] === PersonnelWorkflowEventRegistry::STATUS_RETURNED_FOR_REVISION),
        ];
    }
}
