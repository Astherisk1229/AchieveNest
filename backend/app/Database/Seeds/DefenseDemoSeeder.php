<?php

namespace App\Database\Seeds;

use App\Services\DefenseDemoPreflightService;
use App\Services\LocalEvidenceStorageService;
use CodeIgniter\Database\Seeder;

class DefenseDemoSeeder extends Seeder
{
    public function run()
    {
        $db = $this->db;

        // 0. Preflight validation - fail fast before any mutation or deletion
        $preflight = new DefenseDemoPreflightService();
        $preflight->validate($db);

        $storage = new LocalEvidenceStorageService();

        // 1. Controlled cleanup of existing demo-owned records only (IDs starting with 'd0000000-')
        $demoPrefix = 'd0000000-%';

        // Delete physical demo evidence files before clearing DB rows
        $studentDemoEv = $db->table('student_portfolio_evidence')->like('id', $demoPrefix)->get()->getResultArray();
        foreach ($studentDemoEv as $ev) {
            $storage->deletePhysicalFile($ev['storage_path']);
        }
        $personnelDemoEv = $db->table('personnel_accomplishment_evidence')->like('id', $demoPrefix)->get()->getResultArray();
        foreach ($personnelDemoEv as $ev) {
            $storage->deletePhysicalFile($ev['storage_path']);
        }

        // Delete in foreign-key dependency order
        $db->table('notifications')->like('id', $demoPrefix)->delete();
        $db->table('student_portfolio_verification_events')->like('id', $demoPrefix)->delete();
        $db->table('student_portfolio_evidence')->like('id', $demoPrefix)->delete();
        $db->table('student_portfolio_records')->like('id', $demoPrefix)->delete();
        $db->table('award_interview_eligibilities')->like('id', $demoPrefix)->delete();
        $db->table('dean_student_nominations')->like('id', $demoPrefix)->delete();
        $db->table('student_award_evaluations')->like('id', $demoPrefix)->delete();
        $db->table('award_cycles')->like('id', $demoPrefix)->delete();
        $db->table('personnel_accomplishment_evidence')->like('id', $demoPrefix)->delete();
        $db->table('personnel_accomplishments')->like('id', $demoPrefix)->delete();
        $db->table('organization_moderator_assignments')->like('id', $demoPrefix)->delete();
        $db->table('program_coordinator_assignments')->like('id', $demoPrefix)->delete();
        $db->table('dean_assignments')->like('id', $demoPrefix)->delete();
        $db->table('organizations')->like('id', $demoPrefix)->delete();
        $db->table('personnel_administrative_unit_affiliations')->like('id', $demoPrefix)->delete();
        $db->table('personnel_program_affiliations')->like('id', $demoPrefix)->delete();
        $db->table('personnel_college_affiliations')->like('id', $demoPrefix)->delete();
        $db->table('student_program_enrollments')->like('id', $demoPrefix)->delete();
        $db->table('profile_roles')->like('profile_id', $demoPrefix)->delete();
        $db->table('local_auth_credentials')->like('profile_id', $demoPrefix)->delete();
        $db->table('profiles')->like('id', $demoPrefix)->delete();

        // 2. Call Persona Seeder
        $this->call('DefenseDemoPersonaSeeder');

        // 3. Call Scenario Seeder
        $this->call('DefenseDemoScenarioSeeder');
    }
}
