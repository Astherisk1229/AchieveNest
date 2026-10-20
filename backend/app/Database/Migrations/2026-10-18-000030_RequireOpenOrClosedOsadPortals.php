<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

final class RequireOpenOrClosedOsadPortals extends Migration
{
    public function up()
    {
        $this->db->query("UPDATE osad_portfolio_submission_portals SET status = 'closed', closed_at = COALESCE(closed_at, CURRENT_TIMESTAMP(6)) WHERE status = 'draft'");
        $this->db->query("ALTER TABLE osad_portfolio_submission_portals DROP CHECK ck_osad_portal_status");
        $this->db->query("ALTER TABLE osad_portfolio_submission_portals ADD CONSTRAINT ck_osad_portal_status CHECK (status IN ('open','closed'))");
    }

    public function down()
    {
        $this->db->query("ALTER TABLE osad_portfolio_submission_portals DROP CHECK ck_osad_portal_status");
        $this->db->query("ALTER TABLE osad_portfolio_submission_portals ADD CONSTRAINT ck_osad_portal_status CHECK (status IN ('draft','open','closed'))");
    }
}
