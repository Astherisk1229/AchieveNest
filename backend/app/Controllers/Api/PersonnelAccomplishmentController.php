<?php

namespace App\Controllers\Api;

use App\Helpers\ValidationHelper;
use App\Services\AuthorizationService;
use App\Services\LocalEvidenceStorageService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class PersonnelAccomplishmentController extends Controller
{
    use ResponseTrait;

    private AuthorizationService $authz;
    private LocalEvidenceStorageService $storage;

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

    private function actor(): ?array
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

    private function validateFacultyMetadata(string $categoryCode, array $metadata, string $occurrenceDate): ?string
    {
        if (($metadata['portfolio_format'] ?? '') !== 'faculty_academic') return null;
        $hierarchy = [
            'A1_PHD_HOLDER'=>'A.1','A1_PHD_UNITS'=>'A.1','A1_MA_HOLDER'=>'A.1','A1_MA_UNITS'=>'A.1',
            'A2_MEMBERSHIP'=>'A.2','A2_REGULAR_MEMBER'=>'A.2','A3_ATTENDANCE'=>'A.3','B1_ACTIVITY'=>'B.1','B2_PUBLICATION'=>'B.2',
            'B3_RESEARCH'=>'B.3','B4_AWARD'=>'B.4','B5_MATERIAL'=>'B.5','B6_CREATIVE_WORK'=>'B.6',
            'C1_MODERATOR'=>'C.1.1','C1_COACH'=>'C.1.2','C1_COMMITTEE'=>'C.1.3','C1_SERVICE'=>'C.1.4',
            'C2_CHURCH'=>'C.2.1','C2_CIVIC'=>'C.2.2','C2_CHARITY'=>'C.2.3',
        ];
        $subcategory = (string) ($metadata['subcategory_code'] ?? '');
        if (! isset($hierarchy[$subcategory]) || $hierarchy[$subcategory] !== $categoryCode || ($metadata['criterion_code'] ?? '') !== $categoryCode) {
            return 'The selected category and subcategory do not match.';
        }
        $details = is_array($metadata['details'] ?? null) ? $metadata['details'] : [];
        $required = match ($subcategory) {
            'A1_PHD_HOLDER','A1_MA_HOLDER' => ['degree_title','institution'],
            'A1_PHD_UNITS','A1_MA_UNITS' => ['units_completed','program','institution'],
            'A2_MEMBERSHIP','A2_REGULAR_MEMBER' => ['organization','membership_role'],
            'A3_ATTENDANCE' => ['title','organizer','scope'],
            'B1_ACTIVITY' => ['role','activity_title','organizer','extent','scope','participants'],
            'B2_PUBLICATION' => ['publication_title','publication_type','publisher_or_journal','scope'],
            'B3_RESEARCH' => ['research_title','granting_body'],
            'B4_AWARD' => ['award_title','granting_body','recognition_status','scope'],
            'B5_MATERIAL' => ['material_title','material_type'],
            'B6_CREATIVE_WORK' => ['creative_work','creative_work_type','presenting_body'],
            'C1_MODERATOR' => ['organization','role'], 'C1_COACH' => ['activity','role','organizer'],
            'C1_COMMITTEE','C1_SERVICE','C2_CHURCH','C2_CIVIC' => ['activity','organizer','role'],
            'C2_CHARITY' => ['activity','organizer','support_type'],
            default => ['activity','organizer'],
        };
        foreach ($required as $field) {
            $value = trim((string) ($details[$field] ?? ''));
            if ($value === '' || strlen($value) > ValidationHelper::MAX_LABEL_LENGTH || preg_match('/[\x00-\x1F\x7F]/', $value)) return "Invalid or missing detail: {$field}.";
        }
        if (in_array($subcategory, ['A1_PHD_UNITS','A1_MA_UNITS'], true) && preg_match('/^[1-9]\d*$/D', (string) ($details['units_completed'] ?? '')) !== 1) {
            return 'Units completed must be a whole number greater than zero.';
        }
        if ($subcategory === 'B1_ACTIVITY' && preg_match('/^[1-9]\d*$/D', (string) ($details['participants'] ?? '')) !== 1) {
            return 'Number of participants must be a whole number greater than zero.';
        }
        if (in_array($subcategory, ['A2_MEMBERSHIP','A2_REGULAR_MEMBER'], true)
            && in_array((string) ($details['membership_role'] ?? ''), ['Officer', 'Officer / Board Member'], true)
            && trim((string) ($details['position'] ?? '')) === '') {
            return 'Position / office held is required for an Officer membership.';
        }
        $enums = [
            'scope' => ['In-House', 'City / Provincial', 'Local', 'Regional', 'National', 'International'],
            'membership_role' => ['Officer', 'Member', 'Regular Member', 'Officer / Board Member'],
            'role:B1_ACTIVITY' => ['Guest Lecturer', 'Consultant', 'Judge', 'Resource Person'],
            'role:C1_MODERATOR' => ['Moderator', 'Officer'],
            'role:C1_COACH' => ['Coach', 'Trainer'],
            'publication_type' => ['Review', 'Compilation', 'Article', 'Scholarly Paper', 'Monograph', 'Research Output', 'Book'],
            'recognition_status' => ['Nominee', 'Awardee'],
            'extent' => ['1 Hour', 'Half Day', '1 Day', '2 Days', 'More than 2 Days'],
            'material_type' => ['Audio-Visual Aids', 'Modules', 'Printed / Bound', 'Other Bound Instructional Materials'],
        ];
        foreach ($enums as $fieldKey => $allowed) {
            [$field, $limitedSubcategory] = array_pad(explode(':', $fieldKey, 2), 2, null);
            if ($limitedSubcategory !== null && $limitedSubcategory !== $subcategory) continue;
            if (array_key_exists($field, $details) && ! in_array($details[$field], $allowed, true)) return "Invalid controlled value: {$field}.";
        }
        $today = date('Y-m-d');
        if ($occurrenceDate !== '' && $occurrenceDate > $today) return 'Completed accomplishments cannot use a future date.';
        $mode = (string) ($metadata['date_mode'] ?? 'single');
        if ($mode !== 'single') {
            $start = (string) ($metadata['start_date'] ?? ''); $end = (string) ($metadata['end_date'] ?? '');
            $ongoing = ($metadata['ongoing'] ?? false) === true;
            $ongoingAllowed = in_array($subcategory, ['A2_MEMBERSHIP','A2_REGULAR_MEMBER','C1_MODERATOR','C1_COACH'], true);
            if (! ValidationHelper::validateDateString($start) || (! $ongoing && ! ValidationHelper::validateDateString($end)) || ($end !== '' && $start > $end) || ($ongoing && ! $ongoingAllowed)) return 'Invalid accomplishment date period.';
        }
        return null;
    }

    private function duplicateHash(string $categoryCode, string $occurrenceDate, array $metadata): ?string
    {
        $subcategory = trim((string) ($metadata['subcategory_code'] ?? ''));
        if ($subcategory === '') return null;
        $normalize = static fn (mixed $value): string => preg_replace('/\s+/u', ' ', mb_strtolower(trim((string) $value)));
        $details = is_array($metadata['details'] ?? null) ? $metadata['details'] : [];
        ksort($details);
        foreach ($details as $key => $value) $details[$key] = $normalize($value);
        $identity = [
            'category_code' => $categoryCode,
            'subcategory_code' => $subcategory,
            'date' => $occurrenceDate,
            'start_date' => (string) ($metadata['start_date'] ?? ''),
            'end_date' => (string) ($metadata['end_date'] ?? ''),
            'ongoing' => ($metadata['ongoing'] ?? false) === true,
            'details' => $details,
        ];
        return hash('sha256', json_encode($identity, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    private function hasLockedPortfolio(string $personnelProfileId): bool
    {
        $db = db_connect();
        $table = $db->tableExists('personnel_evaluations') ? 'personnel_evaluations' : ($db->tableExists('public.personnel_evaluations') ? 'public.personnel_evaluations' : '');
        if ($table === '') return false;
        return $db->table($table)->where('personnel_profile_id', $personnelProfileId)
            ->whereIn('status', ['submitted', 'in_evaluation', 'ready_for_finalization', 'endorsed_to_hr', 'under_hr_review'])
            ->countAllResults() > 0;
    }

    public function index(): mixed
    {
        $actor = $this->actor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $profileId = $actor['profile']['id'];
        $isHr = $this->authz->hasRole($actor, 'hr_staff');
        $requestedProfileId = trim((string) $this->request->getGet('personnel_profile_id'));

        if ($requestedProfileId !== '' && ! $isHr && $requestedProfileId !== $profileId) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'You may only view your own accomplishments.']], 403);
        }

        $db = db_connect();
        $builder = $db->table('personnel_accomplishments pa')
            ->select('pa.*');

        if ($requestedProfileId !== '') {
            $builder->where('pa.personnel_profile_id', $requestedProfileId);
        } else {
            $this->authz->personnel()->scopeAccomplishmentQuery($actor, $builder);
        }

        $rows = $builder->groupBy('pa.id')
            ->orderBy('pa.created_at', 'DESC')
            ->get()->getResultArray();

        $accIds = array_column($rows, 'id');
        $evidenceMap = [];
        if (! empty($accIds)) {
            $evRows = $db->table('personnel_accomplishment_evidence')
                ->whereIn('accomplishment_id', $accIds)
                ->orderBy('uploaded_at', 'DESC')
                ->get()->getResultArray();
            foreach ($evRows as $ev) {
                $mimeType = strtolower((string) (($ev['detected_mime_type'] ?? '') ?: ($ev['mime_type'] ?? '')));
                $status = strtolower((string) ($ev['status'] ?? 'active'));
                $storagePath = (string) ($ev['storage_path'] ?? $ev['storage_key'] ?? '');
                $absolutePath = $storagePath !== '' ? $this->storage->resolveAbsolutePath($storagePath) : null;
                $previewable = $status === 'active'
                    && in_array($mimeType, ['application/pdf', 'image/jpeg', 'image/png'], true)
                    && $absolutePath !== null
                    && is_file($absolutePath);
                $evidenceMap[$ev['accomplishment_id']][] = [
                    'id'                => $ev['id'],
                    'original_filename' => $ev['original_filename'],
                    'byte_size'         => (int) $ev['byte_size'],
                    'mime_type'         => $mimeType,
                    'checksum'          => ($ev['checksum'] ?? '') ?: ($ev['sha256'] ?? ''),
                    'uploaded_at'       => $ev['uploaded_at'],
                    'status'            => $ev['status'] ?? 'active',
                    'previewable'       => $previewable,
                ];
            }
        }
        // Package D: Load achievement usage history for 2-year reuse eligibility
        $usageMap = [];
        if (! empty($accIds) && $db->tableExists('personnel_achievement_usage')) {
            $usageRows = $db->table('personnel_achievement_usage')
                ->whereIn('achievement_id', $accIds)
                ->orderBy('created_at', 'DESC')
                ->get()->getResultArray();
            foreach ($usageRows as $u) {
                if (! isset($usageMap[$u['achievement_id']])) {
                    $usageMap[$u['achievement_id']] = $u;
                }
            }
        }

        $currentYear = (int) date('Y');
        $currentAYStart = $currentYear; // e.g. 2026

        foreach ($rows as &$r) {
            $r['evidence'] = $evidenceMap[$r['id']] ?? [];
            $validEvidence = array_values(array_filter($r['evidence'], static fn (array $e): bool => $e['previewable'] === true));
            $r['primary_evidence'] = $validEvidence[0] ?? null;
            $r['has_valid_evidence'] = $r['primary_evidence'] !== null;
            $r['evidence_count'] = count($validEvidence);

            if (! $isHr) {
                foreach (['claimed_points', 'accepted_points', 'verified_points', 'provisional_points', 'reviewer_points', 'award_score', 'ranking_score', 'suggested_points'] as $protectedField) {
                    unset($r[$protectedField]);
                }
            }

            $usage = $usageMap[$r['id']] ?? null;
            if ($usage !== null) {
                $eligibleAgainAY = $usage['eligible_again_academic_year'];
                $eligibleStartYear = 0;
                if (preg_match('/(\d{4})/', $eligibleAgainAY, $m)) {
                    $eligibleStartYear = (int) $m[1];
                }
                $isEligible = ($currentAYStart >= $eligibleStartYear);
                $r['reuse'] = [
                    'is_eligible'                 => $isEligible,
                    'last_used_academic_year'     => $usage['academic_year'],
                    'eligible_again_academic_year'=> $eligibleAgainAY,
                    'status_label'                => $isEligible ? 'Eligible for Reuse' : 'Previously Used',
                ];
            } else {
                $r['reuse'] = [
                    'is_eligible'                 => true,
                    'last_used_academic_year'     => null,
                    'eligible_again_academic_year'=> null,
                    'status_label'                => 'Eligible for Portfolio',
                ];
            }
        }

        return $this->respond(['data' => ['accomplishments' => $rows, 'total' => count($rows)]]);
    }

    public function create(): mixed
    {
        $actor = $this->actor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }
        if (! $this->authz->personnel()->canCreateAccomplishment($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only active Personnel may create portfolio accomplishments.']], 403);
        }
        if ($this->hasLockedPortfolio((string) $actor['profile']['id'])) {
            return $this->respond(['error' => ['code' => 'PORTFOLIO_LOCKED', 'message' => 'Accomplishments cannot be changed while the portfolio is under review.']], 409);
        }

        $json = $this->request->getJSON(true) ?? [];
        $protectedFields = ['claimed_points', 'points', 'points_earned', 'accepted_points', 'verified_points', 'provisional_points', 'reviewer_points', 'reviewer_score', 'verification_score', 'award_score', 'ranking_score', 'suggested_points', 'maximum_points', 'weight', 'rank', 'reviewer_id', 'review_status', 'verification_status', 'endorsed_by', 'approved_by'];
        if (array_intersect($protectedFields, array_keys($json)) !== []) {
            return $this->respond(['error' => ['code' => 'PROTECTED_SCORING_FIELDS', 'message' => 'Personnel cannot set or change evaluation scores.']], 422);
        }
        $title = trim((string) ($json['title'] ?? ''));
        $domain = trim((string) ($json['domain'] ?? ''));
        $categoryArea = trim((string) ($json['category_area'] ?? ''));
        $category = trim((string) ($json['category'] ?? ''));
        $categoryCode = preg_match('/^([ABC]\.\d(?:\.\d)?)/', $category, $categoryMatch) ? $categoryMatch[1] : '';
        $categoryMetadata = is_array($json['category_metadata'] ?? null) ? $json['category_metadata'] : [];
        if ($categoryCode !== '' && $categoryArea !== '' && $categoryArea !== 'area' . $categoryCode[0]) {
            return $this->respond(['error' => ['code' => 'AREA_CLASSIFICATION_MISMATCH', 'message' => 'The selected classification does not belong to the supplied Area.']], 422);
        }
        if ($domain === '') {
            if ($categoryArea === 'areaA' || str_starts_with($category, 'A.') || str_starts_with($category, 'A ')) {
                $domain = 'professional_development';
            } elseif ($categoryArea === 'areaB' || str_starts_with($category, 'B.') || str_starts_with($category, 'B ')) {
                $domain = 'productivity_creative_work';
            } elseif ($categoryArea === 'areaC' || str_starts_with($category, 'C.') || str_starts_with($category, 'C ')) {
                $domain = 'service_leadership';
            } else {
                $domain = match ($categoryArea) {
                    'areaB' => 'productivity_creative_work',
                    'areaC' => 'service_leadership',
                    default => 'professional_development',
                };
            }
        }
        $organizer = trim((string) ($json['organizer_or_publisher'] ?? $json['institution'] ?? $json['issuer'] ?? $json['location'] ?? '')) ?: null;
        $description = trim((string) ($json['description'] ?? ''));
        $dateAchieved = trim((string) ($json['date_achieved'] ?? $json['occurrence_date'] ?? $json['date'] ?? ''));
        $facultyError = $this->validateFacultyMetadata($categoryCode, $categoryMetadata, $dateAchieved);
        if ($facultyError !== null) return $this->respond(['error' => ['code' => 'INVALID_FACULTY_ACCOMPLISHMENT', 'message' => $facultyError]], 422);
        $duplicateHash = $this->duplicateHash($categoryCode, $dateAchieved, $categoryMetadata);
        if ($duplicateHash !== null && db_connect()->fieldExists('duplicate_hash', 'personnel_accomplishments') && db_connect()->table('personnel_accomplishments')->where('personnel_profile_id', $actor['profile']['id'])->where('duplicate_hash', $duplicateHash)->countAllResults() > 0) {
            return $this->respond(['error' => ['code' => 'DUPLICATE_ACCOMPLISHMENT', 'message' => 'This accomplishment already exists in your portfolio.']], 409);
        }

        if (! ValidationHelper::validateBoundedText($title, ValidationHelper::MAX_LABEL_LENGTH)
            || ! in_array($domain, ['professional_development', 'productivity_creative_work', 'service_leadership'], true)
            || ($description !== '' && ! ValidationHelper::validateBoundedText($description, ValidationHelper::MAX_DESCRIPTION_LENGTH, true))
            || ($dateAchieved !== '' && ! ValidationHelper::validateDateString($dateAchieved))) {
            return $this->respond(['error' => ['code' => 'INVALID_ACCOMPLISHMENT', 'message' => 'Invalid accomplishment fields.']], 422);
        }

        $id = $this->genUuid();
        $now = date('Y-m-d H:i:s');
        try {
            $insert = [
                'id'                     => $id,
                'personnel_profile_id'   => $actor['profile']['id'],
                'domain'                 => $domain,
                'title'                  => $title,
                'organizer_or_publisher' => $organizer,
                'occurrence_date'        => $dateAchieved ?: null,
                'description'            => $description ?: null,
                'status'                 => 'draft',
                'created_at'             => $now,
                'updated_at'             => $now,
            ];
            $db = db_connect();
            if ($db->fieldExists('category_code', 'personnel_accomplishments')) $insert['category_code'] = $categoryCode ?: null;
            if ($db->fieldExists('category_area', 'personnel_accomplishments')) $insert['category_area'] = $categoryArea ?: null;
            if ($db->fieldExists('category_metadata', 'personnel_accomplishments')) $insert['category_metadata'] = $categoryMetadata !== [] ? json_encode($categoryMetadata) : null;
            if ($db->fieldExists('duplicate_hash', 'personnel_accomplishments')) $insert['duplicate_hash'] = $duplicateHash;
            $db->table('personnel_accomplishments')->insert($insert);
        } catch (Throwable $e) {
            if (str_contains(strtolower($e->getMessage()), 'duplicate') || str_contains($e->getMessage(), 'uq_personnel_accomplishment_duplicate')) {
                return $this->respond(['error' => ['code' => 'DUPLICATE_ACCOMPLISHMENT', 'message' => 'This accomplishment already exists in your portfolio.']], 409);
            }
            return $this->respond(['error' => ['code' => 'CREATE_FAILED', 'message' => 'Unable to create the accomplishment.']], 500);
        }

        return $this->respondCreated(['data' => ['id' => $id, 'status' => 'draft']]);
    }

    /** Creates the owned MySQL draft required to persist evidence before OCR. */
    public function beginEvidenceDraft(): mixed
    {
        $actor = $this->actor();
        if ($actor === null) return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        if (! $this->authz->personnel()->canCreateAccomplishment($actor)) return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only active Personnel may create accomplishment drafts.']], 403);
        if ($this->hasLockedPortfolio((string) $actor['profile']['id'])) return $this->respond(['error' => ['code' => 'PORTFOLIO_LOCKED', 'message' => 'Accomplishments cannot be changed while the portfolio is under review.']], 409);

        $id = $this->genUuid();
        $now = date('Y-m-d H:i:s');
        try {
            db_connect()->table('personnel_accomplishments')->insert([
                'id' => $id,
                'personnel_profile_id' => $actor['profile']['id'],
                'domain' => 'professional_development',
                'title' => 'Pending document review',
                'description' => 'Evidence-first draft. Complete classification before use.',
                'status' => 'draft',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        } catch (Throwable) {
            return $this->respond(['error' => ['code' => 'DRAFT_CREATE_FAILED', 'message' => 'Unable to prepare secure document storage.']], 500);
        }
        return $this->respondCreated(['data' => ['id' => $id, 'status' => 'draft']]);
    }

    /** Permissive owned-draft persistence; strict schema validation remains on final save. */
    public function saveDraft(string $id): mixed
    {
        $actor = $this->actor();
        if ($actor === null) return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        $db = db_connect();
        $record = $db->table('personnel_accomplishments')->where('id', $id)->get()->getRowArray();
        if ($record === null) return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Draft not found.']], 404);
        if (! hash_equals((string) $record['personnel_profile_id'], (string) $actor['profile']['id'])) return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'You may only save your own draft.']], 403);
        if (($record['status'] ?? '') !== 'draft' || $this->hasLockedPortfolio((string) $actor['profile']['id'])) return $this->respond(['error' => ['code' => 'DRAFT_NOT_EDITABLE', 'message' => 'This draft is no longer editable.']], 409);

        $json = $this->request->getJSON(true) ?? [];
        $protected = ['points', 'points_earned', 'accepted_points', 'verified_points', 'reviewer_id', 'review_status', 'evaluation_status'];
        if (array_intersect($protected, array_keys($json)) !== []) return $this->respond(['error' => ['code' => 'PROTECTED_FIELDS', 'message' => 'Evaluation fields cannot be saved by Personnel.']], 422);
        $title = trim((string) ($json['title'] ?? 'Pending document review')) ?: 'Pending document review';
        $metadata = is_array($json['category_metadata'] ?? null) ? $json['category_metadata'] : [];
        if (mb_strlen($title) > ValidationHelper::MAX_LABEL_LENGTH || strlen(json_encode($metadata) ?: '') > 32768) return $this->respond(['error' => ['code' => 'INVALID_DRAFT', 'message' => 'Draft content exceeds the allowed size.']], 422);
        $update = ['title' => $title, 'updated_at' => date('Y-m-d H:i:s')];
        foreach (['category_code', 'category_area'] as $field) if ($db->fieldExists($field, 'personnel_accomplishments') && isset($json[$field])) $update[$field] = trim((string) $json[$field]) ?: null;
        if ($db->fieldExists('category_metadata', 'personnel_accomplishments')) $update['category_metadata'] = $metadata === [] ? null : json_encode($metadata);
        $db->table('personnel_accomplishments')->where('id', $id)->update($update);
        return $this->respond(['data' => ['id' => $id, 'status' => 'draft', 'message' => 'Draft saved.']]);
    }

    public function show(string $id): mixed
    {
        $actor = $this->actor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }
        $db = db_connect();
        $record = $db->table('personnel_accomplishments')->where('id', $id)->get()->getRowArray();
        if ($record === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Accomplishment not found.']], 404);
        }
        $isOwner = hash_equals((string) $record['personnel_profile_id'], (string) $actor['profile']['id']);
        if (! $isOwner && ! $this->authz->hasRole($actor, 'hr_staff')) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'You may only view your own accomplishment.']], 403);
        }
        $record['category_metadata'] = isset($record['category_metadata']) && is_string($record['category_metadata'])
            ? (json_decode($record['category_metadata'], true) ?: []) : ($record['category_metadata'] ?? []);
        $record['evidence'] = $db->table('personnel_accomplishment_evidence')
            ->select('id, original_filename, byte_size, mime_type, detected_mime_type, uploaded_at, status')
            ->where('accomplishment_id', $id)->orderBy('uploaded_at', 'DESC')->get()->getResultArray();
        $record['primary_evidence'] = $record['evidence'][0] ?? null;
        foreach (['claimed_points', 'points', 'accepted_points', 'verified_points', 'provisional_points', 'reviewer_points', 'award_score', 'ranking_score', 'suggested_points', 'maximum_points'] as $field) {
            unset($record[$field]);
        }
        return $this->respond(['data' => ['accomplishment' => $record]]);
    }

    public function checkDuplicate(): mixed
    {
        $actor = $this->actor();
        if ($actor === null) return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        $json = $this->request->getJSON(true) ?? [];
        $category = trim((string) ($json['category'] ?? ''));
        $categoryCode = preg_match('/^([ABC]\.\d(?:\.\d)?)/', $category, $match) ? $match[1] : trim((string) ($json['category_code'] ?? ''));
        $metadata = is_array($json['category_metadata'] ?? null) ? $json['category_metadata'] : [];
        $date = trim((string) ($json['date_achieved'] ?? $json['occurrence_date'] ?? ''));
        $hash = $this->duplicateHash($categoryCode, $date, $metadata);
        if ($hash === null) return $this->respond(['data' => ['exact_duplicate' => false]]);
        $db = db_connect();
        if (! $db->fieldExists('duplicate_hash', 'personnel_accomplishments')) return $this->respond(['data' => ['exact_duplicate' => false, 'database_guard_available' => false]]);
        $builder = $db->table('personnel_accomplishments')->select('id, title, occurrence_date')->where('personnel_profile_id', $actor['profile']['id'])->where('duplicate_hash', $hash);
        $excludeId = trim((string) ($json['exclude_id'] ?? ''));
        if ($excludeId !== '') $builder->where('id !=', $excludeId);
        $existing = $builder->get()->getRowArray();
        return $this->respond(['data' => ['exact_duplicate' => $existing !== null, 'existing' => $existing]]);
    }

    public function update(string $id): mixed
    {
        $actor = $this->actor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $db = db_connect();
        $accomplishment = $db->table('personnel_accomplishments')
            ->where('id', $id)
            ->get()->getRowArray();

        if ($accomplishment === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Accomplishment not found.']], 404);
        }

        $isOwner = ($accomplishment['personnel_profile_id'] === $actor['profile']['id']);
        $isHr = $this->authz->hasRole($actor, 'hr_staff');
        if (! $isOwner && ! $isHr) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'You cannot edit this accomplishment.']], 403);
        }
        if ($isOwner && ! $isHr && $this->hasLockedPortfolio((string) $actor['profile']['id'])) {
            return $this->respond(['error' => ['code' => 'PORTFOLIO_LOCKED', 'message' => 'This accomplishment cannot be edited while the portfolio is under review.']], 409);
        }

        $json = $this->request->getJSON(true) ?? [];
        $protectedFields = ['claimed_points', 'points', 'points_earned', 'accepted_points', 'verified_points', 'provisional_points', 'reviewer_points', 'reviewer_score', 'verification_score', 'award_score', 'ranking_score', 'suggested_points', 'maximum_points', 'weight', 'rank', 'reviewer_id', 'review_status', 'verification_status', 'endorsed_by', 'approved_by'];
        if (array_intersect($protectedFields, array_keys($json)) !== []) {
            return $this->respond(['error' => ['code' => 'PROTECTED_SCORING_FIELDS', 'message' => 'Personnel cannot set or change evaluation scores.']], 422);
        }
        $title = isset($json['title']) ? trim((string) $json['title']) : $accomplishment['title'];
        $domain = isset($json['domain']) ? trim((string) $json['domain']) : $accomplishment['domain'];
        $categoryArea = trim((string) ($json['category_area'] ?? ''));
        $category = trim((string) ($json['category'] ?? ''));
        $categoryCode = preg_match('/^([ABC]\.\d(?:\.\d)?)/', $category, $categoryMatch) ? $categoryMatch[1] : ($accomplishment['category_code'] ?? '');
        $categoryMetadata = is_array($json['category_metadata'] ?? null) ? $json['category_metadata'] : null;
        if ($categoryCode !== '' && $categoryArea !== '' && $categoryArea !== 'area' . $categoryCode[0]) {
            return $this->respond(['error' => ['code' => 'AREA_CLASSIFICATION_MISMATCH', 'message' => 'The selected classification does not belong to the supplied Area.']], 422);
        }
        if ($category !== '' || $categoryArea !== '') {
            if ($categoryArea === 'areaA' || str_starts_with($category, 'A.') || str_starts_with($category, 'A ')) {
                $domain = 'professional_development';
            } elseif ($categoryArea === 'areaB' || str_starts_with($category, 'B.') || str_starts_with($category, 'B ')) {
                $domain = 'productivity_creative_work';
            } elseif ($categoryArea === 'areaC' || str_starts_with($category, 'C.') || str_starts_with($category, 'C ')) {
                $domain = 'service_leadership';
            }
        }
        $organizer = isset($json['organizer_or_publisher']) || isset($json['issuer']) || isset($json['location'])
            ? (trim((string) ($json['organizer_or_publisher'] ?? $json['issuer'] ?? $json['location'] ?? '')) ?: null)
            : $accomplishment['organizer_or_publisher'];
        $description = isset($json['description']) ? trim((string) $json['description']) : ($accomplishment['description'] ?? '');
        $dateAchieved = isset($json['date_achieved']) || isset($json['occurrence_date']) || isset($json['date'])
            ? trim((string) ($json['date_achieved'] ?? $json['occurrence_date'] ?? $json['date'] ?? ''))
            : ($accomplishment['occurrence_date'] ?? '');
        if ($categoryMetadata !== null) {
            $facultyError = $this->validateFacultyMetadata($categoryCode, $categoryMetadata, $dateAchieved);
            if ($facultyError !== null) return $this->respond(['error' => ['code' => 'INVALID_FACULTY_ACCOMPLISHMENT', 'message' => $facultyError]], 422);
        }
        $duplicateHash = $categoryMetadata !== null ? $this->duplicateHash($categoryCode, $dateAchieved, $categoryMetadata) : ($accomplishment['duplicate_hash'] ?? null);
        if ($duplicateHash !== null && $db->fieldExists('duplicate_hash', 'personnel_accomplishments') && $db->table('personnel_accomplishments')->where('personnel_profile_id', $actor['profile']['id'])->where('duplicate_hash', $duplicateHash)->where('id !=', $id)->countAllResults() > 0) {
            return $this->respond(['error' => ['code' => 'DUPLICATE_ACCOMPLISHMENT', 'message' => 'This accomplishment already exists in your portfolio.']], 409);
        }

        if (! ValidationHelper::validateBoundedText($title, ValidationHelper::MAX_LABEL_LENGTH)
            || ! in_array($domain, ['professional_development', 'productivity_creative_work', 'service_leadership'], true)
            || ($description !== '' && ! ValidationHelper::validateBoundedText($description, ValidationHelper::MAX_DESCRIPTION_LENGTH, true))
            || ($dateAchieved !== '' && ! ValidationHelper::validateDateString($dateAchieved))) {
            return $this->respond(['error' => ['code' => 'INVALID_ACCOMPLISHMENT', 'message' => 'Invalid accomplishment fields.']], 422);
        }

        $now = date('Y-m-d H:i:s');
        try {
            $update = [
                'title'                  => $title,
                'domain'                 => $domain,
                'organizer_or_publisher' => $organizer,
                'occurrence_date'        => $dateAchieved ?: null,
                'description'            => $description ?: null,
                'updated_at'             => $now,
            ];
            if ($db->fieldExists('category_code', 'personnel_accomplishments')) $update['category_code'] = $categoryCode ?: null;
            if ($db->fieldExists('category_area', 'personnel_accomplishments') && $categoryArea !== '') $update['category_area'] = $categoryArea;
            if ($db->fieldExists('category_metadata', 'personnel_accomplishments') && $categoryMetadata !== null) $update['category_metadata'] = json_encode($categoryMetadata);
            if ($db->fieldExists('duplicate_hash', 'personnel_accomplishments')) $update['duplicate_hash'] = $duplicateHash;
            $db->table('personnel_accomplishments')->where('id', $id)->update($update);
        } catch (Throwable) {
            return $this->respond(['error' => ['code' => 'UPDATE_FAILED', 'message' => 'Unable to update accomplishment.']], 500);
        }

        return $this->respond(['data' => ['id' => $id, 'message' => 'Accomplishment updated successfully.']]);
    }

    public function addEvidence(string $id): mixed
    {
        $actor = $this->actor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }
        if ($this->hasLockedPortfolio((string) $actor['profile']['id'])) {
            return $this->respond(['error' => ['code' => 'PORTFOLIO_LOCKED', 'message' => 'Evidence cannot be changed while the portfolio is under review.']], 409);
        }

        $file = $this->request->getFile('file') ?? $this->request->getFile('evidence_file');
        if ($file === null || ! $file->isValid()) {
            return $this->respond(['error' => ['code' => 'FILE_REQUIRED', 'message' => 'A valid evidence file is required in multipart/form-data.']], 400);
        }

        $uploadService = new \App\Services\PersonnelEvidenceUploadService($this->authz, $this->storage);
        $result = $uploadService->uploadEvidence($actor, $id, $file);

        if (! $result['success']) {
            return $this->respond(['error' => $result['error']], $result['status']);
        }

        return $this->respondCreated(['data' => $result['data']]);
    }

    public function delete(string $id): mixed
    {
        $actor = $this->actor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $db = db_connect();
        $accomplishment = $db->table('personnel_accomplishments')
            ->where('id', $id)
            ->get()->getRowArray();

        if ($accomplishment === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Accomplishment not found.']], 404);
        }

        $isOwner = ($accomplishment['personnel_profile_id'] === $actor['profile']['id']);
        $isHr = $this->authz->hasRole($actor, 'hr_staff');
        if (! $isOwner && ! $isHr) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'You cannot delete this accomplishment.']], 403);
        }
        if ($isOwner && ! $isHr && $this->hasLockedPortfolio((string) $actor['profile']['id'])) {
            return $this->respond(['error' => ['code' => 'PORTFOLIO_LOCKED', 'message' => 'This accomplishment cannot be deleted while the portfolio is under review.']], 409);
        }

        // Clean up attached physical evidence files
        $evidenceRows = $db->table('personnel_accomplishment_evidence')
            ->where('accomplishment_id', $id)
            ->get()->getResultArray();

        foreach ($evidenceRows as $ev) {
            if (! empty($ev['storage_path'])) {
                $this->storage->deletePhysicalFile($ev['storage_path']);
            }
        }

        $db->table('personnel_accomplishment_evidence')->where('accomplishment_id', $id)->delete();
        $db->table('personnel_accomplishments')->where('id', $id)->delete();

        return $this->respond(['data' => ['message' => 'Accomplishment and linked evidence deleted successfully.']]);
    }
}
