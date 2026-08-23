<?php

namespace App\Controllers\Api;

use App\Services\HREvaluationService;
use App\Services\SupabaseAuthService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class HREvaluationController extends Controller
{
    use ResponseTrait;

    public function options()
    {
        return $this->respond(null, 204);
    }

    protected function resolveActor(): ?array
    {
        $authorization = $this->request->getHeaderLine('Authorization');
        if ($authorization === '' || ! preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches)) {
            return null;
        }

        $token = trim($matches[1]);

        try {
            $claims = (new SupabaseAuthService())->verifyAccessToken($token);
        } catch (Throwable) {
            return null;
        }

        $authUserId = (string) ($claims->sub ?? '');
        if ($authUserId === '') {
            return null;
        }

        $db = db_connect();
        $profile = $db->table('public.profiles')
            ->where('id', $authUserId)
            ->get()
            ->getRowArray();

        if ($profile === null || ($profile['status'] ?? '') !== 'active') {
            return null;
        }

        $roles = $db->query(
            'SELECT r.role_key
             FROM public.profile_roles pr
             JOIN public.roles r ON r.id = pr.role_id
             WHERE pr.profile_id = ? AND pr.is_active = true',
            [$authUserId]
        )->getResultArray();

        return [
            'profile' => $profile,
            'roles'   => array_column($roles, 'role_key'),
        ];
    }

    protected function enforceHRAdminActor(): ?array
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return null;
        }

        $accountType = (string) ($actor['profile']['account_type'] ?? '');
        $hasHRRole = in_array('hr_staff', $actor['roles'], true);

        if ($accountType !== 'hr_admin' || ! $hasHRRole) {
            return null;
        }

        return $actor;
    }

    /**
     * GET /api/v1/hr/evaluations
     */
    public function list()
    {
        $actor = $this->enforceHRAdminActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Admin authority required.']], 403);
        }

        $db = db_connect();
        $status = $this->request->getGet('status');
        $college = $this->request->getGet('college');
        $search = trim((string) $this->request->getGet('search'));

        $builder = $db->table('public.personnel_evaluations pe')
            ->select('pe.*, p.full_name AS faculty_name, p.institutional_id, p.employee_id, p.institutional_email AS email, p.college_id, p.department_id, p.academic_rank, c.name AS college_name, d.name AS department_name')
            ->join('public.profiles p', 'p.id = pe.personnel_profile_id')
            ->join('public.colleges c', 'c.id = p.college_id', 'left')
            ->join('public.departments d', 'd.id = p.department_id', 'left')
            ->orderBy('pe.submitted_at', 'DESC');

        if ($status && $status !== 'ALL') {
            $builder->where('pe.status', $status);
        }

        $results = $builder->get()->getResultArray();

        return $this->respond([
            'data' => [
                'evaluations' => $results,
                'counts'      => [
                    'submitted'               => count(array_filter($results, fn($r) => $r['status'] === 'submitted')),
                    'in_evaluation'           => count(array_filter($results, fn($r) => $r['status'] === 'in_evaluation')),
                    'ready_for_finalization'  => count(array_filter($results, fn($r) => $r['status'] === 'ready_for_finalization')),
                    'returned_for_revision'   => count(array_filter($results, fn($r) => $r['status'] === 'returned_for_revision')),
                    'completed'               => count(array_filter($results, fn($r) => $r['status'] === 'completed')),
                ]
            ]
        ], 200);
    }

    /**
     * GET /api/v1/hr/evaluations/{id}
     */
    public function get(string $id)
    {
        $actor = $this->enforceHRAdminActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Admin authority required.']], 403);
        }

        $db = db_connect();
        $evaluation = $db->table('public.personnel_evaluations pe')
            ->select('pe.*, p.full_name AS faculty_name, p.institutional_id, p.employee_id, p.institutional_email AS email, p.academic_rank, c.name AS college, d.name AS department')
            ->join('public.profiles p', 'p.id = pe.personnel_profile_id')
            ->join('public.colleges c', 'c.id = p.college_id', 'left')
            ->join('public.departments d', 'd.id = p.department_id', 'left')
            ->where('pe.id', $id)
            ->get()
            ->getRowArray();

        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation not found.']], 404);
        }

        $items = $db->table('public.personnel_evaluation_items')
            ->where('evaluation_id', $id)
            ->orderBy('category_area', 'ASC')
            ->orderBy('criterion_code', 'ASC')
            ->get()
            ->getResultArray();

        $scores = HREvaluationService::recalculateTotals($items, (int) $evaluation['tenure_years']);

        return $this->respond([
            'data' => [
                'evaluation' => $evaluation,
                'items'      => $items,
                'scores'     => $scores,
            ]
        ], 200);
    }

    /**
     * POST /api/v1/hr/evaluations/{id}/start
     */
    public function start(string $id)
    {
        $actor = $this->enforceHRAdminActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Admin authority required.']], 403);
        }

        $db = db_connect();
        $evaluation = $db->table('public.personnel_evaluations')->where('id', $id)->get()->getRowArray();
        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation not found.']], 404);
        }

        $db->table('public.personnel_evaluations')->where('id', $id)->update([
            'status'                => 'in_evaluation',
            'evaluator_profile_id'  => $actor['profile']['id'],
            'evaluation_started_at' => date('Y-m-d H:i:s'),
            'updated_at'            => date('Y-m-d H:i:s'),
        ]);

        $db->table('public.personnel_evaluation_events')->insert([
            'evaluation_id' => $id,
            'event_type'    => 'evaluation_started',
            'performed_by'  => $actor['profile']['id'],
            'payload'       => json_encode(['evaluator' => $actor['profile']['full_name']]),
        ]);

        return $this->respond(['data' => ['message' => 'Evaluation started.']], 200);
    }

    /**
     * PATCH /api/v1/hr/evaluations/{id}/items/{itemId}/verify
     */
    public function verifyItem(string $id, string $itemId)
    {
        $actor = $this->enforceHRAdminActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Admin authority required.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $status = trim((string) ($json['verification_status'] ?? 'verified'));
        $remarks = trim((string) ($json['evaluator_remarks'] ?? ''));

        if (! in_array($status, ['verified', 'ineligible', 'needs_revision', 'pending'], true)) {
            return $this->respond(['error' => ['code' => 'INVALID_STATUS', 'message' => 'Invalid verification status.']], 422);
        }

        $db = db_connect();
        $db->table('public.personnel_evaluation_items')->where('id', $itemId)->where('evaluation_id', $id)->update([
            'verification_status' => $status,
            'rating_status'       => $status === 'ineligible' ? 'not_applicable' : 'unrated',
            'awarded_points'      => $status === 'ineligible' ? 0.0 : 0.0,
            'evaluator_remarks'   => $remarks,
            'evaluated_by'        => $actor['profile']['id'],
            'evaluated_at'        => date('Y-m-d H:i:s'),
            'updated_at'          => date('Y-m-d H:i:s'),
        ]);

        return $this->respond(['data' => ['message' => 'Evidence verification recorded.']], 200);
    }

    /**
     * PATCH /api/v1/hr/evaluations/{id}/items/{itemId}/rate
     */
    public function rateItem(string $id, string $itemId)
    {
        $actor = $this->enforceHRAdminActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Admin authority required.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $payload = (array) ($json['scoring_payload'] ?? []);
        $remarks = trim((string) ($json['evaluator_remarks'] ?? ''));

        $db = db_connect();
        $item = $db->table('public.personnel_evaluation_items')->where('id', $itemId)->where('evaluation_id', $id)->get()->getRowArray();
        if ($item === null) {
            return $this->respond(['error' => ['code' => 'ITEM_NOT_FOUND', 'message' => 'Evaluation item not found.']], 404);
        }

        // Bounded manual justification enforcement (>= 10 chars)
        if ($item['scoring_mode'] === 'MANUAL_BOUNDED') {
            $justification = trim((string) ($payload['justification'] ?? ''));
            if (strlen($justification) < 10) {
                return $this->respond(['error' => ['code' => 'JUSTIFICATION_REQUIRED', 'message' => 'Evaluator justification (minimum 10 characters) is required for manual bounded scoring.']], 422);
            }
        }

        $awardedPoints = HREvaluationService::evaluateItemScore($item['criterion_code'], $item['scoring_mode'], $payload);

        $db->table('public.personnel_evaluation_items')->where('id', $itemId)->update([
            'verification_status' => 'verified',
            'rating_status'       => 'rated',
            'awarded_points'      => $awardedPoints,
            'scoring_payload'     => json_encode($payload),
            'evaluator_remarks'   => $remarks,
            'evaluated_by'        => $actor['profile']['id'],
            'evaluated_at'        => date('Y-m-d H:i:s'),
            'updated_at'          => date('Y-m-d H:i:s'),
        ]);

        // Recalculate Evaluation Totals
        $evaluation = $db->table('public.personnel_evaluations')->where('id', $id)->get()->getRowArray();
        $allItems = $db->table('public.personnel_evaluation_items')->where('evaluation_id', $id)->get()->getResultArray();
        $totals = HREvaluationService::recalculateTotals($allItems, (int) ($evaluation['tenure_years'] ?? 0));

        $db->table('public.personnel_evaluations')->where('id', $id)->update([
            'total_score'  => $totals['total_score'],
            'area_a_score' => $totals['areaA_score'],
            'area_b_score' => $totals['areaB_score'],
            'area_c_score' => $totals['areaC_score'],
            'updated_at'   => date('Y-m-d H:i:s'),
        ]);

        return $this->respond([
            'data' => [
                'awarded_points' => $awardedPoints,
                'scores'         => $totals,
            ]
        ], 200);
    }

    /**
     * POST /api/v1/hr/evaluations/{id}/return
     */
    public function returnEvaluation(string $id)
    {
        $actor = $this->enforceHRAdminActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Admin authority required.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $reason = trim((string) ($json['reason'] ?? ''));
        if ($reason === '') {
            return $this->respond(['error' => ['code' => 'REASON_REQUIRED', 'message' => 'Return reason is required.']], 422);
        }

        $db = db_connect();
        $db->table('public.personnel_evaluations')->where('id', $id)->update([
            'status'        => 'returned_for_revision',
            'return_reason' => $reason,
            'returned_at'   => date('Y-m-d H:i:s'),
            'updated_at'    => date('Y-m-d H:i:s'),
        ]);

        $db->table('public.personnel_evaluation_events')->insert([
            'evaluation_id' => $id,
            'event_type'    => 'returned_for_revision',
            'performed_by'  => $actor['profile']['id'],
            'payload'       => json_encode(['reason' => $reason]),
        ]);

        return $this->respond(['data' => ['message' => 'Evaluation returned for revision.']], 200);
    }

    /**
     * POST /api/v1/hr/evaluations/{id}/finalize
     */
    public function finalizeEvaluation(string $id)
    {
        $actor = $this->enforceHRAdminActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Admin authority required.']], 403);
        }

        $db = db_connect();
        $evaluation = $db->table('public.personnel_evaluations')->where('id', $id)->get()->getRowArray();
        if ($evaluation === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Evaluation not found.']], 404);
        }

        $items = $db->table('public.personnel_evaluation_items')->where('evaluation_id', $id)->get()->getResultArray();

        // Ensure all evidence items have been verified and all valid items have been rated
        $unresolvedItems = array_filter($items, function ($item) {
            return $item['verification_status'] === 'pending' || ($item['verification_status'] === 'verified' && $item['rating_status'] !== 'rated');
        });

        if (count($unresolvedItems) > 0) {
            return $this->respond(['error' => ['code' => 'INCOMPLETE_EVALUATION', 'message' => sprintf('Cannot finalize: %d evidence items are still unrated or pending verification.', count($unresolvedItems))]], 422);
        }

        $totals = HREvaluationService::recalculateTotals($items, (int) ($evaluation['tenure_years'] ?? 0));

        $snapshot = [
            'rating_rule_version' => 'NDMU-RANKING-2026-V1',
            'final_scores'        => $totals,
            'finalized_by'        => $actor['profile']['id'],
            'evaluator_name'      => $actor['profile']['full_name'],
            'finalized_at'        => date('Y-m-d H:i:s'),
        ];

        $db->table('public.personnel_evaluations')->where('id', $id)->update([
            'status'         => 'completed',
            'total_score'    => $totals['total_score'],
            'area_a_score'   => $totals['areaA_score'],
            'area_b_score'   => $totals['areaB_score'],
            'area_c_score'   => $totals['areaC_score'],
            'final_snapshot' => json_encode($snapshot),
            'finalized_at'   => date('Y-m-d H:i:s'),
            'updated_at'     => date('Y-m-d H:i:s'),
        ]);

        $db->table('public.personnel_evaluation_events')->insert([
            'evaluation_id' => $id,
            'event_type'    => 'finalized',
            'performed_by'  => $actor['profile']['id'],
            'payload'       => json_encode($snapshot),
        ]);

        return $this->respond([
            'data' => [
                'message'        => 'Personnel Ranking Evaluation successfully finalized.',
                'final_snapshot' => $snapshot,
            ]
        ], 200);
    }
}
