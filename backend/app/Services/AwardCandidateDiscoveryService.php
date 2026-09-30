<?php

namespace App\Services;

use RuntimeException;

/**
 * AwardCandidateDiscoveryService
 *
 * Potential candidates come straight from the points of approved achievements: the active rows of
 * student_achievement_criterion_contributions (written on approval by ApprovedAchievementScoringService)
 * for verified records in the active award cycle. There is no manual OSAD evaluation step and nothing
 * is written here — OSAD only views, prints and exports.
 *
 * Portfolio Potential Score = earned points / computable maximum x 100, where the computable maximum is
 * the sum of max_points of the award's non-human-only criteria (the same figure the award pages show).
 * A student is a Potential Candidate when that score is >= the award's candidate threshold.
 */
class AwardCandidateDiscoveryService
{
    public const STATUS_CANDIDATE = 'POTENTIAL_CANDIDATE';
    public const STATUS_BELOW = 'BELOW_THRESHOLD';
    public const STATUS_ATTENTION = 'NEEDS_ATTENTION';

    protected $db;
    protected AwardEligibilityService $eligibility;

    public function __construct($db = null, ?AwardEligibilityService $eligibility = null)
    {
        $this->db = $db ?? db_connect();
        $this->eligibility = $eligibility ?? new AwardEligibilityService($this->db);
    }

    /**
     * Award row as the OSAD award pages present it (criteria, computable maximum, threshold, authority).
     * Shared by the catalog, the award page, the candidate list and the evaluation summary so the
     * maximum and threshold can never differ between them.
     */
    public static function describeAward($db, array $award): array
    {
        $version = $db->table('award_scoring_model_versions')->where('award_definition_id', $award['id'])
            ->where('status', 'published')->orderBy('version_number', 'DESC')->get()->getRowArray();
        $criteria = $db->table('award_criteria')->where('award_definition_id', $award['id'])
            ->orderBy('sort_order', 'ASC')->get()->getResultArray();
        $computableMaximum = 0.0;
        foreach ($criteria as &$criterion) {
            $rules = $db->table('award_scoring_rules')->where('criterion_id', $criterion['id'])->where('is_active', 1)
                ->orderBy('sort_order', 'ASC')->get()->getResultArray();
            $rulesByComponent = [];
            foreach ($rules as $rule) {
                if (! empty($rule['criterion_component_id'])) {
                    $rulesByComponent[$rule['criterion_component_id']] = $rule;
                }
            }
            $components = $db->table('award_criterion_components')->where('criterion_id', $criterion['id'])
                ->orderBy('sort_order', 'ASC')->get()->getResultArray();
            $criterion['components'] = array_map(
                static fn(array $component): array => AwardApiContractService::criterionComponent($component, $rulesByComponent[$component['id']] ?? null),
                $components
            );
            $criterionRule = count($rules) === 1 ? $rules[0] : null;
            $criterion = AwardApiContractService::criterion(array_merge($criterion, $criterionRule ?? []));
            if (! $criterion['human_only']) {
                $computableMaximum += (float) ($criterion['max_points'] ?? 0.0);
            }
        }
        unset($criterion);
        $award['criteria'] = $criteria;
        $award['human_only_criteria'] = array_values(array_filter($criteria, static fn(array $criterion): bool => $criterion['human_only']));
        $award['computable_max_score'] = $computableMaximum;

        return AwardApiContractService::award($award, $version);
    }

    public function activeCycle(): ?array
    {
        return $this->db->table('award_cycles')->whereIn('status', ['active', 'evaluating'])
            ->orderBy('start_date', 'DESC')->get()->getRowArray();
    }

    /**
     * @return array{award: array, cycle: array|null, total_potential_candidates: int, potential_candidates: array}
     */
    public function candidatesForAward(string $awardId): array
    {
        $award = $this->loadAward($awardId);
        $cycle = $this->activeCycle();
        $result = ['award' => $award, 'cycle' => $this->cyclePayload($cycle), 'total_potential_candidates' => 0, 'potential_candidates' => []];
        if ($cycle === null) {
            return $result;
        }

        $totals = $this->db->table(ApprovedAchievementScoringService::TABLE . ' c')
            ->select('spr.student_profile_id, SUM(c.allocated_points) AS earned, MAX(c.updated_at) AS identified_at', false)
            ->join('student_portfolio_records spr', "spr.id = c.portfolio_record_id AND spr.status = 'verified'")
            ->where('c.award_cycle_id', $cycle['id'])
            ->where('c.award_definition_id', $awardId)
            ->where('c.status', 'active')
            ->groupBy('spr.student_profile_id')
            ->get()->getResultArray();

        $candidates = [];
        foreach ($totals as $row) {
            $student = $this->loadStudent((string) $row['student_profile_id']);
            if ($student === null || ! $this->studentEligible($award, $student)) {
                continue;
            }
            $score = $this->classify($award, (float) $row['earned']);
            if ($score['candidate_status'] !== self::STATUS_CANDIDATE) {
                continue;
            }
            $candidates[] = $this->studentPayload($student) + $score + [
                'identified_at' => $row['identified_at'],
                'field_availability' => [
                    'raw_portfolio_score' => ['status' => 'AVAILABLE'],
                    'computable_max_score' => ['status' => 'AVAILABLE'],
                    'portfolio_potential_score' => ['status' => 'AVAILABLE'],
                ],
            ];
        }
        usort($candidates, static fn(array $a, array $b): int => [$b['portfolio_potential_score'], $a['student_name']] <=> [$a['portfolio_potential_score'], $b['student_name']]);

        $result['potential_candidates'] = $candidates;
        $result['total_potential_candidates'] = count($candidates);

        return $result;
    }

    /**
     * Evaluation summary of one student for one award: the approved achievements that earned points,
     * with criterion, points and evidence files, plus per-criterion subtotals and the classification.
     */
    public function summaryForStudent(string $awardId, string $studentId): array
    {
        $award = $this->loadAward($awardId);
        $student = $this->loadStudent($studentId);
        if ($student === null) {
            throw new \InvalidArgumentException('STUDENT_NOT_FOUND');
        }
        $cycle = $this->activeCycle();

        $rows = [];
        if ($cycle !== null) {
            $rows = $this->db->table(ApprovedAchievementScoringService::TABLE . ' c')
                ->select([
                    'c.id', 'c.portfolio_record_id', 'c.criterion_id', 'c.criterion_component_id', 'c.allocated_points', 'c.basis_snapshot',
                    'spr.title', 'spr.organizer_or_body', 'spr.occurrence_date', 'spr.start_date', 'spr.end_date', 'spr.verified_at',
                    'pc.name AS category_name', 'ps.name AS subcategory_name',
                    'ac.name AS criterion_name', 'ac.sort_order AS criterion_sort',
                    'acc.name AS component_name',
                ])
                ->join('student_portfolio_records spr', "spr.id = c.portfolio_record_id AND spr.status = 'verified'")
                ->join('portfolio_categories pc', 'pc.id = spr.category_id', 'left')
                ->join('portfolio_subcategories ps', 'ps.id = spr.subcategory_id', 'left')
                ->join('award_criteria ac', 'ac.id = c.criterion_id')
                ->join('award_criterion_components acc', 'acc.id = c.criterion_component_id', 'left')
                ->where('spr.student_profile_id', $studentId)
                ->where('c.award_cycle_id', $cycle['id'])
                ->where('c.award_definition_id', $awardId)
                ->where('c.status', 'active')
                ->orderBy('ac.sort_order', 'ASC')->orderBy('spr.title', 'ASC')
                ->get()->getResultArray();
        }

        $storage = new LocalEvidenceStorageService();
        $evidenceByRecord = [];
        $recordIds = array_values(array_unique(array_column($rows, 'portfolio_record_id')));
        if ($recordIds !== []) {
            $files = $this->db->table('student_portfolio_evidence')->whereIn('portfolio_record_id', $recordIds)
                ->where('status', 'active')->orderBy('uploaded_at', 'ASC')->get()->getResultArray();
            foreach ($files as $file) {
                $evidenceByRecord[$file['portfolio_record_id']][] = $storage->formatSafeEvidence($file, 'student', false);
            }
        }

        $earned = 0.0;
        $byCriterion = [];
        $items = [];
        foreach ($rows as $row) {
            $points = round((float) $row['allocated_points'], 2);
            $earned += $points;
            $byCriterion[$row['criterion_id']] = round(($byCriterion[$row['criterion_id']] ?? 0.0) + $points, 2);
            $snapshot = json_decode((string) ($row['basis_snapshot'] ?? ''), true) ?: [];
            $items[] = [
                'id' => $row['id'],
                'record_id' => $row['portfolio_record_id'],
                'achievement_title' => $row['title'],
                'organizer' => $row['organizer_or_body'],
                'category_name' => $row['category_name'],
                'subcategory_name' => $row['subcategory_name'],
                'activity_date' => $row['occurrence_date'] ?: $row['start_date'],
                'end_date' => $row['end_date'],
                'approved_at' => $row['verified_at'],
                'criterion_id' => $row['criterion_id'],
                'criterion_name' => $row['criterion_name'],
                'component_name' => $row['component_name'] ?? ($snapshot['component_name'] ?? null),
                'points' => $points,
                'evidence' => $evidenceByRecord[$row['portfolio_record_id']] ?? [],
            ];
        }

        $criteria = [];
        foreach ($award['criteria'] as $criterion) {
            if ($criterion['human_only']) {
                continue;
            }
            $id = $criterion['criterion_id'];
            $criteria[] = [
                'criterion_id' => $id,
                'criterion_name' => $criterion['criterion_name'],
                'max_points' => $criterion['max_points'],
                'earned_points' => $byCriterion[$id] ?? 0.0,
            ];
        }

        $eligible = $this->studentEligible($award, $student);

        return [
            'award' => [
                'id' => $award['id'], 'code' => $award['code'] ?? null, 'name' => $award['name'],
                'authority_status' => $award['authority_status'],
            ],
            'student' => $this->studentPayload($student),
            'cycle' => $this->cyclePayload($cycle),
            'generated_at' => date('Y-m-d H:i:s'),
            'items' => $items,
            'criteria' => $criteria,
            'human_only_criteria' => array_values(array_map(static fn(array $c): string => (string) $c['criterion_name'], $award['human_only_criteria'])),
            'student_eligible' => $eligible,
        ] + $this->classify($award, round($earned, 2), $eligible);
    }

    protected function loadAward(string $awardId): array
    {
        $row = $this->db->table('award_definitions')->where('id', $awardId)->where('status', 'active')->get()->getRowArray();
        if ($row === null) {
            throw new \InvalidArgumentException('AWARD_NOT_FOUND');
        }
        $award = self::describeAward($this->db, $row);
        if ($award['configuration_status'] === 'AWARD_AUTHORITY_PENDING') {
            throw new RuntimeException('AWARD_AUTHORITY_PENDING');
        }
        if (! $award['configuration_valid'] || ! ((float) $award['computable_max_score'] > 0.0)) {
            throw new RuntimeException('AWARD_CONFIGURATION_ERROR');
        }

        return $award;
    }

    /** Earned points against the award's computable maximum and threshold. */
    protected function classify(array $award, float $earned, bool $eligible = true): array
    {
        $maximum = (float) $award['computable_max_score'];
        $threshold = (float) $award['candidate_threshold_percent'];
        $percent = $maximum > 0.0 ? round($earned / $maximum * 100, 2) : 0.0;
        $status = match (true) {
            ! $eligible, $earned > $maximum + 0.001 => self::STATUS_ATTENTION,
            $earned / $maximum * 100 >= $threshold => self::STATUS_CANDIDATE,
            default => self::STATUS_BELOW,
        };

        return [
            'raw_portfolio_score' => round($earned, 2),
            'computable_max_score' => round($maximum, 2),
            'raw_qualifying_score' => $award['raw_qualifying_score'],
            'portfolio_potential_score' => $percent,
            'candidate_threshold_percent' => $threshold,
            'candidate_status' => $status,
            'scoring_status' => 'SCORED',
        ];
    }

    protected function studentEligible(array $award, array $student): bool
    {
        $result = $this->eligibility->evaluateStudentEligibility($award, $student);

        return (bool) ($result['eligible'] ?? $result['is_eligible'] ?? false);
    }

    protected function loadStudent(string $studentId): ?array
    {
        return $this->db->table('profiles')->where('id', $studentId)->where('account_type', 'student')->get()->getRowArray();
    }

    protected function studentPayload(array $student): array
    {
        $program = $this->db->table('student_program_enrollments spe')
            ->select('ap.name, ap.code')
            ->join('academic_programs ap', "ap.id = spe.academic_program_id AND ap.status = 'active'")
            ->where('spe.student_profile_id', $student['id'])->where('spe.is_active', 1)
            ->get()->getResultArray();

        return [
            'student_id' => $student['id'],
            'student_name' => $student['full_name'] ?? null,
            'student_id_number' => $student['institutional_id'] ?? null,
            // One active program is the norm; anything else is shown as unavailable rather than guessed.
            'program' => count($program) === 1 ? $program[0]['name'] : null,
        ];
    }

    protected function cyclePayload(?array $cycle): ?array
    {
        return $cycle === null ? null : [
            'id' => $cycle['id'],
            'name' => $cycle['name'] ?? null,
            'academic_year' => $cycle['academic_year'] ?? null,
        ];
    }
}
