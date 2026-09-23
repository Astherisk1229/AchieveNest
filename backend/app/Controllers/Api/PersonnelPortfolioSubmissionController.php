<?php

namespace App\Controllers\Api;

use App\Helpers\ValidationHelper;
use App\Services\AuthorizationService;
use App\Services\ReviewerResolverService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use RuntimeException;
use Throwable;

/**
 * PersonnelPortfolioSubmissionController
 *
 * Plan C — Phase C1, C2, C3, C4 & C5:
 * Canonical Whole-Portfolio Submission, Immutability, Whole-Portfolio Return for Revision,
 * Multi-Version History, One Evaluation Root per Cycle & Approved Deletion Exception.
 */
class PersonnelPortfolioSubmissionController extends Controller
{
    use ResponseTrait;

    /** Remove evaluator-only score state from responses returned to the portfolio owner. */
    private function withoutPersonnelScoring(mixed $row): mixed
    {
        if (! is_array($row)) {
            return $row;
        }
        foreach (array_keys($row) as $key) {
            if (preg_match('/(?:points?|score|scoring|cap|ceiling)/i', (string) $key)) {
                unset($row[$key]);
                continue;
            }
            if (is_array($row[$key])) {
                $row[$key] = $this->withoutPersonnelScoring($row[$key]);
            }
        }
        return $row;
    }

    private function existingFieldsOnly(object $db, string $table, array $data): array
    {
        return array_filter($data, static fn ($value, $field): bool => $db->fieldExists((string) $field, $table), ARRAY_FILTER_USE_BOTH);
    }

    private AuthorizationService $authz;

    public function __construct(?AuthorizationService $authz = null)
    {
        $this->authz = $authz ?? new AuthorizationService();
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

    private function calculateEligibleAgainAcademicYear(string $academicYear, int $lockYears = 2): string
    {
        if (preg_match('/(\d{4})\s*-\s*(\d{4})/', $academicYear, $matches)) {
            $start = (int) $matches[1] + $lockYears;
            $end = (int) $matches[2] + $lockYears;
            return "AY {$start}-{$end}";
        }
        return "AY " . (date('Y') + $lockYears) . "-" . (date('Y') + $lockYears + 1);
    }

    private function getRootsTable($db): string
    {
        return $db->tableExists('public.personnel_evaluation_roots') ? 'public.personnel_evaluation_roots' : 'personnel_evaluation_roots';
    }

    private function getEvaluationsTable($db): string
    {
        return $db->tableExists('public.personnel_evaluations') ? 'public.personnel_evaluations' : 'personnel_evaluations';
    }

    private function getItemsTable($db): string
    {
        return $db->tableExists('public.personnel_evaluation_items') ? 'public.personnel_evaluation_items' : 'personnel_evaluation_items';
    }

    private function getEventsTable($db): string
    {
        return $db->tableExists('public.personnel_evaluation_events') ? 'public.personnel_evaluation_events' : 'personnel_evaluation_events';
    }

    /** Persist the portable workflow-event DTO against either legacy or canonical event columns. */
    private function persistEvaluationEvent(object $db, string $table, array $event, ?string $previousStatus, string $newStatus): void
    {
        $row = $event;
        if (! $db->fieldExists('event_type', $table)) {
            $row['action'] = $row['event_type'];
            unset($row['event_type']);
        }
        if (! $db->fieldExists('performed_by', $table)) {
            $row['actor_profile_id'] = $row['performed_by'];
            unset($row['performed_by']);
        }
        if (! $db->fieldExists('payload', $table)) {
            $row['remarks'] = $row['payload'];
            unset($row['payload']);
        }
        if (! $db->fieldExists('created_at', $table)) {
            $row['occurred_at'] = $row['created_at'];
            unset($row['created_at']);
        }
        if ($db->fieldExists('previous_status', $table)) $row['previous_status'] = $previousStatus;
        if ($db->fieldExists('new_status', $table)) $row['new_status'] = $newStatus;
        $db->table($table)->insert($this->existingFieldsOnly($db, $table, $row));
    }

    /**
     * Confirms whether actor is authorized as reviewer (HR Admin, Dean, or Assigned Evaluator).
     */
    private function isAuthorizedReviewer(?array $actor, array $evaluation): bool
    {
        if ($actor === null) {
            return false;
        }

        $roles = $actor['roles'] ?? [];
        $accountType = $actor['profile']['account_type'] ?? '';
        $profileId = $actor['profile']['id'] ?? '';

        // HR Admin / HR Staff
        if ($accountType === 'hr_admin' || in_array('hr_staff', $roles, true)) {
            return true;
        }

        // Assigned Evaluator
        if ($profileId !== '' && $profileId === ($evaluation['evaluator_profile_id'] ?? null)) {
            return true;
        }

        return false;
    }

    /**
     * Phase C2.1 & C3: Domain Guard asserting that submitted evaluations and item snapshots are locked.
     * Throws RuntimeException if the evaluation is in a locked lifecycle state.
     *
     * @param array $evaluation
     * @throws RuntimeException
     */
    public static function assertSubmittedEvaluationImmutable(array $evaluation): void
    {
        $lockedStatuses = ['submitted', 'in_evaluation', 'ready_for_finalization', 'completed', 'returned_for_revision'];
        $status = strtolower((string) ($evaluation['status'] ?? ''));

        if (in_array($status, $lockedStatuses, true)) {
            throw new RuntimeException(
                "Submitted portfolio evaluation is currently in '{$status}' state and is strictly immutable.",
                409
            );
        }
    }

    /**
     * POST /api/v1/personnel/portfolio/submit
     * Creates an authoritative whole-portfolio submission package under an evaluation root and snapshots line items.
     */
    public function submit(): mixed
    {
        $actor = $this->actor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $personnelProfileId = $actor['profile']['id'] ?? null;
        if (! $personnelProfileId) {
            return $this->respond(['error' => ['code' => 'INVALID_ACTOR', 'message' => 'Personnel profile not found.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $evaluationPeriodId = trim((string) ($json['evaluation_period_id'] ?? ''));
        if ($evaluationPeriodId === '') return $this->respond(['error' => ['code' => 'EVALUATION_PERIOD_REQUIRED', 'message' => 'Select the current open personnel evaluation period before submitting.']], 422);
        $idempotencyKey = trim($this->request->getHeaderLine('Idempotency-Key'));
        if ($idempotencyKey === '' || ! preg_match('/^[A-Za-z0-9._:-]{8,100}$/', $idempotencyKey)) {
            return $this->respond(['error' => ['code' => 'IDEMPOTENCY_KEY_REQUIRED', 'message' => 'A valid submission request key is required. Please retry from the portfolio page.']], 422);
        }
        try {
            $period = (new \App\Services\PersonnelEvaluationPeriodService())->resolveForSubmission($evaluationPeriodId, 'RANKING_PROMOTION');
        } catch (\InvalidArgumentException|\RuntimeException $e) {
            return $this->respond(['error' => ['code' => strtok($e->getMessage(), ':') ?: 'EVALUATION_PERIOD_INVALID', 'message' => $e->getMessage()]], 422);
        }
        $academicYear = $period['academic_year'];
        $evaluationCycleId = $period['id'];

        $db = db_connect();
        $eligibility = (new \App\Services\PersonnelEligibilityService($db))->evaluateEligibility($personnelProfileId, $period['id']);
        if (($eligibility['eligibility_status'] ?? 'pending') !== 'eligible') {
            $annual = $eligibility['annual_review_requirement']['status'] ?? 'pending';
            $service = $eligibility['service_requirement']['status'] ?? 'pending';
            $code = $annual === 'pending' ? 'ANNUAL_REVIEW_PENDING' : ($annual === 'not_passed' ? 'ANNUAL_REVIEW_NOT_PASSED' : ($service === 'pending' ? 'SERVICE_REQUIREMENT_PENDING' : ($service === 'not_passed' ? 'SERVICE_REQUIREMENT_NOT_MET' : 'PORTFOLIO_NOT_ELIGIBLE')));
            return $this->respond(['error'=>['code'=>$code,'message'=>'Portfolio submission is unavailable until eligibility is confirmed.','reasons'=>$eligibility['eligibility_reasons']]],422);
        }
        $rootsTable = $this->getRootsTable($db);
        $evalsTable = $this->getEvaluationsTable($db);
        $itemsTable = $this->getItemsTable($db);
        $eventsTable = $this->getEventsTable($db);
        $personnel = $db->table('personnel_profiles pp')
            ->select('pp.personnel_classification, pp.position_title, pca.college_id, c.name AS college_name, paua.administrative_unit_id AS department_id, au.name AS department_name, da.id AS dean_assignment_id')
            ->join('personnel_college_affiliations pca', 'pca.personnel_profile_id=pp.profile_id AND pca.is_active=1', 'left')
            ->join('colleges c', 'c.id=pca.college_id', 'left')
            ->join('personnel_administrative_unit_affiliations paua', 'paua.personnel_profile_id=pp.profile_id AND paua.is_active=1', 'left')
            ->join('administrative_units au', 'au.id=paua.administrative_unit_id', 'left')
            ->join('dean_assignments da', 'da.personnel_profile_id=pp.profile_id AND da.is_active=1', 'left')
            ->where('pp.profile_id', $personnelProfileId)->get()->getRowArray() ?? [];
        $actualGroup = ($personnel['personnel_classification'] ?? '') === 'non_academic' ? 'NON_TEACHING_FACULTY' : 'FACULTY';
        if (($period['personnel_group'] ?? 'FACULTY') !== $actualGroup) return $this->respond(['error'=>['code'=>'PERSONNEL_GROUP_MISMATCH','message'=>'This ranking period does not apply to your personnel classification.']], 422);
        try { $criteriaSnapshot = (new \App\Services\RubricAdministrationService())->getScaleVersionHierarchy($period['evaluation_scale_version_id']); }
        catch (\Throwable $e) { return $this->respond(['error'=>['code'=>'CRITERIA_SNAPSHOT_FAILED','message'=>'The assigned ranking criteria could not be snapshotted.']], 422); }
        if ($db->tableExists('personnel_evaluation_idempotency')) {
            $priorRequest = $db->table('personnel_evaluation_idempotency')->where([
                'actor_profile_id' => $personnelProfileId,
                'operation' => 'portfolio-submit',
                'idempotency_key' => $idempotencyKey,
            ])->get()->getRowArray();
            if ($priorRequest) {
                $priorEvaluation = $db->table($evalsTable)->where('id', $priorRequest['resource_id'])->get()->getRowArray();
                if ($priorEvaluation && ($priorEvaluation['evaluation_period_id'] ?? null) === $evaluationPeriodId) {
                    return $this->respond(['data' => [
                        'message' => 'Portfolio submission was already accepted.',
                        'submission_id' => $priorEvaluation['id'],
                        'evaluation_root_id' => $priorEvaluation['evaluation_root_id'] ?? null,
                        'version_number' => (int) ($priorEvaluation['version_number'] ?? 1),
                        'status' => $priorEvaluation['status'],
                        'submitted_at' => $priorEvaluation['submitted_at'],
                        'academic_year' => $priorEvaluation['academic_year'],
                        'evaluation_cycle_id' => $priorEvaluation['evaluation_cycle_id'],
                    ]]);
                }
                return $this->respond(['error' => ['code' => 'IDEMPOTENCY_CONFLICT', 'message' => 'This submission request key was already used for another request.']], 409);
            }
        }

        // Phase C5: One evaluation root per cycle guard
        $existingRoot = null;
        if ($db->tableExists($rootsTable)) {
            $existingRoot = $db->table($rootsTable)
                ->where('personnel_profile_id', $personnelProfileId)
                ->where('evaluation_cycle_id', $evaluationCycleId)
                ->get()
                ->getRowArray();
        }

        if ($existingRoot !== null) {
            $latestEval = null;
            if ($db->fieldExists('evaluation_root_id', $evalsTable)) {
                $latestEval = $db->table($evalsTable)
                    ->where('evaluation_root_id', $existingRoot['id'])
                    ->orderBy('version_number', 'DESC')
                    ->get()
                    ->getRowArray();
            }
            if ($latestEval === null) {
                $evalBuilder = $db->table($evalsTable)
                    ->where('personnel_profile_id', $personnelProfileId)
                    ->where('academic_year', $academicYear);
                if ($db->fieldExists('submitted_at', $evalsTable)) {
                    $evalBuilder->orderBy('submitted_at', 'DESC');
                } else {
                    $evalBuilder->orderBy('created_at', 'DESC');
                }
                $latestEval = $evalBuilder->get()->getRowArray();
            }

            if ($latestEval !== null) {
                $existingStatus = strtolower((string) ($latestEval['status'] ?? ''));
                if ($existingStatus === 'returned_for_revision' || $existingStatus === 'returned_to_personnel') {
                    return $this->respond([
                        'error' => [
                            'code' => 'DUPLICATE_EVALUATION',
                            'message' => "An evaluation cycle already exists for academic year {$academicYear} in 'returned_for_revision' status. Please use the resubmission endpoint to submit Version N+1 beneath this root.",
                            'submission_id' => $latestEval['id'],
                            'evaluation_root_id' => $existingRoot['id'],
                            'status' => $latestEval['status'],
                        ],
                    ], 409);
                }

                if (in_array($existingStatus, ['submitted', 'in_evaluation', 'ready_for_finalization'], true)) {
                    return $this->respond([
                        'error' => [
                            'code' => 'ACTIVE_SUBMISSION_EXISTS',
                            'message' => "An active evaluation submission (Version " . ($latestEval['version_number'] ?? 1) . ") is already in progress for academic year {$academicYear}.",
                            'submission_id' => $latestEval['id'],
                            'evaluation_root_id' => $existingRoot['id'],
                            'status' => $latestEval['status'],
                        ],
                    ], 409);
                }

                if ($existingStatus === 'completed') {
                    return $this->respond([
                        'error' => [
                            'code' => 'DUPLICATE_EVALUATION',
                            'message' => "Evaluation for academic year {$academicYear} is already completed. Exactly one evaluation root is allowed per cycle.",
                            'submission_id' => $latestEval['id'],
                            'evaluation_root_id' => $existingRoot['id'],
                            'status' => $latestEval['status'],
                        ],
                    ], 409);
                }
            }
        } else {
            // Fallback check on evaluations table if roots table hasn't been backfilled
            $evalBuilder = $db->table($evalsTable)
                ->where('personnel_profile_id', $personnelProfileId)
                ->where('academic_year', $academicYear);
            if ($db->fieldExists('submitted_at', $evalsTable)) {
                $evalBuilder->orderBy('submitted_at', 'DESC');
            } else {
                $evalBuilder->orderBy('created_at', 'DESC');
            }
            $existingCycleEvaluation = $evalBuilder->get()->getRowArray();

            if ($existingCycleEvaluation !== null) {
                $existingStatus = strtolower((string) ($existingCycleEvaluation['status'] ?? ''));
                if ($existingStatus === 'returned_for_revision' || $existingStatus === 'returned_to_personnel') {
                    return $this->respond([
                        'error' => [
                            'code' => 'DUPLICATE_EVALUATION',
                            'message' => "An evaluation cycle already exists for academic year {$academicYear} in 'returned_for_revision' status. Please use the resubmission endpoint to submit Version N+1.",
                            'submission_id' => $existingCycleEvaluation['id'],
                            'status' => $existingCycleEvaluation['status'],
                        ],
                    ], 409);
                }

                if (in_array($existingStatus, ['submitted', 'in_evaluation', 'ready_for_finalization'], true)) {
                    return $this->respond([
                        'error' => [
                            'code' => 'ACTIVE_SUBMISSION_EXISTS',
                            'message' => "An active evaluation submission (Version " . ($existingCycleEvaluation['version_number'] ?? 1) . ") is already in progress for academic year {$academicYear}.",
                            'submission_id' => $existingCycleEvaluation['id'],
                            'status' => $existingCycleEvaluation['status'],
                        ],
                    ], 409);
                }

                if ($existingStatus === 'completed') {
                    return $this->respond([
                        'error' => [
                            'code' => 'DUPLICATE_EVALUATION',
                            'message' => "Evaluation for academic year {$academicYear} is already completed. Exactly one evaluation is allowed per cycle.",
                            'submission_id' => $existingCycleEvaluation['id'],
                            'status' => $existingCycleEvaluation['status'],
                        ],
                    ], 409);
                }
            }
        }

        // Fetch canonical working accomplishments
        $accomplishments = $db->table('personnel_accomplishments pa')
            ->select('pa.*')
            ->where('pa.personnel_profile_id', $personnelProfileId)
            ->orderBy('pa.created_at', 'DESC')
            ->get()
            ->getResultArray();

        if (empty($accomplishments)) {
            return $this->respond([
                'error' => [
                    'code' => 'EMPTY_PORTFOLIO',
                    'message' => 'Cannot submit an empty portfolio. Please record at least one accomplishment with proof.',
                ],
            ], 422);
        }

        // Load evidence attachments for all accomplishments
        $accIds = array_column($accomplishments, 'id');
        $evidenceMap = [];
        if (! empty($accIds)) {
            $evRows = $db->table('personnel_accomplishment_evidence')
                ->whereIn('accomplishment_id', $accIds)
                ->where('status', 'active')
                ->get()
                ->getResultArray();
            foreach ($evRows as $ev) {
                $evidenceMap[$ev['accomplishment_id']][] = $ev;
            }
        }

        // Guard: Verify all items have proof attachments
        $missingProof = [];
        foreach ($accomplishments as $acc) {
            $attached = $evidenceMap[$acc['id']] ?? [];
            if (empty($attached)) {
                $missingProof[] = $acc['title'];
            }
        }

        if (! empty($missingProof)) {
            return $this->respond([
                'error' => [
                    'code' => 'MISSING_PROOF_DOCUMENTS',
                    'message' => sprintf(
                        'Submission blocked: %d accomplishment(s) are missing required proof documents.',
                        count($missingProof)
                    ),
                    'missing_items' => $missingProof,
                ],
            ], 422);
        }

        // Faculty document-first drafts are not submission-ready until classification is confirmed
        // and structured fields exist. Legacy records remain governed by their existing validation path.
        $incompleteDrafts = [];
        foreach ($accomplishments as $acc) {
            $metadata = $acc['category_metadata'] ?? null;
            if (is_string($metadata)) $metadata = json_decode($metadata, true);
            $isStagingDraft = ($acc['title'] ?? '') === 'Pending document review';
            $isFacultyStructured = is_array($metadata) && ($metadata['portfolio_format'] ?? '') === 'faculty_academic';
            if ($isStagingDraft || ($isFacultyStructured && (empty($metadata['faculty_confirmed_category']) || empty($metadata['subcategory_code']) || empty($metadata['details'])))) {
                $incompleteDrafts[] = $acc['title'] ?? 'Incomplete faculty accomplishment';
            }
        }
        if ($incompleteDrafts !== []) {
            return $this->respond(['error' => [
                'code' => 'INCOMPLETE_ACCOMPLISHMENT_DRAFTS',
                'message' => 'Submission is blocked because one or more faculty accomplishment drafts still require confirmed classification and complete structured details.',
                'items' => $incompleteDrafts,
            ]], 422);
        }

        $now = date('Y-m-d H:i:s');
        $rootId = $this->genUuid();
        $evaluationId = $this->genUuid();
        $tenureYears = (int) ($actor['profile']['tenure_years'] ?? $json['tenure_years'] ?? 0);
        $eligibilitySnapshot = $eligibility;

        // Resolve the authoritative reviewer before persistence so the recipient queue,
        // workflow event, and notification all reference the same reviewer immediately.
        try {
            $reviewer = (new ReviewerResolverService())->resolve($personnelProfileId, $period);
        } catch (Throwable $e) {
            return $this->respond([
                'error' => [
                    'code' => 'REVIEWER_UNAVAILABLE',
                    'message' => 'Portfolio cannot be submitted until an authorized reviewer is available: ' . $e->getMessage(),
                ],
            ], 422);
        }

        // Atomic transaction to create evaluation root + Version 1 header + item snapshots
        $db->transBegin();
        try {
            // 1. Create evaluation root if roots table exists
            if ($db->tableExists($rootsTable)) {
                $db->table($rootsTable)->insert([
                    'id'                   => $rootId,
                    'personnel_profile_id' => $personnelProfileId,
                    'evaluation_cycle_id'  => $evaluationCycleId,
                    'evaluation_period_id' => $period['id'],
                    'academic_year'        => $academicYear,
                    'created_by'           => $personnelProfileId,
                    'created_at'           => $now,
                    'updated_at'           => $now,
                ]);
            } else {
                $rootId = null;
            }

            // 2. Create Version 1 submission header
            $headerData = [
                'id'                   => $evaluationId,
                'personnel_profile_id' => $personnelProfileId,
                'status'               => 'submitted',
                'submission_type'      => 'Personnel Ranking Evaluation',
                'academic_year'        => $academicYear,
                'evaluation_cycle_id'  => $evaluationCycleId,
                'evaluation_period_id' => $period['id'],
                'semester'             => $period['semester'],
                'period_name_snapshot' => $period['period_name'],
                'evaluation_type_snapshot' => $period['evaluation_type'],
                'coverage_label_snapshot' => $period['coverage_label'] ?: $period['semester_label'],
                'evaluation_scale_version_id' => $period['evaluation_scale_version_id'],
                'personnel_group_snapshot' => $actualGroup,
                'criteria_snapshot' => json_encode($criteriaSnapshot, JSON_UNESCAPED_UNICODE),
                'position_title_snapshot' => !empty($personnel['dean_assignment_id']) ? 'Dean' : ($personnel['position_title'] ?? null),
                'college_id_snapshot' => $personnel['college_id'] ?? null,
                'college_name_snapshot' => $personnel['college_name'] ?? null,
                'department_id_snapshot' => $personnel['department_id'] ?? null,
                'department_name_snapshot' => $personnel['department_name'] ?? null,
                'eligibility_snapshot' => json_encode([
                    'evaluation_period_id' => $period['id'],
                    'personnel_id' => $personnelProfileId,
                    'eligibility_status' => $eligibilitySnapshot['eligibility_status'],
                    'eligibility_reasons' => $eligibilitySnapshot['eligibility_reasons'],
                    'annual_review_requirement' => $eligibilitySnapshot['annual_review_requirement'],
                    'service_requirement' => $eligibilitySnapshot['service_requirement'],
                    'employment_status' => $eligibilitySnapshot['employment_status'],
                    'service_years' => $eligibilitySnapshot['service_years'],
                    'decision_timestamp' => $now,
                ], JSON_UNESCAPED_UNICODE),
                'version_number'       => 1,
                'previous_version_id'  => null,
                'evaluator_profile_id' => $reviewer['evaluator_profile_id'],
                'originating_evaluator_profile_id' => $reviewer['evaluator_profile_id'],
                'tenure_years'         => $tenureYears,
                'submitted_at'         => $now,
                'created_at'           => $now,
                'updated_at'           => $now,
            ];

            if ($rootId !== null && $db->fieldExists('evaluation_root_id', $evalsTable)) {
                $headerData['evaluation_root_id'] = $rootId;
            }

            $db->table($evalsTable)->insert($this->existingFieldsOnly($db, $evalsTable, $headerData));

            if ($db->tableExists('personnel_evaluation_idempotency')) {
                $db->table('personnel_evaluation_idempotency')->insert([
                    'id' => $this->genUuid(),
                    'actor_profile_id' => $personnelProfileId,
                    'operation' => 'portfolio-submit',
                    'idempotency_key' => $idempotencyKey,
                    'request_hash' => hash('sha256', $evaluationPeriodId),
                    'resource_id' => $evaluationId,
                    'response_status' => 201,
                    'created_at' => $now,
                ]);
            }

            // 3. Snapshot each accomplishment into personnel_evaluation_items
            foreach ($accomplishments as $submissionOrder => $acc) {
                $itemEvidence = $evidenceMap[$acc['id']] ?? [];
                $primaryEv = $itemEvidence[0] ?? null;
                $fileName = $primaryEv['original_filename'] ?? $acc['attached_file_name'] ?? 'supporting_proof.pdf';
                $fileUrl = $primaryEv['storage_path'] ?? null;

                $domain = $acc['domain'] ?? '';
                $categoryArea = 'areaA';
                if ($domain === 'productivity_creative_work' || str_starts_with($acc['category'] ?? '', 'B.')) {
                    $categoryArea = 'areaB';
                } elseif ($domain === 'service_leadership' || str_starts_with($acc['category'] ?? '', 'C.')) {
                    $categoryArea = 'areaC';
                }

                $criterionCode = trim((string) ($acc['category_code'] ?? ''));
                if ($criterionCode === '') throw new RuntimeException("CRITERION_MAPPING_REQUIRED: {$acc['title']} has no criterion mapping.");
                $metadata = is_string($acc['category_metadata'] ?? null) ? json_decode($acc['category_metadata'], true) : ($acc['category_metadata'] ?? []);
                $criterionSnapshot = (new \App\Services\LockedCriterionResolverService())->resolve($criteriaSnapshot, $criterionCode, $metadata + ['scope_level' => $acc['scope_level'] ?? null, 'organizer' => $acc['organizer_or_publisher'] ?? null]);

                $itemData = [
                    'id'                  => $this->genUuid(),
                    'evaluation_id'       => $evaluationId,
                    'accomplishment_id'   => $acc['id'],
                    'domain'              => $domain,
                    'item_description'    => $acc['title'],
                    'category_area'       => $categoryArea,
                    'criterion_code'      => $criterionCode,
                    'criterion_key'       => $criterionSnapshot['criterion_reference'],
                    'criterion_title'     => ($acc['category'] ?? '') ?: $acc['title'],
                    'criterion_version_id'=> $period['evaluation_scale_version_id'],
                    'criterion_snapshot'  => json_encode($criterionSnapshot, JSON_UNESCAPED_UNICODE),
                    'configured_points_snapshot' => $criterionSnapshot['configured_points'],
                    'portfolio_section'   => $domain,
                    'submission_order'    => $submissionOrder,
                    'evidence_snapshot'   => json_encode(array_values($itemEvidence), JSON_UNESCAPED_UNICODE),
                    'evidence_title'      => $acc['title'],
                    'file_name'           => $fileName,
                    'file_url'            => $fileUrl,
                    'source_type'         => 'accomplishment',
                    'verification_status' => 'pending',
                    'rating_status'       => 'unrated',
                    'scoring_payload'     => json_encode([
                        'scope_level'      => $acc['scope_level'] ?? 'Local',
                        'occurrence_date'  => $acc['occurrence_date'] ?? null,
                        'organizer'        => $acc['organizer_or_publisher'] ?? null,
                        'category_code'    => $acc['category_code'] ?? null,
                        'category_area'    => $acc['category_area'] ?? $categoryArea,
                        'category_metadata'=> is_string($acc['category_metadata'] ?? null) ? json_decode($acc['category_metadata'], true) : ($acc['category_metadata'] ?? null),
                        'original_remarks' => $acc['description'] ?? $acc['remarks'] ?? null,
                    ]),
                    'created_at'          => $now,
                    'updated_at'          => $now,
                ];

                if (! empty($primaryEv['id']) && $db->fieldExists('evidence_id', $itemsTable)) {
                    $itemData['evidence_id'] = $primaryEv['id'];
                }

                $db->table($itemsTable)->insert($this->existingFieldsOnly($db, $itemsTable, $itemData));

                // Package D: Record achievement usage and 2-year reuse lock
                if ($db->tableExists('personnel_achievement_usage')) {
                    $eligibleAgainAY = $this->calculateEligibleAgainAcademicYear($academicYear, 2);
                    $db->table('personnel_achievement_usage')->ignore(true)->insert([
                        'id'                           => $this->genUuid(),
                        'achievement_id'               => $acc['id'],
                        'personnel_profile_id'         => $personnelProfileId,
                        'portfolio_submission_id'      => $evaluationId,
                        'academic_year'                => $academicYear,
                        'used_at'                      => $now,
                        'reuse_lock_years'             => 2,
                        'eligible_again_academic_year' => $eligibleAgainAY,
                        'created_at'                   => $now,
                    ]);
                }
            }

            // 4. Record submission audit event
            $eventRow = [
                'id'            => $this->genUuid(),
                'evaluation_id' => $evaluationId,
                'event_type'    => 'portfolio_submitted',
                'performed_by'  => $personnelProfileId,
                'payload'       => json_encode([
                    'total_items'         => count($accomplishments),
                    'academic_year'       => $academicYear,
                    'evaluation_cycle_id' => $evaluationCycleId,
                    'evaluation_period_id'=> $period['id'],
                    'evaluation_root_id'  => $rootId,
                    'version_number'      => 1,
                ]),
                'created_at'    => $now,
            ];
            $this->persistEvaluationEvent($db, $eventsTable, $eventRow, 'draft', 'submitted');

            try {
                $notifService = new \App\Services\PersonnelWorkflowNotificationService($db);
                $notifService->handleWorkflowEvent($eventRow, [
                    'personnel_profile_id' => $personnelProfileId,
                    'personnel_name'       => $actor['profile']['full_name'] ?? 'Candidate',
                    'assigned_reviewer_id' => $reviewer['evaluator_profile_id'],
                    'version_number'       => 1,
                ]);
            } catch (\Throwable $notifErr) {
                log_message('error', 'Failed to generate submission notification: ' . $notifErr->getMessage());
                throw new \RuntimeException('Submission notification could not be persisted.', 0, $notifErr);
            }

            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();
            log_message('error', 'Personnel portfolio submission failed: {exception}: {message}', [
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            // Catch unique constraint violation on concurrent submission
            if (str_contains($e->getMessage(), 'uq_personnel_eval_roots_profile_cycle') || str_contains($e->getMessage(), 'Duplicate entry')) {
                return $this->respond([
                    'error' => [
                        'code' => 'DUPLICATE_EVALUATION',
                        'message' => 'A portfolio submission already exists for this evaluation period.',
                    ],
                ], 409);
            }

            return $this->respond([
                'error' => [
                    'code' => 'SUBMISSION_FAILED',
                    'message' => 'The portfolio submission could not be completed. No submission was created; please retry.',
                ],
            ], 500);
        }

        return $this->respondCreated([
            'data' => [
                'message'            => 'Portfolio successfully submitted for evaluation.',
                'submission_id'      => $evaluationId,
                'evaluation_root_id' => $rootId,
                'version_number'     => 1,
                'status'             => 'submitted',
                'submitted_at'       => $now,
                'academic_year'      => $academicYear,
                'evaluation_cycle_id'=> $evaluationCycleId,
                'total_items'        => count($accomplishments),
            ],
        ]);
    }

    /**
     * POST /api/v1/personnel/portfolio/submissions/resubmit
     * Plan C — Phase C4 & C5: Whole-Portfolio Resubmission as Version N+1 beneath the same Evaluation Root.
     */
    public function resubmit(): mixed
    {
        $actor = $this->actor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $personnelProfileId = $actor['profile']['id'] ?? null;
        if (! $personnelProfileId) {
            return $this->respond(['error' => ['code' => 'INVALID_ACTOR', 'message' => 'Personnel profile not found.']], 403);
        }

        $db = db_connect();
        $rootsTable = $this->getRootsTable($db);
        $evalsTable = $this->getEvaluationsTable($db);
        $itemsTable = $this->getItemsTable($db);
        $eventsTable = $this->getEventsTable($db);

        $json = $this->request->getJSON(true) ?? [];
        $cycleId = trim((string) ($json['evaluation_cycle_id'] ?? ''));

        // 1. Fetch evaluation root & latest submission for this personnel
        $existingRoot = null;
        if ($db->tableExists($rootsTable)) {
            if ($cycleId !== '') {
                $existingRoot = $db->table($rootsTable)
                    ->where('personnel_profile_id', $personnelProfileId)
                    ->where('evaluation_cycle_id', $cycleId)
                    ->get()
                    ->getRowArray();
            } else {
                $existingRoot = $db->table($rootsTable)
                    ->where('personnel_profile_id', $personnelProfileId)
                    ->orderBy('created_at', 'DESC')
                    ->get()
                    ->getRowArray();
            }
        }

        $latestSubmission = null;
        if ($existingRoot !== null && $db->fieldExists('evaluation_root_id', $evalsTable)) {
            $latestSubmission = $db->table($evalsTable)
                ->where('evaluation_root_id', $existingRoot['id'])
                ->orderBy('version_number', 'DESC')
                ->get()
                ->getRowArray();
        }

        if ($latestSubmission === null) {
            $evalBuilder = $db->table($evalsTable)
                ->where('personnel_profile_id', $personnelProfileId);
            if ($db->fieldExists('submitted_at', $evalsTable)) {
                $evalBuilder->orderBy('submitted_at', 'DESC');
            } else {
                $evalBuilder->orderBy('created_at', 'DESC');
            }
            $latestSubmission = $evalBuilder->get()->getRowArray();
        }

        if ($latestSubmission === null) {
            return $this->respond([
                'error' => [
                    'code' => 'INVALID_TRANSITION',
                    'message' => 'Cannot resubmit: No previous submission found for this account.',
                ],
            ], 409);
        }

        $latestStatus = strtolower((string) ($latestSubmission['status'] ?? ''));

        // Guard: Check if an active submission is already submitted or under review
        if (in_array($latestStatus, ['submitted', 'in_evaluation', 'ready_for_finalization'], true)) {
            return $this->respond([
                'error' => [
                    'code' => 'RESUBMISSION_NOT_ALLOWED',
                    'message' => "An active evaluation submission (Version " . ($latestSubmission['version_number'] ?? 1) . ") is already {$latestStatus} and cannot be resubmitted.",
                    'submission_id' => $latestSubmission['id'],
                    'status' => $latestStatus,
                ],
            ], 409);
        }

        // Guard: Must be in returned_for_revision state
        if ($latestStatus !== 'returned_for_revision' && $latestStatus !== 'returned_to_personnel') {
            return $this->respond([
                'error' => [
                    'code' => 'INVALID_TRANSITION',
                    'message' => "Resubmission requires the latest submission to be in 'returned_for_revision' status. Current status is '{$latestStatus}'.",
                ],
            ], 409);
        }

        // 2. Fetch current working accomplishments (reopened Plan B draft)
        $accomplishments = $db->table('personnel_accomplishments pa')
            ->select('pa.*')
            ->where('pa.personnel_profile_id', $personnelProfileId)
            ->orderBy('pa.created_at', 'DESC')
            ->get()
            ->getResultArray();

        if (empty($accomplishments)) {
            return $this->respond([
                'error' => [
                    'code' => 'WORKING_REVISION_REQUIRED',
                    'message' => 'Cannot resubmit an empty portfolio. Please ensure at least one accomplishment with proof is in your working revision.',
                ],
            ], 422);
        }

        // 3. Load evidence attachments for all accomplishments
        $accIds = array_column($accomplishments, 'id');
        $evidenceMap = [];
        if (! empty($accIds)) {
            $evRows = $db->table('personnel_accomplishment_evidence')
                ->whereIn('accomplishment_id', $accIds)
                ->where('status', 'active')
                ->get()
                ->getResultArray();
            foreach ($evRows as $ev) {
                $evidenceMap[$ev['accomplishment_id']][] = $ev;
            }
        }

        // Guard: Verify all items have proof attachments
        $missingProof = [];
        foreach ($accomplishments as $acc) {
            $attached = $evidenceMap[$acc['id']] ?? [];
            if (empty($attached) && empty($acc['attached_file_name'])) {
                $missingProof[] = $acc['title'];
            }
        }

        if (! empty($missingProof)) {
            return $this->respond([
                'error' => [
                    'code' => 'MISSING_PROOF_DOCUMENTS',
                    'message' => sprintf(
                        'Resubmission blocked: %d accomplishment(s) in working revision are missing required proof documents.',
                        count($missingProof)
                    ),
                    'missing_items' => $missingProof,
                ],
            ], 422);
        }

        $now = date('Y-m-d H:i:s');
        $newEvaluationId = $this->genUuid();
        $previousVersionNumber = (int) ($latestSubmission['version_number'] ?? 1);
        $newVersionNumber = $previousVersionNumber + 1;
        $academicYear = $latestSubmission['academic_year'] ?? '2025-2026';
        $tenureYears = (int) ($latestSubmission['tenure_years'] ?? 0);
        $resolvedCycleId = $existingRoot['evaluation_cycle_id'] ?? $latestSubmission['evaluation_cycle_id'] ?? $academicYear;
        $resolvedPeriodId = $existingRoot['evaluation_period_id'] ?? $latestSubmission['evaluation_period_id'] ?? null;
        $periodSnapshot = $resolvedPeriodId ? $db->table('personnel_evaluation_periods')->where('id', $resolvedPeriodId)->get()->getRowArray() : null;
        $rootId = $existingRoot['id'] ?? $latestSubmission['evaluation_root_id'] ?? null;
        try {
            $reviewer = (new ReviewerResolverService())->resolve($personnelProfileId, $period);
        } catch (Throwable $e) {
            return $this->respond([
                'error' => [
                    'code' => 'REVIEWER_UNAVAILABLE',
                    'message' => 'Portfolio cannot be resubmitted until an authorized reviewer is available: ' . $e->getMessage(),
                ],
            ], 422);
        }

        // Atomic transaction to create Version N header + fresh item snapshots
        $db->transBegin();
        try {
            // Guard: Check for concurrent resubmission race condition
            if ($rootId !== null && $db->fieldExists('evaluation_root_id', $evalsTable)) {
                $concurrentCheck = $db->table($evalsTable)
                    ->where('evaluation_root_id', $rootId)
                    ->where('version_number', $newVersionNumber)
                    ->get()
                    ->getRowArray();

                if ($concurrentCheck !== null) {
                    $db->transRollback();
                    return $this->respond([
                        'error' => [
                            'code' => 'DUPLICATE_RESUBMISSION',
                            'message' => "A resubmission for Version {$newVersionNumber} is already in progress or exists under this evaluation root.",
                        ],
                    ], 409);
                }
            }

            // 1. Create new immutable submission version header
            $headerData = [
                'id'                  => $newEvaluationId,
                'personnel_profile_id'=> $personnelProfileId,
                'status'              => 'submitted',
                'submission_type'     => 'Personnel Ranking Evaluation',
                'academic_year'       => $academicYear,
                'evaluation_cycle_id' => $resolvedCycleId,
                'evaluation_period_id'=> $resolvedPeriodId,
                'semester'            => $latestSubmission['semester'] ?? ($periodSnapshot['semester'] ?? 'FULL_ACADEMIC_YEAR'),
                'period_name_snapshot'=> $latestSubmission['period_name_snapshot'] ?? ($periodSnapshot['period_name'] ?? null),
                'evaluation_type_snapshot'=> $latestSubmission['evaluation_type_snapshot'] ?? ($periodSnapshot['evaluation_type'] ?? null),
                'coverage_label_snapshot'=> $latestSubmission['coverage_label_snapshot'] ?? ($periodSnapshot['coverage_label'] ?? null),
                'evaluation_scale_version_id'=> $latestSubmission['evaluation_scale_version_id'] ?? ($periodSnapshot['evaluation_scale_version_id'] ?? null),
                'criteria_snapshot'     => $latestSubmission['criteria_snapshot'] ?? json_encode((new \App\Services\RubricAdministrationService())->getScaleVersionHierarchy($periodSnapshot['evaluation_scale_version_id']), JSON_UNESCAPED_UNICODE),
                'eligibility_snapshot'  => $latestSubmission['eligibility_snapshot'] ?? json_encode((new \App\Services\PersonnelEligibilityService($db))->evaluateEligibility($personnelProfileId, (string) $resolvedPeriodId), JSON_UNESCAPED_UNICODE),
                'personnel_group_snapshot' => $latestSubmission['personnel_group_snapshot'] ?? null,
                'position_title_snapshot' => $latestSubmission['position_title_snapshot'] ?? null,
                'college_id_snapshot' => $latestSubmission['college_id_snapshot'] ?? null,
                'college_name_snapshot' => $latestSubmission['college_name_snapshot'] ?? null,
                'department_id_snapshot' => $latestSubmission['department_id_snapshot'] ?? null,
                'department_name_snapshot' => $latestSubmission['department_name_snapshot'] ?? null,
                'version_number'      => $newVersionNumber,
                'previous_version_id' => $latestSubmission['id'],
                // Re-resolve on Version N+1 so Dean revocation/reassignment takes
                // effect for future work without changing immutable prior versions.
                'evaluator_profile_id'=> $reviewer['evaluator_profile_id'],
                'originating_evaluator_profile_id'=> $reviewer['evaluator_profile_id'],
                'tenure_years'        => $tenureYears,
                'submitted_at'        => $now,
                'created_at'          => $now,
                'updated_at'          => $now,
            ];

            if ($rootId !== null && $db->fieldExists('evaluation_root_id', $evalsTable)) {
                $headerData['evaluation_root_id'] = $rootId;
            }

            $db->table($evalsTable)->insert($headerData);

            // 2. Snapshot current working accomplishments into personnel_evaluation_items for Version N
            $resubmissionCriteria = is_string($headerData['criteria_snapshot']) ? json_decode($headerData['criteria_snapshot'], true) : $headerData['criteria_snapshot'];
            foreach ($accomplishments as $submissionOrder => $acc) {
                $itemEvidence = $evidenceMap[$acc['id']] ?? [];
                $primaryEv = $itemEvidence[0] ?? null;
                $fileName = $primaryEv['original_filename'] ?? $acc['attached_file_name'] ?? 'supporting_proof.pdf';
                $fileUrl = $primaryEv['storage_path'] ?? null;

                $domain = $acc['domain'] ?? '';
                $categoryArea = 'areaA';
                if ($domain === 'productivity_creative_work' || str_starts_with($acc['category'] ?? '', 'B.')) {
                    $categoryArea = 'areaB';
                } elseif ($domain === 'service_leadership' || str_starts_with($acc['category'] ?? '', 'C.')) {
                    $categoryArea = 'areaC';
                }

                $criterionCode = trim((string) ($acc['category_code'] ?? ''));
                if ($criterionCode === '') throw new RuntimeException("CRITERION_MAPPING_REQUIRED: {$acc['title']} has no criterion mapping.");
                $metadata = is_string($acc['category_metadata'] ?? null) ? json_decode($acc['category_metadata'], true) : ($acc['category_metadata'] ?? []);
                $criterionSnapshot = (new \App\Services\LockedCriterionResolverService())->resolve($resubmissionCriteria, $criterionCode, $metadata + ['scope_level' => $acc['scope_level'] ?? null, 'organizer' => $acc['organizer_or_publisher'] ?? null]);

                $itemData = [
                    'id'                  => $this->genUuid(),
                    'evaluation_id'       => $newEvaluationId,
                    'accomplishment_id'   => $acc['id'],
                    'domain'              => $domain,
                    'item_description'    => $acc['title'],
                    'category_area'       => $categoryArea,
                    'criterion_code'      => $criterionCode,
                    'criterion_key'       => $criterionSnapshot['criterion_reference'],
                    'criterion_title'     => ($acc['category'] ?? '') ?: $acc['title'],
                    'criterion_version_id'=> $headerData['evaluation_scale_version_id'],
                    'criterion_snapshot'  => json_encode($criterionSnapshot, JSON_UNESCAPED_UNICODE),
                    'configured_points_snapshot' => $criterionSnapshot['configured_points'],
                    'portfolio_section'   => $domain,
                    'submission_order'    => $submissionOrder,
                    'evidence_snapshot'   => json_encode(array_values($itemEvidence), JSON_UNESCAPED_UNICODE),
                    'evidence_title'      => $acc['title'],
                    'file_name'           => $fileName,
                    'file_url'            => $fileUrl,
                    'source_type'         => 'accomplishment',
                    'verification_status' => 'pending',
                    'rating_status'       => 'unrated',
                    'scoring_payload'     => json_encode([
                        'scope_level'      => $acc['scope_level'] ?? 'Local',
                        'occurrence_date'  => $acc['occurrence_date'] ?? null,
                        'organizer'        => $acc['organizer_or_publisher'] ?? null,
                        'category_code'    => $acc['category_code'] ?? null,
                        'category_area'    => $acc['category_area'] ?? $categoryArea,
                        'category_metadata'=> is_string($acc['category_metadata'] ?? null) ? json_decode($acc['category_metadata'], true) : ($acc['category_metadata'] ?? null),
                        'original_remarks' => $acc['description'] ?? $acc['remarks'] ?? null,
                    ]),
                    'created_at'          => $now,
                    'updated_at'          => $now,
                ];

                if (! empty($primaryEv['id']) && $db->fieldExists('evidence_id', $itemsTable)) {
                    $itemData['evidence_id'] = $primaryEv['id'];
                }

                $db->table($itemsTable)->insert($this->existingFieldsOnly($db, $itemsTable, $itemData));

                // Package D: Record achievement usage and 2-year reuse lock for resubmission
                if ($db->tableExists('personnel_achievement_usage')) {
                    $eligibleAgainAY = $this->calculateEligibleAgainAcademicYear($academicYear, 2);
                    $db->table('personnel_achievement_usage')->ignore(true)->insert([
                        'id'                           => $this->genUuid(),
                        'achievement_id'               => $acc['id'],
                        'personnel_profile_id'         => $personnelProfileId,
                        'portfolio_submission_id'      => $newEvaluationId,
                        'academic_year'                => $academicYear,
                        'used_at'                      => $now,
                        'reuse_lock_years'             => 2,
                        'eligible_again_academic_year' => $eligibleAgainAY,
                        'created_at'                   => $now,
                    ]);
                }
            }

            // 3. Record resubmission audit event linking Version N to Version N-1 and Root
            $eventRow = [
                'id'            => $this->genUuid(),
                'evaluation_id' => $newEvaluationId,
                'event_type'    => 'portfolio_resubmitted',
                'performed_by'  => $personnelProfileId,
                'payload'       => json_encode([
                    'evaluation_root_id'      => $rootId,
                    'previous_version_id'     => $latestSubmission['id'],
                    'previous_version_number' => $previousVersionNumber,
                    'new_version_number'      => $newVersionNumber,
                    'total_items'             => count($accomplishments),
                    'academic_year'           => $academicYear,
                    'evaluation_cycle_id'     => $resolvedCycleId,
                    'evaluation_period_id'    => $resolvedPeriodId,
                ]),
                'created_at'    => $now,
            ];
            $this->persistEvaluationEvent($db, $eventsTable, $eventRow, 'returned_for_revision', 'submitted');

            try {
                $notifService = new \App\Services\PersonnelWorkflowNotificationService($db);
                $notifService->handleWorkflowEvent($eventRow, [
                    'personnel_profile_id' => $personnelProfileId,
                    'personnel_name'       => $actor['profile']['full_name'] ?? 'Candidate',
                    'version_number'       => $newVersionNumber,
                    'assigned_reviewer_id' => $reviewer['evaluator_profile_id'],
                ]);
            } catch (\Throwable $notifErr) {
                log_message('error', 'Failed to generate resubmission notification: ' . $notifErr->getMessage());
                throw new \RuntimeException('Resubmission notification could not be persisted.', 0, $notifErr);
            }

            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();

            if (str_contains($e->getMessage(), 'uq_personnel_eval_root_version') || str_contains($e->getMessage(), 'Duplicate entry')) {
                return $this->respond([
                    'error' => [
                        'code' => 'DUPLICATE_RESUBMISSION',
                        'message' => "A resubmission for Version {$newVersionNumber} already exists under this evaluation root.",
                    ],
                ], 409);
            }

            return $this->respond([
                'error' => [
                    'code' => 'RESUBMISSION_FAILED',
                    'message' => 'Failed to create resubmission snapshot: ' . $e->getMessage(),
                ],
            ], 500);
        }

        return $this->respondCreated([
            'data' => [
                'message'             => sprintf('Portfolio successfully resubmitted as Version %d.', $newVersionNumber),
                'submission_id'       => $newEvaluationId,
                'evaluation_root_id'  => $rootId,
                'version_number'      => $newVersionNumber,
                'previous_version_id' => $latestSubmission['id'],
                'status'              => 'submitted',
                'submitted_at'        => $now,
                'academic_year'       => $academicYear,
                'evaluation_cycle_id' => $resolvedCycleId,
                'evaluation_period_id'=> $resolvedPeriodId,
                'total_items'         => count($accomplishments),
            ],
        ]);
    }

    /**
     * GET /api/v1/personnel/portfolio/submissions/history
     * Plan C — Phase C4 & C5: Multi-Version Submission History sourced from the Evaluation Root.
     * Returns chronological audit history of all submitted versions for the cycle.
     */
    public function getHistory(): mixed
    {
        try {
            $actor = $this->actor();
            if ($actor === null) {
                return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
            }

            $queryProfileId = $this->request->getGet('personnel_profile_id');
            $actorProfileId = $actor['profile']['id'] ?? null;

            // If target profile is specified and differs from actor, verify reviewer authorization
            $targetProfileId = $actorProfileId;
            if (! empty($queryProfileId) && $queryProfileId !== $actorProfileId) {
                $dummyEval = ['evaluator_profile_id' => null];
                if (! $this->isAuthorizedReviewer($actor, $dummyEval)) {
                    return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Unauthorized to view other personnel submission history.']], 403);
                }
                $targetProfileId = $queryProfileId;
            }

            if (! $targetProfileId) {
                return $this->respond(['error' => ['code' => 'INVALID_ACTOR', 'message' => 'Personnel profile not found.']], 403);
            }

            $db = db_connect();
            $rootsTable = $this->getRootsTable($db);
            $evalsTable = $this->getEvaluationsTable($db);
            $itemsTable = $this->getItemsTable($db);

            $submissions = [];
            $root = null;

            if ($db->tableExists($rootsTable)) {
                $root = $db->table($rootsTable)
                    ->where('personnel_profile_id', $targetProfileId)
                    ->orderBy('created_at', 'DESC')
                    ->get()
                    ->getRowArray();

                if ($root !== null && $db->fieldExists('evaluation_root_id', $evalsTable)) {
                    $builder = $db->table($evalsTable)->where('evaluation_root_id', $root['id']);
                    if ($db->fieldExists('version_number', $evalsTable)) {
                        $builder->orderBy('version_number', 'ASC');
                    } elseif ($db->fieldExists('submitted_at', $evalsTable)) {
                        $builder->orderBy('submitted_at', 'ASC');
                    } else {
                        $builder->orderBy('created_at', 'ASC');
                    }
                    $submissions = $builder->get()->getResultArray();
                }
            }

            if (empty($submissions)) {
                $builder = $db->table($evalsTable)->where('personnel_profile_id', $targetProfileId);
                if ($db->fieldExists('submitted_at', $evalsTable)) {
                    $builder->orderBy('submitted_at', 'ASC');
                } else {
                    $builder->orderBy('created_at', 'ASC');
                }
                $submissions = $builder->get()->getResultArray();
            }

            if (empty($submissions)) {
                return $this->respond([
                    'data' => [
                        'evaluation_root_id'     => null,
                        'versions'               => [],
                        'total_versions'         => 0,
                        'current_version_number' => 0,
                    ],
                ], 200);
            }

            // Fetch items for all versions
            $submissionIds = array_column($submissions, 'id');
            $itemsBuilder = $db->table($itemsTable)->whereIn('evaluation_id', $submissionIds);
            if ($db->fieldExists('category_area', $itemsTable)) {
                $itemsBuilder->orderBy('category_area', 'ASC');
            }
            if ($db->fieldExists('criterion_code', $itemsTable)) {
                $itemsBuilder->orderBy('criterion_code', 'ASC');
            }
            if ($db->fieldExists('created_at', $itemsTable)) {
                $itemsBuilder->orderBy('created_at', 'ASC');
            }
            $allItems = $itemsBuilder->get()->getResultArray();

            $itemsByEvalId = [];
            foreach ($allItems as $item) {
                if (isset($item['scoring_payload']) && is_string($item['scoring_payload'])) {
                    $decoded = json_decode($item['scoring_payload'], true);
                    $item['scoring_payload'] = $decoded !== null ? $decoded : $item['scoring_payload'];
                    $item['original_remarks'] = is_array($decoded) ? ($decoded['original_remarks'] ?? null) : null;
                } else {
                    $item['original_remarks'] = null;
                }
                $itemsByEvalId[$item['evaluation_id']][] = $item;
            }

            $totalVersions = count($submissions);
            $versionList = [];

            foreach ($submissions as $idx => $sub) {
                $vNum = ! empty($sub['version_number']) ? (int) $sub['version_number'] : ($idx + 1);
                $isCurrent = ($idx === $totalVersions - 1);

                $returnFeedback = null;
                if (! empty($sub['evaluator_remarks'])) {
                    $decodedRemarks = json_decode((string) $sub['evaluator_remarks'], true);
                    if (is_array($decodedRemarks) && isset($decodedRemarks['required_corrections'])) {
                        $returnFeedback = $decodedRemarks;
                    }
                }
                if ($returnFeedback === null && ! empty($sub['return_reason'])) {
                    $returnFeedback = [
                        'reason'               => $sub['return_reason'],
                        'required_corrections' => $sub['return_reason'],
                        'returned_at'          => $sub['returned_at'] ?? null,
                        'item_deficiencies'    => [],
                    ];
                }

                $versionItems = $itemsByEvalId[$sub['id']] ?? [];
                if ($targetProfileId === $actorProfileId) {
                    $versionItems = array_map(fn (array $item): array => $this->withoutPersonnelScoring($item), $versionItems);
                }

                $versionList[] = [
                    'id'                  => $sub['id'],
                    'evaluation_root_id'  => $sub['evaluation_root_id'] ?? ($root['id'] ?? null),
                    'version_number'      => $vNum,
                    'status'              => $sub['status'] ?? 'submitted',
                    'academic_year'       => $sub['academic_year'] ?? '2025-2026',
                    'previous_version_id' => $sub['previous_version_id'] ?? null,
                    'submitted_at'        => $sub['submitted_at'] ?? ($sub['created_at'] ?? null),
                    'returned_at'         => $sub['returned_at'] ?? null,
                    'return_feedback'     => $returnFeedback,
                    'items_count'         => count($versionItems),
                    'items'               => $versionItems,
                    'is_current'          => $isCurrent,
                ];
            }

            $latestVersionNum = end($versionList)['version_number'] ?? 1;
            $rootId = $root['id'] ?? ($submissions[0]['evaluation_root_id'] ?? null);

            return $this->respond([
                'data' => [
                    'evaluation_root_id'     => $rootId,
                    'versions'               => $versionList,
                    'total_versions'         => count($versionList),
                    'current_version_number' => $latestVersionNum,
                ],
            ], 200);
        } catch (\Throwable $e) {
            log_message('error', '[PersonnelPortfolioSubmissionController::getHistory] ' . $e->getMessage());
            return $this->respond([
                'error' => [
                    'code' => 'SUBMISSION_HISTORY_LOOKUP_FAILED',
                    'message' => 'Unable to load submission history information.'
                ]
            ], 500);
        }
    }

    /**
     * GET /api/v1/personnel/portfolio/submission/latest
     * Retrieves the latest submission header, root relationship, return feedback, and immutable item snapshots.
     */
    public function getLatest(): mixed
    {
        try {
            $actor = $this->actor();
            if ($actor === null) {
                return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
            }

            $personnelProfileId = $actor['profile']['id'] ?? null;
            if (! $personnelProfileId) {
                return $this->respond(['error' => ['code' => 'INVALID_ACTOR', 'message' => 'Personnel profile not found.']], 403);
            }

            $db = db_connect();
            $rootsTable = $this->getRootsTable($db);
            $evalsTable = $this->getEvaluationsTable($db);
            $itemsTable = $this->getItemsTable($db);

            $root = null;
            if ($db->tableExists($rootsTable)) {
                $root = $db->table($rootsTable)
                    ->where('personnel_profile_id', $personnelProfileId)
                    ->orderBy('created_at', 'DESC')
                    ->get()
                    ->getRowArray();
            }

            $submission = null;
            if ($root !== null && $db->fieldExists('evaluation_root_id', $evalsTable)) {
                $builder = $db->table($evalsTable)->where('evaluation_root_id', $root['id']);
                if ($db->fieldExists('version_number', $evalsTable)) {
                    $builder->orderBy('version_number', 'DESC');
                } elseif ($db->fieldExists('submitted_at', $evalsTable)) {
                    $builder->orderBy('submitted_at', 'DESC');
                } else {
                    $builder->orderBy('created_at', 'DESC');
                }
                $submission = $builder->get()->getRowArray();
            }

            if ($submission === null) {
                $builder = $db->table($evalsTable)->where('personnel_profile_id', $personnelProfileId);
                if ($db->fieldExists('submitted_at', $evalsTable)) {
                    $builder->orderBy('submitted_at', 'DESC');
                } else {
                    $builder->orderBy('created_at', 'DESC');
                }
                $submission = $builder->get()->getRowArray();
            }

            if ($submission === null) {
                return $this->respond(['data' => ['submission' => null, 'status' => 'DRAFT', 'items_count' => 0, 'items' => []]], 200);
            }

            if (empty($submission['version_number'])) {
                $submission['version_number'] = 1;
            }
            if (empty($submission['submitted_at']) && ! empty($submission['created_at'])) {
                $submission['submitted_at'] = $submission['created_at'];
            }

            // Fetch immutable item snapshots
            $itemsBuilder = $db->table($itemsTable)->where('evaluation_id', $submission['id']);
            if ($db->fieldExists('category_area', $itemsTable)) {
                $itemsBuilder->orderBy('category_area', 'ASC');
            }
            if ($db->fieldExists('criterion_code', $itemsTable)) {
                $itemsBuilder->orderBy('criterion_code', 'ASC');
            }
            if ($db->fieldExists('created_at', $itemsTable)) {
                $itemsBuilder->orderBy('created_at', 'ASC');
            }
            $items = $itemsBuilder->get()->getResultArray();

            foreach ($items as &$item) {
                if (isset($item['scoring_payload']) && is_string($item['scoring_payload'])) {
                    $decoded = json_decode($item['scoring_payload'], true);
                    $item['scoring_payload'] = $decoded !== null ? $decoded : $item['scoring_payload'];
                    $item['original_remarks'] = is_array($decoded) ? ($decoded['original_remarks'] ?? null) : null;
                } else {
                    $item['original_remarks'] = null;
                }
            }
            unset($item);

            $submission = $this->withoutPersonnelScoring($submission);
            $items = array_map(fn (array $item): array => $this->withoutPersonnelScoring($item), $items);

            // Parse return feedback if present
            $returnFeedback = null;
            if (! empty($submission['evaluator_remarks'])) {
                $decodedRemarks = json_decode((string) $submission['evaluator_remarks'], true);
                if (is_array($decodedRemarks) && isset($decodedRemarks['required_corrections'])) {
                    $returnFeedback = $decodedRemarks;
                }
            }

            if ($returnFeedback === null && ! empty($submission['return_reason'])) {
                $returnFeedback = [
                    'reason'               => $submission['return_reason'],
                    'required_corrections' => $submission['return_reason'],
                    'returned_at'          => $submission['returned_at'] ?? null,
                    'item_deficiencies'    => [],
                ];
            }

            return $this->respond([
                'data' => [
                    'submission'         => $submission,
                    'evaluation_root_id' => $root['id'] ?? ($submission['evaluation_root_id'] ?? null),
                    'status'             => $submission['status'] ?? 'submitted',
                    'version_number'     => (int) ($submission['version_number'] ?? 1),
                    'return_feedback'    => $returnFeedback,
                    'items_count'        => count($items),
                    'items'              => $items,
                ],
            ], 200);
        } catch (\Throwable $e) {
            log_message('error', '[PersonnelPortfolioSubmissionController::getLatest] ' . $e->getMessage());
            return $this->respond([
                'error' => [
                    'code' => 'SUBMISSION_LOOKUP_FAILED',
                    'message' => 'Unable to load portfolio submission details.'
                ]
            ], 500);
        }
    }

    /**
     * POST /api/v1/personnel/portfolio/submissions/{id}/return-for-revision
     *
     * Plan C — Phase C3: Whole-Portfolio Return for Revision.
     * Allows an authorized reviewer to return a whole portfolio submission with overall
     * reason, required corrections, and optional item-level deficiency comments.
     */
    public function returnForRevision(string $id): mixed
    {
        $actor = $this->actor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        if (! ValidationHelper::validateUuid($id)) {
            return $this->respond(['error' => ['code' => 'INVALID_ID', 'message' => 'Invalid evaluation ID.']], 422);
        }

        $db = db_connect();
        $evalsTable = $this->getEvaluationsTable($db);
        $itemsTable = $this->getItemsTable($db);
        $eventsTable = $this->getEventsTable($db);

        $evaluation = $db->table($evalsTable)->where('id', $id)->get()->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation submission not found.']], 404);
        }

        // Authorization Guard: Actor must be authorized reviewer
        if (! $this->isAuthorizedReviewer($actor, $evaluation)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only an authorized reviewer or HR Admin may return a portfolio for revision.']], 403);
        }

        // Transition Guard (C3.1): Only 'submitted' or 'in_evaluation' can be returned
        $currentStatus = strtolower((string) $evaluation['status']);
        if (! in_array($currentStatus, ['submitted', 'in_evaluation'], true)) {
            return $this->respond([
                'error' => [
                    'code' => 'INVALID_TRANSITION',
                    'message' => "Cannot return evaluation: status is '{$currentStatus}'. Whole-portfolio return is permitted only for submissions in 'submitted' or 'in_evaluation' state.",
                ],
            ], 409);
        }

        // Validate Request Body
        $json = $this->request->getJSON(true) ?? [];
        $reason = trim((string) ($json['reason'] ?? ''));
        $requiredCorrections = trim((string) ($json['required_corrections'] ?? ''));
        $itemDeficiencies = (array) ($json['item_deficiencies'] ?? []);

        if ($reason === '') {
            return $this->respond(['error' => ['code' => 'REASON_REQUIRED', 'message' => 'A return reason is required.']], 422);
        }
        if (strlen($reason) > 1000) {
            return $this->respond(['error' => ['code' => 'REASON_TOO_LONG', 'message' => 'Return reason cannot exceed 1000 characters.']], 422);
        }

        if ($requiredCorrections === '') {
            return $this->respond(['error' => ['code' => 'CORRECTIONS_REQUIRED', 'message' => 'Required correction instructions are required.']], 422);
        }
        if (strlen($requiredCorrections) > 2000) {
            return $this->respond(['error' => ['code' => 'CORRECTIONS_TOO_LONG', 'message' => 'Required corrections cannot exceed 2000 characters.']], 422);
        }

        // Validate item-level deficiencies if provided
        $seenItemIds = [];
        $validatedDeficiencies = [];

        if (! empty($itemDeficiencies)) {
            $validItems = $db->table($itemsTable)
                ->where('evaluation_id', $id)
                ->get()
                ->getResultArray();
            $validItemIdMap = array_column($validItems, null, 'id');

            foreach ($itemDeficiencies as $def) {
                $itemId = trim((string) ($def['evaluation_item_id'] ?? $def['item_id'] ?? ''));
                $comment = trim((string) ($def['comment'] ?? $def['remarks'] ?? ''));

                if ($itemId === '' || ! isset($validItemIdMap[$itemId])) {
                    return $this->respond([
                        'error' => [
                            'code' => 'INVALID_ITEM_REFERENCE',
                            'message' => "Item deficiency references invalid or non-existent evaluation item: {$itemId}",
                        ],
                    ], 422);
                }

                if (in_array($itemId, $seenItemIds, true)) {
                    return $this->respond([
                        'error' => [
                            'code' => 'DUPLICATE_ITEM_DEFICIENCY',
                            'message' => "Duplicate deficiency comment provided for evaluation item: {$itemId}",
                        ],
                    ], 422);
                }
                $seenItemIds[] = $itemId;

                if ($comment === '') {
                    return $this->respond([
                        'error' => [
                            'code' => 'DEFICIENCY_COMMENT_REQUIRED',
                            'message' => "Deficiency comment is required for evaluation item: {$itemId}",
                        ],
                    ], 422);
                }

                $validatedDeficiencies[] = [
                    'evaluation_item_id' => $itemId,
                    'criterion_title'    => $validItemIdMap[$itemId]['criterion_title'] ?? '',
                    'criterion_code'     => $validItemIdMap[$itemId]['criterion_code'] ?? '',
                    'comment'            => $comment,
                ];
            }
        }

        $now = date('Y-m-d H:i:s');
        $reviewerId = $actor['profile']['id'] ?? '';
        $reviewerName = $actor['profile']['full_name'] ?? 'Authorized Reviewer';

        $feedbackRecord = [
            'reason'               => $reason,
            'required_corrections' => $requiredCorrections,
            'item_deficiencies'    => $validatedDeficiencies,
            'returned_by'          => $reviewerId,
            'reviewer_name'        => $reviewerName,
            'returned_at'          => $now,
        ];

        // Execute Return Transaction
        $db->transBegin();
        try {
            // 1. Update evaluation status and feedback
            $db->table($evalsTable)->where('id', $id)->update([
                'status'            => 'returned_for_revision',
                'return_reason'     => $reason,
                'evaluator_remarks' => json_encode($feedbackRecord),
                'returned_at'       => $now,
                'updated_at'        => $now,
            ]);

            // 2. Update item snapshots with item deficiencies
            foreach ($validatedDeficiencies as $def) {
                $db->table($itemsTable)->where('id', $def['evaluation_item_id'])->update([
                    'evaluator_remarks'   => $def['comment'],
                    'verification_status' => 'needs_revision',
                    'updated_at'          => $now,
                ]);
            }

            // 3. Log audit event
            $eventRow = [
                'id'            => $this->genUuid(),
                'evaluation_id' => $id,
                'event_type'    => 'returned_for_revision',
                'performed_by'  => $reviewerId,
                'payload'       => json_encode($feedbackRecord),
                'created_at'    => $now,
            ];
            $this->persistEvaluationEvent($db, $eventsTable, $eventRow, (string) $evaluation['status'], 'returned_for_revision');

            try {
                $notifService = new \App\Services\PersonnelWorkflowNotificationService($db);
                $notifService->handleWorkflowEvent($eventRow, [
                    'personnel_profile_id' => $evaluation['personnel_profile_id'],
                    'version_number'       => (int) ($evaluation['version_number'] ?? 1),
                ]);
            } catch (\Throwable $notifErr) {
                log_message('error', 'Failed to generate return notification: ' . $notifErr->getMessage());
                throw new \RuntimeException('Return notification could not be persisted.', 0, $notifErr);
            }

            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->respond([
                'error' => [
                    'code' => 'RETURN_FAILED',
                    'message' => 'Failed to process portfolio return: ' . $e->getMessage(),
                ],
            ], 500);
        }

        return $this->respond([
            'data' => [
                'message'              => 'Portfolio successfully returned for revision.',
                'submission_id'        => $id,
                'status'               => 'returned_for_revision',
                'returned_at'          => $now,
                'return_reason'        => $reason,
                'required_corrections' => $requiredCorrections,
                'item_deficiencies'    => $validatedDeficiencies,
            ],
        ], 200);
    }

    /**
     * PUT /api/v1/personnel/portfolio/submissions/{id}
     * Mutation Guard: Rejects any update to a locked submitted evaluation.
     */
    public function updateSubmission(string $id): mixed
    {
        $actor = $this->actor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $db = db_connect();
        $evalsTable = $this->getEvaluationsTable($db);
        $evaluation = $db->table($evalsTable)->where('id', $id)->get()->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation submission not found.']], 404);
        }

        try {
            self::assertSubmittedEvaluationImmutable($evaluation);
        } catch (RuntimeException $e) {
            return $this->respond([
                'error' => [
                    'code' => 'PORTFOLIO_SUBMISSION_LOCKED',
                    'message' => $e->getMessage(),
                ],
            ], 409);
        }

        return $this->respond(['error' => ['code' => 'PORTFOLIO_SUBMISSION_LOCKED', 'message' => 'Submitted portfolio evaluation is locked and immutable.']], 409);
    }

    /**
     * DELETE /api/v1/personnel/portfolio/submissions/{id}
     * Mutation Guard: Rejects any deletion of a locked submitted evaluation.
     */
    public function deleteSubmission(string $id): mixed
    {
        $actor = $this->actor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $db = db_connect();
        $evalsTable = $this->getEvaluationsTable($db);
        $evaluation = $db->table($evalsTable)->where('id', $id)->get()->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation submission not found.']], 404);
        }

        try {
            self::assertSubmittedEvaluationImmutable($evaluation);
        } catch (RuntimeException $e) {
            return $this->respond([
                'error' => [
                    'code' => 'PORTFOLIO_SUBMISSION_LOCKED',
                    'message' => $e->getMessage(),
                ],
            ], 409);
        }

        return $this->respond(['error' => ['code' => 'PORTFOLIO_SUBMISSION_LOCKED', 'message' => 'Submitted portfolio evaluation is locked and immutable.']], 409);
    }

    /**
     * PUT /api/v1/personnel/portfolio/submissions/{id}/items/{itemId}
     * Mutation Guard: Rejects any item update or rewrite in a locked snapshot.
     */
    public function updateItem(string $id, string $itemId): mixed
    {
        $actor = $this->actor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $db = db_connect();
        $evalsTable = $this->getEvaluationsTable($db);
        $evaluation = $db->table($evalsTable)->where('id', $id)->get()->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation submission not found.']], 404);
        }

        try {
            self::assertSubmittedEvaluationImmutable($evaluation);
        } catch (RuntimeException $e) {
            return $this->respond([
                'error' => [
                    'code' => 'PORTFOLIO_SUBMISSION_LOCKED',
                    'message' => $e->getMessage(),
                ],
            ], 409);
        }

        return $this->respond(['error' => ['code' => 'PORTFOLIO_SUBMISSION_LOCKED', 'message' => 'Submitted item snapshot is locked and immutable.']], 409);
    }

    /**
     * DELETE /api/v1/personnel/portfolio/submissions/{id}/items/{itemId}
     * Mutation Guard: Rejects any item deletion from a locked snapshot.
     */
    public function deleteItem(string $id, string $itemId): mixed
    {
        $actor = $this->actor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $db = db_connect();
        $evalsTable = $this->getEvaluationsTable($db);
        $evaluation = $db->table($evalsTable)->where('id', $id)->get()->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation submission not found.']], 404);
        }

        try {
            self::assertSubmittedEvaluationImmutable($evaluation);
        } catch (RuntimeException $e) {
            return $this->respond([
                'error' => [
                    'code' => 'PORTFOLIO_SUBMISSION_LOCKED',
                    'message' => $e->getMessage(),
                ],
            ], 409);
        }

        return $this->respond(['error' => ['code' => 'PORTFOLIO_SUBMISSION_LOCKED', 'message' => 'Submitted item snapshot is locked and immutable.']], 409);
    }

    /**
     * POST|DELETE /api/v1/personnel/portfolio/purge
     * Plan C — Phase C5: Approved Deletion Exception.
     * Irreversibly purges the owner's complete personnel portfolio, evaluation roots, and related history.
     * Authorized only for the Personnel owner or HR Admin acting on the owner's behalf.
     */
    public function purge(): mixed
    {
        $actor = $this->actor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $roles = $actor['roles'] ?? [];
        $accountType = $actor['profile']['account_type'] ?? '';
        $actorProfileId = $actor['profile']['id'] ?? '';
        $isHRAdmin = ($accountType === 'hr_admin' || in_array('hr_staff', $roles, true));
        $isOwner = ($accountType === 'academic_personnel' || $accountType === 'non_academic_personnel' || in_array('personnel', $roles, true));

        // Deans or other non-HR/non-owner actors are strictly forbidden
        if (! $isOwner && ! $isHRAdmin) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only the portfolio owner or HR Admin acting on their behalf may execute portfolio deletion.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $confirmation = trim((string) ($json['confirmation'] ?? ''));

        if ($confirmation !== 'DELETE_PORTFOLIO' && $confirmation !== 'PURGE_PORTFOLIO') {
            return $this->respond([
                'error' => [
                    'code' => 'CONFIRMATION_REQUIRED',
                    'message' => 'Explicit confirmation is required. Please provide confirmation: "DELETE_PORTFOLIO".',
                ],
            ], 422);
        }

        // Determine target personnel profile ID
        $targetProfileId = $actorProfileId;
        $reason = trim((string) ($json['reason'] ?? ''));

        if ($isHRAdmin) {
            $specifiedTargetId = trim((string) ($json['personnel_profile_id'] ?? ''));
            if ($specifiedTargetId === '') {
                return $this->respond(['error' => ['code' => 'PERSONNEL_ID_REQUIRED', 'message' => 'HR Admin deletion requires target personnel_profile_id.']], 422);
            }
            if ($reason === '') {
                return $this->respond(['error' => ['code' => 'REASON_REQUIRED', 'message' => 'HR Admin deletion requires a documented reason.']], 422);
            }
            $targetProfileId = $specifiedTargetId;
        }

        $db = db_connect();
        $rootsTable = $this->getRootsTable($db);
        $evalsTable = $this->getEvaluationsTable($db);
        $itemsTable = $this->getItemsTable($db);
        $eventsTable = $this->getEventsTable($db);

        // Check target exists
        $targetProfile = $db->table('public.profiles')->where('id', $targetProfileId)->get()->getRowArray();
        if ($targetProfile === null && $db->tableExists('profiles')) {
            $targetProfile = $db->table('profiles')->where('id', $targetProfileId)->get()->getRowArray();
        }
        if ($targetProfile === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Target personnel profile not found.']], 404);
        }

        // Atomic transaction to purge all portfolio & submission records in FK-safe order
        $db->transBegin();
        try {
            // 1. Fetch evaluations for this target
            $evaluations = $db->table($evalsTable)
                ->where('personnel_profile_id', $targetProfileId)
                ->get()
                ->getResultArray();
            $evalIds = array_column($evaluations, 'id');

            if (! empty($evalIds)) {
                // Delete evaluation items
                $db->table($itemsTable)->whereIn('evaluation_id', $evalIds)->delete();
                // Delete evaluation events
                $db->table($eventsTable)->whereIn('evaluation_id', $evalIds)->delete();
                // Delete deficiency requests / reports if table exists
                if ($db->tableExists('public.personnel_evaluation_deficiency_requests')) {
                    $db->table('public.personnel_evaluation_deficiency_requests')->whereIn('evaluation_id', $evalIds)->delete();
                }
                if ($db->tableExists('personnel_evaluation_deficiency_requests')) {
                    $db->table('personnel_evaluation_deficiency_requests')->whereIn('evaluation_id', $evalIds)->delete();
                }
                if ($db->tableExists('public.personnel_evaluation_reports')) {
                    $db->table('public.personnel_evaluation_reports')->whereIn('evaluation_id', $evalIds)->delete();
                }
                if ($db->tableExists('personnel_evaluation_reports')) {
                    $db->table('personnel_evaluation_reports')->whereIn('evaluation_id', $evalIds)->delete();
                }
                // Delete evaluations
                $db->table($evalsTable)->whereIn('id', $evalIds)->delete();
            }

            // 2. Delete evaluation roots for this target
            if ($db->tableExists($rootsTable)) {
                $db->table($rootsTable)->where('personnel_profile_id', $targetProfileId)->delete();
            }

            // 3. Fetch accomplishments for this target
            $accomplishments = $db->table('personnel_accomplishments')
                ->where('personnel_profile_id', $targetProfileId)
                ->get()
                ->getResultArray();
            $accIds = array_column($accomplishments, 'id');

            // 3. Fetch and clean up evidence and accomplishments for this target
            $versioningService = new \App\Services\PersonnelEvidenceVersioningService();
            $versioningService->purgeOwnerEvidence($targetProfileId, $actor, $reason ?: 'owner_confirmed_purge');

            if (! empty($accIds)) {
                $db->table('personnel_accomplishments')->whereIn('id', $accIds)->delete();
            }

            // 4. Write minimal non-sensitive audit log
            $now = date('Y-m-d H:i:s');
            if ($db->tableExists($eventsTable)) {
                $db->table($eventsTable)->insert([
                    'id'            => $this->genUuid(),
                    'evaluation_id' => null,
                    'event_type'    => 'portfolio_purged',
                    'performed_by'  => $actorProfileId,
                    'payload'       => json_encode([
                        'target_profile_id'      => $targetProfileId,
                        'purged_by_role'         => $isHRAdmin ? 'hr_admin' : 'owner',
                        'purged_evaluations'     => count($evalIds),
                        'purged_accomplishments' => count($accIds),
                        'reason'                 => $reason ?: 'Owner initiated deletion exception.',
                    ]),
                    'created_at'    => $now,
                ]);
            }

            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->respond([
                'error' => [
                    'code' => 'PURGE_FAILED',
                    'message' => 'Failed to execute portfolio deletion: ' . $e->getMessage(),
                ],
            ], 500);
        }

        return $this->respond([
            'data' => [
                'message'                => 'Personnel portfolio and associated submission history successfully purged.',
                'target_profile_id'      => $targetProfileId,
                'purged_evaluations'     => count($evalIds ?? []),
                'purged_accomplishments' => count($accIds ?? []),
                'purged_at'              => date('Y-m-d H:i:s'),
            ],
        ], 200);
    }

}
