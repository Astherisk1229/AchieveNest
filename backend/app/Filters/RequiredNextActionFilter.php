<?php

namespace App\Filters;

use App\Services\AccountLifecycleResolver;
use App\Services\AuthenticatedActorService;
use App\Services\RestrictedSessionRoutePolicy;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class RequiredNextActionFilter implements FilterInterface
{
    protected RestrictedSessionRoutePolicy $routePolicy;

    public function __construct(?RestrictedSessionRoutePolicy $routePolicy = null)
    {
        $this->routePolicy = $routePolicy ?? new RestrictedSessionRoutePolicy();
    }

    /**
     * Inspects authenticated incoming requests and denies protected portal access
     * if the user account requires a mandatory first-login password change.
     */
    public function before(RequestInterface $request, $arguments = null)
    {
        // 1. Allow OPTIONS preflight requests through infrastructure CORS layer
        if (strtoupper($request->getMethod()) === 'OPTIONS') {
            return $request;
        }

        // 2. Check for Bearer token (Unauthenticated public requests proceed to their respective controllers)
        $authorization = $request->getHeaderLine('Authorization');
        if ($authorization === '' || ! preg_match('/^Bearer\s+(.+)$/i', $authorization)) {
            return $request;
        }

        // 3. Resolve authenticated actor
        $actorService = new AuthenticatedActorService();
        $actor = $actorService->resolveActor($authorization);

        if ($actor === null) {
            // Unauthenticated/expired token handled by authentication filters/controllers
            return $request;
        }

        $profile = $actor['profile'] ?? [];
        $profileId = $profile['id'] ?? '';

        if ($profileId === '') {
            return $request;
        }

        // 4. Resolve canonical lifecycle and credential integrity
        $db = db_connect();
        $credRow = $db->table('local_auth_credentials')
            ->where('profile_id', $profileId)
            ->get()
            ->getRowArray();

        $canonicalMustChange = $credRow !== null ? ($credRow['must_change_password'] ?? null) : null;
        $lifecycle = AccountLifecycleResolver::resolve(
            $profile['status'] ?? 'active',
            $canonicalMustChange
        );

        // 5. If account lifecycle permits protected portal access, allow request to proceed to RBAC
        if ($lifecycle['can_access_protected_portal'] === true && $lifecycle['required_next_action'] === AccountLifecycleResolver::ACTION_NONE) {
            return $request;
        }

        // 6. Account requires mandatory next action (e.g. pending_first_login / change_password)
        $uriPath = trim($request->getUri()->getPath(), '/');
        $httpMethod = $request->getMethod();
        $router = service('router');
        $routeAlias = $router->getMatchedRouteOptions()['as'] ?? null;

        if ($this->routePolicy->isAllowed($routeAlias, $uriPath, $httpMethod)) {
            return $request;
        }

        // 7. Deny all other routes with 403 PASSWORD_CHANGE_REQUIRED
        $response = service('response');
        $response->setStatusCode(403);
        $response->setJSON([
            'error' => [
                'code'    => 'PASSWORD_CHANGE_REQUIRED',
                'message' => 'You must change your temporary password before accessing this resource.',
            ],
            'account_lifecycle_status'    => AccountLifecycleResolver::STATUS_PENDING_FIRST_LOGIN,
            'required_next_action'        => AccountLifecycleResolver::ACTION_CHANGE_PASSWORD,
            'can_access_protected_portal' => false,
        ]);

        return $response;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        return $response;
    }
}
