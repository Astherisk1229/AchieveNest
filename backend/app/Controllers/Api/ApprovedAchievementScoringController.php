<?php

namespace App\Controllers\Api;

use App\Services\ApprovedAchievementScoringService;
use App\Services\AuthorizationService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

/**
 * OSAD-only access to automatic criterion contributions (Step 6).
 * Guarded by AwardPolicy::canRunAwardEvaluation; no student, coordinator or dean endpoint exposes them.
 */
class ApprovedAchievementScoringController extends Controller
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

    /** POST /api/v1/osad/scoring/records/{id}/rescore — idempotent retry. */
    public function rescore(string $recordId): mixed
    {
        $actor = $this->guard();
        if (! is_array($actor)) {
            return $actor;
        }
        $db = db_connect();
        $record = $db->table('student_portfolio_records')->select('id, status')->where('id', $recordId)->get()->getRowArray();
        if ($record === null) {
            return $this->respond(['error' => ['code' => 'RECORD_NOT_FOUND', 'message' => 'Portfolio record not found.']], 404);
        }
        $service = new ApprovedAchievementScoringService($db);
        $actorId = (string) $actor['profile']['id'];

        if ($record['status'] !== 'verified') {
            // A record that left 'verified' keeps no active contributions.
            $superseded = $service->supersedeRecordContributions($recordId, $actorId);
            return $this->respond(['data' => ['record_id' => $recordId, 'scoring_status' => 'NOT_VERIFIED', 'superseded' => $superseded]], 200);
        }

        try {
            $counts = $service->scoreApprovedRecord($recordId, $actorId, 'rescore');
            return $this->respond(['data' => ['record_id' => $recordId, 'scoring_status' => 'SCORED'] + $counts], 200);
        } catch (Throwable $e) {
            $code = ApprovedAchievementScoringService::errorCode($e);
            log_message('error', '[ApprovedAchievementScoringController::rescore] record {id}: {code} {message}', ['id' => $recordId, 'code' => $code, 'message' => $e->getMessage()]);
            try {
                $service->audit($recordId, $actorId, 'scoring_failed', 'error_code=' . $code);
            } catch (Throwable) {
            }
            return $this->respond(['error' => ['code' => $code, 'message' => 'Scoring could not be completed; the record stays verified.']], 503);
        }
    }

    /** GET /api/v1/osad/scoring/unscored — verified records with no contribution row (needs rescore). */
    public function unscored(): mixed
    {
        $actor = $this->guard();
        if (! is_array($actor)) {
            return $actor;
        }
        $db = db_connect();
        $ids = (new ApprovedAchievementScoringService($db))->verifiedRecordsLackingContributions();
        $rows = [];
        if ($ids !== []) {
            $rows = $db->table('student_portfolio_records spr')
                ->select('spr.id, spr.title, spr.verified_at, p.full_name AS student_name, p.institutional_id AS student_id_number')
                ->join('profiles p', 'p.id = spr.student_profile_id')
                ->whereIn('spr.id', array_slice($ids, 0, 200))
                ->orderBy('spr.verified_at', 'DESC')
                ->get()->getResultArray();
        }

        return $this->respond(['data' => ['records' => $rows, 'total' => count($ids)]], 200);
    }

    /** GET /api/v1/osad/scoring/records/{id}/contributions */
    public function contributions(string $recordId): mixed
    {
        $actor = $this->guard();
        if (! is_array($actor)) {
            return $actor;
        }
        $rows = db_connect()->table(ApprovedAchievementScoringService::TABLE . ' c')
            ->select('c.*, ad.code AS award_code, ac.code AS criterion_code')
            ->join('award_definitions ad', 'ad.id = c.award_definition_id')
            ->join('award_criteria ac', 'ac.id = c.criterion_id')
            ->where('c.portfolio_record_id', $recordId)
            ->orderBy('c.status', 'ASC')->orderBy('ad.code', 'ASC')->orderBy('ac.sort_order', 'ASC')
            ->get()->getResultArray();
        foreach ($rows as &$row) {
            $row['basis_snapshot'] = $row['basis_snapshot'] !== null ? json_decode((string) $row['basis_snapshot'], true) : null;
        }
        unset($row);

        return $this->respond(['data' => ['record_id' => $recordId, 'contributions' => $rows, 'total' => count($rows)]], 200);
    }

    /** @return array|mixed the actor, or an error response */
    private function guard(): mixed
    {
        $actor = $this->authz->resolveActor($this->request->getHeaderLine('Authorization'));
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }
        if (! $this->authz->award()->canRunAwardEvaluation($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Active OSAD administrator authorization required.']], 403);
        }

        return $actor;
    }
}
