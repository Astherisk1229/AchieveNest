<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

class PersonnelEvaluationPeriodService
{
    public const TYPES = ['RANKING_PROMOTION', 'TENURE_EVALUATION', 'PERSONNEL_ACCREDITATION_REVIEW'];
    public const SEMESTERS = ['1ST_SEMESTER', '2ND_SEMESTER', 'FULL_ACADEMIC_YEAR', 'CUSTOM_COVERAGE'];
    private const TRANSITIONS = [
        'open-submissions' => ['from' => 'DRAFT', 'to' => 'OPEN_FOR_SUBMISSION'],
        'close-submissions' => ['from' => 'OPEN_FOR_SUBMISSION', 'to' => 'SUBMISSION_CLOSED'],
        'start-evaluation' => ['from' => 'SUBMISSION_CLOSED', 'to' => 'EVALUATION_ONGOING'],
        'close' => ['from' => 'EVALUATION_ONGOING', 'to' => 'CLOSED'],
        'archive' => ['from' => 'CLOSED', 'to' => 'ARCHIVED'],
    ];
    private const WRITABLE = ['ranking_cycle_id','period_name','evaluation_type','personnel_group','academic_year','semester','coverage_label','submission_open_at','submission_close_at','evaluation_start_at','evaluation_end_at','evaluation_scale_version_id','expected_version','reason'];

    public function __construct(private ?BaseConnection $db = null) { $this->db ??= db_connect(); }

    public function list(array $filters = []): array
    {
        $builder = $this->db->table('personnel_evaluation_periods p')
            ->select('p.*, sv.version_number AS scale_version_number, sv.status AS scale_version_status, sv.evaluation_cycle_id AS scale_cycle_id, s.title AS scale_title')
            ->join('evaluation_scale_versions sv', 'sv.id = p.evaluation_scale_version_id', 'left')
            ->join('evaluation_scales s', 's.id = sv.scale_id', 'left');
        foreach (['ranking_cycle_id', 'evaluation_type', 'personnel_group', 'academic_year', 'status'] as $field) if (! empty($filters[$field])) $builder->where("p.{$field}", $filters[$field]);
        return array_map(fn (array $row): array => $this->dto($row), $builder->orderBy('p.created_at', 'DESC')->get()->getResultArray());
    }

    public function find(string $id): ?array
    {
        $row = $this->db->table('personnel_evaluation_periods p')
            ->select('p.*, sv.version_number AS scale_version_number, sv.status AS scale_version_status, sv.evaluation_cycle_id AS scale_cycle_id, s.title AS scale_title')
            ->join('evaluation_scale_versions sv', 'sv.id = p.evaluation_scale_version_id', 'left')
            ->join('evaluation_scales s', 's.id = sv.scale_id', 'left')->where('p.id', $id)->get()->getRowArray();
        return $row ? $this->dto($row) : null;
    }

    public function current(string $evaluationType = 'RANKING_PROMOTION', string $personnelGroup = 'FACULTY'): ?array
    {
        if (! in_array($evaluationType, self::TYPES, true)) throw new InvalidArgumentException('UNKNOWN_EVALUATION_TYPE: Unsupported personnel evaluation type.');
        if (! in_array($personnelGroup, ['FACULTY', 'NON_TEACHING_FACULTY'], true)) throw new InvalidArgumentException('INVALID_PERSONNEL_GROUP: Select Faculty or Non-Teaching Faculty.');
        $rows = $this->list(['evaluation_type' => $evaluationType, 'personnel_group' => $personnelGroup, 'status' => 'OPEN_FOR_SUBMISSION']);
        if (count($rows) > 1) throw new RuntimeException('PERIOD_CONFIGURATION_CONFLICT: More than one submission period is open for this personnel group.');
        return $rows[0] ?? null;
    }

    public function resolveForSubmission(string $id, string $evaluationType = 'RANKING_PROMOTION'): array
    {
        $period = $this->find($id);
        if (! $period) throw new InvalidArgumentException('EVALUATION_PERIOD_NOT_FOUND: The selected personnel evaluation period does not exist.');
        if ($period['evaluation_type'] !== $evaluationType) throw new InvalidArgumentException('EVALUATION_PERIOD_TYPE_MISMATCH: This portfolio is not valid for the selected evaluation type.');
        if ($period['status'] !== 'OPEN_FOR_SUBMISSION') throw new InvalidArgumentException('EVALUATION_PERIOD_NOT_OPEN: This evaluation period is not open for Faculty submissions.');
        $now = time();
        if ($now < strtotime($period['submission_open_at'])) throw new InvalidArgumentException('SUBMISSION_WINDOW_NOT_OPEN: The Faculty submission window has not opened yet.');
        if ($now > strtotime($period['submission_close_at'])) throw new InvalidArgumentException('SUBMISSION_WINDOW_CLOSED: The Faculty submission deadline has passed.');
        return $period;
    }

    public function create(array $input, string $actorId, ?string $requestId = null): array
    {
        $this->rejectProtectedFields($input);
        $data = $this->validateDraft($input);
        $requestId = $this->requestId($requestId);
        $hash = hash('sha256', json_encode($data, JSON_UNESCAPED_UNICODE));
        if ($existing = $this->idempotentResource($actorId, 'create', $requestId, $hash)) return $this->find($existing);
        $duplicate = $this->canonicalDuplicate($data);
        if ($duplicate) throw new RuntimeException('TRACK_DUPLICATE: This ranking cycle already has a track for this personnel group.');

        $now = date('Y-m-d H:i:s');
        $data += ['id'=>$this->uuid(),'period_code'=>$this->periodCode($data),'status'=>'DRAFT','version'=>1,'created_by'=>$actorId,'created_at'=>$now,'updated_at'=>$now];
        $this->db->transBegin();
        try {
            $this->reserveRequest($actorId, 'create', $requestId, $hash, $data['id']);
            $this->db->table('personnel_evaluation_periods')->insert($data);
            $this->event($data['id'], 'period_created', $actorId, null, $data, $requestId);
            $this->db->transCommit();
        } catch (Throwable $e) {
            $this->db->transRollback();
            if ((int) $e->getCode() === 1062) throw new RuntimeException('TRACK_DUPLICATE: This ranking cycle already has a track for this personnel group.');
            throw $e;
        }
        return $this->find($data['id']);
    }

    public function update(string $id, array $input, string $actorId, ?string $requestId = null): array
    {
        $this->rejectProtectedFields($input);
        $existing = $this->find($id);
        if (! $existing) throw new InvalidArgumentException('EVALUATION_PERIOD_NOT_FOUND: Evaluation period not found.');
        if (! in_array($existing['status'], ['DRAFT', 'OPEN_FOR_SUBMISSION'], true)) throw new RuntimeException('PERIOD_EDIT_LOCKED: Closed and historical periods are read-only.');
        $expected = filter_var($input['expected_version'] ?? null, FILTER_VALIDATE_INT);
        if ($expected === false || $expected === null || (int) $expected !== (int) $existing['version']) throw new RuntimeException('PERIOD_MODIFIED: This evaluation period was updated by another administrator. Refresh before saving.');

        $submissionCount = $this->submissionCount($id);
        foreach (['ranking_cycle_id','evaluation_type','personnel_group','academic_year','semester','coverage_label','evaluation_scale_version_id'] as $field) {
            if ($submissionCount > 0 && array_key_exists($field, $input) && ($input[$field] ?? null) !== ($existing[$field] ?? null)) throw new RuntimeException("PERIOD_FIELD_LOCKED: {$field} cannot change after submissions exist.");
        }
        $sensitive = array_filter(['submission_open_at','submission_close_at','evaluation_start_at','evaluation_end_at'], fn (string $field): bool => array_key_exists($field, $input) && $this->mysqlDate($input[$field]) !== ($existing[$field] ?? null));
        $reason = $this->cleanText($input['reason'] ?? '', 500, 'reason', true);
        if ($existing['status'] !== 'DRAFT' && $sensitive && mb_strlen($reason) < 10) throw new InvalidArgumentException('CHANGE_REASON_REQUIRED: Explain this schedule change in 10–500 characters.');

        $data = $this->validateDraft(array_merge($existing, array_intersect_key($input, array_flip(self::WRITABLE))));
        if ($duplicate = $this->canonicalDuplicate($data, $id)) throw new RuntimeException('TRACK_DUPLICATE: This ranking cycle already has a track for this personnel group.');
        $data['updated_by'] = $actorId; $data['updated_at'] = date('Y-m-d H:i:s'); $data['version'] = (int) $existing['version'] + 1;
        $requestId = $this->requestId($requestId);
        $this->db->transBegin();
        try {
            $updated = $this->db->table('personnel_evaluation_periods')->where('id', $id)->where('version', $expected)->update($data);
            if (! $updated || $this->db->affectedRows() !== 1) throw new RuntimeException('PERIOD_MODIFIED: This evaluation period changed before your save completed.');
            $this->event($id, 'period_updated', $actorId, $existing, $data + ['reason'=>$reason], $requestId);
            $this->db->transCommit();
        } catch (Throwable $e) { $this->db->transRollback(); throw $e; }
        return $this->find($id);
    }

    public function transition(string $id, string $action, string $actorId, ?string $requestId = null, ?int $expectedVersion = null): array
    {
        if (! isset(self::TRANSITIONS[$action])) throw new InvalidArgumentException('INVALID_PERIOD_ACTION: Unsupported lifecycle action.');
        $requestId = $this->requestId($requestId);
        $this->db->transBegin();
        try {
            $row = $this->db->query('SELECT * FROM personnel_evaluation_periods WHERE id = ? FOR UPDATE', [$id])->getRowArray();
            if (! $row) throw new InvalidArgumentException('EVALUATION_PERIOD_NOT_FOUND: Evaluation period not found.');
            $rule = self::TRANSITIONS[$action];
            if ($row['status'] === $rule['to']) { $this->db->transCommit(); return $this->find($id); }
            if ($expectedVersion !== null && $expectedVersion !== (int) $row['version']) throw new RuntimeException('PERIOD_MODIFIED: This evaluation period was updated by another administrator.');
            if ($row['status'] !== $rule['from']) throw new RuntimeException('INVALID_STATUS_TRANSITION: The requested lifecycle transition is not allowed.');
            if ($action === 'open-submissions') $this->validateOperational($row, $id);
            if ($action === 'start-evaluation' && time() < strtotime($row['evaluation_start_at'])) throw new RuntimeException('EVALUATION_WINDOW_NOT_OPEN: Evaluation cannot start before its scheduled time.');
            if ($action === 'open-submissions' && time() > strtotime($row['submission_close_at'])) throw new RuntimeException('SUBMISSION_WINDOW_EXPIRED: An expired submission window cannot be opened.');

            $updates = ['status'=>$rule['to'],'version'=>(int)$row['version']+1,'updated_by'=>$actorId,'updated_at'=>date('Y-m-d H:i:s')];
            if ($action === 'close') $updates += ['closed_by'=>$actorId,'closed_at'=>date('Y-m-d H:i:s')];
            if ($action === 'archive') $updates['archived_at'] = date('Y-m-d H:i:s');
            $this->db->table('personnel_evaluation_periods')->where('id', $id)->update($updates);
            $this->event($id, str_replace('-', '_', $action), $actorId, ['status'=>$row['status']], ['status'=>$rule['to']], $requestId);
            if ($action === 'open-submissions') $this->notifyPeriodOpened($row, $actorId, $requestId);
            $this->db->transCommit();
            return $this->find($id);
        } catch (Throwable $e) { $this->db->transRollback(); throw $e; }
    }

    private function validateDraft(array $input): array
    {
        $type = trim((string) ($input['evaluation_type'] ?? ''));
        $personnelGroup = trim((string) ($input['personnel_group'] ?? 'FACULTY'));
        $year = trim((string) ($input['academic_year'] ?? ''));
        if (! in_array($type, self::TYPES, true)) throw new InvalidArgumentException('UNKNOWN_EVALUATION_TYPE: Select a supported personnel evaluation type.');
        if (! in_array($personnelGroup, ['FACULTY','NON_TEACHING_FACULTY'], true)) throw new InvalidArgumentException('INVALID_PERSONNEL_GROUP: Select Faculty or Non-Teaching Faculty.');
        if (! preg_match('/^(19|20|21)(\d{2})-(19|20|21)(\d{2})$/', $year, $m) || (int) substr($year, 5) !== (int) substr($year, 0, 4) + 1) throw new InvalidArgumentException('INVALID_ACADEMIC_YEAR: Academic year must contain consecutive years in YYYY-YYYY format.');
        $semester = trim((string) ($input['semester'] ?? '')) ?: null;
        if ($semester !== null && ! in_array($semester, self::SEMESTERS, true)) throw new InvalidArgumentException('INVALID_COVERAGE: Select a supported semester or coverage.');
        $coverage = $this->cleanText($input['coverage_label'] ?? '', 100, 'coverage_label', true);
        if ($semester !== 'CUSTOM_COVERAGE') $coverage = '';
        if ($semester === 'CUSTOM_COVERAGE' && $coverage === '') throw new InvalidArgumentException('CUSTOM_COVERAGE_REQUIRED: Enter a label for custom coverage.');
        $name = $this->cleanText($input['period_name'] ?? '', 100, 'period_name', true);
        if ($name === '') $name = $this->typeLabel($type) . ' — AY ' . str_replace('-', '–', $year);
        if (mb_strlen($name) < 5) throw new InvalidArgumentException('INVALID_PERIOD_NAME: Period name must be 5–100 characters.');

        $cycleId = trim((string)($input['ranking_cycle_id'] ?? ''));
        if ($cycleId === '') throw new InvalidArgumentException('RANKING_CYCLE_REQUIRED: Select a ranking cycle for this track.');
        $cycle = $this->db->table('ranking_cycles')->where('id', $cycleId)->get()->getRowArray();
        if (! $cycle) throw new InvalidArgumentException('RANKING_CYCLE_NOT_FOUND: The selected ranking cycle does not exist.');
        if ($cycle['academic_year'] !== $year) throw new InvalidArgumentException('RANKING_CYCLE_YEAR_MISMATCH: Track and ranking cycle must use the same academic year.');
        $data = ['ranking_cycle_id'=>$cycleId,'period_name'=>$name,'evaluation_type'=>$type,'personnel_group'=>$personnelGroup,'academic_year'=>$year,'semester'=>$semester,'coverage_label'=>$coverage ?: null];
        foreach (['submission_open_at','submission_close_at','evaluation_start_at','evaluation_end_at'] as $field) $data[$field] = $this->mysqlDate($input[$field] ?? null);
        $data['evaluation_scale_version_id'] = trim((string) ($input['evaluation_scale_version_id'] ?? '')) ?: null;
        if (!$data['evaluation_scale_version_id']) $data['evaluation_scale_version_id'] = $this->resolveActiveScaleForGroup($personnelGroup);
        $providedDates = array_filter(array_intersect_key($data, array_flip(['submission_open_at','submission_close_at','evaluation_start_at','evaluation_end_at'])));
        if ($providedDates && count($providedDates) !== 4) throw new InvalidArgumentException('INCOMPLETE_SCHEDULE: Either provide the complete schedule or leave all dates empty while drafting.');
        if (count($providedDates) === 4 && ! ($data['submission_open_at'] < $data['submission_close_at'] && $data['submission_close_at'] <= $data['evaluation_start_at'] && $data['evaluation_start_at'] < $data['evaluation_end_at'])) throw new InvalidArgumentException('INVALID_DATE_ORDER: Required order is submission open < close <= evaluation start < end.');
        if ($data['evaluation_scale_version_id']) $this->validateScale($data['evaluation_scale_version_id'], $year, false, $personnelGroup);
        return $data;
    }

    private function validateOperational(array $row, string $id): void
    {
        $data = $this->validateDraft($row);
        foreach (['semester','submission_open_at','submission_close_at','evaluation_start_at','evaluation_end_at','evaluation_scale_version_id'] as $field) if (empty($data[$field])) throw new InvalidArgumentException('PERIOD_INCOMPLETE: Complete coverage, schedule, and scale before opening submissions.');
        $this->validateScale($data['evaluation_scale_version_id'], $data['academic_year'], true, $data['personnel_group']);
        $reviewers = $this->reviewerReadiness();
        if (! $reviewers['ready']) throw new RuntimeException('REVIEWER_STRUCTURE_INVALID: Every college with active Faculty must have exactly one active Dean before Faculty submissions can open.');
        $openConflict = $this->db->table('personnel_evaluation_periods')->where('evaluation_type', $data['evaluation_type'])->where('personnel_group', $data['personnel_group'])->where('status', 'OPEN_FOR_SUBMISSION')->where('id !=', $id)->countAllResults();
        if ($openConflict) throw new RuntimeException('OPEN_PERIOD_CONFLICT: Another period for this personnel group and evaluation type is already open.');
        $overlap = $this->db->table('personnel_evaluation_periods')->where('evaluation_type', $data['evaluation_type'])->where('personnel_group', $data['personnel_group'])->where('id !=', $id)->whereIn('status', ['OPEN_FOR_SUBMISSION','SUBMISSION_CLOSED','EVALUATION_ONGOING'])->groupStart()->where('submission_open_at <', $data['submission_close_at'])->where('submission_close_at >', $data['submission_open_at'])->groupEnd()->countAllResults();
        if ($overlap) throw new RuntimeException('SUBMISSION_WINDOW_OVERLAP: This submission window overlaps another operational period for the same personnel group and evaluation type.');
        $evaluationOverlap = $this->db->table('personnel_evaluation_periods')->where('evaluation_type', $data['evaluation_type'])->where('personnel_group', $data['personnel_group'])->where('id !=', $id)->whereIn('status', ['SUBMISSION_CLOSED','EVALUATION_ONGOING'])->groupStart()->where('evaluation_start_at <', $data['evaluation_end_at'])->where('evaluation_end_at >', $data['evaluation_start_at'])->groupEnd()->countAllResults();
        if ($evaluationOverlap) throw new RuntimeException('EVALUATION_WINDOW_OVERLAP: This evaluation window overlaps another operational period for the same personnel group and evaluation type.');
        $coveragePeers = $this->db->table('personnel_evaluation_periods')->select('semester')->where('evaluation_type', $data['evaluation_type'])->where('personnel_group', $data['personnel_group'])->where('academic_year', $data['academic_year'])->where('id !=', $id)->whereIn('status', ['OPEN_FOR_SUBMISSION','SUBMISSION_CLOSED','EVALUATION_ONGOING'])->get()->getResultArray();
        foreach ($coveragePeers as $peer) {
            if ($data['semester'] === 'FULL_ACADEMIC_YEAR' || $peer['semester'] === 'FULL_ACADEMIC_YEAR' || $data['semester'] === 'CUSTOM_COVERAGE' || $peer['semester'] === 'CUSTOM_COVERAGE') {
                throw new RuntimeException('COVERAGE_OVERLAP: This coverage conflicts with another operational period of the same type and academic year.');
            }
        }
    }

    private function validateScale(string $id, string $year, bool $mustBeApproved, string $personnelGroup): void
    {
        $scale = $this->db->table('evaluation_scale_versions v')->select('v.*, s.personnel_group')->join('evaluation_scales s', 's.id=v.scale_id')->where('v.id', $id)->get()->getRowArray();
        if (! $scale) throw new InvalidArgumentException('INVALID_SCALE_REFERENCE: Evaluation scale version does not exist.');
        if ($mustBeApproved && strtolower((string) $scale['status']) !== 'approved') throw new InvalidArgumentException('SCALE_NOT_APPROVED: Select an approved personnel scale version.');
        if (($scale['personnel_group'] ?? '') !== $personnelGroup) throw new InvalidArgumentException('CRITERIA_GROUP_MISMATCH: The selected ranking criteria do not apply to this personnel group.');
        // Active criteria versions are reusable across ranking periods until formally retired.
    }

    private function resolveActiveScaleForGroup(string $personnelGroup): ?string
    {
        $rows = $this->db->table('evaluation_scale_versions v')->select('v.id')->join('evaluation_scales s', 's.id=v.scale_id')->where('s.personnel_group', $personnelGroup)->where('v.status', 'approved')->get()->getResultArray();
        if (count($rows) > 1) throw new RuntimeException('MULTIPLE_ACTIVE_CRITERIA: More than one active criteria version is configured for this personnel group.');
        return $rows[0]['id'] ?? null;
    }

    private function rejectProtectedFields(array $input): void
    {
        $unknown = array_diff(array_keys($input), self::WRITABLE);
        if ($unknown) throw new InvalidArgumentException('PROTECTED_FIELD: The request contains fields that cannot be changed.');
        foreach ($input as $value) if (is_array($value) || is_object($value)) throw new InvalidArgumentException('INVALID_REQUEST_SHAPE: Period fields must be scalar values.');
    }

    private function canonicalDuplicate(array $data, ?string $exceptId = null): ?array
    {
        $builder = $this->db->table('personnel_evaluation_periods')->where('ranking_cycle_id', $data['ranking_cycle_id'])->where('personnel_group', $data['personnel_group']);
        if ($exceptId) $builder->where('id !=', $exceptId);
        return $builder->get()->getRowArray() ?: null;
    }

    private function cleanText(mixed $value, int $max, string $field, bool $allowEmpty = false): string
    {
        $value = preg_replace('/\s+/u', ' ', trim((string) $value));
        if (class_exists('Normalizer')) $value = \Normalizer::normalize($value, \Normalizer::FORM_C) ?: $value;
        if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F<>]/u', $value)) throw new InvalidArgumentException("UNSAFE_TEXT: {$field} contains unsupported characters.");
        if (! $allowEmpty && $value === '') throw new InvalidArgumentException("VALIDATION_ERROR: {$field} is required.");
        if (mb_strlen($value) > $max) throw new InvalidArgumentException("FIELD_TOO_LONG: {$field} exceeds {$max} characters.");
        return $value;
    }

    private function mysqlDate(mixed $value): ?string
    {
        if ($value === null || trim((string) $value) === '') return null;
        $timestamp = strtotime((string) $value);
        if ($timestamp === false) throw new InvalidArgumentException('INVALID_TIMESTAMP: Enter a valid date and time.');
        return date('Y-m-d H:i:s', $timestamp);
    }

    private function dto(array $row): array
    {
        $semesterLabels = ['1ST_SEMESTER'=>'1st Semester','2ND_SEMESTER'=>'2nd Semester','FULL_ACADEMIC_YEAR'=>'Full Academic Year','CUSTOM_COVERAGE'=>'Custom Coverage'];
        $now = time(); $open = $row['submission_open_at'] ? strtotime($row['submission_open_at']) : null; $close = $row['submission_close_at'] ? strtotime($row['submission_close_at']) : null;
        return $row + ['evaluation_type_label'=>$this->typeLabel($row['evaluation_type']),'academic_year_label'=>'AY '.str_replace('-', '–', $row['academic_year']),'semester_label'=>$semesterLabels[$row['semester']] ?? 'Not configured','status_label'=>ucwords(strtolower(str_replace('_', ' ', $row['status']))),'can_submit'=>$row['status']==='OPEN_FOR_SUBMISSION' && $open !== null && $close !== null && $now >= $open && $now <= $close,'can_evaluate'=>$row['status']==='EVALUATION_ONGOING','submission_count'=>$this->submissionCount($row['id']),'reviewer_readiness'=>$this->reviewerReadiness(),'evaluation_scale_version'=>['id'=>$row['evaluation_scale_version_id'],'version_number'=>$row['scale_version_number'] ?? null,'title'=>$row['scale_title'] ?? null,'status'=>$row['scale_version_status'] ?? null]];
    }

    private function reviewerReadiness(): array
    {
        if (! $this->db->tableExists('personnel_college_affiliations') || ! $this->db->tableExists('dean_assignments')) {
            return ['ready'=>false, 'issues'=>['Reviewer assignment data is unavailable.']];
        }
        $rows = $this->db->query(
            'SELECT pca.college_id, COUNT(DISTINCT pca.personnel_profile_id) AS faculty_count, COUNT(DISTINCT da.id) AS dean_count
             FROM personnel_college_affiliations pca
             LEFT JOIN dean_assignments da ON da.college_id = pca.college_id AND da.is_active = 1
             WHERE pca.is_active = 1
             GROUP BY pca.college_id
             HAVING COUNT(DISTINCT da.id) <> 1'
        )->getResultArray();
        return ['ready'=>count($rows) === 0, 'issues'=>array_map(fn (array $row): string => "College {$row['college_id']} has {$row['dean_count']} active Dean assignments.", $rows)];
    }

    private function typeLabel(string $type): string { return ['RANKING_PROMOTION'=>'Ranking / Promotion','TENURE_EVALUATION'=>'Tenure Evaluation','PERSONNEL_ACCREDITATION_REVIEW'=>'Faculty / Personnel Accreditation Review'][$type] ?? $type; }
    private function submissionCount(string $id): int { return (int) $this->db->table('personnel_evaluations')->where('evaluation_period_id', $id)->countAllResults(); }
    private function event(string $periodId, string $type, string $actorId, ?array $old, array $new, string $requestId): void { $this->db->table('personnel_evaluation_period_events')->insert(['id'=>$this->uuid(),'evaluation_period_id'=>$periodId,'event_type'=>$type,'actor_profile_id'=>$actorId,'request_id'=>$requestId,'old_values'=>$old ? json_encode($old) : null,'new_values'=>json_encode($new),'created_at'=>date('Y-m-d H:i:s')]); }
    private function notifyPeriodOpened(array $period, string $actorId, string $requestId): void
    {
        if (! $this->db->tableExists('notifications')) return;
        $recipients = $this->db->table('profiles')->select('id')->where('account_type', 'personnel')->where('status', 'active')->get()->getResultArray();
        foreach ($recipients as $recipient) {
            $key = hash('sha256', "period-open:{$period['id']}:{$recipient['id']}:{$requestId}");
            $exists = $this->db->table('notifications')->where('idempotency_key', $key)->countAllResults();
            if ($exists) continue;
            $this->db->table('notifications')->insert(['id'=>$this->uuid(),'recipient_profile_id'=>$recipient['id'],'actor_profile_id'=>$actorId,'notification_type'=>'personnel_evaluation_period_opened','title'=>$period['period_name'].' is open','message'=>'Portfolio submissions are open until '.date('M j, Y g:i A', strtotime($period['submission_close_at'])).'.','reference_type'=>'personnel_evaluation_period','reference_id'=>$period['id'],'idempotency_key'=>$key,'is_mandatory'=>1,'created_at'=>date('Y-m-d H:i:s')]);
        }
    }
    private function requestId(?string $id): string { $id = trim((string) $id); return $id !== '' && preg_match('/^[A-Za-z0-9._:-]{8,100}$/', $id) ? $id : $this->uuid(); }
    private function idempotentResource(string $actor, string $operation, string $key, string $hash): ?string { $row=$this->db->table('personnel_evaluation_idempotency')->where(['actor_profile_id'=>$actor,'operation'=>$operation,'idempotency_key'=>$key])->get()->getRowArray(); if (!$row) return null; if (!hash_equals($row['request_hash'], $hash)) throw new RuntimeException('IDEMPOTENCY_CONFLICT: This request key was already used with different data.'); return $row['resource_id']; }
    private function reserveRequest(string $actor, string $operation, string $key, string $hash, string $resource): void { $this->db->table('personnel_evaluation_idempotency')->insert(['id'=>$this->uuid(),'actor_profile_id'=>$actor,'operation'=>$operation,'idempotency_key'=>$key,'request_hash'=>$hash,'resource_id'=>$resource,'response_status'=>201,'created_at'=>date('Y-m-d H:i:s')]); }
    private function periodCode(array $data): string { return 'PEP-'.substr($data['evaluation_type'],0,4).'-'.str_replace('-','',$data['academic_year']).'-'.strtoupper(substr($data['semester'] ?: 'DR',0,2)).'-'.strtoupper(substr(bin2hex(random_bytes(3)),0,6)); }
    private function uuid(): string { $h=bin2hex(random_bytes(16)); return substr($h,0,8).'-'.substr($h,8,4).'-4'.substr($h,13,3).'-'.dechex((hexdec($h[16])&3)|8).substr($h,17,3).'-'.substr($h,20,12); }
}
