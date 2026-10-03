<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use CodeIgniter\Database\BaseConnection;

class EventVenueController extends Controller
{
    use ResponseTrait;

    protected AuthorizationService $authz;
    protected ?BaseConnection $db;

    public function __construct(?AuthorizationService $authz = null, ?BaseConnection $db = null)
    {
        $this->authz = $authz ?? new AuthorizationService();
        $this->db = $db;
    }

    public function options()
    {
        return $this->respond(null, 204);
    }

    protected function getDb(): BaseConnection
    {
        return $this->db ?? db_connect('default');
    }

    /**
     * GET /api/v1/event-venues
     *
     * Returns the active canonical event venues ordered deterministically.
     */
    public function index()
    {
        $actor = $this->authz->resolveActor($this->request->getHeaderLine('Authorization'));
        if ($actor === null) {
            return $this->respond([
                'error' => [
                    'code'    => 'UNAUTHORIZED',
                    'message' => 'Valid active authenticated session required.',
                ],
            ], 401);
        }

        $venues = $this->getDb()->table('event_venues')
            ->select('id, name, sort_order')
            ->where('is_active', 1)
            ->orderBy('sort_order', 'ASC')
            ->orderBy('name', 'ASC')
            ->get()
            ->getResultArray();

        return $this->respond([
            'data' => [
                'venues' => $venues,
            ],
        ], 200);
    }
}
