<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;

final class AddEventCertificateConfiguration extends Migration
{
    public function up()
    {
        if (! $this->db->fieldExists('certificate_configuration', 'events')) {
            $this->db->query('ALTER TABLE events ADD COLUMN certificate_configuration JSON NULL');
        }
    }

    public function down()
    {
        // Certificate configuration may contain live organization-issued signatures.
    }
}
