<?php
namespace Tests\Support\Phase2;

use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\URI;
use CodeIgniter\HTTP\UserAgent;

class PortfolioController extends \App\Controllers\Api\StudentPortfolioController
{
    public bool $reviewer = false;
    public ?\Closure $beforeLock = null;

    protected function resolveActor(): ?array { return PortfolioFixture::actor($this->reviewer); }
    protected function scoreApprovedRecord(string $recordId, string $actorId): string { return 'DEFERRED'; }

    protected function lockRecord(\CodeIgniter\Database\BaseConnection $db, string $id): ?array
    {
        if ($this->beforeLock !== null) { ($this->beforeLock)(); }
        return parent::lockRecord($db, $id);
    }

    public function request(array $payload = []): void
    {
        $request = new IncomingRequest(new \Config\App(), new URI('http://example.com/api/v1/portfolio'), json_encode($payload), new UserAgent());
        $request->setHeader('Content-Type', 'application/json');
        $this->initController($request, new \CodeIgniter\HTTP\Response(new \Config\App()), service('logger'));
    }

    public function setScanner(\App\Services\StudentEvidenceClamAvScanner $scanner): void { $this->scanner = $scanner; }
}
