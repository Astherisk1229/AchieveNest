<?php

namespace App\Services;

use RuntimeException;

/**
 * ApprovedAchievementScoringService
 *
 * Turns an approved (verified) student_portfolio_records row into criterion contributions for every
 * active award of the active award cycle, using AwardScoringService as the only rubric engine.
 *
 * Caps are per student and criterion, so a run recomputes every active award for the record's
 * student and re-synchronises the contributions of all that student's verified records:
 * - allocated_points is the engine's post-cap allocation (contributing_evidence);
 * - a changed allocation for the same scoring version updates the row in place;
 * - a contribution that no longer exists, or belongs to another scoring version, is marked
 *   superseded (never deleted); a superseded row that becomes valid again is reactivated.
 * Re-running with unchanged inputs changes nothing. Results are counts only.
 */
class ApprovedAchievementScoringService
{
    public const TABLE = 'student_achievement_criterion_contributions';
    public const SCORING_ACTIONS = ['scoring_requested', 'criteria_scored', 'scoring_failed'];

    protected $db;
    protected AwardEligibilityService $eligibilityService;
    protected AwardEvidenceMappingService $mappingService;
    protected AwardScoringService $scoringService;

    public function __construct($db = null)
    {
        $this->db = $db ?? db_connect();
        $this->eligibilityService = new AwardEligibilityService($this->db);
        $this->mappingService = new AwardEvidenceMappingService($this->db, $this->eligibilityService);
        $this->scoringService = new AwardScoringService($this->db, $this->eligibilityService, $this->mappingService);
    }

    /**
     * @return array<string, int|string> counts only
     */
    public function scoreApprovedRecord(string $recordId, ?string $actorId, string $trigger = 'approval'): array
    {
        $record = $this->db->table('student_portfolio_records')->where('id', $recordId)->get()->getRowArray();
        if ($record === null) {
            throw new RuntimeException('RECORD_NOT_FOUND');
        }
        if ($record['status'] !== 'verified') {
            throw new RuntimeException('RECORD_NOT_VERIFIED');
        }
        $cycle = $this->activeCycle();
        if ($cycle === null) {
            throw new RuntimeException('NO_ACTIVE_CYCLE');
        }
        $studentId = (string) $record['student_profile_id'];

        $this->db->transBegin();
        try {
            // Serialise scoring per student: caps are shared by all of the student's records.
            $student = $this->db->query('SELECT * FROM profiles WHERE id = ? FOR UPDATE', [$studentId])->getRowArray();
            if ($student === null) {
                throw new RuntimeException('STUDENT_NOT_FOUND');
            }

            $counts = ['awards_evaluated' => 0, 'awards_eligible' => 0, 'awards_configuration_error' => 0,
                'inserted' => 0, 'updated' => 0, 'reactivated' => 0, 'superseded' => 0, 'unchanged' => 0];
            $awards = $this->db->table('award_definitions')->where('status', 'active')->orderBy('code', 'ASC')->get()->getResultArray();
            foreach ($awards as $award) {
                $counts['awards_evaluated']++;
                $desired = [];
                $eligibility = $this->eligibilityService->evaluateStudentEligibility($award, $student);
                if ($eligibility['eligible'] ?? false) {
                    $scoring = $this->scoringService->scoreStudentForAward($award, $student);
                    if (($scoring['scoring_status'] ?? '') === 'CONFIGURATION_ERROR') {
                        // Unknown rubric configuration: keep existing rows untouched, report the count.
                        $counts['awards_configuration_error']++;
                        continue;
                    }
                    if ($scoring['is_eligible'] ?? false) {
                        $counts['awards_eligible']++;
                        $desired = $this->desiredContributions($award, $student, $scoring, (string) $cycle['id']);
                    }
                }
                $this->sync($studentId, (string) $cycle['id'], (string) $award['id'], $desired, $actorId, $counts);
            }

            $recordRows = $this->db->table(self::TABLE)->where('portfolio_record_id', $recordId)
                ->where('award_cycle_id', $cycle['id'])->where('status', 'active')->countAllResults();
            $counts['record_contributions'] = $recordRows;

            $this->audit($recordId, $actorId, 'criteria_scored', sprintf(
                'trigger=%s; awards_evaluated=%d; awards_eligible=%d; record_contributions=%d; inserted=%d; updated=%d; reactivated=%d; superseded=%d; configuration_errors=%d',
                $trigger, $counts['awards_evaluated'], $counts['awards_eligible'], $recordRows,
                $counts['inserted'], $counts['updated'], $counts['reactivated'], $counts['superseded'], $counts['awards_configuration_error']
            ));

            if ($this->db->transStatus() === false) {
                throw new RuntimeException('SCORING_PERSISTENCE_FAILED');
            }
            $this->db->transCommit();
        } catch (\Throwable $e) {
            $this->db->transRollback();
            throw $e;
        }

        return $counts + ['cycle_id' => (string) $cycle['id']];
    }

    /**
     * Marks every active contribution of a record that is no longer verified as superseded.
     */
    public function supersedeRecordContributions(string $recordId, ?string $actorId): int
    {
        $now = date('Y-m-d H:i:s');
        $this->db->table(self::TABLE)->where('portfolio_record_id', $recordId)->where('status', 'active')
            ->update(['status' => 'superseded', 'superseded_at' => $now, 'updated_at' => $now]);

        return $this->db->affectedRows();
    }

    /** Verified records that have no contribution row at all (active or superseded). */
    public function verifiedRecordsLackingContributions(?string $studentId = null): array
    {
        $builder = $this->db->table('student_portfolio_records spr')->select('spr.id')
            ->where('spr.status', 'verified')
            ->where('NOT EXISTS (SELECT 1 FROM ' . self::TABLE . ' c WHERE c.portfolio_record_id = spr.id)', null, false)
            ->orderBy('spr.id', 'ASC');
        if ($studentId !== null) {
            $builder->where('spr.student_profile_id', $studentId);
        }

        return array_column($builder->get()->getResultArray(), 'id');
    }

    /** Writes an audit/failure event. Remarks carry counts or an error code only. */
    public function audit(string $recordId, ?string $actorId, string $action, string $remarks): void
    {
        $this->db->table('student_portfolio_verification_events')->insert([
            'id'                  => $this->uuid(),
            'portfolio_record_id' => $recordId,
            'actor_profile_id'    => $actorId,
            'action'              => $action,
            'previous_status'     => 'verified',
            'new_status'          => 'verified',
            'remarks'             => $remarks,
            'occurred_at'         => date('Y-m-d H:i:s'),
        ]);
    }

    /**
     * Stable error code for an exception: a leading UPPER_SNAKE token of its message, otherwise
     * SCORING_FAILED. Never the message text or a stack trace.
     */
    public static function errorCode(\Throwable $e): string
    {
        return preg_match('/^([A-Z][A-Z0-9_]{2,63})(?::|$)/', $e->getMessage(), $m) === 1 ? $m[1] : 'SCORING_FAILED';
    }

    public function activeCycle(): ?array
    {
        return $this->db->table('award_cycles')->whereIn('status', ['active', 'evaluating'])
            ->orderBy('start_date', 'DESC')->get()->getRowArray();
    }

    /**
     * Engine post-cap allocations keyed by (record, criterion, component key).
     *
     * @return array<string, array>
     */
    protected function desiredContributions(array $award, array $student, array $scoring, string $cycleId): array
    {
        $version = trim((string) ($scoring['scoring_version'] ?? $award['active_scoring_version'] ?? ''));
        if ($version === '') {
            throw new RuntimeException('SCORING_VERSION_MISSING');
        }

        // mapping_rule per (criterion, record) from the same mapping the engine consumed.
        $package = $this->mappingService->mapStudentEvidenceForAward($award, $student);
        $mappingRules = [];
        foreach ($package['criteria'] ?? [] as $criterion) {
            foreach ($criterion['evidence'] ?? [] as $evidence) {
                $mappingRules[$criterion['criterion_id'] . '|' . $evidence['record_id']] ??= $evidence['mapping_rule'] ?? null;
            }
        }

        $desired = [];
        foreach ($scoring['contributing_evidence'] ?? [] as $row) {
            $recordId = (string) ($row['evidence_id'] ?? '');
            $criterionId = (string) ($row['criterion_id'] ?? '');
            $points = round((float) ($row['allocated_points'] ?? 0.0), 2);
            if ($recordId === '' || $criterionId === '' || $points <= 0.0) {
                continue;
            }
            $componentId = $row['component_id'] ?? null;
            $componentKey = $componentId !== null ? (string) $componentId : 'code:' . (string) ($row['component_code'] ?? 'UNSPECIFIED');
            $key = $recordId . '|' . $criterionId . '|' . $componentKey;
            if (isset($desired[$key])) {
                $desired[$key]['allocated_points'] = round($desired[$key]['allocated_points'] + $points, 2);
                continue;
            }
            $desired[$key] = [
                'portfolio_record_id'     => $recordId,
                'award_cycle_id'          => $cycleId,
                'award_definition_id'     => (string) $award['id'],
                'criterion_id'            => $criterionId,
                'criterion_component_id'  => $componentId,
                'criterion_component_key' => $componentKey,
                'scoring_rule_id'         => $this->ruleFor($criterionId, $componentId),
                'scoring_version'         => $version,
                'mapping_rule'            => $mappingRules[$criterionId . '|' . $recordId] ?? null,
                'allocated_points'        => $points,
                'basis_snapshot'          => json_encode([
                    'award_code'     => $scoring['award_code'] ?? null,
                    'criterion_code' => $row['criterion_code'] ?? null,
                    'component_code' => $row['component_code'] ?? null,
                    'component_name' => $row['component_name'] ?? null,
                    'evidence_title' => $row['evidence_title'] ?? null,
                    'scoring_status' => $scoring['scoring_status'] ?? null,
                ]),
            ];
        }

        return $desired;
    }

    protected function sync(string $studentId, string $cycleId, string $awardId, array $desired, ?string $actorId, array &$counts): void
    {
        $now = date('Y-m-d H:i:s');
        $existing = $this->db->table(self::TABLE . ' c')->select('c.*')
            ->join('student_portfolio_records spr', 'spr.id = c.portfolio_record_id')
            ->where('spr.student_profile_id', $studentId)
            ->where('c.award_cycle_id', $cycleId)
            ->where('c.award_definition_id', $awardId)
            ->get()->getResultArray();

        $byKey = [];
        foreach ($existing as $row) {
            $byKey[$row['portfolio_record_id'] . '|' . $row['criterion_id'] . '|' . $row['criterion_component_key'] . '|' . $row['scoring_version']] = $row;
        }

        $kept = [];
        foreach ($desired as $key => $row) {
            $fullKey = $key . '|' . $row['scoring_version'];
            $kept[$fullKey] = true;
            $current = $byKey[$fullKey] ?? null;
            if ($current === null) {
                $this->db->table(self::TABLE)->insert($row + [
                    'id' => $this->uuid(), 'status' => 'active', 'created_by_profile_id' => $actorId,
                    'created_at' => $now, 'updated_at' => $now,
                ]);
                $counts['inserted']++;
                continue;
            }
            $samePoints = abs((float) $current['allocated_points'] - (float) $row['allocated_points']) < 0.001;
            if ($current['status'] === 'active' && $samePoints && $current['mapping_rule'] === $row['mapping_rule']) {
                $counts['unchanged']++;
                continue;
            }
            $this->db->table(self::TABLE)->where('id', $current['id'])->update([
                'allocated_points' => $row['allocated_points'],
                'mapping_rule'     => $row['mapping_rule'],
                'scoring_rule_id'  => $row['scoring_rule_id'],
                'basis_snapshot'   => $row['basis_snapshot'],
                'status'           => 'active',
                'superseded_at'    => null,
                'updated_at'       => $now,
            ]);
            $counts[$current['status'] === 'active' ? 'updated' : 'reactivated']++;
        }

        foreach ($byKey as $fullKey => $row) {
            if (isset($kept[$fullKey]) || $row['status'] !== 'active') {
                continue;
            }
            $this->db->table(self::TABLE)->where('id', $row['id'])
                ->update(['status' => 'superseded', 'superseded_at' => $now, 'updated_at' => $now]);
            $counts['superseded']++;
        }
    }

    protected function ruleFor(string $criterionId, ?string $componentId): ?string
    {
        if ($componentId === null) {
            return null;
        }
        $rules = $this->db->table('award_scoring_rules')->select('id')
            ->where('criterion_id', $criterionId)->where('criterion_component_id', $componentId)->get()->getResultArray();

        return count($rules) === 1 ? (string) $rules[0]['id'] : null;
    }

    protected function uuid(): string
    {
        $d = random_bytes(16);
        $d[6] = chr((ord($d[6]) & 0x0f) | 0x40);
        $d[8] = chr((ord($d[8]) & 0x3f) | 0x80);

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($d), 4));
    }
}
