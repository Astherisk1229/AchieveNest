<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

/**
 * HR-facing ranking period aggregate.
 *
 * A ranking period is the parent record (`ranking_cycles`); each personnel group it covers is
 * one authoritative track in `personnel_evaluation_periods` (ranking_cycle_id + personnel_group).
 * Every track write goes through PersonnelEvaluationPeriodService so schedule validation,
 * criteria binding, idempotency, lifecycle transitions and period events stay in one place.
 * Workflow stage and lifecycle status are derived here from track status only; nothing is stored twice.
 */
class RankingCycleService
{
    public const GROUPS = ['FACULTY', 'NON_TEACHING_FACULTY'];
    public const EVALUATION_TYPE = 'RANKING_PROMOTION';
    public const COVERAGE_SEMESTER = 'FULL_ACADEMIC_YEAR';

    /** Workflow stage per track status: Annual Reviews → Submissions → Evaluation → Results. */
    private const STAGES = [
        ['key' => 'annual_reviews', 'label' => 'Annual Reviews', 'route' => 'annual-reviews'],
        ['key' => 'submissions', 'label' => 'Submissions', 'route' => 'submissions'],
        ['key' => 'evaluation', 'label' => 'Evaluation', 'route' => 'evaluation'],
        ['key' => 'results', 'label' => 'Results', 'route' => 'results'],
    ];
    private const STAGE_BY_TRACK_STATUS = [
        'DRAFT' => 0,
        'OPEN_FOR_SUBMISSION' => 1,
        'SUBMISSION_CLOSED' => 2,
        'EVALUATION_ONGOING' => 2,
        'CLOSED' => 3,
        'ARCHIVED' => 3,
        'CANCELLED' => 3,
    ];
    private const LIFECYCLE_LABELS = [
        'INCOMPLETE' => 'Incomplete Configuration',
        'UPCOMING' => 'Upcoming',
        'ONGOING' => 'Ongoing',
        'COMPLETED' => 'Completed',
        'ARCHIVED' => 'Archived',
        'CANCELLED' => 'Cancelled',
    ];

    public function __construct(private ?BaseConnection $db = null, private ?PersonnelEvaluationPeriodService $periods = null)
    {
        $this->db ??= db_connect();
        $this->periods ??= new PersonnelEvaluationPeriodService($this->db);
    }

    public function list(): array
    {
        $this->periods->openDueScheduledSubmissions();
        $cycles = $this->db->table('ranking_cycles')->orderBy('academic_year', 'DESC')->orderBy('created_at', 'DESC')->get()->getResultArray();
        return array_map(fn(array $cycle): array => $this->present($cycle), $cycles);
    }

    public function find(string $id): ?array
    {
        $this->periods->openDueScheduledSubmissions();
        $cycle = $this->db->table('ranking_cycles')->where('id', $id)->get()->getRowArray();
        return $cycle ? $this->present($cycle) : null;
    }

    /**
     * Creates the cycle and one fully scheduled track per selected personnel group in a single
     * transaction. The cycle name is generated; HR never types it.
     */
    public function create(array $input, string $actorId, ?string $requestId = null): array
    {
        $year = $this->academicYear($input['academic_year'] ?? '');
        $groups = self::coverageGroups($input);
        $schedule = $this->schedule($input);
        $this->assertScheduleIsCurrent($schedule);
        $coverage = $this->coverageInput($input, false);
        $criteria = $this->criteriaFor($groups);
        foreach ($groups as $group) $this->assertNoConflictingTrack($year, $group);

        $id = $this->uuid();
        $now = date('Y-m-d H:i:s');
        $requestId = $this->requestKey($requestId);
        $this->db->transBegin();
        try {
            $this->db->table('ranking_cycles')->insert([
                'id' => $id,
                'cycle_code' => $this->cycleCode($year),
                'cycle_name' => self::generatedName($year, $groups),
                'academic_year' => $year,
                'created_by' => $actorId,
            ] + ($coverage ?? []) + [
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            foreach ($groups as $group) {
                $this->periods->create($this->trackPayload($id, $year, $group, $schedule, $criteria[$group]), $actorId, "{$requestId}:{$group}");
            }
            $this->audit($actorId, 'ranking_cycle_created', $id, ['academic_year' => $year, 'personnel_groups' => $groups, 'schedule' => $schedule, 'criteria_version_ids' => $criteria]);
            $this->db->transCommit();
        } catch (Throwable $error) {
            $this->db->transRollback();
            throw $error;
        }
        return $this->find($id);
    }

    /**
     * Adds missing personnel-group tracks to an existing cycle (Cycle Settings → Personnel Coverage,
     * and the recovery path for cycles whose configuration is incomplete).
     */
    public function addTracks(string $id, array $input, string $actorId, ?string $requestId = null): array
    {
        $cycle = $this->db->table('ranking_cycles')->where('id', $id)->get()->getRowArray();
        if (! $cycle) throw new InvalidArgumentException('RANKING_CYCLE_NOT_FOUND: Ranking cycle not found.');
        $existing = $this->tracks($id);
        $lifecycle = self::lifecycle($existing);
        if (in_array($lifecycle['key'], ['COMPLETED', 'ARCHIVED', 'CANCELLED'], true)) throw new RuntimeException('RANKING_CYCLE_READ_ONLY: Completed, archived, and cancelled cycles cannot change personnel coverage.');

        $present = array_column($existing, 'personnel_group');
        $groups = array_values(array_diff(self::coverageGroups($input), $present));
        if ($groups === []) throw new InvalidArgumentException('COVERAGE_UNCHANGED: The selected personnel groups are already part of this cycle.');

        $reference = $existing[0] ?? null;
        $schedule = $this->schedule($reference && ! array_key_exists('submission_open_at', $input) ? $reference : $input);
        if (! $reference) $this->assertScheduleIsCurrent($schedule);
        $criteria = $this->criteriaFor($groups);
        foreach ($groups as $group) $this->assertNoConflictingTrack($cycle['academic_year'], $group);

        $requestId = $this->requestKey($requestId);
        $this->db->transBegin();
        try {
            foreach ($groups as $group) {
                $this->periods->create($this->trackPayload($id, $cycle['academic_year'], $group, $schedule, $criteria[$group]), $actorId, "{$requestId}:{$group}");
            }
            $allGroups = array_values(array_unique(array_merge($present, $groups)));
            $update = ['updated_by' => $actorId, 'updated_at' => date('Y-m-d H:i:s')];
            if (empty($cycle['legacy_source_period_id'])) $update['cycle_name'] = self::generatedName($cycle['academic_year'], $allGroups);
            $this->db->table('ranking_cycles')->where('id', $id)->update($update);
            $this->audit($actorId, 'ranking_cycle_coverage_added', $id, ['added_groups' => $groups, 'schedule' => $schedule, 'criteria_version_ids' => $criteria]);
            $this->db->transCommit();
        } catch (Throwable $error) {
            $this->db->transRollback();
            throw $error;
        }
        return $this->find($id);
    }

    /** Applies the same schedule change to every editable track of the cycle. */
    public function updateSchedule(string $id, array $input, string $actorId): array
    {
        $cycle = $this->find($id);
        if (! $cycle) throw new InvalidArgumentException('RANKING_CYCLE_NOT_FOUND: Ranking cycle not found.');
        if ($cycle['is_read_only']) throw new RuntimeException('RANKING_CYCLE_READ_ONLY: Completed, archived, and cancelled cycles are read-only.');
        $schedule = $this->schedule($input);
        $reason = trim((string) ($input['reason'] ?? ''));
        $this->db->transBegin();
        try {
            foreach ($cycle['tracks'] as $track) {
                if (! in_array($track['status'], ['DRAFT', 'OPEN_FOR_SUBMISSION'], true)) throw new RuntimeException('PERIOD_EDIT_LOCKED: The schedule can no longer change once submissions have closed.');
                $this->periods->update($track['id'], $schedule + ['expected_version' => $track['version'], 'reason' => $reason], $actorId);
            }
            $this->audit($actorId, 'ranking_cycle_schedule_updated', $id, ['schedule' => $schedule, 'reason' => $reason]);
            $this->db->transCommit();
        } catch (Throwable $error) {
            $this->db->transRollback();
            throw $error;
        }
        return $this->find($id);
    }

    /**
     * Sets the cycle's achievement coverage (which accomplishments belong to the cycle). Separate from the
     * submission/evaluation schedule. Locked once any portfolio has been submitted, so submitted
     * evaluations never change underneath reviewers.
     */
    public function updateCoverage(string $id, array $input, string $actorId): array
    {
        $cycle = $this->find($id);
        if (! $cycle) throw new InvalidArgumentException('RANKING_CYCLE_NOT_FOUND: Ranking cycle not found.');
        if ($cycle['is_read_only']) throw new RuntimeException('RANKING_CYCLE_READ_ONLY: Completed, archived, and cancelled cycles are read-only.');
        if (! $cycle['coverage_editable']) throw new RuntimeException('COVERAGE_LOCKED: Achievement coverage cannot change after portfolios have been submitted for this cycle.');
        $coverage = $this->coverageInput($input, true);
        $this->db->table('ranking_cycles')->where('id', $id)->update($coverage + ['updated_by' => $actorId, 'updated_at' => date('Y-m-d H:i:s')]);
        $this->audit($actorId, 'ranking_cycle_coverage_updated', $id, ['previous' => ['coverage_start' => $cycle['coverage_start'] ?? null, 'coverage_end' => $cycle['coverage_end'] ?? null], 'coverage' => $coverage]);
        return $this->find($id);
    }

    /** Kept for API compatibility; the cycle name is generated and the academic year is locked once tracks exist. */
    public function update(string $id, array $input, string $actorId): array
    {
        $existing = $this->db->table('ranking_cycles')->where('id', $id)->get()->getRowArray();
        if (! $existing) throw new InvalidArgumentException('RANKING_CYCLE_NOT_FOUND: Ranking cycle not found.');
        if (in_array(self::lifecycle($this->tracks($id))['key'], ['COMPLETED', 'ARCHIVED', 'CANCELLED'], true)) throw new RuntimeException('RANKING_CYCLE_READ_ONLY: Completed, archived, and cancelled cycles are read-only.');
        $year = $this->academicYear($input['academic_year'] ?? $existing['academic_year']);
        if ($year !== $existing['academic_year'] && $this->db->table('personnel_evaluation_periods')->where('ranking_cycle_id', $id)->countAllResults() > 0) throw new RuntimeException('RANKING_CYCLE_YEAR_LOCKED: Academic year cannot change after personnel coverage is configured.');
        $groups = array_column($this->tracks($id), 'personnel_group');
        $data = ['academic_year' => $year, 'updated_by' => $actorId, 'updated_at' => date('Y-m-d H:i:s')];
        if (empty($existing['legacy_source_period_id'])) $data['cycle_name'] = self::generatedName($year, $groups);
        $this->db->table('ranking_cycles')->where('id', $id)->update($data);
        $this->audit($actorId, 'ranking_cycle_updated', $id, ['academic_year' => $year]);
        return $this->find($id);
    }

    /**
     * Archives a completed cycle by moving each CLOSED track to ARCHIVED through the existing
     * period lifecycle. No annual review, submission, evaluation, score, result or audit row is touched.
     */
    public function archive(string $id, array $input, string $actorId, ?string $requestId = null): array
    {
        if (($input['confirm'] ?? false) !== true) throw new InvalidArgumentException('ARCHIVE_CONFIRMATION_REQUIRED: Confirm that archiving cannot be undone.');
        $cycle = $this->find($id);
        if (! $cycle) throw new InvalidArgumentException('RANKING_CYCLE_NOT_FOUND: Ranking cycle not found.');
        if ($cycle['lifecycle_status']['key'] === 'ARCHIVED') return $cycle;
        if ($cycle['lifecycle_status']['key'] !== 'COMPLETED') throw new RuntimeException('RANKING_CYCLE_NOT_COMPLETED: Only completed ranking periods can be archived.');

        $requestId = $this->requestKey($requestId);
        $this->db->transBegin();
        try {
            foreach ($cycle['tracks'] as $track) {
                if ($track['status'] === 'CLOSED') $this->periods->transition($track['id'], 'archive', $actorId, "{$requestId}:{$track['personnel_group']}", (int) $track['version']);
            }
            $this->audit($actorId, 'ranking_cycle_archived', $id, ['track_ids' => array_column($cycle['tracks'], 'id')]);
            $this->db->transCommit();
        } catch (Throwable $error) {
            $this->db->transRollback();
            throw $error;
        }
        return $this->find($id);
    }

    /**
     * Stops active work while preserving all submissions, evaluations, and results.
     * A cancellation reason is deliberately recorded in every affected track event
     * as well as in the aggregate audit entry.
     */
    public function cancel(string $id, array $input, string $actorId, ?string $requestId = null): array
    {
        $reason = trim((string) ($input['reason'] ?? ''));
        if ($reason === '') throw new InvalidArgumentException('CANCELLATION_REASON_REQUIRED: Enter a reason for cancelling this ranking period.');
        if (mb_strlen($reason) > 500) throw new InvalidArgumentException('CANCELLATION_REASON_TOO_LONG: The cancellation reason must be 500 characters or fewer.');
        $cycle = $this->find($id);
        if (! $cycle) throw new InvalidArgumentException('RANKING_CYCLE_NOT_FOUND: Ranking cycle not found.');
        if ($cycle['lifecycle_status']['key'] === 'CANCELLED') return $cycle;
        if (in_array($cycle['lifecycle_status']['key'], ['COMPLETED', 'ARCHIVED'], true)) throw new RuntimeException('RANKING_CYCLE_CANNOT_CANCEL: Completed and archived ranking periods cannot be cancelled.');
        if ($cycle['tracks'] === []) throw new RuntimeException('RANKING_CYCLE_CANNOT_CANCEL: Configure personnel coverage before cancelling this ranking period.');

        $requestId = $this->requestKey($requestId);
        $cancellable = ['DRAFT', 'OPEN_FOR_SUBMISSION', 'SUBMISSION_CLOSED', 'EVALUATION_ONGOING'];
        $preservedHistorical = ['CLOSED', 'ARCHIVED'];
        foreach ($cycle['tracks'] as $track) {
            if (! in_array($track['status'], array_merge($cancellable, $preservedHistorical), true)) throw new RuntimeException('RANKING_CYCLE_CANNOT_CANCEL: This ranking period has a track in an unsupported lifecycle state.');
        }
        $this->db->transBegin();
        try {
            foreach ($cycle['tracks'] as $track) {
                if (in_array($track['status'], $cancellable, true)) $this->periods->transition($track['id'], 'cancel', $actorId, "{$requestId}:{$track['personnel_group']}", (int) $track['version'], $reason);
            }
            $this->audit($actorId, 'ranking_cycle_cancelled', $id, ['reason' => $reason, 'track_ids' => array_column($cycle['tracks'], 'id')]);
            $this->db->transCommit();
        } catch (Throwable $error) {
            $this->db->transRollback();
            throw $error;
        }
        return $this->find($id);
    }

    /** Restoring an archive makes records viewable as completed, never operational again. */
    public function restore(string $id, array $input, string $actorId, ?string $requestId = null): array
    {
        if (($input['confirm'] ?? false) !== true) throw new InvalidArgumentException('RESTORE_CONFIRMATION_REQUIRED: Confirm that restore returns this period to completed historical records.');
        $cycle = $this->find($id);
        if (! $cycle) throw new InvalidArgumentException('RANKING_CYCLE_NOT_FOUND: Ranking cycle not found.');
        if ($cycle['lifecycle_status']['key'] !== 'ARCHIVED') throw new RuntimeException('RANKING_CYCLE_NOT_ARCHIVED: Only archived ranking periods can be restored.');

        $requestId = $this->requestKey($requestId);
        $this->db->transBegin();
        try {
            foreach ($cycle['tracks'] as $track) $this->periods->transition($track['id'], 'restore', $actorId, "{$requestId}:{$track['personnel_group']}", (int) $track['version']);
            $this->audit($actorId, 'ranking_cycle_restored', $id, ['track_ids' => array_column($cycle['tracks'], 'id')]);
            $this->db->transCommit();
        } catch (Throwable $error) {
            $this->db->transRollback();
            throw $error;
        }
        return $this->find($id);
    }

    /** Permanently removes only an unused draft and never cascades operational history. */
    public function delete(string $id, array $input = [], ?string $actorId = null): void
    {
        $cycle = $this->db->table('ranking_cycles')->where('id', $id)->get()->getRowArray();
        if (! $cycle) throw new InvalidArgumentException('RANKING_CYCLE_NOT_FOUND: Ranking cycle not found.');
        $tracks = $this->tracks($id);
        $expectedName = self::generatedName($cycle['academic_year'], array_column($tracks, 'personnel_group'));
        if (trim((string) ($input['confirm_name'] ?? '')) !== $expectedName) throw new InvalidArgumentException('DELETE_CONFIRMATION_REQUIRED: Type the exact ranking period name to permanently delete this unused draft.');
        $eligibility = $this->deletionEligibility($tracks);
        if (! $eligibility['allowed']) throw new RuntimeException('RANKING_CYCLE_DELETE_BLOCKED: ' . $eligibility['reason']);
        $this->db->transBegin();
        try {
            $trackIds = array_column($tracks, 'id');
            // Draft lifecycle events and idempotency keys describe configuration only.
            // They are removed with the unused draft; operational dependencies above are never deleted.
            if ($trackIds !== []) {
                $this->db->table('personnel_evaluation_period_events')->whereIn('evaluation_period_id', $trackIds)->delete();
                if ($this->db->tableExists('personnel_evaluation_idempotency')) $this->db->table('personnel_evaluation_idempotency')->whereIn('resource_id', $trackIds)->delete();
                $this->db->table('personnel_evaluation_periods')->whereIn('id', $trackIds)->delete();
            }
            $this->db->table('ranking_cycles')->where('id', $id)->delete();
            if ($actorId) $this->audit($actorId, 'ranking_cycle_deleted', $id, ['academic_year' => $cycle['academic_year'], 'cycle_code' => $cycle['cycle_code'], 'track_ids' => $trackIds]);
            $this->db->transCommit();
        } catch (Throwable $error) {
            $this->db->transRollback();
            throw $error;
        }
    }

    // ------------------------------------------------------------------ presentation

    private function present(array $cycle): array
    {
        $tracks = $this->tracks($cycle['id']);
        $groups = array_column($tracks, 'personnel_group');
        $lifecycle = self::lifecycle($tracks);
        $stage = self::currentStage($tracks);
        $deletion = $this->deletionEligibility($tracks);
        $isLegacy = ! empty($cycle['legacy_source_period_id']) || str_starts_with((string) $cycle['cycle_code'], 'LEGACY-');
        $readOnly = in_array($lifecycle['key'], ['COMPLETED', 'ARCHIVED', 'CANCELLED'], true);
        $creator = $cycle['created_by'] ? $this->db->table('profiles')->select('account_type')->where('id', $cycle['created_by'])->get()->getRowArray() : null;

        return $cycle + [
            'display_name' => self::generatedName($cycle['academic_year'], $groups),
            'academic_year_label' => 'AY ' . str_replace('-', '–', $cycle['academic_year']),
            'is_legacy' => $isLegacy,
            'created_by_label' => ($creator['account_type'] ?? '') === 'hr_admin' ? 'HR Administrator' : null,
            'coverage' => self::coverage($groups),
            'schedule' => self::schedule_summary($tracks),
            'current_stage' => $stage,
            'lifecycle_status' => $lifecycle,
            'configuration_issues' => self::configurationIssues($tracks),
            'is_read_only' => $readOnly,
            'is_archived' => $lifecycle['key'] === 'ARCHIVED',
            'is_cancelled' => $lifecycle['key'] === 'CANCELLED',
            'deletion_eligibility' => $deletion,
            'allowed_actions' => self::allowedActions($lifecycle['key'], count($tracks), $deletion['allowed']),
            'tracks' => $tracks,
            'track_count' => count($tracks),
            'achievement_coverage' => ($cycle['coverage_start'] ?? null) && ($cycle['coverage_end'] ?? null) ? ['start' => $cycle['coverage_start'], 'end' => $cycle['coverage_end']] : null,
            'coverage_editable' => ! $readOnly && ! $this->hasSubmissions($tracks),
            // Compatibility fields consumed by earlier callers.
            'display_status' => $lifecycle['key'],
            'display_status_label' => $lifecycle['label'],
            'is_complete' => $readOnly,
        ];
    }

    private function tracks(string $cycleId): array
    {
        $rows = $this->db->table('personnel_evaluation_periods p')
            ->select('p.id, p.ranking_cycle_id, p.period_code, p.period_name, p.personnel_group, p.academic_year, p.semester, p.status, p.version, p.submission_open_at, p.submission_close_at, p.evaluation_start_at, p.evaluation_end_at, p.evaluation_scale_version_id, p.closed_at, p.archived_at, sv.version_number AS scale_version_number, sv.status AS scale_version_status, s.title AS scale_title, s.total_points AS scale_total_points')
            ->join('evaluation_scale_versions sv', 'sv.id = p.evaluation_scale_version_id', 'left')
            ->join('evaluation_scales s', 's.id = sv.scale_id', 'left')
            ->where('p.ranking_cycle_id', $cycleId)->orderBy('p.personnel_group')->get()->getResultArray();
        return array_map(static function (array $track): array {
            $stageIndex = self::STAGE_BY_TRACK_STATUS[$track['status']] ?? 0;
            $track['track_key'] = $track['personnel_group'] === 'NON_TEACHING_FACULTY' ? 'non-teaching-faculty' : 'faculty';
            $track['personnel_group_label'] = self::groupLabel($track['personnel_group']);
            $track['current_stage'] = self::STAGES[$stageIndex] + ['index' => $stageIndex];
            $track['is_locked'] = in_array($track['status'], ['CLOSED', 'ARCHIVED', 'CANCELLED'], true);
            $track['criteria'] = $track['evaluation_scale_version_id'] ? [
                'version_id' => $track['evaluation_scale_version_id'],
                'title' => $track['scale_title'],
                'version_number' => $track['scale_version_number'],
                'label' => trim(($track['scale_title'] ?: 'Ranking criteria') . ' v' . ($track['scale_version_number'] ?: '—')),
                'status' => $track['scale_version_status'],
                'locked' => true,
            ] : null;
            return $track;
        }, $rows);
    }

    public static function generatedName(string $year, array $groups): string
    {
        $prefix = 'AY ' . str_replace('-', '–', $year);
        $groups = array_values(array_intersect(self::GROUPS, $groups));
        if ($groups === ['FACULTY']) return "{$prefix} Teaching Faculty Ranking";
        if ($groups === ['NON_TEACHING_FACULTY']) return "{$prefix} Non-Teaching Faculty Ranking";
        if (count($groups) === 2) return "{$prefix} Personnel Ranking";
        return "{$prefix} Ranking Period";
    }

    public static function coverage(array $groups): array
    {
        $groups = array_values(array_intersect(self::GROUPS, $groups));
        $key = count($groups) === 2 ? 'BOTH' : ($groups[0] ?? 'NONE');
        $label = ['BOTH' => 'Teaching Faculty + Non-Teaching Faculty', 'FACULTY' => 'Teaching Faculty', 'NON_TEACHING_FACULTY' => 'Non-Teaching Faculty', 'NONE' => 'Not set'][$key];
        return ['key' => $key, 'label' => $label, 'groups' => $groups];
    }

    /** The least-advanced track decides the cycle's current stage. */
    public static function currentStage(array $tracks): ?array
    {
        if ($tracks === []) return null;
        $index = min(array_map(static fn(array $t): int => self::STAGE_BY_TRACK_STATUS[$t['status'] ?? 'DRAFT'] ?? 0, $tracks));
        return self::STAGES[$index] + ['index' => $index, 'total' => count(self::STAGES)];
    }

    public static function lifecycle(array $tracks): array
    {
        $statuses = array_map(static fn(array $t): string => (string) ($t['status'] ?? ''), $tracks);
        if ($tracks === []) $key = 'INCOMPLETE';
        elseif (array_diff($statuses, ['ARCHIVED']) === []) $key = 'ARCHIVED';
        elseif (array_diff($statuses, ['CLOSED', 'ARCHIVED', 'CANCELLED']) === [] && in_array('CANCELLED', $statuses, true)) $key = 'CANCELLED';
        elseif (self::configurationIssues($tracks) !== []) $key = 'INCOMPLETE';
        elseif (array_diff($statuses, ['CLOSED', 'ARCHIVED']) === []) $key = 'COMPLETED';
        elseif (array_diff($statuses, ['DRAFT']) === []) $key = 'UPCOMING';
        else $key = 'ONGOING';
        return ['key' => $key, 'label' => self::LIFECYCLE_LABELS[$key]];
    }

    /** Only drafts can be incomplete; opened tracks already passed operational validation. */
    public static function configurationIssues(array $tracks): array
    {
        if ($tracks === []) return ['Personnel coverage and schedule are not configured.'];
        $issues = [];
        foreach ($tracks as $track) {
            if (($track['status'] ?? '') !== 'DRAFT') continue;
            $label = self::groupLabel((string) $track['personnel_group']);
            foreach (['submission_open_at', 'submission_close_at', 'evaluation_start_at', 'evaluation_end_at'] as $field) {
                if (empty($track[$field])) { $issues[] = "{$label} schedule is incomplete."; break; }
            }
            if (empty($track['evaluation_scale_version_id'])) $issues[] = "{$label} criteria are not assigned.";
        }
        return $issues;
    }

    public static function allowedActions(string $lifecycle, int $trackCount, bool $canDelete = false): array
    {
        return match ($lifecycle) {
            'INCOMPLETE' => array_values(array_filter(['complete_setup', ($canDelete || $trackCount === 0) ? 'delete' : null, $trackCount > 0 ? 'cancel' : null])),
            'UPCOMING' => array_values(array_filter(['open', 'settings', $canDelete ? 'delete' : null, 'cancel'])),
            'ONGOING' => ['open', 'settings', 'cancel'],
            'COMPLETED' => ['view', 'archive'],
            'ARCHIVED' => ['view', 'restore'],
            'CANCELLED' => ['view'],
            default => ['view'],
        };
    }

    private static function schedule_summary(array $tracks): array
    {
        $pick = static function (array $tracks, string $field, bool $min): ?string {
            $values = array_values(array_filter(array_column($tracks, $field)));
            if ($values === []) return null;
            return $min ? min($values) : max($values);
        };
        return [
            'submission_open_at' => $pick($tracks, 'submission_open_at', true),
            'submission_close_at' => $pick($tracks, 'submission_close_at', false),
            'evaluation_start_at' => $pick($tracks, 'evaluation_start_at', true),
            'evaluation_end_at' => $pick($tracks, 'evaluation_end_at', false),
            'is_shared' => count(array_unique(array_map(static fn(array $t): string => implode('|', [$t['submission_open_at'], $t['submission_close_at'], $t['evaluation_start_at'], $t['evaluation_end_at']]), $tracks))) <= 1,
        ];
    }

    private static function groupLabel(string $group): string { return $group === 'NON_TEACHING_FACULTY' ? 'Non-Teaching Faculty' : 'Teaching Faculty'; }

    // ------------------------------------------------------------------ validation

    public static function coverageGroups(array $input): array
    {
        $raw = $input['personnel_coverage'] ?? ($input['personnel_groups'] ?? null);
        if (is_string($raw)) $raw = strtoupper(trim($raw)) === 'BOTH' ? self::GROUPS : [strtoupper(trim($raw))];
        if (! is_array($raw) || $raw === []) throw new InvalidArgumentException('PERSONNEL_COVERAGE_REQUIRED: Select Teaching Faculty, Non-Teaching Faculty, or both.');
        $groups = array_values(array_unique(array_map(static fn($g): string => strtoupper(str_replace('-', '_', trim((string) $g))), $raw)));
        if (array_diff($groups, self::GROUPS) !== []) throw new InvalidArgumentException('INVALID_PERSONNEL_GROUP: Select Teaching Faculty or Non-Teaching Faculty.');
        return array_values(array_intersect(self::GROUPS, $groups));
    }

    private function academicYear(mixed $value): string
    {
        $year = str_replace('–', '-', trim((string) $value));
        if (! preg_match('/^(19|20|21)\d{2}-(19|20|21)\d{2}$/', $year) || (int) substr($year, 5) !== (int) substr($year, 0, 4) + 1) throw new InvalidArgumentException('INVALID_ACADEMIC_YEAR: Academic year must contain consecutive years in YYYY-YYYY format.');
        return $year;
    }

    /** Date-only values expand to whole days: start at 00:00:00, end at 23:59:59. */
    private function schedule(array $input): array
    {
        $fields = ['submission_open_at' => false, 'submission_close_at' => true, 'evaluation_start_at' => false, 'evaluation_end_at' => true];
        $schedule = [];
        foreach ($fields as $field => $isEnd) {
            $value = trim((string) ($input[$field] ?? ''));
            if ($value === '') throw new InvalidArgumentException('INCOMPLETE_SCHEDULE: Enter the submission and evaluation start and end dates.');
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) $value .= $isEnd ? ' 23:59:59' : ' 00:00:00';
            $timestamp = strtotime($value);
            if ($timestamp === false) throw new InvalidArgumentException('INVALID_TIMESTAMP: Enter valid schedule dates.');
            $schedule[$field] = date('Y-m-d H:i:s', $timestamp);
        }
        if ($schedule['submission_open_at'] >= $schedule['submission_close_at']) throw new InvalidArgumentException('INVALID_SUBMISSION_PERIOD: The submission period must end after it starts.');
        if ($schedule['evaluation_start_at'] < $schedule['submission_open_at']) throw new InvalidArgumentException('SCHEDULE_ORDER: The evaluation period cannot start before submissions open.');
        if ($schedule['evaluation_start_at'] >= $schedule['evaluation_end_at']) throw new InvalidArgumentException('INVALID_EVALUATION_PERIOD: The evaluation period must end after it starts.');
        return $schedule;
    }

    /** Achievement coverage dates: both or neither on create, both required on update; start <= end. */
    private function coverageInput(array $input, bool $required): ?array
    {
        $start = trim((string) ($input['coverage_start'] ?? ''));
        $end = trim((string) ($input['coverage_end'] ?? ''));
        if ($start === '' && $end === '' && ! $required) return null;
        if ($start === '' || $end === '') throw new InvalidArgumentException('INCOMPLETE_COVERAGE: Enter both the achievement coverage start and end dates.');
        foreach ([$start, $end] as $date) {
            $parts = explode('-', $date);
            if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || ! checkdate((int) $parts[1], (int) $parts[2], (int) $parts[0])) throw new InvalidArgumentException('INVALID_COVERAGE_DATE: Enter valid achievement coverage dates.');
        }
        if ($start > $end) throw new InvalidArgumentException('INVALID_COVERAGE_PERIOD: The achievement coverage must end on or after its start.');
        return ['coverage_start' => $start, 'coverage_end' => $end];
    }

    private function hasSubmissions(array $tracks): bool
    {
        $ids = array_values(array_filter(array_column($tracks, 'id')));
        if ($ids === [] || ! $this->db->tableExists('personnel_evaluations')) return false;
        return $this->db->table('personnel_evaluations')->whereIn('evaluation_period_id', $ids)->countAllResults() > 0;
    }

    /**
     * A delete is permitted only for draft configuration that has no dependent
     * workflow, snapshot, review, recommendation, or official-record data.
     * Tables are checked defensively because older installations may not yet
     * have every ranking extension.
     */
    private function deletionEligibility(array $tracks): array
    {
        if ($tracks !== [] && array_diff(array_column($tracks, 'status'), ['DRAFT']) !== []) {
            return ['allowed' => false, 'reason' => 'Only unused draft ranking periods can be permanently deleted.', 'dependencies' => []];
        }
        $trackIds = array_values(array_filter(array_column($tracks, 'id')));
        $cycleIds = array_values(array_unique(array_filter(array_column($tracks, 'ranking_cycle_id'))));
        $dependencies = [];
        foreach ([
            ['personnel_evaluations', 'evaluation_period_id', $trackIds, 'portfolio submissions or evaluations'],
            ['personnel_evaluation_roots', 'evaluation_period_id', $trackIds, 'portfolio snapshots'],
            ['personnel_annual_reviews', 'evaluation_period_id', $trackIds, 'annual-review records'],
            ['personnel_qualification_reviews', 'evaluation_period_id', $trackIds, 'qualification reviews'],
            ['personnel_rank_applied_for_decisions', 'ranking_track_id', $trackIds, 'rank-applied decisions'],
            ['personnel_recommended_rank_decisions', 'ranking_track_id', $trackIds, 'recommended-rank decisions'],
            ['personnel_hr_final_rank_reviews', 'ranking_track_id', $trackIds, 'HR final-rank reviews'],
            ['personnel_official_evaluation_documents', 'ranking_track_id', $trackIds, 'official evaluation documents'],
            ['personnel_offline_approved_ranks', 'ranking_track_id', $trackIds, 'approved rank records'],
            ['personnel_rank_applied_for_decisions', 'ranking_cycle_id', $cycleIds, 'rank-applied decisions'],
            ['personnel_recommended_rank_decisions', 'ranking_cycle_id', $cycleIds, 'recommended-rank decisions'],
            ['personnel_hr_final_rank_reviews', 'ranking_cycle_id', $cycleIds, 'HR final-rank reviews'],
            ['personnel_official_evaluation_documents', 'ranking_cycle_id', $cycleIds, 'official evaluation documents'],
            ['personnel_offline_approved_ranks', 'ranking_cycle_id', $cycleIds, 'approved rank records'],
        ] as [$table, $column, $ids, $label]) {
            if ($ids === [] || ! $this->db->tableExists($table) || ! $this->db->fieldExists($column, $table)) continue;
            $count = $this->db->table($table)->whereIn($column, $ids)->countAllResults();
            if ($count > 0) $dependencies[$label] = ($dependencies[$label] ?? 0) + $count;
        }
        if ($dependencies !== []) return ['allowed' => false, 'reason' => 'Deletion is blocked because this draft already has ' . implode(', ', array_map(static fn(string $label, int $count): string => "{$count} {$label}", array_keys($dependencies), $dependencies)) . '.', 'dependencies' => $dependencies];
        return ['allowed' => true, 'reason' => null, 'dependencies' => []];
    }

    /** A new schedule whose submission window has already ended could never be opened. */
    private function assertScheduleIsCurrent(array $schedule): void
    {
        if (strtotime($schedule['submission_close_at']) < time()) throw new InvalidArgumentException('SUBMISSION_PERIOD_ENDED: The submission period has already ended. Choose current or future dates.');
    }

    private function criteriaFor(array $groups): array
    {
        $criteria = [];
        foreach ($groups as $group) {
            $rows = $this->db->table('evaluation_scale_versions v')->select('v.id')->join('evaluation_scales s', 's.id=v.scale_id')->where('s.personnel_group', $group)->where('v.status', 'approved')->get()->getResultArray();
            if (count($rows) > 1) throw new RuntimeException('MULTIPLE_ACTIVE_CRITERIA: More than one active criteria version is configured for ' . self::groupLabel($group) . '.');
            if (count($rows) === 0) throw new InvalidArgumentException('CRITERIA_NOT_CONFIGURED: No active ranking criteria is configured for ' . self::groupLabel($group) . '.');
            $criteria[$group] = (string) $rows[0]['id'];
        }
        return $criteria;
    }

    /**
     * Mirrors the database rule uq_personnel_period_track_identity (type, group, academic year, coverage)
     * and the operational coverage-overlap rule, so HR gets a readable message before any write.
     */
    private function assertNoConflictingTrack(string $year, string $group): void
    {
        $conflict = $this->db->table('personnel_evaluation_periods')
            ->where('evaluation_type', self::EVALUATION_TYPE)->where('personnel_group', $group)->where('academic_year', $year)
            ->groupStart()->where('semester', self::COVERAGE_SEMESTER)->orWhereIn('status', ['DRAFT', 'OPEN_FOR_SUBMISSION', 'SUBMISSION_CLOSED', 'EVALUATION_ONGOING'])->groupEnd()
            ->countAllResults();
        if ($conflict > 0) throw new RuntimeException('DUPLICATE_RANKING_CYCLE: AY ' . str_replace('-', '–', $year) . ' already has a ' . self::groupLabel($group) . ' ranking period.');
    }

    private function trackPayload(string $cycleId, string $year, string $group, array $schedule, string $scaleVersionId): array
    {
        return [
            'ranking_cycle_id' => $cycleId,
            'evaluation_type' => self::EVALUATION_TYPE,
            'personnel_group' => $group,
            'academic_year' => $year,
            'semester' => self::COVERAGE_SEMESTER,
            'period_name' => self::generatedName($year, [$group]),
            'evaluation_scale_version_id' => $scaleVersionId,
        ] + $schedule;
    }

    private function audit(string $actorId, string $event, string $cycleId, array $context): void
    {
        if (! $this->db->tableExists('audit_logs')) return;
        $this->db->table('audit_logs')->insert([
            'id' => $this->uuid(),
            'actor_profile_id' => $actorId,
            'event_code' => $event,
            'category' => 'ranking_cycle',
            'target_type' => 'ranking_cycle',
            'target_id' => $cycleId,
            'outcome' => 'success',
            'details' => $event,
            'safe_context' => json_encode($context, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'created_at' => date('Y-m-d H:i:s'),
        ]);
    }

    private function requestKey(?string $key): string { $key = trim((string) $key); return $key !== '' && preg_match('/^[A-Za-z0-9._:-]{8,80}$/', $key) ? $key : $this->uuid(); }
    private function cycleCode(string $year): string { return 'RC-' . $year . '-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 8)); }
    private function uuid(): string { return sprintf('%04x%04x-%04x-4%03x-%04x-%04x%04x%04x',random_int(0,65535),random_int(0,65535),random_int(0,65535),random_int(0,4095),random_int(32768,49151),random_int(0,65535),random_int(0,65535),random_int(0,65535)); }
}
