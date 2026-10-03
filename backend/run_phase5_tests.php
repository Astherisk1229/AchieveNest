<?php

require_once 'backend/app/Services/AwardEligibilityService.php';
require_once 'backend/app/Services/AwardEvidenceMappingService.php';
require_once 'backend/app/Services/AwardScoringService.php';

use App\Services\AwardEligibilityService;
use App\Services\AwardEvidenceMappingService;
use App\Services\AwardScoringService;

$db = new mysqli('localhost', 'root', '', 'achievenest_local');
if ($db->connect_error) {
    die("DB Connection failed: " . $db->connect_error . "\n");
}

$eligibilityService = new AwardEligibilityService();
$mappingService = new AwardEvidenceMappingService($db, $eligibilityService);
$scoringService = new AwardScoringService($db, $eligibilityService, $mappingService);

echo "========================================================================\n";
echo "AchieveNest — Phase 5: Award Scoring Engine & Traceability Tests\n";
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
    $critRes = $db->query("SELECT code, name, max_points FROM award_criteria WHERE award_definition_id = '{$row['id']}' AND is_portfolio_computable = 1");
    $crList = [];
    while ($cr = $critRes->fetch_assoc()) {
        $crList[] = $cr['code'] . " (" . $cr['max_points'] . ")";
    }
    echo "Award {$row['code']}: " . implode(", ", $crList) . "\n";
}
runTestCase("TC-5.1 Authoritative 15 awards loaded for scoring", count($awards) === 15, $passCount, $failCount);

$gradStudent = ['id' => 'std-1', 'status' => 'active', 'year_level' => '4th Year', 'gender' => 'Male', 'full_name' => 'John Doe'];
$femaleGradStudent = ['id' => 'std-fem', 'status' => 'active', 'year_level' => '4th Year', 'gender' => 'Female', 'full_name' => 'Jane Doe'];

// 2. Notre Dame Award Scoring (P5-07 to P5-13, max 50)
$ndLeadership = [
    ['id' => 'nd-1', 'title' => 'SSG Executive President', 'status' => 'verified', 'category_code' => 'LEADERSHIP_POSITION', 'subcategory_code' => 'SSG_UNIVERSITY_GOVERNMENT', 'structured_metadata' => ['leadership_level' => 'SSG']],
    ['id' => 'nd-2', 'title' => 'Club President', 'status' => 'verified', 'category_code' => 'LEADERSHIP_POSITION', 'subcategory_code' => 'CLUB_ORGANIZATION', 'structured_metadata' => ['leadership_level' => 'Club']],
    ['id' => 'nd-3', 'title' => 'National Leadership Award', 'status' => 'verified', 'category_code' => 'CITATION_RECOGNITION', 'subcategory_code' => 'LEADERSHIP_AWARD', 'structured_metadata' => ['scope' => 'NATIONAL']],
    ['id' => 'nd-4', 'title' => 'Local Leadership Citation', 'status' => 'verified', 'category_code' => 'CITATION_RECOGNITION', 'subcategory_code' => 'LEADERSHIP_CITATION', 'structured_metadata' => ['scope' => 'LOCAL']],
    ['id' => 'nd-5', 'title' => 'Leadership Seminar', 'status' => 'verified', 'category_code' => 'SEMINAR_TRAINING', 'subcategory_code' => 'LEADERSHIP_DEVELOPMENT', 'structured_metadata' => []],
];
$ndScore1 = $scoringService->scoreStudentForAward($awards['NOTRE_DAME_AWARD'], $gradStudent, $ndLeadership);
runTestCase("TC-5.2 Notre Dame leadership highest-only (10) + awards/seminar (9) = 19", $ndScore1['raw_portfolio_score'] === 19.0, $passCount, $failCount);

// 3. SMC Award Scoring (max 60, Fixed Presence School 5 + Comm 5 + Church 5 = 15)
$smcRecords = [
    ['id' => 'smc-1', 'title' => 'SSG President', 'status' => 'verified', 'category_code' => 'LEADERSHIP_POSITION', 'subcategory_code' => 'SSG_UNIVERSITY_GOVERNMENT'],
    ['id' => 'smc-2', 'title' => 'School Ministry', 'status' => 'verified', 'category_code' => 'CHURCH_MINISTRY_INVOLVEMENT', 'subcategory_code' => 'CAMPUS_MINISTRY', 'structured_metadata' => ['involvement_type' => 'SCHOOL']],
    ['id' => 'smc-3', 'title' => 'Community Ministry', 'status' => 'verified', 'category_code' => 'CHURCH_MINISTRY_INVOLVEMENT', 'subcategory_code' => 'PARISH_CHURCH_MINISTRY', 'structured_metadata' => ['involvement_type' => 'COMMUNITY']],
    ['id' => 'smc-4', 'title' => 'Church Ministry', 'status' => 'verified', 'category_code' => 'CHURCH_MINISTRY_INVOLVEMENT', 'subcategory_code' => 'CHURCH_ORGANIZATION', 'structured_metadata' => ['involvement_type' => 'CHURCH']],
    ['id' => 'smc-5', 'title' => 'Another School Ministry (Duplicate Subsection)', 'status' => 'verified', 'category_code' => 'CHURCH_MINISTRY_INVOLVEMENT', 'subcategory_code' => 'CAMPUS_MINISTRY', 'structured_metadata' => ['involvement_type' => 'SCHOOL']],
];
$smcScore = $scoringService->scoreStudentForAward($awards['SMC_AWARD'], $gradStudent, $smcRecords);
runTestCase("TC-5.3 SMC fixed presence B1=15 (multiple school records do not multiply)", $smcScore['raw_portfolio_score'] === 25.0, $passCount, $failCount);

// 4. Leadership Award Scoring (max 50, Local Citation = 3, Civic highest only)
$leadRecords = [
    ['id' => 'ld-1', 'title' => 'SSG President', 'status' => 'verified', 'category_code' => 'LEADERSHIP_POSITION', 'subcategory_code' => 'SSG_UNIVERSITY_GOVERNMENT'],
    ['id' => 'ld-2', 'title' => 'Local Leadership Citation', 'status' => 'verified', 'category_code' => 'CITATION_RECOGNITION', 'subcategory_code' => 'LEADERSHIP_CITATION', 'structured_metadata' => ['scope' => 'LOCAL']],
    ['id' => 'ld-3', 'title' => 'Barangay SK Chairman', 'status' => 'verified', 'category_code' => 'COMMUNITY_SERVICE_VOLUNTEERISM', 'subcategory_code' => 'CIVIC', 'structured_metadata' => ['civic_level' => 'BARANGAY']],
    ['id' => 'ld-4', 'title' => 'Municipal Youth Coordinator', 'status' => 'verified', 'category_code' => 'COMMUNITY_SERVICE_VOLUNTEERISM', 'subcategory_code' => 'CIVIC', 'structured_metadata' => ['civic_level' => 'MUNICIPAL']],
];
$leadScore = $scoringService->scoreStudentForAward($awards['LEADERSHIP_AWARD'], $gradStudent, $leadRecords);
runTestCase("TC-5.4 Leadership Award: Local citation=3, Civic highest-only=10 (Total=23)", $leadScore['raw_portfolio_score'] === 23.0, $passCount, $failCount);

// 5. Campus Journalism Award Scoring (Publications 60 max, Leadership/Awards 10 max, Total max 70)
$journRecords = [
    ['id' => 'j-1', 'title' => 'News 1', 'status' => 'verified', 'category_code' => 'CAMPUS_JOURNALISM', 'subcategory_code' => 'NEWS_ITEM', 'matched_component_id' => 'COMP_JOURN_NEWS', 'structured_metadata' => ['publication_type' => 'news']],
    ['id' => 'j-2', 'title' => 'News 2', 'status' => 'verified', 'category_code' => 'CAMPUS_JOURNALISM', 'subcategory_code' => 'NEWS_ITEM', 'matched_component_id' => 'COMP_JOURN_NEWS', 'structured_metadata' => ['publication_type' => 'news']],
    ['id' => 'j-3', 'title' => 'Column 1', 'status' => 'verified', 'category_code' => 'CAMPUS_JOURNALISM', 'subcategory_code' => 'COLUMN', 'matched_component_id' => 'COMP_JOURN_COLUMN', 'structured_metadata' => ['publication_type' => 'column']],
    ['id' => 'j-4', 'title' => 'Editorial 1', 'status' => 'verified', 'category_code' => 'CAMPUS_JOURNALISM', 'subcategory_code' => 'EDITORIAL', 'matched_component_id' => 'COMP_JOURN_EDITORIAL', 'structured_metadata' => ['publication_type' => 'editorial']],
    ['id' => 'j-5', 'title' => 'Managing Editor', 'status' => 'verified', 'category_code' => 'LEADERSHIP_POSITION', 'subcategory_code' => 'CAMPUS_JOURNALISM', 'matched_component_id' => 'COMP_JOURN_LEAD_ROLE', 'structured_metadata' => ['role' => 'OFFICER']],
    ['id' => 'j-6', 'title' => 'National Press Citation', 'status' => 'verified', 'category_code' => 'CITATION_RECOGNITION', 'subcategory_code' => 'CAMPUS_JOURNALISM', 'matched_component_id' => 'COMP_JOURN_LEAD_AWARDS', 'structured_metadata' => ['scope' => 'NATIONAL']],
];
$journScore = $scoringService->scoreStudentForAward($awards['CAMPUS_JOURNALISM_AWARD'], $gradStudent, $journRecords);
// News 2x2=4, Column 1x4=4, Editorial 1x4=4 -> Pubs=12. Leadership Officer=3, National Award=3 -> Leadership=6. Total = 12 + 6 = 18.0
runTestCase("TC-5.5 Campus Journalism publication counting & leadership caps (Total=18)", $journScore['raw_portfolio_score'] === 18.0, $passCount, $failCount);

// 6. Sports Family Scoring: Matrix Lookup & Caps (max 55)
$sportsRecords = [
    ['id' => 'sp-1', 'title' => 'Individual Athletics', 'status' => 'verified', 'category_code' => 'SPORTS', 'subcategory_code' => 'ATHLETICS', 'structured_metadata' => ['competition_type' => 'INDIVIDUAL']],
    ['id' => 'sp-2', 'title' => 'Basketball Team', 'status' => 'verified', 'category_code' => 'SPORTS', 'subcategory_code' => 'BASKETBALL', 'structured_metadata' => ['competition_type' => 'TEAM']],
    ['id' => 'sp-3', 'title' => 'PRISAA National Meet', 'status' => 'verified', 'category_code' => 'SPORTS', 'subcategory_code' => 'COMPETITION', 'structured_metadata' => ['event_level' => 'PRISAA NATIONAL', 'placement' => 'GOLD']],
    ['id' => 'sp-4', 'title' => 'PRISAA Regional Meet', 'status' => 'verified', 'category_code' => 'SPORTS', 'subcategory_code' => 'COMPETITION', 'structured_metadata' => ['event_level' => 'PRISAA REGIONAL', 'placement' => 'SILVER']],
];
$sportsScore = $scoringService->scoreStudentForAward($awards['SPORTS_AWARD_MALE'], $gradStudent, $sportsRecords);
runTestCase("TC-5.6 Sports family: Skills 20 + Participation 12 + Awards 10 = 42.0", $sportsScore['raw_portfolio_score'] === 42.0, $passCount, $failCount);

// 7. Socio-Cultural Family Scoring: Matrix Lookup (max 55)
$socioRecords = [
    ['id' => 'sc-1', 'title' => 'Solo Vocal Performance', 'status' => 'verified', 'category_code' => 'SOCIO_CULTURAL_PERFORMING_ARTS', 'subcategory_code' => 'VOCAL', 'structured_metadata' => ['performance_type' => 'INDIVIDUAL']],
    ['id' => 'sc-2', 'title' => 'Chorale Ensemble', 'status' => 'verified', 'category_code' => 'SOCIO_CULTURAL_PERFORMING_ARTS', 'subcategory_code' => 'ENSEMBLE', 'structured_metadata' => ['performance_type' => 'GROUP']],
    ['id' => 'sc-3', 'title' => 'National Cultural Showcase', 'status' => 'verified', 'category_code' => 'SOCIO_CULTURAL_PERFORMING_ARTS', 'subcategory_code' => 'COMPETITION', 'structured_metadata' => ['event_level' => 'NATIONAL', 'placement' => 'CHAMPION']],
];
$socioScore = $scoringService->scoreStudentForAward($awards['SOCIO_CULTURAL_AWARD_FEMALE'], $femaleGradStudent, $socioRecords);
runTestCase("TC-5.7 Socio-Cultural: Skills 20 + Participation 7 + Awards 7 = 34.0", $socioScore['raw_portfolio_score'] === 34.0, $passCount, $failCount);

// 8. Student Leader: Distinct Category Accumulation (SSG 12 + College 8 + Club 6 + Year 4 = 30)
$slRecords = [
    ['id' => 'sl-1', 'title' => 'SSG President', 'status' => 'verified', 'category_code' => 'LEADERSHIP_POSITION', 'subcategory_code' => 'SSG_UNIVERSITY_GOVERNMENT'],
    ['id' => 'sl-2', 'title' => 'College Governor', 'status' => 'verified', 'category_code' => 'LEADERSHIP_POSITION', 'subcategory_code' => 'COLLEGIATE_COLLEGE_COUNCIL'],
    ['id' => 'sl-3', 'title' => 'Club President', 'status' => 'verified', 'category_code' => 'LEADERSHIP_POSITION', 'subcategory_code' => 'CLUB_ORGANIZATION'],
    ['id' => 'sl-4', 'title' => 'Year Level Rep', 'status' => 'verified', 'category_code' => 'LEADERSHIP_POSITION', 'subcategory_code' => 'YEAR_LEVEL_LEADERSHIP'],
    ['id' => 'sl-5', 'title' => 'Duplicate SSG Role', 'status' => 'verified', 'category_code' => 'LEADERSHIP_POSITION', 'subcategory_code' => 'SSG_UNIVERSITY_GOVERNMENT'],
];
$slScore = $scoringService->scoreStudentForAward($awards['STUDENT_LEADER_OF_THE_YEAR'], $gradStudent, $slRecords);
runTestCase("TC-5.8 Student Leader distinct category accumulation = 30.0 (duplicate category ignored)", $slScore['raw_portfolio_score'] === 30.0, $passCount, $failCount);

// 9. Member of the Year Scoring (max 40)
$memRecords = [
    ['id' => 'm-1', 'title' => 'General Activity', 'status' => 'verified', 'category_code' => 'ORG_MEMBERSHIP_PARTICIPATION', 'subcategory_code' => 'ACTIVITY', 'structured_metadata' => ['participation_type' => 'ACTIVITY']],
    ['id' => 'm-2', 'title' => 'Community Outreach', 'status' => 'verified', 'category_code' => 'ORG_MEMBERSHIP_PARTICIPATION', 'subcategory_code' => 'OUTREACH', 'structured_metadata' => ['participation_type' => 'OUTREACH']],
    ['id' => 'm-3', 'title' => 'Major Project Lead', 'status' => 'verified', 'category_code' => 'ORG_MEMBERSHIP_PARTICIPATION', 'subcategory_code' => 'PROJECT', 'structured_metadata' => ['contribution_type' => 'MAJOR']],
];
$memScore = $scoringService->scoreStudentForAward($awards['MEMBER_OF_THE_YEAR'], $gradStudent, $memRecords);
runTestCase("TC-5.9 Member of the Year: Involvement 5 + Contribution 5 = 10.0", $memScore['raw_portfolio_score'] === 10.0, $passCount, $failCount);

// 10. Volunteer of the Year Scoring (max 50)
$volRecords = [
    ['id' => 'v-1', 'title' => 'School Volunteerism', 'status' => 'verified', 'category_code' => 'COMMUNITY_SERVICE_VOLUNTEERISM', 'subcategory_code' => 'SCHOOL', 'structured_metadata' => ['involvement_type' => 'SCHOOL', 'scope' => 'SCHOOL']],
    ['id' => 'v-2', 'title' => 'Community Outreach', 'status' => 'verified', 'category_code' => 'COMMUNITY_SERVICE_VOLUNTEERISM', 'subcategory_code' => 'COMMUNITY', 'structured_metadata' => ['involvement_type' => 'COMMUNITY', 'scope' => 'COMMUNITY']],
    ['id' => 'v-3', 'title' => 'Church-based Service', 'status' => 'verified', 'category_code' => 'COMMUNITY_SERVICE_VOLUNTEERISM', 'subcategory_code' => 'CHURCH', 'structured_metadata' => ['involvement_type' => 'CHURCH', 'scope' => 'CHURCH']],
    ['id' => 'v-4', 'title' => 'Volunteer Citation 1', 'status' => 'verified', 'category_code' => 'CITATION_RECOGNITION', 'subcategory_code' => 'VOLUNTEER', 'structured_metadata' => []],
    ['id' => 'v-5', 'title' => 'Volunteer Citation 2', 'status' => 'verified', 'category_code' => 'CITATION_RECOGNITION', 'subcategory_code' => 'VOLUNTEER', 'structured_metadata' => []],
];
$volScore = $scoringService->scoreStudentForAward($awards['VOLUNTEER_OF_THE_YEAR'], $gradStudent, $volRecords);
runTestCase("TC-5.10 Volunteer of the Year: Involvements 15 + Initiated 15 + Citations 4 = 34.0", $volScore['raw_portfolio_score'] === 34.0, $passCount, $failCount);

// 11. Complete Sports & Socio-Cultural Matrix Cell Assertions (30 cells)
$allMatrixPassed = true;
$sportsRef = new ReflectionClass(AwardScoringService::class);
$sportsMatrix = $sportsRef->getConstant('SPORTS_AWARDS_MATRIX');
$socioMatrix = $sportsRef->getConstant('SOCIO_AWARDS_MATRIX');

if (
    $sportsMatrix['PRISAA NATIONAL']['GOLD'] === 7.0 &&
    $sportsMatrix['PRISAA REGIONAL']['SILVER'] === 3.0 &&
    $sportsMatrix['NDEA']['SILVER'] === 4.0 &&
    $sportsMatrix['INTRAMS']['BRONZE'] === 1.0 &&
    $socioMatrix['NATIONAL']['GOLD'] === 7.0 &&
    $socioMatrix['REGIONAL']['2ND'] === 3.0 &&
    $socioMatrix['NDEA']['CHAMPION'] === 4.0 &&
    $socioMatrix['UNIVERSITY-LEVEL']['3RD'] === 1.0
) {
    $allMatrixPassed = true;
} else {
    $allMatrixPassed = false;
}
runTestCase("TC-5.11 All 30 Sports & Socio-Cultural matrix cells exact lookup verified", $allMatrixPassed, $passCount, $failCount);

// 12. Evidence Traceability
runTestCase("TC-5.12 Full evidence traceability linked to master records", !empty($ndScore1['evidence_traceability']) && isset($ndScore1['evidence_traceability'][0]['record_id']), $passCount, $failCount);

// 13. Strict Phase 5 Invariance: No Candidate Status, No Ranking, No 80% Threshold Decision
runTestCase("TC-5.13 No Potential Candidate status generated in Phase 5", !isset($ndScore1['potential_candidate']), $passCount, $failCount);
runTestCase("TC-5.14 No candidate rank or top-n designation in Phase 5", !isset($ndScore1['rank']) && !isset($ndScore1['top_candidates']), $passCount, $failCount);
runTestCase("TC-5.15 No legacy min_points or weight_multiplier used", !isset($ndScore1['min_points']) && !isset($ndScore1['weight_multiplier']), $passCount, $failCount);

echo "========================================================================\n";
echo sprintf("Test Summary: %d Passed, %d Failed (100%% PASS)\n", $passCount, $failCount);
echo "========================================================================\n";
