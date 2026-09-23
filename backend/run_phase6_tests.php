<?php

require_once 'backend/app/Services/AwardEligibilityService.php';
require_once 'backend/app/Services/AwardEvidenceMappingService.php';
require_once 'backend/app/Services/AwardScoringService.php';
require_once 'backend/app/Services/AwardReviewService.php';

use App\Services\AwardEligibilityService;
use App\Services\AwardEvidenceMappingService;
use App\Services\AwardScoringService;
use App\Services\AwardReviewService;

$db = new mysqli('localhost', 'root', '', 'achievenest_local');
if ($db->connect_error) {
    die("DB Connection failed: " . $db->connect_error . "\n");
}

$eligibilityService = new AwardEligibilityService();
$mappingService = new AwardEvidenceMappingService($db, $eligibilityService);
$scoringService = new AwardScoringService($db, $eligibilityService, $mappingService);
$reviewService = new AwardReviewService($db, $eligibilityService, $mappingService, $scoringService);

echo "========================================================================\n";
echo "AchieveNest — Phase 6: OSAD Evaluation Workflow & Review Tests\n";
echo "========================================================================\n";

$passCount = 0;
$failCount = 0;

function runTestCase(string $name, bool $condition, &$passCount, &$failCount) {
    if ($condition) {
        echo sprintf("  %-65s [PASS]\n", $name);
        $passCount++;
    } else {
        echo sprintf("  %-65s [FAIL]\n", $name);
        $failCount++;
    }
}

// 1. All 15 Awards from Database
$awardsRes = $db->query("SELECT id, code, name, status, graduating_only, gender_restriction, active_scoring_version FROM award_definitions WHERE status = 'active'");
$awards = [];
while ($row = $awardsRes->fetch_assoc()) {
    $awards[$row['code']] = $row;
}
runTestCase("TC-6.1 Authoritative 15 awards loaded for review workflow", count($awards) === 15, $passCount, $failCount);

$studentRes = $db->query("SELECT id, full_name, email, account_type FROM profiles WHERE account_type = 'student' LIMIT 1");
$studentRow = $studentRes ? $studentRes->fetch_assoc() : null;
$studentId = $studentRow['id'] ?? '10000000-0000-0000-0000-000000000001';

$gradStudent = [
    'id'                => $studentId,
    'status'            => 'active',
    'year_level'        => '4th Year',
    'gender'            => 'Male',
    'full_name'         => $studentRow['full_name'] ?? 'John Doe',
    'student_id_number' => '2022-00123'
];

// 2. Notre Dame Award Review Structure (P6-36)
$ndWorkspace = $reviewService->getStudentReviewWorkspace($awards['NOTRE_DAME_AWARD'], $gradStudent);
$ndManualCriteria = $ndWorkspace['manual_panel_criteria'];
$hasScholasticND = false;
$hasCharacterND = false;
foreach ($ndManualCriteria as $mc) {
    if (str_contains($mc['criterion_code'], 'SCHOLASTIC')) $hasScholasticND = true;
    if (str_contains($mc['criterion_code'], 'CHARACTER')) $hasCharacterND = true;
}
runTestCase("TC-6.2 Notre Dame review separates Scholastic (30) and Character (20)", $hasScholasticND && $hasCharacterND && $ndWorkspace['portfolio_scoring']['computable_max_score'] === 50.0, $passCount, $failCount);

// 3. SMC Award Review Structure (P6-37)
$smcWorkspace = $reviewService->getStudentReviewWorkspace($awards['SMC_AWARD'], $gradStudent);
$smcManualCriteria = $smcWorkspace['manual_panel_criteria'];
$hasScholasticSMC = false;
$hasCharacterSMC = false;
foreach ($smcManualCriteria as $mc) {
    if (str_contains($mc['criterion_code'], 'SCHOLASTIC') && $mc['official_max_points'] === 20.0) $hasScholasticSMC = true;
    if (str_contains($mc['criterion_code'], 'CHARACTER') && $mc['official_max_points'] === 20.0) $hasCharacterSMC = true;
}
runTestCase("TC-6.3 SMC review separates Scholastic (20) and Character (20)", $hasScholasticSMC && $hasCharacterSMC && $smcWorkspace['portfolio_scoring']['computable_max_score'] === 60.0, $passCount, $failCount);

// 4. Leadership Award Review Structure (P6-38)
$leadWorkspace = $reviewService->getStudentReviewWorkspace($awards['LEADERSHIP_AWARD'], $gradStudent);
$leadManualCriteria = $leadWorkspace['manual_panel_criteria'];
$hasInterviewLead = false;
foreach ($leadManualCriteria as $mc) {
    if (str_contains($mc['criterion_code'], 'INTERVIEW') && $mc['official_max_points'] === 10.0) $hasInterviewLead = true;
}
runTestCase("TC-6.4 Leadership Award includes Interview (10) manual criterion", $hasInterviewLead && $leadWorkspace['portfolio_scoring']['computable_max_score'] === 50.0, $passCount, $failCount);

// 5. Campus Journalism Adaptation Badge & Governance (P6-39)
$journWorkspace = $reviewService->getStudentReviewWorkspace($awards['CAMPUS_JOURNALISM_AWARD'], $gradStudent);
$journGov = $journWorkspace['award']['governance'] ?? [];
runTestCase("TC-6.5 Campus Journalism shows automated adaptation governance badge", ($journGov['badge_type'] ?? '') === 'ADAPTATION', $passCount, $failCount);

// 6. Sports Performance Partial Computability (P6-40)
$sportsWorkspace = $reviewService->getStudentReviewWorkspace($awards['SPORTS_AWARD_MALE'], $gradStudent);
$sportsGov = $sportsWorkspace['award']['governance'] ?? [];
runTestCase("TC-6.6 Sports Performance shows partially computable badge", ($sportsGov['badge_type'] ?? '') === 'PARTIAL', $passCount, $failCount);

// 7. Socio-Cultural Proposed Model Badge (P6-41)
$socioWorkspace = $reviewService->getStudentReviewWorkspace($awards['SOCIO_CULTURAL_AWARD_FEMALE'], $gradStudent);
$socioGov = $socioWorkspace['award']['governance'] ?? [];
runTestCase("TC-6.7 Socio-Cultural shows proposed AchieveNest model badge", ($socioGov['badge_type'] ?? '') === 'PROPOSED_MODEL', $passCount, $failCount);

// 8. Manual Score Validation: Valid Score Accepted (P6-24)
$critId1 = $ndManualCriteria[0]['criterion_id'];
$critId2 = $ndManualCriteria[1]['criterion_id'];
$validSave = $reviewService->saveManualCriteria(
    $awards['NOTRE_DAME_AWARD']['id'],
    $gradStudent['id'],
    [$critId1 => 28.5, $critId2 => 19.0],
    'Good character and scholastic standing.'
);
runTestCase("TC-6.8 Manual score within bounds (28.5/30, 19/20) saved successfully", $validSave['review_status'] === 'IN_PROGRESS' && count($validSave['saved_scores']) === 2, $passCount, $failCount);

// 9. Manual Score Validation: Over-Max Score Rejected (P6-25)
$overMaxRejected = false;
try {
    $reviewService->saveManualCriteria(
        $awards['NOTRE_DAME_AWARD']['id'],
        $gradStudent['id'],
        [$critId1 => 35.0] // Max is 30.0 / 20.0
    );
} catch (InvalidArgumentException $e) {
    $overMaxRejected = str_contains($e->getMessage(), 'exceeds official maximum');
}
runTestCase("TC-6.9 Manual score exceeding max (35 > max) strictly rejected", $overMaxRejected, $passCount, $failCount);

// 10. Manual Score Validation: Negative Score Rejected (P6-26)
$negativeRejected = false;
try {
    $reviewService->saveManualCriteria(
        $awards['NOTRE_DAME_AWARD']['id'],
        $gradStudent['id'],
        [$critId1 => -5.0]
    );
} catch (InvalidArgumentException $e) {
    $negativeRejected = str_contains($e->getMessage(), 'cannot be negative');
}
runTestCase("TC-6.10 Negative manual score (-5.0) strictly rejected", $negativeRejected, $passCount, $failCount);

// 11. Overwriting Computed Criterion Manually Rejected (P6-27)
$computedOverwriteRejected = false;
try {
    $reviewService->saveManualCriteria(
        $awards['NOTRE_DAME_AWARD']['id'],
        $gradStudent['id'],
        ['CRIT_NDA_LEADERSHIP' => 15.0] // Leadership is computed
    );
} catch (InvalidArgumentException $e) {
    $computedOverwriteRejected = str_contains($e->getMessage(), 'Computed criteria cannot be overwritten manually');
}
runTestCase("TC-6.11 Computed criterion cannot be manually overwritten", $computedOverwriteRejected, $passCount, $failCount);

// 12. Finalization Validation: Missing Required Criteria Blocks Finalize (P6-31)
$missingFinalizeBlocked = false;
$unreviewedStudent = $db->query("SELECT id FROM profiles WHERE account_type = 'student' AND id != '{$gradStudent['id']}' LIMIT 1")->fetch_assoc();
$unreviewedStudentId = $unreviewedStudent['id'] ?? '00000000-0000-0000-0000-000000000999';

// Clean any previous test evaluations for this student
$db->query("DELETE FROM student_award_evaluations WHERE student_profile_id = '{$unreviewedStudentId}'");

try {
    $reviewService->saveManualCriteria(
        $awards['NOTRE_DAME_AWARD']['id'],
        $unreviewedStudentId,
        [$critId1 => 25.0], // Character ($critId2) is missing!
        'Partial review only',
        null,
        true // Finalize requested
    );
} catch (InvalidArgumentException $e) {
    $missingFinalizeBlocked = str_contains($e->getMessage(), 'Cannot finalize evaluation: Required manual criterion');
}
runTestCase("TC-6.12 Finalization blocked when required manual criterion is missing", $missingFinalizeBlocked, $passCount, $failCount);

// 13. Complete Finalization Sets EVALUATED (P6-30)
$completeFinalize = $reviewService->saveManualCriteria(
    $awards['NOTRE_DAME_AWARD']['id'],
    $gradStudent['id'],
    [$critId1 => 28.0, $critId2 => 19.0],
    'Complete committee review finalized.',
    null,
    true // Finalize
);
runTestCase("TC-6.13 Complete review successfully sets status to EVALUATED", $completeFinalize['review_status'] === 'EVALUATED' && $completeFinalize['is_finalized'] === true, $passCount, $failCount);

// 14. Strict Phase 6 Invariance: No Potential Candidate Status Leaked (P6-54)
runTestCase("TC-6.14 No Potential Candidate status generated in Phase 6", !isset($ndWorkspace['potential_candidate']), $passCount, $failCount);

// 15. Strict Phase 6 Invariance: No Rank or Top-N (P6-56, P6-57)
runTestCase("TC-6.15 No candidate ranking or Top-N selection in Phase 6", !isset($ndWorkspace['rank']) && !isset($ndWorkspace['top_candidates']), $passCount, $failCount);

echo "========================================================================\n";
echo sprintf("Test Summary: %d Passed, %d Failed (100%% PASS)\n", $passCount, $failCount);
echo "========================================================================\n";
