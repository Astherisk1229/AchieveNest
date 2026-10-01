<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
use App\Services\PersonnelServiceHistoryService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use InvalidArgumentException;
use RuntimeException;

/** HR-maintained employment service history (data owner for length of service). HR staff only. */
class PersonnelServiceHistoryController extends Controller
{
    use ResponseTrait;

    private const MESSAGES = [
        'PERSONNEL_NOT_FOUND' => 'Personnel record was not found.',
        'CHANGE_REASON_REQUIRED' => 'Enter the reason for this service-history change.',
        'CHANGE_REASON_TOO_LONG' => 'The reason must not exceed 1,000 characters.',
        'EXPECTED_VERSION_NUMBER_REQUIRED' => 'expected_version_number is required (0 when no history exists yet).',
        'SEGMENTS_REQUIRED' => 'Add at least one employment period.',
        'TOO_MANY_SEGMENTS' => 'Too many employment periods in one save.',
        'ONLY_ONE_ONGOING_SEGMENT_ALLOWED' => 'Only one employment period can be ongoing.',
        'ONGOING_SEGMENT_MUST_BE_LATEST' => 'The ongoing employment period must be the most recent one.',
        'SEGMENTS_OVERLAP' => 'Employment periods must not overlap.',
        'SERVICE_HISTORY_VERSION_CONFLICT' => 'Someone else saved this service history first. Reload and try again.',
        'SERVICE_HISTORY_SAVE_FAILED' => 'Service history could not be saved.',
    ];

    public function __construct(
        private ?AuthorizationService $authz = null,
        private ?PersonnelServiceHistoryService $history = null
    ) {
        $this->authz ??= new AuthorizationService();
        $this->history ??= new PersonnelServiceHistoryService();
    }

    public function options(): mixed { return $this->respond(null, 204); }

    /** GET hr/personnel/{id}/service-history */
    public function show(string $personnelId): mixed
    {
        $actor = $this->actor();
        if (! $actor) return $this->unauthorized();
        if (! $this->isHr($actor)) return $this->forbidden();
        try {
            return $this->respond(['data' => $this->history->getHistory($personnelId)]);
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
            return $this->respondCreated(['data' => $data]);
        } catch (InvalidArgumentException $e) {
            return $this->error($e->getMessage(), $e->getMessage() === 'PERSONNEL_NOT_FOUND' ? 404 : 422);
        } catch (RuntimeException $e) {
            $code = $e->getMessage() === 'SERVICE_HISTORY_VERSION_CONFLICT' ? 'SERVICE_HISTORY_VERSION_CONFLICT' : 'SERVICE_HISTORY_SAVE_FAILED';
            log_message('error', 'Service history save failed for {id}: {msg}', ['id' => $personnelId, 'msg' => $e->getPrevious()?->getMessage() ?? $e->getMessage()]);
            return $this->error($code, $code === 'SERVICE_HISTORY_VERSION_CONFLICT' ? 409 : 500);
        }
    }

    private function error(string $code, int $status): mixed
    {
        $message = self::MESSAGES[$code] ?? $this->segmentMessage($code);
        $field = preg_match('/^SEGMENT_(\d+)_/', $code, $m) ? 'segments.' . ((int) $m[1] - 1) : null;
        return $this->respond(['error' => array_filter(['code' => $code, 'message' => $message, 'field' => $field], fn ($v) => $v !== null)], $status);
    }

    private function segmentMessage(string $code): string
    {
        if (! preg_match('/^SEGMENT_(\d+)_(.+)$/', $code, $m)) return 'Service history request is invalid.';
        $problem = [
            'INVALID' => 'is invalid',
            'INVALID_START_DATE' => 'needs a valid start date',
            'START_IN_FUTURE' => 'starts in the future',
            'ONGOING_WITH_END_DATE' => 'is marked ongoing but has an end date',
            'END_DATE_REQUIRED' => 'needs an end date or must be marked ongoing',
            'INVALID_END_DATE' => 'needs a valid end date',
            'END_BEFORE_START' => 'ends before it starts',
            'END_IN_FUTURE' => 'ends in the future; mark it ongoing instead',
            'INVALID_CLASSIFICATION' => 'must be Full-time or Part-time',
            'INVALID_COUNTABILITY' => 'has an invalid countability value',
            'PART_TIME_NOT_COUNTABLE' => 'is part-time and cannot count toward length of service',
            'EXCLUSION_REASON_REQUIRED' => 'is full-time but excluded; enter the HR reason',
        ][$m[2]] ?? 'is invalid';
        return "Employment period {$m[1]} {$problem}.";
    }

    private function actor(): ?array { return $this->authz->resolveActor($this->request->getHeaderLine('Authorization')); }
    private function isHr(array $actor): bool { return $this->authz->hasRole($actor, 'hr_staff'); }
    private function unauthorized(): mixed { return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated active session required.']], 401); }
    private function forbidden(): mixed { return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'HR Admin access required.']], 403); }
}
