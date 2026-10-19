<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/** Persists the selected event certificate signatories for attendee certificate previews. */
final class AddEventCertificateConfiguration extends Migration
{
    public function up()
    {
        if ($this->db->DBDriver === 'Postgre') {
            $this->db->query('ALTER TABLE public.events ADD COLUMN IF NOT EXISTS certificate_configuration jsonb NULL');
            return;
        }

        if ($this->db->DBDriver !== 'MySQLi') {
            throw new \RuntimeException('Event certificate configuration requires PostgreSQL or MySQL.');
        }

        if (! $this->db->fieldExists('certificate_configuration', 'events')) {
            $this->db->query('ALTER TABLE events ADD COLUMN certificate_configuration JSON NULL');
        }
    }

    public function down()
    {
        if ($this->db->DBDriver === 'Postgre') {
            $this->db->query('ALTER TABLE public.events DROP COLUMN IF EXISTS certificate_configuration');
            return;
        }

        if ($this->db->DBDriver === 'MySQLi' && $this->db->fieldExists('certificate_configuration', 'events')) {
            $this->db->query('ALTER TABLE events DROP COLUMN certificate_configuration');
        }
    }
}
