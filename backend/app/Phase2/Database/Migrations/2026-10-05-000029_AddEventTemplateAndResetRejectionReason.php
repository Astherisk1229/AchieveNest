<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Wiring remediation Phase 3.
 * - events.osad_template_id: the certificate template an organizer picks on an event was never stored.
 * - password_reset_requests.rejection_reason: the admin's reject reason was sent by the UI and dropped.
 * Idempotent. down() is a no-op because the columns may hold live data.
 */
final class AddEventTemplateAndResetRejectionReason extends Migration
{
    public function up()
    {
        if (! $this->db->fieldExists('osad_template_id', 'events')) {
            $this->db->query('ALTER TABLE `events` ADD COLUMN `osad_template_id` varchar(32) NULL AFTER `event_type`');
        }
        if (! $this->db->fieldExists('rejection_reason', 'password_reset_requests')) {
            $this->db->query('ALTER TABLE `password_reset_requests` ADD COLUMN `rejection_reason` varchar(1000) NULL AFTER `reason`');
        }
    }

    public function down()
    {
    }
}
