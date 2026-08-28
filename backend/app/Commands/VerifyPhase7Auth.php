<?php

namespace App\Commands;

use App\Controllers\Api\AuthController;
use App\Controllers\Api\PasswordResetRequestController;
use App\Controllers\Api\TargetProvisioningController;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\SiteURIFactory;
use CodeIgniter\HTTP\UserAgent;
use Config\App;

class VerifyPhase7Auth extends BaseCommand
{
    protected $group       = 'Testing';
    protected $name        = 'test:phase7-auth';
    protected $description = 'Executes complete Phase 7 local authentication test matrix.';

    private function makeRequest(string $method, string $uri, array $body = [], ?string $bearerToken = null): IncomingRequest
    {
        $appConfig = config(App::class);
        $uriFactory = new SiteURIFactory($appConfig, service('superglobals'));
        $siteURI = $uriFactory->createFromString($uri);

        $server = [
            'REQUEST_METHOD' => strtoupper($method),
            'REQUEST_URI'    => $uri,
            'REMOTE_ADDR'    => '127.0.0.1',
            'HTTP_USER_AGENT'=> 'Phase7Validator/1.0',
        ];

        if ($bearerToken !== null) {
            $server['HTTP_AUTHORIZATION'] = 'Bearer ' . $bearerToken;
        }

        $request = new IncomingRequest($appConfig, $siteURI, json_encode($body), new UserAgent());
        $request->setMethod($method);
        if ($bearerToken !== null) {
            $request->setHeader('Authorization', 'Bearer ' . $bearerToken);
        }
        $request->setHeader('Content-Type', 'application/json');

        return $request;
    }

    public function run(array $params)
    {
        $allPassed = true;
        $testCount = 0;
        $passCount = 0;

        $check = function (string $testName, bool $condition, string $details = '') use (&$allPassed, &$testCount, &$passCount) {
            $testCount++;
            if ($condition) {
                $passCount++;
                CLI::write("  [PASS] $testName" . ($details ? " ($details)" : ''), 'green');
            } else {
                $allPassed = false;
                CLI::write("  [FAIL] $testName: $details", 'red');
            }
        };

        CLI::write("\n=== ACHIEVENEST PHASE 7 LOCAL AUTHENTICATION TEST SUITE ===\n", 'yellow');

        // Reset test data
        $seeder = \Config\Database::seeder();
        $seeder->call('App\\Database\\Seeds\\LocalDefenseAuthSeeder');

        // Test 1: Student Login
        $authController = new AuthController();
        $req = $this->makeRequest('POST', 'http://localhost:8080/api/v1/auth/login', [
            'institutional_email' => 'student.01@ndmu.edu.ph',
            'password'            => 'Password123!@#',
        ]);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->login();
        $body = json_decode($resp->getBody(), true);
        $studentToken = $body['data']['access_token'] ?? null;
        $check('1. Student Login', $resp->getStatusCode() === 200 && !empty($studentToken), 'Status 200, JWT returned');

        // Test 2: Student /auth/me
        $req = $this->makeRequest('GET', 'http://localhost:8080/api/v1/auth/me', [], $studentToken);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->me();
        $body = json_decode($resp->getBody(), true);
        $roles = $body['data']['user']['roles'] ?? [];
        $placement = $body['data']['user']['academic_placement'] ?? null;
        $check('2. Student /auth/me identity & placement', in_array('student', $roles, true) && !empty($placement['academic_program_code']), 'Role=student, Program=' . ($placement['academic_program_code'] ?? 'none'));

        // Test 3: Must Change Password on Maria Santos
        $req = $this->makeRequest('POST', 'http://localhost:8080/api/v1/auth/login', [
            'institutional_email' => 'student.02@ndmu.edu.ph',
            'password'            => 'Password123!@#',
        ]);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->login();
        $body = json_decode($resp->getBody(), true);
        $mariaToken = $body['data']['access_token'] ?? null;
        $mustChange = $body['data']['must_change_password'] ?? false;
        $check('3. must_change_password flag on login', $mustChange === true, 'must_change_password=true');

        // Test 4: Change Password
        $req = $this->makeRequest('POST', 'http://localhost:8080/api/v1/auth/change-password', [
            'new_password'     => 'NewSecretPass123!@#',
            'confirm_password' => 'NewSecretPass123!@#',
        ], $mariaToken);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->changePassword();
        $body = json_decode($resp->getBody(), true);
        $check('4. Password Change Execution', $resp->getStatusCode() === 200 && $body['data']['must_change_password'] === false, 'Status 200, must_change_password=false');

        // Test 5: Old password rejected
        $req = $this->makeRequest('POST', 'http://localhost:8080/api/v1/auth/login', [
            'institutional_email' => 'student.02@ndmu.edu.ph',
            'password'            => 'Password123!@#',
        ]);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->login();
        $check('5. Old Password Rejected', $resp->getStatusCode() === 401, 'Status 401');

        // Test 6: New password accepted
        $req = $this->makeRequest('POST', 'http://localhost:8080/api/v1/auth/login', [
            'institutional_email' => 'student.02@ndmu.edu.ph',
            'password'            => 'NewSecretPass123!@#',
        ]);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->login();
        $body = json_decode($resp->getBody(), true);
        $mariaNewToken = $body['data']['access_token'] ?? null;
        $check('6. New Password Accepted', $resp->getStatusCode() === 200 && !empty($mariaNewToken), 'Status 200, must_change_password=false');

        // Test 7: Prior session revoked on password change
        $req = $this->makeRequest('GET', 'http://localhost:8080/api/v1/auth/me', [], $mariaToken);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->me();
        $check('7. Old Session Revoked After Password Change', $resp->getStatusCode() === 401, 'Old token rejected with 401');

        // Test 8: Personnel Login & Affiliations
        $req = $this->makeRequest('POST', 'http://localhost:8080/api/v1/auth/login', [
            'institutional_email' => 'faculty.01@ndmu.edu.ph',
            'password'            => 'Password123!@#',
        ]);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->login();
        $body = json_decode($resp->getBody(), true);
        $facToken = $body['data']['access_token'] ?? null;
        $req = $this->makeRequest('GET', 'http://localhost:8080/api/v1/auth/me', [], $facToken);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->me();
        $body = json_decode($resp->getBody(), true);
        $check('8. Academic Personnel Affiliations', !empty($body['data']['user']['personnel_affiliation']['college_code']), 'College=' . ($body['data']['user']['personnel_affiliation']['college_code'] ?? 'none'));

        // Test 9: HR Admin Login
        $req = $this->makeRequest('POST', 'http://localhost:8080/api/v1/auth/login', [
            'institutional_email' => 'hr.admin01@ndmu.edu.ph',
            'password'            => 'Password123!@#',
        ]);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->login();
        $body = json_decode($resp->getBody(), true);
        $hrToken = $body['data']['access_token'] ?? null;
        $req = $this->makeRequest('GET', 'http://localhost:8080/api/v1/auth/me', [], $hrToken);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->me();
        $body = json_decode($resp->getBody(), true);
        $check('9. HR Admin Role Resolution', in_array('hr_staff', $body['data']['user']['roles'] ?? [], true), 'Roles includes hr_staff');

        // Test 10: OSAD Admin Login
        $req = $this->makeRequest('POST', 'http://localhost:8080/api/v1/auth/login', [
            'institutional_email' => 'osad.admin01@ndmu.edu.ph',
            'password'            => 'Password123!@#',
        ]);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->login();
        $body = json_decode($resp->getBody(), true);
        $osadToken = $body['data']['access_token'] ?? null;
        $req = $this->makeRequest('GET', 'http://localhost:8080/api/v1/auth/me', [], $osadToken);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->me();
        $body = json_decode($resp->getBody(), true);
        $check('10. OSAD Admin Role Resolution', in_array('osad_staff', $body['data']['user']['roles'] ?? [], true), 'Roles includes osad_staff');

        // Test 11: Dean Scope Resolution
        $req = $this->makeRequest('POST', 'http://localhost:8080/api/v1/auth/login', [
            'institutional_email' => 'dean.cet01@ndmu.edu.ph',
            'password'            => 'Password123!@#',
        ]);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->login();
        $body = json_decode($resp->getBody(), true);
        $deanToken = $body['data']['access_token'] ?? null;
        $req = $this->makeRequest('GET', 'http://localhost:8080/api/v1/auth/me', [], $deanToken);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->me();
        $body = json_decode($resp->getBody(), true);
        $hasDean = false;
        foreach ($body['data']['user']['role_assignments'] ?? [] as $asgn) {
            if ($asgn['role_key'] === 'dean' && ($asgn['scope_code'] === 'CET' || $asgn['scope_code'] === 'CEAC')) {
                $hasDean = true;
            }
        }
        $check('11. Dean Governance Role Resolution', $hasDean, 'Dean assignment with college scope resolved');

        // Test 12: Program Coordinator Scope Resolution
        $req = $this->makeRequest('POST', 'http://localhost:8080/api/v1/auth/login', [
            'institutional_email' => 'coord.bscs01@ndmu.edu.ph',
            'password'            => 'Password123!@#',
        ]);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->login();
        $body = json_decode($resp->getBody(), true);
        $coordToken = $body['data']['access_token'] ?? null;
        $req = $this->makeRequest('GET', 'http://localhost:8080/api/v1/auth/me', [], $coordToken);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->me();
        $body = json_decode($resp->getBody(), true);
        $hasCoord = false;
        foreach ($body['data']['user']['role_assignments'] ?? [] as $asgn) {
            if ($asgn['role_key'] === 'program_coordinator' && $asgn['scope_code'] === 'BSCS') {
                $hasCoord = true;
            }
        }
        $check('12. Program Coordinator Role Resolution', $hasCoord, 'Coordinator assignment with BSCS scope resolved');

        // Test 13: Organization Moderator Scope Resolution
        $req = $this->makeRequest('POST', 'http://localhost:8080/api/v1/auth/login', [
            'institutional_email' => 'mod.css01@ndmu.edu.ph',
            'password'            => 'Password123!@#',
        ]);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->login();
        $body = json_decode($resp->getBody(), true);
        $modToken = $body['data']['access_token'] ?? null;
        $req = $this->makeRequest('GET', 'http://localhost:8080/api/v1/auth/me', [], $modToken);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->me();
        $body = json_decode($resp->getBody(), true);
        $hasMod = false;
        foreach ($body['data']['user']['role_assignments'] ?? [] as $asgn) {
            if ($asgn['role_key'] === 'organization_moderator' && $asgn['scope_code'] === 'CSS') {
                $hasMod = true;
            }
        }
        $check('13. Organization Moderator Role Resolution', $hasMod, 'Moderator assignment with CSS scope resolved');

        // Test 14: Suspended Account Login Denied
        $req = $this->makeRequest('POST', 'http://localhost:8080/api/v1/auth/login', [
            'institutional_email' => 'suspended.student@ndmu.edu.ph',
            'password'            => 'Password123!@#',
        ]);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->login();
        $check('14. Suspended Account Denied', $resp->getStatusCode() === 403, 'Status 403');

        // Test 15: Archived Account Login Denied
        $req = $this->makeRequest('POST', 'http://localhost:8080/api/v1/auth/login', [
            'institutional_email' => 'archived.student@ndmu.edu.ph',
            'password'            => 'Password123!@#',
        ]);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->login();
        $check('15. Archived Account Denied', $resp->getStatusCode() === 403, 'Status 403');

        // Test 16: Disabled Credential Login Denied
        $req = $this->makeRequest('POST', 'http://localhost:8080/api/v1/auth/login', [
            'institutional_email' => 'disabled.student@ndmu.edu.ph',
            'password'            => 'Password123!@#',
        ]);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->login();
        $check('16. Disabled Credential Denied', $resp->getStatusCode() === 403, 'Status 403');

        // Test 17: Invalid Password Generic 401
        $req = $this->makeRequest('POST', 'http://localhost:8080/api/v1/auth/login', [
            'institutional_email' => 'student.01@ndmu.edu.ph',
            'password'            => 'WrongPassword123',
        ]);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->login();
        $check('17. Invalid Password Generic 401', $resp->getStatusCode() === 401, 'Status 401');

        // Test 18: Non-existent Email Generic 401
        $req = $this->makeRequest('POST', 'http://localhost:8080/api/v1/auth/login', [
            'institutional_email' => 'nonexistent.user999@ndmu.edu.ph',
            'password'            => 'Password123!@#',
        ]);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->login();
        $check('18. Non-existent Email Generic 401', $resp->getStatusCode() === 401, 'Status 401');

        // Test 19: Non-institutional Email 422
        $req = $this->makeRequest('POST', 'http://localhost:8080/api/v1/auth/login', [
            'institutional_email' => 'outsider@gmail.com',
            'password'            => 'Password123!@#',
        ]);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->login();
        $check('19. Non-institutional Email 422', $resp->getStatusCode() === 422, 'Status 422');

        // Test 20: Tampered JWT Token 401
        $tamperedToken = $studentToken . 'tampered';
        $req = $this->makeRequest('GET', 'http://localhost:8080/api/v1/auth/me', [], $tamperedToken);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->me();
        $check('20. Tampered Token 401', $resp->getStatusCode() === 401, 'Status 401');

        // Test 21: Server-side Logout
        $req = $this->makeRequest('POST', 'http://localhost:8080/api/v1/auth/logout', [], $studentToken);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->logout();
        $check('21. Server-side Logout 200', $resp->getStatusCode() === 200, 'Status 200');

        // Test 22: Logged out Token Rejected
        $req = $this->makeRequest('GET', 'http://localhost:8080/api/v1/auth/me', [], $studentToken);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->me();
        $check('22. Logged out Token Rejected 401', $resp->getStatusCode() === 401, 'Status 401 on revoked session');

        // Test 23: Admin Password Reset Request & Execution
        $resetController = new PasswordResetRequestController();
        // Submit request as student
        $req = $this->makeRequest('POST', 'http://localhost:8080/api/v1/password-reset-requests', [
            'institutional_email' => 'student.01@ndmu.edu.ph',
        ]);
        $resetController->initController($req, response(), service('logger'));
        $resp = $resetController->submit();
        $check('23a. Password Reset Request Submission', $resp->getStatusCode() === 200, 'Status 200');

        // Get request id
        $db = db_connect();
        $latestReq = $db->table('password_reset_requests')->where('institutional_email', 'student.01@ndmu.edu.ph')->where('status', 'pending')->get()->getRowArray();
        $resetReqId = $latestReq['id'] ?? 'none';

        // OSAD resets student password
        $req = $this->makeRequest('POST', "http://localhost:8080/api/v1/password-reset-requests/{$resetReqId}/reset", [], $osadToken);
        $resetController->initController($req, response(), service('logger'));
        $resp = $resetController->reset($resetReqId);
        $body = json_decode($resp->getBody(), true);
        $tempPassword = $body['data']['temporary_password'] ?? null;
        $check('23b. OSAD Admin Reset Execution', $resp->getStatusCode() === 200 && !empty($tempPassword), 'Status 200, temporary password issued');

        // Test login with temp password
        $req = $this->makeRequest('POST', 'http://localhost:8080/api/v1/auth/login', [
            'institutional_email' => 'student.01@ndmu.edu.ph',
            'password'            => $tempPassword,
        ]);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->login();
        $body = json_decode($resp->getBody(), true);
        $check('23c. Login with Temporary Password', $resp->getStatusCode() === 200 && ($body['data']['must_change_password'] ?? false) === true, 'Status 200, must_change_password=true');

        // Test 24: Manual Student Provisioning
        $provController = new TargetProvisioningController();
        $newStudentInstId = '2026' . random_int(100000, 999999);
        $newStudentEmail = 'newstudent.' . random_int(1000, 9999) . '@ndmu.edu.ph';
        $bscs = $db->table('academic_programs')->where('code', 'BSCS')->get()->getRowArray();
        $bscsId = $bscs['id'] ?? '30000000-0000-0000-0000-000000000001';

        $req = $this->makeRequest('POST', 'http://localhost:8080/api/v1/provisioning/manual-student', [
            'institutional_id'    => $newStudentInstId,
            'institutional_email' => $newStudentEmail,
            'first_name'          => 'Alex',
            'last_name'           => 'Reyes',
            'academic_program_id' => $bscsId,
            'year_level'          => '1st Year',
        ], $osadToken);
        $provController->initController($req, response(), service('logger'));
        $resp = $provController->manualStudent();
        $body = json_decode($resp->getBody(), true);
        $newStudentTempPass = $body['data']['temporary_password'] ?? null;
        $check('24a. Manual Student Provisioning', $resp->getStatusCode() === 201 && !empty($newStudentTempPass), 'Status: ' . $resp->getStatusCode() . ' Body: ' . json_encode($body));

        // Verify newly provisioned student can login
        $req = $this->makeRequest('POST', 'http://localhost:8080/api/v1/auth/login', [
            'institutional_email' => $newStudentEmail,
            'password'            => $newStudentTempPass,
        ]);
        $authController->initController($req, response(), service('logger'));
        $resp = $authController->login();
        $body = json_decode($resp->getBody(), true);
        $check('24b. Newly Provisioned Student Login', $resp->getStatusCode() === 200, 'Status: ' . $resp->getStatusCode() . ' Body: ' . json_encode($body));

        CLI::write("\n------------------------------------------------------------", 'white');
        CLI::write("TEST RESULTS: $passCount / $testCount PASSED (" . ($allPassed ? "ALL PASS" : "SOME FAILED") . ")", $allPassed ? 'green' : 'red');
        CLI::write("------------------------------------------------------------\n", 'white');

        return $allPassed ? 0 : 1;
    }
}
