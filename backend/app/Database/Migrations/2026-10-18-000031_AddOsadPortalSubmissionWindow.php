<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

final class AddOsadPortalSubmissionWindow extends Migration
{
    public function up()
    {
        $this->db->query("ALTER TABLE osad_portfolio_submission_portals ADD COLUMN start_date DATE NULL AFTER award_period, ADD COLUMN end_date DATE NULL AFTER start_date");
        $this->db->query("ALTER TABLE osad_portfolio_submission_portals ADD CONSTRAINT ck_osad_portal_date_range CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)");
    }

    public function down()
    {
        $this->db->query("ALTER TABLE osad_portfolio_submission_portals DROP CHECK ck_osad_portal_date_range");
        $this->db->query("ALTER TABLE osad_portfolio_submission_portals DROP COLUMN end_date, DROP COLUMN start_date");
    }
}
