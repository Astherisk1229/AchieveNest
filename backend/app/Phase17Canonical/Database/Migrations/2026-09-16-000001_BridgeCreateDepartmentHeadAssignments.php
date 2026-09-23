<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;

class BridgeCreateDepartmentHeadAssignments extends Migration
{
    use September15BridgeGuard;

public function up()
    {
        $this->assertBridgeStep(1);
        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS department_head_assignments (
    id CHAR(36) PRIMARY KEY,
    personnel_profile_id CHAR(36) NOT NULL,
    department_id CHAR(36) NOT NULL,
    effective_from DATE NOT NULL,
    effective_until DATE NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    assigned_by CHAR(36) NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active_department_guard CHAR(36) GENERATED ALWAYS AS (CASE WHEN is_active = 1 THEN department_id ELSE NULL END) STORED,
    KEY idx_department_head_personnel (personnel_profile_id, is_active),
    KEY idx_department_head_department (department_id, is_active),
    UNIQUE KEY uq_active_department_head (active_department_guard),
    CONSTRAINT fk_department_head_personnel FOREIGN KEY (personnel_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_department_head_department FOREIGN KEY (department_id) REFERENCES administrative_units(id) ON DELETE RESTRICT,
    CONSTRAINT fk_department_head_assigner FOREIGN KEY (assigned_by) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);
    }

    }
