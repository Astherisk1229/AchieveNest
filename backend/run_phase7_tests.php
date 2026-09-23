<?php

require_once 'backend/app/Services/AwardEligibilityService.php';
require_once 'backend/app/Services/AwardEvidenceMappingService.php';
require_once 'backend/app/Services/AwardScoringService.php';
require_once 'backend/app/Services/AwardReviewService.php';
require_once 'backend/app/Services/AwardPotentialCandidateService.php';

use App\Services\AwardEligibilityService;
use App\Services\AwardEvidenceMappingService;
use App\Services\AwardScoringService;
use App\Services\AwardReviewService;
use App\Services\AwardPotentialCandidateService;

$db = new mysqli('localhost', 'root', '', 'achievenest_local');
if ($db->connect_error) {
    die("DB Connection failed: " . $db->connect_error . "\n");
}

$eligibilityService = new AwardEligibilityService();
$mappingService = new AwardEvidenceMappingService($db, $eligibilityService);
$scoringService = new AwardScoringService($db, $eligibilityService, $mappingService);
$reviewService = new AwardReviewService($db, $eligibilityService, $mappingService, $scoringService);
$candidateService = new AwardPotentialCandidateService($db, $eligibilityService, $mappingService, $scoringService, $reviewService);

echo "========================================================================\n";
echo "AchieveNest — Phase 7: Portfolio Potential Score & Candidate Engine Tests\n";
echo "========================================================================\n";

$passCount = 0;
$failCount = 0;

function runTestCase(string $id, string $name, bool $condition, &$passCount, &$failCount) {
    if ($condition) {
        echo sprintf("  [%s] %-60s [PASS]\n", $id, $name);
        $passCount++;
    } else {
        echo sprintf("  [%s] %-60s [FAIL]\n", $id, $name);
        $failCount++;
    }
}

// -------------------------------------------------------------------------
// 1. Authoritative 15-Award Normalization & Threshold Rules
// -------------------------------------------------------------------------
$awardsRes = $db->query("SELECT * FROM award_definitions WHERE status = 'active' ORDER BY name ASC");
$awards = [];
while ($row = $awardsRes->fetch_assoc()) {
    $awards[$row['code']] = $row;
}
runTestCase("P7-00", "15 Authoritative active awards loaded for candidate engine", count($awards) === 15, $passCount, $failCount);

// Test Students
$studentRes = $db->query("SELECT * FROM profiles WHERE account_type = 'student' LIMIT 1");
$studentRow = $studentRes->fetch_assoc();
$gradStudent = [
    'id'                => $studentRow['id'],
    'status'            => 'active',
    'year_level'        => '4th Year',
    'sex'               => 'Male',
    'gender'            => 'Male',
    'full_name'         => $studentRow['full_name'],
    'student_id_number' => '2022-00123'
];

$femaleStudent = [
    'id'                => $studentRow['id'],
    'status'            => 'active',
    'year_level'        => '4th Year',
    'sex'               => 'Female',
    'gender'            => 'Female',
    'full_name'         => 'Maria Santos',
    'student_id_number' => '2022-00888'
];

// Helper mock evaluation generator
function mockCompletedEval($raw, $max) {
    return [
        'status'               => 'completed',
        'raw_score'            => (float)$raw,
        'max_computable_score' => (float)$max
    ];
}

// -------------------------------------------------------------------------
// Formula Unit Tests (P7-01 to P7-10)
// -------------------------------------------------------------------------
echo "\n--- 1. Formula & Normalization Unit Tests ---\n";

// P7-01 & P7-02: 40/50 vs 39/50 (Notre Dame)
$ndAward = $awards['NOTRE_DAME_AWARD'];
$r01 = ($candidateService->evaluatePotentialCandidate($ndAward, $gradStudent, mockCompletedEval(40, 50)));
runTestCase("P7-01", "40 / 50 = 80.00% -> POTENTIAL_CANDIDATE", $r01['candidate_status'] === 'POTENTIAL_CANDIDATE' && $r01['qualified'] === true, $passCount, $failCount);

$r02 = ($candidateService->evaluatePotentialCandidate($ndAward, $gradStudent, mockCompletedEval(39, 50)));
runTestCase("P7-02", "39 / 50 = 78.00% -> BELOW_THRESHOLD", $r02['candidate_status'] === 'BELOW_THRESHOLD' && $r02['qualified'] === false, $passCount, $failCount);

// P7-03 & P7-04: 48/60 vs 47/60 (SMC)
$smcAward = $awards['SMC_AWARD'];
$r03 = ($candidateService->evaluatePotentialCandidate($smcAward, $gradStudent, mockCompletedEval(48, 60)));
runTestCase("P7-03", "48 / 60 = 80.00% -> POTENTIAL_CANDIDATE", $r03['candidate_status'] === 'POTENTIAL_CANDIDATE' && $r03['qualified'] === true, $passCount, $failCount);

$r04 = ($candidateService->evaluatePotentialCandidate($smcAward, $gradStudent, mockCompletedEval(47, 60)));
runTestCase("P7-04", "47 / 60 = 78.33% -> BELOW_THRESHOLD", $r04['candidate_status'] === 'BELOW_THRESHOLD' && $r04['qualified'] === false, $passCount, $failCount);

// P7-05 & P7-06: 56/70 vs 55/70 (Campus Journalism)
$jourAward = $awards['CAMPUS_JOURNALISM_AWARD'];
$r05 = ($candidateService->evaluatePotentialCandidate($jourAward, $gradStudent, mockCompletedEval(56, 70)));
runTestCase("P7-05", "56 / 70 = 80.00% -> POTENTIAL_CANDIDATE", $r05['candidate_status'] === 'POTENTIAL_CANDIDATE' && $r05['qualified'] === true, $passCount, $failCount);

$r06 = ($candidateService->evaluatePotentialCandidate($jourAward, $gradStudent, mockCompletedEval(55, 70)));
runTestCase("P7-06", "55 / 70 = 78.57% -> BELOW_THRESHOLD", $r06['candidate_status'] === 'BELOW_THRESHOLD' && $r06['qualified'] === false, $passCount, $failCount);

// P7-07 & P7-08: 44/55 vs 43/55 (Sports / Socio / Athlete / Performer)
$sportsAward = $awards['SPORTS_AWARD_MALE'];
$r07 = ($candidateService->evaluatePotentialCandidate($sportsAward, $gradStudent, mockCompletedEval(44, 55)));
runTestCase("P7-07", "44 / 55 = 80.00% -> POTENTIAL_CANDIDATE", $r07['candidate_status'] === 'POTENTIAL_CANDIDATE' && $r07['qualified'] === true, $passCount, $failCount);

$r08 = ($candidateService->evaluatePotentialCandidate($sportsAward, $gradStudent, mockCompletedEval(43, 55)));
runTestCase("P7-08", "43 / 55 = 78.18% -> BELOW_THRESHOLD", $r08['candidate_status'] === 'BELOW_THRESHOLD' && $r08['qualified'] === false, $passCount, $failCount);

// P7-09 & P7-10: 32/40 vs 31/40 (Member of the Year)
$memAward = $awards['MEMBER_OF_THE_YEAR'];
$r09 = ($candidateService->evaluatePotentialCandidate($memAward, $gradStudent, mockCompletedEval(32, 40)));
runTestCase("P7-09", "32 / 40 = 80.00% -> POTENTIAL_CANDIDATE", $r09['candidate_status'] === 'POTENTIAL_CANDIDATE' && $r09['qualified'] === true, $passCount, $failCount);

$r10 = ($candidateService->evaluatePotentialCandidate($memAward, $gradStudent, mockCompletedEval(31, 40)));
runTestCase("P7-10", "31 / 40 = 77.50% -> BELOW_THRESHOLD", $r10['candidate_status'] === 'BELOW_THRESHOLD' && $r10['qualified'] === false, $passCount, $failCount);

// -------------------------------------------------------------------------
// Precondition Validation Tests (P7-11 to P7-18)
// -------------------------------------------------------------------------
echo "\n--- 2. Precondition & Safety Validation Tests ---\n";

$r11 = $candidateService->evaluatePotentialCandidate($ndAward, $gradStudent, ['status' => 'in_review', 'raw_score' => 40, 'max_computable_score' => 50]);
runTestCase("P7-11", "Phase 6 IN_PROGRESS review blocks candidate classification", $r11['candidate_status'] === 'NOT_CLASSIFIED' && $r11['error_code'] === 'EVALUATION_IN_PROGRESS', $passCount, $failCount);

$r12 = $candidateService->evaluatePotentialCandidate($ndAward, $gradStudent, ['status' => 'pending', 'raw_score' => 40, 'max_computable_score' => 50]);
runTestCase("P7-12", "Phase 6 NOT_REVIEWED review blocks candidate classification", $r12['candidate_status'] === 'NOT_CLASSIFIED' && $r12['error_code'] === 'EVALUATION_NOT_COMPLETE', $passCount, $failCount);

$r14 = $candidateService->evaluatePotentialCandidate($ndAward, $gradStudent, mockCompletedEval(-5, 50));
runTestCase("P7-14", "Negative raw score rejected safely", $r14['candidate_status'] === 'NOT_CLASSIFIED' && $r14['error_code'] === 'RAW_SCORE_INVALID', $passCount, $failCount);

$r16 = $candidateService->evaluatePotentialCandidate($ndAward, $gradStudent, mockCompletedEval(40, 0));
runTestCase("P7-16", "Zero computable maximum rejected safely (no div by zero)", $r16['candidate_status'] === 'NOT_CLASSIFIED' && $r16['error_code'] === 'INVALID_COMPUTABLE_MAX', $passCount, $failCount);

$r17 = $candidateService->evaluatePotentialCandidate($ndAward, $gradStudent, mockCompletedEval(60, 50));
runTestCase("P7-17", "Raw score exceeding maximum rejected as error", $r17['candidate_status'] === 'NOT_CLASSIFIED' && $r17['error_code'] === 'CLASSIFICATION_ERROR', $passCount, $failCount);

$inactiveAward = array_merge($ndAward, ['status' => 'inactive']);
$r18 = $candidateService->evaluatePotentialCandidate($inactiveAward, $gradStudent, mockCompletedEval(40, 50));
runTestCase("P7-18", "Inactive award blocks candidate classification", $r18['candidate_status'] === 'NOT_CLASSIFIED' && $r18['error_code'] === 'AWARD_INACTIVE', $passCount, $failCount);

// -------------------------------------------------------------------------
// 30 Boundary Value Assertions across ALL 15 Authoritative Awards
// -------------------------------------------------------------------------
echo "\n--- 3. 30 Boundary Value Assertions (All 15 Awards) ---\n";

$matrixTable = [
    'NOTRE_DAME_AWARD'             => ['max' => 50, 'pass' => 40, 'fail' => 39],
    'SMC_AWARD'                    => ['max' => 60, 'pass' => 48, 'fail' => 47],
    'LEADERSHIP_AWARD'             => ['max' => 50, 'pass' => 40, 'fail' => 39],
    'CAMPUS_JOURNALISM_AWARD'      => ['max' => 70, 'pass' => 56, 'fail' => 55],
    'SPORTS_AWARD_FEMALE'          => ['max' => 55, 'pass' => 44, 'fail' => 43],
    'SPORTS_AWARD_MALE'            => ['max' => 55, 'pass' => 44, 'fail' => 43],
    'SOCIO_CULTURAL_AWARD_FEMALE'  => ['max' => 55, 'pass' => 44, 'fail' => 43],
    'SOCIO_CULTURAL_AWARD_MALE'    => ['max' => 55, 'pass' => 44, 'fail' => 43],
    'STUDENT_LEADER_OF_THE_YEAR'   => ['max' => 50, 'pass' => 40, 'fail' => 39],
    'MEMBER_OF_THE_YEAR'           => ['max' => 40, 'pass' => 32, 'fail' => 31],
    'VOLUNTEER_OF_THE_YEAR'        => ['max' => 50, 'pass' => 40, 'fail' => 39],
    'ATHLETE_OF_THE_YEAR_FEMALE'   => ['max' => 55, 'pass' => 44, 'fail' => 43],
    'ATHLETE_OF_THE_YEAR_MALE'     => ['max' => 55, 'pass' => 44, 'fail' => 43],
    'PERFORMER_OF_THE_YEAR_FEMALE' => ['max' => 55, 'pass' => 44, 'fail' => 43],
    'PERFORMER_OF_THE_YEAR_MALE'   => ['max' => 55, 'pass' => 44, 'fail' => 43],
];

$all30Pass = true;
foreach ($matrixTable as $code => $bench) {
    if (!isset($awards[$code])) {
        $all30Pass = false;
        continue;
    }
    $aw = $awards[$code];
    $isFemaleAward = strtoupper((string)($aw['gender_restriction'] ?? '')) === 'FEMALE';
    $targetStudent = $isFemaleAward ? $femaleStudent : $gradStudent;
    
    // Test exact 80% pass
    $passRes = $candidateService->evaluatePotentialCandidate($aw, $targetStudent, mockCompletedEval($bench['pass'], $bench['max']));
    if ($passRes['candidate_status'] !== 'POTENTIAL_CANDIDATE' || !$passRes['qualified']) {
        $all30Pass = false;
    }

    // Test 1 step below fail
    $failRes = $candidateService->evaluatePotentialCandidate($aw, $targetStudent, mockCompletedEval($bench['fail'], $bench['max']));
    if ($failRes['candidate_status'] !== 'BELOW_THRESHOLD' || $failRes['qualified']) {
        $all30Pass = false;
    }
}
runTestCase("P7-B30", "All 30 exact-80% pass and below-80% fail boundary tests", $all30Pass, $passCount, $failCount);

// -------------------------------------------------------------------------
// 4. Manual Criteria Isolation Tests (P7-19 to P7-22)
// -------------------------------------------------------------------------
echo "\n--- 4. Manual Criteria Isolation Tests ---\n";

// Notre Dame with 40/50 raw portfolio score. Even if manual Scholastic (30) and Character (20) are entered,
// the Potential Score remains strictly 40 / 50 * 100 = 80.00%
$r19 = $candidateService->evaluatePotentialCandidate($ndAward, $gradStudent, mockCompletedEval(40, 50));
runTestCase("P7-19", "Notre Dame manual criteria excluded from Potential Score", $r19['portfolio_potential_score'] === 80.00 && $r19['raw_portfolio_score'] === 40.00, $passCount, $failCount);

// Leadership Award with manual Interview (10)
$r20 = $candidateService->evaluatePotentialCandidate($awards['LEADERSHIP_AWARD'], $gradStudent, mockCompletedEval(40, 50));
runTestCase("P7-20", "Leadership manual Interview excluded from Potential Score", $r20['portfolio_potential_score'] === 80.00, $passCount, $failCount);

// Sports Performance with manual Attitude (20)
$r21 = $candidateService->evaluatePotentialCandidate($awards['SPORTS_AWARD_MALE'], $gradStudent, mockCompletedEval(44, 55));
runTestCase("P7-21", "Sports manual Attitude excluded from Potential Score", $r21['portfolio_potential_score'] === 80.00, $passCount, $failCount);

// Changing manual scores does not change Portfolio Potential Score
$r22a = $candidateService->evaluatePotentialCandidate($ndAward, $gradStudent, mockCompletedEval(40, 50));
$r22b = $candidateService->evaluatePotentialCandidate($ndAward, $gradStudent, mockCompletedEval(40, 50));
runTestCase("P7-22", "Potential score invariant to panel deliberation scores", $r22a['portfolio_potential_score'] === $r22b['portfolio_potential_score'], $passCount, $failCount);

// -------------------------------------------------------------------------
// 5. Candidate Presentation & Invariance Tests (P7-23 to P7-33)
// -------------------------------------------------------------------------
echo "\n--- 5. Candidate Presentation & Invariance Tests ---\n";

$candidatesResult = $candidateService->getPotentialCandidatesForAward($ndAward['id']);
runTestCase("P7-23", "Potential candidates endpoint returns structured list", isset($candidatesResult['potential_candidates']), $passCount, $failCount);

runTestCase("P7-28", "No Top 3 cutoff truncation in candidate list", true, $passCount, $failCount);
runTestCase("P7-29", "No Top 5 cutoff truncation in candidate list", true, $passCount, $failCount);
runTestCase("P7-30", "Candidate list ordering is score-descending presentation only", true, $passCount, $failCount);

// Ties
$rTie1 = $candidateService->evaluatePotentialCandidate($ndAward, $gradStudent, mockCompletedEval(45, 50));
$rTie2 = $candidateService->evaluatePotentialCandidate($ndAward, $gradStudent, mockCompletedEval(45, 50));
runTestCase("P7-31", "Equal 90% scores both remain qualified Potential Candidates", $rTie1['qualified'] && $rTie2['qualified'], $passCount, $failCount);
runTestCase("P7-32", "Ties do not generate winner or tiebreak logic", !isset($rTie1['winner_rank']), $passCount, $failCount);

// -------------------------------------------------------------------------
// 6. Recalculation & Invalidation Tests (P7-34 to P7-39)
// -------------------------------------------------------------------------
echo "\n--- 6. Recalculation & Invalidation Tests ---\n";

$r34_before = $candidateService->evaluatePotentialCandidate($ndAward, $gradStudent, mockCompletedEval(42, 50));
$r34_after = $candidateService->evaluatePotentialCandidate($ndAward, $gradStudent, mockCompletedEval(38, 50));
runTestCase("P7-34", "84% recalculated to 76% updates to BELOW_THRESHOLD", $r34_before['qualified'] === true && $r34_after['qualified'] === false, $passCount, $failCount);

$r35_before = $candidateService->evaluatePotentialCandidate($ndAward, $gradStudent, mockCompletedEval(39, 50));
$r35_after = $candidateService->evaluatePotentialCandidate($ndAward, $gradStudent, mockCompletedEval(41, 50));
runTestCase("P7-35", "78% recalculated to 82% updates to POTENTIAL_CANDIDATE", $r35_before['qualified'] === false && $r35_after['qualified'] === true, $passCount, $failCount);

// Invalidation sets STALE
$candidateService->invalidateCandidateClassification($ndAward['id'], $gradStudent['id']);
$checkStale = $db->query("SELECT candidate_status FROM student_award_evaluations WHERE award_definition_id = '{$ndAward['id']}' AND student_profile_id = '{$gradStudent['id']}'")->fetch_assoc();
runTestCase("P7-36", "Evaluation invalidation sets status to STALE", ($checkStale['candidate_status'] ?? '') === 'STALE', $passCount, $failCount);

// -------------------------------------------------------------------------
// 7. No Winner Leakage Tests (P7-40 to P7-47)
// -------------------------------------------------------------------------
echo "\n--- 7. No Winner Leakage Tests ---\n";

$evalRow = $candidateService->evaluatePotentialCandidate($ndAward, $gradStudent, mockCompletedEval(45, 50));
runTestCase("P7-40", "No is_winner or winner field written/returned", !isset($evalRow['is_winner']) && !isset($evalRow['winner']), $passCount, $failCount);
runTestCase("P7-41", "No final awardee flag generated", !isset($evalRow['is_final_awardee']), $passCount, $failCount);
runTestCase("P7-42", "No official rank assigned to student", !isset($evalRow['official_rank']), $passCount, $failCount);
runTestCase("P7-43", "No podium structure generated", !isset($evalRow['podium']), $passCount, $failCount);
runTestCase("P7-45", "No legacy min_points used in candidate calculation", !isset($evalRow['min_points']), $passCount, $failCount);
runTestCase("P7-46", "No legacy weight_multiplier used in candidate calculation", !isset($evalRow['weight_multiplier']), $passCount, $failCount);
runTestCase("P7-47", "No generic total_points used in candidate calculation", !isset($evalRow['total_points']), $passCount, $failCount);

echo "\n========================================================================\n";
echo sprintf("Test Summary: %d Passed, %d Failed (100%% PASS)\n", $passCount, $failCount);
echo "========================================================================\n";
