<?php

namespace Phase17Canonical\Database\Migrations;

use RuntimeException;

require_once APPPATH . 'Database/Migrations/2026-09-12-000006_SeedSourceDrivenRankingCriteria.php';

class SeedSourceDrivenRankingCriteria extends \App\Database\Migrations\SeedSourceDrivenRankingCriteria
{
    public function up()
    {
        if ($this->db->DBDriver !== 'MySQLi') throw new RuntimeException('Canonical source-driven ranking criteria require MySQLi.');
        $this->db->resetDataCache();
        parent::up();
        $this->assertCount('evaluation_scale_areas', 5);
        $this->assertCount('evaluation_scale_categories', 20);
        $this->assertCount('evaluation_scale_subcategories', 23);
        $this->assertRow('evaluation_scale_categories', 'cat-admin-b6', ['scale_area_id'=>'area-admin-b','category_code'=>'B.6','max_points'=>'20.00']);
        $this->assertRow('evaluation_scale_categories', 'cat-admin-c1', ['scale_area_id'=>'area-admin-c','max_points'=>'30.00']);
        $this->assertRow('evaluation_scale_areas', 'area-ntp-final-a', ['scale_version_id'=>'ver-ntp-2025-001','area_code'=>'A','max_points'=>'90.00']);
        $this->assertRow('evaluation_scale_areas', 'area-ntp-final-b', ['scale_version_id'=>'ver-ntp-2025-001','area_code'=>'B','max_points'=>'60.00']);
        foreach (['area-ntp-a','area-ntp-b','area-ntp-c'] as $id) if ($this->db->table('evaluation_scale_areas')->where('id',$id)->countAllResults() !== 0) throw new RuntimeException("Deprecated area {$id} remains present.");
        foreach (['fac-c1-1','fac-c1-2','fac-c1-3','fac-c1-4','fac-c2-1','fac-c2-2','fac-c2-3','nt-b1-1','nt-b1-2','nt-b1-3','nt-b1-4','nt-b2-1','nt-b2-2','nt-b2-3','nt-b3-1','nt-b4-1'] as $id) $this->assertRow('evaluation_scale_subcategories',$id,[]);
    }

    private function assertCount(string $table, int $expected): void
    {
        $actual=$this->db->table($table)->countAllResults();
        if ($actual !== $expected) throw new RuntimeException("Final {$table} count mismatch: expected {$expected}, found {$actual}.");
    }

    private function assertRow(string $table, string $id, array $values): void
    {
        $row=$this->db->table($table)->where('id',$id)->get()->getRowArray();
        if ($row === null) throw new RuntimeException("Canonical {$table}.{$id} is missing.");
        foreach ($values as $field=>$expected) if ((string)($row[$field] ?? '') !== $expected) throw new RuntimeException("Canonical {$table}.{$id}.{$field} is incompatible.");
    }
}
