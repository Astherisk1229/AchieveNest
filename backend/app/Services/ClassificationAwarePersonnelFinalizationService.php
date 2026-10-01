<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;
use Throwable;

/** Owns the production terminal boundary after a personnel evaluation is ready. */
final class ClassificationAwarePersonnelFinalizationService
{
    public const FACULTY = 'FACULTY';
    public const NON_TEACHING_FACULTY = 'NON_TEACHING_FACULTY';

    public function __construct(
        private ?BaseConnection $db = null,
        private ?ReviewerResolverService $reviewers = null,
    ) {
        $this->db ??= db_connect();
        $this->reviewers ??= new ReviewerResolverService($this->db);
    }

    public function finalize(array $actor, string $evaluationId): array
    {
        $evaluation = $this->evaluation($evaluationId);
        $group = $this->personnelGroup($evaluation);

        if ($group === self::FACULTY) {
            throw new RuntimeException('HR_FINAL_RANK_REVIEW_REQUIRED');
        }
        if ($group !== self::NON_TEACHING_FACULTY) {
            throw new RuntimeException('PERSONNEL_GROUP_UNSUPPORTED_FOR_FINALIZATION');
        }

        if (($evaluation['status'] ?? '') === 'completed') {
            return $this->completedResult($evaluation, true);
        }
        if (($evaluation['status'] ?? '') !== 'ready_for_finalization') {
            throw new RuntimeException('EVALUATION_NOT_READY_FOR_FINALIZATION');
        }

        $this->assertLatestVersion($evaluation);
        $this->assertAuthorizedHrFinalizer($actor, $evaluation);
        $this->assertEligibility($evaluation);

        $items = $this->db->table('personnel_evaluation_items')
            ->where('evaluation_id', $evaluationId)
            ->orderBy('submission_order', 'ASC')
            ->orderBy('created_at', 'ASC')
            ->get()->getResultArray();
        if ($items === []) {
            throw new RuntimeException('EVALUATION_ITEMS_REQUIRED');
        }
        $criteriaSnapshot = $evaluation['criteria_snapshot'] ?? null;
        if (is_string($criteriaSnapshot)) $criteriaSnapshot = json_decode($criteriaSnapshot, true);
        if (! is_array($criteriaSnapshot) || $criteriaSnapshot === []) {
            throw new RuntimeException('CRITERIA_SNAPSHOT_REQUIRED');
        }
        foreach ($items as $item) {
            $verification = (string) ($item['verification_status'] ?? 'pending');
            $rating = (string) ($item['rating_status'] ?? 'unrated');
            if (! in_array($verification, ['verified', 'ineligible'], true)
                || ($verification === 'verified' && $rating !== 'rated')) {
                throw new RuntimeException('EVALUATION_INCOMPLETE');
            }
            $criterion = $item['criterion_snapshot'] ?? null;
            $evidence = $item['evidence_snapshot'] ?? null;
            if (is_string($criterion)) $criterion = json_decode($criterion, true);
            if (is_string($evidence)) $evidence = json_decode($evidence, true);
            if (! is_array($criterion) || $criterion === [] || ! is_array($evidence) || $evidence === []) {
                throw new RuntimeException('IMMUTABLE_ITEM_SNAPSHOT_REQUIRED');
            }
        }

        $unresolved = $this->db->table('personnel_evaluation_deficiency_requests')
            ->where('evaluation_id', $evaluationId)
            ->whereIn('status', ['pending', 'open', 'responded'])
            ->countAllResults();
        if ($unresolved > 0) {
            throw new RuntimeException('UNRESOLVED_DEFICIENCIES');
        }

        $report = $this->db->table('personnel_evaluation_reports')
            ->where('evaluation_id', $evaluationId)
            ->orderBy('generated_at', 'DESC')->get()->getRowArray();
        if (! $report) {
            throw new RuntimeException('FINALIZATION_REPORT_SNAPSHOT_REQUIRED');
        }

        $totals = $this->totals($items);
        $now = date('Y-m-d H:i:s');
        $actorId = (string) ($actor['profile']['id'] ?? '');
        $reportSnapshot = json_decode((string) ($report['report_payload'] ?? '{}'), true) ?: [];
        $criteria = $criteriaSnapshot;
        $snapshot = [
            'snapshot_type' => 'non_teaching_faculty_terminal_completion',
            'evaluation_id' => $evaluationId,
            'evaluation_root_id' => $evaluation['evaluation_root_id'] ?? null,
            'version_number' => (int) ($evaluation['version_number'] ?? 1),
            'personnel_profile_id' => $evaluation['personnel_profile_id'],
            'personnel_group' => self::NON_TEACHING_FACULTY,
            'evaluation_period_id' => $evaluation['evaluation_period_id'] ?? null,
            'evaluation_scale_version_id' => $evaluation['evaluation_scale_version_id'] ?? null,
            'criteria_snapshot' => $criteria,
            'items' => $items,
            'scores' => $totals,
            'evaluation_summary' => $reportSnapshot,
            'report_id' => $report['id'],
            'finalizer' => ['profile_id' => $actorId, 'role' => 'hr_staff'],
            'completed_at' => $now,
        ];

        $this->db->transBegin();
        try {
            $locked = $this->db->query('SELECT status FROM personnel_evaluations WHERE id = ? FOR UPDATE', [$evaluationId])->getRowArray();
            if (($locked['status'] ?? null) === 'completed') {
                $this->db->transRollback();
                return $this->completedResult($this->evaluation($evaluationId), true);
            }
            if (($locked['status'] ?? null) !== 'ready_for_finalization') {
                throw new RuntimeException('EVALUATION_NOT_READY_FOR_FINALIZATION');
            }

            $this->db->table('personnel_evaluations')->where('id', $evaluationId)->update([
                'status' => 'completed',
                'total_score' => $totals['total_score'],
                'area_a_score' => $totals['area_a_score'],
                'area_b_score' => $totals['area_b_score'],
                'area_c_score' => $totals['area_c_score'],
                'final_snapshot' => json_encode($snapshot, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
                'finalized_at' => $now,
                'updated_at' => $now,
            ]);
            $this->db->table('personnel_evaluation_events')->insert([
                'id' => $this->uuid(),
                'evaluation_id' => $evaluationId,
                'actor_profile_id' => $actorId,
                'action' => 'finalized',
                'previous_status' => 'ready_for_finalization',
                'new_status' => 'completed',
                'remarks' => "Finalized NTF evaluation. Grand total: {$totals['total_score']}. Report ID: {$report['id']}",
                'occurred_at' => $now,
            ]);
            $this->db->transCommit();
        } catch (Throwable $e) {
            $this->db->transRollback();
            throw $e;
        }

        return ['idempotent' => false, 'report_id' => $report['id'], 'grand_total' => $totals['total_score'], 'final_snapshot' => $snapshot];
    }

    private function evaluation(string $id): array
    {
        $row = $this->db->table('personnel_evaluations')->where('id', $id)->get()->getRowArray();
        if (! $row) throw new RuntimeException('EVALUATION_NOT_FOUND');
        return $row;
    }

    private function personnelGroup(array $evaluation): string
    {
        $snapshot = strtoupper(trim((string) ($evaluation['personnel_group_snapshot'] ?? '')));
        $profile = $this->db->table('personnel_profiles')->select('personnel_group')->where('profile_id', $evaluation['personnel_profile_id'])->get()->getRowArray();
        $period = $this->db->table('personnel_evaluation_periods')->select('personnel_group')->where('id', $evaluation['evaluation_period_id'])->get()->getRowArray();
        $values = array_unique(array_filter([$snapshot, strtoupper((string) ($profile['personnel_group'] ?? '')), strtoupper((string) ($period['personnel_group'] ?? ''))]));
        if (count($values) !== 1 || ! in_array($values[0], [self::FACULTY, self::NON_TEACHING_FACULTY], true)) {
            throw new RuntimeException('PERSONNEL_GROUP_CLASSIFICATION_MISMATCH');
        }
        return $values[0];
    }

    private function assertLatestVersion(array $evaluation): void
    {
        $query = $this->db->table('personnel_evaluations');
        if (! empty($evaluation['evaluation_root_id'])) $query->where('evaluation_root_id', $evaluation['evaluation_root_id']);
        else $query->where(['personnel_profile_id' => $evaluation['personnel_profile_id'], 'evaluation_period_id' => $evaluation['evaluation_period_id']]);
        $latest = $query->orderBy('version_number', 'DESC')->get()->getRowArray();
        if (! $latest || $latest['id'] !== $evaluation['id']) throw new RuntimeException('EVALUATION_VERSION_SUPERSEDED');
    }

    private function assertAuthorizedHrFinalizer(array $actor, array $evaluation): void
    {
        $roles = $actor['roles'] ?? [];
        $actorId = (string) ($actor['profile']['id'] ?? '');
        if (($actor['profile']['account_type'] ?? '') !== 'hr_admin' || ! array_intersect(['hr_staff', 'hr_admin'], $roles)
            || $actorId === '' || $actorId !== (string) ($evaluation['evaluator_profile_id'] ?? '')) {
            throw new RuntimeException('NTF_FINALIZATION_HR_AUTHORITY_REQUIRED');
        }
        $period = $this->db->table('personnel_evaluation_periods')->where('id', $evaluation['evaluation_period_id'])->get()->getRowArray();
        $resolved = $this->reviewers->resolve((string) $evaluation['personnel_profile_id'], $period ?: null);
        if (($resolved['authority_type'] ?? '') !== 'HR' || ! $this->reviewers->isValidEvaluatorActor($actor, $resolved)) {
            throw new RuntimeException('NTF_FINALIZATION_EVALUATOR_MISMATCH');
        }
    }

    private function assertEligibility(array $evaluation): void
    {
        $snapshot = $evaluation['eligibility_snapshot'] ?? null;
        if (is_string($snapshot) && $snapshot !== '') $snapshot = json_decode($snapshot, true);
        if (is_array($snapshot) && array_key_exists('eligibility_status', $snapshot)) {
            if (($snapshot['eligibility_status'] ?? '') !== 'eligible') throw new RuntimeException('QUALIFICATION_NOT_CLEARED');
            return;
        }
        $current = (new PersonnelEligibilityService())->evaluateEligibility((string) $evaluation['personnel_profile_id'], (string) $evaluation['evaluation_period_id']);
        if (($current['eligibility_status'] ?? '') !== 'eligible') throw new RuntimeException('QUALIFICATION_NOT_CLEARED');
    }

    private function totals(array $items): array
    {
        $areas = ['A' => 0.0, 'B' => 0.0, 'C' => 0.0];
        foreach ($items as $item) {
            if (($item['verification_status'] ?? '') !== 'verified' || ($item['rating_status'] ?? '') !== 'rated') continue;
            $area = strtoupper((string) ($item['category_area'] ?? ''));
            $area = preg_replace('/^AREA_?/', '', $area);
            if (isset($areas[$area])) $areas[$area] += (float) ($item['awarded_points'] ?? 0);
        }
        $areas['A'] = min($areas['A'], 90.0); $areas['B'] = min($areas['B'], 60.0);
        return ['area_a_score' => $areas['A'], 'area_b_score' => $areas['B'], 'area_c_score' => $areas['C'], 'total_score' => array_sum($areas)];
    }

    private function completedResult(array $evaluation, bool $idempotent): array
    {
        $snapshot = is_string($evaluation['final_snapshot'] ?? null) ? (json_decode($evaluation['final_snapshot'], true) ?: []) : ($evaluation['final_snapshot'] ?? []);
        if (($snapshot['snapshot_type'] ?? '') !== 'non_teaching_faculty_terminal_completion') throw new RuntimeException('EVALUATION_ALREADY_COMPLETED');
        return ['idempotent' => $idempotent, 'report_id' => $snapshot['report_id'] ?? null, 'grand_total' => (float) ($evaluation['total_score'] ?? 0), 'final_snapshot' => $snapshot];
    }

    private function uuid(): string
    {
        $data = random_bytes(16); $data[6] = chr((ord($data[6]) & 15) | 64); $data[8] = chr((ord($data[8]) & 63) | 128);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
