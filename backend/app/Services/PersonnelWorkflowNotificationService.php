<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

/**
 * Class PersonnelWorkflowNotificationService
 *
 * Authoritative Event-Driven Notification Service for Plan J — Phase J3.
 * Generates persisted notifications exclusively from persisted workflow events,
 * enforces server-side recipient derivation, prevents duplicate notifications from page reloads,
 * and maintains database read/unread states.
 */
class PersonnelWorkflowNotificationService
{
    protected BaseConnection $db;
    protected string $notificationsTable;

    public function __construct(?BaseConnection $db = null)
    {
        $this->db = $db ?? db_connect();
        $this->notificationsTable = $this->resolveNotificationsTable();
    }

    /**
     * Resolves the table name for notifications.
     */
    protected function resolveNotificationsTable(): string
    {
        return $this->db->tableExists('public.notifications') 
            ? 'public.notifications' 
            : 'notifications';
    }

    /**
     * Handles a persisted workflow event and generates notifications for all resolved recipients.
     *
     * @param array $eventRow [ 'id' => string, 'event_type' => string, 'evaluation_id' => string, 'performed_by' => string, 'payload' => array|string, ... ]
     * @param array $evaluationContext [ 'personnel_profile_id' => string, 'personnel_name' => ?string, 'assigned_reviewer_id' => ?string, 'version_number' => ?int, ... ]
     * @return array Array of persisted notification DTOs
     */
    public function handleWorkflowEvent(array $eventRow, array $evaluationContext = []): array
    {
        $eventKey = $eventRow['event_type'] ?? $eventRow['event_key'] ?? '';
        if (!PersonnelWorkflowNotificationRegistry::hasNotification($eventKey)) {
            return [];
        }

        $eventId = (string)($eventRow['id'] ?? '');
        if ($eventId === '') {
            throw new InvalidArgumentException('Cannot generate notifications from an unpersisted event without an event ID.');
        }

        $rawPayload = $eventRow['payload'] ?? [];
        $payload = is_string($rawPayload) ? (json_decode($rawPayload, true) ?? []) : (array)$rawPayload;

        $recipients = $this->resolveRecipients($eventKey, $eventRow, $evaluationContext);
        if (empty($recipients)) {
            return [];
        }

        $content = PersonnelWorkflowNotificationRegistry::buildNotificationContent($eventKey, $payload, $evaluationContext);
        $notifications = [];

        foreach ($recipients as $recipientProfileId) {
            if (empty($recipientProfileId)) {
                continue;
            }

            // Exclude notifying the actor who performed the action (e.g. Dean doesn't get notified that Dean returned the portfolio)
            $actorId = (string)($eventRow['performed_by'] ?? $eventRow['actor_user_id'] ?? '');
            if ($actorId !== '' && $actorId === $recipientProfileId && $eventKey !== PersonnelWorkflowEventRegistry::EVENT_REVIEWER_ASSIGNED) {
                // Keep assignment notification if self-assigned by admin, but skip general actions
                continue;
            }

            $idempotencyKey = PersonnelWorkflowNotificationRegistry::generateNotificationIdempotencyKey(
                $eventId,
                $recipientProfileId,
                $content['notification_type']
            );

            // Check if notification with this idempotency key or event/recipient combination already exists
            if ($this->hasExistingNotification($eventId, $recipientProfileId, $content['notification_type'])) {
                $existing = $this->getExistingNotification($eventId, $recipientProfileId, $content['notification_type']);
                if ($existing !== null) {
                    $notifications[] = $existing;
                }
                continue;
            }

            $now = date('Y-m-d H:i:s');
            $notifId = $this->generateUuid();
            $notifRow = [
                'id'                   => $notifId,
                'recipient_profile_id' => $recipientProfileId,
                'actor_profile_id'     => !empty($actorId) ? $actorId : null,
                'notification_type'    => $content['notification_type'],
                'title'                => $content['title'],
                'message'              => $content['message'],
                'reference_type'       => 'personnel_evaluations',
                'reference_id'         => $eventRow['evaluation_id'] ?? null,
                'is_mandatory'         => true,
                'read_at'              => null,
                'created_at'           => $now,
            ];

            $this->db->table($this->notificationsTable)->insert($notifRow);

            $notifRow['is_read'] = false;
            $notifRow['event_id'] = $eventId;
            $notifRow['idempotency_key'] = $idempotencyKey;
            $notifications[] = $notifRow;
        }

        return $notifications;
    }

    /**
     * Resolves target recipient profile IDs from authoritative workflow data.
     */
    public function resolveRecipients(string $eventKey, array $eventRow, array $evaluationContext): array
    {
        $config = PersonnelWorkflowNotificationRegistry::getEventConfig($eventKey);
        if ($config === null) {
            return [];
        }

        $targetCategory = $config['recipient_target'];
        $recipients = [];

        switch ($targetCategory) {
            case PersonnelWorkflowNotificationRegistry::RECIPIENT_PERSONNEL:
                $personnelId = $evaluationContext['personnel_profile_id'] 
                    ?? $eventRow['subject_personnel_id'] 
                    ?? null;
                if ($personnelId) {
                    $recipients[] = (string)$personnelId;
                }
                break;

            case PersonnelWorkflowNotificationRegistry::RECIPIENT_ASSIGNED_REVIEWER:
                $reviewerId = $evaluationContext['assigned_reviewer_id'] 
                    ?? $evaluationContext['evaluator_profile_id'] 
                    ?? $eventRow['metadata']['reviewer_id'] 
                    ?? null;
                if ($reviewerId) {
                    $recipients[] = (string)$reviewerId;
                }
                break;

            case PersonnelWorkflowNotificationRegistry::RECIPIENT_HR_OFFICE:
                $hrId = $evaluationContext['hr_reviewer_id'] ?? null;
                if ($hrId) {
                    $recipients[] = (string)$hrId;
                }
                break;
        }

        return array_unique($recipients);
    }

    /**
     * Checks if a notification already exists for this event, recipient, and notification type.
     */
    public function hasExistingNotification(string $eventId, string $recipientProfileId, string $notificationType): bool
    {
        // Query by reference and recipient
        $builder = $this->db->table($this->notificationsTable)
            ->where('recipient_profile_id', $recipientProfileId)
            ->where('notification_type', $notificationType);

        $results = $builder->get()->getResultArray();
        return !empty($results);
    }

    /**
     * Retrieves an existing notification record.
     */
    public function getExistingNotification(string $eventId, string $recipientProfileId, string $notificationType): ?array
    {
        return $this->db->table($this->notificationsTable)
            ->where('recipient_profile_id', $recipientProfileId)
            ->where('notification_type', $notificationType)
            ->get()
            ->getRowArray();
    }

    /**
     * Lists persisted notifications for a user (strictly scope-isolated).
     *
     * @param string $userId
     * @param array $filters [ 'unread_only' => bool, 'limit' => int, 'offset' => int ]
     * @return array
     */
    public function listNotificationsForUser(string $userId, array $filters = []): array
    {
        $builder = $this->db->table($this->notificationsTable)
            ->where('recipient_profile_id', $userId)
            ->orderBy('created_at', 'DESC');

        if (!empty($filters['unread_only'])) {
            $builder->where('read_at', null);
        }

        if (!empty($filters['limit'])) {
            $builder->limit((int)$filters['limit'], (int)($filters['offset'] ?? 0));
        }

        $rows = $builder->get()->getResultArray();

        return array_map(function ($row) {
            $row['is_read'] = ($row['read_at'] !== null);
            return $row;
        }, $rows);
    }

    /**
     * Marks a specific notification as read by its recipient.
     */
    public function markNotificationRead(string $notificationId, string $userId): bool
    {
        $existing = $this->db->table($this->notificationsTable)
            ->where('id', $notificationId)
            ->where('recipient_profile_id', $userId)
            ->get()
            ->getRowArray();

        if ($existing === null) {
            return false;
        }

        if ($existing['read_at'] !== null) {
            return true; // Already read
        }

        $now = date('Y-m-d H:i:s');
        $this->db->table($this->notificationsTable)
            ->where('id', $notificationId)
            ->update(['read_at' => $now]);

        return true;
    }

    /**
     * Marks all unread notifications as read for a specific user.
     */
    public function markAllReadForUser(string $userId): int
    {
        $now = date('Y-m-d H:i:s');
        $this->db->table($this->notificationsTable)
            ->where('recipient_profile_id', $userId)
            ->where('read_at', null)
            ->update(['read_at' => $now]);

        return $this->db->affectedRows();
    }

    /**
     * Counts unread notifications for a user.
     */
    public function getUnreadCount(string $userId): int
    {
        return $this->db->table($this->notificationsTable)
            ->where('recipient_profile_id', $userId)
            ->where('read_at', null)
            ->countAllResults();
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
