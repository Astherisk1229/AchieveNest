<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use CodeIgniter\Database\BaseConnection;

/**
 * Read-only organization view of participation certificates that were added to
 * student portfolios when an attendance session closed.
 */
final class AutomaticAttendanceCertificateController extends Controller
{
    use ResponseTrait;

    public function __construct(
        private ?AuthorizationService $authz = null,
        private ?BaseConnection $db = null
    ) {
        $this->authz ??= new AuthorizationService();
        $this->db ??= db_connect('default');
    }

    public function options(): mixed
    {
        return $this->respond(null, 204);
    }

    public function index(): mixed
    {
        $actor = $this->authz->resolveActor($this->request->getHeaderLine('Authorization'));
        if ($actor === null) {
            return $this->respond([
                'error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.'],
            ], 401);
        }

        $roles = $actor['roles'] ?? [];
        $isOsad = in_array('osad_staff', $roles, true);
        if (! $isOsad && ! in_array('organization_moderator', $roles, true)) {
            return $this->respond([
                'error' => ['code' => 'FORBIDDEN', 'message' => 'Attendance certificate history requires OSAD staff or an organization moderator assignment.'],
            ], 403);
        }

        $organizationIds = $isOsad ? [] : $this->authz->getModeratedOrganizationIds($actor);
        if (! $isOsad && $organizationIds === []) {
            return $this->respond(['data' => $this->emptyResult()]);
        }

        $records = $this->baseQuery($isOsad, $organizationIds)
            ->select('spr.id, spr.title, spr.status, spr.verified_at, spr.created_at, p.full_name AS student_name, p.institutional_id AS student_id_number, e.id AS event_id, e.title AS event_title')
            ->orderBy('spr.created_at', 'DESC')
            ->limit(200)
            ->get()
            ->getResultArray();

        $summary = [
            'total' => count($records),
            'verified' => count(array_filter($records, static fn (array $record): bool => ($record['status'] ?? '') === 'verified')),
            'events' => count(array_unique(array_filter(array_column($records, 'event_id')))),
        ];

        return $this->respond(['data' => ['certificates' => $records, 'summary' => $summary]]);
    }

    private function baseQuery(bool $isOsad, array $organizationIds)
    {
        $query = $this->db
            ->table('student_portfolio_records spr')
            ->join('profiles p', 'p.id = spr.student_profile_id')
            ->join('events e', "e.id = JSON_UNQUOTE(JSON_EXTRACT(spr.structured_metadata, '$.origin_event_id'))")
            ->where("JSON_UNQUOTE(JSON_EXTRACT(spr.structured_metadata, '$.automatic_attendance_certificate')) = 'true'", null, false);

        if (! $isOsad) {
            $query->whereIn('e.organization_id', $organizationIds);
        }

        return $query;
    }

    private function emptyResult(): array
    {
        return [
            'certificates' => [],
            'summary' => ['total' => 0, 'verified' => 0, 'events' => 0],
        ];
    }
}
