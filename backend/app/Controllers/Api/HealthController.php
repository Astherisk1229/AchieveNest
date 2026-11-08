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
        $schema = [
            'portfolio_submission_portal' => false,
        ];

        if ($database['configured']) {
            try {
                $connection = db_connect();
                $connection->query('SELECT 1');
                $database['connected'] = true;
                $schema['portfolio_submission_portal'] = $connection->tableExists('osad_portfolio_submission_portals', false)
                    && $connection->tableExists('osad_portfolio_submission_access', false)
                    && $connection->tableExists('osad_portfolio_submissions', false)
                    && $connection->tableExists('osad_portfolio_submission_events', false)
                    && $connection->tableExists('osad_portfolio_submission_access_awards', false)
                    && $connection->tableExists('osad_portfolio_submission_submission_awards', false)
                    && $connection->tableExists('osad_portfolio_submission_portal_awards', false)
                    && $connection->fieldExists('award_period', 'osad_portfolio_submission_portals')
                    && $connection->fieldExists('start_date', 'osad_portfolio_submission_portals')
                    && $connection->fieldExists('end_date', 'osad_portfolio_submission_portals');
            } catch (Throwable) {
                // Do not expose credentials, hostnames, or driver errors.
            }
        }

        $environment = env('ACHIEVENEST_ENV', ENVIRONMENT);
        $degraded = $database['configured'] && (! $database['connected'] || ! $schema['portfolio_submission_portal']);

        return $this->respond([
            'service'     => 'AchieveNest API',
            'environment' => $environment,
            'status'      => $degraded ? 'degraded' : 'ok',
            'database'    => $database,
            'schema'      => $schema,
        ], $degraded ? 503 : 200);
    }
}
