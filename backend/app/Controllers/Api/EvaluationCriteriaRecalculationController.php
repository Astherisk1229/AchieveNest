<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Services\AuthenticatedActorService;
use App\Services\PersonnelEvaluationCriteriaRecalculationService;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

/** HR recovery endpoint for durable criteria recalculation failures. */
final class EvaluationCriteriaRecalculationController extends BaseController
{
    public function options(): ResponseInterface { return $this->response->setStatusCode(204); }

    public function retry(string $jobId): ResponseInterface
    {
        $actor = (new AuthenticatedActorService())->resolveActor($this->request->getHeaderLine('Authorization'));
        if ($actor === null) return $this->response->setStatusCode(401)->setJSON(['error'=>['code'=>'AUTH_TOKEN_INVALID','message'=>'Unable to verify the current session.']]);
        if (! array_intersect(['hr_admin','super_admin'], $actor['roles'] ?? [])) return $this->response->setStatusCode(403)->setJSON(['error'=>['code'=>'HR_ADMIN_REQUIRED','message'=>'Only an HR Administrator can retry criteria recalculation.']]);
        try {
            $result = (new PersonnelEvaluationCriteriaRecalculationService())->retry($jobId, (string)$actor['profile']['id']);
            return $this->response->setJSON(['data'=>$result]);
        } catch (Throwable $error) {
            $status = $error->getCode() >= 400 && $error->getCode() <= 599 ? $error->getCode() : 409;
            return $this->response->setStatusCode($status)->setJSON(['error'=>['code'=>'CRITERIA_RECALCULATION_RETRY_FAILED','message'=>$error->getMessage()]]);
        }
    }

    public function status(string $evaluationId): ResponseInterface
    {
        $actor = (new AuthenticatedActorService())->resolveActor($this->request->getHeaderLine('Authorization'));
        if ($actor === null) return $this->response->setStatusCode(401)->setJSON(['error'=>['code'=>'AUTH_TOKEN_INVALID','message'=>'Unable to verify the current session.']]);
        if (! array_intersect(['hr_admin','super_admin'], $actor['roles'] ?? [])) return $this->response->setStatusCode(403)->setJSON(['error'=>['code'=>'HR_ADMIN_REQUIRED','message'=>'Only an HR Administrator can inspect recalculation state.']]);
        $status = (new PersonnelEvaluationCriteriaRecalculationService())->statusForEvaluation($evaluationId);
        if ($status === null) return $this->response->setStatusCode(404)->setJSON(['error'=>['code'=>'CRITERIA_RECALCULATION_NOT_FOUND','message'=>'No criteria recalculation job exists for this evaluation.']]);
        return $this->response->setJSON(['data'=>$status]);
    }

    public function reconfirm(string $evaluationId): ResponseInterface
    {
        $actor = (new AuthenticatedActorService())->resolveActor($this->request->getHeaderLine('Authorization'));
        if ($actor === null) return $this->response->setStatusCode(401)->setJSON(['error'=>['code'=>'AUTH_TOKEN_INVALID','message'=>'Unable to verify the current session.']]);
        if (! array_intersect(['hr_staff','hr_admin','super_admin'], $actor['roles'] ?? [])) return $this->response->setStatusCode(403)->setJSON(['error'=>['code'=>'HR_AUTHORITY_REQUIRED','message'=>'Only authorized HR reviewers can act on HR-routed endorsements.']]);
        $body = $this->request->getJSON(true) ?? [];
        try {
            $result = (new PersonnelEvaluationCriteriaRecalculationService())->decideReconfirmation(
                $evaluationId, (string)$actor['profile']['id'], (string)($body['decision'] ?? ''), isset($body['reason']) ? (string)$body['reason'] : null
            );
            return $this->response->setJSON(['data'=>$result]);
        } catch (Throwable $error) {
            $status = $error->getCode() >= 400 && $error->getCode() <= 599 ? $error->getCode() : 409;
            return $this->response->setStatusCode($status)->setJSON(['error'=>['code'=>'CRITERIA_RECONFIRMATION_FAILED','message'=>$error->getMessage()]]);
        }
    }
}
