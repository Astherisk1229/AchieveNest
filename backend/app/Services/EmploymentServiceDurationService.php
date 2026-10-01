<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use DateTimeImmutable;
use InvalidArgumentException;

/**
 * Single authority for length-of-service arithmetic.
 *
 * - calculate(): plain duration from one start date (display helper, unchanged).
 * - calculateQualifyingService(): qualifying length of service for a person, from the HR
 *   service history (PersonnelServiceHistoryService), excluding part-time periods, HR-excluded
 *   periods and gaps. Policy LOS-2026-10-v1 (confirmed 2026-10-01):
 *     * service counts from each period's start up to, not including, the reference date;
 *     * each counted period contributes its completed months; leftover days are pooled and
 *       every 30 days becomes one month;
 *     * with no recorded history, the HR start date is used (flagged unverified), unless the
 *       person is currently part-time, in which case qualifying service is zero.
 */
class EmploymentServiceDurationService
{
    public const BASIS_SERVICE_HISTORY = 'service_history';
    public const BASIS_LEGACY_START_DATE = 'legacy_start_date';
    public const BASIS_PART_TIME_NO_HISTORY = 'part_time_no_history';
    public const BASIS_UNAVAILABLE = 'unavailable';
    private const DAYS_PER_MONTH_CARRY = 30;

    public function __construct(private ?BaseConnection $db = null, private ?PersonnelServiceHistoryService $history = null)
    {
        // DB-backed dependencies are created lazily so existing date-only callers never open a connection.
    }

    public function validateRequiredStartDate(mixed $value, ?string $referenceDate = null): string
    {
        $value = is_string($value) ? trim($value) : '';
        if ($value === '') throw new InvalidArgumentException('Employment start date is required.');
        $start = $this->strictDate($value, 'Enter a valid employment start date.');
        $reference = $this->strictDate($referenceDate ?: date('Y-m-d'), 'Enter a valid reference date.');
        if ($start > $reference) throw new InvalidArgumentException('Employment start date cannot be in the future.');
        return $start->format('Y-m-d');
    }

    public function calculate(?string $startDate, ?string $referenceDate = null): ?array
    {
        if ($startDate === null || trim($startDate) === '') return null;
        $start = $this->strictDate($startDate, 'Enter a valid employment start date.');
        $reference = $this->strictDate($referenceDate ?: date('Y-m-d'), 'Enter a valid reference date.');
        if ($start > $reference) throw new InvalidArgumentException('Employment start date cannot be after the reference date.');
        $difference = $start->diff($reference);
        $parts = [];
        if ($difference->y) $parts[] = $difference->y . ' ' . ($difference->y === 1 ? 'year' : 'years');
        if ($difference->m || ! $parts) $parts[] = $difference->m . ' ' . ($difference->m === 1 ? 'month' : 'months');
        return [
            'years' => $difference->y,
            'months' => $difference->m,
            'days' => $difference->d,
            'total_months' => ($difference->y * 12) + $difference->m,
            'display' => implode(', ', $parts),
            'reference_date' => $reference->format('Y-m-d'),
        ];
    }

    /**
     * Qualifying length of service for one person as of $referenceDate (default today).
     * Use the evaluation period's end date as the reference for eligibility and scoring.
     */
    public function calculateQualifyingService(string $personnelProfileId, ?string $referenceDate = null): array
    {
        $db = $this->db ??= db_connect();
        $reference = $this->strictDate($referenceDate ?: date('Y-m-d'), 'Enter a valid reference date.')->format('Y-m-d');

        $person = $db->table('personnel_profiles')
            ->select('profile_id, faculty_engagement, employment_start_date')
            ->where('profile_id', $personnelProfileId)->get()->getRowArray();
        if (! $person) throw new InvalidArgumentException('PERSONNEL_NOT_FOUND');

        $historyService = $this->history ??= new PersonnelServiceHistoryService($db);
        $history = $historyService->getHistory($personnelProfileId);
        $version = $history['current_version'];

        if ($version !== null) {
            $result = $this->computeFromSegments($version['segments'], $reference);
            return $result + [
                'basis' => self::BASIS_SERVICE_HISTORY,
                'verified' => true,
                'service_history_version_id' => $version['id'],
                'service_history_version_number' => $version['version_number'],
                'policy_rule_version_reference' => $version['policy_rule_version_reference'],
            ];
        }

        $meta = ['verified' => false, 'service_history_version_id' => null, 'service_history_version_number' => null, 'policy_rule_version_reference' => PersonnelServiceHistoryService::POLICY_RULE_VERSION];
        if (($person['faculty_engagement'] ?? null) === FacultyStatusService::ENGAGEMENT_PART_TIME) {
            return $this->computeFromSegments([], $reference) + ['basis' => self::BASIS_PART_TIME_NO_HISTORY] + $meta;
        }
        $start = trim((string) ($person['employment_start_date'] ?? ''));
        if ($start === '') {
            return ['basis' => self::BASIS_UNAVAILABLE, 'reference_date' => $reference, 'years' => null, 'months' => null, 'days' => null, 'total_months' => null, 'completed_years' => null, 'service_years_decimal' => null, 'qualifying_days' => null, 'display' => null, 'included_segments' => [], 'excluded_segments' => [], 'gaps' => [], 'part_time' => null] + $meta;
        }
        $legacy = [['start_date' => $this->strictDate($start, 'Recorded employment start date is invalid.')->format('Y-m-d'), 'end_date' => null, 'is_ongoing' => true, 'classification' => PersonnelServiceHistoryService::CLASSIFICATION_FULL_TIME, 'countability' => PersonnelServiceHistoryService::COUNTABLE, 'hr_reason' => null]];
        return $this->computeFromSegments($legacy, $reference) + ['basis' => self::BASIS_LEGACY_START_DATE] + $meta;
    }

    /**
     * Pure computation over service-history segments (shape returned by PersonnelServiceHistoryService).
     * Segments starting on/after the reference date are ignored; periods are cut off at the reference date.
     */
    public function computeFromSegments(array $segments, string $referenceDate): array
    {
        $reference = $this->strictDate($referenceDate, 'Enter a valid reference date.');
        $lastCountedDay = $reference->modify('-1 day');

        usort($segments, fn ($a, $b) => strcmp((string) $a['start_date'], (string) $b['start_date']));
        $included = $excluded = $gaps = [];
        $months = $days = $qualifyingDays = 0;
        $partTimeMonths = $partTimeDays = 0;
        $previousEnd = null;

        foreach ($segments as $segment) {
            $start = $this->strictDate((string) $segment['start_date'], 'Service segment has an invalid start date.');
            if ($start > $lastCountedDay) continue;
            $end = ! empty($segment['is_ongoing']) || $segment['end_date'] === null
                ? $lastCountedDay
                : min($this->strictDate((string) $segment['end_date'], 'Service segment has an invalid end date.'), $lastCountedDay);

            if ($previousEnd !== null && $start > $previousEnd->modify('+1 day')) {
                $gapStart = $previousEnd->modify('+1 day');
                $gapEnd = $start->modify('-1 day');
                $gaps[] = ['start_date' => $gapStart->format('Y-m-d'), 'end_date' => $gapEnd->format('Y-m-d'), 'days' => $this->inclusiveDays($gapStart, $gapEnd)];
            }
            $previousEnd = $previousEnd === null ? $end : max($previousEnd, $end);

            $span = $this->inclusiveSpan($start, $end);
            $row = [
                'start_date' => $start->format('Y-m-d'),
                'end_date' => $end->format('Y-m-d'),
                'is_ongoing' => ! empty($segment['is_ongoing']),
                'classification' => $segment['classification'],
                'countability' => $segment['countability'],
                'hr_reason' => $segment['hr_reason'] ?? null,
                'months' => $span['months'],
                'days' => $span['days'],
                'calendar_days' => $span['calendar_days'],
            ];

            $countable = $segment['countability'] === PersonnelServiceHistoryService::COUNTABLE
                && $segment['classification'] === PersonnelServiceHistoryService::CLASSIFICATION_FULL_TIME;
            if ($countable) {
                $included[] = $row;
                $months += $span['months'];
                $days += $span['days'];
                $qualifyingDays += $span['calendar_days'];
            } else {
                $excluded[] = $row;
                if ($segment['classification'] === PersonnelServiceHistoryService::CLASSIFICATION_PART_TIME) {
                    $partTimeMonths += $span['months'];
                    $partTimeDays += $span['days'];
                }
            }
        }

        $total = $this->carry($months, $days);
        $partTime = $this->carry($partTimeMonths, $partTimeDays);
        return [
            'reference_date' => $reference->format('Y-m-d'),
            'years' => intdiv($total['months'], 12),
            'months' => $total['months'] % 12,
            'days' => $total['days'],
            'total_months' => $total['months'],
            'completed_years' => intdiv($total['months'], 12),
            'service_years_decimal' => round($total['months'] / 12, 2),
            'qualifying_days' => $qualifyingDays,
            'display' => $this->display(intdiv($total['months'], 12), $total['months'] % 12),
            'included_segments' => $included,
            'excluded_segments' => $excluded,
            'gaps' => $gaps,
            'part_time' => ['total_months' => $partTime['months'], 'display' => $this->display(intdiv($partTime['months'], 12), $partTime['months'] % 12)],
        ];
    }

    /** Completed months and leftover days from $start through $end inclusive. */
    private function inclusiveSpan(DateTimeImmutable $start, DateTimeImmutable $end): array
    {
        $diff = $start->diff($end->modify('+1 day'));
        return ['months' => ($diff->y * 12) + $diff->m, 'days' => $diff->d, 'calendar_days' => $this->inclusiveDays($start, $end)];
    }

    private function inclusiveDays(DateTimeImmutable $start, DateTimeImmutable $end): int
    {
        return (int) $start->diff($end)->days + 1;
    }

    private function carry(int $months, int $days): array
    {
        return ['months' => $months + intdiv($days, self::DAYS_PER_MONTH_CARRY), 'days' => $days % self::DAYS_PER_MONTH_CARRY];
    }

    private function display(int $years, int $months): string
    {
        $parts = [];
        if ($years) $parts[] = $years . ' ' . ($years === 1 ? 'year' : 'years');
        if ($months || ! $parts) $parts[] = $months . ' ' . ($months === 1 ? 'month' : 'months');
        return implode(', ', $parts);
    }

    private function strictDate(string $value, string $message): DateTimeImmutable
    {
        $date = DateTimeImmutable::createFromFormat('!Y-m-d', trim($value));
        $errors = DateTimeImmutable::getLastErrors();
        if (! $date || ($errors !== false && ($errors['warning_count'] || $errors['error_count'])) || $date->format('Y-m-d') !== trim($value)) {
            throw new InvalidArgumentException($message);
        }
        return $date;
    }
}
