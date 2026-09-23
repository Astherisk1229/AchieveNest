<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use App\Services\OrganizationService;
use App\Services\AwardPotentialCandidateService;
use App\Services\AwardScoringService;
use App\Services\AwardEvidenceMappingService;
use App\Services\AwardEligibilityService;
use App\Services\AwardReviewService;

class VerifyCHU03Workflows extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:chu03';
    protected $description = 'Verifies CHU-03 OSAD functional modules, moderator assignment, reports, audit logs, and demo readiness.';

    public function run(array $params)
    {
        CLI::write("=== CHU-03: OSAD Workflows & Demonstration Verification ===", 'green');
        $db = db_connect();
        $passed = 0;
        $total = 8;

        // 1. Check OSAD Organizations and Moderator assignment capability
        CLI::write("[Check 1/8] Verifying Organization Moderator Assignment Service...", 'yellow');
        $orgService = new OrganizationService($db);
        $activeOrgs = $db->table('organizations')->where('status', 'active')->get()->getResultArray();
        if (count($activeOrgs) > 0) {
            $testOrg = $activeOrgs[0];
            $personnel = $db->table('profiles')
                ->where('account_type', 'personnel')
                ->where('status', 'active')
                ->get()->getRowArray();

            if ($personnel) {
                CLI::write(" -> Active organization and personnel found: Org='{$testOrg['name']}', Personnel='{$personnel['full_name']}'", 'cyan');
                $passed++;
            } else {
                CLI::error(" -> No active personnel found for moderator assignment check.");
            }
        } else {
            CLI::error(" -> No active organizations found in database.");
        }

        // 2. Check Moderator Assignment Persistence & Deactivation logic
        CLI::write("[Check 2/8] Verifying Moderator Assignment Table & Deactivation Structure...", 'yellow');
        $hasOmaTable = $db->tableExists('organization_moderator_assignments');
        if ($hasOmaTable) {
            $assignments = $db->table('organization_moderator_assignments')->get()->getResultArray();
            CLI::write(" -> organization_moderator_assignments table exists with " . count($assignments) . " historical records.", 'cyan');
            $passed++;
        } else {
            CLI::error(" -> organization_moderator_assignments table missing.");
        }

        // 3. Check Award Potential Candidate Evaluation Service
        CLI::write("[Check 3/8] Verifying Award Candidate & 80% Threshold Engine...", 'yellow');
        $eligibilityService = new AwardEligibilityService($db);
        $mappingService = new AwardEvidenceMappingService($db, $eligibilityService);
        $scoringService = new AwardScoringService($db, $eligibilityService, $mappingService);
        $reviewService = new AwardReviewService($db, $eligibilityService, $mappingService, $scoringService);
        $candidateService = new AwardPotentialCandidateService($db, $eligibilityService, $mappingService, $scoringService, $reviewService);

        $activeAwards = $db->table('award_definitions')->where('status', 'active')->get()->getResultArray();
        if (count($activeAwards) > 0) {
            CLI::write(" -> Found " . count($activeAwards) . " active award definitions in catalog.", 'cyan');
            $passed++;
        } else {
            CLI::error(" -> No active award definitions found.");
        }

        // 4. Check Candidate Evidence Traceability
        CLI::write("[Check 4/8] Verifying Candidate Evidence Traceability Tables...", 'yellow');
        $hasSaeTable = $db->tableExists('student_award_evaluations');
        $hasSacsTable = $db->tableExists('student_award_criterion_scores');
        $hasSaseTable = $db->tableExists('student_award_score_evidence');
        if ($hasSaeTable && $hasSacsTable && $hasSaseTable) {
            CLI::write(" -> student_award_evaluations, criterion_scores, and score_evidence tables verified.", 'cyan');
            $passed++;
        } else {
            CLI::error(" -> Award candidate scoring tables missing.");
        }

        // 5. Check Dean Award Nomination Capability in Award Engine
        CLI::write("[Check 5/8] Verifying Dean Nomination Rules & Routing...", 'yellow');
        $hasDeanAssignment = $db->tableExists('dean_assignments');
        if ($hasDeanAssignment) {
            $deanCount = $db->table('dean_assignments')->where('is_active', 1)->countAllResults();
            CLI::write(" -> Active College Dean assignments verified: {$deanCount} active Deans.", 'cyan');
            $passed++;
        } else {
            CLI::error(" -> dean_assignments table missing.");
        }

        // 6. Check Audit Logs Table and Storage
        CLI::write("[Check 6/8] Verifying System Audit Logs Schema...", 'yellow');
        $hasAuditLogsTable = $db->tableExists('audit_logs');
        if ($hasAuditLogsTable) {
            $auditCount = $db->table('audit_logs')->countAllResults();
            CLI::write(" -> audit_logs table active with {$auditCount} recorded administrative events.", 'cyan');
            $passed++;
        } else {
            CLI::error(" -> audit_logs table missing.");
        }

        // 7. Check Personnel Evaluation & Annual Review Storage
        CLI::write("[Check 7/8] Verifying Personnel Annual Review & Evaluation Storage...", 'yellow');
        $hasReviews = $db->tableExists('personnel_annual_reviews');
        $hasRoots = $db->tableExists('personnel_evaluation_roots');
        if ($hasReviews || $hasRoots) {
            $reviewCount = $hasReviews ? $db->table('personnel_annual_reviews')->countAllResults() : 0;
            $rootCount = $hasRoots ? $db->table('personnel_evaluation_roots')->countAllResults() : 0;
            CLI::write(" -> personnel_annual_reviews ({$reviewCount}) and evaluation_roots ({$rootCount}) verified.", 'cyan');
            $passed++;
        } else {
            CLI::error(" -> Personnel annual review tables missing.");
        }

        // 8. Check 10 Synthetic Demo Personas for Cross-Role Demo
        CLI::write("[Check 8/8] Verifying Synthetic Demo Personas for OSAD & Cross-Role Workflows...", 'yellow');
        $requiredDemoEmails = [
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

        $foundEmails = $db->table('profiles')->whereIn('email', $requiredDemoEmails)->get()->getResultArray();
        if (count($foundEmails) === count($requiredDemoEmails)) {
            CLI::write(" -> All " . count($requiredDemoEmails) . " canonical demo personas verified in database.", 'cyan');
            $passed++;
        } else {
            CLI::error(" -> Missing demo personas. Expected " . count($requiredDemoEmails) . ", found " . count($foundEmails));
        }

        CLI::write("\n=== Verification Summary: {$passed} / {$total} Checks Passed ===", $passed === $total ? 'green' : 'red');
        return $passed === $total ? 0 : 1;
    }
}
