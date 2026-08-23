<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */
$routes->get('/', 'Home::index');

$routes->group('api/v1', static function (RouteCollection $routes): void {
    $routes->get('health', 'Api\\HealthController::index');
    $routes->get('auth/me', 'Api\\AuthController::me');
    $routes->options('auth/me', 'Api\\AuthController::options');

    // Personnel Role & Scope Management
    $routes->get('personnel/roles', 'Api\\PersonnelRoleController::index');
    $routes->options('personnel/roles', 'Api\\PersonnelRoleController::options');
    $routes->post('personnel/(:segment)/roles', 'Api\\PersonnelRoleController::assign/$1');
    $routes->options('personnel/(:segment)/roles', 'Api\\PersonnelRoleController::options');
    $routes->delete('personnel/(:segment)/roles/(:segment)', 'Api\\PersonnelRoleController::revoke/$1/$2');
    $routes->options('personnel/(:segment)/roles/(:segment)', 'Api\\PersonnelRoleController::options');

    // Account Provisioning (Phase 4)
    $routes->post('provisioning/manual-student', 'Api\\ProvisioningController::manualStudent');
    $routes->options('provisioning/manual-student', 'Api\\ProvisioningController::options');
    $routes->post('provisioning/manual-personnel', 'Api\\ProvisioningController::manualPersonnel');
    $routes->options('provisioning/manual-personnel', 'Api\\ProvisioningController::options');
    $routes->post('provisioning/preview-roster', 'Api\\ProvisioningController::previewRoster');
    $routes->options('provisioning/preview-roster', 'Api\\ProvisioningController::options');

    // Account Lifecycle & Audit History (Phase 5)
    $routes->post('accounts/(:segment)/suspend', 'Api\\AccountLifecycleController::suspend/$1');
    $routes->options('accounts/(:segment)/suspend', 'Api\\AccountLifecycleController::options');
    $routes->post('accounts/(:segment)/archive', 'Api\\AccountLifecycleController::archive/$1');
    $routes->options('accounts/(:segment)/archive', 'Api\\AccountLifecycleController::options');
    $routes->post('accounts/(:segment)/restore', 'Api\\AccountLifecycleController::restore/$1');
    $routes->options('accounts/(:segment)/restore', 'Api\\AccountLifecycleController::options');
    $routes->get('accounts/(:segment)/lifecycle', 'Api\\AccountLifecycleController::events/$1');
    $routes->options('accounts/(:segment)/lifecycle', 'Api\\AccountLifecycleController::options');

    // Achievements & Portfolio Domain (Phase 6)
    $routes->get('achievements', 'Api\\AchievementController::index');
    $routes->options('achievements', 'Api\\AchievementController::options');
    $routes->post('achievements', 'Api\\AchievementController::create');
    $routes->options('achievements', 'Api\\AchievementController::options');

    // Verification Queue & Decisions
    $routes->get('verification/queue', 'Api\\VerificationQueueController::queue');
    $routes->options('verification/queue', 'Api\\VerificationQueueController::options');
    $routes->post('verification/(:segment)/decide', 'Api\\VerificationQueueController::decide/$1');
    $routes->options('verification/(:segment)/decide', 'Api\\VerificationQueueController::options');

    // Official Events & Certificates
    $routes->get('events', 'Api\\EventController::index');
    $routes->options('events', 'Api\\EventController::options');
    $routes->post('events', 'Api\\EventController::create');
    $routes->options('events', 'Api\\EventController::options');
    $routes->post('events/(:segment)/participants', 'Api\\EventController::addParticipants/$1');
    $routes->options('events/(:segment)/participants', 'Api\\EventController::options');
});
