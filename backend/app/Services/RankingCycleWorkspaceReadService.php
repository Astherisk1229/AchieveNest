<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;

/** Read-only stage projections for the HR ranking-cycle workspace. */
final class RankingCycleWorkspaceReadService
{
    private const EVALUATION_STATUSES = [
        'submitted',
        'in_evaluation',
        'returned_for_revision',
        'ready_for_finalization',
    ];

    public function __construct(
        private ?BaseConnection $db = null,
        private ?AuthorityRankingRosterService $rosterService = null,
        private ?ReviewerResolverService $reviewerResolver = null,
        private ?PersonnelCompletedEvaluationResultService $completedResultService = null
    ) {
        $this->db ??= db_connect();
        $this->rosterService ??= new AuthorityRankingRosterService($this->db);
        $this->reviewerResolver ??= new ReviewerResolverService($this->db);
        $this->completedResultService ??= new PersonnelCompletedEvaluationResultService($this->db);
    }

    public function annualReviews(array $actor, string $cycleId, string $trackKey): array
    {
        $context = $this->context($actor, $cycleId, $trackKey);
        $rows = array_map(static function (array $entry): array {
            return $entry + ['allowed_actions' => ['view_annual_review']];
        }, $context['personnel']);

        return $this->envelope('annual_reviews', $context, $rows);
    }

    public function submissions(array $actor, string $cycleId, string $trackKey): array
    {
        $context = $this->context($actor, $cycleId, $trackKey);
        $personnelIds = $this->personnelIds($context);
        $evaluations = $this->latestEvaluationsByPersonnel($context['evaluation_period_id'], $personnelIds);
        $activity = $this->workingActivityCounts($personnelIds);
        $rows = [];

        foreach ($context['personnel'] as $entry) {
            $personnelId = (string) $entry['personnel']['id'];
            $evaluation = $evaluations[$personnelId] ?? null;
            $activityCount = $activity[$personnelId] ?? 0;
            $submissionStatus = self::submissionStatus($evaluation !== null, $activityCount);
            $canEvaluate = $evaluation ? $this->mayEvaluate($actor, $evaluation) : false;
            $rows[] = $entry + [
                'submission_status' => $submissionStatus,
                'submission_status_label' => self::submissionStatusLabel($submissionStatus),
                'working_accomplishment_count' => $activityCount,
                'evaluation' => $evaluation,
                'allowed_actions' => self::allowedActions(
                    'submissions',
                    (string) ($evaluation['status'] ?? ''),
                    $canEvaluate,
                    $this->isHr($actor),
                    $this->isAssignedEvaluator($actor, $evaluation),
                    (string) ($entry['personnel']['personnel_group'] ?? ''),
                    $evaluation !== null
                ),
            ];
        }

        return $this->envelope('submissions', $context, $rows);
    }

    public function evaluation(array $actor, string $cycleId, string $trackKey): array
    {
        $context = $this->context($actor, $cycleId, $trackKey);
        $people = $this->personnelById($context);
        $rows = [];

        foreach ($this->evaluationRows($context['evaluation_period_id'], array_keys($people), self::EVALUATION_STATUSES) as $evaluation) {
            $personnelId = (string) $evaluation['personnel_profile_id'];
            $entry = $people[$personnelId] ?? null;
            if (! $entry) continue;
            $status = (string) $evaluation['status'];
            $canEvaluate = $this->mayEvaluate($actor, $evaluation);
            $personnelGroup = (string) ($entry['personnel']['personnel_group'] ?? '');
            $allowedActions = self::allowedActions(
                'evaluation',
                $status,
                $canEvaluate,
                $this->isHr($actor),
                $this->isAssignedEvaluator($actor, $evaluation),
                $personnelGroup,
                true
            );
            $rows[] = $entry + [
                'evaluation' => $evaluation,
                'presentation_status' => self::presentationStatus($status),
                'workflow_state' => self::workflowState(
                    $status,
                    $personnelGroup,
                    (string) ($entry['eligibility']['review_responsibility'] ?? 'unresolved'),
                    $allowedActions
                ),
                'allowed_actions' => $allowedActions,
            ];
        }

        return $this->envelope('evaluation', $context, $rows);
    }

    public function results(array $actor, string $cycleId, string $trackKey): array
    {
        $context = $this->context($actor, $cycleId, $trackKey);
        $people = $this->personnelById($context);
        $rows = [];

        foreach ($this->evaluationRows($context['evaluation_period_id'], array_keys($people), ['completed']) as $evaluation) {
            $personnelId = (string) $evaluation['personnel_profile_id'];
            $entry = $people[$personnelId] ?? null;
            if (! $entry) continue;
            try {
                $result = $this->completedResultService->get($actor, (string) $evaluation['id']);
            } catch (RuntimeException $error) {
                if ($error->getMessage() === 'RESULT_REPORT_NOT_FOUND') continue;
                throw $error;
            }
            if (($result['result_snapshot']['immutable'] ?? false) !== true) continue;
            $rows[] = $entry + [
                'evaluation' => $evaluation,
                'result' => $result,
                'result_status' => 'completed',
                'report_score' => $result['scores']['total'],
                'allowed_actions' => self::allowedActions(
                    'results',
                    'completed',
                    false,
                    $this->isHr($actor),
                    $this->isAssignedEvaluator($actor, $evaluation),
                    (string) ($entry['personnel']['personnel_group'] ?? ''),
                    true
                ),
            ];
        }

        return $this->envelope('results', $context, $rows);
    }

    private function context(array $actor, string $cycleId, string $trackKey): array
    {
        return $this->rosterService->list($actor, $cycleId, $trackKey);
    }

    private function envelope(string $stage, array $context, array $rows): array
    {
        unset($context['personnel'], $context['total_personnel']);
        $locked = (bool) ($context['evaluation_period']['is_locked'] ?? false);
        // Completed and archived tracks are historical: expose view actions only.
        if ($locked) $rows = array_map(static fn(array $row): array => ['allowed_actions' => self::viewOnly($row['allowed_actions'] ?? [])] + $row, $rows);
        return $context + ['stage' => $stage, 'read_only' => $locked, 'total_rows' => count($rows), 'rows' => array_values($rows)];
    }

    private static function viewOnly(array $actions): array
    {
        return array_values(array_filter($actions, static fn(string $action): bool => str_starts_with($action, 'view_')));
    }

    private function personnelIds(array $context): array
    {
        return array_values(array_map(static fn(array $entry): string => (string) $entry['personnel']['id'], $context['personnel']));
    }

    private function personnelById(array $context): array
    {
        $people = [];
        foreach ($context['personnel'] as $entry) $people[(string) $entry['personnel']['id']] = $entry;
        return $people;
    }

    private function latestEvaluationsByPersonnel(string $periodId, array $personnelIds): array
    {
        $latest = [];
        foreach ($this->evaluationRows($periodId, $personnelIds) as $evaluation) {
            $personnelId = (string) $evaluation['personnel_profile_id'];
            if (! isset($latest[$personnelId])) $latest[$personnelId] = $evaluation;
        }
        return $latest;
    }

    private function evaluationRows(string $periodId, array $personnelIds, ?array $statuses = null): array
    {
        if ($personnelIds === []) return [];
        $builder = $this->db->table('personnel_evaluations pe')->select([
            'pe.id', 'pe.evaluation_root_id', 'pe.personnel_profile_id', 'pe.evaluation_period_id',
            'pe.academic_year', 'pe.status', 'pe.version_number', 'pe.submitted_at', 'pe.updated_at',
            'pe.evaluator_profile_id', 'pe.originating_evaluator_profile_id', 'pe.personnel_group_snapshot',
            'pe.position_title_snapshot', 'pe.department_name_snapshot', 'pe.college_name_snapshot',
        ])->where('pe.evaluation_period_id', $periodId)->whereIn('pe.personnel_profile_id', $personnelIds);
        if ($statuses !== null) $builder->whereIn('pe.status', $statuses);
        return $builder->orderBy('pe.version_number', 'DESC')->orderBy('pe.submitted_at', 'DESC')->get()->getResultArray();
    }

    private function workingActivityCounts(array $personnelIds): array
    {
        if ($personnelIds === [] || ! $this->db->tableExists('personnel_accomplishments')) return [];
        $rows = $this->db->table('personnel_accomplishments')
            ->select('personnel_profile_id, COUNT(*) AS activity_count', false)
            ->whereIn('personnel_profile_id', $personnelIds)
            ->groupBy('personnel_profile_id')->get()->getResultArray();
        $counts = [];
        foreach ($rows as $row) $counts[(string) $row['personnel_profile_id']] = (int) $row['activity_count'];
        return $counts;
    }

    private function mayEvaluate(array $actor, array $evaluation): bool
    {
        $actorId = (string) ($actor['profile']['id'] ?? '');
        if ($actorId === '' || $actorId !== (string) ($evaluation['evaluator_profile_id'] ?? '')) return false;
        try {
            $period = $this->db->table('personnel_evaluation_periods')->where('id', $evaluation['evaluation_period_id'])->get()->getRowArray();
            $resolved = $this->reviewerResolver->resolve((string) $evaluation['personnel_profile_id'], $period ?: null);
            return $this->reviewerResolver->isValidEvaluatorActor($actor, $resolved);
        } catch (\Throwable) {
            return false;
        }
    }

    private function isHr(array $actor): bool
    {
        return ($actor['profile']['account_type'] ?? '') === 'hr_admin'
            && (bool) array_intersect(['hr_staff', 'hr_admin'], (array) ($actor['roles'] ?? []));
    }

    private function isAssignedEvaluator(array $actor, ?array $evaluation): bool
    {
        if (! $evaluation) return false;
        $actorId = (string) ($actor['profile']['id'] ?? '');
        return $actorId !== '' && $actorId === (string) ($evaluation['evaluator_profile_id'] ?? '');
    }

    private static function submissionStatus(bool $hasEvaluation, int $workingActivityCount): string
    {
        if ($hasEvaluation) return 'submitted';
        return $workingActivityCount > 0 ? 'draft' : 'not_submitted';
    }

    private static function submissionStatusLabel(string $status): string
    {
        return match ($status) {
            'draft' => 'Draft',
            'submitted' => 'Submitted',
            default => 'Not Submitted',
        };
    }

    private static function presentationStatus(string $status): array
    {
        return match ($status) {
            'submitted' => ['key' => 'ready_for_evaluation', 'label' => 'Ready for Evaluation'],
            'in_evaluation' => ['key' => 'in_progress', 'label' => 'In Progress'],
            'returned_for_revision' => ['key' => 'returned_for_revision', 'label' => 'Returned for Revision'],
            'ready_for_finalization' => ['key' => 'completed', 'label' => 'Completed'],
            default => throw new RuntimeException('WORKSPACE_EVALUATION_STATUS_INVALID'),
        };
    }

    private static function workflowState(string $status, string $personnelGroup, string $responsibility, array $allowedActions): ?array
    {
        $workflowActions = ['start_evaluation', 'evaluate_items', 'return_for_revision', 'mark_ready', 'review_final_rank', 'finalize_evaluation'];
        if (array_intersect($workflowActions, $allowedActions)) return null;

        if ($status === 'returned_for_revision') {
            return ['key' => 'with_personnel_for_revision', 'label' => 'With Personnel for Revision'];
        }
        if ($status === 'ready_for_finalization') {
            return strtoupper($personnelGroup) === 'FACULTY'
                ? ['key' => 'with_hr_for_final_rank_review', 'label' => 'With HR for Final Rank Review']
                : ['key' => 'with_assigned_hr_for_finalization', 'label' => 'With Assigned HR for Finalization'];
        }

        return match (strtolower($responsibility)) {
            'dean' => ['key' => 'with_dean_for_evaluation', 'label' => 'With Dean for Evaluation'],
            'hr' => ['key' => 'with_assigned_hr_for_evaluation', 'label' => 'With Assigned HR for Evaluation'],
            default => ['key' => 'with_assigned_reviewer', 'label' => 'With Assigned Reviewer'],
        };
    }

    private static function allowedActions(
        string $stage,
        string $status,
        bool $canEvaluate,
        bool $isHr,
        bool $isAssignedEvaluator,
        string $personnelGroup,
        bool $hasEvaluation
    ): array {
        if ($stage === 'annual_reviews') return ['view_annual_review'];
        if ($stage === 'results') return ['view_result', 'view_report'];
        if (! $hasEvaluation) return ['view_personnel'];

        $actions = [$stage === 'submissions' ? 'view_submission' : 'view_evaluation'];
        if ($status === 'submitted' && $canEvaluate) $actions[] = 'start_evaluation';
        if ($status === 'in_evaluation' && $canEvaluate) {
            array_push($actions, 'evaluate_items', 'return_for_revision', 'mark_ready');
        }
        if ($status === 'ready_for_finalization' && $isHr && $isAssignedEvaluator) {
            $actions[] = strtoupper($personnelGroup) === 'FACULTY' ? 'review_final_rank' : 'finalize_evaluation';
        }
        return $actions;
    }
}
