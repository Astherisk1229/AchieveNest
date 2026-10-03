<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use App\Controllers\Api\TargetProvisioningController;
use App\Controllers\Api\HRPersonnelController;
use Config\Services;

class VerifyHRPersonnelProvisioningDirectory extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:hr-personnel-directory';
    protected $description = 'Verifies HR Personnel Provisioning -> DB Persistence -> Directory Retrieval, Placement Affiliations, Duplicate & Authorization Guards.';

    private function genUuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            random_int(0, 0xffff), random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0x0fff) | 0x4000,
            random_int(0, 0x3fff) | 0x8000,
            random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff)
        );
    }

    private function initCtrl($controller, $authHeader, $body = null, $queryParams = [])
    {
        $uri = new \CodeIgniter\HTTP\URI();
        $request = new \CodeIgniter\HTTP\IncomingRequest(
            config('App'),
            $uri,
            null,
            new \CodeIgniter\HTTP\UserAgent()
        );
        $response = Services::response();
        $logger = Services::logger();

        if ($authHeader !== null) {
            $request->setHeader('Authorization', $authHeader);
        }

        if ($body !== null) {
            $request->setHeader('Content-Type', 'application/json');
            $request->setBody(is_string($body) ? $body : json_encode($body));
        }

        if (! empty($queryParams)) {
            $request->setGlobal('get', $queryParams);
        }

        $controller->initController($request, $response, $logger);
        return $controller;
    }

    public function run(array $params)
    {
        CLI::write("========================================================================", 'cyan');
        CLI::write("HR Personnel Directory & Secure Provisioning Verification Suite", 'cyan');
        CLI::write("========================================================================", 'cyan');

        $passed = 0;
        $failed = 0;
        $db = db_connect();

        $hrAdmin = $db->table('profiles p')
            ->select('p.*')
            ->join('profile_roles pr', 'pr.profile_id = p.id AND pr.is_active = 1')
            ->join('roles r', 'r.id = pr.role_id')
            ->where('p.account_type', 'hr_admin')
            ->where('r.role_key', 'hr_staff')
            ->where('p.status', 'active')
            ->get()->getRowArray();

        if ($hrAdmin === null) {
            CLI::write(" [SETUP] Creating test HR Admin actor...", 'yellow');
            $hrAdminId = $this->genUuid();
            $now = date('Y-m-d H:i:s');
            $db->table('profiles')->insert([
                'id'                => $hrAdminId,
                'institutional_id'  => 'HR-TEST-' . random_int(1000, 9999),
                'email'             => 'hr.test.' . random_int(1000, 9999) . '@ndmu.edu.ph',
                'first_name'        => 'HR',
                'last_name'         => 'Administrator',
                'full_name'         => 'HR Administrator',
                'account_type'      => 'hr_admin',
                'status'            => 'active',
                'password_hash'     => password_hash('TestPass123!', PASSWORD_DEFAULT),
                'created_at'        => $now,
                'updated_at'        => $now,
            ]);
            $hrRole = $db->table('roles')->where('role_key', 'hr_staff')->get()->getRowArray();
            if ($hrRole) {
                $db->table('profile_roles')->insert([
                    'id'          => $this->genUuid(),
                    'profile_id'  => $hrAdminId,
                    'role_id'     => $hrRole['id'],
                    'scope_type'  => 'university',
                    'is_active'   => 1,
                    'assigned_by' => $hrAdminId,
                    'assigned_at' => $now,
                ]);
            }
            $hrAdmin = $db->table('profiles')->where('id', $hrAdminId)->get()->getRowArray();
        }

        // Mock actor service
        $mockActorService = new class($hrAdmin) extends \App\Services\AuthenticatedActorService {
            private $actor;
            public function __construct($actor) { $this->actor = $actor; }
            public function resolveActor(?string $authorizationHeader = null): ?array {
                if ($authorizationHeader === 'Bearer invalid_token' || empty($authorizationHeader)) return null;
                if ($authorizationHeader === 'Bearer student_token') {
                    return [
                        'profile' => ['id' => 'stud-1', 'account_type' => 'student', 'status' => 'active'],
                        'roles'   => ['student']
                    ];
                }
                return [
                    'profile' => $this->actor,
                    'roles'   => ['hr_staff']
                ];
            }
        };

        $mockAuthzService = new class($hrAdmin) extends \App\Services\AuthorizationService {
            private $actor;
            public function __construct($actor) { $this->actor = $actor; }
            public function resolveActor(?string $authorizationHeader = null): ?array {
                if ($authorizationHeader === 'Bearer invalid_token' || empty($authorizationHeader)) return null;
                if ($authorizationHeader === 'Bearer student_token') {
                    return [
                        'profile' => ['id' => 'stud-1', 'account_type' => 'student', 'status' => 'active'],
                        'roles'   => ['student']
                    ];
                }
                return [
                    'profile' => $this->actor,
                    'roles'   => ['hr_staff']
                ];
            }
            public function hasRole(array $actor, string $role): bool {
                return in_array($role, $actor['roles'] ?? [], true);
            }
        };

        // Fetch valid College & Program
        $college = $db->table('colleges')->where('status', 'active')->get()->getRowArray();
        $program = $db->table('academic_programs')->where('college_id', $college['id'])->where('status', 'active')->get()->getRowArray();
        $adminUnit = $db->table('administrative_units')->where('status', 'active')->get()->getRowArray();

        // ---------------------------------------------------------------------
        // Test 1: Create Academic Personnel -> DB Verification -> Directory Retrieval
        // ---------------------------------------------------------------------
        CLI::write("\n--- Test 1: Academic Personnel Provisioning & Directory Visibility ---", 'yellow');
        $acadInstId = '9000' . random_int(100000, 999999);
        $acadEmail  = 'academic.test.' . random_int(1000, 9999) . '@ndmu.edu.ph';

        $acadPayload = [
            'institutional_id'         => $acadInstId,
            'institutional_email'      => $acadEmail,
            'first_name'               => 'TestAcademic',
            'middle_name'              => 'Middle',
            'last_name'                => 'Faculty',
            'personnel_group'          => 'faculty',
            'organizational_side'      => 'academic',
            'personnel_classification' => 'academic',
            'college_id'               => $college['id'],
            'academic_program_ids'     => [$program['id']],
            'faculty_engagement'       => 'full_time_faculty',
            'employment_status'        => 'permanent',
            'position_title'           => 'Assistant Professor',
            'current_rank_title'       => 'Assistant Professor',
        ];

        $provController = $this->initCtrl(new TargetProvisioningController($mockActorService), 'Bearer valid_hr_token', $acadPayload);
        $createResp = $provController->manualPersonnel();
        $createStatus = $createResp->getStatusCode();
        $createBody = json_decode($createResp->getBody(), true);

        if ($createStatus === 201 && ! empty($createBody['data']['id'])) {
            $createdAcadId = $createBody['data']['id'];
            CLI::write(" [PASS] 1.1: Academic Personnel created with HTTP 201 (UUID: {$createdAcadId})", 'green');
            $passed++;

            // Verify database records
            $profile = $db->table('profiles')->where('id', $createdAcadId)->get()->getRowArray();
            $personnelProfile = $db->table('personnel_profiles')->where('profile_id', $createdAcadId)->get()->getRowArray();
            $collegeAff = $db->table('personnel_college_affiliations')->where('personnel_profile_id', $createdAcadId)->where('is_active', 1)->get()->getRowArray();
            $programAff = $db->table('personnel_program_affiliations')->where('personnel_profile_id', $createdAcadId)->where('is_active', 1)->get()->getRowArray();
            $roles = $db->table('profile_roles')->where('profile_id', $createdAcadId)->where('is_active', 1)->get()->getResultArray();

            if ($profile !== null && $profile['account_type'] === 'personnel' && $personnelProfile !== null && $collegeAff !== null && $programAff !== null && count($roles) > 0) {
                CLI::write(" [PASS] 1.2: DB persistence verified across profiles, personnel_profiles, affiliations, and roles", 'green');
                $passed++;
            } else {
                CLI::write(" [FAIL] 1.2: DB records missing for created Academic Personnel", 'red');
                $failed++;
            }

            // Call Directory Endpoint directly
            $hrController = $this->initCtrl(new HRPersonnelController($mockAuthzService), 'Bearer valid_hr_token', null, ['per_page' => 100]);
            try {
                $dirResp = $hrController->directory();
                $dirStatus = $dirResp->getStatusCode();
                $dirBody = json_decode($dirResp->getBody(), true);
                $dirPersonnel = $dirBody['data']['personnel'] ?? [];
            } catch (\Throwable $e) {
                CLI::write(" [EXCEPTION IN DIRECTORY] " . $e->getMessage(), 'red');
                CLI::write(" [DB ERROR] " . json_encode($db->error()), 'red');
                return 1;
            }

            $foundAcad = null;
            foreach ($dirPersonnel as $p) {
                if ($p['id'] === $createdAcadId) {
                    $foundAcad = $p;
                    break;
                }
            }

            if ($dirStatus === 200 && $foundAcad !== null
                && $foundAcad['personnel_classification'] === 'academic'
                && $foundAcad['college_id'] === $college['id']
                && ! empty($foundAcad['academic_programs'])
                && in_array('personnel', $foundAcad['assigned_roles'], true)) {
                CLI::write(" [PASS] 1.3: Directory retrieval returned created Academic Personnel with authoritative affiliations and roles", 'green');
                $passed++;
            } else {
                CLI::write(" [FAIL] 1.3: Academic Personnel not found or incomplete in Directory API response", 'red');
                $failed++;
            }
        } else {
            CLI::write(" [FAIL] 1.1: Academic Personnel creation failed: " . json_encode($createBody), 'red');
            $failed++;
        }

        // ---------------------------------------------------------------------
        // Test 2: Create Non-Academic Personnel -> DB Verification -> Directory Retrieval
        // ---------------------------------------------------------------------
        CLI::write("\n--- Test 2: Non-Academic Personnel Provisioning & Directory Visibility ---", 'yellow');
        $nonAcadInstId = '9000' . random_int(100000, 999999);
        $nonAcadEmail  = 'nonacademic.test.' . random_int(1000, 9999) . '@ndmu.edu.ph';

        $nonAcadPayload = [
            'institutional_id'         => $nonAcadInstId,
            'institutional_email'      => $nonAcadEmail,
            'first_name'               => 'TestNonAcademic',
            'last_name'                => 'Staff',
            'personnel_group'          => 'non_teaching_faculty',
            'organizational_side'      => 'non_academic',
            'personnel_classification' => 'non_academic',
            'administrative_unit_id'   => $adminUnit['id'],
            'faculty_engagement'       => 'full_time_faculty',
            'employment_status'        => 'permanent',
            'position_title'           => 'Administrative Specialist',
        ];

        $provController = $this->initCtrl(new TargetProvisioningController($mockActorService), 'Bearer valid_hr_token', $nonAcadPayload);
        $createResp2 = $provController->manualPersonnel();
        $createStatus2 = $createResp2->getStatusCode();
        $createBody2 = json_decode($createResp2->getBody(), true);

        if ($createStatus2 === 201 && ! empty($createBody2['data']['id'])) {
            $createdNonAcadId = $createBody2['data']['id'];
            CLI::write(" [PASS] 2.1: Non-Academic Personnel created with HTTP 201 (UUID: {$createdNonAcadId})", 'green');
            $passed++;

            $unitAff = $db->table('personnel_administrative_unit_affiliations')->where('personnel_profile_id', $createdNonAcadId)->where('is_active', 1)->get()->getRowArray();
            $acadAffCount = $db->table('personnel_college_affiliations')->where('personnel_profile_id', $createdNonAcadId)->countAllResults();

            if ($unitAff !== null && $acadAffCount === 0) {
                CLI::write(" [PASS] 2.2: DB non-academic unit affiliation verified and zero academic college affiliations present", 'green');
                $passed++;
            } else {
                CLI::write(" [FAIL] 2.2: DB affiliation inconsistency for Non-Academic Personnel", 'red');
                $failed++;
            }

            // Verify in Directory
            $hrController = $this->initCtrl(new HRPersonnelController($mockAuthzService), 'Bearer valid_hr_token', null, ['per_page' => 100]);
            $dirResp2 = $hrController->directory();
            $dirBody2 = json_decode($dirResp2->getBody(), true);
            $dirPersonnel2 = $dirBody2['data']['personnel'] ?? [];

            $foundNonAcad = null;
            foreach ($dirPersonnel2 as $p) {
                if ($p['id'] === $createdNonAcadId) {
                    $foundNonAcad = $p;
                    break;
                }
            }

            if ($foundNonAcad !== null
                && $foundNonAcad['personnel_classification'] === 'non_academic'
                && $foundNonAcad['administrative_unit_id'] === $adminUnit['id']
                && $foundNonAcad['administrative_unit_name'] === $adminUnit['name']
                && in_array('personnel', $foundNonAcad['assigned_roles'], true)) {
                CLI::write(" [PASS] 2.3: Directory retrieval returned created Non-Academic Personnel with authoritative unit placement", 'green');
                $passed++;
            } else {
                CLI::write(" [FAIL] 2.3: Non-Academic Personnel not found or incomplete in Directory API response", 'red');
                $failed++;
            }
        } else {
            CLI::write(" [FAIL] 2.1: Non-Academic Personnel creation failed: " . json_encode($createBody2), 'red');
            $failed++;
        }

        // ---------------------------------------------------------------------
        // Test 3: Duplicate Protection (HTTP 409)
        // ---------------------------------------------------------------------
        CLI::write("\n--- Test 3: Duplicate ID and Email Conflict Guards (HTTP 409) ---", 'yellow');

        // Duplicate Institutional ID
        $dupIdPayload = $acadPayload;
        $dupIdPayload['institutional_email'] = 'unique.' . random_int(1000, 9999) . '@ndmu.edu.ph';
        $provController = $this->initCtrl(new TargetProvisioningController($mockActorService), 'Bearer valid_hr_token', $dupIdPayload);
        $dupIdResp = $provController->manualPersonnel();

        if ($dupIdResp->getStatusCode() === 409) {
            CLI::write(" [PASS] 3.1: Duplicate institutional ID rejected with HTTP 409 Conflict", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] 3.1: Duplicate ID returned status " . $dupIdResp->getStatusCode(), 'red');
            $failed++;
        }

        // Duplicate Institutional Email
        $dupEmailPayload = $acadPayload;
        $dupEmailPayload['institutional_id'] = '9000' . random_int(100000, 999999);
        $provController = $this->initCtrl(new TargetProvisioningController($mockActorService), 'Bearer valid_hr_token', $dupEmailPayload);
        $dupEmailResp = $provController->manualPersonnel();

        if ($dupEmailResp->getStatusCode() === 409) {
            CLI::write(" [PASS] 3.2: Duplicate institutional email rejected with HTTP 409 Conflict", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] 3.2: Duplicate email returned status " . $dupEmailResp->getStatusCode(), 'red');
            $failed++;
        }

        // ---------------------------------------------------------------------
        // Test 4: Payload Validation Guards (HTTP 422)
        // ---------------------------------------------------------------------
        CLI::write("\n--- Test 4: Payload Validation & Domain Policy Guards (HTTP 422) ---", 'yellow');

        // Invalid email domain
        $invalidDomainPayload = $acadPayload;
        $invalidDomainPayload['institutional_id'] = '9000' . random_int(100000, 999999);
        $invalidDomainPayload['institutional_email'] = 'user@gmail.com';
        $provController = $this->initCtrl(new TargetProvisioningController($mockActorService), 'Bearer valid_hr_token', $invalidDomainPayload);
        $invDomResp = $provController->manualPersonnel();

        if ($invDomResp->getStatusCode() === 422) {
            CLI::write(" [PASS] 4.1: Non-NDMU email domain strictly rejected with HTTP 422", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] 4.1: Non-NDMU email returned status " . $invDomResp->getStatusCode(), 'red');
            $failed++;
        }

        // Missing academic college & program
        $missingAffPayload = $acadPayload;
        $missingAffPayload['institutional_id'] = '9000' . random_int(100000, 999999);
        $missingAffPayload['institutional_email'] = 'noaff.' . random_int(1000, 9999) . '@ndmu.edu.ph';
        $missingAffPayload['college_id'] = null;
        $missingAffPayload['academic_program_ids'] = [];
        $provController = $this->initCtrl(new TargetProvisioningController($mockActorService), 'Bearer valid_hr_token', $missingAffPayload);
        $missingAffResp = $provController->manualPersonnel();

        if ($missingAffResp->getStatusCode() === 422) {
            CLI::write(" [PASS] 4.2: Academic personnel missing college/programs rejected with HTTP 422", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] 4.2: Missing affiliation returned status " . $missingAffResp->getStatusCode(), 'red');
            $failed++;
        }

        // ---------------------------------------------------------------------
        // Test 5: Authorization Guards (HTTP 401 & 403)
        // ---------------------------------------------------------------------
        CLI::write("\n--- Test 5: Authentication and Authorization Security Guards ---", 'yellow');

        // Unauthenticated
        $provController = $this->initCtrl(new TargetProvisioningController($mockActorService), 'Bearer invalid_token', $acadPayload);
        $unauthResp = $provController->manualPersonnel();

        if ($unauthResp->getStatusCode() === 401) {
            CLI::write(" [PASS] 5.1: Unauthenticated request rejected with HTTP 401 Unauthorized", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] 5.1: Unauthenticated request returned status " . $unauthResp->getStatusCode(), 'red');
            $failed++;
        }

        // Student actor attempting HR provisioning
        $provController = $this->initCtrl(new TargetProvisioningController($mockActorService), 'Bearer student_token', $acadPayload);
        $studentResp = $provController->manualPersonnel();

        if ($studentResp->getStatusCode() === 403) {
            CLI::write(" [PASS] 5.2: Student actor attempting HR provisioning rejected with HTTP 403 Forbidden", 'green');
            $passed++;
        } else {
            CLI::write(" [FAIL] 5.2: Student actor returned status " . $studentResp->getStatusCode(), 'red');
            $failed++;
        }

        CLI::write("\n========================================================================", 'cyan');
        CLI::write("Total Passed: {$passed} | Total Failed: {$failed}", $failed === 0 ? 'green' : 'red');
        CLI::write("========================================================================", 'cyan');

        return $failed === 0 ? 0 : 1;
    }
}
