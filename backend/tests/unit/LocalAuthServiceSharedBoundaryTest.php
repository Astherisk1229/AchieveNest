<?php

namespace Tests\Unit;

use App\Services\AuthenticationCompletionService;
use App\Services\AuthenticationEligibilityService;
use App\Services\LocalAuthService;
use App\Services\LocalTokenService;
use CodeIgniter\Database\BaseConnection;
use CodeIgniter\Test\CIUnitTestCase;

final class LocalAuthServiceSharedBoundaryTest extends CIUnitTestCase
{
    private const DATABASE = 'achievenest_phase17m_google_auth_test';
    private const PASSWORD = 'Correct-Password-56!';

    private BaseConnection $connection;
    private string $profileId;
    private string $email;

    protected function setUp(): void
    {
        parent::setUp();
        $this->connection = db_connect('phase17m_replay');
        if ($this->connection->database !== self::DATABASE || ! str_contains($this->connection->database, 'google_auth_test')) {
            self::fail('Password auth tests require isolated database ' . self::DATABASE . '.');
        }
        foreach (['profiles', 'local_auth_credentials', 'audit_logs'] as $table) {
            if (! $this->connection->tableExists($table)) {
                self::fail("Required isolated test table is missing: {$table}");
            }
        }
        $this->connection->transBegin();
        $suffix = bin2hex(random_bytes(4));
        $this->profileId = sprintf('56000000-0000-4000-8000-%012s', $suffix);
        $this->email = "phase56.{$suffix}@ndmu.edu.ph";
    }

    protected function tearDown(): void
    {
        if (isset($this->connection)) {
            $this->connection->transRollback();
            $this->connection->close();
        }
        parent::tearDown();
    }

    public function testActivePasswordLoginDelegatesEligibilityAndCompletionAndPreservesResponse(): void
    {
        $this->insertAccount('active', 'active', false);
        $expectedEligibility = $this->eligibility('active', false);

        $eligibility = $this->createMock(AuthenticationEligibilityService::class);
        $eligibility->expects(self::once())->method('evaluate')->with(self::callback(
            fn (array $context): bool => $context['id'] === $this->profileId
                && (int) $context['must_change_password'] === 0
                && $context['is_locked'] === false
        ))->willReturn($expectedEligibility);

        $completion = $this->createMock(AuthenticationCompletionService::class);
        $completion->expects(self::once())->method('complete')->with(
            self::callback(fn (array $profile): bool => $profile['id'] === $this->profileId),
            $expectedEligibility,
            self::callback(fn (array $options): bool => $options['remember_me'] === false
                && $options['authentication_method'] === 'password')
        )->willReturn($this->successResult(false, false));

        $result = $this->service($eligibility, $completion)->login($this->email, self::PASSWORD);

        self::assertSame($this->successResult(false, false), $result);
        self::assertSame(1, $this->auditCount('AUTH_LOGIN_SUCCESS'));
        self::assertSame(0, $this->auditCount('AUTH_FIRST_LOGIN_SUCCESS'));
    }

    public function testActivePasswordLoginUsesRealSharedCompletionAndPersistsSession(): void
    {
        $this->insertAccount('active', 'active', false);
        $tokenService = new LocalTokenService($this->connection);
        $secret = new \ReflectionProperty(LocalTokenService::class, 'jwtSecret');
        $secret->setValue($tokenService, str_repeat('phase56-secret-', 4));

        try {
            $service = new LocalAuthService(
                $tokenService,
                new AuthenticationEligibilityService(),
                new AuthenticationCompletionService($tokenService),
                $this->connection
            );

            $result = $service->login($this->email, self::PASSWORD, false, '127.0.0.1', 'phase-56-test');
            $session = $this->connection->table('local_auth_sessions')
                ->where('profile_id', $this->profileId)
                ->get()
                ->getRowArray();

            self::assertTrue($result['success'], json_encode($result));
            self::assertSame(3600, $result['data']['expires_in']);
            self::assertSame($this->profileId, $result['data']['user_id']);
            self::assertNotEmpty($result['data']['access_token']);
            self::assertNotNull($session);
            self::assertSame(hash('sha256', $result['data']['access_token']), $session['token_hash']);
            self::assertSame($this->profileId, $session['profile_id']);
            self::assertNull($session['revoked_at']);
            self::assertSame(1, $this->auditCount('AUTH_LOGIN_SUCCESS'));
        } finally {
            unset($secret);
        }
    }

    public function testInvalidPasswordStopsBeforeEligibilityAndCompletionAndPreservesFailureAudit(): void
    {
        $this->insertAccount('active', 'active', false);
        $eligibility = $this->createMock(AuthenticationEligibilityService::class);
        $eligibility->expects(self::never())->method('evaluate');
        $completion = $this->createMock(AuthenticationCompletionService::class);
        $completion->expects(self::never())->method('complete');

        $result = $this->service($eligibility, $completion)->login($this->email, 'Wrong-Password-99!');

        self::assertFalse($result['success']);
        self::assertSame(401, $result['status']);
        self::assertSame('INVALID_CREDENTIALS', $result['error']['code']);
        self::assertSame(1, $this->auditCount('AUTH_LOGIN_FAILED'));
        self::assertSame(0, $this->successAuditCount());
    }

    /** @dataProvider deniedLifecycleProvider */
    public function testDeniedLifecycleNeverReachesCompletion(
        string $profileStatus,
        string $credentialStatus,
        string $expectedCode,
        ?string $simulatedLifecycleStatus
    ): void {
        $this->insertAccount($profileStatus, $credentialStatus, false);
        $completion = $this->createMock(AuthenticationCompletionService::class);
        $completion->expects(self::never())->method('complete');

        $eligibility = new AuthenticationEligibilityService();
        if ($simulatedLifecycleStatus !== null) {
            $simulatedResult = $this->eligibility($simulatedLifecycleStatus, false);
            $eligibility = $this->createMock(AuthenticationEligibilityService::class);
            $eligibility->expects(self::once())->method('evaluate')->willReturn($simulatedResult);
        }

        $result = $this->service($eligibility, $completion)
            ->login($this->email, self::PASSWORD);

        self::assertFalse($result['success']);
        self::assertSame(403, $result['status']);
        self::assertSame($expectedCode, $result['error']['code']);
        self::assertSame(0, $this->successAuditCount());
        self::assertSame(1, $this->auditCount('AUTH_LOGIN_FAILED'));
    }

    public static function deniedLifecycleProvider(): array
    {
        return [
            'suspended' => ['suspended', 'active', 'ACCOUNT_SUSPENDED', null],
            'archived' => ['archived', 'active', 'ACCOUNT_ARCHIVED', null],
            'disabled' => ['active', 'active', 'ACCOUNT_RESTRICTED', 'disabled'],
            'locked' => ['active', 'locked', 'CREDENTIAL_DISABLED', null],
            'unknown' => ['active', 'active', 'ACCOUNT_RESTRICTED', 'unexpected_state'],
        ];
    }

    public function testPendingFirstLoginPreservesFlagAndWritesOneFirstLoginAudit(): void
    {
        $this->insertAccount('active', 'active', true);
        $completion = $this->createMock(AuthenticationCompletionService::class);
        $completion->expects(self::once())->method('complete')->with(
            self::anything(),
            self::callback(fn (array $eligibility): bool => $eligibility['eligible'] === true
                && $eligibility['lifecycle_state'] === 'pending_first_login'
                && $eligibility['must_change_password'] === true),
            self::anything()
        )->willReturn($this->successResult(true, false));

        $result = $this->service(new AuthenticationEligibilityService(), $completion)
            ->login($this->email, self::PASSWORD);

        self::assertTrue($result['success']);
        self::assertTrue($result['data']['must_change_password']);
        self::assertSame('pending_first_login', $result['data']['account_lifecycle_status']);
        self::assertSame(1, $this->auditCount('AUTH_FIRST_LOGIN_SUCCESS'));
        self::assertSame(0, $this->auditCount('AUTH_LOGIN_SUCCESS'));
    }

    public function testNormalTtlIntentIsDelegatedAndResponseRemains3600Seconds(): void
    {
        $this->insertAccount('active', 'active', false);
        $completion = $this->completionExpectingRememberMe(false, $this->successResult(false, false));

        $result = $this->service(new AuthenticationEligibilityService(), $completion)
            ->login($this->email, self::PASSWORD, false);

        self::assertSame(3600, $result['data']['expires_in']);
    }

    public function testRememberMeIntentIsDelegatedAndResponseRemains28800Seconds(): void
    {
        $this->insertAccount('active', 'active', false);
        $completion = $this->completionExpectingRememberMe(true, $this->successResult(false, true));

        $result = $this->service(new AuthenticationEligibilityService(), $completion)
            ->login($this->email, self::PASSWORD, true);

        self::assertSame(28800, $result['data']['expires_in']);
    }

    public function testCompletionFailurePropagatesWithoutSuccessAudit(): void
    {
        $this->insertAccount('active', 'active', false);
        $completionFailure = [
            'success' => false,
            'status' => 500,
            'error' => ['code' => 'AUTH_TOKEN_ERROR', 'message' => 'Failed to issue authentication token.'],
        ];
        $completion = $this->createMock(AuthenticationCompletionService::class);
        $completion->expects(self::once())->method('complete')->willReturn($completionFailure);

        $result = $this->service(new AuthenticationEligibilityService(), $completion)
            ->login($this->email, self::PASSWORD);

        self::assertSame($completionFailure, $result);
        self::assertSame(0, $this->successAuditCount());
    }

    public function testLoginMethodHasNoDirectTokenOrLifecycleResolverCall(): void
    {
        $source = file_get_contents(APPPATH . 'Services/LocalAuthService.php');
        $start = strpos($source, 'public function login(');
        $end = strpos($source, 'private function deniedEligibilityResult', $start);
        $login = substr($source, $start, $end - $start);

        self::assertStringContainsString('$this->eligibilityService->evaluate(', $login);
        self::assertStringContainsString('$this->completionService->complete(', $login);
        self::assertStringNotContainsString('$this->tokenService->issueToken(', $login);
        self::assertStringNotContainsString('AccountLifecycleResolver::resolve(', $login);
        self::assertStringNotContainsString('ExternalAuthIdentityRepository', $login);
    }

    private function service(
        AuthenticationEligibilityService $eligibility,
        AuthenticationCompletionService $completion
    ): LocalAuthService {
        return new LocalAuthService(
            $this->createMock(LocalTokenService::class),
            $eligibility,
            $completion,
            $this->connection
        );
    }

    private function insertAccount(string $profileStatus, string $credentialStatus, bool $mustChange): void
    {
        $now = '2026-09-22 20:00:00.000000';
        $this->connection->table('profiles')->insert([
            'id' => $this->profileId,
            'institutional_id' => 'PHASE56-' . substr($this->profileId, -8),
            'account_type' => 'student',
            'email' => $this->email,
            'full_name' => 'Phase 5.6 Synthetic Login',
            'status' => $profileStatus,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $this->connection->table('local_auth_credentials')->insert([
            'profile_id' => $this->profileId,
            'password_hash' => password_hash(self::PASSWORD, PASSWORD_DEFAULT),
            'must_change_password' => $mustChange ? 1 : 0,
            'password_changed_at' => $now,
            'status' => $credentialStatus,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    private function eligibility(string $status, bool $mustChange): array
    {
        return (new AuthenticationEligibilityService())->evaluate([
            'status' => $status,
            'must_change_password' => $mustChange,
        ]);
    }

    private function completionExpectingRememberMe(bool $rememberMe, array $result): AuthenticationCompletionService
    {
        $completion = $this->createMock(AuthenticationCompletionService::class);
        $completion->expects(self::once())->method('complete')->with(
            self::anything(),
            self::anything(),
            self::callback(fn (array $options): bool => $options['remember_me'] === $rememberMe)
        )->willReturn($result);
        return $completion;
    }

    private function successResult(bool $mustChange, bool $rememberMe): array
    {
        return [
            'success' => true,
            'status' => 200,
            'data' => [
                'access_token' => 'shared-completion-token',
                'token_type' => 'Bearer',
                'expires_at' => '2026-09-23T00:00:00+08:00',
                'expires_in' => $rememberMe ? 28800 : 3600,
                'must_change_password' => $mustChange,
                'account_lifecycle_status' => $mustChange ? 'pending_first_login' : 'active',
                'administrative_status' => 'active',
                'required_next_action' => $mustChange ? 'change_password' : 'none',
                'user_id' => $this->profileId,
            ],
        ];
    }

    private function auditCount(string $eventCode): int
    {
        return $this->connection->table('audit_logs')
            ->where('actor_profile_id', $this->profileId)
            ->where('event_code', $eventCode)
            ->countAllResults();
    }

    private function successAuditCount(): int
    {
        return $this->connection->table('audit_logs')
            ->where('actor_profile_id', $this->profileId)
            ->whereIn('event_code', ['AUTH_LOGIN_SUCCESS', 'AUTH_FIRST_LOGIN_SUCCESS'])
            ->countAllResults();
    }
}
