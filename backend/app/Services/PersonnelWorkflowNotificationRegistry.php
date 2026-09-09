<?php

namespace App\Services;

use InvalidArgumentException;

/**
 * Class PersonnelWorkflowNotificationRegistry
 *
 * Canonical Event-to-Notification Mapping Registry for Plan J — Phase J3.
 * Defines notification types, recipient roles, template definitions, idempotency strategies,
 * and deep links for all persisted canonical workflow events.
 */
class PersonnelWorkflowNotificationRegistry
{
    // Notification Types
    public const TYPE_REVIEWER_WORK_ARRIVED         = 'personnel_reviewer_work_arrived';
    public const TYPE_REVIEWER_ASSIGNED             = 'personnel_reviewer_assigned';
    public const TYPE_REVIEW_STARTED                = 'personnel_review_started';
    public const TYPE_REVISION_REQUESTED            = 'personnel_revision_requested';
    public const TYPE_PORTFOLIO_RESUBMITTED         = 'personnel_portfolio_resubmitted';
    public const TYPE_EVALUATION_FINALIZED          = 'personnel_evaluation_finalized';
    public const TYPE_SUMMARY_AVAILABLE             = 'personnel_summary_available';

    // Recipient Target Categories
    public const RECIPIENT_PERSONNEL                = 'personnel';
    public const RECIPIENT_ASSIGNED_REVIEWER        = 'assigned_reviewer';
    public const RECIPIENT_HR_OFFICE                = 'hr_office';

    /**
     * Canonical Event to Notification Configuration Mapping
     */
    public const EVENT_NOTIFICATION_MAP = [
        PersonnelWorkflowEventRegistry::EVENT_PORTFOLIO_SUBMITTED => [
            'notification_type' => self::TYPE_REVIEWER_WORK_ARRIVED,
            'recipient_target'  => self::RECIPIENT_ASSIGNED_REVIEWER,
            'title_template'    => 'New Portfolio Submission Awaiting Review',
            'deep_link_route'   => '/personnel/evaluations/workspace',
        ],
        PersonnelWorkflowEventRegistry::EVENT_REVIEWER_ASSIGNED => [
            'notification_type' => self::TYPE_REVIEWER_ASSIGNED,
            'recipient_target'  => self::RECIPIENT_ASSIGNED_REVIEWER,
            'title_template'    => 'Evaluation Portfolio Assigned to You',
            'deep_link_route'   => '/personnel/evaluations/workspace',
        ],
        PersonnelWorkflowEventRegistry::EVENT_REVIEW_STARTED => [
            'notification_type' => self::TYPE_REVIEW_STARTED,
            'recipient_target'  => self::RECIPIENT_PERSONNEL,
            'title_template'    => 'Portfolio Accepted into Review',
            'deep_link_route'   => '/personnel/portfolio',
        ],
        PersonnelWorkflowEventRegistry::EVENT_REVISION_REQUESTED => [
            'notification_type' => self::TYPE_REVISION_REQUESTED,
            'recipient_target'  => self::RECIPIENT_PERSONNEL,
            'title_template'    => 'Portfolio Returned for Revision',
            'deep_link_route'   => '/personnel/portfolio/revision',
        ],
        PersonnelWorkflowEventRegistry::EVENT_PORTFOLIO_RESUBMITTED => [
            'notification_type' => self::TYPE_PORTFOLIO_RESUBMITTED,
            'recipient_target'  => self::RECIPIENT_ASSIGNED_REVIEWER,
            'title_template'    => 'Revised Portfolio Resubmitted',
            'deep_link_route'   => '/personnel/evaluations/workspace',
        ],
        PersonnelWorkflowEventRegistry::EVENT_EVALUATION_FINALIZED => [
            'notification_type' => self::TYPE_EVALUATION_FINALIZED,
            'recipient_target'  => self::RECIPIENT_PERSONNEL,
            'title_template'    => 'Personnel Evaluation Finalized',
            'deep_link_route'   => '/personnel/portfolio/summary',
        ],
        PersonnelWorkflowEventRegistry::EVENT_SUMMARY_AVAILABLE => [
            'notification_type' => self::TYPE_SUMMARY_AVAILABLE,
            'recipient_target'  => self::RECIPIENT_PERSONNEL,
            'title_template'    => 'Evaluation Summary Report Available',
            'deep_link_route'   => '/personnel/portfolio/summary',
        ],
    ];

    /**
     * Checks if a canonical event triggers a notification.
     */
    public static function hasNotification(string $eventKey): bool
    {
        return isset(self::EVENT_NOTIFICATION_MAP[$eventKey]);
    }

    /**
     * Retrieves notification mapping config for an event key.
     */
    public static function getEventConfig(string $eventKey): ?array
    {
        return self::EVENT_NOTIFICATION_MAP[$eventKey] ?? null;
    }

    /**
     * Formats notification title and message based on event metadata and context.
     *
     * @param string $eventKey
     * @param array $eventPayload
     * @param array $context [ 'personnel_name' => ?string, 'version_number' => ?int, ... ]
     * @return array [ 'title' => string, 'message' => string, 'notification_type' => string, 'deep_link' => string ]
     */
    public static function buildNotificationContent(string $eventKey, array $eventPayload, array $context = []): array
    {
        $config = self::getEventConfig($eventKey);
        if ($config === null) {
            throw new InvalidArgumentException("No notification configuration defined for event: [{$eventKey}]");
        }

        $version = $eventPayload['version_number'] ?? $context['version_number'] ?? 1;
        $personnelName = $context['personnel_name'] ?? 'Candidate';

        switch ($eventKey) {
            case PersonnelWorkflowEventRegistry::EVENT_PORTFOLIO_SUBMITTED:
                $title = $config['title_template'];
                $message = "A new portfolio (Version {$version}) from {$personnelName} has been submitted and is awaiting your review.";
                break;

            case PersonnelWorkflowEventRegistry::EVENT_REVIEWER_ASSIGNED:
                $title = $config['title_template'];
                $message = "You have been assigned to evaluate the portfolio submission for {$personnelName}.";
                break;

            case PersonnelWorkflowEventRegistry::EVENT_REVIEW_STARTED:
                $title = $config['title_template'];
                $message = "Your submitted portfolio (Version {$version}) has been accepted into active review by the assigned evaluator.";
                break;

            case PersonnelWorkflowEventRegistry::EVENT_REVISION_REQUESTED:
                $title = $config['title_template'];
                $reason = $eventPayload['reason'] ?? $eventPayload['deficiency_reason'] ?? 'Incomplete documentation';
                $hasRequestedEvidence = !empty($eventPayload['required_corrections']) || !empty($eventPayload['requested_evidence']);
                $evidenceNote = $hasRequestedEvidence ? " Please review requested evidence and specific comments." : "";
                $message = "Your portfolio (Version {$version}) was returned for revision: \"{$reason}\".{$evidenceNote}";
                break;

            case PersonnelWorkflowEventRegistry::EVENT_PORTFOLIO_RESUBMITTED:
                $title = $config['title_template'];
                $message = "A revised portfolio (Version {$version}) has been resubmitted by {$personnelName} for your review.";
                break;

            case PersonnelWorkflowEventRegistry::EVENT_EVALUATION_FINALIZED:
                $title = $config['title_template'];
                $message = "Your personnel ranking evaluation for the academic year has been officially finalized.";
                break;

            case PersonnelWorkflowEventRegistry::EVENT_SUMMARY_AVAILABLE:
                $title = $config['title_template'];
                $message = "Your official personnel evaluation summary report is now available for download and review.";
                break;

            default:
                $title = $config['title_template'];
                $message = "A workflow update occurred for your evaluation portfolio.";
                break;
        }

        return [
            'notification_type' => $config['notification_type'],
            'title'             => $title,
            'message'           => $message,
            'deep_link'         => $config['deep_link_route'],
        ];
    }

    /**
     * Generates a deterministic idempotency key for a notification.
     *
     * @param string $eventId
     * @param string $recipientProfileId
     * @param string $notificationType
     * @return string
     */
    public static function generateNotificationIdempotencyKey(
        string $eventId,
        string $recipientProfileId,
        string $notificationType
    ): string {
        return "notif:{$eventId}:{$recipientProfileId}:{$notificationType}";
    }
}
