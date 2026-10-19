<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use Config\Database;

class PersonnelRoleAssignmentNotificationService
{
    private BaseConnection $db;

    public function __construct(?BaseConnection $db = null)
    {
        $this->db = $db ?? Database::connect();
    }

    public function notifyAssigned(
        string $recipientProfileId,
        ?string $actorProfileId,
        string $roleName,
        string $scopeLabel,
        string $referenceType,
        string $referenceId
    ): void {
        $this->insertNotification(
            $recipientProfileId,
            $actorProfileId,
            'New role assignment',
            "You have been assigned as {$roleName} for {$scopeLabel}.",
            $referenceType,
            $referenceId
        );
    }

    /**
     * Backfill notices for current assignments created before assignment notices
     * were enabled. The assignment ID is the idempotency key.
     */
    public function ensureCurrentAssignmentNotifications(string $profileId): void
    {
        $table = $this->db->tableExists('public.notifications')
            ? 'public.notifications'
            : 'notifications';

        if (! $this->db->tableExists($table)) {
            return;
        }

        $today = date('Y-m-d');

        if ($this->db->tableExists('program_coordinator_assignments') && $this->db->tableExists('academic_programs')) {
            $coordinatorAssignments = $this->db->query(
                "SELECT pca.id, pca.assigned_by, ap.code, ap.name
                 FROM program_coordinator_assignments pca
                 JOIN academic_programs ap ON ap.id = pca.academic_program_id
                 WHERE pca.personnel_profile_id = ? AND pca.is_active = 1
                   AND pca.effective_from <= ?
                   AND (pca.effective_until IS NULL OR pca.effective_until >= ?)",
                [$profileId, $today, $today]
            )->getResultArray();

            foreach ($coordinatorAssignments as $assignment) {
                $this->ensureAssignmentNotification(
                    $table,
                    $profileId,
                    $assignment,
                    'Program Coordinator',
                    'program_coordinator_assignment'
                );
            }
        }

        if ($this->db->tableExists('organization_moderator_assignments') && $this->db->tableExists('organizations')) {
            $moderators = $this->db->query(
                "SELECT oma.id, oma.assigned_by, o.code, o.name
                 FROM organization_moderator_assignments oma
                 JOIN organizations o ON o.id = oma.organization_id
                 WHERE oma.personnel_profile_id = ? AND oma.is_active = 1
                   AND oma.effective_from <= ?
                   AND (oma.effective_until IS NULL OR oma.effective_until >= ?)",
                [$profileId, $today, $today]
            )->getResultArray();

            foreach ($moderators as $assignment) {
                $this->ensureAssignmentNotification(
                    $table,
                    $profileId,
                    $assignment,
                    'Organization Moderator',
                    'organization_moderator_assignment'
                );
            }
        }
    }

    private function ensureAssignmentNotification(
        string $table,
        string $profileId,
        array $assignment,
        string $roleName,
        string $referenceType
    ): void {
        $exists = $this->db->table($table)
            ->where('recipient_profile_id', $profileId)
            ->where('notification_type', 'personnel_role_assigned')
            ->where('reference_type', $referenceType)
            ->where('reference_id', $assignment['id'])
            ->countAllResults() > 0;

        if ($exists) {
            return;
        }

        $scopeLabel = trim(($assignment['code'] ?? '') . ' — ' . ($assignment['name'] ?? ''), ' —');
        $this->insertNotification(
            $profileId,
            $assignment['assigned_by'] ?? null,
            'Active role assignment',
            "You currently serve as {$roleName} for {$scopeLabel}.",
            $referenceType,
            $assignment['id']
        );
    }

    private function insertNotification(
        string $recipientProfileId,
        ?string $actorProfileId,
        string $title,
        string $message,
        string $referenceType,
        string $referenceId
    ): void {
        $table = $this->db->tableExists('public.notifications')
            ? 'public.notifications'
            : 'notifications';

        if (! $this->db->tableExists($table)) {
            return;
        }

        $this->db->table($table)->insert([
            'id'                  => $this->uuid(),
            'recipient_profile_id'=> $recipientProfileId,
            'actor_profile_id'    => $actorProfileId,
            'notification_type'   => 'personnel_role_assigned',
            'title'               => $title,
            'message'             => $message,
            'reference_type'      => $referenceType,
            'reference_id'        => $referenceId,
            'is_mandatory'        => 1,
            'created_at'          => date('Y-m-d H:i:s'),
        ]);
    }

    private function uuid(): string
    {
        $hex = bin2hex(random_bytes(16));
        return substr($hex, 0, 8) . '-' . substr($hex, 8, 4) . '-4' . substr($hex, 13, 3)
            . '-' . dechex((hexdec($hex[16]) & 0x3) | 0x8) . substr($hex, 17, 3)
            . '-' . substr($hex, 20, 12);
    }
}
