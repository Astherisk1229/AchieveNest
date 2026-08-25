<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class ReplaceDepartmentSecretaryWithDean extends Migration
{
    public function up()
    {
        $db = $this->db;

        // 1. Update role catalog: replace department_secretary with dean
        $db->query(<<<'SQL'
UPDATE public.roles
SET
    role_key = 'dean',
    display_name = 'Dean',
    description = 'College-scoped faculty ranking and academic governance access'
WHERE role_key = 'department_secretary';
SQL);

        // 2. Migrate existing department_secretary active role assignments from department scope to college scope
        $db->query(<<<'SQL'
UPDATE public.profile_roles pr
SET
    scope_type = 'college',
    scope_id = d.college_id
FROM public.roles r
JOIN public.departments d ON true
WHERE pr.role_id = r.id
  AND r.role_key = 'dean'
  AND pr.scope_type = 'department'
  AND pr.scope_id = d.id;
SQL);
    }

    public function down()
    {
        $db = $this->db;

        // Revert dean role back to department_secretary
        $db->query(<<<'SQL'
UPDATE public.roles
SET
    role_key = 'department_secretary',
    display_name = 'Department Secretary',
    description = 'Department-scoped verification access'
WHERE role_key = 'dean';
SQL);
    }
}
