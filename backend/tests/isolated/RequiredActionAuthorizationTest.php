<?php
namespace Tests\Isolated;

use App\Filters\RequiredNextActionFilter;
use App\Services\AuthenticatedActorService;
use App\Services\AuthorizationHeader;
use App\Services\LocalTokenService;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\URI;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;
use Config\Services;

final class RequiredActionAuthorizationTest extends CIUnitTestCase
{
    private function request(string $header, array $server, string $path = 'api/v1/student/portfolio', string $method = 'GET'): IncomingRequest
    {
        $request = $this->getMockBuilder(IncomingRequest::class)->disableOriginalConstructor()
            ->onlyMethods(['getHeaderLine', 'getServer', 'getMethod', 'getUri'])->getMock();
        $request->method('getHeaderLine')->willReturn($header);
        $request->method('getServer')->willReturnCallback(fn ($key) => $server[$key] ?? null);
        $request->method('getMethod')->willReturn($method);
        $request->method('getUri')->willReturn(new URI('http://example.com/' . $path));
        return $request;
    }

    public function testRestrictedAndUnrestrictedAccountsAcrossEveryHeaderRepresentation(): void
    {
        $db = Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => ''], false);
        $db->query('CREATE TABLE local_auth_credentials (profile_id TEXT, must_change_password INTEGER)');
        $db->table('local_auth_credentials')->insert(['profile_id' => 'account', 'must_change_password' => 1]);
        $actor = $this->createMock(AuthenticatedActorService::class);
        $actor->method('resolveActor')->with('Bearer valid')->willReturn(['profile' => ['id' => 'account', 'status' => 'active']]);
        $filter = new RequiredNextActionFilter(null, $actor, $db);
        foreach ([['Bearer valid', []], ['', ['HTTP_AUTHORIZATION' => 'Bearer valid']],
            ['', ['REDIRECT_HTTP_AUTHORIZATION' => 'Bearer valid']],
            ['', ['HTTP_AUTHORIZATION' => '', 'REDIRECT_HTTP_AUTHORIZATION' => 'Bearer valid']],
        ] as [$header, $server]) {
            foreach ([1, 0] as $restricted) {
                $db->table('local_auth_credentials')->where('profile_id', 'account')->update(['must_change_password' => $restricted]);
                foreach ([['api/v1/student/portfolio', 'GET', false], ['api/v1/auth/me', 'GET', true],
                    ['api/v1/auth/change-password', 'POST', true], ['api/v1/auth/logout', 'POST', true],
                    ['api/v1/auth/me', 'POST', false], ['api/v1/auth/me/extra', 'GET', false],
                ] as [$path, $method, $allowed]) {
                    $request = $this->request($header, $server, $path, $method);
                    $result = $filter->before($request);
                    if ($restricted && !$allowed) {
                        self::assertSame(403, $result->getStatusCode());
                        self::assertStringContainsString('PASSWORD_CHANGE_REQUIRED', $result->getBody());
                    } else {
                        self::assertSame($request, $result);
                    }
                }
            }
        }
        $db->close();
    }

    public function testMissingMalformedAndInvalidTokensDoNotBecomeAuthenticated(): void
    {
        foreach (['', 'Basic abc', 'Bearer', 'Bearer   '] as $header) {
            foreach ([[$header, []], ['', ['HTTP_AUTHORIZATION' => $header]], ['', ['REDIRECT_HTTP_AUTHORIZATION' => $header]]] as [$ordinary, $server]) {
                $request = $this->request($ordinary, $server);
                $actor = $this->createMock(AuthenticatedActorService::class);
                $actor->expects(self::never())->method('resolveActor');
                self::assertSame($request, (new RequiredNextActionFilter(null, $actor))->before($request));
            }
        }
        foreach ([['Bearer invalid', []], ['', ['HTTP_AUTHORIZATION' => 'Bearer invalid']], ['', ['REDIRECT_HTTP_AUTHORIZATION' => 'Bearer invalid']]] as [$header, $server]) {
            $actor = $this->createMock(AuthenticatedActorService::class);
            $actor->expects(self::once())->method('resolveActor')->with('Bearer invalid')->willReturn(null);
            $request = $this->request($header, $server);
            self::assertSame($request, (new RequiredNextActionFilter(null, $actor))->before($request));
        }
        $request = $this->request('Bearer valid', [], 'api/v1/student/portfolio', 'OPTIONS');
        self::assertSame($request, (new RequiredNextActionFilter())->before($request));
    }

    public function testHeaderPrecedenceAndDownstreamTokenExtractionAreShared(): void
    {
        $request = $this->request('Basic malformed', ['HTTP_AUTHORIZATION' => 'Bearer alternate']);
        self::assertSame('Basic malformed', AuthorizationHeader::fromRequest($request));
        self::assertSame('Bearer explicit', AuthorizationHeader::fromRequest($request, 'Bearer explicit'));
        foreach ([['Bearer token', []], ['', ['HTTP_AUTHORIZATION' => 'Bearer token']], ['', ['REDIRECT_HTTP_AUTHORIZATION' => 'Bearer token']]] as [$header, $server]) {
            Services::injectMock('request', $this->request($header, $server));
            $tokens = $this->createMock(LocalTokenService::class);
            $tokens->expects(self::once())->method('verifyToken')->with('token')->willReturn(null);
            self::assertNull((new AuthenticatedActorService($tokens))->resolveActor());
        }
    }
}
