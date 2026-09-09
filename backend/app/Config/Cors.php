<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

/**
 * Cross-Origin Resource Sharing (CORS) Configuration
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
 */
class Cors extends BaseConfig
{
    /**
     * The default CORS configuration.
     *
     * @var array{
     *      allowedOrigins: list<string>,
     *      allowedOriginsPatterns: list<string>,
     *      supportsCredentials: bool,
     *      allowedHeaders: list<string>,
     *      exposedHeaders: list<string>,
     *      allowedMethods: list<string>,
     *      maxAge: int,
     *  }
     */
    public array $default = [
        /**
         * Origins for the `Access-Control-Allow-Origin` header.
         *
         * Production should set CORS_ALLOWED_ORIGINS as a comma-separated list.
         * Local development keeps http://localhost:5173 as the safe fallback.
         */
        'allowedOrigins' => [],
        'allowedOriginsPatterns' => [],
        'supportsCredentials' => false,
        'allowedHeaders' => ['Accept', 'Authorization', 'Content-Type', 'Origin', 'X-Requested-With'],
        'exposedHeaders' => [],
        'allowedMethods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        'maxAge' => 7200,
    ];

    public function __construct()
    {
        parent::__construct();

        $configuredOrigins = env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173');
        $origins = array_values(array_filter(array_map('trim', explode(',', (string) $configuredOrigins))));

        $this->default['allowedOrigins'] = $origins ?: ['http://localhost:5173'];
    }
}
