<?php

namespace App\Commands;

use App\Helpers\ValidationHelper;
use App\Services\LocalAuthService;
use App\Services\LocalTokenService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class VerifyPasswordChangeRemediation extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:password-change-remediation';
    protected $description = 'Verifies mandatory password change, validation policy, and token rotation end-to-end.';

    public function run(array $params)
    {
        CLI::write("=== MANDATORY PASSWORD CHANGE REMEDIATION VERIFICATION ===", 'green');
        $db = db_connect();
        $authService = new LocalAuthService();
        $tokenService = new LocalTokenService();

        $passed = 0;
        $failed = 0;

        $testEmail = 'test.pwdchange.' . time() . '@ndmu.edu.ph';
        $testInstId = 'PWD-' . substr((string) time(), -6);
        $tempPassword = ValidationHelper::generateTemporaryPassword();
        $profileId = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0x0fff) | 0x4000, random_int(0, 0x3fff) | 0x8000, random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff));

        try {
            // Setup test user
            $tempHash = password_hash($tempPassword, PASSWORD_DEFAULT);
            $db->table('profiles')->insert([
                'id'                   => $profileId,
                'institutional_id'     => $testInstId,
                'email'                => $testEmail,
                'full_name'            => 'Password Change Test Account',
                'account_type'         => 'student',
                'status'               => 'active',
                'password_hash'        => $tempHash,
                'created_at'           => date('Y-m-d H:i:s'),
                'updated_at'           => date('Y-m-d H:i:s'),
            ]);

            $db->table('local_auth_credentials')->insert([
                'profile_id'           => $profileId,
                'password_hash'        => $tempHash,
                'must_change_password' => 1,
                'status'               => 'active',
                'created_at'           => date('Y-m-d H:i:s'),
                'updated_at'           => date('Y-m-d H:i:s'),
            ]);

            // Test 1: First login with temporary password succeeds and flags must_change_password
            $loginRes = $authService->login($testEmail, $tempPassword, true, '127.0.0.1', 'CLI-Verifier');
            if ($loginRes['success'] && ($loginRes['data']['must_change_password'] ?? false) === true) {
                CLI::write("[PASS] Test 1: First login succeeds and returns must_change_password = true", 'green');
                $passed++;
            } else {
                CLI::write("[FAIL] Test 1: First login failed or did not return must_change_password = true", 'red');
                $failed++;
            }

            // Test 2: Password change fails when current password is wrong
            $wrongCurrentRes = $authService->changePassword($profileId, 'NewValidPass123!', 'WrongTempPass123!', '127.0.0.1', 'CLI-Verifier');
            if (!$wrongCurrentRes['success'] && ($wrongCurrentRes['error']['code'] ?? '') === 'INCORRECT_CURRENT_PASSWORD') {
                CLI::write("[PASS] Test 2: Incorrect current password rejected with INCORRECT_CURRENT_PASSWORD", 'green');
                $passed++;
            } else {
                CLI::write("[FAIL] Test 2: Incorrect current password was not rejected properly", 'red');
                $failed++;
            }

            // Test 3: Password change fails when new password is too short
            $shortRes = $authService->changePassword($profileId, 'Short1!', $tempPassword, '127.0.0.1', 'CLI-Verifier');
            if (!$shortRes['success'] && ($shortRes['error']['code'] ?? '') === 'INVALID_PASSWORD_LENGTH') {
                CLI::write("[PASS] Test 3: Short password (<8 chars) rejected with INVALID_PASSWORD_LENGTH", 'green');
                $passed++;
            } else {
                CLI::write("[FAIL] Test 3: Short password was not rejected", 'red');
                $failed++;
            }

            // Test 4: Password change fails when new password violates complexity policy (no special char)
            $noSpecialRes = $authService->changePassword($profileId, 'NoSpecialPass123', $tempPassword, '127.0.0.1', 'CLI-Verifier');
            if (!$noSpecialRes['success'] && ($noSpecialRes['error']['code'] ?? '') === 'INVALID_PASSWORD_POLICY') {
                CLI::write("[PASS] Test 4: Password lacking special character rejected with INVALID_PASSWORD_POLICY", 'green');
                $passed++;
            } else {
                CLI::write("[FAIL] Test 4: Policy violation was not rejected", 'red');
                $failed++;
            }

            // Test 5: Password change fails when reusing current temporary password
            $reuseRes = $authService->changePassword($profileId, $tempPassword, $tempPassword, '127.0.0.1', 'CLI-Verifier');
            if (!$reuseRes['success'] && ($reuseRes['error']['code'] ?? '') === 'PASSWORD_REUSE_FORBIDDEN') {
                CLI::write("[PASS] Test 5: Password reuse rejected with PASSWORD_REUSE_FORBIDDEN", 'green');
                $passed++;
            } else {
                CLI::write("[FAIL] Test 5: Password reuse was not rejected", 'red');
                $failed++;
            }

            // Test 6: Valid password change succeeds transactionally
            $validNewPassword = 'NDMU#PermanentPass2026!';
            $validRes = $authService->changePassword($profileId, $validNewPassword, $tempPassword, '127.0.0.1', 'CLI-Verifier');
            if ($validRes['success'] && ($validRes['data']['must_change_password'] ?? null) === false && !empty($validRes['data']['access_token'])) {
                CLI::write("[PASS] Test 6: Valid password change succeeded and returned renewed token", 'green');
                $passed++;
            } else {
                CLI::write("[FAIL] Test 6: Valid password change failed: " . json_encode($validRes), 'red');
                $failed++;
            }

            // Test 7: Verify database state after change: must_change_password = 0
            $updatedCred = $db->table('local_auth_credentials')->where('profile_id', $profileId)->get()->getRowArray();
            if ($updatedCred && (int)$updatedCred['must_change_password'] === 0) {
                CLI::write("[PASS] Test 7: Database local_auth_credentials reflects must_change_password = 0", 'green');
                $passed++;
            } else {
                CLI::write("[FAIL] Test 7: Database was not updated correctly: " . json_encode($updatedCred), 'red');
                $failed++;
            }

            // Test 8: Login with old temporary password fails
            $oldLogin = $authService->login($testEmail, $tempPassword, true, '127.0.0.1', 'CLI-Verifier');
            if (!$oldLogin['success']) {
                CLI::write("[PASS] Test 8: Old temporary password no longer authenticates", 'green');
                $passed++;
            } else {
                CLI::write("[FAIL] Test 8: Old temporary password unexpectedly authenticated", 'red');
                $failed++;
            }

            // Test 9: Login with new permanent password succeeds with must_change_password = false
            $newLogin = $authService->login($testEmail, $validNewPassword, true, '127.0.0.1', 'CLI-Verifier');
            if ($newLogin['success'] && ($newLogin['data']['must_change_password'] ?? null) === false) {
                CLI::write("[PASS] Test 9: New permanent password authenticates with must_change_password = false", 'green');
                $passed++;
            } else {
                CLI::write("[FAIL] Test 9: New permanent password failed to authenticate: " . json_encode($newLogin), 'red');
                $failed++;
            }

        } finally {
            // Cleanup test records
            $db->table('local_auth_sessions')->where('profile_id', $profileId)->delete();
            $db->table('local_auth_credentials')->where('profile_id', $profileId)->delete();
            $db->table('account_lifecycle_events')->where('profile_id', $profileId)->delete();
            $db->table('audit_logs')->where('actor_profile_id', $profileId)->delete();
            $db->table('profiles')->where('id', $profileId)->delete();
        }

        CLI::newLine();
        CLI::write("Verification Summary: {$passed} Passed, {$failed} Failed", $failed === 0 ? 'green' : 'red');

        return $failed === 0 ? 0 : 1;
    }
}
