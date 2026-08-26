<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */
$routes->get('/', 'Home::index');

$routes->group('api/v1', static function (RouteCollection $routes): void {
    $routes->get('health', 'Api\\HealthController::index');
    $routes->get('auth/me', 'Api\\AuthController::me');
    $routes->options('auth/me', 'Api\\AuthController::options');
    $routes->post('auth/change-password', 'Api\\AuthController::changePassword');
    $routes->options('auth/change-password', 'Api\\AuthController::options');

    // Admin-Handled Password Reset Requests
    $routes->post('password-reset-requests', 'Api\\PasswordResetRequestController::submit');
    $routes->get('password-reset-requests', 'Api\\PasswordResetRequestController::list');
    $routes->options('password-reset-requests', 'Api\\PasswordResetRequestController::options');
    $routes->post('password-reset-requests/(:segment)/reset', 'Api\\PasswordResetRequestController::reset/$1');
    $routes->options('password-reset-requests/(:segment)/reset', 'Api\\PasswordResetRequestController::options');
    $routes->post('password-reset-requests/(:segment)/reject', 'Api\\PasswordResetRequestController::reject/$1');
    $routes->options('password-reset-requests/(:segment)/reject', 'Api\\PasswordResetRequestController::options');

    // Personnel Role & Scope Management
    $routes->get('personnel/roles', 'Api\\PersonnelRoleController::index');
    $routes->options('personnel/roles', 'Api\\PersonnelRoleController::options');
    $routes->post('personnel/(:segment)/roles', 'Api\\PersonnelRoleController::assign/$1');
    $routes->options('personnel/(:segment)/roles', 'Api\\PersonnelRoleController::options');
    $routes->delete('personnel/(:segment)/roles/(:segment)', 'Api\\PersonnelRoleController::revoke/$1/$2');
    $routes->options('personnel/(:segment)/roles/(:segment)', 'Api\\PersonnelRoleController::options');

    // Account Provisioning
    $routes->post('provisioning/manual-student', 'Api\\ProvisioningController::manualStudent');
    $routes->options('provisioning/manual-student', 'Api\\ProvisioningController::options');
    $routes->post('provisioning/manual-personnel', 'Api\\ProvisioningController::manualPersonnel');
    $routes->options('provisioning/manual-personnel', 'Api\\ProvisioningController::options');
    $routes->post('provisioning/preview-roster', 'Api\\ProvisioningController::previewRoster');
    $routes->options('provisioning/preview-roster', 'Api\\ProvisioningController::options');
    $routes->post('provisioning/commit-roster', 'Api\\ProvisioningController::commitRoster');
    $routes->options('provisioning/commit-roster', 'Api\\ProvisioningController::options');

    // Account Lifecycle & Audit History
    $routes->post('accounts/(:segment)/suspend', 'Api\\AccountLifecycleController::suspend/$1');
    $routes->options('accounts/(:segment)/suspend', 'Api\\AccountLifecycleController::options');
    $routes->post('accounts/(:segment)/archive', 'Api\\AccountLifecycleController::archive/$1');
    $routes->options('accounts/(:segment)/archive', 'Api\\AccountLifecycleController::options');
    $routes->post('accounts/(:segment)/restore', 'Api\\AccountLifecycleController::restore/$1');
    $routes->options('accounts/(:segment)/restore', 'Api\\AccountLifecycleController::options');
    $routes->get('accounts/(:segment)/lifecycle', 'Api\\AccountLifecycleController::events/$1');
    $routes->options('accounts/(:segment)/lifecycle', 'Api\\AccountLifecycleController::options');

    // Achievements & Portfolio Domain
    $routes->get('achievements', 'Api\\AchievementController::index');
    $routes->options('achievements', 'Api\\AchievementController::options');
    $routes->post('achievements', 'Api\\AchievementController::create');

    // Personnel portfolio accomplishments (authoritative persistence)
    $routes->get('personnel/accomplishments', 'Api\\PersonnelAccomplishmentController::index');
    $routes->post('personnel/accomplishments', 'Api\\PersonnelAccomplishmentController::create');
    $routes->options('personnel/accomplishments', 'Api\\PersonnelAccomplishmentController::options');
    $routes->post('personnel/accomplishments/(:segment)/evidence', 'Api\\PersonnelAccomplishmentController::addEvidence/$1');
    $routes->options('personnel/accomplishments/(:segment)/evidence', 'Api\\PersonnelAccomplishmentController::options');

    // Verification Queue & Decisions
    $routes->get('verification/queue', 'Api\\VerificationQueueController::queue');
    $routes->options('verification/queue', 'Api\\VerificationQueueController::options');
    $routes->post('verification/(:segment)/decide', 'Api\\VerificationQueueController::decide/$1');
    $routes->options('verification/(:segment)/decide', 'Api\\VerificationQueueController::options');

    // Official Events & Certificates
    $routes->get('events', 'Api\\EventController::index');
    $routes->options('events', 'Api\\EventController::options');
    $routes->post('events', 'Api\\EventController::create');
    $routes->post('events/(:segment)/participants', 'Api\\EventController::addParticipants/$1');
    $routes->options('events/(:segment)/participants', 'Api\\EventController::options');

    // =========================================================================
    // HR Personnel Directory & Governance (Phases 3-7, 14-15)
    // =========================================================================

    // Authoritative Personnel Directory
    $routes->get('hr/personnel', 'Api\\HRPersonnelController::directory');
    $routes->options('hr/personnel', 'Api\\HRPersonnelController::options');

    // Dean role assignment / revocation
    $routes->post('hr/personnel/(:segment)/dean-role', 'Api\\HRPersonnelController::assignDean/$1');
    $routes->delete('hr/personnel/(:segment)/dean-role/(:segment)', 'Api\\HRPersonnelController::revokeDean/$1/$2');
    $routes->options('hr/personnel/(:segment)/dean-role', 'Api\\HRPersonnelController::options');
    $routes->options('hr/personnel/(:segment)/dean-role/(:segment)', 'Api\\HRPersonnelController::options');

    // Prerequisite Qualification Report gate
    $routes->post('hr/personnel/(:segment)/qualification-reviews', 'Api\\HRPersonnelController::recordQualification/$1');
    $routes->get('hr/personnel/(:segment)/qualification-reviews', 'Api\\HRPersonnelController::listQualificationReviews/$1');
    $routes->options('hr/personnel/(:segment)/qualification-reviews', 'Api\\HRPersonnelController::options');

    // HR Dashboard live KPIs
    $routes->get('hr/dashboard', 'Api\\HRPersonnelController::dashboard');
    $routes->options('hr/dashboard', 'Api\\HRPersonnelController::options');

    // HR Audit Trail
    $routes->get('hr/audit', 'Api\\HRPersonnelController::audit');
    $routes->options('hr/audit', 'Api\\HRPersonnelController::options');

    // =========================================================================
    // HR Personnel Ranking Evaluations (Phases 8-13)
    // =========================================================================
    $routes->get('hr/evaluations', 'Api\\HREvaluationController::list');
    $routes->options('hr/evaluations', 'Api\\HREvaluationController::options');
    $routes->get('hr/evaluations/(:segment)', 'Api\\HREvaluationController::get/$1');

    // State machine transitions
    $routes->post('hr/evaluations/(:segment)/start', 'Api\\HREvaluationController::start/$1');
    $routes->options('hr/evaluations/(:segment)/start', 'Api\\HREvaluationController::options');
    $routes->post('hr/evaluations/(:segment)/return', 'Api\\HREvaluationController::returnEvaluation/$1');
    $routes->options('hr/evaluations/(:segment)/return', 'Api\\HREvaluationController::options');
    $routes->post('hr/evaluations/(:segment)/ready', 'Api\\HREvaluationController::markReady/$1');
    $routes->options('hr/evaluations/(:segment)/ready', 'Api\\HREvaluationController::options');
    $routes->post('hr/evaluations/(:segment)/finalize', 'Api\\HREvaluationController::finalizeEvaluation/$1');
    $routes->options('hr/evaluations/(:segment)/finalize', 'Api\\HREvaluationController::options');

    // Evidence verification + scoring
    $routes->patch('hr/evaluations/(:segment)/items/(:segment)/verify', 'Api\\HREvaluationController::verifyItem/$1/$2');
    $routes->options('hr/evaluations/(:segment)/items/(:segment)/verify', 'Api\\HREvaluationController::options');
    $routes->patch('hr/evaluations/(:segment)/items/(:segment)/rate', 'Api\\HREvaluationController::rateItem/$1/$2');
    $routes->options('hr/evaluations/(:segment)/items/(:segment)/rate', 'Api\\HREvaluationController::options');

    // Final points-summary report
    $routes->get('hr/evaluations/(:segment)/report', 'Api\\HREvaluationController::getReport/$1');
    $routes->options('hr/evaluations/(:segment)/report', 'Api\\HREvaluationController::options');

    // Deficiency / Additional Evidence Workflow
    $routes->post('hr/evaluations/(:segment)/deficiencies', 'Api\\HREvaluationController::createDeficiency/$1');
    $routes->get('hr/evaluations/(:segment)/deficiencies', 'Api\\HREvaluationController::listDeficiencies/$1');
    $routes->options('hr/evaluations/(:segment)/deficiencies', 'Api\\HREvaluationController::options');
    $routes->post('hr/evaluations/(:segment)/deficiencies/(:segment)/respond', 'Api\\HREvaluationController::respondDeficiency/$1/$2');
    $routes->options('hr/evaluations/(:segment)/deficiencies/(:segment)/respond', 'Api\\HREvaluationController::options');
    $routes->post('hr/evaluations/(:segment)/deficiencies/(:segment)/resolve', 'Api\\HREvaluationController::resolveDeficiency/$1/$2');
    $routes->options('hr/evaluations/(:segment)/deficiencies/(:segment)/resolve', 'Api\\HREvaluationController::options');
    $routes->post('hr/evaluations/(:segment)/deficiencies/(:segment)/cancel', 'Api\\HREvaluationController::cancelDeficiency/$1/$2');
    $routes->options('hr/evaluations/(:segment)/deficiencies/(:segment)/cancel', 'Api\\HREvaluationController::options');

    // General evaluation options catch-all (must come last under hr/evaluations)
    $routes->options('hr/evaluations/(:segment)', 'Api\\HREvaluationController::options');
});
