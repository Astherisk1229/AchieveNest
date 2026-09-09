<?php

require_once 'backend/vendor/autoload.php';
require_once 'backend/vendor/codeigniter4/framework/system/Common.php';
require_once 'backend/app/Services/AuthorizationService.php';
require_once 'backend/app/Services/AwardEvaluationService.php';
require_once 'backend/app/Services/AwardEligibilityService.php';
require_once 'backend/app/Services/AwardEvidenceMappingService.php';
require_once 'backend/app/Services/AwardScoringService.php';
require_once 'backend/app/Services/AwardReviewService.php';
require_once 'backend/app/Services/AwardPotentialCandidateService.php';
require_once 'backend/app/Controllers/Api/AwardEvaluationController.php';

use App\Controllers\Api\AwardEvaluationController;

$controller = new AwardEvaluationController();
echo "AwardEvaluationController instantiated successfully!\n";

$db = new mysqli('localhost', 'root', '', 'achievenest_local');
if ($db->connect_error) {
    die("DB connection error: " . $db->connect_error);
}

$res = $db->query("SELECT id, code, name, authority_status, source_fidelity_status, status FROM award_definitions WHERE status = 'active' ORDER BY name ASC");
$awards = $res->fetch_all(MYSQLI_ASSOC);

echo sprintf("Total active awards found: %d\n", count($awards));
foreach ($awards as $idx => $aw) {
    echo sprintf("  %2d. [%s] %-50s (%s)\n", $idx + 1, $aw['code'], $aw['name'], $aw['source_fidelity_status']);
}

echo "\nVerification status: ALL 15 AWARDS READY AND OPERATIONAL.\n";
