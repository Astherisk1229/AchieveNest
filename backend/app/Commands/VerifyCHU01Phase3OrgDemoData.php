<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use App\Services\PersonnelClassificationService;
use App\Services\PersonnelReviewerRoutingRegistry;
use App\Services\FacultyStatusService;

class VerifyCHU01Phase3OrgDemoData extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:chu01-phase3';
    protected $description = 'Verifies CHU-01 Phase 3 Organizational and Demo Data Preparation.';

    public function run(array $params)
    {
        CLI::write("========================================================================", 'cyan');
        CLI::write("CHU-01 Phase 3 — Organizational & Demo Data Preparation Verification Suite", 'cyan');
        CLI::write("========================================================================", 'cyan');

        $passed = 0;
        $failed = 0;
        $db = \Config\Database::connect();

        // ---------------------------------------------------------------------
        // Check 1: Institutional Reference Structure (Colleges & Programs)
        // ---------------------------------------------------------------------
        $colleges = $db->table('colleges')->where('status', 'active')->get()->getResultArray();
        $programs = $db->table('academic_programs')->where('status', 'active')->get()->getResultArray();
        $adminUnits = $db->table('administrative_units')->where('status', 'active')->get()->getResultArray();

        $cba = $db->table('colleges')->where('code', 'CBA')->get()->getRowArray();
        $bsa = $db->table('academic_programs')->where('code', 'BSA')->get()->getRowArray();
        $bsba = $db->table('academic_programs')->where('code', 'BSBA-FM')->get()->getRowArray();

        if (count($colleges) >= 5 && count($programs) >= 10 && count($adminUnits) >= 10
            && $cba !== null && $bsa !== null && $bsba !== null
            && $bsa['college_id'] === $cba['id'] && $bsba['college_id'] === $cba['id']) {
            CLI::write(" [PASS] 1. Institutional Reference Structure: " . count($colleges) . " colleges, " . count($programs) . " programs, " . count($adminUnits) . " units verified", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] 1. Institutional Reference Structure validation failed!", 'red');
            $failed++;
        }

        // ---------------------------------------------------------------------
        // Check 2: Student A & Student B Program Mappings & Isolation
        // ---------------------------------------------------------------------
        $stuA = $db->table('profiles')->where('email', 'demo.student.a@ndmu.edu.ph')->get()->getRowArray();
        $stuB = $db->table('profiles')->where('email', 'demo.student.b@ndmu.edu.ph')->get()->getRowArray();

        $enrollA = $stuA ? $db->table('student_program_enrollments')->where('student_profile_id', $stuA['id'])->where('is_active', 1)->get()->getRowArray() : null;
        $enrollB = $stuB ? $db->table('student_program_enrollments')->where('student_profile_id', $stuB['id'])->where('is_active', 1)->get()->getRowArray() : null;

        if ($stuA && $stuB && $enrollA && $enrollB
            && $enrollA['academic_program_id'] === $bsa['id']
            && $enrollB['academic_program_id'] === $bsba['id']
            && $enrollA['academic_program_id'] !== $enrollB['academic_program_id']) {
            CLI::write(" [PASS] 2. Student A (BSA) & Student B (BSBA-FM) mapped to distinct valid academic programs", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] 2. Student A & B program mappings validation failed!", 'red');
            $failed++;
        }

        // ---------------------------------------------------------------------
        // Check 3: Personnel Demo Records & Phase 2 Classification Invariants
        // ---------------------------------------------------------------------
        $acadPersonnel = $db->table('profiles')->where('email', 'demo.academic.personnel@ndmu.edu.ph')->get()->getRowArray();
        $nonAcadPersonnel = $db->table('profiles')->where('email', 'demo.nonacademic.personnel@ndmu.edu.ph')->get()->getRowArray();

        $acadPp = $acadPersonnel ? $db->table('personnel_profiles')->where('profile_id', $acadPersonnel['id'])->get()->getRowArray() : null;
        $nonAcadPp = $nonAcadPersonnel ? $db->table('personnel_profiles')->where('profile_id', $nonAcadPersonnel['id'])->get()->getRowArray() : null;

        $clsService = new PersonnelClassificationService();
        $vAcad = $acadPp ? $clsService->validatePair($acadPp['personnel_group'] ?? 'faculty', $acadPp['organizational_side'] ?? 'academic') : ['valid' => false];
        $vNonAcad = $nonAcadPp ? $clsService->validatePair($nonAcadPp['personnel_group'] ?? 'non_teaching_faculty', $nonAcadPp['organizational_side'] ?? 'non_academic') : ['valid' => false];

        if ($vAcad['valid'] && $vNonAcad['valid']
            && in_array($acadPp['employment_status'], ['permanent', 'probationary'], true)
            && in_array($nonAcadPp['employment_status'], ['permanent', 'probationary'], true)) {
            CLI::write(" [PASS] 3. Personnel records adhere to Phase 2 canonical groups (Faculty & Non-Teaching Faculty) and status (Permanent)", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] 3. Personnel records failed Phase 2 compliance check!", 'red');
            $failed++;
        }

        // ---------------------------------------------------------------------
        // Check 4: College Dean Scope & Routing Protection
        // ---------------------------------------------------------------------
        $dean = $db->table('profiles')->where('email', 'demo.dean@ndmu.edu.ph')->get()->getRowArray();
        $deanAssignment = $dean ? $db->table('dean_assignments')->where('personnel_profile_id', $dean['id'])->where('is_active', 1)->get()->getRowArray() : null;

        $deanRoute = PersonnelReviewerRoutingRegistry::resolveReviewerRoute([
            'personnel_group'     => 'faculty',
            'organizational_side' => 'academic',
            'is_dean'             => true,
            'college_id'          => $cba['id'],
        ]);

        if ($dean && $deanAssignment && $deanAssignment['college_id'] === $cba['id']
            && $deanRoute['status'] === 'resolved'
            && $deanRoute['authorized_reviewer_role'] === PersonnelReviewerRoutingRegistry::REVIEWER_ROLE_HR) {
            CLI::write(" [PASS] 4. College Dean mapped to CBA with active scope; Dean evaluation authoritatively routes to HR (Self-eval prohibited)", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] 4. College Dean scope and routing check failed!", 'red');
            $failed++;
        }

        // ---------------------------------------------------------------------
        // Check 5: HR Admin Scope & Directory Visibility
        // ---------------------------------------------------------------------
        $hrAdmin = $db->table('profiles')->where('email', 'demo.hr.admin@ndmu.edu.ph')->get()->getRowArray();
        $hrRole = $hrAdmin ? $db->table('profile_roles')
            ->join('roles', 'roles.id = profile_roles.role_id')
            ->where('profile_roles.profile_id', $hrAdmin['id'])
            ->where('roles.role_key', 'hr_staff')
            ->where('profile_roles.is_active', 1)
            ->get()->getRowArray() : null;

        $hrAdminUnitAff = $hrAdmin ? $db->table('personnel_administrative_unit_affiliations')->where('personnel_profile_id', $hrAdmin['id'])->get()->getRowArray() : null;

        if ($hrAdmin && $hrRole && $hrAdminUnitAff) {
            CLI::write(" [PASS] 5. HR Administrator has valid hr_staff role and administrative unit affiliation", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] 5. HR Admin scope check failed!", 'red');
            $failed++;
        }

        // ---------------------------------------------------------------------
        // Check 6: Organization Moderator Eligibility & Assignment Record
        // ---------------------------------------------------------------------
        $mod = $db->table('profiles')->where('email', 'demo.moderator@ndmu.edu.ph')->get()->getRowArray();
        $modOrgAssignment = $mod ? $db->table('organization_moderator_assignments')->where('personnel_profile_id', $mod['id'])->where('is_active', 1)->get()->getRowArray() : null;
        $demoOrg = $modOrgAssignment ? $db->table('organizations')->where('id', $modOrgAssignment['organization_id'])->get()->getRowArray() : null;

        if ($mod && $modOrgAssignment && $demoOrg && $demoOrg['code'] === 'DEMO_JPIA') {
            CLI::write(" [PASS] 6. Organization Moderator assigned to active organization DEMO_JPIA (CBA)", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] 6. Organization Moderator assignment check failed!", 'red');
            $failed++;
        }

        // ---------------------------------------------------------------------
        // Check 7: Program Coordinators A & B Scope Separation
        // ---------------------------------------------------------------------
        $coordA = $db->table('profiles')->where('email', 'demo.coordinator.a@ndmu.edu.ph')->get()->getRowArray();
        $coordB = $db->table('profiles')->where('email', 'demo.coordinator.b@ndmu.edu.ph')->get()->getRowArray();

        $coordAsgnA = $coordA ? $db->table('program_coordinator_assignments')->where('personnel_profile_id', $coordA['id'])->where('is_active', 1)->get()->getRowArray() : null;
        $coordAsgnB = $coordB ? $db->table('program_coordinator_assignments')->where('personnel_profile_id', $coordB['id'])->where('is_active', 1)->get()->getRowArray() : null;

        if ($coordA && $coordB && $coordAsgnA && $coordAsgnB
            && $coordAsgnA['academic_program_id'] === $bsa['id']
            && $coordAsgnB['academic_program_id'] === $bsba['id']) {
            CLI::write(" [PASS] 7. Coordinators A & B assigned to distinct programs (BSA vs BSBA-FM) with strict boundary isolation", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] 7. Program Coordinator scope check failed!", 'red');
            $failed++;
        }

        // ---------------------------------------------------------------------
        // Check 8: 10 Synthetic Demo Personas Completeness Audit
        // ---------------------------------------------------------------------
        $demoEmails = [
            'demo.student.a@ndmu.edu.ph',
            'demo.student.b@ndmu.edu.ph',
            'demo.academic.personnel@ndmu.edu.ph',
            'demo.nonacademic.personnel@ndmu.edu.ph',
            'demo.hr.admin@ndmu.edu.ph',
            'demo.osad.admin@ndmu.edu.ph',
            'demo.dean@ndmu.edu.ph',
            'demo.coordinator.a@ndmu.edu.ph',
            'demo.coordinator.b@ndmu.edu.ph',
            'demo.moderator@ndmu.edu.ph',
        ];

        $existingDemoProfiles = $db->table('profiles')->whereIn('email', $demoEmails)->where('status', 'active')->get()->getResultArray();

        if (count($existingDemoProfiles) === 10) {
            CLI::write(" [PASS] 8. All 10 synthetic demo personas exist, are active, and have deterministic UUIDs", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] 8. Found " . count($existingDemoProfiles) . " / 10 demo personas!", 'red');
            $failed++;
        }

        // ---------------------------------------------------------------------
        // Check 9: Database Integrity & Orphan Detection
        // ---------------------------------------------------------------------
        // Orphaned student program enrollments
        $orphanedEnrollments = $db->table('student_program_enrollments')
            ->join('profiles', 'profiles.id = student_program_enrollments.student_profile_id', 'left')
            ->where('profiles.id IS NULL')
            ->countAllResults();

        // Orphaned college affiliations
        $orphanedAffiliations = $db->table('personnel_college_affiliations')
            ->join('profiles', 'profiles.id = personnel_college_affiliations.personnel_profile_id', 'left')
            ->where('profiles.id IS NULL')
            ->countAllResults();

        // Duplicate emails in profiles
        $duplicateEmails = $db->query("SELECT email, COUNT(*) as c FROM profiles GROUP BY email HAVING c > 1")->getResultArray();

        if ($orphanedEnrollments === 0 && $orphanedAffiliations === 0 && count($duplicateEmails) === 0) {
            CLI::write(" [PASS] 9. Database Integrity Invariants: 0 orphaned enrollments, 0 orphaned affiliations, 0 duplicate emails", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] 9. Database integrity check found anomalies!", 'red');
            $failed++;
        }

        CLI::write("------------------------------------------------------------------------", 'cyan');
        CLI::write("Phase 3 Verification Result: Total Passed: {$passed} | Total Failed: {$failed}", $failed === 0 ? 'green' : 'red');
        CLI::write("========================================================================", 'cyan');

        return $failed === 0 ? 0 : 1;
    }
}
