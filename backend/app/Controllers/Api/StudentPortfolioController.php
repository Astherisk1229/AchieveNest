<?php

namespace App\Controllers\Api;

use App\Helpers\ValidationHelper;
use App\Services\LocalEvidenceStorageService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class StudentPortfolioController extends Controller
{
    use ResponseTrait;

    protected AuthorizationService $authz;
    protected LocalEvidenceStorageService $storage;

    public function __construct(
        ?AuthorizationService $authz = null,
        ?LocalEvidenceStorageService $storage = null
    ) {
        $this->authz = $authz ?? new AuthorizationService();
        $this->storage = $storage ?? new LocalEvidenceStorageService();
    }

    public function options(): mixed
    {
        return $this->respond(null, 204);
    }

    protected function resolveActor(): ?array
    {
        return $this->authz->resolveActor($this->request->getHeaderLine('Authorization'));
    }

    private function genUuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            random_int(0, 0xffff), random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0x0fff) | 0x4000,
            random_int(0, 0x3fff) | 0x8000,
            random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff)
        );
    }

    /**
     * GET /api/v1/portfolio/categories
     * Lists active portfolio categories and subcategories with schema definitions.
     */
    public function categories(): mixed
    {
        $db = db_connect();
        $categories = $db->table('portfolio_categories')
            ->where('status', 'active')
            ->orderBy('sort_order', 'ASC')
            ->get()->getResultArray();

        $subcategories = $db->table('portfolio_subcategories')
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
     * Lists current student's portfolio records or authorized scoped records.
     */
    public function index(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $db = db_connect();
        $statusFilter = trim((string) $this->request->getGet('status'));
        $categoryFilter = trim((string) $this->request->getGet('category_id'));

        $builder = $db->table('student_portfolio_records spr')
            ->select([
                'spr.*',
                'pc.name AS category_name',
                'pc.code AS category_code',
                'ps.name AS subcategory_name',
                'ps.code AS subcategory_code',
                'p.full_name AS student_name',
                'p.institutional_id AS student_id_number',
            ])
            ->join('portfolio_categories pc', 'pc.id = spr.category_id')
            ->join('portfolio_subcategories ps', 'ps.id = spr.subcategory_id', 'left')
            ->join('profiles p', 'p.id = spr.student_profile_id')
            ->orderBy('spr.created_at', 'DESC');

        // Apply centralized application-layer scope policy
        $this->authz->portfolio()->scopeListQuery($actor, $builder);

        $studentParam = trim((string) $this->request->getGet('student_profile_id'));
        if ($studentParam !== '' && ($actor['profile']['account_type'] ?? '') !== 'student') {
            $builder->where('spr.student_profile_id', $studentParam);
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
            $rec['evidence'] = $db->table('student_portfolio_evidence')
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
        $record = $db->table('student_portfolio_records spr')
            ->select([
                'spr.*',
                'pc.name AS category_name',
                'pc.code AS category_code',
                'ps.name AS subcategory_name',
                'ps.code AS subcategory_code',
                'p.full_name AS student_name',
                'p.institutional_id AS student_id_number',
                'p.email AS student_email',
            ])
            ->join('portfolio_categories pc', 'pc.id = spr.category_id')
            ->join('portfolio_subcategories ps', 'ps.id = spr.subcategory_id', 'left')
            ->join('profiles p', 'p.id = spr.student_profile_id')
            ->where('spr.id', $id)
            ->get()->getRowArray();

        if ($record === null) {
            return $this->respond(['error' => ['code' => 'RECORD_NOT_FOUND', 'message' => 'Portfolio record not found.']], 404);
        }

        // Object-level authorization policy check
        if (! $this->authz->portfolio()->canView($actor, $record)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Access denied to this portfolio record.']], 403);
        }

        $evidence = $db->table('student_portfolio_evidence')
            ->where('portfolio_record_id', $id)
            ->get()->getResultArray();

        $safeEvidence = array_map(function ($ev) {
            return $this->storage->formatSafeEvidence($ev, 'student');
        }, $evidence);

        $events = $db->table('student_portfolio_verification_events ve')
            ->select(['ve.*', 'p.full_name AS actor_name'])
            ->join('profiles p', 'p.id = ve.actor_profile_id', 'left')
            ->where('ve.portfolio_record_id', $id)
            ->orderBy('ve.occurred_at', 'ASC')
            ->get()->getResultArray();

        return $this->respond([
            'data' => [
                'record'   => $record,
                'evidence' => $safeEvidence,
                'events'   => $events,
            ],
        ], 200);
    }

    /**
     * POST /api/v1/portfolio
     * Student creates a new portfolio fact record.
     */
    public function create(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        if (! $this->authz->portfolio()->canCreate($actor)) {
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

        // Validate Category exists
        $category = $db->table('portfolio_categories')->where('id', $categoryId)->where('status', 'active')->get()->getRowArray();
        if ($category === null) {
            return $this->respond(['error' => ['code' => 'INVALID_CATEGORY', 'message' => 'Category does not exist or is inactive.']], 422);
        }

        // Validate Subcategory belongs to Category if provided
        if ($subcategoryId !== null) {
            if (! ValidationHelper::validateUuid($subcategoryId)) {
                return $this->respond(['error' => ['code' => 'INVALID_SUBCATEGORY_ID', 'message' => 'subcategory_id must be a valid UUID.']], 422);
            }
            $subcat = $db->table('portfolio_subcategories')
                ->where('id', $subcategoryId)
                ->where('category_id', $categoryId)
                ->where('status', 'active')
                ->get()->getRowArray();

            if ($subcat === null) {
                return $this->respond(['error' => ['code' => 'INVALID_TAXONOMY_COMBINATION', 'message' => 'Subcategory does not belong to the selected category.']], 422);
            }
        }

        // Sports Metadata Rule
        $isSports = strtolower($category['code'] ?? '') === 'sports' || stripos($category['name'] ?? '', 'sport') !== false;
        if ($isSports) {
            $hasEventDate = ! empty($occurrenceDate) || ! empty($structuredMetadata['event_date']);
            $hasAcademicYear = ! empty($structuredMetadata['academic_year']);
            if (! $hasEventDate && ! $hasAcademicYear) {
                return $this->respond([
                    'error' => [
                        'code'    => 'MISSING_SPORTS_METADATA',
                        'message' => 'Sports achievements require at least an Event Date or Academic Year.',
                    ],
                ], 422);
            }
        }

        $recordId = $this->genUuid();
        $initialStatus = $submitNow ? 'submitted' : 'draft';
        $now = date('Y-m-d H:i:s');

        $db->transStart();
        try {
            $db->table('student_portfolio_records')->insert([
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
                $db->table('student_portfolio_verification_events')->insert([
                    'id'                  => $this->genUuid(),
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
                    $evId = $this->genUuid();
                    $db->table('student_portfolio_evidence')->insert([
                        'id'                  => $evId,
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

            $db->transComplete();
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->respond(['error' => ['code' => 'CREATION_FAILED', 'message' => 'Failed to create portfolio record: ' . $e->getMessage()]], 500);
        }

        if ($db->transStatus() === false) {
            return $this->respond(['error' => ['code' => 'CREATION_FAILED', 'message' => 'Transaction failed while creating portfolio record.']], 500);
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
     * Student uploads multipart evidence file for a portfolio record.
     */
    public function addEvidence(string $id): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        if (! ValidationHelper::validateUuid($id)) {
            return $this->respond(['error' => ['code' => 'INVALID_RECORD_ID', 'message' => 'Invalid portfolio record UUID.']], 422);
        }

        $db = db_connect();
        $record = $db->table('student_portfolio_records')->where('id', $id)->get()->getRowArray();
        if ($record === null) {
            return $this->respond(['error' => ['code' => 'RECORD_NOT_FOUND', 'message' => 'Portfolio record not found.']], 404);
        }

        if (! $this->authz->evidence()->canUploadStudentEvidence($actor, $record)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'You are not authorized to upload evidence for this record.']], 403);
        }

        $file = $this->request->getFile('file') ?? $this->request->getFile('evidence_file');
        if ($file === null || ! $file->isValid()) {
            return $this->respond(['error' => ['code' => 'FILE_REQUIRED', 'message' => 'A valid evidence file is required in multipart/form-data.']], 400);
        }

        $val = $this->storage->validateFile($file->getTempName(), $file->getClientName());
        if (! $val['success']) {
            $status = $val['error_code'] === 'FILE_TOO_LARGE' ? 413 : ($val['error_code'] === 'UNSUPPORTED_FILE_TYPE' ? 415 : 422);
            return $this->respond(['error' => ['code' => $val['error_code'], 'message' => $val['error_message']]], $status);
        }

        $evidenceType = trim((string) ($this->request->getPost('evidence_type') ?? 'certificate'));
        if ($evidenceType === '') {
            $evidenceType = 'certificate';
        }

        try {
            $stored = $this->storage->storeFile(
                $file->getTempName(),
                'student',
                $actor['profile']['id'],
                $id,
                $val['extension'],
                true
            );
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'STORAGE_FAILED', 'message' => 'Failed to store uploaded file.']], 500);
        }

        $evidenceId = $this->genUuid();
        $now = date('Y-m-d H:i:s');
        $evidenceRow = [
            'id'                  => $evidenceId,
            'portfolio_record_id' => $id,
            'storage_path'        => $stored['storage_path'],
            'original_filename'   => $file->getClientName(),
            'mime_type'           => $val['detected_mime'],
            'detected_mime_type'  => $val['detected_mime'],
            'byte_size'           => $stored['byte_size'],
            'checksum'            => $stored['sha256'],
            'sha256'              => $stored['sha256'],
            'evidence_type'       => $evidenceType,
            'uploaded_by'         => $actor['profile']['id'],
            'uploaded_at'         => $now,
            'security_status'     => 'pending',
            'malware_scanner'     => 'none_deferred',
            'status'              => 'active',
        ];

        $db->transStart();
        try {
            $db->table('student_portfolio_evidence')->insert($evidenceRow);
            $db->transComplete();
        } catch (Throwable $e) {
            $db->transRollback();
            $this->storage->deletePhysicalFile($stored['storage_path']);
            return $this->respond(['error' => ['code' => 'DATABASE_ERROR', 'message' => 'Failed to persist evidence record.']], 500);
        }

        if ($db->transStatus() === false) {
            $this->storage->deletePhysicalFile($stored['storage_path']);
            return $this->respond(['error' => ['code' => 'DATABASE_ERROR', 'message' => 'Failed to persist evidence record.']], 500);
        }

        return $this->respondCreated([
            'data' => [
                'message'  => 'Evidence uploaded and secured successfully.',
                'evidence' => $this->storage->formatSafeEvidence($evidenceRow, 'student'),
            ],
        ]);
    }

    /**
     * POST /api/v1/portfolio/{id}/resubmit
     * Student resubmits a returned/deficiency portfolio record.
     */
    public function resubmitRecord(string $id): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $db = db_connect();
        $record = $db->table('student_portfolio_records')->where('id', $id)->get()->getRowArray();
        if ($record === null) {
            return $this->respond(['error' => ['code' => 'RECORD_NOT_FOUND', 'message' => 'Portfolio record not found.']], 404);
        }

        if (! $this->authz->portfolio()->canSubmit($actor, $record)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Can only resubmit your own draft or revision-requested record.']], 403);
        }

        $now = date('Y-m-d H:i:s');
        $db->transStart();
        try {
            $db->table('student_portfolio_records')->where('id', $id)->update([
                'status'       => 'submitted',
                'submitted_at' => $now,
                'updated_at'   => $now,
            ]);

            $db->table('student_portfolio_verification_events')->insert([
                'id'                  => $this->genUuid(),
                'portfolio_record_id' => $id,
                'actor_profile_id'    => $actor['profile']['id'],
                'action'              => 'resubmitted',
                'previous_status'     => $record['status'],
                'new_status'          => 'submitted',
                'remarks'             => 'Resubmitted after addressing revision remarks',
                'occurred_at'         => $now,
            ]);

            $db->transComplete();
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->respond(['error' => ['code' => 'RESUBMIT_FAILED', 'message' => 'Failed to resubmit: ' . $e->getMessage()]], 500);
        }

        return $this->respond([
            'data' => [
                'message' => 'Portfolio record successfully resubmitted.',
                'id'      => $id,
                'status'  => 'submitted',
            ],
        ], 200);
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

        $programIds = $this->authz->getCoordinatorProgramIds($actor);
        $isOsad = $this->authz->hasRole($actor, 'osad_staff');

        if (empty($programIds) && ! $isOsad) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Program Coordinator or OSAD role required.']], 403);
        }

        $db = db_connect();
        $builder = $db->table('student_portfolio_records spr')
            ->select([
                'spr.*',
                'pc.name AS category_name',
                'pc.code AS category_code',
                'ps.name AS subcategory_name',
                'p.full_name AS student_name',
                'p.institutional_id AS student_id_number',
                'p.email AS student_email',
                'ap.code AS program_code',
                'ap.name AS program_name',
                'spe.year_level',
            ])
            ->join('portfolio_categories pc', 'pc.id = spr.category_id')
            ->join('portfolio_subcategories ps', 'ps.id = spr.subcategory_id', 'left')
            ->join('profiles p', 'p.id = spr.student_profile_id')
            ->join('student_program_enrollments spe', 'spe.student_profile_id = spr.student_profile_id AND spe.is_active = 1')
            ->join('academic_programs ap', 'ap.id = spe.academic_program_id')
            ->whereIn('spr.status', ['submitted', 'revisions_requested', 'under_review'])
            ->orderBy('spr.submitted_at', 'ASC');

        $this->authz->portfolio()->scopeVerificationQuery($actor, $builder);

        $queue = $builder->get()->getResultArray();

        foreach ($queue as &$item) {
            $item['evidence'] = $db->table('student_portfolio_evidence')
                ->where('portfolio_record_id', $item['id'])
                ->get()->getResultArray();
        }
        unset($item);

        return $this->respond(['data' => ['queue' => $queue, 'total' => count($queue)]], 200);
    }

    /**
     * POST /api/v1/portfolio/{id}/verify
     */
    public function verifyRecord(string $id): mixed
    {
        return $this->decideRecord($id, 'verified', 'verified');
    }

    /**
     * POST /api/v1/portfolio/{id}/request-revision
     */
    public function requestRevision(string $id): mixed
    {
        return $this->decideRecord($id, 'revisions_requested', 'revisions_requested');
    }

    /**
     * POST /api/v1/portfolio/{id}/reject
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

        $db = db_connect();
        $record = $db->table('student_portfolio_records')->where('id', $id)->get()->getRowArray();
        if ($record === null) {
            return $this->respond(['error' => ['code' => 'RECORD_NOT_FOUND', 'message' => 'Portfolio record not found.']], 404);
        }

        // Centralized object-level verification policy check
        if (! $this->authz->portfolio()->canVerify($actor, $record)) {
            // Distinguish specific denial reasons for clear error reporting
            if ($record['student_profile_id'] === $actor['profile']['id']) {
                return $this->respond(['error' => ['code' => 'SELF_VERIFICATION_FORBIDDEN', 'message' => 'Students cannot verify their own submissions.']], 403);
            }
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'You are not the authorized active Program Coordinator for this student program.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $remarks = trim((string) ($json['remarks'] ?? ''));
        $now = date('Y-m-d H:i:s');

        $db->transStart();
        try {
            $db->table('student_portfolio_records')->where('id', $id)->update([
                'status'      => $targetStatus,
                'verified_at' => $targetStatus === 'verified' ? $now : null,
                'updated_at'  => $now,
            ]);

            $db->table('student_portfolio_verification_events')->insert([
                'id'                  => $this->genUuid(),
                'portfolio_record_id' => $id,
                'actor_profile_id'    => $actor['profile']['id'],
                'action'              => $actionName,
                'previous_status'     => $record['status'],
                'new_status'          => $targetStatus,
                'remarks'             => $remarks !== '' ? $remarks : null,
                'occurred_at'         => $now,
            ]);

            // Emit notification to the student
            $notifType = 'portfolio_' . $actionName;
            $notifTitle = 'Portfolio Submission ' . ucfirst(str_replace('_', ' ', $targetStatus));
            $notifMsg = "Your portfolio submission '{$record['title']}' has been updated to {$targetStatus}.";
            if ($remarks !== '') {
                $notifMsg .= " Remarks: {$remarks}";
            }

            $db->table('notifications')->insert([
                'id'                   => $this->genUuid(),
                'recipient_profile_id' => $record['student_profile_id'],
                'actor_profile_id'     => $actor['profile']['id'],
                'notification_type'    => $notifType,
                'title'                => $notifTitle,
                'message'              => $notifMsg,
                'reference_type'       => 'student_portfolio_records',
                'reference_id'         => $id,
                'is_mandatory'         => 1,
                'created_at'           => $now,
            ]);

            $db->transComplete();
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->respond(['error' => ['code' => 'DECISION_FAILED', 'message' => 'Failed to record decision: ' . $e->getMessage()]], 500);
        }

        return $this->respond([
            'data' => [
                'message' => "Record successfully {$targetStatus}.",
                'id'      => $id,
                'status'  => $targetStatus,
                'action'  => $actionName,
            ],
        ], 200);
    }
}
