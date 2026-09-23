<?php

namespace App\Controllers\Api;

use App\Services\AuthorityRankingRosterService;
use App\Services\AuthorizationService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

class ReviewerRankingRosterController extends Controller
{
    use ResponseTrait;

    public function __construct(private ?AuthorizationService $authz = null, private ?AuthorityRankingRosterService $roster = null)
    { $this->authz ??= new AuthorizationService(); $this->roster ??= new AuthorityRankingRosterService(); }

    public function options(): mixed { return $this->respond(null, 204); }

    public function index(string $cycleId = '', string $trackKey = ''): mixed
    {
        $actor = $this->authz->resolveActor($this->request->getHeaderLine('Authorization'));
        if (! $actor) return $this->failUnauthorized('UNAUTHORIZED');
        try { return $this->respond(['data'=>$this->roster->list($actor, $cycleId, $trackKey)]); }
        catch (InvalidArgumentException $error) { return $this->fail(['error'=>['code'=>strtok($error->getMessage(), ':'), 'message'=>$error->getMessage()]], 404); }
        catch (RuntimeException $error) { $status = str_starts_with($error->getMessage(), 'FORBIDDEN') ? 403 : 409; return $this->fail(['error'=>['code'=>strtok($error->getMessage(), ':'), 'message'=>$error->getMessage()]], $status); }
        catch (Throwable) { return $this->failServerError('Unexpected error retrieving the ranking-track roster.'); }
    }
}
