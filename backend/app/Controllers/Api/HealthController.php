<?php

namespace App\Controllers\Api;

use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class HealthController extends Controller
{
    use ResponseTrait;

    public function index()
    {
        $dbConfig = config('Database');
        $group = $dbConfig->defaultGroup ?? 'default';
        $groupSettings = $dbConfig->{$group} ?? ($dbConfig->default ?? []);
        $isConfigured = ! empty($groupSettings['hostname']) || ! empty($groupSettings['database']);

        $database = [
            'configured' => $isConfigured,
            'connected'  => false,
            'driver'     => $groupSettings['DBDriver'] ?? 'unknown',
        ];

        if ($database['configured']) {
            try {
                $connection = db_connect();
                $connection->query('SELECT 1');
                $database['connected'] = true;
            } catch (Throwable) {
                // Do not expose credentials, hostnames, or driver errors.
            }
        }

        $environment = env('ACHIEVENEST_ENV', ENVIRONMENT);

        return $this->respond([
            'service'     => 'AchieveNest API',
            'environment' => $environment,
            'status'      => $database['configured'] && ! $database['connected'] ? 'degraded' : 'ok',
            'database'    => $database,
        ], $database['configured'] && ! $database['connected'] ? 503 : 200);
    }
}
