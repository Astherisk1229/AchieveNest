<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use App\Services\PersonnelClassificationService;
use App\Services\PersonnelReviewerRoutingRegistry;
use App\Services\FacultyStatusService;

class VerifyCHU01Phase2PersonnelRules extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:chu01-phase2';
    protected $description = 'Verifies CHU-01 Phase 2 Personnel Rule Reconciliation across DB, Services, Validation & Routing (T1-T10).';

    public function run(array $params)
    {
        CLI::write("========================================================================", 'cyan');
        CLI::write("CHU-01 Phase 2 — Personnel Rule Reconciliation & Routing Verification Suite", 'cyan');
        CLI::write("========================================================================", 'cyan');

        $passed = 0;
        $failed = 0;

        $clsService = new PersonnelClassificationService();
        $statusService = new FacultyStatusService();

        // ---------------------------------------------------------------------
        // T1: Faculty + Non-Academic + Permanent -> Valid, Route HR (CHU-01)
        // ---------------------------------------------------------------------
        $resT1 = $clsService->validatePair('faculty', 'non_academic');
        $statT1 = $statusService->validateEmploymentStatus('permanent');
        $routeT1 = PersonnelReviewerRoutingRegistry::resolveReviewerRoute([
            'personnel_group'     => 'faculty',
            'organizational_side' => 'non_academic',
        ]);

        if ($resT1['valid'] === true && $resT1['code'] === PersonnelClassificationService::CODE_FACULTY_NON_ACADEMIC
            && $statT1['valid'] === true && $statT1['status'] === FacultyStatusService::EMPLOYMENT_PERMANENT
            && $routeT1['status'] === 'resolved' && $routeT1['authorized_reviewer_role'] === PersonnelReviewerRoutingRegistry::REVIEWER_ROLE_HR) {
            CLI::write(" [PASS] T1: Faculty + Non-Academic + Permanent -> Valid classification, Route -> HR (CHU-01 Phase 2)", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] T1: Faculty + Non-Academic + Permanent validation failed!", 'red');
            $failed++;
        }

        // ---------------------------------------------------------------------
        // T2: Faculty + Non-Academic + Probationary -> Valid, Route HR (CHU-01)
        // ---------------------------------------------------------------------
        $resT2 = $clsService->validatePair('faculty', 'non_academic');
        $statT2 = $statusService->validateEmploymentStatus('probationary');
        $routeT2 = PersonnelReviewerRoutingRegistry::resolveReviewerRoute([
            'personnel_group'     => 'faculty',
            'organizational_side' => 'non_academic',
        ]);

        if ($resT2['valid'] === true && $resT2['code'] === PersonnelClassificationService::CODE_FACULTY_NON_ACADEMIC
            && $statT2['valid'] === true && $statT2['status'] === FacultyStatusService::EMPLOYMENT_PROBATIONARY
            && $routeT2['status'] === 'resolved' && $routeT2['authorized_reviewer_role'] === PersonnelReviewerRoutingRegistry::REVIEWER_ROLE_HR) {
            CLI::write(" [PASS] T2: Faculty + Non-Academic + Probationary -> Valid classification, Route -> HR (CHU-01 Phase 2)", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] T2: Faculty + Non-Academic + Probationary validation failed!", 'red');
            $failed++;
        }

        // ---------------------------------------------------------------------
        // T3: Non-Teaching Faculty + Academic + Permanent -> Valid, Route HR (CHU-01)
        // ---------------------------------------------------------------------
        $resT3 = $clsService->validatePair('non_teaching_faculty', 'academic');
        $statT3 = $statusService->validateEmploymentStatus('permanent');
        $routeT3 = PersonnelReviewerRoutingRegistry::resolveReviewerRoute([
            'personnel_group'     => 'non_teaching_faculty',
            'organizational_side' => 'academic',
            'college_id'          => 'COLLEGE-CEAC',
        ]);

        if ($resT3['valid'] === true && $resT3['code'] === PersonnelClassificationService::CODE_NON_TEACHING_FACULTY_ACADEMIC
            && $statT3['valid'] === true && $statT3['status'] === FacultyStatusService::EMPLOYMENT_PERMANENT
            && $routeT3['status'] === 'resolved' && $routeT3['authorized_reviewer_role'] === PersonnelReviewerRoutingRegistry::REVIEWER_ROLE_HR) {
            CLI::write(" [PASS] T3: Non-Teaching Faculty + Academic + Permanent -> Valid classification, Route -> HR (CHU-01 Phase 2)", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] T3: Non-Teaching Faculty + Academic + Permanent validation failed!", 'red');
            $failed++;
        }

        // ---------------------------------------------------------------------
        // T4: Non-Teaching Faculty + Academic + Probationary -> Valid, Route HR (CHU-01)
        // ---------------------------------------------------------------------
        $resT4 = $clsService->validatePair('non_teaching_faculty', 'academic');
        $statT4 = $statusService->validateEmploymentStatus('probationary');
        $routeT4 = PersonnelReviewerRoutingRegistry::resolveReviewerRoute([
            'personnel_group'     => 'non_teaching_faculty',
            'organizational_side' => 'academic',
            'college_id'          => 'COLLEGE-CHS',
        ]);

        if ($resT4['valid'] === true && $resT4['code'] === PersonnelClassificationService::CODE_NON_TEACHING_FACULTY_ACADEMIC
            && $statT4['valid'] === true && $statT4['status'] === FacultyStatusService::EMPLOYMENT_PROBATIONARY
            && $routeT4['status'] === 'resolved' && $routeT4['authorized_reviewer_role'] === PersonnelReviewerRoutingRegistry::REVIEWER_ROLE_HR) {
            CLI::write(" [PASS] T4: Non-Teaching Faculty + Academic + Probationary -> Valid classification, Route -> HR (CHU-01 Phase 2)", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] T4: Non-Teaching Faculty + Academic + Probationary validation failed!", 'red');
            $failed++;
        }

        // ---------------------------------------------------------------------
        // T5: Faculty + Academic -> Valid, Route Dean (Plan G0/G1 & Plan K5)
        // ---------------------------------------------------------------------
        $resT5 = $clsService->validatePair('faculty', 'academic');
        $routeT5 = PersonnelReviewerRoutingRegistry::resolveReviewerRoute([
            'personnel_group'     => 'faculty',
            'organizational_side' => 'academic',
            'college_id'          => 'COLLEGE-CBA',
        ]);

        if ($resT5['valid'] === true && $resT5['code'] === PersonnelClassificationService::CODE_FACULTY_ACADEMIC
            && $routeT5['status'] === 'resolved' && $routeT5['authorized_reviewer_role'] === PersonnelReviewerRoutingRegistry::REVIEWER_ROLE_DEAN
            && $routeT5['target_college_id'] === 'COLLEGE-CBA' && $routeT5['scope_type'] === 'COLLEGE_ACADEMIC_SCOPE') {
            CLI::write(" [PASS] T5: Faculty + Academic -> Valid classification, Route -> Dean (Plan G / Plan K5 Authority)", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] T5: Faculty + Academic validation failed!", 'red');
            $failed++;
        }

        // ---------------------------------------------------------------------
        // T6: Non-Teaching Faculty + Non-Academic -> Valid, Route HR (Plan G0/G1 & Plan K5)
        // ---------------------------------------------------------------------
        $resT6 = $clsService->validatePair('non_teaching_faculty', 'non_academic');
        $routeT6 = PersonnelReviewerRoutingRegistry::resolveReviewerRoute([
            'personnel_group'     => 'non_teaching_faculty',
            'organizational_side' => 'non_academic',
        ]);

        if ($resT6['valid'] === true && $resT6['code'] === PersonnelClassificationService::CODE_NON_TEACHING_FACULTY_NON_ACADEMIC
            && $routeT6['status'] === 'resolved' && $routeT6['authorized_reviewer_role'] === PersonnelReviewerRoutingRegistry::REVIEWER_ROLE_HR
            && $routeT6['scope_type'] === 'UNIVERSITY_HR_SCOPE') {
            CLI::write(" [PASS] T6: Non-Teaching Faculty + Non-Academic -> Valid classification, Route -> HR (Plan G / Plan K5 Authority)", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] T6: Non-Teaching Faculty + Non-Academic validation failed!", 'red');
            $failed++;
        }

        // ---------------------------------------------------------------------
        // T7: Missing Personnel Type -> Validation Error / Unresolved Route
        // ---------------------------------------------------------------------
        $resT7 = $clsService->validatePair('', 'academic');
        $routeT7 = PersonnelReviewerRoutingRegistry::resolveReviewerRoute([
            'personnel_group'     => '',
            'organizational_side' => 'academic',
        ]);

        if ($resT7['valid'] === false && $resT7['error']['code'] === 'INVALID_PERSONNEL_CLASSIFICATION'
            && $routeT7['status'] === 'unresolved' && $routeT7['authorized_reviewer_role'] === null
            && $routeT7['reason_code'] === PersonnelReviewerRoutingRegistry::REASON_REVIEWER_ROUTE_UNRESOLVED) {
            CLI::write(" [PASS] T7: Missing personnel type strictly rejected & produces status=unresolved", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] T7: Missing personnel type was not rejected correctly!", 'red');
            $failed++;
        }

        // ---------------------------------------------------------------------
        // T8: Missing Organizational Side -> Unresolved Route (No Default to HR)
        // ---------------------------------------------------------------------
        $resT8 = $clsService->validatePair('faculty', '');
        $routeT8 = PersonnelReviewerRoutingRegistry::resolveReviewerRoute([
            'personnel_group'     => 'faculty',
            'organizational_side' => '',
        ]);

        if ($resT8['valid'] === false && $resT8['error']['code'] === 'INVALID_PERSONNEL_CLASSIFICATION'
            && $routeT8['status'] === 'unresolved' && $routeT8['authorized_reviewer_role'] === null
            && $routeT8['reason_code'] === PersonnelReviewerRoutingRegistry::REASON_REVIEWER_ROUTE_UNRESOLVED) {
            CLI::write(" [PASS] T8: Missing organizational side produces status=unresolved without defaulting to HR", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] T8: Missing side incorrectly defaulted to a reviewer!", 'red');
            $failed++;
        }

        // ---------------------------------------------------------------------
        // T9: Unsupported Personnel Type -> Validation Error
        // ---------------------------------------------------------------------
        $resT9 = $clsService->validatePair('administrative_staff', 'academic');

        if ($resT9['valid'] === false && $resT9['error']['code'] === 'INVALID_PERSONNEL_CLASSIFICATION') {
            CLI::write(" [PASS] T9: Unsupported personnel type ('administrative_staff') rejected with INVALID_PERSONNEL_CLASSIFICATION", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] T9: Unsupported personnel type was not rejected correctly!", 'red');
            $failed++;
        }

        // ---------------------------------------------------------------------
        // T10: Classification Validity Separated from Reviewer Route Validity
        // ---------------------------------------------------------------------
        // Hypothetical valid classification pair where route is missing from context
        $clsValid = $clsService->validatePair('faculty', 'academic');
        $routeIncomplete = PersonnelReviewerRoutingRegistry::resolveReviewerRoute([
            'personnel_group'     => '',
            'organizational_side' => 'academic',
        ]);

        if ($clsValid['valid'] === true && $routeIncomplete['status'] === 'unresolved'
            && is_array($routeIncomplete['inputs']) && $routeIncomplete['inputs']['personnel_group'] === '') {
            CLI::write(" [PASS] T10: Classification structural validity is strictly separated from reviewer-route resolution", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] T10: Concept separation between classification and routing failed!", 'red');
            $failed++;
        }

        // ---------------------------------------------------------------------
        // Database & Active Record Check (Phase R-G)
        // ---------------------------------------------------------------------
        $db = \Config\Database::connect();
        $dbRows = $db->table('personnel_profiles')->get()->getResultArray();
        $dbInvalidStatusCount = 0;
        $groupSideCounts = [];

        foreach ($dbRows as $row) {
            $grp = $row['personnel_group'] ?? 'NULL';
            $side = $row['organizational_side'] ?? $row['personnel_classification'] ?? 'NULL';
            $stat = $row['employment_status'] ?? 'NULL';

            $pairKey = "{$grp} + {$side}";
            $groupSideCounts[$pairKey] = ($groupSideCounts[$pairKey] ?? 0) + 1;

            if (! in_array($stat, ['permanent', 'probationary'], true)) {
                $dbInvalidStatusCount++;
            }
        }

        CLI::write("------------------------------------------------------------------------", 'cyan');
        CLI::write("Active Database Record Breakdown (" . count($dbRows) . " total records):", 'cyan');
        foreach ($groupSideCounts as $pair => $cnt) {
            CLI::write("  - {$pair}: {$cnt} record(s)", 'yellow');
        }

        if ($dbInvalidStatusCount === 0 && count($dbRows) > 0) {
            CLI::write(" [PASS] DB Invariants: All " . count($dbRows) . " records adhere to canonical status constraints", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] DB Check: Found {$dbInvalidStatusCount} records with non-canonical status!", 'red');
            $failed++;
        }

        CLI::write("------------------------------------------------------------------------", 'cyan');
        CLI::write("Total Passed: {$passed} | Total Failed: {$failed}", $failed === 0 ? 'green' : 'red');
        CLI::write("========================================================================", 'cyan');

        return $failed === 0 ? 0 : 1;
    }
}
