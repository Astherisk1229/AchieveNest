<?php

namespace App\Controllers\Api;

use App\Helpers\ValidationHelper;
use App\Services\AuthenticatedActorService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class StudentPortfolioController extends Controller
{
    use ResponseTrait;

    protected AuthenticatedActorService $actorService;

    public function __construct(?AuthenticatedActorService $actorService = null)
    {
        $this->actorService = $actorService ?? new AuthenticatedActorService();
    }

    public function options(): mixed
    {
        return $this->respond(null, 204);
    }

    protected function resolveActor(): ?array
    {
        return $this->actorService->resolveActor($this->request->getHeaderLine('Authorization'));
    }

    /**
     * GET /api/v1/portfolio/categories
     * Lists active portfolio categories and subcategories with schema definitions.
     */
    public function categories(): mixed
    {
        $db = db_connect();
        $categories = $db->table('public.portfolio_categories')
            ->where('status', 'active')
            ->orderBy('sort_order', 'ASC')
            ->get()->getResultArray();

        $subcategories = $db->table('public.portfolio_subcategories')
            ->where('status', 'active')
            ->orderBy('sort_order', 'ASC')
            ->get()->getResultArray();

        $subByCat = [];
        foreach ($subcategories as $sub) {
            $catId = $sub['category_id'];
            if (! isset($subByCat[$catId])) {
                $subByCat[$catId] = [];
            }
            $subByCat[$catId][] = $sub;
        }

        foreach ($categories as &$cat) {
            $cat['subcategories'] = $subByCat[$cat['id']] ?? [];
        }
        unset($cat);

        return $this->respond(['data' => ['categories' => $categories]], 200);
    }

    /**
     * GET /api/v1/portfolio
     * Lists current student's portfolio records or verifier-filtered records.
     */
    public function index(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $db = db_connect();
        $isStudent = ($actor['profile']['account_type'] ?? '') === 'student';
        $statusFilter = trim((string) $this->request->getGet('status'));
        $categoryFilter = trim((string) $this->request->getGet('category_id'));

        $builder = $db->table('public.student_portfolio_records spr')
            ->select([
                'spr.*',
                'pc.name AS category_name',
                'pc.code AS category_code',
                'ps.name AS subcategory_name',
                'ps.code AS subcategory_code',
                'p.full_name AS student_name',
                'p.institutional_id AS student_id_number',
            ])
            ->join('public.portfolio_categories pc', 'pc.id = spr.category_id')
            ->join('public.portfolio_subcategories ps', 'ps.id = spr.subcategory_id', 'left')
            ->join('public.profiles p', 'p.id = spr.student_profile_id')
            ->orderBy('spr.created_at', 'DESC');

        if ($isStudent) {
            $builder->where('spr.student_profile_id', $actor['profile']['id']);
        } else {
            // Coordinator or OSAD viewer: only show submitted/verified unless viewing a specific student
            $studentParam = trim((string) $this->request->getGet('student_profile_id'));
            if ($studentParam !== '') {
                $builder->where('spr.student_profile_id', $studentParam);
            }
        }

        if ($statusFilter !== '' && $statusFilter !== 'ALL') {
            $builder->where('spr.status', $statusFilter);
        }
        if ($categoryFilter !== '' && $categoryFilter !== 'ALL') {
            $builder->where('spr.category_id', $categoryFilter);
        }

        $records = $builder->get()->getResultArray();

        // Attach evidence files count & items
        foreach ($records as &$rec) {
            $rec['evidence'] = $db->table('public.student_portfolio_evidence')
                ->where('portfolio_record_id', $rec['id'])
                ->get()->getResultArray();
            $rec['evidence_count'] = count($rec['evidence']);
        }
        unset($rec);

        return $this->respond(['data' => ['records' => $records]], 200);
    }

    /**
     * GET /api/v1/portfolio/{id}
     * Retrieves single portfolio record with evidence and timeline events.
     */
    public function get(string $id): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        if (! ValidationHelper::validateUuid($id)) {
            return $this->respond(['error' => ['code' => 'INVALID_ID', 'message' => 'Invalid record UUID.']], 422);
        }

        $db = db_connect();
        $record = $db->table('public.student_portfolio_records spr')
            ->select([
                'spr.*',
                'pc.name AS category_name',
                'pc.code AS category_code',
                'ps.name AS subcategory_name',
                'ps.code AS subcategory_code',
                'p.full_name AS student_name',
                'p.institutional_id AS student_id_number',
                'p.institutional_email AS student_email',
            ])
            ->join('public.portfolio_categories pc', 'pc.id = spr.category_id')
            ->join('public.portfolio_subcategories ps', 'ps.id = spr.subcategory_id', 'left')
            ->join('public.profiles p', 'p.id = spr.student_profile_id')
            ->where('spr.id', $id)
            ->get()->getRowArray();

        if ($record === null) {
            return $this->respond(['error' => ['code' => 'RECORD_NOT_FOUND', 'message' => 'Portfolio record not found.']], 404);
        }

        // Access check: student can only view own record; personnel/coordinator/osad can view
        $isStudent = ($actor['profile']['account_type'] ?? '') === 'student';
        if ($isStudent && $record['student_profile_id'] !== $actor['profile']['id']) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Access denied to this record.']], 403);
        }

        $evidence = $db->table('public.student_portfolio_evidence')
            ->where('portfolio_record_id', $id)
            ->get()->getResultArray();

        $events = $db->table('public.student_portfolio_verification_events ve')
            ->select(['ve.*', 'p.full_name AS actor_name'])
            ->join('public.profiles p', 'p.id = ve.actor_profile_id', 'left')
            ->where('ve.portfolio_record_id', $id)
            ->orderBy('ve.occurred_at', 'ASC')
            ->get()->getResultArray();

        return $this->respond([
            'data' => [
                'record'   => $record,
                'evidence' => $evidence,
                'events'   => $events,
            ],
        ], 200);
    }

    /**
     * POST /api/v1/portfolio
     * Student creates a new portfolio fact record (external submission).
     */
    public function create(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        if (($actor['profile']['account_type'] ?? '') !== 'student') {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only student accounts can create portfolio records.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $title = trim((string) ($json['title'] ?? ''));
        $categoryId = trim((string) ($json['category_id'] ?? ''));
        $subcategoryId = ! empty($json['subcategory_id']) ? trim((string) $json['subcategory_id']) : null;
        $organizer = ! empty($json['organizer_or_body']) ? trim((string) $json['organizer_or_body']) : null;
        $occurrenceDate = ! empty($json['occurrence_date']) ? trim((string) $json['occurrence_date']) : null;
        $startDate = ! empty($json['start_date']) ? trim((string) $json['start_date']) : null;
        $endDate = ! empty($json['end_date']) ? trim((string) $json['end_date']) : null;
        $description = ! empty($json['description']) ? trim((string) $json['description']) : null;
        $structuredMetadata = is_array($json['structured_metadata'] ?? null) ? $json['structured_metadata'] : [];
        $submitNow = (bool) ($json['submit_now'] ?? true);

        if ($title === '' || $categoryId === '') {
            return $this->respond(['error' => ['code' => 'MISSING_FIELDS', 'message' => 'Title and category_id are required.']], 422);
        }
        if (! ValidationHelper::validateUuid($categoryId)) {
            return $this->respond(['error' => ['code' => 'INVALID_CATEGORY_ID', 'message' => 'category_id must be a valid UUID.']], 422);
        }

        $db = db_connect();
        $recordId = (string) service('uuid')->uuid4();
        $initialStatus = $submitNow ? 'submitted' : 'draft';
        $now = date('Y-m-d H:i:s');

        $db->transBegin();
        try {
            $db->table('public.student_portfolio_records')->insert([
                'id'                  => $recordId,
                'student_profile_id'  => $actor['profile']['id'],
                'category_id'         => $categoryId,
                'subcategory_id'      => $subcategoryId,
                'title'               => $title,
                'organizer_or_body'   => $organizer,
                'occurrence_date'     => $occurrenceDate,
                'start_date'          => $startDate,
                'end_date'            => $endDate,
                'description'         => $description,
                'structured_metadata' => json_encode($structuredMetadata),
                'status'              => $initialStatus,
                'submitted_at'        => $submitNow ? $now : null,
                'created_at'          => $now,
                'updated_at'          => $now,
            ]);

            if ($submitNow) {
                $db->table('public.student_portfolio_verification_events')->insert([
                    'id'                  => (string) service('uuid')->uuid4(),
                    'portfolio_record_id' => $recordId,
                    'actor_profile_id'    => $actor['profile']['id'],
                    'action'              => 'submitted',
                    'previous_status'     => null,
                    'new_status'          => 'submitted',
                    'remarks'             => 'Submitted for Program Coordinator verification',
                    'occurred_at'         => $now,
                ]);
            }

            // Save evidence if supplied in payload
            $evidenceList = (array) ($json['evidence'] ?? []);
            foreach ($evidenceList as $ev) {
                if (! empty($ev['storage_path']) && ! empty($ev['original_filename'])) {
                    $db->table('public.student_portfolio_evidence')->insert([
                        'id'                  => (string) service('uuid')->uuid4(),
                        'portfolio_record_id' => $recordId,
                        'storage_path'        => trim((string) $ev['storage_path']),
                        'original_filename'   => trim((string) $ev['original_filename']),
                        'mime_type'           => trim((string) ($ev['mime_type'] ?? 'application/pdf')),
                        'byte_size'           => (int) ($ev['byte_size'] ?? 1024),
                        'evidence_type'       => trim((string) ($ev['evidence_type'] ?? 'certificate')),
                        'uploaded_by'         => $actor['profile']['id'],
                        'uploaded_at'         => $now,
                        'status'              => 'active',
                    ]);
                }
            }

            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->respond(['error' => ['code' => 'CREATION_FAILED', 'message' => 'Failed to create portfolio record: ' . $e->getMessage()]], 500);
        }

        return $this->respondCreated([
            'data' => [
                'message' => 'Portfolio record created successfully.',
                'id'      => $recordId,
                'status'  => $initialStatus,
            ],
        ]);
    }

    /**
     * POST /api/v1/portfolio/{id}/evidence
     * Attaches evidence file metadata to a portfolio record.
     */
    public function addEvidence(string $id): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $db = db_connect();
        $record = $db->table('public.student_portfolio_records')->where('id', $id)->get()->getRowArray();
        if ($record === null) {
            return $this->respond(['error' => ['code' => 'RECORD_NOT_FOUND', 'message' => 'Portfolio record not found.']], 404);
        }

        if ($record['student_profile_id'] !== $actor['profile']['id']) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Can only attach evidence to your own record.']], 403);
        }

        if (in_array($record['status'], ['verified', 'rejected'], true)) {
            return $this->respond(['error' => ['code' => 'RECORD_LOCKED', 'message' => 'Cannot add evidence to verified or rejected records.']], 422);
        }

        $json = $this->request->getJSON(true) ?? [];
        $storagePath = trim((string) ($json['storage_path'] ?? ''));
        $origFilename = trim((string) ($json['original_filename'] ?? ''));
        $mimeType = trim((string) ($json['mime_type'] ?? 'application/pdf'));
        $byteSize = (int) ($json['byte_size'] ?? 0);
        $evidenceType = trim((string) ($json['evidence_type'] ?? 'certificate'));

        if ($storagePath === '' || $origFilename === '') {
            return $this->respond(['error' => ['code' => 'MISSING_FILE_INFO', 'message' => 'storage_path and original_filename are required.']], 422);
        }

        $evidenceId = (string) service('uuid')->uuid4();
        $now = date('Y-m-d H:i:s');

        $db->table('public.student_portfolio_evidence')->insert([
            'id'                  => $evidenceId,
            'portfolio_record_id' => $id,
            'storage_path'        => $storagePath,
            'original_filename'   => $origFilename,
            'mime_type'           => $mimeType,
            'byte_size'           => $byteSize,
            'evidence_type'       => $evidenceType,
            'uploaded_by'         => $actor['profile']['id'],
            'uploaded_at'         => $now,
            'status'              => 'active',
        ]);

        return $this->respondCreated([
            'data' => [
                'message'     => 'Evidence attached successfully.',
                'evidence_id' => $evidenceId,
            ],
        ]);
    }

    /**
     * GET /api/v1/program-coordinator/verification-queue
     * Scoped queue: Program Coordinator sees only students currently enrolled in their assigned Academic Program.
     */
    public function coordinatorQueue(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $isCoordinator = in_array('program_coordinator', $actor['roles'], true);
        if (! $isCoordinator) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Program Coordinator role required.']], 403);
        }

        $db = db_connect();

        // Get Coordinator's active assigned academic program IDs
        $assignedPrograms = $db->table('public.program_coordinator_assignments')
            ->select('academic_program_id')
            ->where('personnel_profile_id', $actor['profile']['id'])
            ->where('is_active', true)
            ->get()->getResultArray();

        $programIds = array_column($assignedPrograms, 'academic_program_id');
        if (empty($programIds)) {
            return $this->respond(['data' => ['queue' => [], 'total' => 0]], 200);
        }

        $queue = $db->table('public.student_portfolio_records spr')
            ->select([
                'spr.*',
                'pc.name AS category_name',
                'pc.code AS category_code',
                'ps.name AS subcategory_name',
                'p.full_name AS student_name',
                'p.institutional_id AS student_id_number',
                'p.institutional_email AS student_email',
                'ap.code AS program_code',
                'ap.name AS program_name',
                'spe.year_level',
            ])
            ->join('public.portfolio_categories pc', 'pc.id = spr.category_id')
            ->join('public.portfolio_subcategories ps', 'ps.id = spr.subcategory_id', 'left')
            ->join('public.profiles p', 'p.id = spr.student_profile_id')
            ->join('public.student_program_enrollments spe', 'spe.student_profile_id = spr.student_profile_id AND spe.is_active = true')
            ->join('public.academic_programs ap', 'ap.id = spe.academic_program_id')
            ->whereIn('spe.academic_program_id', $programIds)
            ->whereIn('spr.status', ['submitted', 'needs_revision'])
            ->orderBy('spr.submitted_at', 'ASC')
            ->get()->getResultArray();

        foreach ($queue as &$item) {
            $item['evidence'] = $db->table('public.student_portfolio_evidence')
                ->where('portfolio_record_id', $item['id'])
                ->get()->getResultArray();
        }
        unset($item);

        return $this->respond(['data' => ['queue' => $queue, 'total' => count($queue)]], 200);
    }

    /**
     * POST /api/v1/portfolio/{id}/verify
     * Scoped coordinator approves student portfolio record -> status = 'verified'.
     */
    public function verifyRecord(string $id): mixed
    {
        return $this->decideRecord($id, 'verified', 'verified');
    }

    /**
     * POST /api/v1/portfolio/{id}/request-revision
     * Scoped coordinator requests revision -> status = 'needs_revision'.
     */
    public function requestRevision(string $id): mixed
    {
        return $this->decideRecord($id, 'needs_revision', 'revision_requested');
    }

    /**
     * POST /api/v1/portfolio/{id}/reject
     * Scoped coordinator rejects record -> status = 'rejected'.
     */
    public function rejectRecord(string $id): mixed
    {
        return $this->decideRecord($id, 'rejected', 'rejected');
    }

    protected function decideRecord(string $id, string $targetStatus, string $actionName): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $isCoordinator = in_array('program_coordinator', $actor['roles'], true);
        if (! $isCoordinator) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Program Coordinator role required.']], 403);
        }

        $db = db_connect();
        $record = $db->table('public.student_portfolio_records')->where('id', $id)->get()->getRowArray();
        if ($record === null) {
            return $this->respond(['error' => ['code' => 'RECORD_NOT_FOUND', 'message' => 'Portfolio record not found.']], 404);
        }

        // Scope check: verify student active academic program matches Coordinator's active assignment
        $studentEnrollment = $db->table('public.student_program_enrollments')
            ->where('student_profile_id', $record['student_profile_id'])
            ->where('is_active', true)
            ->get()->getRowArray();

        if ($studentEnrollment === null) {
            return $this->respond(['error' => ['code' => 'STUDENT_NO_PROGRAM', 'message' => 'Student has no active academic program enrollment.']], 422);
        }

        $hasScope = $db->table('public.program_coordinator_assignments')
            ->where('personnel_profile_id', $actor['profile']['id'])
            ->where('academic_program_id', $studentEnrollment['academic_program_id'])
            ->where('is_active', true)
            ->countAllResults() > 0;

        if (! $hasScope) {
            return $this->respond(['error' => ['code' => 'SCOPE_MISMATCH', 'message' => 'You are not the authorized Program Coordinator for this student program.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $remarks = trim((string) ($json['remarks'] ?? ''));
        $now = date('Y-m-d H:i:s');

        $db->transBegin();
        try {
            $db->table('public.student_portfolio_records')->where('id', $id)->update([
                'status'      => $targetStatus,
                'verified_at' => $targetStatus === 'verified' ? $now : null,
                'updated_at'  => $now,
            ]);

            $db->table('public.student_portfolio_verification_events')->insert([
                'id'                  => (string) service('uuid')->uuid4(),
                'portfolio_record_id' => $id,
                'actor_profile_id'    => $actor['profile']['id'],
                'action'              => $actionName,
                'previous_status'     => $record['status'],
                'new_status'          => $targetStatus,
                'remarks'             => $remarks !== '' ? $remarks : null,
                'occurred_at'         => $now,
            ]);

            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->respond(['error' => ['code' => 'DECISION_FAILED', 'message' => 'Failed to record decision: ' . $e->getMessage()]], 500);
        }

        return $this->respond([
            'data' => [
                'message'    => "Record successfully {$targetStatus}.",
                'id'         => $id,
                'status'     => $targetStatus,
                'action'     => $actionName,
            ],
        ], 200);
    }
}
