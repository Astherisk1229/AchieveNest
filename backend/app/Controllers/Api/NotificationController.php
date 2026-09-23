<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class NotificationController extends Controller
{
    use ResponseTrait;

    protected AuthorizationService $authz;

    public function __construct(?AuthorizationService $authz = null)
    {
        $this->authz = $authz ?? new AuthorizationService();
    }

    public function options(): mixed
    {
        return $this->respond(null, 204);
    }

    protected function resolveActor(): ?array
    {
        return $this->authz->resolveActor($this->request->getHeaderLine('Authorization'));
    }

    /**
     * GET /api/v1/notifications
     * Returns persisted notifications and unread count for the authenticated user.
     */
    public function index(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond([
                'error' => [
                    'code'    => 'UNAUTHORIZED',
                    'message' => 'Authentication required.',
                ],
            ], 401);
        }

        $profileId = $actor['profile']['id'] ?? '';
        $db = db_connect();

        $tableName = $db->tableExists('public.notifications') ? 'public.notifications' : 'notifications';

        if (! $db->tableExists($tableName)) {
            return $this->respond([
                'data' => [
                    'notifications' => [],
                    'unread_count'  => 0,
                    'total'         => 0,
                ],
            ]);
        }

        try {
            $rows = $db->table($tableName)
                ->where('recipient_profile_id', $profileId)
                ->orderBy('created_at', 'DESC')
                ->limit(50)
                ->get()
                ->getResultArray();

            $unreadCount = $db->table($tableName)
                ->where('recipient_profile_id', $profileId)
                ->where('read_at', null)
                ->countAllResults();

            $formatted = array_map(function ($row) {
                return [
                    'id'                   => $row['id'],
                    'title'                => $row['title'],
                    'message'              => $row['message'],
                    'type'                 => $row['type'] ?? $row['notification_type'] ?? 'info',
                    'entity_type'          => $row['entity_type'] ?? $row['reference_type'] ?? null,
                    'academic_year'        => $row['academic_year'] ?? null,
                    'target_path'          => $row['route_path'] ?? $row['deep_link'] ?? null,
                    'is_read'              => ! empty($row['read_at']),
                    'read_at'              => $row['read_at'] ?? null,
                    'created_at'           => $row['created_at'],
                ];
            }, $rows);

            return $this->respond([
                'data' => [
                    'notifications' => $formatted,
                    'unread_count'  => (int) $unreadCount,
                    'total'         => count($formatted),
                ],
            ]);
        } catch (Throwable $e) {
            return $this->respond([
                'error' => [
                    'code'    => 'SERVER_ERROR',
                    'message' => 'Failed to retrieve notifications: ' . $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * PATCH /api/v1/notifications/(:segment)/read
     * Marks a specific notification as read.
     */
    public function markAsRead(string $id): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $profileId = $actor['profile']['id'] ?? '';
        $db = db_connect();
        $tableName = $db->tableExists('public.notifications') ? 'public.notifications' : 'notifications';

        try {
            if ($db->tableExists($tableName)) {
                $db->table($tableName)
                    ->where('id', $id)
                    ->where('recipient_profile_id', $profileId)
                    ->update(['read_at' => date('Y-m-d H:i:s')]);
            }

            return $this->respond([
                'data' => [
                    'message' => 'Notification marked as read.',
                    'id'      => $id,
                ],
            ]);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'SERVER_ERROR', 'message' => $e->getMessage()]], 500);
        }
    }

    /**
     * PATCH /api/v1/notifications/read-all
     * Marks all notifications as read for current user.
     */
    public function markAllAsRead(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $profileId = $actor['profile']['id'] ?? '';
        $db = db_connect();
        $tableName = $db->tableExists('public.notifications') ? 'public.notifications' : 'notifications';

        try {
            if ($db->tableExists($tableName)) {
                $db->table($tableName)
                    ->where('recipient_profile_id', $profileId)
                    ->where('read_at', null)
                    ->update(['read_at' => date('Y-m-d H:i:s')]);
            }

            return $this->respond([
                'data' => [
                    'message' => 'All notifications marked as read.',
                ],
            ]);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'SERVER_ERROR', 'message' => $e->getMessage()]], 500);
        }
    }
}
