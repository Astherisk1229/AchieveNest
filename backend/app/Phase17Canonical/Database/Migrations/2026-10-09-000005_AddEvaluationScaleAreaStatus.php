<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;
use App\Services\CanonicalMigrationTargetGuard;
use RuntimeException;

/** Adds the canonical archive flag used by editable evaluation criteria revisions. */
final class AddEvaluationScaleAreaStatus extends Migration
{
    public function up(): void
    {
        if ($this->db->DBDriver !== 'MySQLi') throw new RuntimeException('Evaluation criteria migrations require MySQLi.');
        CanonicalMigrationTargetGuard::assertAllowed($this->db, 'add evaluation scale area archive status');
        if (! $this->db->tableExists('evaluation_scale_areas')) throw new RuntimeException('Required table evaluation_scale_areas does not exist.');
        if (! $this->db->fieldExists('is_active', 'evaluation_scale_areas')) {
            $this->forge->addColumn('evaluation_scale_areas', [
                'is_active' => ['type'=>'TINYINT','constraint'=>1,'null'=>false,'default'=>1],
            ]);
        }
        if (! $this->db->fieldExists('is_active', 'evaluation_scale_areas')) throw new RuntimeException('evaluation_scale_areas.is_active was not created.');
    }

    public function down(): void
    {
        throw new RuntimeException('Refusing to drop evaluation area archive state; archived criteria may depend on it.');
    }
}
