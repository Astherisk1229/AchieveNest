<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
use App\Services\EmploymentServiceDurationService;
use App\Services\PersonnelServiceHistoryService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use InvalidArgumentException;
use RuntimeException;

/** HR-maintained employment service history (data owner for length of service). HR staff only. */
class PersonnelServiceHistoryController extends Controller
{
    use ResponseTrait;


    public function __construct(
        private ?AuthorizationService $authz = null,
        private ?PersonnelServiceHistoryService $history = null,
        private ?EmploymentServiceDurationService $duration = null
    ) {
        $this->authz ??= new AuthorizationService();
        $this->history ??= new PersonnelServiceHistoryService();
        $this->duration ??= new EmploymentServiceDurationService(null, $this->history);
    }

    public function options(): mixed { return $this->respond(null, 204); }

    /** GET hr/personnel/{id}/service-history */
    public function show(string $personnelId): mixed
    {
        $actor = $this->actor();
        if (! $actor) return $this->unauthorized();
        if (! $this->isHr($actor)) return $this->forbidden();
        try {
            return $this->respond(['data' => $this->withQualifyingService($personnelId, $this->history->getHistory($personnelId))]);
        } catch (InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 404);
        }
    }

    /** POST hr/personnel/{id}/service-history — records the next HR-confirmed version. */
    public function save(string $personnelId): mixed
    {
        $actor = $this->actor();
        if (! $actor) return $this->unauthorized();
        if (! $this->isHr($actor)) return $this->forbidden();
        $json = (array) ($this->request->getJSON(true) ?? []);
        try {
            $data = $this->history->saveVersion($personnelId, (string) $actor['profile']['id'], $json);
            return $this->respondCreated(['data' => $this->withQualifyingService($personnelId, $data)]);
        } catch (InvalidArgumentException $e) {
            return $this->error($e->getMessage(), $e->getMessage() === 'PERSONNEL_NOT_FOUND' ? 404 : 422);
        } catch (RuntimeException $e) {
            $code = $e->getMessage() === 'SERVICE_HISTORY_VERSION_CONFLICT' ? 'SERVICE_HISTORY_VERSION_CONFLICT' : 'SERVICE_HISTORY_SAVE_FAILED';
            log_message('error', 'Service history save failed for {id}: {msg}', ['id' => $personnelId, 'msg' => $e->getPrevious()?->getMessage() ?? $e->getMessage()]);
            return $this->error($code, $code === 'SERVICE_HISTORY_VERSION_CONFLICT' ? 409 : 500);
        }
    }

    /** Adds the qualifying length of service as of today (display only; evaluations use the period end date). */
    private function withQualifyingService(string $personnelId, array $history): array
    {
        try {
            $history['qualifying_service'] = $this->duration->calculateQualifyingService($personnelId);
        } catch (\Throwable $e) {
            log_message('error', 'Qualifying service calculation failed for {id}: {msg}', ['id' => $personnelId, 'msg' => $e->getMessage()]);
            $history['qualifying_service'] = null;
        }
        return $history;
    }

    private function error(string $code, int $status): mixed
    {
        $message = PersonnelServiceHistoryService::messageFor($code);
        $index = PersonnelServiceHistoryService::segmentIndexFor($code);
        $field = $index === null ? null : 'segments.' . $index;
        return $this->respond(['error' => array_filter(['code' => $code, 'message' => $message, 'field' => $field], fn ($v) => $v !== null)], $status);
    }


    private function actor(): ?array { return $this->authz->resolveActor($this->request->getHeaderLine('Authorization')); }
    private function isHr(array $actor): bool { return $this->authz->hasRole($actor, 'hr_staff'); }
    private function unauthorized(): mixed { return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated active session required.']], 401); }
    private function forbidden(): mixed { return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Admin access required.']], 403); }
}
