<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddPlan08CanonicalCheckConstraints extends Migration
{
    public function up()
    {
        // 1. Student Profiles: Year Level constraint
        $this->db->query("
            ALTER TABLE `student_profiles`
            ADD CONSTRAINT `chk_student_profiles_year_level`
            CHECK (`year_level` IS NULL OR `year_level` IN ('1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'))
        ");

        // 2. Student Program Enrollments: Year Level and Academic Year format constraints
        $this->db->query("
            ALTER TABLE `student_program_enrollments`
            ADD CONSTRAINT `chk_student_enrollments_year_level`
            CHECK (`year_level` IN ('1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'))
        ");

        $this->db->query("
            ALTER TABLE `student_program_enrollments`
            ADD CONSTRAINT `chk_student_enrollments_academic_year`
            CHECK (`academic_year` REGEXP '^[0-9]{4}-[0-9]{4}$')
        ");

        // 3. Profiles: Transitional Sex constraint (allows legacy NULL while enforcing canonical values for non-NULL)
        $this->db->query("
            ALTER TABLE `profiles`
            ADD CONSTRAINT `chk_profiles_sex`
            CHECK (`sex` IS NULL OR `sex` IN ('Male', 'Female', 'Prefer not to say'))
        ");
    }

    public function down()
    {
        $this->db->query("
            ALTER TABLE `student_profiles`
            DROP CHECK `chk_student_profiles_year_level`
        ");

        $this->db->query("
            ALTER TABLE `student_program_enrollments`
            DROP CHECK `chk_student_enrollments_year_level`
        ");

        $this->db->query("
            ALTER TABLE `student_program_enrollments`
            DROP CHECK `chk_student_enrollments_academic_year`
        ");

        $this->db->query("
            ALTER TABLE `profiles`
            DROP CHECK `chk_profiles_sex`
        ");
    }
}
