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

    /**
     * Plain-language text for the mapping engine's exclusion reasons that still mean "this record
     * belongs to this award's categories but did not qualify". Category/subcategory mismatches and
     * unverified records are not part of the award's portfolio and are left out entirely.
     */
    public const NOT_COUNTED_REASONS = [
        AwardEvidenceMappingService::REASON_DUPLICATE_SAME_SUBSECTION => 'Duplicate of another record for the same activity.',
        AwardEvidenceMappingService::REASON_REQUIRED_METADATA_MISSING => 'A detail this criterion needs was left empty.',
        AwardEvidenceMappingService::REASON_METADATA_VALUE_UNSUPPORTED => 'A detail value is not scored by this award\'s rubric.',
        AwardEvidenceMappingService::REASON_ROLE_NOT_MET => 'The role does not meet this criterion\'s requirement.',
        AwardEvidenceMappingService::REASON_SCOPE_NOT_MET => 'The level/scope does not meet this criterion\'s requirement.',
        AwardEvidenceMappingService::REASON_JOURNALISM_NOT_PUBLISHED => 'The work is not marked as published.',
        AwardEvidenceMappingService::REASON_JOURNALISM_TYPE_UNSUPPORTED => 'This publication type is not scored by this award.',
        AwardEvidenceMappingService::REASON_SPORTS_NON_COMPETITION => 'Not a competition record.',
        AwardEvidenceMappingService::REASON_SOCIOCULTURAL_NON_COMPETITION => 'Not a competition record.',
        AwardEvidenceMappingService::REASON_JOURNALISM_SEMINAR_ZERO => 'Seminars earn no points for this award.',
    ];

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
        $scored = $this->scoredStudentsForAward($awardId);
        $candidates = array_values(array_filter(
            $scored['students'],
            static fn(array $student): bool => $student['candidate_status'] === self::STATUS_CANDIDATE
        ));

        return [
            'award' => $scored['award'],
            'cycle' => $scored['cycle'],
            'total_potential_candidates' => count($candidates),
            'potential_candidates' => $candidates,
        ];
    }

    /**
     * Every student with points for this award in the active cycle, classified (candidates, below
     * threshold, and needs attention), highest Portfolio Potential Score first. Read-only.
     *
     * @return array{award: array, cycle: array|null, students: array}
     */
    public function scoredStudentsForAward(string $awardId): array
    {
        $award = $this->loadAward($awardId);
        $cycle = $this->activeCycle();
        $result = ['award' => $award, 'cycle' => $this->cyclePayload($cycle), 'students' => []];
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

        $students = [];
        foreach ($totals as $row) {
            $student = $this->loadStudent((string) $row['student_profile_id']);
            if ($student === null) {
                continue;
            }
            $students[] = $this->studentPayload($student) + $this->classify($award, (float) $row['earned'], $this->studentEligible($award, $student)) + [
                'identified_at' => $row['identified_at'],
                'field_availability' => [
                    'raw_portfolio_score' => ['status' => 'AVAILABLE'],
                    'computable_max_score' => ['status' => 'AVAILABLE'],
                    'portfolio_potential_score' => ['status' => 'AVAILABLE'],
                ],
            ];
        }
        usort($students, static fn(array $a, array $b): int => [$b['portfolio_potential_score'], $a['student_name']] <=> [$a['portfolio_potential_score'], $b['student_name']]);
        $result['students'] = $students;

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
                ->orderBy('ac.sort_order', 'ASC')
                ->get()->getResultArray();
        }

        $storage = new LocalEvidenceStorageService();
        $evidenceByRecord = [];
        $recordIds = array_values(array_unique(array_column($rows, 'portfolio_record_id')));
        if ($recordIds !== []) {
            $files = $this->db->table('student_portfolio_evidence')->whereIn('portfolio_record_id', $recordIds)
                ->where('status', 'active')->orderBy('uploaded_at', 'ASC')->get()->getResultArray();
            foreach ($files as $file) {
                $evidenceByRecord[$file['portfolio_record_id']][] = self::evidencePayload($storage, $file);
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
                'activity_date' => self::achievementDate($row),
                'end_date' => $row['end_date'],
                'approved_at' => $row['verified_at'],
                'criterion_id' => $row['criterion_id'],
                'criterion_name' => $row['criterion_name'],
                'component_name' => $row['component_name'] ?? ($snapshot['component_name'] ?? null),
                'points' => $points,
                'evidence' => $evidenceByRecord[$row['portfolio_record_id']] ?? [],
            ];
        }

        $items = self::sortNewestFirst($items);

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
            'ordering' => self::ORDERING,
        ] + $this->portfolioSection($awardId, $student, $cycle, $eligible, $items) + $this->classify($award, round($earned, 2), $eligible);
    }

    /**
     * Both lists are ordered by the achievement's own date, newest first. The achievement date is
     * start_date (the date the student enters; required for submission), falling back to
     * occurrence_date, which the form and API store as a copy of start_date. Ties: later end_date
     * first, then title, then record id (stable). Records without a date go last.
     */
    public const ORDERING = 'ACHIEVEMENT_DATE_DESC';

    public static function achievementDate(array $record): ?string
    {
        $date = trim((string) ($record['start_date'] ?? '')) ?: trim((string) ($record['occurrence_date'] ?? ''));

        return $date !== '' ? substr($date, 0, 10) : null;
    }

    public static function sortNewestFirst(array $rows): array
    {
        usort($rows, static function (array $a, array $b): int {
            $da = (string) ($a['activity_date'] ?? '');
            $db = (string) ($b['activity_date'] ?? '');
            if (($da === '') !== ($db === '')) {
                return $da === '' ? 1 : -1;
            }

            return [$db, (string) ($b['end_date'] ?? ''), (string) ($a['achievement_title'] ?? ''), (string) ($a['record_id'] ?? '')]
                <=> [$da, (string) ($a['end_date'] ?? ''), (string) ($b['achievement_title'] ?? ''), (string) ($b['record_id'] ?? '')];
        });

        return $rows;
    }

    /** Safe evidence reference plus file_kind (pdf, image, other) from the detected MIME type. */
    public static function evidencePayload(LocalEvidenceStorageService $storage, array $file): array
    {
        $safe = $storage->formatSafeEvidence($file, 'student', false);
        $mime = strtolower((string) ($safe['detected_mime_type'] ?? ''));
        $safe['file_kind'] = $mime === 'application/pdf' ? 'pdf' : (str_starts_with($mime, 'image/') ? 'image' : 'other');

        return $safe;
    }

    /**
     * The award-applicable portfolio: every approved achievement that the award's own evidence
     * mapping assigns to this award, counted or not.
     *
     * - counted / points: the saved points of approval-time scoring (the authoritative total).
     * - not_counted_reason: taken from the scoring engine's own per-achievement trace for this
     *   student and award (AwardScoringService::scoreStudentForAward, read-only), or from the
     *   mapping's exclusion reason. reason_code says which rule produced it.
     * - scoring_in_sync: false when today's engine allocation differs from the saved points
     *   (for example after a rule change); the saved points are still what is shown.
     */
    protected function portfolioSection(string $awardId, array $student, ?array $cycle, bool $eligible, array $items): array
    {
        if (! $eligible) {
            return ['portfolio' => [], 'scoring_in_sync' => true];
        }
        $raw = $this->db->table('award_definitions')->where('id', $awardId)->get()->getRowArray();
        $mapping = new AwardEvidenceMappingService($this->db, $this->eligibility);
        $package = $mapping->mapStudentEvidenceForAward($raw, $student);
        $engine = (new AwardScoringService($this->db, $this->eligibility, $mapping))->scoreStudentForAward($raw, $student);

        $entries = [];
        foreach ($package['criteria'] ?? [] as $criterion) {
            foreach ($criterion['evidence'] ?? [] as $evidence) {
                $id = (string) ($evidence['record_id'] ?? '');
                if ($id !== '') {
                    $entries[$id]['criteria'][(string) $criterion['criterion_id']] = (string) ($criterion['criterion_name'] ?? '');
                }
            }
        }
        foreach ($package['excluded_records'] ?? [] as $excluded) {
            $id = (string) ($excluded['record_id'] ?? '');
            $code = (string) ($excluded['reason'] ?? '');
            if ($id !== '' && isset(self::NOT_COUNTED_REASONS[$code]) && ! isset($entries[$id])) {
                $entries[$id]['excluded'] = ['code' => $code, 'text' => self::NOT_COUNTED_REASONS[$code]];
            }
        }
        // A saved point row always belongs in the portfolio, even if today's mapping no longer lists it.
        foreach ($items as $item) {
            $entries[$item['record_id']]['criteria'][(string) $item['criterion_id']] = (string) $item['criterion_name'];
        }
        if ($entries === []) {
            return ['portfolio' => [], 'scoring_in_sync' => true];
        }

        $saved = [];
        foreach ($items as $item) {
            $saved[$item['record_id']] = round(($saved[$item['record_id']] ?? 0.0) + (float) $item['points'], 2);
        }
        $live = [];
        foreach ($engine['contributing_evidence'] ?? [] as $row) {
            $id = (string) ($row['evidence_id'] ?? '');
            $live[$id] = round(($live[$id] ?? 0.0) + (float) ($row['allocated_points'] ?? 0), 2);
        }
        $traces = [];
        foreach ($engine['evidence_traceability'] ?? [] as $trace) {
            $traces[(string) ($trace['record_id'] ?? '')][] = $trace;
        }
        $engineAvailable = ($engine['scoring_status'] ?? '') !== 'CONFIGURATION_ERROR';
        $inSync = true;

        $records = $this->db->table('student_portfolio_records spr')
            ->select('spr.id, spr.title, spr.organizer_or_body, spr.occurrence_date, spr.start_date, spr.end_date, spr.verified_at, pc.name AS category_name, ps.name AS subcategory_name')
            ->join('portfolio_categories pc', 'pc.id = spr.category_id', 'left')
            ->join('portfolio_subcategories ps', 'ps.id = spr.subcategory_id', 'left')
            ->whereIn('spr.id', array_keys($entries))->where('spr.status', 'verified')
            ->get()->getResultArray();

        $storage = new LocalEvidenceStorageService();
        $files = [];
        foreach ($this->db->table('student_portfolio_evidence')->whereIn('portfolio_record_id', array_keys($entries))
            ->where('status', 'active')->orderBy('uploaded_at', 'ASC')->get()->getResultArray() as $file) {
            $files[$file['portfolio_record_id']][] = self::evidencePayload($storage, $file);
        }

        $portfolio = [];
        foreach ($records as $record) {
            $id = (string) $record['id'];
            $entry = $entries[$id];
            $points = $saved[$id] ?? 0.0;
            if ($engineAvailable && abs(($live[$id] ?? 0.0) - $points) > 0.001) {
                $inSync = false;
            }
            $reason = $points > 0.0 ? null : $this->notCountedReason($entry, $traces[$id] ?? [], $live[$id] ?? 0.0, $engineAvailable);
            $portfolio[] = [
                'record_id' => $id,
                'achievement_title' => $record['title'],
                'organizer' => $record['organizer_or_body'],
                'category_name' => $record['category_name'],
                'subcategory_name' => $record['subcategory_name'],
                'activity_date' => self::achievementDate($record),
                'end_date' => $record['end_date'],
                'approved_at' => $record['verified_at'],
                'criteria' => array_values(array_filter($entry['criteria'] ?? [])),
                'counted' => $points > 0.0,
                'points' => $points,
                'not_counted_reason' => $reason['text'] ?? null,
                'reason_code' => $reason['code'] ?? null,
                'evidence' => $files[$id] ?? [],
            ];
        }

        return ['portfolio' => self::sortNewestFirst($portfolio), 'scoring_in_sync' => $inSync];
    }

    /**
     * Why an award-applicable achievement has no saved points, read from the engine's own trace.
     *
     * @return array{code: string, text: string}
     */
    protected function notCountedReason(array $entry, array $traces, float $livePoints, bool $engineAvailable): array
    {
        if (isset($entry['excluded'])) {
            return $entry['excluded'];
        }
        if (! $engineAvailable) {
            return ['code' => 'ENGINE_UNAVAILABLE', 'text' => 'The scoring engine could not evaluate this award\'s configuration, so no reason is available.'];
        }
        if ($livePoints > 0.0) {
            return ['code' => 'SCORE_NOT_REFRESHED', 'text' => 'The current scoring rules give this achievement points, but its saved score has not been refreshed yet.'];
        }
        foreach ($traces as $trace) {
            if (! empty($trace['scoring_warning'])) {
                return ['code' => (string) ($trace['warning_code'] ?? 'SCORING_WARNING'), 'text' => (string) $trace['scoring_warning']];
            }
        }
        foreach ($traces as $trace) {
            if (! empty($trace['note'])) {
                return ['code' => 'ENGINE_NOTE', 'text' => (string) $trace['note'] . '.'];
            }
        }
        foreach ($traces as $trace) {
            $rule = (string) ($trace['rule_type'] ?? '');
            $base = (float) ($trace['base_points'] ?? 0);
            $selected = (bool) ($trace['is_selected'] ?? false);
            if ($rule === 'HIGHEST_APPLICABLE_ONLY' && ! $selected) {
                return ['code' => 'HIGHEST_ONLY_NOT_SELECTED', 'text' => 'Only the highest qualifying achievement counts for this criterion; another achievement with an equal or higher value was used.'];
            }
            if ($selected && ((float) ($trace['contribution_points'] ?? 0) > 0.0 || $base > 0.0)) {
                return ['code' => 'CRITERION_MAXIMUM_REACHED', 'text' => 'The criterion\'s maximum points were already reached by other achievements.'];
            }
            if ($rule === 'FIXED_PRESENCE' && ! $selected) {
                return ['code' => 'PRESENCE_ALREADY_COUNTED_OR_TYPE_NOT_SCORED', 'text' => 'This criterion awards each involvement type once; this type was already counted or is not one the criterion scores.'];
            }
            if (in_array($rule, ['DISTINCT_ADDITIVE_WITH_CAP', 'ACCUMULATE_WITH_CAP', 'COUNT_PER_RECORD_CAPPED'], true) && (float) ($trace['contribution_points'] ?? 0) <= 0.0 && $base > 0.0) {
                return ['code' => 'CRITERION_MAXIMUM_REACHED', 'text' => 'The criterion\'s maximum points were already reached by other achievements.'];
            }
        }

        return ['code' => 'NO_POINTS_UNDER_RULES', 'text' => 'The award\'s scoring rules give no points for this achievement\'s details.'];
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
