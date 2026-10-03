<?php

namespace App\Database\Seeds;

use App\Services\RankingCycleWorkspaceReadService;
use CodeIgniter\Database\Seeder;
use RuntimeException;

/** Local-only, idempotent showcase data for the AY 2027–2028 NTF workspace tabs. */
class NtfRankingWorkspaceDemoSeeder extends Seeder
{
    private const PERIOD_NAME = 'AY 2027–2028 Non-Teaching Faculty Ranking';
    private const HR_ID = 'd0000000-0000-0000-0001-000000000005';

    public function run()
    {
        $period = $this->db->table('personnel_evaluation_periods')
            ->where('period_name', self::PERIOD_NAME)
            ->where('personnel_group', 'NON_TEACHING_FACULTY')
            ->get()->getRowArray();
        if (! $period) throw new RuntimeException('The AY 2027–2028 Non-Teaching Faculty ranking track was not found.');

        $states = [
            [
                'profile_id' => 'd0000000-0000-0000-0001-000000000004',
                'root_id' => 'd7000000-0000-0000-0001-000000000001',
                'evaluation_id' => 'd7000000-0000-0000-0002-000000000001',
                'status' => 'submitted',
                'offset' => '-2 hours',
            ],
            [
                'profile_id' => 'd0000000-0000-0000-0001-000000000006',
                'root_id' => 'd7000000-0000-0000-0001-000000000002',
                'evaluation_id' => 'd7000000-0000-0000-0002-000000000002',
                'status' => 'in_evaluation',
                'offset' => '-1 day',
            ],
            [
                'profile_id' => '10000000-0000-0000-0000-000000000007',
                'root_id' => 'd7000000-0000-0000-0001-000000000003',
                'evaluation_id' => 'd7000000-0000-0000-0002-000000000003',
                'report_id' => 'd7000000-0000-0000-0003-000000000001',
                'status' => 'completed',
                'offset' => '-3 days',
            ],
        ];

        $this->db->transStart();
        foreach ($states as $state) $this->seedState($period, $state);
        $this->verifyWorkspace($period, $states);
        $this->db->transComplete();
        if (! $this->db->transStatus()) throw new RuntimeException('The NTF workspace demo records could not be seeded.');
    }

    private function seedState(array $period, array $state): void
    {
        $person = $this->person((string) $state['profile_id']);
        $existing = $this->db->table('personnel_evaluations')
            ->where('personnel_profile_id', $person['id'])
            ->where('evaluation_period_id', $period['id'])
            ->get()->getResultArray();
        foreach ($existing as $row) {
            if ((string) $row['id'] !== $state['evaluation_id']) {
                throw new RuntimeException("Demo seed stopped: {$person['full_name']} already has a non-demo evaluation in this track.");
            }
        }

        $submittedAt = date('Y-m-d H:i:s', strtotime($state['offset']));
        $completed = $state['status'] === 'completed';
        $inProgress = $state['status'] === 'in_evaluation';
        $now = date('Y-m-d H:i:s');
        $criteria = [
            'version' => ['id' => $period['evaluation_scale_version_id'], 'total_max_points' => 150, 'passing_score' => 75],
            'sheet' => ['overall_max_points' => 150, 'passing_score' => 75],
        ];

        $root = $this->db->table('personnel_evaluation_roots')
            ->where('personnel_profile_id', $person['id'])
            ->where('evaluation_cycle_id', $period['id'])
            ->get()->getRowArray();
        $rootId = (string) ($root['id'] ?? $state['root_id']);
        $this->db->table('personnel_evaluation_roots')->upsert([
            'id' => $rootId,
            'personnel_profile_id' => $person['id'],
            'evaluation_cycle_id' => $period['id'],
            'evaluation_period_id' => $period['id'],
            'academic_year' => $period['academic_year'],
            'created_by' => $person['id'],
            'created_at' => $submittedAt,
            'updated_at' => $now,
        ]);

        $scores = $completed
            ? ['area_a' => 68.50, 'area_b' => 34.00, 'area_c' => 20.00, 'total' => 122.50]
            : ['area_a' => 0.00, 'area_b' => 0.00, 'area_c' => 0.00, 'total' => 0.00];
        $finalizedAt = $completed ? date('Y-m-d H:i:s', strtotime('-2 days')) : null;
        $items = $completed ? $this->completedItems() : [];
        $this->db->table('personnel_evaluations')->upsert([
            'id' => $state['evaluation_id'],
            'personnel_profile_id' => $person['id'],
            'evaluator_profile_id' => self::HR_ID,
            'originating_evaluator_profile_id' => self::HR_ID,
            'academic_year' => $period['academic_year'],
            'semester' => $period['semester'],
            'score_professional_development' => $scores['area_a'],
            'score_productivity_creative_work' => $scores['area_b'],
            'score_service_leadership' => $scores['area_c'],
            'area_a_score' => $scores['area_a'],
            'area_b_score' => $scores['area_b'],
            'area_c_score' => $scores['area_c'],
            'total_score' => $scores['total'],
            'passing_status' => $completed ? 'pass' : 'fail',
            'status' => $state['status'],
            'submitted_at' => $submittedAt,
            'evaluation_started_at' => ($inProgress || $completed) ? date('Y-m-d H:i:s', strtotime($state['offset'] . ' +1 hour')) : null,
            'finalized_at' => $finalizedAt,
            'finalized_by' => $completed ? self::HR_ID : null,
            'created_at' => $submittedAt,
            'updated_at' => $completed ? $finalizedAt : $now,
            'version_number' => 1,
            'evaluation_root_id' => $rootId,
            'evaluation_cycle_id' => $period['id'],
            'submission_type' => 'Personnel Ranking Evaluation',
            'evaluation_period_id' => $period['id'],
            'period_name_snapshot' => $period['period_name'],
            'evaluation_type_snapshot' => $period['evaluation_type'],
            'coverage_label_snapshot' => $period['coverage_label'] ?: 'Full Academic Year',
            'evaluation_scale_version_id' => $period['evaluation_scale_version_id'],
            'personnel_group_snapshot' => 'NON_TEACHING_FACULTY',
            'criteria_snapshot' => json_encode($criteria, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'position_title_snapshot' => $person['position_title'],
            'college_id_snapshot' => $person['college_id'],
            'college_name_snapshot' => $person['college_name'],
            'department_id_snapshot' => $person['department_id'],
            'department_name_snapshot' => $person['department_name'],
            'eligibility_snapshot' => json_encode(['fixture' => 'ntf_workspace_demo', 'eligible' => true]),
            'final_snapshot' => $completed ? json_encode(['criteria_snapshot' => $criteria, 'items' => $items], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null,
        ]);

        if ($completed) $this->seedReport($period, $person, $state, $criteria, $items, $scores, $finalizedAt);
    }

    private function person(string $profileId): array
    {
        $person = $this->db->table('profiles p')
            ->select('p.id,p.full_name,p.institutional_id,pp.position_title,pp.personnel_group')
            ->join('personnel_profiles pp', 'pp.profile_id=p.id')
            ->where('p.id', $profileId)->where('p.status', 'active')->get()->getRowArray();
        if (! $person || strtoupper((string) $person['personnel_group']) !== 'NON_TEACHING_FACULTY') {
            throw new RuntimeException("Required NTF demo profile {$profileId} was not found.");
        }
        $unit = $this->db->table('personnel_administrative_unit_affiliations pau')
            ->select('au.id,au.name,au.college_id')->join('administrative_units au', 'au.id=pau.administrative_unit_id')
            ->where('pau.personnel_profile_id', $profileId)->where('pau.is_active', 1)->get(1)->getRowArray();
        $collegeId = $this->db->table('personnel_college_affiliations')
            ->select('college_id')->where('personnel_profile_id', $profileId)->where('is_active', 1)->get(1)->getRowArray()['college_id'] ?? ($unit['college_id'] ?? null);
        $college = $collegeId ? $this->db->table('colleges')->select('name')->where('id', $collegeId)->get()->getRowArray() : null;
        return $person + [
            'department_id' => $unit['id'] ?? null,
            'department_name' => $unit['name'] ?? null,
            'college_id' => $collegeId,
            'college_name' => $college['name'] ?? null,
        ];
    }

    private function completedItems(): array
    {
        return [
            ['id' => 'demo-ntf-a', 'criterion_code' => 'A', 'achievement' => 'Two-year performance and personal indicators', 'decision' => 'approved', 'verification_status' => 'verified', 'awarded_points' => 68.50, 'criterion_snapshot' => ['code' => 'A', 'title' => 'Performance and Personal Indicators'], 'evidence_snapshot' => [['id' => 'demo-evidence-a', 'original_filename' => 'NTF_Annual_Review_Demo.xlsx', 'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'byte_size' => 5632, 'sha256' => str_repeat('a', 64), 'status' => 'active']]],
            ['id' => 'demo-ntf-b', 'criterion_code' => 'B', 'achievement' => 'Service and leadership accomplishments', 'decision' => 'approved', 'verification_status' => 'verified', 'awarded_points' => 34.00, 'criterion_snapshot' => ['code' => 'B', 'title' => 'Service and Leadership'], 'evidence_snapshot' => [['id' => 'demo-evidence-b', 'original_filename' => 'Service_Record_Demo.pdf', 'mime_type' => 'application/pdf', 'byte_size' => 4096, 'sha256' => str_repeat('b', 64), 'status' => 'active']]],
            ['id' => 'demo-ntf-c', 'criterion_code' => 'C', 'achievement' => 'Professional contribution record', 'decision' => 'approved', 'verification_status' => 'verified', 'awarded_points' => 20.00, 'criterion_snapshot' => ['code' => 'C', 'title' => 'Professional Contributions'], 'evidence_snapshot' => []],
        ];
    }

    private function seedReport(array $period, array $person, array $state, array $criteria, array $items, array $scores, string $finalizedAt): void
    {
        $payload = [
            'official_summary' => [
                'format_key' => 'NON_TEACHING_FACULTY_EVALUATION_RESULT',
                'format_version' => 1,
                'personnel_information' => ['name' => $person['full_name'], 'personnel_id' => $person['institutional_id'], 'position' => $person['position_title'], 'department' => $person['department_name'], 'college' => $person['college_name']],
                'period_covered' => $period['academic_year'],
                'performance_personal_indicators' => [
                    'title' => 'Performance and Personal Indicators',
                    'columns' => ['indicator', 'weight', 'percentage', 'ds', 'points_earned'],
                    'items' => [
                        ['criterion_code' => 'A.1', 'indicator' => 'Job Performance', 'weight' => 50, 'percentage' => 0.50, 'ds' => 79, 'points_earned' => 39.50],
                        ['criterion_code' => 'A.2', 'indicator' => 'Personal Attitudes and Qualities', 'weight' => 10, 'percentage' => 0.10, 'ds' => 80, 'points_earned' => 8.00],
                        ['criterion_code' => 'A.3', 'indicator' => 'Efficiency', 'weight' => 30, 'percentage' => 0.30, 'ds' => 70, 'points_earned' => 21.00],
                    ],
                    'points_earned' => $scores['area_a'],
                ],
                'service_leadership' => [
                    'title' => 'Service and Leadership',
                    'columns' => ['document', 'points_earned'],
                    'items' => [
                        ['criterion_code' => 'B.1', 'document' => 'Involvement in School Activities / Recognized School Organizations', 'weight' => 30, 'points_earned' => 20.00],
                        ['criterion_code' => 'B.2', 'document' => 'Community Involvement', 'weight' => 30, 'points_earned' => 14.00],
                        ['criterion_code' => 'B.3', 'document' => 'Number of Years at NDMU', 'weight' => 10, 'points_earned' => 5.00],
                        ['criterion_code' => 'B.4', 'document' => 'Invited as Judge, Lecturer, or Resource Person', 'weight' => 30, 'points_earned' => 5.00],
                        ['criterion_code' => 'B.5', 'document' => 'Recognition / Meritorious Award', 'weight' => 60, 'points_earned' => 10.00],
                    ],
                    'points_earned' => $scores['area_b'] + $scores['area_c'],
                ],
                'total' => $scores['total'],
                'passing_score' => 75,
                'result' => 'Passed',
                'comments' => 'Synthetic local demonstration result for the HR ranking workspace.',
            ],
            'personnel' => ['full_name' => $person['full_name'], 'institutional_id' => $person['institutional_id']],
            'assignment' => ['position' => $person['position_title'], 'department' => $person['department_name'], 'college' => $person['college_name']],
            'evaluation_period' => ['id' => $period['id'], 'name' => $period['period_name'], 'academic_year' => $period['academic_year']],
            'criteria_version_id' => $period['evaluation_scale_version_id'],
            'criteria_snapshot' => $criteria,
            'section_totals' => ['A' => $scores['area_a'], 'B' => $scores['area_b'], 'C' => $scores['area_c']],
            'grand_total' => $scores['total'],
            'items' => $items,
            'evaluator' => ['full_name' => 'Demo HR Administrator', 'role' => 'HR Evaluator'],
        ];
        $this->db->table('personnel_evaluation_reports')->upsert([
            'id' => $state['report_id'],
            'evaluation_id' => $state['evaluation_id'],
            'generated_by' => self::HR_ID,
            'report_payload' => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'summary_score' => $scores['total'],
            'passing_status' => 'passed',
            'generated_at' => $finalizedAt,
        ]);
    }

    private function verifyWorkspace(array $period, array $states): void
    {
        $hr = $this->db->table('profiles')->where('id', self::HR_ID)->get()->getRowArray();
        if (! $hr) throw new RuntimeException('The demo HR actor required for workspace verification was not found.');
        $actor = ['profile' => $hr, 'roles' => ['hr_staff']];
        $workspace = new RankingCycleWorkspaceReadService($this->db);
        $submissions = $workspace->submissions($actor, (string) $period['ranking_cycle_id'], 'non-teaching-faculty');
        $evaluation = $workspace->evaluation($actor, (string) $period['ranking_cycle_id'], 'non-teaching-faculty');
        $results = $workspace->results($actor, (string) $period['ranking_cycle_id'], 'non-teaching-faculty');

        $submissionIds = array_column(array_column($submissions['rows'], 'personnel'), 'id');
        $evaluationIds = array_column(array_column($evaluation['rows'], 'evaluation'), 'id');
        $resultIds = array_column(array_column($results['rows'], 'evaluation'), 'id');
        foreach ($states as $state) {
            if (! in_array($state['profile_id'], $submissionIds, true)) {
                throw new RuntimeException("Workspace verification failed: {$state['profile_id']} is missing from Submissions.");
            }
        }
        foreach (array_slice($states, 0, 2) as $state) {
            if (! in_array($state['evaluation_id'], $evaluationIds, true)) {
                throw new RuntimeException("Workspace verification failed: {$state['evaluation_id']} is missing from Evaluation.");
            }
        }
        if (! in_array($states[2]['evaluation_id'], $resultIds, true)) {
            throw new RuntimeException('Workspace verification failed: the completed demo evaluation is missing from Results.');
        }
    }
}
