<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;

require_once APPPATH . 'Database/Migrations/2026-09-22-000001_GovernStudentCertificates.php';

final class GovernStudentCertificates extends Migration
{
    public function up(): void
    {
        (new \App\Database\Migrations\GovernStudentCertificates($this->forge))->up();
    }

    public function down(): void
    {
        (new \App\Database\Migrations\GovernStudentCertificates($this->forge))->down();
    }
}
