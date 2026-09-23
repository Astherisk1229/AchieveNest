<?php

namespace Tests\Unit;

use App\Services\AccountLifecycleResolver;
use App\Services\AuthenticationCompletionService;
use App\Services\AuthenticationEligibilityService;
use App\Services\LocalTokenService;
use CodeIgniter\Test\CIUnitTestCase;
use RuntimeException;

final class AuthenticationCompletionServiceTest extends CIUnitTestCase
{
    private const PROFILE_ID = '11111111-2222-4333-8444-555555555555';

    public function testActiveAuthenticationCompletesWithExistingResponseShape(): void
    {
        $tokenService = $this->tokenServiceExpectingIssue(false, '127.0.0.1', 'test-agent', $this->normalToken());
        $result = (new AuthenticationCompletionService($tokenService))->complete(
            ['id' => self::PROFILE_ID, 'email' => 'local@example.test'],
            $this->eligibility('active', false),
            ['remember_me' => false, 'ip' => '127.0.0.1', 'user_agent' => 'test-agent']
        );

        self::assertTrue($result['success']);
        self::assertSame(200, $result['status']);
        self::assertSame([
            'access_token', 'token_type', 'expires_at', 'expires_in',
            'must_change_password', 'account_lifecycle_status',
            'administrative_status', 'required_next_action', 'user_id',
        ], array_keys($result['data']));
        self::assertSame(3600, $result['data']['expires_in']);
        self::assertSame(self::PROFILE_ID, $result['data']['user_id']);
    }

    public function testRememberMeIntentAndTtlArePreserved(): void
    {
        $tokenService = $this->tokenServiceExpectingIssue(true, null, null, $this->rememberToken());
        $result = (new AuthenticationCompletionService($tokenService))->complete(
            ['id' => self::PROFILE_ID],
            $this->eligibility('active', false),
            ['remember_me' => true]
        );

        self::assertTrue($result['success']);
        self::assertSame(28800, $result['data']['expires_in']);
        self::assertSame('Bearer', $result['data']['token_type']);
    }

    public function testPendingFirstLoginCompletesWithoutMutatingPasswordState(): void
    {
        $tokenService = $this->tokenServiceExpectingIssue(false, null, null, $this->normalToken());
        $eligibility = $this->eligibility('active', true);
        $result = (new AuthenticationCompletionService($tokenService))->complete(
            ['id' => self::PROFILE_ID],
            $eligibility
        );

        self::assertTrue($result['success']);
        self::assertTrue($result['data']['must_change_password']);
        self::assertSame(AccountLifecycleResolver::STATUS_PENDING_FIRST_LOGIN, $result['data']['account_lifecycle_status']);
        self::assertSame(AccountLifecycleResolver::ACTION_CHANGE_PASSWORD, $result['data']['required_next_action']);
        self::assertTrue($eligibility['must_change_password']);
    }

    public function testDeniedEligibilityCreatesNoTokenOrSession(): void
    {
        $tokenService = $this->createMock(LocalTokenService::class);
        $tokenService->expects(self::never())->method('issueToken');

        $result = (new AuthenticationCompletionService($tokenService))->complete(
            ['id' => self::PROFILE_ID],
            $this->eligibility('suspended', false)
        );

        self::assertFalse($result['success']);
        self::assertSame(403, $result['status']);
        self::assertSame(AuthenticationEligibilityService::CODE_ACCOUNT_SUSPENDED, $result['error']['code']);
        self::assertArrayNotHasKey('data', $result);
    }

    public function testSessionPersistenceFailureReturnsNoSuccessfulAuthResult(): void
    {
        $tokenService = $this->createMock(LocalTokenService::class);
        $tokenService->expects(self::once())
            ->method('issueToken')
            ->willThrowException(new RuntimeException('session insert failed'));

        $result = (new AuthenticationCompletionService($tokenService))->complete(
            ['id' => self::PROFILE_ID],
            $this->eligibility('active', false)
        );

        self::assertFalse($result['success']);
        self::assertSame(500, $result['status']);
        self::assertSame('AUTH_TOKEN_ERROR', $result['error']['code']);
        self::assertArrayNotHasKey('data', $result);
    }

    /** @dataProvider authenticationMethodProvider */
    public function testCompletionIsProviderIndependent(?string $authenticationMethod): void
    {
        $tokenService = $this->tokenServiceExpectingIssue(false, null, null, $this->normalToken());
        $options = $authenticationMethod === null ? [] : ['authentication_method' => $authenticationMethod];

        $result = (new AuthenticationCompletionService($tokenService))->complete(
            ['id' => self::PROFILE_ID],
            $this->eligibility('active', false),
            $options
        );

        self::assertTrue($result['success']);
        self::assertSame(self::PROFILE_ID, $result['data']['user_id']);
        self::assertArrayNotHasKey('provider', $result['data']);
    }

    public static function authenticationMethodProvider(): array
    {
        return [
            'no method metadata' => [null],
            'password method' => ['password'],
            'future generic method' => ['external'],
        ];
    }

    public function testLocalProfileIdIsAlwaysTheJwtSubjectInput(): void
    {
        $tokenService = $this->createMock(LocalTokenService::class);
        $tokenService->expects(self::once())
            ->method('issueToken')
            ->with(self::identicalTo(self::PROFILE_ID), false, null, null)
            ->willReturn($this->normalToken());

        $result = (new AuthenticationCompletionService($tokenService))->complete(
            [
                'id' => self::PROFILE_ID,
                'email' => 'not-the-jwt-subject@example.test',
                'account_type' => 'personnel',
            ],
            $this->eligibility('active', false)
        );

        self::assertTrue($result['success']);
    }

    public function testMissingProfileIdFailsBeforeTokenOrSessionCreation(): void
    {
        $tokenService = $this->createMock(LocalTokenService::class);
        $tokenService->expects(self::never())->method('issueToken');

        $result = (new AuthenticationCompletionService($tokenService))->complete(
            ['email' => 'missing-id@example.test'],
            $this->eligibility('active', false)
        );

        self::assertFalse($result['success']);
        self::assertSame('AUTH_COMPLETION_INVALID_PROFILE', $result['error']['code']);
    }

    public function testInconsistentEligibleLifecycleFailsClosed(): void
    {
        $tokenService = $this->createMock(LocalTokenService::class);
        $tokenService->expects(self::never())->method('issueToken');
        $eligibility = $this->eligibility('active', false);
        $eligibility['lifecycle_state'] = AccountLifecycleResolver::STATUS_SUSPENDED;

        $result = (new AuthenticationCompletionService($tokenService))->complete(
            ['id' => self::PROFILE_ID],
            $eligibility
        );

        self::assertFalse($result['success']);
        self::assertSame(403, $result['status']);
    }

    public function testCompletionOwnsNoSuccessAuditWrites(): void
    {
        $source = file_get_contents(APPPATH . 'Services/AuthenticationCompletionService.php');

        self::assertIsString($source);
        self::assertStringNotContainsString("table('audit_logs')", $source);
        self::assertStringNotContainsString('AUTH_LOGIN_SUCCESS', $source);
        self::assertStringNotContainsString('AUTH_FIRST_LOGIN_SUCCESS', $source);
    }

    private function eligibility(string $status, mixed $mustChangePassword): array
    {
        return (new AuthenticationEligibilityService())->evaluate([
            'status' => $status,
            'must_change_password' => $mustChangePassword,
        ]);
    }

    private function tokenServiceExpectingIssue(
        bool $rememberMe,
        ?string $ip,
        ?string $userAgent,
        array $token
    ): LocalTokenService {
        $tokenService = $this->createMock(LocalTokenService::class);
        $tokenService->expects(self::once())
            ->method('issueToken')
            ->with(self::PROFILE_ID, $rememberMe, $ip, $userAgent)
            ->willReturn($token);

        return $tokenService;
    }

    private function normalToken(): array
    {
        return [
            'access_token' => 'normal-jwt',
            'token_type' => 'Bearer',
            'expires_at' => '2026-09-22T23:00:00+08:00',
            'expires_in' => 3600,
        ];
    }

    private function rememberToken(): array
    {
        return [
            'access_token' => 'remember-jwt',
            'token_type' => 'Bearer',
            'expires_at' => '2026-09-23T06:00:00+08:00',
            'expires_in' => 28800,
        ];
    }
}
