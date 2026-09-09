<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
use App\Services\AwardEvaluationService;
use App\Services\AwardEligibilityService;
use App\Services\AwardEvidenceMappingService;
use App\Services\AwardScoringService;
use App\Services\AwardReviewService;
use App\Services\AwardPotentialCandidateService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use InvalidArgumentException;
use Throwable;

class AwardEvaluationController extends Controller
{
    use ResponseTrait;

    protected AuthorizationService $authz;
    protected AwardEvaluationService $awardService;
    protected AwardEligibilityService $eligibilityService;
    protected AwardEvidenceMappingService $mappingService;
    protected AwardScoringService $scoringService;
    protected AwardReviewService $reviewService;

    protected AwardPotentialCandidateService $candidateService;

    public function __construct(
        ?AuthorizationService $authz = null,
        ?AwardEvaluationService $awardService = null,
        ?AwardEligibilityService $eligibilityService = null,
        ?AwardEvidenceMappingService $mappingService = null,
        ?AwardScoringService $scoringService = null,
        ?AwardReviewService $reviewService = null,
        ?AwardPotentialCandidateService $candidateService = null
    ) {
        $this->authz = $authz ?? new AuthorizationService();
        $this->awardService = $awardService ?? new AwardEvaluationService();
        $this->eligibilityService = $eligibilityService ?? new AwardEligibilityService();
        $this->mappingService = $mappingService ?? new AwardEvidenceMappingService(null, $this->eligibilityService);
        $this->scoringService = $scoringService ?? new AwardScoringService(null, $this->eligibilityService, $this->mappingService);
        $this->reviewService = $reviewService ?? new AwardReviewService(null, $this->eligibilityService, $this->mappingService, $this->scoringService);
        $this->candidateService = $candidateService ?? new AwardPotentialCandidateService(null, $this->eligibilityService, $this->mappingService, $this->scoringService, $this->reviewService);
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
     * GET /api/v1/osad/awards
     * Lists active award definitions with criteria.
     */
    public function listAwards(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $db = db_connect();
        $awards = $db->table('award_definitions')
            ->where('status', 'active')
            ->where('is_catalog_visible', 1)
            ->orderBy('name', 'ASC')
            ->get()->getResultArray();

        foreach ($awards as &$award) {
            $criteria = $db->table('award_criteria')
                ->where('award_definition_id', $award['id'])
                ->orderBy('sort_order', 'ASC')
                ->get()->getResultArray();

            foreach ($criteria as &$crit) {
                $crit['components'] = $db->table('award_criterion_components')
                    ->where('criterion_id', $crit['id'])
                    ->orderBy('sort_order', 'ASC')
                    ->get()->getResultArray();
            }
            unset($crit);

            $award['criteria'] = $criteria;
        }
        unset($award);

        return $this->respond(['data' => ['awards' => $awards]], 200);
    }

    /**
     * POST /api/v1/osad/awards/{awardId}/evaluate
     * Executes automated evaluation for an award (all eligible students or a single student).
     * Rule: Active OSAD Administrator ONLY.
     */
    public function evaluateAward(string $awardId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        if (! $this->authz->award()->canRunAwardEvaluation($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Active OSAD administrator authorization required.']], 403);
        }

        $db = db_connect();
        $award = $db->table('award_definitions')->where('id', $awardId)->get()->getRowArray();
        if ($award === null || $award['status'] !== 'active') {
            return $this->respond(['error' => ['code' => 'AWARD_NOT_FOUND', 'message' => 'Active award definition not found.']], 404);
        }

        $payload = $this->request->getJSON(true) ?? [];
        $cycleId = trim((string) ($payload['cycle_id'] ?? ''));
        $studentId = trim((string) ($payload['student_profile_id'] ?? ''));

        $cycle = $this->awardService->resolveActiveCycle($cycleId !== '' ? $cycleId : null);
        if ($cycle === null || ! in_array($cycle['status'], ['active', 'evaluating'], true)) {
            return $this->respond(['error' => ['code' => 'ACTIVE_CYCLE_REQUIRED', 'message' => 'Active award cycle not found.']], 422);
        }

        try {
            if ($studentId !== '') {
                $eval = $this->awardService->evaluateStudentAward(
                    $cycle['id'],
                    $awardId,
                    $studentId,
                    $actor['profile']['id']
                );
                return $this->respond(['data' => $eval], 200);
            }

            $bulk = $this->awardService->evaluateAwardForAllStudents(
                $cycle['id'],
                $awardId,
                $actor['profile']['id']
            );
            return $this->respond(['data' => $bulk], 200);
        } catch (Throwable $e) {
            log_message('error', '[AwardEvaluationController::evaluateAward] ' . $e->getMessage());
            return $this->respond(['error' => ['code' => 'EVALUATION_FAILED', 'message' => 'Failed to complete award evaluation.']], 500);
        }
    }

    /**
     * Helper to validate active OSAD administrator for threshold mutation.
     */
    protected function isAuthorizedThresholdActor(array $actor): bool
    {
        $accountType = $actor['profile']['account_type'] ?? '';
        $status = $actor['profile']['status'] ?? '';
        $roles = (array) ($actor['roles'] ?? []);
        return $accountType === 'osad_admin' && $status === 'active' && in_array('osad_staff', $roles, true);
    }

    /**
     * Helper to extract server-bound actor ID and valid candidate threshold argument.
     */
    protected function thresholdMutationArguments(array $actor, string $awardId, array $payload): ?array
    {
        $actorId = (string) ($actor['profile']['id'] ?? '');
        $rawThreshold = $payload['candidate_threshold_percent'] ?? null;
        if (! is_numeric($rawThreshold)) {
            return null;
        }

        $threshold = (float) $rawThreshold;
        if ($threshold < 0 || $threshold > 100) {
            return null;
        }

        return [$actorId, $awardId, (string) $rawThreshold];
    }

    /**
     * PATCH /api/v1/osad/awards/{awardId}/candidate-threshold
     */
    public function updateCandidateThreshold(string $awardId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        if (! $this->isAuthorizedThresholdActor($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Active OSAD administrator authorization required.']], 403);
        }

        $db = db_connect();
        $award = $db->table('award_definitions')->where('id', $awardId)->get()->getRowArray();
        if ($award === null || $award['status'] !== 'active') {
            return $this->respond(['error' => ['code' => 'AWARD_NOT_FOUND', 'message' => 'Active award definition not found.']], 404);
        }

        $payload = $this->request->getJSON(true) ?? [];
        $rawThreshold = $payload['candidate_threshold_percent'] ?? null;
        if (! is_numeric($rawThreshold)) {
            return $this->respond(['error' => ['code' => 'INVALID_THRESHOLD', 'message' => 'candidate_threshold_percent must be a numeric value between 0 and 100.']], 422);
        }

        $threshold = (float) $rawThreshold;
        if ($threshold < 0 || $threshold > 100) {
            return $this->respond(['error' => ['code' => 'INVALID_THRESHOLD', 'message' => 'candidate_threshold_percent must be between 0 and 100.']], 422);
        }

        $db->table('award_definitions')
            ->where('id', $awardId)
            ->update([
                'candidate_threshold_percent' => $threshold,
                'updated_at'                  => date('Y-m-d H:i:s'),
            ]);

        return $this->respond([
            'data' => [
                'award_id'                    => $awardId,
                'candidate_threshold_percent' => $threshold,
                'message'                     => 'Award candidate threshold updated successfully.',
            ],
        ], 200);
    }

    /**
     * GET /api/v1/osad/awards/{awardId}/candidates
     */
    public function listCandidates(string $awardId): mixed
    {
        $_GET['award_id'] = $awardId;
        return $this->listAllCandidates();
    }

    /**
     * GET /api/v1/osad/candidates
     * Lists all potential award candidates and dean-nominated candidates across awards.
     */
    public function listAllCandidates(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        if (! $this->authz->award()->canViewAwardEvaluation($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Access denied to award candidates.']], 403);
        }

        $awardFilter = trim((string) ($this->request->getGet('award_id') ?? ''));
        $cycleFilter = trim((string) ($this->request->getGet('cycle_id') ?? ''));
        $collegeFilter = trim((string) ($this->request->getGet('college_id') ?? ''));
        $sourceFilter = trim((string) ($this->request->getGet('source') ?? ''));

        $db = db_connect();
        $cycle = $this->awardService->resolveActiveCycle($cycleFilter !== '' ? $cycleFilter : null);
        if ($cycle === null) {
            return $this->respond(['error' => ['code' => 'AWARD_CYCLE_REQUIRED', 'message' => 'A valid Award Cycle is required.']], 422);
        }

        // 1. Portfolio-based evaluations
        $evalBuilder = $db->table('student_award_evaluations sae')
            ->select([
                'sae.id AS evaluation_id',
                'sae.cycle_id',
                'sae.award_definition_id',
                'ad.code AS award_code',
                'ad.name AS award_name',
                'ad.candidate_threshold_percent',
                'sae.student_profile_id',
                'p.full_name AS student_name',
                'p.institutional_id AS student_id_number',
                'p.email AS student_email',
                'ap.id AS program_id',
                'ap.code AS program_code',
                'ap.name AS program_name',
                'c.id AS college_id',
                'c.code AS college_code',
                'c.name AS college_name',
                'sae.raw_score',
                'sae.potential_score',
                'sae.outcome',
                'sae.verified_evidence_count',
                'sae.evaluated_at',
            ])
            ->join('award_definitions ad', 'ad.id = sae.award_definition_id')
            ->join('profiles p', 'p.id = sae.student_profile_id')
            ->join('student_program_enrollments spe', 'spe.student_profile_id = p.id AND spe.is_active = 1', 'left')
            ->join('academic_programs ap', 'ap.id = spe.academic_program_id', 'left')
            ->join('colleges c', 'c.id = ap.college_id', 'left')
            ->where('sae.cycle_id', $cycle['id'])
            ->orderBy('sae.potential_score', 'DESC');

        if ($awardFilter !== '' && $awardFilter !== 'all') {
            $evalBuilder->where('sae.award_definition_id', $awardFilter);
        }
        if ($collegeFilter !== '' && $collegeFilter !== 'all') {
            $evalBuilder->where('c.id', $collegeFilter);
        }

        $evaluations = ($sourceFilter === 'dean_nomination') ? [] : $evalBuilder->get()->getResultArray();

        // 2. Dean nominations
        $nomBuilder = $db->table('dean_student_nominations dsn')
            ->select([
                'dsn.id AS nomination_id',
                'dsn.cycle_id',
                'dsn.award_definition_id',
                'ad.code AS award_code',
                'ad.name AS award_name',
                'ad.candidate_threshold_percent',
                'dsn.student_profile_id',
                'p.full_name AS student_name',
                'p.institutional_id AS student_id_number',
                'p.email AS student_email',
                'ap.id AS program_id',
                'ap.code AS program_code',
                'ap.name AS program_name',
                'c.id AS college_id',
                'c.code AS college_code',
                'c.name AS college_name',
                'dsn.justification',
                'dsn.status AS nomination_status',
                'dsn.nominated_at',
                'dean_p.full_name AS nominator_name',
            ])
            ->join('award_definitions ad', 'ad.id = dsn.award_definition_id')
            ->join('profiles p', 'p.id = dsn.student_profile_id')
            ->join('student_program_enrollments spe', 'spe.student_profile_id = p.id AND spe.is_active = 1', 'left')
            ->join('academic_programs ap', 'ap.id = spe.academic_program_id', 'left')
            ->join('colleges c', 'c.id = ap.college_id', 'left')
            ->join('dean_assignments da', 'da.id = dsn.dean_assignment_id')
            ->join('profiles dean_p', 'dean_p.id = da.personnel_profile_id')
            ->where('dsn.cycle_id', $cycle['id'])
            ->where('dsn.status', 'active')
            ->orderBy('dsn.nominated_at', 'DESC');

        if ($awardFilter !== '' && $awardFilter !== 'all') {
            $nomBuilder->where('dsn.award_definition_id', $awardFilter);
        }
        if ($collegeFilter !== '' && $collegeFilter !== 'all') {
            $nomBuilder->where('c.id', $collegeFilter);
        }

        $nominations = ($sourceFilter === 'portfolio_evaluation') ? [] : $nomBuilder->get()->getResultArray();

        // Format unified candidate list
        $candidates = [];

        foreach ($evaluations as $e) {
            $candidates[] = [
                'candidate_id'              => 'eval-' . $e['evaluation_id'],
                'student_profile_id'        => $e['student_profile_id'],
                'student_name'              => $e['student_name'],
                'student_id_number'         => $e['student_id_number'],
                'student_email'             => $e['student_email'],
                'program_id'                => $e['program_id'],
                'program_code'              => $e['program_code'],
                'program_name'              => $e['program_name'],
                'college_id'                => $e['college_id'],
                'college_code'              => $e['college_code'],
                'college_name'              => $e['college_name'],
                'award_definition_id'       => $e['award_definition_id'],
                'award_code'                => $e['award_code'],
                'award_name'                => $e['award_name'],
                'candidate_threshold_percent' => $e['candidate_threshold_percent'],
                'eligibility_source'        => 'portfolio_evaluation',
                'evaluation_id'             => $e['evaluation_id'],
                'nomination_id'             => null,
                'nominator_name'            => null,
                'justification'             => null,
                'raw_score'                 => (float) $e['raw_score'],
                'potential_score'           => (float) $e['potential_score'],
                'verified_evidence_count'   => (int) $e['verified_evidence_count'],
                'is_candidate'              => (float) $e['potential_score'] >= (float) ($e['candidate_threshold_percent'] ?? 80.0),
                'outcome'                   => $e['outcome'],
                'evaluated_at'              => $e['evaluated_at'],
                'nominated_at'              => null,
            ];
        }

        foreach ($nominations as $n) {
            $candidates[] = [
                'candidate_id'              => 'nom-' . $n['nomination_id'],
                'student_profile_id'        => $n['student_profile_id'],
                'student_name'              => $n['student_name'],
                'student_id_number'         => $n['student_id_number'],
                'student_email'             => $n['student_email'],
                'program_id'                => $n['program_id'],
                'program_code'              => $n['program_code'],
                'program_name'              => $n['program_name'],
                'college_id'                => $n['college_id'],
                'college_code'              => $n['college_code'],
                'college_name'              => $n['college_name'],
                'award_definition_id'       => $n['award_definition_id'],
                'award_code'                => $n['award_code'],
                'award_name'                => $n['award_name'],
                'candidate_threshold_percent' => $n['candidate_threshold_percent'],
                'eligibility_source'        => 'dean_nomination',
                'evaluation_id'             => null,
                'nomination_id'             => $n['nomination_id'],
                'nominator_name'            => $n['nominator_name'],
                'justification'             => $n['justification'],
                'raw_score'                 => null,
                'potential_score'           => null,
                'verified_evidence_count'   => null,
                'is_candidate'              => true,
                'outcome'                   => 'Dean-Nominated Candidate',
                'evaluated_at'              => null,
                'nominated_at'              => $n['nominated_at'],
            ];
        }

        return $this->respond([
            'data' => [
                'candidates' => $candidates,
                'total'      => count($candidates),
            ],
        ], 200);
    }

    /**
     * GET /api/v1/osad/awards/{awardId}/students/{studentId}/basis
     */
    public function scoringBasis(string $awardId, string $studentId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        if (! $this->authz->award()->canViewAwardEvaluation($actor, $studentId)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Access denied to scoring basis.']], 403);
        }

        $db = db_connect();
        $cycleId = trim((string) ($this->request->getGet('cycle_id') ?? ''));
        $cycle = $this->awardService->resolveActiveCycle($cycleId !== '' ? $cycleId : null);
        if ($cycle === null) {
            return $this->respond(['error' => ['code' => 'AWARD_CYCLE_REQUIRED', 'message' => 'A valid Award Cycle is required.']], 422);
        }
        $evaluation = $db->table('student_award_evaluations sae')
            ->select(['sae.*', 'ad.name AS award_name', 'ad.code AS award_code', 'p.full_name AS student_name', 'p.institutional_id AS student_id_number'])
            ->join('award_definitions ad', 'ad.id = sae.award_definition_id')
            ->join('profiles p', 'p.id = sae.student_profile_id')
            ->where('sae.award_definition_id', $awardId)
            ->where('sae.cycle_id', $cycle['id'])
            ->where('sae.student_profile_id', $studentId)
            ->get()->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'EVALUATION_NOT_FOUND', 'message' => 'Candidate evaluation record not found.']], 404);
        }

        $criterionScores = $db->table('student_award_criterion_scores sacs')
            ->select(['sacs.*', 'ac.code AS criterion_code', 'ac.name AS criterion_name', 'ac.max_points AS criterion_max_points'])
            ->join('award_criteria ac', 'ac.id = sacs.criterion_id')
            ->where('sacs.evaluation_id', $evaluation['id'])
            ->get()->getResultArray();

        foreach ($criterionScores as &$cs) {
            $cs['evidence_items'] = $db->table('student_award_score_evidence sase')
                ->select(['sase.*', 'spr.title AS record_title', 'spr.occurrence_date', 'pc.name AS category_name'])
                ->join('student_portfolio_records spr', 'spr.id = sase.portfolio_record_id')
                ->join('portfolio_categories pc', 'pc.id = spr.category_id')
                ->where('sase.criterion_score_id', $cs['id'])
                ->get()->getResultArray();
        }
        unset($cs);

        return $this->respond([
            'data' => [
                'evaluation' => $evaluation,
                'criteria'   => $criterionScores,
            ],
        ], 200);
    }

    /**
     * POST /api/v1/dean/nominations
     * Dean submits a candidate nomination for an award.
     * Approved rule: Active College Dean may nominate ANY eligible student across the university.
     */
    public function createDeanNomination(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        if (! $this->authz->award()->canNominateStudent($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Active College Dean assignment required to submit award nominations.']], 403);
        }

        $db = db_connect();
        $deanAssignment = $db->table('dean_assignments')
            ->where('personnel_profile_id', $actor['profile']['id'])
            ->where('is_active', 1)
            ->get()->getRowArray();

        if ($deanAssignment === null) {
            return $this->respond(['error' => ['code' => 'ACTIVE_DEAN_ASSIGNMENT_REQUIRED', 'message' => 'No active Dean assignment found.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $studentId = trim((string) ($json['student_profile_id'] ?? ''));
        $awardId = trim((string) ($json['award_definition_id'] ?? ''));
        $cycleId = trim((string) ($json['cycle_id'] ?? ''));
        $justification = trim((string) ($json['justification'] ?? ''));

        if ($studentId === '' || $awardId === '' || $justification === '') {
            return $this->respond(['error' => ['code' => 'MISSING_FIELDS', 'message' => 'student_profile_id, award_definition_id, and justification are required.']], 422);
        }

        try {
            $result = $this->awardService->createDeanNomination(
                $actor['profile']['id'],
                $deanAssignment['id'],
                $studentId,
                $awardId,
                $cycleId !== '' ? $cycleId : null,
                $justification
            );

            return $this->respondCreated([
                'data' => [
                    'message'       => 'Dean nomination submitted successfully.',
                    'nomination_id' => $result['nomination_id'],
                ],
            ]);
        } catch (Throwable $e) {
            log_message('error', '[AwardEvaluationController::createDeanNomination] ' . $e->getMessage());
            return $this->respond(['error' => ['code' => 'NOMINATION_FAILED', 'message' => 'Failed to record nomination.']], 422);
        }
    }

    /**
     * GET /api/v1/awards/campus-journalism/students/{studentId}/score
     * Computes authoritative 70-point score and explainability payload for Campus Journalism.
     */
    public function campusJournalismScore(string $studentId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        try {
            $scoringService = new \App\Services\CampusJournalismScoringService();
            $payload = $scoringService->calculateForStudent($studentId);

            return $this->respond(['data' => $payload], 200);
        } catch (Throwable $e) {
            log_message('error', '[AwardEvaluationController::campusJournalismScore] ' . $e->getMessage());
            return $this->respond(['error' => ['code' => 'SCORING_FAILED', 'message' => 'Failed to calculate score: ' . $e->getMessage()]], 500);
        }
    }

    /**
     * GET /api/v1/awards/campus-journalism/candidates
     * Returns all qualifying potential candidates for the Campus Journalism Award.
     */
    public function campusJournalismCandidates(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        try {
            $scoringService = new \App\Services\CampusJournalismScoringService();
            $candidates = $scoringService->listCampusJournalismCandidates();

            return $this->respond([
                'data' => [
                    'award_code'                => 'CAMPUS_JOURNALISM_AWARD',
                    'award_name'                => 'Campus Journalism Award',
                    'total_candidates'          => count($candidates),
                    'threshold_percent'         => 80.0,
                    'threshold_raw'             => 56.0,
                    'is_portfolio_computable'   => true,
                    'official_rubric_max'       => 100.0,
                    'computable_raw_max'        => 70.0,
                    'human_evaluated_criteria'  => [
                        [
                            'criterion_code' => 'CRIT_JOURN_CHAR',
                            'label'          => 'Moral Character / Exemplary Conduct',
                            'max_points'     => 20.0,
                            'status_label'   => 'Not automatically scored (OSAD Human Evaluation)',
                        ],
                        [
                            'criterion_code' => 'CRIT_JOURN_INTV',
                            'label'          => 'Panel Interview / Deliberation',
                            'max_points'     => 10.0,
                            'status_label'   => 'Not automatically scored (OSAD Human Evaluation)',
                        ],
                    ],
                    'candidates'                => $candidates,
                ],
            ], 200);
        } catch (Throwable $e) {
            log_message('error', '[AwardEvaluationController::campusJournalismCandidates] ' . $e->getMessage());
            return $this->respond(['error' => ['code' => 'CANDIDATE_GENERATION_FAILED', 'message' => 'Failed to generate candidates: ' . $e->getMessage()]], 500);
        }
    }

    /**
     * GET /api/v1/osad/awards/{awardId}/students/{studentId}/eligibility
     * Evaluates award-level eligibility gates (Graduation, Sex, Profile Active).
     */
    public function studentAwardEligibility(string $awardId, string $studentId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        try {
            $result = $this->eligibilityService->evaluateStudentEligibilityByIds($awardId, $studentId);
            return $this->respond(['data' => $result], 200);
        } catch (Throwable $e) {
            log_message('error', '[AwardEvaluationController::studentAwardEligibility] ' . $e->getMessage());
            return $this->respond(['error' => ['code' => 'ELIGIBILITY_CHECK_FAILED', 'message' => 'Failed to evaluate award eligibility.']], 500);
        }
    }

    /**
     * GET /api/v1/osad/awards/{awardId}/students-for-evaluation
     * Lists all eligible students who possess at least one relevant verified portfolio record (Students for Evaluation).
     */
    public function studentsForEvaluation(string $awardId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        try {
            $students = $this->mappingService->getStudentsForEvaluation($awardId);
            return $this->respond([
                'data' => [
                    'award_id'          => $awardId,
                    'total_students'    => count($students),
                    'students'          => $students,
                ],
            ], 200);
        } catch (Throwable $e) {
            log_message('error', '[AwardEvaluationController::studentsForEvaluation] ' . $e->getMessage());
            return $this->respond(['error' => ['code' => 'STUDENTS_FOR_EVALUATION_FAILED', 'message' => 'Failed to retrieve students for evaluation.']], 500);
        }
    }

    /**
     * GET /api/v1/osad/awards/{awardId}/students/{studentId}/evidence
     * Returns the complete relevant verified evidence package for the student and award.
     */
    public function studentAwardEvidence(string $awardId, string $studentId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        try {
            $db = db_connect();
            $award = $db->table('award_definitions')->where('id', $awardId)->get()->getRowArray();
            $student = $db->table('profiles')->where('id', $studentId)->where('account_type', 'student')->get()->getRowArray();

            if ($award === null) {
                return $this->respond(['error' => ['code' => 'AWARD_NOT_FOUND', 'message' => 'Award not found.']], 404);
            }
            if ($student === null) {
                return $this->respond(['error' => ['code' => 'STUDENT_NOT_FOUND', 'message' => 'Student not found.']], 404);
            }

            $package = $this->mappingService->mapStudentEvidenceForAward($award, $student);
            return $this->respond(['data' => $package], 200);
        } catch (Throwable $e) {
            log_message('error', '[AwardEvaluationController::studentAwardEvidence] ' . $e->getMessage());
            return $this->respond(['error' => ['code' => 'EVIDENCE_MAPPING_FAILED', 'message' => 'Failed to retrieve student award evidence package.']], 500);
        }
    }

    /**
     * POST /api/v1/osad/awards/{awardId}/students/{studentId}/score
     * Scores a student for an award and returns full criterion score breakdown and evidence traceability.
     */
    public function scoreStudentAward(string $awardId, string $studentId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        try {
            $db = db_connect();
            $award = $db->table('award_definitions')->where('id', $awardId)->get()->getRowArray();
            $student = $db->table('profiles')->where('id', $studentId)->where('account_type', 'student')->get()->getRowArray();

            if ($award === null) {
                return $this->respond(['error' => ['code' => 'AWARD_NOT_FOUND', 'message' => 'Award not found.']], 404);
            }
            if ($student === null) {
                return $this->respond(['error' => ['code' => 'STUDENT_NOT_FOUND', 'message' => 'Student not found.']], 404);
            }

            $result = $this->scoringService->scoreStudentForAward($award, $student);
            return $this->respond(['data' => $result], 200);
        } catch (Throwable $e) {
            log_message('error', '[AwardEvaluationController::scoreStudentAward] ' . $e->getMessage());
            return $this->respond(['error' => ['code' => 'SCORING_CALCULATION_FAILED', 'message' => 'Failed to calculate award score for student.']], 500);
        }
    }

    /**
     * GET /api/v1/osad/awards/{awardId}/students/{studentId}/scoring-basis
     * Returns the scoring basis and evidence traceability for a student and award.
     */
    public function studentScoringBasis(string $awardId, string $studentId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        try {
            $db = db_connect();
            $award = $db->table('award_definitions')->where('id', $awardId)->get()->getRowArray();
            $student = $db->table('profiles')->where('id', $studentId)->where('account_type', 'student')->get()->getRowArray();

            if ($award === null) {
                return $this->respond(['error' => ['code' => 'AWARD_NOT_FOUND', 'message' => 'Award not found.']], 404);
            }
            if ($student === null) {
                return $this->respond(['error' => ['code' => 'STUDENT_NOT_FOUND', 'message' => 'Student not found.']], 404);
            }

            $result = $this->scoringService->scoreStudentForAward($award, $student);
            return $this->respond(['data' => $result], 200);
        } catch (Throwable $e) {
            log_message('error', '[AwardEvaluationController::studentScoringBasis] ' . $e->getMessage());
            return $this->respond(['error' => ['code' => 'SCORING_BASIS_FAILED', 'message' => 'Failed to retrieve scoring basis.']], 500);
        }
    }

    /**
     * GET /api/v1/osad/awards/{awardId}/students/{studentId}/review
     * Returns complete unified review workspace package for a student and award.
     */
    public function studentAwardReview(string $awardId, string $studentId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        try {
            $workspace = $this->reviewService->getStudentReviewWorkspace($awardId, $studentId, $actor['profile_id'] ?? null);
            return $this->respond(['data' => $workspace], 200);
        } catch (Throwable $e) {
            log_message('error', '[AwardEvaluationController::studentAwardReview] ' . $e->getMessage());
            return $this->respond(['error' => ['code' => 'REVIEW_WORKSPACE_FAILED', 'message' => 'Failed to load review workspace. ' . $e->getMessage()]], 500);
        }
    }

    /**
     * PATCH /api/v1/osad/awards/{awardId}/students/{studentId}/manual-criteria
     * Saves draft or updates manual panel criteria with validation against official maximums.
     */
    public function saveManualCriteria(string $awardId, string $studentId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $payload = $this->request->getJSON(true) ?? [];
        $manualScores = $payload['manual_scores'] ?? $payload['scores'] ?? [];
        $notes = $payload['notes'] ?? null;
        $finalize = (bool) ($payload['finalize'] ?? false);

        try {
            $result = $this->reviewService->saveManualCriteria(
                $awardId,
                $studentId,
                $manualScores,
                $notes,
                $actor['profile_id'] ?? null,
                $finalize
            );
            return $this->respond(['data' => $result], 200);
        } catch (InvalidArgumentException $e) {
            return $this->respond(['error' => ['code' => 'INVALID_MANUAL_SCORE', 'message' => $e->getMessage()]], 422);
        } catch (Throwable $e) {
            log_message('error', '[AwardEvaluationController::saveManualCriteria] ' . $e->getMessage());
            return $this->respond(['error' => ['code' => 'MANUAL_SAVE_FAILED', 'message' => 'Failed to save manual criteria scores.']], 500);
        }
    }

    /**
     * POST /api/v1/osad/awards/{awardId}/students/{studentId}/finalize
     * Validates that all required manual criteria are completed and sets evaluation state to EVALUATED.
     */
    public function finalizeStudentAwardEvaluation(string $awardId, string $studentId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $payload = $this->request->getJSON(true) ?? [];
        $manualScores = $payload['manual_scores'] ?? $payload['scores'] ?? [];
        $notes = $payload['notes'] ?? null;

        try {
            $result = $this->reviewService->saveManualCriteria(
                $awardId,
                $studentId,
                $manualScores,
                $notes,
                $actor['profile_id'] ?? null,
                true // Finalize
            );
            return $this->respond(['data' => $result], 200);
        } catch (InvalidArgumentException $e) {
            return $this->respond(['error' => ['code' => 'FINALIZATION_VALIDATION_FAILED', 'message' => $e->getMessage()]], 422);
        } catch (Throwable $e) {
            log_message('error', '[AwardEvaluationController::finalizeStudentAwardEvaluation] ' . $e->getMessage());
            return $this->respond(['error' => ['code' => 'FINALIZATION_FAILED', 'message' => 'Failed to finalize evaluation.']], 500);
        }
    }

    /**
     * POST /api/v1/osad/awards/{awardId}/students/{studentId}/recalculate
     * Recalculates Phase 5 portfolio scores for a student without wiping saved manual criteria.
     */
    public function recalculatePortfolioScore(string $awardId, string $studentId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        try {
            $workspace = $this->reviewService->getStudentReviewWorkspace($awardId, $studentId, $actor['profile_id'] ?? null);
            return $this->respond([
                'data' => [
                    'award_id'          => $awardId,
                    'student_id'        => $studentId,
                    'portfolio_scoring' => $workspace['portfolio_scoring'],
                    'message'           => 'Portfolio score recalculated successfully from verified master evidence.',
                ],
            ], 200);
        } catch (Throwable $e) {
            log_message('error', '[AwardEvaluationController::recalculatePortfolioScore] ' . $e->getMessage());
            return $this->respond(['error' => ['code' => 'RECALCULATE_FAILED', 'message' => 'Failed to recalculate portfolio score.']], 500);
        }
    }

    /**
     * POST /api/v1/osad/awards/{awardId}/students/{studentId}/classify
     * Evaluates and classifies a student against the 80% Potential Candidate threshold.
     */
    public function classifyPotentialCandidate(string $awardId, string $studentId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        try {
            $result = $this->candidateService->evaluatePotentialCandidateByIds($awardId, $studentId);
            return $this->respond(['data' => $result], 200);
        } catch (InvalidArgumentException $e) {
            return $this->respond(['error' => ['code' => 'INVALID_ARGUMENT', 'message' => $e->getMessage()]], 422);
        } catch (Throwable $e) {
            log_message('error', '[AwardEvaluationController::classifyPotentialCandidate] ' . $e->getMessage());
            return $this->respond(['error' => ['code' => 'CLASSIFICATION_FAILED', 'message' => 'Failed to classify potential candidate.']], 500);
        }
    }

    /**
     * GET /api/v1/osad/awards/{awardId}/students/{studentId}/candidate-status
     * Retrieves the current candidate classification status for a student.
     */
    public function studentCandidateStatus(string $awardId, string $studentId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        try {
            $result = $this->candidateService->evaluatePotentialCandidateByIds($awardId, $studentId);
            return $this->respond(['data' => $result], 200);
        } catch (InvalidArgumentException $e) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => $e->getMessage()]], 404);
        } catch (Throwable $e) {
            log_message('error', '[AwardEvaluationController::studentCandidateStatus] ' . $e->getMessage());
            return $this->respond(['error' => ['code' => 'FETCH_STATUS_FAILED', 'message' => 'Failed to retrieve candidate status.']], 500);
        }
    }

    /**
     * GET /api/v1/osad/awards/{awardId}/potential-candidates
     * Retrieves all students qualifying as Potential Candidates (>= 80% threshold).
     */
    public function listPotentialCandidates(string $awardId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        try {
            $result = $this->candidateService->getPotentialCandidatesForAward($awardId);
            return $this->respond(['data' => $result], 200);
        } catch (InvalidArgumentException $e) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => $e->getMessage()]], 404);
        } catch (Throwable $e) {
            log_message('error', '[AwardEvaluationController::listPotentialCandidates] ' . $e->getMessage());
            return $this->respond(['error' => ['code' => 'FETCH_CANDIDATES_FAILED', 'message' => 'Failed to list potential candidates.']], 500);
        }
    }

    /**
     * GET /api/v1/osad/awards/{awardId}/evaluated-results
     * Retrieves all evaluated student results (both Potential Candidates and Below Threshold).
     */
    public function listEvaluatedResults(string $awardId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        try {
            $result = $this->candidateService->getEvaluatedResultsForAward($awardId);
            return $this->respond(['data' => $result], 200);
        } catch (InvalidArgumentException $e) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => $e->getMessage()]], 404);
        } catch (Throwable $e) {
            log_message('error', '[AwardEvaluationController::listEvaluatedResults] ' . $e->getMessage());
            return $this->respond(['error' => ['code' => 'FETCH_RESULTS_FAILED', 'message' => 'Failed to list evaluated results.']], 500);
        }
    }
}



