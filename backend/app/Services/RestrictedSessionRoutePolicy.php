<?php

namespace App\Services;

class RestrictedSessionRoutePolicy
{
    /**
     * Exact allowed route alias/identifier and its permitted HTTP methods.
     * Only minimum operations required for pending_first_login sessions:
     * - auth.me (GET)
     * - auth.change_password (POST)
     * - auth.logout (POST)
     */
    private const ALLOWED_ROUTE_ALIASES = [
        'auth.me'              => ['GET'],
        'auth.change_password' => ['POST'],
        'auth.logout'          => ['POST'],
    ];

    /**
     * Exact canonical normalized URI path to HTTP method mapping for fallback when route alias is not available.
     * Stored as exact paths without regex or prefixes.
     */
    private const ALLOWED_EXACT_PATHS = [
        'api/v1/auth/me'              => ['GET'],
        'api/v1/auth/change-password' => ['POST'],
        'api/v1/auth/logout'          => ['POST'],
    ];

    /**
     * Evaluates whether an authenticated request with pending_first_login is allowed to proceed.
     *
     * @param string|null $routeAlias Matched route name (if available)
     * @param string $uriPath Canonical matched URI path
     * @param string $httpMethod HTTP method (GET, POST, etc.)
     * @return bool
     */
    public function isAllowed(?string $routeAlias, string $uriPath, string $httpMethod): bool
    {
        $method = strtoupper(trim($httpMethod));

        // 1. Check by exact route alias
        if ($routeAlias !== null && $routeAlias !== '' && isset(self::ALLOWED_ROUTE_ALIASES[$routeAlias])) {
            return in_array($method, self::ALLOWED_ROUTE_ALIASES[$routeAlias], true);
        }

        // 2. Fallback: check by exact canonical path
        $normalizedPath = trim($uriPath, '/');
        if (str_starts_with($normalizedPath, 'index.php/')) {
            $normalizedPath = substr($normalizedPath, 10);
        }

        if (isset(self::ALLOWED_EXACT_PATHS[$normalizedPath])) {
            return in_array($method, self::ALLOWED_EXACT_PATHS[$normalizedPath], true);
        }

        // Fail-closed for everything else
        return false;
    }
}
