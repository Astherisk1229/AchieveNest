<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */
$routes->get('/', 'Home::index');

$routes->group('api/v1', static function (RouteCollection $routes): void {
    $routes->get('health', 'Api\HealthController::index', ['as' => 'health.index']);
    $routes->post('auth/login', 'Api\AuthController::login', ['as' => 'auth.login']);
    $routes->options('auth/login', 'Api\AuthController::options');
    $routes->post('auth/logout', 'Api\AuthController::logout', ['as' => 'auth.logout']);
    $routes->options('auth/logout', 'Api\AuthController::options');
    $routes->get('auth/me', 'Api\AuthController::me', ['as' => 'auth.me']);
    $routes->options('auth/me', 'Api\AuthController::options');
    $routes->post('auth/change-password', 'Api\AuthController::changePassword', ['as' => 'auth.change_password']);
    $routes->options('auth/change-password', 'Api\AuthController::options');

    // Student Institutional Profile (Plan 12)
    $routes->get('student/profile', 'Api\StudentProfileController::show', ['as' => 'student.profile']);
    $routes->options('student/profile', 'Api\StudentProfileController::options');

    // Admin-Handled Password Reset Requests
    $routes->post('password-reset-requests', 'Api\PasswordResetRequestController::submit', ['as' => 'password_reset.submit']);
    $routes->get('password-reset-requests', 'Api\PasswordResetRequestController::list', ['as' => 'password_reset.list']);
    $routes->options('password-reset-requests', 'Api\PasswordResetRequestController::options');
    $routes->post('password-reset-requests/(:segment)/reset', 'Api\PasswordResetRequestController::reset/$1', ['as' => 'password_reset.reset']);
    $routes->options('password-reset-requests/(:segment)/reset', 'Api\PasswordResetRequestController::options');
    $routes->post('password-reset-requests/(:segment)/reject', 'Api\PasswordResetRequestController::reject/$1', ['as' => 'password_reset.reject']);
    $routes->options('password-reset-requests/(:segment)/reject', 'Api\PasswordResetRequestController::options');

    // Personnel Role & Scope Management
    $routes->get('personnel/roles', 'Api\PersonnelRoleController::index');
    $routes->options('personnel/roles', 'Api\PersonnelRoleController::options');
    $routes->post('personnel/(:segment)/roles', 'Api\PersonnelRoleController::assign/$1');
    $routes->options('personnel/(:segment)/roles', 'Api\PersonnelRoleController::options');
    $routes->delete('personnel/(:segment)/roles/(:segment)', 'Api\PersonnelRoleController::revoke/$1/$2');
    $routes->options('personnel/(:segment)/roles/(:segment)', 'Api\PersonnelRoleController::options');

    // Account Provisioning — target-schema manual flows.
    $routes->get('osad/students', 'Api\TargetProvisioningController::listStudents');
    $routes->options('osad/students', 'Api\TargetProvisioningController::options');
    $routes->get('osad/audit', 'Api\TargetProvisioningController::audit');
    $routes->options('osad/audit', 'Api\TargetProvisioningController::options');
    $routes->post('provisioning/manual-student', 'Api\TargetProvisioningController::manualStudent');
    $routes->options('provisioning/manual-student', 'Api\TargetProvisioningController::options');
    $routes->post('provisioning/manual-personnel', 'Api\TargetProvisioningController::manualPersonnel');
    $routes->options('provisioning/manual-personnel', 'Api\TargetProvisioningController::options');
    $routes->post('provisioning/availability', 'Api\TargetProvisioningController::availability');
    $routes->options('provisioning/availability', 'Api\TargetProvisioningController::options');
    // Roster endpoints remain on legacy controller until target roster payload is finalized.
    $routes->post('provisioning/preview-roster', 'Api\ProvisioningController::previewRoster');
    $routes->options('provisioning/preview-roster', 'Api\ProvisioningController::options');
    $routes->post('provisioning/commit-roster', 'Api\ProvisioningController::commitRoster');
    $routes->options('provisioning/commit-roster', 'Api\ProvisioningController::options');

    // Account Lifecycle & Audit History
    $routes->post('accounts/(:segment)/suspend', 'Api\AccountLifecycleController::suspend/$1');
    $routes->options('accounts/(:segment)/suspend', 'Api\AccountLifecycleController::options');
    $routes->post('accounts/(:segment)/archive', 'Api\AccountLifecycleController::archive/$1');
    $routes->options('accounts/(:segment)/archive', 'Api\AccountLifecycleController::options');
    $routes->post('accounts/(:segment)/restore', 'Api\AccountLifecycleController::restore/$1');
    $routes->options('accounts/(:segment)/restore', 'Api\AccountLifecycleController::options');
    $routes->post('accounts/(:segment)/reset-temporary-password', 'Api\AccountLifecycleController::resetTemporaryPassword/$1', ['as' => 'accounts.reset_temporary_password']);
    $routes->options('accounts/(:segment)/reset-temporary-password', 'Api\AccountLifecycleController::options');
    $routes->post('accounts/(:segment)/audit-delivery-action', 'Api\AccountLifecycleController::auditDeliveryAction/$1', ['as' => 'accounts.audit_delivery_action']);
    $routes->options('accounts/(:segment)/audit-delivery-action', 'Api\AccountLifecycleController::options');
    $routes->get('accounts/(:segment)/lifecycle', 'Api\AccountLifecycleController::events/$1');
    $routes->options('accounts/(:segment)/lifecycle', 'Api\AccountLifecycleController::options');

    // Achievements & Portfolio Domain
    $routes->get('achievements', 'Api\AchievementController::index');
    $routes->options('achievements', 'Api\AchievementController::options');
    $routes->post('achievements', 'Api\AchievementController::create');

    // Personnel portfolio accomplishments (authoritative persistence)
    $routes->get('personnel/accomplishments', 'Api\PersonnelAccomplishmentController::index');
    $routes->post('personnel/accomplishments', 'Api\PersonnelAccomplishmentController::create');
    $routes->put('personnel/accomplishments/(:segment)', 'Api\PersonnelAccomplishmentController::update/$1');
    $routes->delete('personnel/accomplishments/(:segment)', 'Api\PersonnelAccomplishmentController::delete/$1');
    $routes->options('personnel/accomplishments/(:segment)', 'Api\PersonnelAccomplishmentController::options');
    $routes->options('personnel/accomplishments', 'Api\PersonnelAccomplishmentController::options');
    $routes->post('personnel/accomplishments/(:segment)/evidence', 'Api\PersonnelAccomplishmentController::addEvidence/$1');
    $routes->options('personnel/accomplishments/(:segment)/evidence', 'Api\PersonnelAccomplishmentController::options');

    // Personnel whole-portfolio submission (Plan C Phase C1, C2, C3, C4 & C5)
    $routes->post('personnel/portfolio/submit', 'Api\PersonnelPortfolioSubmissionController::submit');
    $routes->options('personnel/portfolio/submit', 'Api\PersonnelPortfolioSubmissionController::options');
    $routes->post('personnel/portfolio/submissions/resubmit', 'Api\PersonnelPortfolioSubmissionController::resubmit');
    $routes->options('personnel/portfolio/submissions/resubmit', 'Api\PersonnelPortfolioSubmissionController::options');
    $routes->post('personnel/portfolio/resubmit', 'Api\PersonnelPortfolioSubmissionController::resubmit');
    $routes->options('personnel/portfolio/resubmit', 'Api\PersonnelPortfolioSubmissionController::options');
    $routes->get('personnel/portfolio/submissions/history', 'Api\PersonnelPortfolioSubmissionController::getHistory');
    $routes->options('personnel/portfolio/submissions/history', 'Api\PersonnelPortfolioSubmissionController::options');
    $routes->get('personnel/portfolio/history', 'Api\PersonnelPortfolioSubmissionController::getHistory');
    $routes->options('personnel/portfolio/history', 'Api\PersonnelPortfolioSubmissionController::options');
    $routes->get('personnel/portfolio/submission/latest', 'Api\PersonnelPortfolioSubmissionController::getLatest');
    $routes->options('personnel/portfolio/submission/latest', 'Api\PersonnelPortfolioSubmissionController::options');
    $routes->post('personnel/portfolio/submissions/(:segment)/return-for-revision', 'Api\PersonnelPortfolioSubmissionController::returnForRevision/$1');
    $routes->options('personnel/portfolio/submissions/(:segment)/return-for-revision', 'Api\PersonnelPortfolioSubmissionController::options');
    $routes->post('personnel/portfolio/purge', 'Api\PersonnelPortfolioSubmissionController::purge');
    $routes->delete('personnel/portfolio/purge', 'Api\PersonnelPortfolioSubmissionController::purge');
    $routes->options('personnel/portfolio/purge', 'Api\PersonnelPortfolioSubmissionController::options');
    $routes->put('personnel/portfolio/submissions/(:segment)', 'Api\PersonnelPortfolioSubmissionController::updateSubmission/$1');
    $routes->delete('personnel/portfolio/submissions/(:segment)', 'Api\PersonnelPortfolioSubmissionController::deleteSubmission/$1');
    $routes->put('personnel/portfolio/submissions/(:segment)/items/(:segment)', 'Api\PersonnelPortfolioSubmissionController::updateItem/$1/$2');
    $routes->delete('personnel/portfolio/submissions/(:segment)/items/(:segment)', 'Api\PersonnelPortfolioSubmissionController::deleteItem/$1/$2');
    $routes->options('personnel/portfolio/submissions/(:segment)', 'Api\PersonnelPortfolioSubmissionController::options');
    $routes->options('personnel/portfolio/submissions/(:segment)/items/(:segment)', 'Api\PersonnelPortfolioSubmissionController::options');

    // Verification Queue & Decisions
    $routes->get('verification/queue', 'Api\VerificationQueueController::queue');
    $routes->options('verification/queue', 'Api\VerificationQueueController::options');
    $routes->post('verification/(:segment)/decide', 'Api\VerificationQueueController::decide/$1');
    $routes->options('verification/(:segment)/decide', 'Api\VerificationQueueController::options');

    // Official Events & Certificates
    $routes->get('events', 'Api\EventController::index');
    $routes->options('events', 'Api\EventController::options');
    $routes->post('events', 'Api\EventController::create');
    $routes->post('events/(:segment)/participants', 'Api\EventController::addParticipants/$1');
    $routes->options('events/(:segment)/participants', 'Api\EventController::options');

    // =========================================================================
    // HR Personnel Directory & Governance (Phases 3-7, 14-15)
    // =========================================================================

    // Target-schema Personnel Directory
    $routes->get('hr/personnel', 'Api\TargetHRPersonnelController::directory');
    $routes->options('hr/personnel', 'Api\TargetHRPersonnelController::options');

    // Personnel Classification Update (Plan D Phase D1)
    $routes->put('hr/personnel/(:segment)/classification', 'Api\TargetHRPersonnelController::updateClassification/$1');
    $routes->options('hr/personnel/(:segment)/classification', 'Api\TargetHRPersonnelController::options');

    // Personnel Master Data & Faculty Status Update (Plan D Phase D2)
    $routes->get('hr/personnel/(:segment)/master-data', 'Api\TargetHRPersonnelController::getMasterData/$1');
    $routes->options('hr/personnel/(:segment)/master-data', 'Api\TargetHRPersonnelController::options');
    $routes->put('hr/personnel/(:segment)/master-data', 'Api\TargetHRPersonnelController::updateMasterData/$1');
    $routes->put('hr/personnel/(:segment)/status', 'Api\TargetHRPersonnelController::updateMasterData/$1');
    $routes->options('hr/personnel/(:segment)/status', 'Api\TargetHRPersonnelController::options');

    // Dean Annual Review & Portfolio-Validation Eligibility (Plan D1 Companion)
    $routes->get('dean/annual-reviews', 'Api\DeanAnnualReviewController::index');
    $routes->post('dean/annual-reviews', 'Api\DeanAnnualReviewController::create');
    $routes->options('dean/annual-reviews', 'Api\DeanAnnualReviewController::options');
    $routes->get('dean/annual-reviews/(:segment)', 'Api\DeanAnnualReviewController::show/$1');
    $routes->options('dean/annual-reviews/(:segment)', 'Api\DeanAnnualReviewController::options');
    $routes->post('dean/annual-reviews/(:segment)/supersede', 'Api\DeanAnnualReviewController::supersede/$1');
    $routes->options('dean/annual-reviews/(:segment)/supersede', 'Api\DeanAnnualReviewController::options');

    // Personnel Eligibility Endpoints (Plan D1 Companion)
    $routes->get('personnel/eligibility/current', 'Api\PersonnelEligibilityController::current');
    $routes->options('personnel/eligibility/current', 'Api\PersonnelEligibilityController::options');
    $routes->get('hr/personnel/(:segment)/eligibility', 'Api\PersonnelEligibilityController::show/$1');
    $routes->options('hr/personnel/(:segment)/eligibility', 'Api\PersonnelEligibilityController::options');

    // Dynamic Portfolio Format, Criteria & Evaluation Scales (Plan F1)
    $routes->get('personnel/evaluation-scale', 'Api\EvaluationScaleController::getAssignedScale');
    $routes->options('personnel/evaluation-scale', 'Api\EvaluationScaleController::options');
    $routes->get('personnel/(:segment)/evaluation-scale', 'Api\EvaluationScaleController::getPersonnelAssignedScale/$1');
    $routes->options('personnel/(:segment)/evaluation-scale', 'Api\EvaluationScaleController::options');
    $routes->get('evaluation-instruments/assigned', 'Api\EvaluationScaleController::getAssignedScale');
    $routes->options('evaluation-instruments/assigned', 'Api\EvaluationScaleController::options');

    $routes->get('personnel/portfolio/configuration', 'Api\EvaluationScaleController::getPersonnelConfiguration');
    $routes->options('personnel/portfolio/configuration', 'Api\EvaluationScaleController::options');
    $routes->get('personnel/portfolio/configuration/areas/(:segment)', 'Api\EvaluationScaleController::getAreaConfiguration/$1');
    $routes->options('personnel/portfolio/configuration/areas/(:segment)', 'Api\EvaluationScaleController::options');
    $routes->post('personnel/portfolio/validate-entry', 'Api\EvaluationScaleController::validateEntry');
    $routes->options('personnel/portfolio/validate-entry', 'Api\EvaluationScaleController::options');
    $routes->get('admin/evaluation-scales', 'Api\EvaluationScaleController::listScales');
    $routes->options('admin/evaluation-scales', 'Api\EvaluationScaleController::options');
    $routes->post('admin/evaluation-scales/(:segment)/approve', 'Api\EvaluationScaleController::approveVersion/$1');
    $routes->options('admin/evaluation-scales/(:segment)/approve', 'Api\EvaluationScaleController::options');
    $routes->post('admin/evaluation-scales/(:segment)/retire', 'Api\EvaluationScaleController::retireVersion/$1');
    $routes->options('admin/evaluation-scales/(:segment)/retire', 'Api\EvaluationScaleController::options');

    // Target-schema Dean assignment / revocation
    $routes->post('hr/personnel/(:segment)/dean-role', 'Api\TargetHRPersonnelController::assignDean/$1');
    $routes->delete('hr/personnel/(:segment)/dean-role/(:segment)', 'Api\TargetHRPersonnelController::revokeDean/$1/$2');

    $routes->options('hr/personnel/(:segment)/dean-role', 'Api\TargetHRPersonnelController::options');
    $routes->options('hr/personnel/(:segment)/dean-role/(:segment)', 'Api\TargetHRPersonnelController::options');

    // Prerequisite Qualification Report gate (legacy controller; no Department dependency in these methods)
    $routes->post('hr/personnel/(:segment)/qualification-reviews', 'Api\HRPersonnelController::recordQualification/$1');
    $routes->get('hr/personnel/(:segment)/qualification-reviews', 'Api\HRPersonnelController::listQualificationReviews/$1');
    $routes->options('hr/personnel/(:segment)/qualification-reviews', 'Api\HRPersonnelController::options');

    // HR Dashboard live KPIs
    $routes->get('hr/dashboard', 'Api\HRPersonnelController::dashboard');
    $routes->options('hr/dashboard', 'Api\HRPersonnelController::options');

    // HR Audit Trail
    $routes->get('hr/audit', 'Api\HRPersonnelController::audit');
    $routes->options('hr/audit', 'Api\HRPersonnelController::options');

    // =========================================================================
    // HR Personnel Ranking Evaluations (Phases 8-13)
    // =========================================================================
    $routes->get('hr/evaluations', 'Api\HREvaluationController::list');
    $routes->options('hr/evaluations', 'Api\HREvaluationController::options');
    $routes->get('hr/evaluations/(:segment)', 'Api\HREvaluationController::get/$1');

    // State machine transitions
    $routes->post('hr/evaluations/(:segment)/start', 'Api\HREvaluationController::start/$1');
    $routes->options('hr/evaluations/(:segment)/start', 'Api\HREvaluationController::options');
    $routes->post('hr/evaluations/(:segment)/return', 'Api\HREvaluationController::returnEvaluation/$1');
    $routes->options('hr/evaluations/(:segment)/return', 'Api\HREvaluationController::options');
    $routes->post('hr/evaluations/(:segment)/ready', 'Api\HREvaluationController::markReady/$1');
    $routes->options('hr/evaluations/(:segment)/ready', 'Api\HREvaluationController::options');
    $routes->post('hr/evaluations/(:segment)/finalize', 'Api\HREvaluationController::finalizeEvaluation/$1');
    $routes->options('hr/evaluations/(:segment)/finalize', 'Api\HREvaluationController::options');

    // Evidence verification + scoring
    $routes->patch('hr/evaluations/(:segment)/items/(:segment)/verify', 'Api\HREvaluationController::verifyItem/$1/$2');
    $routes->options('hr/evaluations/(:segment)/items/(:segment)/verify', 'Api\HREvaluationController::options');
    $routes->patch('hr/evaluations/(:segment)/items/(:segment)/rate', 'Api\HREvaluationController::rateItem/$1/$2');
    $routes->options('hr/evaluations/(:segment)/items/(:segment)/rate', 'Api\HREvaluationController::options');

    // Final points-summary report
    $routes->get('hr/evaluations/(:segment)/report', 'Api\HREvaluationController::getReport/$1');
    $routes->options('hr/evaluations/(:segment)/report', 'Api\HREvaluationController::options');

    // Deficiency / Additional Evidence Workflow
    $routes->post('hr/evaluations/(:segment)/deficiencies', 'Api\HREvaluationController::createDeficiency/$1');
    $routes->get('hr/evaluations/(:segment)/deficiencies', 'Api\HREvaluationController::listDeficiencies/$1');
    $routes->options('hr/evaluations/(:segment)/deficiencies', 'Api\HREvaluationController::options');
    $routes->post('hr/evaluations/(:segment)/deficiencies/(:segment)/respond', 'Api\HREvaluationController::respondDeficiency/$1/$2');
    $routes->options('hr/evaluations/(:segment)/deficiencies/(:segment)/respond', 'Api\HREvaluationController::options');
    $routes->post('hr/evaluations/(:segment)/deficiencies/(:segment)/resolve', 'Api\HREvaluationController::resolveDeficiency/$1/$2');
    $routes->options('hr/evaluations/(:segment)/deficiencies/(:segment)/resolve', 'Api\HREvaluationController::options');
    $routes->post('hr/evaluations/(:segment)/deficiencies/(:segment)/cancel', 'Api\HREvaluationController::cancelDeficiency/$1/$2');
    $routes->options('hr/evaluations/(:segment)/deficiencies/(:segment)/cancel', 'Api\HREvaluationController::options');

    // General evaluation options catch-all (must come last under hr/evaluations)
    $routes->options('hr/evaluations/(:segment)', 'Api\HREvaluationController::options');

    // =========================================================================
    // Target Student Portfolio & Program Coordinator Verification
    // =========================================================================
    $routes->get('portfolio/categories', 'Api\StudentPortfolioController::categories');
    $routes->options('portfolio/categories', 'Api\StudentPortfolioController::options');
    $routes->get('portfolio', 'Api\StudentPortfolioController::index');
    $routes->post('portfolio', 'Api\StudentPortfolioController::create');
    $routes->options('portfolio', 'Api\StudentPortfolioController::options');
    $routes->get('portfolio/(:segment)', 'Api\StudentPortfolioController::get/$1');
    $routes->options('portfolio/(:segment)', 'Api\StudentPortfolioController::options');
    $routes->post('portfolio/(:segment)/evidence', 'Api\StudentPortfolioController::addEvidence/$1');
    $routes->options('portfolio/(:segment)/evidence', 'Api\StudentPortfolioController::options');
    $routes->post('portfolio/(:segment)/verify', 'Api\StudentPortfolioController::verifyRecord/$1');
    $routes->options('portfolio/(:segment)/verify', 'Api\StudentPortfolioController::options');
    $routes->post('portfolio/(:segment)/request-revision', 'Api\StudentPortfolioController::requestRevision/$1');
    $routes->options('portfolio/(:segment)/request-revision', 'Api\StudentPortfolioController::options');
    $routes->post('portfolio/(:segment)/reject', 'Api\StudentPortfolioController::rejectRecord/$1');
    $routes->options('portfolio/(:segment)/reject', 'Api\StudentPortfolioController::options');
    $routes->post('portfolio/(:segment)/resubmit', 'Api\StudentPortfolioController::resubmitRecord/$1');
    $routes->options('portfolio/(:segment)/resubmit', 'Api\StudentPortfolioController::options');

    // Program Coordinator Scoped Queue
    $routes->get('program-coordinator/verification-queue', 'Api\StudentPortfolioController::coordinatorQueue');
    $routes->options('program-coordinator/verification-queue', 'Api\StudentPortfolioController::options');

    // OSAD Academic Structure — Colleges & Programs (Phase C)
    $routes->get('osad/colleges', 'Api\CollegeController::index');
    $routes->post('osad/colleges', 'Api\CollegeController::create');
    $routes->options('osad/colleges', 'Api\CollegeController::options');
    $routes->get('osad/colleges/(:segment)', 'Api\CollegeController::show/$1');
    $routes->options('osad/colleges/(:segment)', 'Api\CollegeController::options');
    $routes->get('osad/colleges/(:segment)/logo', 'Api\CollegeController::logo/$1');
    $routes->options('osad/colleges/(:segment)/logo', 'Api\CollegeController::options');
    $routes->get('osad/academic-programs', 'Api\CollegeController::listPrograms');
    $routes->post('osad/academic-programs', 'Api\CollegeController::createProgram');
    $routes->put('osad/academic-programs/(:segment)', 'Api\CollegeController::updateProgram/$1');
    $routes->patch('osad/academic-programs/(:segment)', 'Api\CollegeController::updateProgram/$1');
    $routes->options('osad/academic-programs/(:segment)', 'Api\CollegeController::options');
    $routes->options('osad/academic-programs', 'Api\CollegeController::options');

    // OSAD Program Coordinator Assignment Redesign (Phase F & Plan 01 Phase 3)
    $routes->get('osad/colleges/(:segment)/coordinator-personnel', 'Api\CollegeController::listCoordinatorPersonnel/$1');
    $routes->options('osad/colleges/(:segment)/coordinator-personnel', 'Api\CollegeController::options');
    $routes->get('osad/colleges/(:segment)/coordinator-personnel/(:segment)', 'Api\CollegeController::getPersonnelCoordinatorContext/$1/$2');
    $routes->put('osad/colleges/(:segment)/coordinator-personnel/(:segment)', 'Api\CollegeController::updatePersonnelCoordinatorAssignments/$1/$2');
    $routes->options('osad/colleges/(:segment)/coordinator-personnel/(:segment)', 'Api\CollegeController::options');
    $routes->post('osad/colleges/(:segment)/reassign-coordinator', 'Api\CollegeController::reassignCoordinator/$1');
    $routes->options('osad/colleges/(:segment)/reassign-coordinator', 'Api\CollegeController::options');

    // OSAD Student Organizations (Phase E)
    $routes->get('osad/organizations', 'Api\OrganizationController::index');
    $routes->post('osad/organizations', 'Api\OrganizationController::create');
    $routes->options('osad/organizations', 'Api\OrganizationController::options');
    $routes->get('osad/organizations/(:segment)', 'Api\OrganizationController::show/$1');
    $routes->options('osad/organizations/(:segment)', 'Api\OrganizationController::options');
    $routes->get('osad/organizations/(:segment)/logo', 'Api\OrganizationController::logo/$1');
    $routes->post('osad/organizations/(:segment)/logo', 'Api\OrganizationController::updateLogo/$1');
    $routes->delete('osad/organizations/(:segment)/logo', 'Api\OrganizationController::deleteLogo/$1');
    $routes->options('osad/organizations/(:segment)/logo', 'Api\OrganizationController::options');

    // OSAD Awards & Explainable Scoring Basis
    $routes->get('osad/awards', 'Api\AwardEvaluationController::listAwards');
    $routes->options('osad/awards', 'Api\AwardEvaluationController::options');
    $routes->get('osad/candidates', 'Api\AwardEvaluationController::listAllCandidates');
    $routes->options('osad/candidates', 'Api\AwardEvaluationController::options');
    $routes->post('osad/awards/(:segment)/evaluate', 'Api\AwardEvaluationController::evaluateAward/$1');
    $routes->options('osad/awards/(:segment)/evaluate', 'Api\AwardEvaluationController::options');
    $routes->patch('osad/awards/(:segment)/candidate-threshold', 'Api\AwardEvaluationController::updateCandidateThreshold/$1');
    $routes->options('osad/awards/(:segment)/candidate-threshold', 'Api\AwardEvaluationController::options');
    $routes->get('osad/awards/(:segment)/candidates', 'Api\AwardEvaluationController::listCandidates/$1');
    $routes->options('osad/awards/(:segment)/candidates', 'Api\AwardEvaluationController::options');
    $routes->get('osad/awards/(:segment)/students-for-evaluation', 'Api\AwardEvaluationController::studentsForEvaluation/$1');
    $routes->options('osad/awards/(:segment)/students-for-evaluation', 'Api\AwardEvaluationController::options');
    $routes->get('osad/awards/(:segment)/students/(:segment)/evidence', 'Api\AwardEvaluationController::studentAwardEvidence/$1/$2');
    $routes->options('osad/awards/(:segment)/students/(:segment)/evidence', 'Api\AwardEvaluationController::options');
    $routes->get('osad/awards/(:segment)/students/(:segment)/review', 'Api\AwardEvaluationController::studentAwardReview/$1/$2');
    $routes->options('osad/awards/(:segment)/students/(:segment)/review', 'Api\AwardEvaluationController::options');
    $routes->patch('osad/awards/(:segment)/students/(:segment)/manual-criteria', 'Api\AwardEvaluationController::saveManualCriteria/$1/$2');
    $routes->options('osad/awards/(:segment)/students/(:segment)/manual-criteria', 'Api\AwardEvaluationController::options');
    $routes->post('osad/awards/(:segment)/students/(:segment)/finalize', 'Api\AwardEvaluationController::finalizeStudentAwardEvaluation/$1/$2');
    $routes->options('osad/awards/(:segment)/students/(:segment)/finalize', 'Api\AwardEvaluationController::options');
    $routes->post('osad/awards/(:segment)/students/(:segment)/recalculate', 'Api\AwardEvaluationController::recalculatePortfolioScore/$1/$2');
    $routes->options('osad/awards/(:segment)/students/(:segment)/recalculate', 'Api\AwardEvaluationController::options');
    $routes->post('osad/awards/(:segment)/students/(:segment)/classify', 'Api\AwardEvaluationController::classifyPotentialCandidate/$1/$2');
    $routes->options('osad/awards/(:segment)/students/(:segment)/classify', 'Api\AwardEvaluationController::options');
    $routes->get('osad/awards/(:segment)/students/(:segment)/candidate-status', 'Api\AwardEvaluationController::studentCandidateStatus/$1/$2');
    $routes->options('osad/awards/(:segment)/students/(:segment)/candidate-status', 'Api\AwardEvaluationController::options');
    $routes->get('osad/awards/(:segment)/potential-candidates', 'Api\AwardEvaluationController::listPotentialCandidates/$1');
    $routes->options('osad/awards/(:segment)/potential-candidates', 'Api\AwardEvaluationController::options');
    $routes->get('osad/awards/(:segment)/evaluated-results', 'Api\AwardEvaluationController::listEvaluatedResults/$1');
    $routes->options('osad/awards/(:segment)/evaluated-results', 'Api\AwardEvaluationController::options');
    $routes->post('osad/awards/(:segment)/students/(:segment)/score', 'Api\AwardEvaluationController::scoreStudentAward/$1/$2');
    $routes->options('osad/awards/(:segment)/students/(:segment)/score', 'Api\AwardEvaluationController::options');
    $routes->get('osad/awards/(:segment)/students/(:segment)/scoring-basis', 'Api\AwardEvaluationController::studentScoringBasis/$1/$2');
    $routes->options('osad/awards/(:segment)/students/(:segment)/scoring-basis', 'Api\AwardEvaluationController::options');
    $routes->get('osad/awards/(:segment)/students/(:segment)/basis', 'Api\AwardEvaluationController::scoringBasis/$1/$2');
    $routes->options('osad/awards/(:segment)/students/(:segment)/basis', 'Api\AwardEvaluationController::options');
    $routes->get('osad/awards/(:segment)/students/(:segment)/eligibility', 'Api\AwardEvaluationController::studentAwardEligibility/$1/$2');
    $routes->options('osad/awards/(:segment)/students/(:segment)/eligibility', 'Api\AwardEvaluationController::options');
    $routes->get('awards/campus-journalism/students/(:segment)/score', 'Api\AwardEvaluationController::campusJournalismScore/$1');
    $routes->options('awards/campus-journalism/students/(:segment)/score', 'Api\AwardEvaluationController::options');
    $routes->get('awards/campus-journalism/candidates', 'Api\AwardEvaluationController::campusJournalismCandidates');
    $routes->options('awards/campus-journalism/candidates', 'Api\AwardEvaluationController::options');

    // OSAD Student Organization Management
    $routes->get('osad/organizations', 'Api\OrganizationController::index');
    $routes->options('osad/organizations', 'Api\OrganizationController::options');
    $routes->post('osad/organizations', 'Api\OrganizationController::create');
    $routes->options('osad/organizations', 'Api\OrganizationController::options');
    $routes->get('osad/organizations/(:segment)', 'Api\OrganizationController::show/$1');
    $routes->options('osad/organizations/(:segment)', 'Api\OrganizationController::options');
    $routes->get('osad/organizations/(:segment)/logo', 'Api\OrganizationController::logo/$1');
    $routes->options('osad/organizations/(:segment)/logo', 'Api\OrganizationController::options');
    $routes->post('osad/organizations/(:segment)/moderator', 'Api\OrganizationController::assignModerator/$1');
    $routes->options('osad/organizations/(:segment)/moderator', 'Api\OrganizationController::options');
    $routes->delete('osad/organizations/(:segment)/moderator', 'Api\OrganizationController::removeModerator/$1');
    $routes->options('osad/organizations/(:segment)/moderator', 'Api\OrganizationController::options');
    $routes->post('osad/organizations/(:segment)/programs', 'Api\OrganizationController::addPrograms/$1');
    $routes->options('osad/organizations/(:segment)/programs', 'Api\OrganizationController::options');
    $routes->delete('osad/organizations/(:segment)/programs/(:segment)', 'Api\OrganizationController::removeProgram/$1/$2');
    $routes->options('osad/organizations/(:segment)/programs/(:segment)', 'Api\OrganizationController::options');
    $routes->patch('osad/organizations/(:segment)', 'Api\OrganizationController::update/$1');
    $routes->options('osad/organizations/(:segment)', 'Api\OrganizationController::options');
    $routes->delete('osad/organizations/(:segment)', 'Api\OrganizationController::delete/$1');
    $routes->options('osad/organizations/(:segment)', 'Api\OrganizationController::options');

    // Dean Nominations
    $routes->post('dean/nominations', 'Api\AwardEvaluationController::createDeanNomination');
    $routes->options('dean/nominations', 'Api\AwardEvaluationController::options');

    // =========================================================================
    // Protected Evidence File Metadata & Streaming Downloads (Phase 9)
    // =========================================================================
    $routes->get('evidence/student/(:segment)', 'Api\EvidenceController::studentMetadata/$1');
    $routes->options('evidence/student/(:segment)', 'Api\EvidenceController::options');
    $routes->get('evidence/student/(:segment)/download', 'Api\EvidenceController::studentDownload/$1');
    $routes->options('evidence/student/(:segment)/download', 'Api\EvidenceController::options');

    $routes->get('evidence/personnel/(:segment)', 'Api\EvidenceController::personnelMetadata/$1');
    $routes->options('evidence/personnel/(:segment)', 'Api\EvidenceController::options');
    $routes->get('evidence/personnel/(:segment)/preview', 'Api\EvidenceController::personnelPreview/$1');
    $routes->options('evidence/personnel/(:segment)/preview', 'Api\EvidenceController::options');
    $routes->get('evidence/personnel/(:segment)/download', 'Api\EvidenceController::personnelDownload/$1');
    $routes->options('evidence/personnel/(:segment)/download', 'Api\EvidenceController::options');

    // =========================================================================
    // Faculty Rank Catalogue & Progression (Plan E Phase E1 & E2)
    // =========================================================================
    $routes->get('faculty-ranks', 'Api\FacultyRankCatalogController::listRanks');
    $routes->options('faculty-ranks', 'Api\FacultyRankCatalogController::options');
    $routes->get('faculty-ranks/hierarchy', 'Api\FacultyRankCatalogController::getHierarchy');
    $routes->options('faculty-ranks/hierarchy', 'Api\FacultyRankCatalogController::options');
    $routes->post('faculty-ranks/validate-transition', 'Api\FacultyRankCatalogController::validateTransition');
    $routes->options('faculty-ranks/validate-transition', 'Api\FacultyRankCatalogController::options');
    // Initial Rank Seeding & Reconciliation (Plan E Phase E4)
    $routes->post('faculty-ranks/resolve-initial', 'Api\FacultyInitialRankController::resolveInitial');
    $routes->options('faculty-ranks/resolve-initial', 'Api\FacultyInitialRankController::options');
    $routes->post('faculty-ranks/reconcile-current', 'Api\FacultyInitialRankController::reconcileCurrent');
    $routes->options('faculty-ranks/reconcile-current', 'Api\FacultyInitialRankController::options');
    $routes->get('faculty-ranks/reconcile/(:segment)', 'Api\FacultyInitialRankController::reconcilePersonnel/$1');
    $routes->options('faculty-ranks/reconcile/(:segment)', 'Api\FacultyInitialRankController::options');
    $routes->get('hr/personnel/(:segment)/rank-resolution', 'Api\FacultyInitialRankController::reconcilePersonnel/$1');
    $routes->options('hr/personnel/(:segment)/rank-resolution', 'Api\FacultyInitialRankController::options');

    $routes->get('faculty-ranks/(:segment)/next', 'Api\FacultyRankCatalogController::getNextRank/$1');
    $routes->options('faculty-ranks/(:segment)/next', 'Api\FacultyRankCatalogController::options');
    $routes->get('faculty-ranks/(:segment)/transitions', 'Api\FacultyRankCatalogController::getTransitions/$1');
    $routes->options('faculty-ranks/(:segment)/transitions', 'Api\FacultyRankCatalogController::options');
    $routes->get('faculty-ranks/(:segment)', 'Api\FacultyRankCatalogController::getRank/$1');
    $routes->options('faculty-ranks/(:segment)', 'Api\FacultyRankCatalogController::options');
    $routes->post('faculty-ranks', 'Api\FacultyRankCatalogController::mutate');
    $routes->put('faculty-ranks/(:segment)', 'Api\FacultyRankCatalogController::mutate');
    $routes->delete('faculty-ranks/(:segment)', 'Api\FacultyRankCatalogController::mutate');

    $routes->get('hr/faculty-ranks', 'Api\FacultyRankCatalogController::listRanks');
    $routes->options('hr/faculty-ranks', 'Api\FacultyRankCatalogController::options');
    $routes->get('hr/faculty-ranks/hierarchy', 'Api\FacultyRankCatalogController::getHierarchy');
    $routes->options('hr/faculty-ranks/hierarchy', 'Api\FacultyRankCatalogController::options');

    // =========================================================================
    // Part-Time Faculty Titles & Qualification Resolution (Plan E Phase E3)
    // =========================================================================
    $routes->get('faculty-titles/part-time', 'Api\PartTimeFacultyTitleController::listTitles');
    $routes->options('faculty-titles/part-time', 'Api\PartTimeFacultyTitleController::options');
    $routes->post('faculty-titles/part-time/resolve', 'Api\PartTimeFacultyTitleController::resolveTitle');
    $routes->options('faculty-titles/part-time/resolve', 'Api\PartTimeFacultyTitleController::options');
    $routes->get('faculty-titles/part-time/(:segment)', 'Api\PartTimeFacultyTitleController::getTitle/$1');
    $routes->options('faculty-titles/part-time/(:segment)', 'Api\PartTimeFacultyTitleController::options');
    $routes->post('faculty-titles/part-time', 'Api\PartTimeFacultyTitleController::mutate');
    $routes->put('faculty-titles/part-time/(:segment)', 'Api\PartTimeFacultyTitleController::mutate');
    $routes->delete('faculty-titles/part-time/(:segment)', 'Api\PartTimeFacultyTitleController::mutate');
});
