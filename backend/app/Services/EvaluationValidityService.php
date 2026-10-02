<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;

/**
 * The one ranking-cycle eligibility gate for personnel portfolio records.
 *
 * The permanent portfolio keeps every record. When a portfolio is submitted for a ranking
 * cycle, only records this service marks ELIGIBLE are copied into the evaluation snapshot;
 * everything downstream (Dean/HR review, scoring, totals, ranking, summaries, printing)
 * reads that snapshot, so no other module repeats these date rules.
 *
 * Validity types (by canonical criterion code, per personnel group):
 *   PERIOD        must belong to the cycle's achievement coverage
 *                 single date: coverage_start <= date <= coverage_end
 *                 date range:  start <= coverage_end AND end >= coverage_start (ongoing = no end)
 *   QUALIFICATION remains valid once obtained: date <= coverage_end
 *   COMPUTED      not an ordinary record (Years of Service; NTF Area A from the annual review);
 *                 calculated elsewhere with the cycle cutoff, so portfolio entries are not copied
 *   UNRESOLVED    official meaning not confirmed (graduate units); kept exactly as before
 *
 * Statuses: ELIGIBLE, OUTSIDE_CYCLE, NEEDS_INFORMATION. Missing dates are never guessed.
 */
final class EvaluationValidityService
{
    public const PERIOD = 'PERIOD';
    public const QUALIFICATION = 'QUALIFICATION';
    public const COMPUTED = 'COMPUTED';
    public const UNRESOLVED = 'UNRESOLVED';

    public const ELIGIBLE = 'ELIGIBLE';
    public const OUTSIDE_CYCLE = 'OUTSIDE_CYCLE';
    public const NEEDS_INFORMATION = 'NEEDS_INFORMATION';

    /** Criterion (area.number) → validity type. Faculty A.1 is split by subcategory below. */
    private const FACULTY = [
        'A.2' => self::PERIOD, 'A.3' => self::PERIOD,
        'B.1' => self::PERIOD, 'B.2' => self::PERIOD, 'B.3' => self::PERIOD,
        'B.4' => self::PERIOD, 'B.5' => self::PERIOD, 'B.6' => self::PERIOD,
        'C.1' => self::PERIOD, 'C.2' => self::PERIOD,
        'C.3' => self::COMPUTED,
    ];
    private const FACULTY_DEGREES = [
        'A1_PHD_HOLDER' => self::QUALIFICATION, 'A.1.1' => self::QUALIFICATION,
        'A1_MA_HOLDER' => self::QUALIFICATION, 'A.1.3' => self::QUALIFICATION,
        // Graduate units: cumulative units held, or units earned in a period? Not confirmed.
        'A1_PHD_UNITS' => self::UNRESOLVED, 'A.1.2' => self::UNRESOLVED,
        'A1_MA_UNITS' => self::UNRESOLVED, 'A.1.4' => self::UNRESOLVED,
    ];
    private const NON_TEACHING = [
        'A.1' => self::COMPUTED, 'A.2' => self::COMPUTED, 'A.3' => self::COMPUTED,
        'B.1' => self::PERIOD, 'B.2' => self::PERIOD,
        'B.3' => self::COMPUTED,
        'B.4' => self::PERIOD, 'B.5' => self::PERIOD,
    ];

    public function __construct(private ?BaseConnection $db = null)
    {
    }

    public static function validityTypeFor(string $personnelGroup, ?string $categoryCode, ?string $subcategoryCode = null): ?string
    {
        $criterion = self::criterion($categoryCode) ?? self::criterion($subcategoryCode);
        if ($criterion === null) return null;
        if (self::isNonTeaching($personnelGroup)) return self::NON_TEACHING[$criterion] ?? null;
        if ($criterion === 'A.1') return self::FACULTY_DEGREES[strtoupper(trim((string) $subcategoryCode))] ?? null;
        return self::FACULTY[$criterion] ?? null;
    }

    /**
     * Pure decision for one portfolio record against a coverage window.
     *
     * @param array $record   personnel_accomplishments row (category_metadata may be JSON)
     * @param array $coverage ['start' => 'Y-m-d', 'end' => 'Y-m-d']
     */
    public static function evaluate(array $record, array $coverage, string $personnelGroup): array
    {
        $metadata = self::metadata($record);
        $type = self::validityTypeFor($personnelGroup, $record['category_code'] ?? null, $metadata['subcategory_code'] ?? null);
        $start = (string) $coverage['start'];
        $end = (string) $coverage['end'];

        if ($type === null) {
            return self::result(self::NEEDS_INFORMATION, null, 'The ranking criterion of this record is missing or not recognised, so its validity for this cycle cannot be determined.');
        }
        if ($type === self::COMPUTED) {
            return self::result(self::OUTSIDE_CYCLE, $type, 'This value is calculated by the system for the cycle (for example Years of Service from the HR service history), so portfolio entries for it are not counted.');
        }
        if ($type === self::UNRESOLVED) {
            return self::result(self::ELIGIBLE, $type, 'Included as before: the cycle rule for graduate units is awaiting HR confirmation.');
        }

        if ($type === self::QUALIFICATION) {
            $date = self::firstDate($record['occurrence_date'] ?? null, $metadata['date'] ?? null, $metadata['start_date'] ?? null);
            if ($date === null) return self::result(self::NEEDS_INFORMATION, $type, 'The date the qualification was obtained is missing.');
            return $date <= $end
                ? self::result(self::ELIGIBLE, $type, 'Qualification obtained on or before the end of the cycle coverage.', $date)
                : self::result(self::OUTSIDE_CYCLE, $type, 'Qualification obtained after the end of the cycle coverage.', $date);
        }

        // PERIOD
        $range = self::range($record, $metadata);
        if ($range !== null) {
            [$from, $to, $ongoing] = $range;
            if ($from === null) return self::result(self::NEEDS_INFORMATION, $type, 'The start date of this activity is missing.');
            if (! $ongoing && $to === null) return self::result(self::NEEDS_INFORMATION, $type, 'The end date of this activity is missing.');
            $overlaps = $from <= $end && ($ongoing || $to >= $start);
            return $overlaps
                ? self::result(self::ELIGIBLE, $type, 'The activity period overlaps the cycle coverage.', $from . ' to ' . ($ongoing ? 'present' : $to))
                : self::result(self::OUTSIDE_CYCLE, $type, 'The activity period falls outside the cycle coverage.', $from . ' to ' . ($ongoing ? 'present' : $to));
        }
        $date = self::firstDate($record['occurrence_date'] ?? null, $metadata['date'] ?? null);
        if ($date === null) return self::result(self::NEEDS_INFORMATION, $type, 'The date of this accomplishment is missing.');
        return ($date >= $start && $date <= $end)
            ? self::result(self::ELIGIBLE, $type, 'The accomplishment falls within the cycle coverage.', $date)
            : self::result(self::OUTSIDE_CYCLE, $type, 'This accomplishment falls outside the ranking cycle coverage.', $date);
    }

    /** Coverage of the ranking cycle that owns this track, or null when the cycle has none set. */
    public function coverageForPeriod(?array $period): ?array
    {
        $cycleId = (string) ($period['ranking_cycle_id'] ?? '');
        if ($cycleId === '' || ! $this->db()->tableExists('ranking_cycles') || ! $this->db()->fieldExists('coverage_start', 'ranking_cycles')) return null;
        $cycle = $this->db()->table('ranking_cycles')->select('coverage_start,coverage_end')->where('id', $cycleId)->get()->getRowArray();
        $start = self::date($cycle['coverage_start'] ?? null);
        $end = self::date($cycle['coverage_end'] ?? null);
        return ($start !== null && $end !== null) ? ['start' => $start, 'end' => $end] : null;
    }

    /** COMPUTED values (Years of Service) are measured up to the coverage end; legacy cycles keep the evaluation end. */
    public function serviceCutoff(?array $period): ?string
    {
        if (! $period) return null;
        $coverage = $this->coverageForPeriod($period);
        return $coverage['end'] ?? (self::date(substr((string) ($period['evaluation_end_at'] ?? ''), 0, 10)));
    }

    /**
     * Splits portfolio records into those copied into the snapshot and those kept only in the
     * permanent portfolio. A cycle without coverage dates keeps the previous behaviour (all copied).
     */
    public function partition(array $records, ?array $period): array
    {
        $coverage = $this->coverageForPeriod($period);
        $group = (string) ($period['personnel_group'] ?? 'FACULTY');
        $eligible = [];
        $excluded = [];
        $decisions = [];
        foreach ($records as $record) {
            $decision = $coverage === null
                ? self::result(self::ELIGIBLE, null, 'This ranking cycle has no achievement coverage dates; included as before.')
                : self::evaluate($record, $coverage, $group);
            $decision['coverage'] = $coverage;
            $decisions[(string) $record['id']] = $decision;
            if ($decision['eligible']) $eligible[] = $record;
            else $excluded[] = ['id' => $record['id'], 'title' => $record['title'] ?? null, 'status' => $decision['status'], 'reason' => $decision['reason']];
        }
        return ['coverage' => $coverage, 'applied' => $coverage !== null, 'eligible' => $eligible, 'excluded' => $excluded, 'decisions' => $decisions];
    }

    /** Coverage and group of the personnel member's currently open track, for portfolio status badges. */
    public function openCycleFor(string $personnelProfileId): ?array
    {
        $db = $this->db();
        if (! $db->tableExists('personnel_evaluation_periods') || ! $db->fieldExists('ranking_cycle_id', 'personnel_evaluation_periods')) return null;
        $person = $db->table('personnel_profiles')->select('personnel_group')->where('profile_id', $personnelProfileId)->get()->getRowArray();
        $group = self::isNonTeaching((string) ($person['personnel_group'] ?? '')) ? 'NON_TEACHING_FACULTY' : 'FACULTY';
        $period = $db->table('personnel_evaluation_periods')->where('personnel_group', $group)
            ->whereIn('status', ['OPEN_FOR_SUBMISSION', 'SUBMISSION_CLOSED', 'EVALUATION_ONGOING'])
            ->orderBy('submission_open_at', 'DESC')->get()->getRowArray();
        $coverage = $period ? $this->coverageForPeriod($period) : null;
        return $coverage === null ? null : ['coverage' => $coverage, 'personnel_group' => $group, 'evaluation_period_id' => $period['id']];
    }

    private function db(): BaseConnection
    {
        return $this->db ??= db_connect();
    }

    private static function result(string $status, ?string $type, string $reason, ?string $dateUsed = null): array
    {
        return ['status' => $status, 'eligible' => $status === self::ELIGIBLE, 'validity_type' => $type, 'reason' => $reason, 'date_used' => $dateUsed];
    }

    /** Range when the record carries a start date (faculty range fields) or is marked ongoing. */
    private static function range(array $record, array $metadata): ?array
    {
        $mode = strtolower((string) ($metadata['date_mode'] ?? ''));
        $start = self::date($metadata['start_date'] ?? null);
        $end = self::date($metadata['end_date'] ?? null);
        $ongoing = ($metadata['ongoing'] ?? false) === true || ($metadata['ongoing'] ?? null) === 'true' || ($metadata['ongoing'] ?? null) === 1;
        if ($mode === 'single') return null;
        $isRange = str_starts_with($mode, 'range') || $ongoing || ($start !== null && $end !== null && $start !== $end);
        if (! $isRange) return null;
        return [$start, $end ?? ($ongoing ? null : self::date($record['occurrence_date'] ?? null)), $ongoing];
    }

    private static function metadata(array $record): array
    {
        $value = $record['category_metadata'] ?? [];
        if (is_string($value)) $value = json_decode($value, true);
        return is_array($value) ? $value : [];
    }

    private static function criterion(?string $code): ?string
    {
        $code = strtoupper(trim((string) $code));
        if (preg_match('/^([ABC])\.?(\d)/', $code, $m)) return $m[1] . '.' . $m[2];
        return null;
    }

    private static function isNonTeaching(string $group): bool
    {
        return in_array(strtoupper(trim($group)), ['NON_TEACHING_FACULTY', 'NON-TEACHING FACULTY', 'NTF'], true);
    }

    private static function firstDate(mixed ...$values): ?string
    {
        foreach ($values as $value) if (($date = self::date($value)) !== null) return $date;
        return null;
    }

    private static function date(mixed $value): ?string
    {
        $value = substr(trim((string) $value), 0, 10);
        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) return null;
        [$y, $m, $d] = array_map('intval', explode('-', $value));
        return checkdate($m, $d, $y) ? $value : null;
    }
}
