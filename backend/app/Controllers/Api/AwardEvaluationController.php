<?php

namespace App\Controllers\Api;

use App\Helpers\ValidationHelper;
use App\Services\AuthorizationService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class AwardEvaluationController extends Controller
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
            ->orderBy('name', 'ASC')
            ->get()->getResultArray();

        foreach ($awards as &$award) {
            $award['criteria'] = $db->table('award_criteria')
                ->where('award_definition_id', $award['id'])
                ->orderBy('sort_order', 'ASC')
                ->get()->getResultArray();
        }
        unset($award);

        return $this->respond(['data' => ['awards' => $awards]], 200);
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

        if (! $this->authz->award()->canRunAwardEvaluation($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Active OSAD administrator authorization required.']], 403);
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

        $db = db_connect();
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
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        if (! $this->authz->award()->canViewAwardEvaluation($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Access denied to award candidates.']], 403);
        }

        $db = db_connect();
        $evaluations = $db->table('student_award_evaluations sae')
            ->select([
                'sae.*',
                'p.full_name AS student_name',
                'p.institutional_id AS student_id_number',
                'p.email AS student_email',
                'ap.code AS program_code',
                'ap.name AS program_name',
                'c.code AS college_code',
            ])
            ->join('profiles p', 'p.id = sae.student_profile_id')
            ->join('student_program_enrollments spe', 'spe.student_profile_id = p.id AND spe.is_active = 1', 'left')
            ->join('academic_programs ap', 'ap.id = spe.academic_program_id', 'left')
            ->join('colleges c', 'c.id = ap.college_id', 'left')
            ->where('sae.award_definition_id', $awardId)
            ->orderBy('sae.potential_score', 'DESC')
            ->get()->getResultArray();

        // Also fetch Dean nominations for this award
        $nominations = $db->table('dean_student_nominations dsn')
            ->select([
                'dsn.*',
                'p.full_name AS student_name',
                'p.institutional_id AS student_id_number',
                'p.email AS student_email',
                'dean_p.full_name AS nominator_name',
            ])
            ->join('profiles p', 'p.id = dsn.student_profile_id')
            ->join('dean_assignments da', 'da.id = dsn.dean_assignment_id')
            ->join('profiles dean_p', 'dean_p.id = da.personnel_profile_id')
            ->where('dsn.award_definition_id', $awardId)
            ->where('dsn.status', 'active')
            ->get()->getResultArray();

        return $this->respond([
            'data' => [
                'evaluations'      => $evaluations,
                'dean_nominations' => $nominations,
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
        $evaluation = $db->table('student_award_evaluations sae')
            ->select(['sae.*', 'ad.name AS award_name', 'ad.code AS award_code', 'p.full_name AS student_name', 'p.institutional_id AS student_id_number'])
            ->join('award_definitions ad', 'ad.id = sae.award_definition_id')
            ->join('profiles p', 'p.id = sae.student_profile_id')
            ->where('sae.award_definition_id', $awardId)
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

        // If cycle_id not supplied, use default active cycle
        if ($cycleId === '') {
            $activeCycle = $db->table('award_cycles')->where('is_active', 1)->get()->getRowArray();
            $cycleId = $activeCycle['id'] ?? $this->genUuid();
        }

        $nominationId = $this->genUuid();
        $now = date('Y-m-d H:i:s');

        try {
            $db->table('dean_student_nominations')->insert([
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
