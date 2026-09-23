<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

/**
 * Class PersonnelWorkflowEventService
 *
 * Canonical Event Persistence Service for Plan J — Phase J1.
 * Enforces deterministic, idempotent, server-timestamped event creation with complete
 * actor, subject, version, and metadata context across all material transitions.
 */
class PersonnelWorkflowEventService
{
    protected BaseConnection $db;
    protected string $eventsTable;

    public function __construct(?BaseConnection $db = null)
    {
        $this->db = $db ?? db_connect();
        $this->eventsTable = $this->resolveEventsTable();
    }

    protected function resolveEventsTable(): string
    {
        return $this->db->tableExists('public.personnel_evaluation_events') 
            ? 'public.personnel_evaluation_events' 
            : 'personnel_evaluation_events';
    }

    /**
     * Record a canonical workflow event deterministically.
     *
     * @param array $params {
     *   event_key: string,
     *   evaluation_id: string|null,
     *   actor_user_id: string|null,
     *   actor_role: string|null,
     *   subject_personnel_id: string|null,
     *   version_number: int|null,
     *   source_plan: string|null,
     *   metadata: array|null,
     *   idempotency_nonce: string|null
     * }
     * @return array Persisted event DTO
     * @throws InvalidArgumentException|RuntimeException
     */
    public function recordEvent(array $params): array
    {
        $eventKey = trim((string)($params['event_key'] ?? ''));
        if (!PersonnelWorkflowEventRegistry::isValidEvent($eventKey)) {
            throw new InvalidArgumentException("Unrecognized canonical event key: [{$eventKey}]");
        }

        $metadata = (array)($params['metadata'] ?? []);
        PersonnelWorkflowEventRegistry::validateRequiredMetadata($eventKey, $metadata);

        $evaluationId = $params['evaluation_id'] ?? null;
        $versionNumber = isset($params['version_number']) ? (int)$params['version_number'] : null;
        $idempotencyKey = $params['idempotency_key'] ?? PersonnelWorkflowEventRegistry::generateIdempotencyKey(
            $eventKey,
            $evaluationId,
            $versionNumber,
            $params['idempotency_nonce'] ?? null
        );

        // Check for existing event with same idempotency key if present in payload
        if ($this->hasDuplicateEvent($eventKey, $evaluationId, $idempotencyKey)) {
            return $this->getExistingEvent($eventKey, $evaluationId, $idempotencyKey);
        }

        $now = date('Y-m-d H:i:s');
        $actorUserId = $params['actor_user_id'] ?? null;
        $actorRole = $params['actor_role'] ?? 'system';
        $subjectPersonnelId = $params['subject_personnel_id'] ?? null;
        $sourcePlan = $params['source_plan'] ?? 'Plan J';

        $payload = array_merge($metadata, [
            'actor_role'          => $actorRole,
            'subject_personnel_id'=> $subjectPersonnelId,
            'version_number'      => $versionNumber,
            'source_plan'         => $sourcePlan,
            'idempotency_key'     => $idempotencyKey,
            'occurred_at'         => $now,
        ]);

        $eventId = $this->generateUuid();

        $eventRow = [
            'id'            => $eventId,
            'evaluation_id' => $evaluationId,
            'event_type'    => $eventKey,
            'performed_by'  => $actorUserId,
            'payload'       => json_encode($payload),
            'created_at'    => $now,
        ];

        try {
            $this->db->table($this->eventsTable)->insert($eventRow);
        } catch (Throwable $e) {
            throw new RuntimeException("Failed to persist canonical workflow event [{$eventKey}]: " . $e->getMessage(), 500, $e);
        }

        return [
            'event_id'            => $eventId,
            'event_key'           => $eventKey,
            'display_label'       => PersonnelWorkflowEventRegistry::getStatusDisplayLabel($eventKey),
            'evaluation_id'       => $evaluationId,
            'version_number'      => $versionNumber,
            'actor_user_id'       => $actorUserId,
            'actor_role'          => $actorRole,
            'subject_personnel_id'=> $subjectPersonnelId,
            'source_plan'         => $sourcePlan,
            'idempotency_key'     => $idempotencyKey,
            'occurred_at'         => $now,
            'metadata'            => $metadata,
            'is_persisted'        => true,
        ];
    }

    /**
     * Checks if an event with the same idempotency key has already been recorded.
     */
    protected function hasDuplicateEvent(string $eventKey, ?string $evaluationId, string $idempotencyKey): bool
    {
        if (!$evaluationId) {
            return false;
        }

        $builder = $this->db->table($this->eventsTable)
            ->where('evaluation_id', $evaluationId)
            ->where('event_type', $eventKey);

        $results = $builder->get()->getResultArray();
        foreach ($results as $row) {
            $payload = json_decode($row['payload'] ?? '{}', true);
            if (($payload['idempotency_key'] ?? '') === $idempotencyKey) {
                return true;
            }
        }

        return false;
    }

    /**
     * Retrieve the existing event when idempotency hit occurs.
     */
    protected function getExistingEvent(string $eventKey, ?string $evaluationId, string $idempotencyKey): array
    {
        $builder = $this->db->table($this->eventsTable)
            ->where('evaluation_id', $evaluationId)
            ->where('event_type', $eventKey);

        $results = $builder->get()->getResultArray();
        foreach ($results as $row) {
            $payload = json_decode($row['payload'] ?? '{}', true);
            if (($payload['idempotency_key'] ?? '') === $idempotencyKey) {
                return [
                    'event_id'            => $row['id'],
                    'event_key'           => $row['event_type'],
                    'display_label'       => PersonnelWorkflowEventRegistry::getStatusDisplayLabel($row['event_type']),
                    'evaluation_id'       => $row['evaluation_id'],
                    'version_number'      => $payload['version_number'] ?? null,
                    'actor_user_id'       => $row['performed_by'],
                    'actor_role'          => $payload['actor_role'] ?? 'system',
                    'subject_personnel_id'=> $payload['subject_personnel_id'] ?? null,
                    'source_plan'         => $payload['source_plan'] ?? 'Plan J',
                    'idempotency_key'     => $idempotencyKey,
                    'occurred_at'         => $payload['occurred_at'] ?? $row['created_at'],
                    'metadata'            => $payload,
                    'is_persisted'        => true,
                    'is_idempotent_hit'   => true,
                ];
            }
        }

        throw new RuntimeException("Expected idempotent event was not found");
    }

    /**
     * List all chronological events for an evaluation.
     */
    public function listEventsForEvaluation(string $evaluationId): array
    {
        $rows = $this->db->table($this->eventsTable)
            ->where('evaluation_id', $evaluationId)
            ->orderBy('created_at', 'ASC')
            ->get()
            ->getResultArray();

        return array_map(function ($row) {
            $payload = json_decode($row['payload'] ?? '{}', true);
            return [
                'event_id'            => $row['id'],
                'event_key'           => $row['event_type'],
                'display_label'       => PersonnelWorkflowEventRegistry::getStatusDisplayLabel($row['event_type']),
                'evaluation_id'       => $row['evaluation_id'],
                'version_number'      => $payload['version_number'] ?? null,
                'actor_user_id'       => $row['performed_by'],
                'actor_role'          => $payload['actor_role'] ?? null,
                'subject_personnel_id'=> $payload['subject_personnel_id'] ?? null,
                'occurred_at'         => $payload['occurred_at'] ?? $row['created_at'],
                'metadata'            => $payload,
            ];
        }, $rows);
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
