<?php

namespace App\Controllers\Api;

use App\Helpers\ValidationHelper;
use App\Services\AuthorizationService;
use App\Services\LocalEvidenceStorageService;
use App\Services\PortfolioStructuredMetadataValidator;
use App\Services\StudentAchievementEvidenceUploadPolicy;
use App\Services\StudentEvidenceClamAvScanner;
use App\Services\StudentEvidencePaddleOcrService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class StudentPortfolioController extends Controller
{
    use ResponseTrait;

    protected AuthorizationService $authz;
    protected LocalEvidenceStorageService $storage;
    protected PortfolioStructuredMetadataValidator $metadataValidator;
    protected ?\CodeIgniter\Database\BaseConnection $db;
    protected ?StudentEvidenceClamAvScanner $scanner = null;
    protected ?StudentEvidencePaddleOcrService $ocr = null;

    /** Scanner identity recorded on evidence rows; matches the canonical lifecycle scanner. */
    private const MALWARE_SCANNER_ID = 'clamav_1_5_4';

    private const PROTECTED_STUDENT_FIELDS = [
        'status', 'verification_status', 'verifier_id', 'verified_by', 'verified_at',
        'award_score', 'candidate_score', 'points', 'portfolio_verified', 'student_profile_id',
        'submitted_at', 'created_at', 'updated_at',
    ];

    public function __construct(
        ?AuthorizationService $authz = null,
        ?LocalEvidenceStorageService $storage = null,
        ?PortfolioStructuredMetadataValidator $metadataValidator = null,
        ?\CodeIgniter\Database\BaseConnection $db = null
    ) {
        $this->authz = $authz ?? new AuthorizationService();
        $this->storage = $storage ?? new LocalEvidenceStorageService();
        $this->metadataValidator = $metadataValidator ?? new PortfolioStructuredMetadataValidator();
        $this->db = $db;
    }

    protected function getDb(): \CodeIgniter\Database\BaseConnection
    {
        return $this->db ?? db_connect('default');
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

    private function protectedPayloadError(array $payload): ?array
    {
        $attempted = array_values(array_intersect(array_keys($payload), self::PROTECTED_STUDENT_FIELDS));
        if ($attempted === []) {
            return null;
        }

        return [
            'code' => 'PROTECTED_FIELDS_NOT_EDITABLE',
            'message' => 'Student requests cannot set workflow, verification, ownership, or scoring fields.',
            'fields' => $attempted,
        ];
    }

    private function stripStudentScoringFields(array $payload): array
    {
        foreach (array_keys($payload) as $key) {
            if (preg_match('/(?:score|points|ranking|threshold|award|candidate|weight)/i', (string) $key)) {
                unset($payload[$key]);
            }
        }
        return $payload;
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

        $db = $this->getDb();
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
            $evidenceRows = $db->table('student_portfolio_evidence')
                ->where('portfolio_record_id', $rec['id'])
                ->where('status', 'active')
                ->get()->getResultArray();
            $rec['evidence'] = array_map(fn (array $item): array => $this->storage->formatSafeEvidence($item, 'student', false), $evidenceRows);
            $rec['evidence_count'] = count($rec['evidence']);
            $latestDecision = $db->table('student_portfolio_verification_events')
                ->where('portfolio_record_id', $rec['id'])
                ->whereIn('action', ['revision_requested', 'rejected'])
                ->orderBy('occurred_at', 'DESC')
                ->get(1)->getRowArray();
            $rec['latest_remarks'] = $latestDecision['remarks'] ?? null;
            if (($actor['profile']['account_type'] ?? '') === 'student') {
                $rec = $this->stripStudentScoringFields($rec);
            }
        }
        unset($rec);

        $records = $this->attachActiveCertificates($records, $db);

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

        $db = $this->getDb();
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
            ->where('status', 'active')
            ->get()->getResultArray();

        $safeEvidence = array_map(function ($ev) {
            return $this->storage->formatSafeEvidence($ev, 'student', false);
        }, $evidence);

        if (($actor['profile']['account_type'] ?? '') === 'student') {
            $record = $this->stripStudentScoringFields($record);
        }

        $enriched = $this->attachActiveCertificates([$record], $db);
        $record = $enriched[0] ?? $record;

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
     * Resolves certificate lifecycle projection for a set of portfolio records in batch.
     *
     * Precedence: ISSUED > REVOKED > SUPERSEDED > NONE
     *
     * @param array<int, array> $records
     * @return array<int, array>
     */
    private function attachActiveCertificates(array $records, ?\CodeIgniter\Database\BaseConnection $db = null): array
    {
        if (empty($records)) {
            return [];
        }

        $db ??= $this->getDb();
        $recordIds = array_values(array_filter(array_column($records, 'id')));
        if (empty($recordIds)) {
            foreach ($records as &$rec) {
                $rec['certificate'] = null;
            }
            unset($rec);
            return $records;
        }

        $certRows = [];
        if ($db->tableExists('certificate_issuances')) {
            $certRows = $db->table('certificate_issuances')
                ->select([
                    'id',
                    'certificate_number',
                    'public_verification_id',
                    'status',
                    'issued_at',
                    'source_record_id',
                    'supersedes_certificate_id',
                    'superseded_by_certificate_id',
                    'revoked_at',
                    'created_at',
                ])
                ->whereIn('source_record_id', $recordIds)
                ->where('source_record_type', 'student_portfolio_record')
                ->orderBy('created_at', 'DESC')
                ->get()->getResultArray();
        }

        // Group rows by source_record_id and index by certificate ID
        $groupedBySource = [];
        $certById = [];
        foreach ($certRows as $cert) {
            $srcId = $cert['source_record_id'];
            $groupedBySource[$srcId][] = $cert;
            $certById[$cert['id']] = $cert;
        }

        $certMap = [];
        foreach ($recordIds as $recId) {
            $rows = $groupedBySource[$recId] ?? [];
            if (empty($rows)) {
                $certMap[$recId] = null;
                continue;
            }

            // Find candidates based on deterministic precedence: ISSUED > REVOKED > SUPERSEDED
            $issuedCert = null;
            $revokedCert = null;
            $supersededCert = null;

            foreach ($rows as $row) {
                if ($row['status'] === 'ISSUED' && $issuedCert === null) {
                    $issuedCert = $row;
                } elseif ($row['status'] === 'REVOKED' && $revokedCert === null) {
                    $revokedCert = $row;
                } elseif ($row['status'] === 'SUPERSEDED' && $supersededCert === null) {
                    $supersededCert = $row;
                }
            }

            if ($issuedCert !== null) {
                $prevCert = null;
                if (!empty($issuedCert['supersedes_certificate_id'])) {
                    $pred = $certById[$issuedCert['supersedes_certificate_id']] ?? null;
                    if (!$pred) {
                        $pred = $db->table('certificate_issuances')->where('id', $issuedCert['supersedes_certificate_id'])->get()->getRowArray();
                    }
                    if ($pred) {
                        $prevCert = [
                            'id'                     => $pred['id'],
                            'certificate_number'     => $pred['certificate_number'],
                            'status'                 => $pred['status'],
                            'verification_url'       => '/verify/certificate/' . $pred['public_verification_id'],
                        ];
                    }
                }

                $certMap[$recId] = [
                    'id'                     => $issuedCert['id'],
                    'certificate_number'     => $issuedCert['certificate_number'],
                    'public_verification_id' => $issuedCert['public_verification_id'],
                    'status'                 => 'ISSUED',
                    'issued_at'              => $issuedCert['issued_at'],
                    'verification_url'       => '/verify/certificate/' . $issuedCert['public_verification_id'],
                    'pdf_url'                => '/api/v1/certificates/' . $issuedCert['id'] . '/pdf',
                    'downloadable'           => true,
                    'replacement'            => null,
                    'previous_certificate'   => $prevCert,
                ];
            } elseif ($revokedCert !== null) {
                $certMap[$recId] = [
                    'id'                     => $revokedCert['id'],
                    'certificate_number'     => $revokedCert['certificate_number'],
                    'public_verification_id' => $revokedCert['public_verification_id'],
                    'status'                 => 'REVOKED',
                    'issued_at'              => $revokedCert['issued_at'],
                    'verification_url'       => '/verify/certificate/' . $revokedCert['public_verification_id'],
                    'pdf_url'                => null,
                    'downloadable'           => false,
                    'replacement'            => null,
                    'previous_certificate'   => null,
                ];
            } elseif ($supersededCert !== null) {
                $replacement = null;
                if (!empty($supersededCert['superseded_by_certificate_id'])) {
                    $rep = $certById[$supersededCert['superseded_by_certificate_id']] ?? null;
                    if (!$rep) {
                        $rep = $db->table('certificate_issuances')->where('id', $supersededCert['superseded_by_certificate_id'])->get()->getRowArray();
                    }
                    if ($rep) {
                        $replacement = [
                            'id'                     => $rep['id'],
                            'certificate_number'     => $rep['certificate_number'],
                            'public_verification_id' => $rep['public_verification_id'],
                            'status'                 => $rep['status'],
                            'verification_url'       => '/verify/certificate/' . $rep['public_verification_id'],
                            'pdf_url'                => $rep['status'] === 'ISSUED' ? ('/api/v1/certificates/' . $rep['id'] . '/pdf') : null,
                        ];
                    }
                }

                $certMap[$recId] = [
                    'id'                     => $supersededCert['id'],
                    'certificate_number'     => $supersededCert['certificate_number'],
                    'public_verification_id' => $supersededCert['public_verification_id'],
                    'status'                 => 'SUPERSEDED',
                    'issued_at'              => $supersededCert['issued_at'],
                    'verification_url'       => '/verify/certificate/' . $supersededCert['public_verification_id'],
                    'pdf_url'                => null,
                    'downloadable'           => false,
                    'replacement'            => $replacement,
                    'previous_certificate'   => null,
                ];
            } else {
                $certMap[$recId] = null;
            }
        }

        foreach ($records as &$rec) {
            $rec['certificate'] = $certMap[$rec['id']] ?? null;
        }
        unset($rec);

        return $records;
    }

    /**
     * PUT /api/v1/portfolio/{id}
     * Updates an owned draft or revision-requested record before submission.
     */
    public function update(string $id): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }
        if (! ValidationHelper::validateUuid($id)) {
            return $this->respond(['error' => ['code' => 'INVALID_ID', 'message' => 'Invalid record UUID.']], 422);
        }

        $db = db_connect();
        $record = $db->table('student_portfolio_records')->where('id', $id)->get()->getRowArray();
        if ($record === null) {
            return $this->respond(['error' => ['code' => 'RECORD_NOT_FOUND', 'message' => 'Portfolio record not found.']], 404);
        }
        if (! $this->authz->portfolio()->canSubmit($actor, $record)
            || ! in_array($record['status'], ['draft', 'revision_requested'], true)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only your own draft or revision-requested record can be edited.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        if (($error = $this->protectedPayloadError($json)) !== null) {
            return $this->respond(['error' => $error], 422);
        }
        $categoryId = trim((string) ($json['category_id'] ?? $record['category_id']));
        $subcategoryId = array_key_exists('subcategory_id', $json)
            ? (! empty($json['subcategory_id']) ? trim((string) $json['subcategory_id']) : null)
            : ($record['subcategory_id'] ?? null);
        $taxonomy = $this->metadataValidator->validateTaxonomyPair($categoryId, $subcategoryId);
        if (! $taxonomy['valid']) {
            return $this->respond(['error' => $taxonomy['error']], 422);
        }

        $existingMetadata = json_decode((string) ($record['structured_metadata'] ?? '{}'), true) ?: [];
        $metadata = is_array($json['structured_metadata'] ?? null) ? $json['structured_metadata'] : $existingMetadata;
        $metadataResult = $this->metadataValidator->validateMetadata($categoryId, $subcategoryId, $metadata, false);
        if (! $metadataResult['valid']) {
            return $this->respond(['error' => ['code' => 'INVALID_STRUCTURED_METADATA', 'message' => 'Structured metadata validation failed.', 'errors' => $metadataResult['errors']]], 422);
        }

        $changes = [
            'category_id' => $categoryId,
            'subcategory_id' => $subcategoryId,
            'structured_metadata' => json_encode($metadataResult['sanitized_metadata']),
            'updated_at' => date('Y-m-d H:i:s'),
        ];
        foreach (['title', 'organizer_or_body', 'occurrence_date', 'start_date', 'end_date', 'description'] as $field) {
            if (array_key_exists($field, $json)) {
                $changes[$field] = $json[$field] === null ? null : trim((string) $json[$field]);
            }
        }
        $db->table('student_portfolio_records')->where('id', $id)->update($changes);
        return $this->respond(['data' => ['message' => 'Portfolio record updated.', 'id' => $id, 'status' => $record['status']]], 200);
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
        if (($error = $this->protectedPayloadError($json)) !== null) {
            return $this->respond(['error' => $error], 422);
        }
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

        if ($submitNow) {
            return $this->respond(['error' => [
                'code' => 'DRAFT_AND_EVIDENCE_REQUIRED_FIRST',
                'message' => 'Create a draft, persist evidence through the protected upload endpoint, then submit the same record for verification.',
            ]], 422);
        }

        // Drafts may be created before a title is known (evidence-first entry).
        // resubmitRecord() enforces title and all other completeness rules.
        if ($categoryId === '') {
            return $this->respond(['error' => ['code' => 'MISSING_FIELDS', 'message' => 'category_id is required.']], 422);
        }

        $taxResult = $this->metadataValidator->validateTaxonomyPair($categoryId, $subcategoryId);
        if (! $taxResult['valid']) {
            return $this->respond(['error' => $taxResult['error']], 422);
        }
        $category = $taxResult['category'];
        $subcat = $taxResult['subcategory'];

        // Validate Structured Metadata & Controlled Vocabularies
        $metaResult = $this->metadataValidator->validateMetadata($categoryId, $subcategoryId, $structuredMetadata, $submitNow);
        if (! $metaResult['valid']) {
            return $this->respond([
                'error' => [
                    'code'    => 'INVALID_STRUCTURED_METADATA',
                    'message' => 'Structured metadata validation failed.',
                    'errors'  => $metaResult['errors'],
                ],
            ], 422);
        }
        $sanitizedMetadata = $metaResult['sanitized_metadata'];

        $db = db_connect();

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

        // Campus Journalism Metadata Validation (Phase 2 Source-Fidelity Rules)
        $isJournalism = ($categoryId === '2b09cd61-7a23-4466-be58-889398e8f201')
            || strtolower($category['code'] ?? '') === 'campus_journalism_publication'
            || stripos($category['name'] ?? '', 'journalism') !== false;

        if ($isJournalism && $submitNow) {
            if (empty($subcategoryId)) {
                return $this->respond([
                    'error' => [
                        'code'    => 'MISSING_PUBLICATION_TYPE',
                        'message' => 'Campus Journalism achievements require a specific Publication Type or Role Subcategory before submission.',
                    ],
                ], 422);
            }

            // Publication Types (News, Literary, Column, Editorial)
            $pubSubcategoryCodes = ['COMP_JOURN_NEWS', 'COMP_JOURN_LITERARY', 'COMP_JOURN_COLUMN', 'COMP_JOURN_EDITORIAL'];
            $pubSubcategoryIds = [
                '40000009-0001-0000-0000-000000000001',
                '40000009-0001-0000-0000-000000000002',
                '40000009-0001-0000-0000-000000000003',
                '40000009-0001-0000-0000-000000000004',
            ];

            $isPubType = in_array($subcategoryId, $pubSubcategoryIds, true)
                || in_array($subcat['code'] ?? '', $pubSubcategoryCodes, true)
                || in_array(strtolower($subcat['name'] ?? ''), ['news item', 'literary', 'column', 'editorial', 'news item evidence', 'literary evidence', 'column evidence', 'editorial evidence'], true);

            if ($isPubType) {
                if (empty($organizer)) {
                    return $this->respond([
                        'error' => [
                            'code'    => 'MISSING_PUBLICATION_OUTLET',
                            'message' => 'Publication Outlet (organizer_or_body) is mandatory for Campus Journalism publication records.',
                        ],
                    ], 422);
                }

                if (empty($occurrenceDate) && empty($startDate)) {
                    return $this->respond([
                        'error' => [
                            'code'    => 'MISSING_PUBLICATION_DATE',
                            'message' => 'Publication Date is mandatory for Campus Journalism publication records.',
                        ],
                    ], 422);
                }

                $pubDateStr = $occurrenceDate ?? $startDate;
                if ($pubDateStr !== null && strtotime($pubDateStr) > time()) {
                    return $this->respond([
                        'error' => [
                            'code'    => 'INVALID_PUBLICATION_DATE',
                            'message' => 'Publication Date cannot be a future date.',
                        ],
                    ], 422);
                }

                $role = $structuredMetadata['contribution_role'] ?? $structuredMetadata['role'] ?? null;
                if (empty($role)) {
                    return $this->respond([
                        'error' => [
                            'code'    => 'MISSING_CONTRIBUTION_ROLE',
                            'message' => 'Student Contribution / Authorship Role (e.g., Writer, Editor, Contributor) is mandatory.',
                        ],
                    ], 422);
                }

                $evidenceList = (array) ($json['evidence'] ?? []);
                if (empty($evidenceList)) {
                    return $this->respond([
                        'error' => [
                            'code'    => 'MISSING_EVIDENCE_ATTACHMENT',
                            'message' => 'At least one supporting evidence attachment is mandatory before submitting a Campus Journalism publication record.',
                        ],
                    ], 422);
                }
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
                'structured_metadata' => json_encode($sanitizedMetadata),
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

        $val = (new StudentAchievementEvidenceUploadPolicy($this->storage))->validate($file->getTempName(), $file->getClientName());
        if (! ($val['success'] ?? false)) {
            $code = (string) ($val['error_code'] ?? 'STUDENT_EVIDENCE_TYPE_NOT_ALLOWED');
            $status = match ($code) {
                'FILE_TOO_LARGE' => 413,
                'UNSUPPORTED_FILE_TYPE', 'STUDENT_EVIDENCE_TYPE_NOT_ALLOWED' => 415,
                default => 422,
            };
            // Student evidence is limited to PDF/JPEG/PNG even though the shared storage
            // validator also accepts DOC/DOCX, so its message is not reused for type errors.
            $message = match ($code) {
                'FILE_TOO_LARGE' => 'Evidence files may be at most 10 MiB.',
                'STUDENT_EVIDENCE_PDF_PAGE_LIMIT_EXCEEDED' => 'PDF evidence may have at most 2 pages.',
                'UNSUPPORTED_FILE_TYPE', 'STUDENT_EVIDENCE_TYPE_NOT_ALLOWED' => 'Only PDF, JPEG, or PNG evidence is accepted.',
                default => (string) ($val['error_message'] ?? 'The evidence file was rejected.'),
            };
            return $this->respond(['error' => ['code' => $code, 'message' => $message]], $status);
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
            'malware_scanner'     => 'clamav_pending',
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
     * POST /api/v1/portfolio/{id}/evidence/{evidenceId}/scan
     * Owner-only malware scan (ClamAV). OCR is a separate request (see readEvidence) so a
     * slow scan and a slow OCR run never share one HTTP request.
     * Fails closed: when the scanner is unavailable, security_status stays 'pending'.
     */
    public function scanEvidence(string $id, string $evidenceId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }
        if (! ValidationHelper::validateUuid($id) || ! ValidationHelper::validateUuid($evidenceId)) {
            return $this->respond(['error' => ['code' => 'INVALID_ID', 'message' => 'Invalid record or evidence UUID.']], 422);
        }

        $db = $this->getDb();
        $record = $db->table('student_portfolio_records')->where('id', $id)->get()->getRowArray();
        if ($record === null) {
            return $this->respond(['error' => ['code' => 'RECORD_NOT_FOUND', 'message' => 'Portfolio record not found.']], 404);
        }
        if (! $this->authz->portfolio()->canEdit($actor, $record)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only the owner of a draft or returned record can scan its evidence.']], 403);
        }

        $evidence = $db->table('student_portfolio_evidence')
            ->where('id', $evidenceId)
            ->where('portfolio_record_id', $id)
            ->where('status', 'active')
            ->get()->getRowArray();
        if ($evidence === null) {
            return $this->respond(['error' => ['code' => 'EVIDENCE_NOT_FOUND', 'message' => 'Active evidence not found for this record.']], 404);
        }

        $path = $this->storage->resolveAbsolutePath((string) $evidence['storage_path']);
        if ($path === null || ! is_file($path)) {
            return $this->respond(['error' => ['code' => 'EVIDENCE_FILE_UNAVAILABLE', 'message' => 'The stored evidence file could not be found.']], 422);
        }

        $scan = ($this->scanner ??= new StudentEvidenceClamAvScanner())->scan($path);
        $now = date('Y-m-d H:i:s');
        $response = ['scan' => $scan];

        if (($scan['status'] ?? '') === 'clean') {
            $db->table('student_portfolio_evidence')->where('id', $evidenceId)->update([
                'security_status'       => 'clean',
                'malware_scanner'       => self::MALWARE_SCANNER_ID,
                'security_validated_at' => $now,
            ]);
        } elseif (($scan['status'] ?? '') === 'infected') {
            // The schema allows status active|archived|deleted, so rejected files are archived.
            $db->table('student_portfolio_evidence')->where('id', $evidenceId)->update([
                'security_status'       => 'rejected',
                'status'                => 'archived',
                'malware_scanner'       => self::MALWARE_SCANNER_ID,
                'security_validated_at' => $now,
            ]);
        }

        $fresh = $db->table('student_portfolio_evidence')->where('id', $evidenceId)->get()->getRowArray();
        $response['evidence'] = $this->storage->formatSafeEvidence($fresh ?? $evidence, 'student');

        return $this->respond(['data' => $response], 200);
    }

    /**
     * POST /api/v1/portfolio/{id}/evidence/{evidenceId}/ocr
     * Owner-only advisory OCR for evidence that already passed the security scan.
     * OCR failure is reported as data (ocr_error); it never blocks manual entry.
     */
    public function readEvidence(string $id, string $evidenceId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }
        if (! ValidationHelper::validateUuid($id) || ! ValidationHelper::validateUuid($evidenceId)) {
            return $this->respond(['error' => ['code' => 'INVALID_ID', 'message' => 'Invalid record or evidence UUID.']], 422);
        }

        $db = $this->getDb();
        $record = $db->table('student_portfolio_records')->where('id', $id)->get()->getRowArray();
        if ($record === null) {
            return $this->respond(['error' => ['code' => 'RECORD_NOT_FOUND', 'message' => 'Portfolio record not found.']], 404);
        }
        if (! $this->authz->portfolio()->canEdit($actor, $record)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only the owner of a draft or returned record can read its evidence.']], 403);
        }

        $evidence = $db->table('student_portfolio_evidence')
            ->where('id', $evidenceId)
            ->where('portfolio_record_id', $id)
            ->where('status', 'active')
            ->get()->getRowArray();
        if ($evidence === null) {
            return $this->respond(['error' => ['code' => 'EVIDENCE_NOT_FOUND', 'message' => 'Active evidence not found for this record.']], 404);
        }
        if (($evidence['security_status'] ?? '') !== 'clean') {
            return $this->respond(['error' => ['code' => 'EVIDENCE_NOT_SCANNED', 'message' => 'Evidence must pass the security scan before it can be read.']], 409);
        }

        $path = $this->storage->resolveAbsolutePath((string) $evidence['storage_path']);
        if ($path === null || ! is_file($path)) {
            return $this->respond(['error' => ['code' => 'EVIDENCE_FILE_UNAVAILABLE', 'message' => 'The stored evidence file could not be found.']], 422);
        }

        try {
            $mime = (string) ($evidence['detected_mime_type'] ?? $evidence['mime_type'] ?? '');
            $ocr = ($this->ocr ??= new StudentEvidencePaddleOcrService())->extract($path, $mime);

            return $this->respond(['data' => ['ocr' => $ocr]], 200);
        } catch (Throwable) {
            return $this->respond(['data' => ['ocr' => null, 'ocr_error' => 'OCR assistance was unavailable. You can continue with manual entry.']], 200);
        }
    }

    /**
     * DELETE /api/v1/portfolio/{id}/evidence/{evidenceId}
     * Owner-only soft removal while the record is editable. The file and row are kept.
     */
    public function removeEvidence(string $id, string $evidenceId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }
        if (! ValidationHelper::validateUuid($id) || ! ValidationHelper::validateUuid($evidenceId)) {
            return $this->respond(['error' => ['code' => 'INVALID_ID', 'message' => 'Invalid record or evidence UUID.']], 422);
        }

        $db = $this->getDb();
        $evidence = $db->table('student_portfolio_evidence spe')
            ->select(['spe.*', 'spr.student_profile_id'])
            ->join('student_portfolio_records spr', 'spr.id = spe.portfolio_record_id')
            ->where('spe.id', $evidenceId)
            ->where('spe.portfolio_record_id', $id)
            ->get()->getRowArray();
        if ($evidence === null) {
            return $this->respond(['error' => ['code' => 'EVIDENCE_NOT_FOUND', 'message' => 'Evidence not found for this record.']], 404);
        }
        if (! $this->authz->evidence()->canDeleteStudentEvidence($actor, $evidence)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only the owner of a draft or returned record can remove its evidence.']], 403);
        }

        if (($evidence['status'] ?? '') === 'active') {
            // Soft delete only; the protected file is never removed from storage.
            $db->table('student_portfolio_evidence')
                ->where('id', $evidenceId)
                ->where('status', 'active')
                ->update(['status' => 'deleted']);
        }

        $fresh = $db->table('student_portfolio_evidence')->where('id', $evidenceId)->get()->getRowArray();

        return $this->respond(['data' => [
            'message'  => 'Evidence removed from this record.',
            'evidence' => $this->storage->formatSafeEvidence($fresh ?? $evidence, 'student'),
        ]], 200);
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

        $taxonomy = $this->metadataValidator->validateTaxonomyPair(
            (string) ($record['category_id'] ?? ''),
            ! empty($record['subcategory_id']) ? (string) $record['subcategory_id'] : null
        );
        if (! $taxonomy['valid'] || empty($record['subcategory_id'])) {
            return $this->respond(['error' => [
                'code' => 'INCOMPLETE_CLASSIFICATION',
                'message' => 'A valid category and matching subcategory are required before submission.',
            ]], 422);
        }

        $metadata = json_decode((string) ($record['structured_metadata'] ?? '{}'), true);
        $metadataResult = $this->metadataValidator->validateMetadata(
            (string) $record['category_id'],
            (string) $record['subcategory_id'],
            is_array($metadata) ? $metadata : [],
            true
        );
        if (! $metadataResult['valid']) {
            return $this->respond(['error' => [
                'code' => 'INVALID_STRUCTURED_METADATA',
                'message' => 'Complete all required achievement details before submission.',
                'errors' => $metadataResult['errors'],
            ]], 422);
        }

        $title = trim((string) ($record['title'] ?? ''));
        $organizer = trim((string) ($record['organizer_or_body'] ?? ''));
        $startDate = trim((string) ($record['start_date'] ?? $record['occurrence_date'] ?? ''));
        if (mb_strlen($title) < 3 || $organizer === '' || $startDate === '') {
            return $this->respond(['error' => [
                'code' => 'INCOMPLETE_COMMON_DETAILS',
                'message' => 'Title, organizer or issuing body, and start date are required before submission.',
            ]], 422);
        }
        if (! empty($record['end_date']) && (string) $record['end_date'] < $startDate) {
            return $this->respond(['error' => ['code' => 'INVALID_DATE_RANGE', 'message' => 'End date cannot be before start date.']], 422);
        }

        $evidenceCount = $db->table('student_portfolio_evidence')
            ->where('portfolio_record_id', $id)
            ->where('status', 'active')
            ->where('security_status', 'clean')
            ->countAllResults();
        if ($evidenceCount < 1) {
            return $this->respond(['error' => [
                'code' => 'CLEAN_EVIDENCE_REQUIRED',
                'message' => 'At least one supporting evidence file that passed the security scan is required before submission.',
            ]], 422);
        }

        $duplicate = $db->table('student_portfolio_records')
            ->where('student_profile_id', $record['student_profile_id'])
            ->where('category_id', $record['category_id'])
            ->where('subcategory_id', $record['subcategory_id'])
            ->where('title', $title)
            ->where('start_date', $startDate)
            ->where('id !=', $id)
            ->whereNotIn('status', ['rejected'])
            ->countAllResults();
        if ($duplicate > 0) {
            return $this->respond(['error' => ['code' => 'DUPLICATE_ACHIEVEMENT', 'message' => 'A matching achievement record already exists. Review the existing record instead of submitting a duplicate.']], 409);
        }

        // Same program-resolution rule as coordinator scoping and canVerify().
        $program = $this->authz->portfolio()->resolveStudentProgram((string) $record['student_profile_id']);
        if ($program['status'] === 'ambiguous') {
            return $this->respond(['error' => [
                'code' => 'AMBIGUOUS_ACTIVE_STUDENT_PROGRAM',
                'message' => 'You have more than one active program enrollment. Contact OSAD to correct your enrollment before submitting.',
            ]], 422);
        }
        $coordinators = $program['program_id'] !== null
            ? $this->authz->portfolio()->activeCoordinatorIds($program['program_id'])
            : [];
        if (count($coordinators) !== 1) {
            return $this->respond(['error' => [
                'code' => 'VERIFICATION_ROUTING_UNAVAILABLE',
                'message' => 'No single active Program Coordinator is assigned to your current program. Contact OSAD before submitting.',
            ]], 503);
        }
        $routing = ['academic_program_id' => $program['program_id'], 'coordinator_profile_id' => $coordinators[0]];

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
                'action'              => $record['status'] === 'draft' ? 'submitted' : 'resubmitted',
                'previous_status'     => $record['status'],
                'new_status'          => 'submitted',
                'remarks'             => $record['status'] === 'draft'
                    ? 'Submitted for Program Coordinator verification'
                    : 'Resubmitted after addressing revision remarks',
                'occurred_at'         => $now,
            ]);

            $db->transComplete();
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->respond(['error' => ['code' => 'RESUBMIT_FAILED', 'message' => 'Failed to resubmit: ' . $e->getMessage()]], 500);
        }
        if ($db->transStatus() === false) {
            return $this->respond(['error' => ['code' => 'RESUBMIT_FAILED', 'message' => 'The submission transaction could not be committed.']], 500);
        }


        // Notifications are auxiliary. Queue visibility is derived from the
        // persisted submitted record and authoritative program assignment.
        try {
            $db->table('notifications')->insert([
                'id'                   => $this->genUuid(),
                'recipient_profile_id' => $routing['coordinator_profile_id'],
                'actor_profile_id'     => $actor['profile']['id'],
                'notification_type'    => 'student_achievement_submitted',
                'title'                => 'Student Achievement Submitted',
                'message'              => "A student achievement '{$title}' is ready for verification.",
                'reference_type'       => 'student_portfolio_records',
                'reference_id'         => $id,
                'is_mandatory'         => 1,
                'created_at'           => $now,
            ]);
        } catch (Throwable) {
            // Deliberately do not invalidate a committed submission.
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

        // Default: records awaiting action. ?status=all adds decided records for history views.
        $requested = strtolower(trim((string) $this->request->getGet('status')));
        $allowed = ['submitted', 'revision_requested', 'verified', 'rejected'];
        $statuses = match (true) {
            $requested === '' => ['submitted', 'revision_requested'],
            $requested === 'all' => $allowed,
            in_array($requested, $allowed, true) => [$requested],
            default => null,
        };
        if ($statuses === null) {
            return $this->respond(['error' => ['code' => 'INVALID_STATUS_FILTER', 'message' => 'status must be submitted, revision_requested, verified, rejected, or all.']], 422);
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
            ->whereIn('spr.status', $statuses)
            ->orderBy('spr.submitted_at', 'ASC');

        $this->authz->portfolio()->scopeVerificationQuery($actor, $builder);

        $queue = $builder->get()->getResultArray();

        foreach ($queue as &$item) {
            // Reviewer-safe evidence only: no storage paths or internal hashes, active files only.
            $rows = $db->table('student_portfolio_evidence')
                ->where('portfolio_record_id', $item['id'])
                ->where('status', 'active')
                ->get()->getResultArray();
            $item['evidence'] = array_map(fn (array $row): array => $this->storage->formatSafeEvidence($row, 'student', false), $rows);
            $item['evidence_count'] = count($item['evidence']);
            $latestDecision = $db->table('student_portfolio_verification_events')
                ->where('portfolio_record_id', $item['id'])
                ->whereIn('action', ['revision_requested', 'rejected'])
                ->orderBy('occurred_at', 'DESC')
                ->get(1)->getRowArray();
            $item['latest_remarks'] = $latestDecision['remarks'] ?? null;
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
        return $this->decideRecord($id, 'revision_requested', 'revision_requested');
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

        // Scope first: an unauthorized actor gets 403 whatever the record's state.
        if (! $this->authz->portfolio()->canReviewStudent($actor, $record)) {
            if ($record['student_profile_id'] === $actor['profile']['id']) {
                return $this->respond(['error' => ['code' => 'SELF_VERIFICATION_FORBIDDEN', 'message' => 'Students cannot verify their own submissions.']], 403);
            }
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'You are not the authorized active Program Coordinator for this student program.']], 403);
        }

        // Only 'submitted' records can be decided. Already-decided records get 409.
        if (in_array($record['status'], ['verified', 'rejected', 'revision_requested'], true)) {
            return $this->respond(['error' => [
                'code'    => 'DECISION_ALREADY_RECORDED',
                'message' => "A decision was already recorded for this submission (current status: {$record['status']}).",
            ]], 409);
        }
        if ($record['status'] !== 'submitted') {
            return $this->respond(['error' => [
                'code'    => 'INVALID_STATE_TRANSITION',
                'message' => "Records in '{$record['status']}' state cannot be decided upon. Must be in a reviewable state.",
            ]], 422);
        }

        $json = $this->request->getJSON(true) ?? [];
        $remarks = trim((string) ($json['remarks'] ?? ''));

        // Phase 3 Rules: VR-3.6 & VR-3.7 (Revision and Rejection require non-empty remarks)
        if (in_array($targetStatus, ['revision_requested', 'rejected'], true) && $remarks === '') {
            return $this->respond([
                'error' => [
                    'code'    => 'REMARKS_REQUIRED',
                    'message' => "A specific explanation remark is mandatory when requesting revisions or rejecting a submission.",
                ],
            ], 422);
        }

        // Phase 3 Rule: VR-3.5 (Evidence must exist at verification time)
        if ($targetStatus === 'verified') {
            $evidenceCount = $db->table('student_portfolio_evidence')
                ->where('portfolio_record_id', $id)
                ->where('status', 'active')
                ->where('security_status', 'clean')
                ->countAllResults();

            if ($evidenceCount === 0) {
                return $this->respond([
                    'error' => [
                        'code'    => 'CLEAN_EVIDENCE_REQUIRED',
                        'message' => 'Cannot verify a portfolio record without active supporting evidence that passed the security scan.',
                    ],
                ], 422);
            }
        }
        $now = date('Y-m-d H:i:s');

        // Race-safe: the status change only applies while the record is still 'submitted'.
        // A concurrent decision that already moved it affects 0 rows and is refused with 409.
        $db->transBegin();
        try {
            $db->table('student_portfolio_records')
                ->where('id', $id)
                ->where('status', 'submitted')
                ->update([
                    'status'      => $targetStatus,
                    'verified_at' => $targetStatus === 'verified' ? $now : null,
                    'updated_at'  => $now,
                ]);

            if ($db->affectedRows() !== 1) {
                $db->transRollback();
                return $this->respond(['error' => [
                    'code'    => 'DECISION_ALREADY_RECORDED',
                    'message' => 'Another decision was recorded for this submission first.',
                ]], 409);
            }

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

            if ($db->transStatus() === false) {
                $db->transRollback();
                return $this->respond(['error' => ['code' => 'DECISION_FAILED', 'message' => 'The verification decision could not be committed.']], 500);
            }
            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->respond(['error' => ['code' => 'DECISION_FAILED', 'message' => 'Failed to record decision: ' . $e->getMessage()]], 500);
        }


        try {
            $notifMsg = "Your portfolio submission '{$record['title']}' has been updated to {$targetStatus}.";
            if ($remarks !== '') {
                $notifMsg .= " Remarks: {$remarks}";
            }
            $db->table('notifications')->insert([
                'id'                   => $this->genUuid(),
                'recipient_profile_id' => $record['student_profile_id'],
                'actor_profile_id'     => $actor['profile']['id'],
                'notification_type'    => 'portfolio_' . $actionName,
                'title'                => 'Portfolio Submission ' . ucfirst(str_replace('_', ' ', $targetStatus)),
                'message'              => $notifMsg,
                'reference_type'       => 'student_portfolio_records',
                'reference_id'         => $id,
                'is_mandatory'         => 1,
                'created_at'           => $now,
            ]);
        } catch (Throwable) {
            // A notification failure must not roll back the decision.
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
