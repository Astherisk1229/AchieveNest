<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;

/** Read-only, version-bound Personnel evaluation result released at completion. */
final class PersonnelCompletedEvaluationResultService
{
    public function __construct(private ?BaseConnection $db = null)
    {
        $this->db ??= db_connect();
    }

    public function get(array $actor, string $evaluationId): array
    {
        $evaluation = $this->db->table('personnel_evaluations')->where('id', $evaluationId)->get()->getRowArray();
        if (! $evaluation) throw new RuntimeException('EVALUATION_NOT_FOUND');

        $actorId = (string) ($actor['profile']['id'] ?? $actor['id'] ?? '');
        $isOwner = $actorId !== '' && $actorId === (string) $evaluation['personnel_profile_id'];
        $roles = (array) ($actor['roles'] ?? []);
        $isHr = ($actor['profile']['account_type'] ?? $actor['account_type'] ?? '') === 'hr_admin'
            && (bool) array_intersect(['hr_staff', 'hr_admin'], $roles);
        $isAssignedReviewer = $actorId !== '' && in_array($actorId, [
            (string) ($evaluation['evaluator_profile_id'] ?? ''),
            (string) ($evaluation['originating_evaluator_profile_id'] ?? ''),
        ], true);

        if (! $isOwner && ! $isHr && ! $isAssignedReviewer) throw new RuntimeException('RESULT_ACCESS_DENIED');
        if ($isOwner && ($evaluation['status'] ?? '') !== 'completed') throw new RuntimeException('RESULT_NOT_RELEASED');
        if (($evaluation['status'] ?? '') !== 'completed' && ! $isHr && ! $isAssignedReviewer) {
            throw new RuntimeException('RESULT_NOT_RELEASED');
        }

        $report = $this->db->table('personnel_evaluation_reports')
            ->where('evaluation_id', $evaluationId)
            ->orderBy('generated_at', 'DESC')->get()->getRowArray();
        if (! $report) throw new RuntimeException('RESULT_REPORT_NOT_FOUND');

        $payload = $this->decode($report['report_payload'] ?? null);
        $summary = is_array($payload['official_summary'] ?? null) ? $payload['official_summary'] : [];
        $group = strtoupper(trim((string) ($evaluation['personnel_group_snapshot'] ?? '')));
        if (! in_array($group, ['FACULTY', 'NON_TEACHING_FACULTY'], true)) {
            throw new RuntimeException('RESULT_CLASSIFICATION_UNRESOLVED');
        }

        $rootId = (string) ($evaluation['evaluation_root_id'] ?? $evaluation['id']);
        $latest = $this->db->table('personnel_evaluations')
            ->select('id, version_number')
            ->where('evaluation_root_id', $rootId)
            ->orderBy('version_number', 'DESC')->get()->getRowArray();
        if (! $latest) $latest = ['id' => $evaluation['id'], 'version_number' => $evaluation['version_number'] ?? 1];

        $criteriaSnapshot = (array) ($payload['criteria_snapshot'] ?? $this->terminalCriteria($evaluation));
        $sanitizedSummary = $this->sanitizeSummary($summary, $group);

        return [
            'result_type' => 'personnel_completed_evaluation_result',
            'release_status' => 'released',
            'evaluation' => [
                'root_id' => $rootId,
                'version_id' => (string) $evaluation['id'],
                'version_number' => (int) ($evaluation['version_number'] ?? 1),
                'is_current' => (string) $latest['id'] === (string) $evaluation['id'],
                'superseded_by_version_id' => (string) $latest['id'] === (string) $evaluation['id'] ? null : (string) $latest['id'],
                'status' => (string) $evaluation['status'],
                'completed_at' => $evaluation['finalized_at'] ?? null,
            ],
            'personnel' => [
                'profile_id' => (string) $evaluation['personnel_profile_id'],
                'group' => $group,
                'name' => $payload['personnel']['full_name'] ?? $summary['personnel_information']['name'] ?? null,
                'institutional_id' => $payload['personnel']['institutional_id'] ?? $summary['personnel_information']['personnel_id'] ?? null,
                'position' => $payload['assignment']['position'] ?? $summary['personnel_information']['position'] ?? null,
                'department' => $payload['assignment']['department'] ?? $summary['personnel_information']['department'] ?? null,
                'college' => $payload['assignment']['college'] ?? $summary['personnel_information']['college'] ?? null,
            ],
            'evaluation_period' => [
                'id' => $evaluation['evaluation_period_id'] ?? null,
                'name' => $payload['evaluation_period']['name'] ?? $evaluation['period_name_snapshot'] ?? null,
                'academic_year' => $payload['evaluation_period']['academic_year'] ?? $evaluation['academic_year'] ?? null,
            ],
            'scale_version_id' => $evaluation['evaluation_scale_version_id'] ?? $payload['criteria_version_id'] ?? null,
            'criteria_snapshot' => $criteriaSnapshot,
            'items' => array_map(fn(array $item): array => $this->sanitizeItem($item), $this->completedItems($payload, $evaluation)),
            'scores' => [
                'areas' => (array) ($payload['section_totals'] ?? []),
                'total' => (float) ($report['summary_score'] ?? $payload['grand_total'] ?? $evaluation['total_score'] ?? 0),
                'maximum' => $this->frozenScore($criteriaSnapshot, [
                    ['version', 'total_max_points'], ['version', 'overall_maximum'],
                    ['sheet', 'overall_max_points'], ['sheet', 'total_points'],
                    ['maximum_score'],
                ]),
                'passing' => $this->frozenScore($sanitizedSummary, [['passing_score']])
                    ?? $this->frozenScore($criteriaSnapshot, [
                        ['version', 'passing_score'], ['sheet', 'passing_score'], ['passing_score'],
                    ]),
                'passing_status' => $report['passing_status'] ?? null,
            ],
            'summary' => $sanitizedSummary,
            'reviewer' => [
                'name' => $payload['evaluator']['full_name'] ?? null,
                'role' => $payload['evaluator']['role'] ?? null,
            ],
            'result_snapshot' => [
                'report_id' => (string) $report['id'],
                'generated_at' => $report['generated_at'] ?? null,
                'immutable' => true,
            ],
        ];
    }

    private function sanitizeItem(array $item): array
    {
        $safe = array_intersect_key($item, array_flip([
            'id', 'achievement', 'item_description', 'criterion_code', 'criterion_key',
            'decision', 'verification_status', 'configured_points', 'awarded_points', 'rejection_reason',
            'criterion_snapshot',
        ]));
        unset($safe['criterion_snapshot']);
        $criterion = $this->decode($item['criterion_snapshot'] ?? null);
        if ($criterion !== []) $safe['criterion_snapshot'] = $criterion;

        $evidenceSnapshot = $this->decode($item['evidence_snapshot'] ?? null);
        if (($item['verification_status'] ?? '') !== 'verified') $evidenceSnapshot = [];
        $safe['evidence_snapshot'] = array_map(static fn(array $evidence): array => array_intersect_key($evidence, array_flip([
            'id', 'original_filename', 'mime_type', 'byte_size', 'sha256', 'uploaded_at', 'status',
        ])), array_values(array_filter($evidenceSnapshot, 'is_array')));
        return $safe;
    }

    private function completedItems(array $payload, array $evaluation): array
    {
        $items = array_values(array_filter((array) ($payload['items'] ?? []), 'is_array'));
        $terminal = $this->decode($evaluation['final_snapshot'] ?? null);
        $terminalItems = array_values(array_filter((array) ($terminal['items'] ?? []), 'is_array'));
        $verificationById = [];
        foreach ($terminalItems as $item) {
            if (isset($item['id'], $item['verification_status'])) {
                $verificationById[(string) $item['id']] = (string) $item['verification_status'];
            }
        }
        foreach ($items as &$item) {
            $id = (string) ($item['id'] ?? '');
            if (! isset($item['verification_status']) && $id !== '' && isset($verificationById[$id])) {
                $item['verification_status'] = $verificationById[$id];
            }
        }
        unset($item);
        return $items;
    }

    private function frozenScore(array $snapshot, array $paths): ?float
    {
        foreach ($paths as $path) {
            $value = $snapshot;
            foreach ($path as $key) {
                if (! is_array($value) || ! array_key_exists($key, $value)) continue 2;
                $value = $value[$key];
            }
            if (is_numeric($value)) return (float) $value;
        }
        return null;
    }

    private function sanitizeSummary(array $summary, string $group): array
    {
        $allowed = $group === 'FACULTY'
            ? ['format_key', 'format_version', 'personnel_information', 'present_rank', 'period_covered', 'sections', 'documents_submitted', 'total', 'passing_score', 'comments']
            : ['format_key', 'format_version', 'personnel_information', 'period_covered', 'performance_personal_indicators', 'service_leadership', 'total', 'passing_score', 'result', 'comments'];
        return array_intersect_key($summary, array_flip($allowed));
    }

    private function decode(mixed $value): array
    {
        if (is_array($value)) return $value;
        if (! is_string($value) || $value === '') return [];
        $decoded = json_decode($value, true);
        return is_array($decoded) ? $decoded : [];
    }

    private function terminalCriteria(array $evaluation): array
    {
        $terminal = $this->decode($evaluation['final_snapshot'] ?? null);
        return (array) ($terminal['criteria_snapshot'] ?? $this->decode($evaluation['criteria_snapshot'] ?? null));
    }
}
