<?php

namespace App\Commands;

use App\Controllers\Api\HealthController;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\SiteURIFactory;
use CodeIgniter\HTTP\UserAgent;

class TestHealthEndpoint extends BaseCommand
{
    protected $group       = 'Testing';
    protected $name        = 'test:health';
    protected $description = 'Executes the HealthController endpoint and prints the response.';

    public function run(array $params)
    {
        $uriFactory = new SiteURIFactory(config('App'), service('superglobals'));
        $request = new IncomingRequest(config('App'), $uriFactory->createFromGlobals(), null, new UserAgent());
        
        $controller = new HealthController();
        $controller->initController($request, response(), service('logger'));

        $response = $controller->index();
        $statusCode = $response->getStatusCode();
        $body = $response->getBody();

        CLI::write("HEALTH_STATUS_CODE: " . $statusCode, $statusCode === 200 ? 'green' : 'red');
        CLI::write("HEALTH_BODY:\n" . json_encode(json_decode($body), JSON_PRETTY_PRINT), 'yellow');

        return $statusCode === 200 ? 0 : 1;
    }
}
