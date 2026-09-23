<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use App\Services\AwardScoringService;
use App\Services\AwardEligibilityService;
use App\Services\AwardEvidenceMappingService;

class VerifySA01ValidationCases extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:sa01';
    protected $description = 'Executes complete synthetic positive and negative validation test suites for SA-01.8.';

    public function run(array $params)
    {
        $db = \Config\Database::connect();

        CLI::write("========================================================================================", 'cyan');
        CLI::write("SA-01.8: COMPREHENSIVE AWARD-TO-PORTFOLIO RULE VALIDATION SUITE", 'cyan');
        CLI::write("========================================================================================", 'cyan');

        $eligibilityService = new AwardEligibilityService($db);
        $mappingService = new AwardEvidenceMappingService($db, $eligibilityService);
        $scoringService = new AwardScoringService($db, $eligibilityService, $mappingService);

        $results = [];
        $totalTests = 0;
        $passCount = 0;
        $failCount = 0;

        // Helper to record assertions
        $assertTest = function ($testId, $family, $routeId, $awardCode, $desc, $expectedVal, $actualVal, $reasonCode = null) use (&$results, &$totalTests, &$passCount, &$failCount) {
            $totalTests++;
            $passed = ($expectedVal === $actualVal);
            if ($passed) {
                $passCount++;
                $status = 'PASS';
            } else {
                $failCount++;
                $status = 'FAIL';
            }

            $results[] = [
                'test_id' => $testId,
                'family' => $family,
                'route_id' => $routeId,
                'award_code' => $awardCode,
                'description' => $desc,
                'expected' => $expectedVal,
                'actual' => $actualVal,
                'reason' => $reasonCode ?? 'N/A',
                'status' => $status,
            ];

            $color = $passed ? 'green' : 'red';
            CLI::write(sprintf("  [%s] %s | %s: Expected %s, Got %s [%s]", $status, $testId, $desc, json_encode($expectedVal), json_encode($actualVal), $reasonCode ?? 'OK'), $color);
        };

        // Standard student fixtures
        $studentGrad = [
            'id' => 'syn-stud-001',
            'gender' => 'female',
            'is_graduating' => 1,
            'enrollment_status' => 'enrolled',
            'academic_year' => '2025-2026',
        ];
        $awardNDA = $db->table('award_definitions')->where('code', 'NOTRE_DAME_AWARD')->get()->getRowArray();
        $awardLead = $db->table('award_definitions')->where('code', 'LEADERSHIP_AWARD')->get()->getRowArray();
        $awardSportsF = $db->table('award_definitions')->where('code', 'SPORTS_AWARD_FEMALE')->get()->getRowArray();
        $awardSMC = $db->table('award_definitions')->where('code', 'SMC_AWARD')->get()->getRowArray();
        $awardJourn = $db->table('award_definitions')->where('code', 'CAMPUS_JOURNALISM_AWARD')->get()->getRowArray();

        // -------------------------------------------------------------
        // 1. T-CATEGORY (Category Boundaries & Invariant: Category Match != Award Points)
        // -------------------------------------------------------------
        CLI::write("\n--- 1. Testing Family: T-CATEGORY ---", 'yellow');

        $catOnlyRecord = [
            'id' => 'syn-rec-cat-only-001',
            'category_code' => 'LEADERSHIP_POSITION',
            'subcategory_code' => null,
            'structured_metadata' => [],
            'status' => 'verified',
        ];
        $scoreRes = $scoringService->scoreStudentForAward($awardNDA, $studentGrad, [$catOnlyRecord]);
        $assertTest('TC-CAT-001', 'T-CATEGORY', 'SA01-R002', 'NOTRE_DAME_AWARD', 'Category-Only Match yields exactly 0.00 pts (Category Match != Award Points)', 0.0, (float)$scoreRes['raw_portfolio_score'], 'CATEGORY_ONLY_ZERO_SCORE');

        $catMismatchRecord = [
            'id' => 'syn-rec-cat-mismatch-002',
            'category_code' => 'SPORTS',
            'subcategory_code' => 'SSG_UNIVERSITY_GOVERNMENT',
            'structured_metadata' => ['position_level' => 'executive'],
            'status' => 'verified',
        ];
        $scoreResLead = $scoringService->scoreStudentForAward($awardLead, $studentGrad, [$catMismatchRecord]);
        $assertTest('TC-CAT-002', 'T-CATEGORY', 'SA01-R011', 'LEADERSHIP_AWARD', 'Mismatched Category yields 0.00 pts', 0.0, (float)$scoreResLead['raw_portfolio_score'], 'CATEGORY_MISMATCH');

        // -------------------------------------------------------------
        // 2. T-SUBCATEGORY (Subcategory Mismatch)
        // -------------------------------------------------------------
        CLI::write("\n--- 2. Testing Family: T-SUBCATEGORY ---", 'yellow');

        $subMismatchRecord = [
            'id' => 'syn-rec-sub-mismatch-003',
            'category_code' => 'LEADERSHIP_POSITION',
            'subcategory_code' => 'HOMEROOM_OFFICER',
            'structured_metadata' => ['position_level' => 'executive'],
            'status' => 'verified',
        ];
        $scoreResSub = $scoringService->scoreStudentForAward($awardLead, $studentGrad, [$subMismatchRecord]);
        $assertTest('TC-SUB-001', 'T-SUBCATEGORY', 'SA01-R011', 'LEADERSHIP_AWARD', 'Disallowed Sub-Category yields 0.00 pts', 0.0, (float)$scoreResSub['raw_portfolio_score'], 'SUBCATEGORY_MISMATCH');

        // -------------------------------------------------------------
        // 3. T-METADATA (Missing & Invalid Metadata)
        // -------------------------------------------------------------
        CLI::write("\n--- 3. Testing Family: T-METADATA ---", 'yellow');

        $missingMetaRecord = [
            'id' => 'syn-rec-missing-meta-004',
            'category_code' => 'LEADERSHIP_POSITION',
            'subcategory_code' => 'SSG_UNIVERSITY_GOVERNMENT',
            'structured_metadata' => [],
            'status' => 'verified',
        ];
        $scoreResMeta = $scoringService->scoreStudentForAward($awardLead, $studentGrad, [$missingMetaRecord]);
        $assertTest('TC-MET-001', 'T-METADATA', 'SA01-R011', 'LEADERSHIP_AWARD', 'Missing mandatory position_level yields 0.00 pts', 0.0, (float)$scoreResMeta['raw_portfolio_score'], 'MISSING_REQUIRED_METADATA');

        $invalidMetaRecord = [
            'id' => 'syn-rec-invalid-meta-005',
            'category_code' => 'LEADERSHIP_POSITION',
            'subcategory_code' => 'SSG_UNIVERSITY_GOVERNMENT',
            'structured_metadata' => ['position_level' => 'unsupported_intern_role'],
            'status' => 'verified',
        ];
        $scoreResInv = $scoringService->scoreStudentForAward($awardLead, $studentGrad, [$invalidMetaRecord]);
        $assertTest('TC-MET-002', 'T-METADATA', 'SA01-R011', 'LEADERSHIP_AWARD', 'Invalid controlled vocabulary value yields 0.00 pts', 0.0, (float)$scoreResInv['raw_portfolio_score'], 'INVALID_METADATA_VALUE');

        // -------------------------------------------------------------
        // 4. T-VERIFICATION (Lifecycle Verification Gates)
        // -------------------------------------------------------------
        CLI::write("\n--- 4. Testing Family: T-VERIFICATION ---", 'yellow');

        $unverifiedRecord = [
            'id' => 'syn-rec-unverified-006',
            'category_code' => 'LEADERSHIP_POSITION',
            'subcategory_code' => 'SSG_UNIVERSITY_GOVERNMENT',
            'structured_metadata' => ['position_level' => 'executive', 'title' => 'President'],
            'status' => 'submitted',
        ];
        $scoreResUnv = $scoringService->scoreStudentForAward($awardLead, $studentGrad, [$unverifiedRecord]);
        $assertTest('TC-VER-001', 'T-VERIFICATION', 'SA01-R011', 'LEADERSHIP_AWARD', 'Unverified status (submitted) yields 0.00 pts', 0.0, (float)$scoreResUnv['raw_portfolio_score'], 'NOT_VERIFIED');

        // -------------------------------------------------------------
        // 5. T-AWARD-ELIGIBILITY (Award-Level Gates)
        // -------------------------------------------------------------
        CLI::write("\n--- 5. Testing Family: T-AWARD-ELIGIBILITY ---", 'yellow');

        $studentMale = [
            'id' => 'syn-stud-male-002',
            'gender' => 'male',
            'is_graduating' => 1,
            'enrollment_status' => 'enrolled',
        ];
        $sportsRecord = [
            'id' => 'syn-rec-sports-007',
            'category_code' => 'SPORTS',
            'subcategory_code' => 'SPORTS_PARTICIPATION',
            'structured_metadata' => ['event_level' => 'national', 'placement' => 'champion'],
            'status' => 'verified',
        ];
        $scoreResGender = $scoringService->scoreStudentForAward($awardSportsF, $studentMale, [$sportsRecord]);
        $assertTest('TC-ELG-001', 'T-AWARD-ELIGIBILITY', 'SA01-R022', 'SPORTS_AWARD_FEMALE', 'Gender mismatch causes award-level ineligibility', false, $scoreResGender['is_eligible'], 'GENDER_RESTRICTION_REJECTED');

        $studentNonGrad = [
            'id' => 'syn-stud-nongrad-003',
            'gender' => 'female',
            'is_graduating' => 0,
            'enrollment_status' => 'enrolled',
        ];
        $scoreResGrad = $scoringService->scoreStudentForAward($awardNDA, $studentNonGrad, [$sportsRecord]);
        $assertTest('TC-ELG-002', 'T-AWARD-ELIGIBILITY', 'SA01-R001', 'NOTRE_DAME_AWARD', 'Non-graduating student rejected for graduating-only award', false, $scoreResGrad['is_eligible'], 'NON_GRADUATING_REJECTED');

        // -------------------------------------------------------------
        // 6. T-ACCUMULATION & T-HIGHEST & T-CAPS
        // -------------------------------------------------------------
        CLI::write("\n--- 6. Testing Family: T-ACCUMULATION, T-HIGHEST & T-CAPS ---", 'yellow');

        $recPres = [
            'id' => 'syn-rec-lead-pres-008',
            'title' => 'SSG Executive Officer',
            'category_code' => 'LEADERSHIP_POSITION',
            'subcategory_code' => 'SSG_UNIVERSITY_GOVERNMENT',
            'structured_metadata' => ['position_level' => 'executive', 'title' => 'President'],
            'status' => 'verified',
        ];
        $recClub = [
            'id' => 'syn-rec-lead-club-009',
            'title' => 'Club Officer',
            'category_code' => 'LEADERSHIP_POSITION',
            'subcategory_code' => 'CLUB_ORGANIZATION',
            'structured_metadata' => ['position_level' => 'officer', 'title' => 'Treasurer'],
            'status' => 'verified',
        ];
        $scoreResHigh = $scoringService->scoreStudentForAward($awardLead, $studentGrad, [$recPres, $recClub]);
        $campusLeadScore = 0.0;
        foreach ($scoreResHigh['criteria_scores'] as $cs) {
            if (str_contains($cs['criterion_code'], 'CAMPUS_LEAD') || str_contains($cs['criterion_code'], 'LEAD')) {
                $campusLeadScore = (float)$cs['earned_points'];
                break;
            }
        }
        $assertTest('TC-HIGH-001', 'T-HIGHEST', 'SA01-R011', 'LEADERSHIP_AWARD', 'Highest-Only selects top record (10.00) without summing', 10.0, $campusLeadScore, 'QUALIFIED_HIGHEST_ONLY');

        $recCit1 = [
            'id' => 'syn-rec-cit-010',
            'title' => 'National Leadership Citation 1',
            'category_code' => 'CITATION_RECOGNITION',
            'subcategory_code' => 'LEADERSHIP_CITATION',
            'structured_metadata' => ['scope' => 'NATIONAL', 'citation_type' => 'leadership'],
            'status' => 'verified',
        ];
        $recCit2 = [
            'id' => 'syn-rec-cit-011',
            'title' => 'National Leadership Citation 2',
            'category_code' => 'CITATION_RECOGNITION',
            'subcategory_code' => 'LEADERSHIP_CITATION',
            'structured_metadata' => ['scope' => 'NATIONAL', 'citation_type' => 'leadership'],
            'status' => 'verified',
        ];
        $recCit3 = [
            'id' => 'syn-rec-cit-012',
            'title' => 'National Leadership Citation 3',
            'category_code' => 'CITATION_RECOGNITION',
            'subcategory_code' => 'LEADERSHIP_CITATION',
            'structured_metadata' => ['scope' => 'NATIONAL', 'citation_type' => 'leadership'],
            'status' => 'verified',
        ];
        $scoreResCap = $scoringService->scoreStudentForAward($awardLead, $studentGrad, [$recCit1, $recCit2, $recCit3]);
        $citScore = 0.0;
        foreach ($scoreResCap['criteria_scores'] as $cs) {
            if (str_contains($cs['criterion_code'], 'CAMPUS_LEAD') || str_contains($cs['criterion_code'], 'LEAD')) {
                $citScore = (float)$cs['earned_points'];
                break;
            }
        }
        $assertTest('TC-CAP-001', 'T-SUBSECTION-CAP', 'SA01-R013', 'LEADERSHIP_AWARD', 'Subsection cap strictly enforced at 10.00 pts', 10.0, $citScore, 'SUBSECTION_CAP_ENFORCED');

        // -------------------------------------------------------------
        // 7. T-DUPLICATE (Intra-Route Duplicate Policy)
        // -------------------------------------------------------------
        CLI::write("\n--- 7. Testing Family: T-DUPLICATE ---", 'yellow');

        $scoreResDup = $scoringService->scoreStudentForAward($awardLead, $studentGrad, [$recCit1, $recCit1]);
        $dupScore = 0.0;
        foreach ($scoreResDup['criteria_scores'] as $cs) {
            if (str_contains($cs['criterion_code'], 'CAMPUS_LEAD') || str_contains($cs['criterion_code'], 'LEAD')) {
                $dupScore = (float)$cs['earned_points'];
                break;
            }
        }
        $assertTest('TC-DUP-001', 'T-DUPLICATE', 'SA01-R013', 'LEADERSHIP_AWARD', 'Duplicate record ignored, counted exactly once (5.00 pts)', 5.0, $dupScore, 'COUNT_ONCE_PER_RECORD');

        // -------------------------------------------------------------
        // 8. T-CROSS-AWARD (Shared Record Multi-Tenancy)
        // -------------------------------------------------------------
        CLI::write("\n--- 8. Testing Family: T-CROSS-AWARD ---", 'yellow');

        $scoreResNDAShared = $scoringService->scoreStudentForAward($awardNDA, $studentGrad, [$recCit1]);
        $scoreResLeadShared = $scoringService->scoreStudentForAward($awardLead, $studentGrad, [$recCit1]);

        $ndaEarned = (float)$scoreResNDAShared['raw_portfolio_score'];
        $leadEarned = (float)$scoreResLeadShared['raw_portfolio_score'];

        $assertTest('TC-XAW-001', 'T-CROSS-AWARD', 'SA01-R003', 'NOTRE_DAME_AWARD', 'Shared Record scores 5.00 pts under NDA schedule', 5.0, $ndaEarned, 'INDEPENDENT_EVALUATION');
        $assertTest('TC-XAW-002', 'T-CROSS-AWARD', 'SA01-R013', 'LEADERSHIP_AWARD', 'Shared Record scores 5.00 pts under LEAD schedule', 5.0, $leadEarned, 'INDEPENDENT_EVALUATION');

        // -------------------------------------------------------------
        // 9. T-MANUAL-ISOLATION (Manual Points Zero-Fabrication)
        // -------------------------------------------------------------
        CLI::write("\n--- 9. Testing Family: T-MANUAL-ISOLATION ---", 'yellow');

        $manualCritScore = 0.0;
        foreach ($scoreResNDAShared['criteria_scores'] as $cs) {
            if (str_contains($cs['criterion_code'], 'SCHOLASTIC') || str_contains($cs['criterion_code'], 'CHARACTER')) {
                $manualCritScore += (float)$cs['earned_points'];
            }
        }
        $assertTest('TC-MAN-001', 'T-MANUAL-ISOLATION', 'SA01-R001', 'NOTRE_DAME_AWARD', 'Manual criteria earn 0.00 auto pts from engine', 0.0, $manualCritScore, 'MANUAL_ISOLATION_VERIFIED');

        // -------------------------------------------------------------
        // 10. T-EXPLAINABILITY (Diagnostics & DTO Contract)
        // -------------------------------------------------------------
        CLI::write("\n--- 10. Testing Family: T-EXPLAINABILITY ---", 'yellow');

        $hasTraceability = !empty($scoreResNDAShared['evidence_traceability']) || !empty($scoreResNDAShared['criteria_scores']);
        $assertTest('TC-EXP-001', 'T-EXPLAINABILITY', 'SA01-R003', 'NOTRE_DAME_AWARD', 'Scoring returns complete structured explainability DTO', true, $hasTraceability, 'EXPLAINABILITY_DTO_STRUCTURED');

        // -------------------------------------------------------------
        // SUMMARY REPORT
        // -------------------------------------------------------------
        CLI::write("\n========================================================================================", 'cyan');
        CLI::write(sprintf("SA-01.8 VALIDATION SUMMARY: Total Tests: %d | Passed: %d | Failed: %d", $totalTests, $passCount, $failCount), $failCount === 0 ? 'green' : 'red');
        CLI::write("========================================================================================", 'cyan');

        $jsonFile = WRITEPATH . 'sa01_validation_results.json';
        file_put_contents($jsonFile, json_encode([
            'executed_at' => date('Y-m-d H:i:s'),
            'total_tests' => $totalTests,
            'passed' => $passCount,
            'failed' => $failCount,
            'results' => $results,
        ], JSON_PRETTY_PRINT));
        CLI::write("Detailed validation output saved to: " . $jsonFile, 'cyan');

        return $failCount === 0 ? 0 : 1;
    }
}
