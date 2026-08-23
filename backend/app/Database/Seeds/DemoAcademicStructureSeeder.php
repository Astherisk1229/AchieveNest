<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;
use RuntimeException;

class DemoAcademicStructureSeeder extends Seeder
{
    public function run()
    {
        $this->db->transStart();

        $colleges = [
            ['code' => 'CED', 'name' => 'College of Education'],
            ['code' => 'CEAC', 'name' => 'College of Engineering, Architecture and Computing'],
            ['code' => 'CAS', 'name' => 'College of Arts and Sciences'],
            ['code' => 'CBGA', 'name' => 'College of Business, Governance and Administration'],
            ['code' => 'CHS', 'name' => 'College of Health Sciences'],
        ];

        foreach ($colleges as $college) {
            $this->ensureRecord('colleges', $college['code'], [
                'code' => $college['code'],
                'name' => $college['name'],
                'status' => 'active',
            ]);
        }

        $departments = [
            ['code' => 'PEFS', 'college_code' => 'CED', 'name' => 'Physical Education and Fitness Studies'],
            ['code' => 'CSD', 'college_code' => 'CEAC', 'name' => 'Computer Studies Department'],
            ['code' => 'PSS', 'college_code' => 'CAS', 'name' => 'Psychology and Social Sciences'],
            ['code' => 'JAHMS', 'college_code' => 'CBGA', 'name' => 'Joint Administration, Hospitality and Management Studies'],
            ['code' => 'PNSA', 'college_code' => 'CHS', 'name' => 'Professional Nursing Studies Area'],
            ['code' => 'EECE', 'college_code' => 'CAS', 'name' => 'English, Education and Communication Studies'],
            ['code' => 'CIT', 'college_code' => 'CHS', 'name' => 'Clinical Instruction and Training'],
        ];

        foreach ($departments as $department) {
            $college = $this->findByCode('colleges', $department['college_code']);
            $this->ensureRecord('departments', $department['code'], [
                'college_id' => $college['id'],
                'code' => $department['code'],
                'name' => $department['name'],
                'status' => 'active',
            ]);
        }

        $degreePrograms = [
            ['code' => 'BPED', 'department_code' => 'PEFS', 'name' => 'Bachelor of Physical Education'],
            ['code' => 'BSCS', 'department_code' => 'CSD', 'name' => 'Bachelor of Science in Computer Science'],
            ['code' => 'BSPS', 'department_code' => 'PSS', 'name' => 'Bachelor of Science in Psychology'],
            ['code' => 'BSHM', 'department_code' => 'JAHMS', 'name' => 'Bachelor of Science in Hospitality Management'],
            ['code' => 'BSN', 'department_code' => 'PNSA', 'name' => 'Bachelor of Science in Nursing'],
        ];

        foreach ($degreePrograms as $degreeProgram) {
            $department = $this->findByCode('departments', $degreeProgram['department_code']);
            $this->ensureRecord('degree_programs', $degreeProgram['code'], [
                'department_id' => $department['id'],
                'code' => $degreeProgram['code'],
                'name' => $degreeProgram['name'],
                'degree_level' => 'Bachelor',
                'status' => 'active',
            ]);
        }

        $this->db->transComplete();

        if ($this->db->transStatus() === false) {
            throw new RuntimeException('Demo academic structure seeding failed.');
        }
    }

    private function ensureRecord(string $table, string $code, array $data): array
    {
        $existing = $this->findByCode($table, $code);

        if ($existing === null) {
            $this->db->table($table)->insert($data);
        } else {
            $this->db->table($table)->where('id', $existing['id'])->update($data);
        }

        return $this->findByCode($table, $code);
    }

    private function findByCode(string $table, string $code): ?array
    {
        $record = $this->db->table($table)
            ->where('code', $code)
            ->get()
            ->getRowArray();

        return $record ?: null;
    }
}
