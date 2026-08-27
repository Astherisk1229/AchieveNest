<?php

namespace App\Controllers\Api;

use App\Helpers\ValidationHelper;
use App\Services\AuthenticatedActorService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class AwardEvaluationController extends Controller
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
        $awards = $db->table('public.award_definitions')
            ->where('status', 'active')
            ->orderBy('name', 'ASC')
            ->get()->getResultArray();

        foreach ($awards as &$award) {
            $award['criteria'] = $db->table('public.award_criteria')
                ->where('award_definition_id', $award['id'])
                ->orderBy('sort_order', 'ASC')
                ->get()->getResultArray();
        }
        unset($award);

        return $this->respond(['data' => ['awards' => $awards]], 200);
    }

    /**
     * PATCH /api/v1/osad/awards/{awardId}/candidate-threshold
     * The audit actor is always derived from the verified bearer token context.
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

        $payload = $this->request->getJSON(true) ?? [];
        $arguments = $this->thresholdMutationArguments($actor, $awardId, $payload);
        if ($arguments === null) {
            return $this->respond(['error' => ['code' => 'INVALID_THRESHOLD', 'message' => 'candidate_threshold_percent must be between 0 and 100 with at most two decimal places.']], 422);
        }

        try {
            $row = db_connect()->query(
                'SELECT public.admin_update_award_candidate_threshold(?, ?, ?) AS result',
                $arguments
            )->getRowArray();
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'THRESHOLD_UPDATE_FAILED', 'message' => 'Award threshold update failed.']], 500);
        }

        return $this->respond(['data' => json_decode((string) ($row['result'] ?? '{}'), true)], 200);
    }

    /**
     * Builds database arguments exclusively from trusted actor context, route ID,
     * and the single approved mutable payload field.
     *
     * @return array{0:string,1:string,2:string}|null
     */
    protected function thresholdMutationArguments(array $actor, string $awardId, array $payload): ?array
    {
        $rawThreshold = $payload['candidate_threshold_percent'] ?? null;
        if (! is_numeric($rawThreshold)) {
            return null;
        }

        $threshold = (string) $rawThreshold;
        if ((float) $threshold < 0 || (float) $threshold > 100
            || ! preg_match('/^(?:100(?:\.0{1,2})?|\d{1,2}(?:\.\d{1,2})?)$/', $threshold)) {
            return null;
        }

        return [(string) $actor['profile']['id'], $awardId, $threshold];
    }

    protected function isAuthorizedThresholdActor(array $actor): bool
    {
        return ($actor['profile']['account_type'] ?? '') === 'osad_admin'
            && ($actor['profile']['status'] ?? '') === 'active'
            && in_array('osad_staff', $actor['roles'] ?? [], true);
    }

    /**
     * GET /api/v1/osad/awards/{awardId}/candidates
     * Lists candidate evaluations (both portfolio-based and Dean nominations).
     */
    public function listCandidates(string $awardId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $db = db_connect();
        $evaluations = $db->table('public.student_award_evaluations sae')
            ->select([
                'sae.*',
                'p.full_name AS student_name',
                'p.institutional_id AS student_id_number',
                'p.institutional_email AS student_email',
                'ap.code AS program_code',
                'ap.name AS program_name',
                'c.code AS college_code',
            ])
            ->join('public.profiles p', 'p.id = sae.student_profile_id')
            ->join('public.student_program_enrollments spe', 'spe.student_profile_id = p.id AND spe.is_active = true', 'left')
            ->join('public.academic_programs ap', 'ap.id = spe.academic_program_id', 'left')
            ->join('public.colleges c', 'c.id = ap.college_id', 'left')
            ->where('sae.award_definition_id', $awardId)
            ->orderBy('sae.potential_score', 'DESC')
            ->get()->getResultArray();

        // Also fetch Dean nominations for this award
        $nominations = $db->table('public.dean_student_nominations dsn')
            ->select([
                'dsn.*',
                'p.full_name AS student_name',
                'p.institutional_id AS student_id_number',
                'p.institutional_email AS student_email',
                'dean_p.full_name AS nominator_name',
            ])
            ->join('public.profiles p', 'p.id = dsn.student_profile_id')
            ->join('public.dean_assignments da', 'da.id = dsn.dean_assignment_id')
            ->join('public.profiles dean_p', 'dean_p.id = da.personnel_profile_id')
            ->where('dsn.award_definition_id', $awardId)
            ->where('dsn.status', 'active')
            ->get()->getResultArray();

        return $this->respond([
            'data' => [
                'evaluations' => $evaluations,
                'dean_nominations' => $nominations,
            ],
        ], 200);
    }

    /**
     * GET /api/v1/osad/awards/{awardId}/students/{studentId}/basis
     * Returns full explainable breakdown of criterion scores and evidence basis for a candidate.
     */
    public function scoringBasis(string $awardId, string $studentId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $db = db_connect();
        $evaluation = $db->table('public.student_award_evaluations sae')
            ->select(['sae.*', 'ad.name AS award_name', 'ad.code AS award_code', 'p.full_name AS student_name', 'p.institutional_id AS student_id_number'])
            ->join('public.award_definitions ad', 'ad.id = sae.award_definition_id')
            ->join('public.profiles p', 'p.id = sae.student_profile_id')
            ->where('sae.award_definition_id', $awardId)
            ->where('sae.student_profile_id', $studentId)
            ->get()->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'EVALUATION_NOT_FOUND', 'message' => 'Candidate evaluation record not found.']], 404);
        }

        $criterionScores = $db->table('public.student_award_criterion_scores sacs')
            ->select(['sacs.*', 'ac.code AS criterion_code', 'ac.name AS criterion_name', 'ac.max_points AS criterion_max_points'])
            ->join('public.award_criteria ac', 'ac.id = sacs.criterion_id')
            ->where('sacs.evaluation_id', $evaluation['id'])
            ->get()->getResultArray();

        foreach ($criterionScores as &$cs) {
            $cs['evidence_items'] = $db->table('public.student_award_score_evidence sase')
                ->select(['sase.*', 'spr.title AS record_title', 'spr.occurrence_date', 'pc.name AS category_name'])
                ->join('public.student_portfolio_records spr', 'spr.id = sase.portfolio_record_id')
                ->join('public.portfolio_categories pc', 'pc.id = spr.category_id')
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
     */
    public function createDeanNomination(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $isDean = in_array('dean', $actor['roles'], true);
        if (! $isDean) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Dean role required.']], 403);
        }

        $db = db_connect();
        $deanAssignment = $db->table('public.dean_assignments')
            ->where('personnel_profile_id', $actor['profile']['id'])
            ->where('is_active', true)
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

        // If cycle_id not supplied, use default active cycle
        if ($cycleId === '') {
            $activeCycle = $db->table('public.award_cycles')->where('is_active', true)->get()->getRowArray();
            $cycleId = $activeCycle['id'] ?? (string) service('uuid')->uuid4();
        }

        $nominationId = (string) service('uuid')->uuid4();
        $now = date('Y-m-d H:i:s');

        try {
            $db->table('public.dean_student_nominations')->insert([
                'id'                  => $nominationId,
                'cycle_id'            => $cycleId,
                'award_definition_id' => $awardId,
                'student_profile_id'  => $studentId,
                'dean_assignment_id'  => $deanAssignment['id'],
                'justification'       => $justification,
                'status'              => 'active',
                'nominated_at'        => $now,
            ]);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'NOMINATION_FAILED', 'message' => 'Failed to record nomination: ' . $e->getMessage()]], 500);
        }

        return $this->respondCreated([
            'data' => [
                'message'       => 'Dean nomination submitted successfully.',
                'nomination_id' => $nominationId,
            ],
        ]);
    }
}
