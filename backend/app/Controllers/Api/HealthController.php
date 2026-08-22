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
        $database = [
            'configured' => env('database.default.hostname', '') !== '',
            'connected'  => false,
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

        return $this->respond([
            'service'  => 'AchieveNest API',
            'status'   => $database['configured'] && ! $database['connected'] ? 'degraded' : 'ok',
            'database' => $database,
        ], $database['configured'] && ! $database['connected'] ? 503 : 200);
    }
}
