<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use DateTimeImmutable;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

/**
 * Authoritative HR-maintained employment service history (Phase 2 service-history domain).
 *
 * Data owner only: stores dated employment periods ("segments") per personnel as append-only,
 * HR-resolved versions. It does not compute length of service; that belongs to
 * EmploymentServiceDurationService, which reads the current version from here.
 *
 * Rules (policy LOS-2026-10-v1, confirmed 2026-10-01):
 * - Each segment is a full-date range (start date required; end date or "ongoing").
 * - Classification is full_time or part_time. Part-time is always excluded from qualifying service.
 * - Full-time is countable unless HR excludes it (e.g. leave without pay) with a written reason.
 * - Segments may not overlap. Gaps are allowed and simply are not counted.
 * - Saving never edits a previous version; it creates the next version number.
 */
class PersonnelServiceHistoryService
{
    public const STREAM_NDMU_EMPLOYMENT = 'NDMU_EMPLOYMENT';
    public const POLICY_RULE_VERSION = 'LOS-2026-10-v1';

    public const CLASSIFICATION_FULL_TIME = 'full_time';
    public const CLASSIFICATION_PART_TIME = 'part_time';
    public const CLASSIFICATIONS = [self::CLASSIFICATION_FULL_TIME, self::CLASSIFICATION_PART_TIME];

    public const COUNTABLE = 'countable';
    public const EXCLUDED = 'excluded';

    public const RESOLUTION_HR_CONFIRMED = 'hr_confirmed';
    public const LIFECYCLE_ACTIVE = 'active';

    private const MAX_SEGMENTS = 50;

    public function __construct(private ?BaseConnection $db = null)
    {
        $this->db ??= db_connect();
    }

    /**
     * Current version (with segments) plus version metadata, or an empty shape when HR has not recorded any history.
     */
    public function getHistory(string $personnelProfileId): array
    {
        $this->assertPersonnelExists($personnelProfileId);
        $history = $this->findHistory($personnelProfileId);
        if ($history === null) {
            return ['personnel_profile_id' => $personnelProfileId, 'stream_code' => self::STREAM_NDMU_EMPLOYMENT, 'history_id' => null, 'current_version' => null, 'versions' => []];
        }

        $versions = $this->db->table('personnel_service_history_versions')
            ->select('id, version_number, previous_version_id, resolution_status, countable_days, resolved_by_profile_id, resolved_at, policy_rule_version_reference, created_at')
            ->where('service_history_id', $history['id'])
            ->orderBy('version_number', 'DESC')
            ->get()->getResultArray();

        $current = null;
        if (! empty($history['current_version_id'])) {
            foreach ($versions as $v) {
                if ($v['id'] === $history['current_version_id']) { $current = $v; break; }
            }
            if ($current !== null) $current['segments'] = $this->segmentsForVersion($current['id']);
        }

        return [
            'personnel_profile_id' => $personnelProfileId,
            'stream_code' => $history['stream_code'],
            'history_id' => $history['id'],
            'current_version' => $current === null ? null : $this->presentVersion($current),
            'versions' => array_map(fn (array $v) => $this->presentVersion($v), $versions),
        ];
    }

    /** Segments of the current version only, ordered by start date. Empty when nothing is recorded. */
    public function currentSegments(string $personnelProfileId): array
    {
        $history = $this->findHistory($personnelProfileId);
        if ($history === null || empty($history['current_version_id'])) return [];
        return $this->segmentsForVersion($history['current_version_id']);
    }

    /**
     * Records a new HR-confirmed version of the employment history.
     *
     * $input = [
     *   'expected_version_number' => int (0 when none exists yet; guards against overwriting another HR user's save),
     *   'change_reason' => string (required),
     *   'segments' => [[ 'start_date' => 'Y-m-d', 'end_date' => 'Y-m-d'|null, 'is_ongoing' => bool,
     *                     'classification' => 'full_time'|'part_time', 'countability' => 'countable'|'excluded' (optional),
     *                     'hr_reason' => string|null, 'source_remarks' => string|null ], ...]
     * ]
     */
    public function saveVersion(string $personnelProfileId, string $hrActorProfileId, array $input, ?string $today = null): array
    {
        $this->assertPersonnelExists($personnelProfileId);
        $today = $today ?? date('Y-m-d');

        $changeReason = trim((string) ($input['change_reason'] ?? ''));
        if ($changeReason === '') throw new InvalidArgumentException('CHANGE_REASON_REQUIRED');
        if (mb_strlen($changeReason) > 1000) throw new InvalidArgumentException('CHANGE_REASON_TOO_LONG');

        if (! array_key_exists('expected_version_number', $input) || ! is_int($input['expected_version_number']) || $input['expected_version_number'] < 0) {
            throw new InvalidArgumentException('EXPECTED_VERSION_NUMBER_REQUIRED');
        }
        $segments = $this->validateSegments($input['segments'] ?? null, $today);

        $history = $this->findHistory($personnelProfileId);
        $currentNumber = 0;
        $currentVersionId = null;
        if ($history !== null && ! empty($history['current_version_id'])) {
            $row = $this->db->table('personnel_service_history_versions')->select('version_number')->where('id', $history['current_version_id'])->get()->getRowArray();
            $currentNumber = (int) ($row['version_number'] ?? 0);
            $currentVersionId = $history['current_version_id'];
        }
        if ($input['expected_version_number'] !== $currentNumber) {
            throw new RuntimeException('SERVICE_HISTORY_VERSION_CONFLICT');
        }

        $now = date('Y-m-d H:i:s');
        $versionId = $this->uuid();

        $this->db->transBegin();
        try {
            if ($history === null) {
                $history = ['id' => $this->uuid(), 'personnel_profile_id' => $personnelProfileId, 'stream_code' => self::STREAM_NDMU_EMPLOYMENT, 'current_version_id' => null, 'lifecycle_state' => self::LIFECYCLE_ACTIVE, 'created_at' => $now, 'updated_at' => $now];
                $this->mustWrite($this->db->table('personnel_service_histories')->insert($history));
            }

            $this->mustWrite($this->db->table('personnel_service_history_versions')->insert([
                'id' => $versionId,
                'service_history_id' => $history['id'],
                'version_number' => $currentNumber + 1,
                'previous_version_id' => $currentVersionId,
                'resolution_status' => self::RESOLUTION_HR_CONFIRMED,
                'countable_days' => null, // filled by the length-of-service computation step
                'resolved_by_profile_id' => $hrActorProfileId,
                'resolved_at' => $now,
                'policy_rule_version_reference' => self::POLICY_RULE_VERSION,
                'created_at' => $now,
            ]));

            foreach ($segments as $s) {
                [$sy, $sm, $sd] = array_map('intval', explode('-', $s['start_date']));
                $end = $s['end_date'] === null ? [null, null, null] : array_map('intval', explode('-', $s['end_date']));
                $this->mustWrite($this->db->table('personnel_service_segments')->insert([
                    'id' => $this->uuid(),
                    'service_history_version_id' => $versionId,
                    'period_precision' => 'RANGE',
                    'period_start_year' => $sy, 'period_start_month' => $sm, 'period_start_day' => $sd,
                    'period_end_year' => $end[0], 'period_end_month' => $end[1], 'period_end_day' => $end[2],
                    'is_ongoing' => $s['is_ongoing'] ? 1 : 0,
                    'source_period_text' => null,
                    'source_classification' => $s['classification'],
                    'countability_state' => $s['countability'],
                    'source_remarks' => $s['source_remarks'],
                    'hr_reason' => $s['hr_reason'],
                    'created_at' => $now,
                ]));
            }

            $this->mustWrite($this->db->table('personnel_service_histories')->where('id', $history['id'])->update(['current_version_id' => $versionId, 'updated_at' => $now]));
            $this->audit($personnelProfileId, $hrActorProfileId, $changeReason, $currentNumber + 1, $versionId, count($segments), $now);

            $this->db->transCommit();
        } catch (Throwable $e) {
            $this->db->transRollback();
            // A concurrent save that took the same version number fails the unique key: report it as a conflict.
            if (stripos($e->getMessage(), 'uq_personnel_service_history_version_number') !== false || stripos($e->getMessage(), 'UNIQUE') !== false) {
                throw new RuntimeException('SERVICE_HISTORY_VERSION_CONFLICT');
            }
            throw new RuntimeException('SERVICE_HISTORY_SAVE_FAILED', 0, $e);
        }

        return $this->getHistory($personnelProfileId);
    }

    /** Validates and normalizes segments; throws InvalidArgumentException with a code naming the first problem. */
    public function validateSegments(mixed $segments, string $today): array
    {
        if (! is_array($segments) || $segments === []) throw new InvalidArgumentException('SEGMENTS_REQUIRED');
        if (count($segments) > self::MAX_SEGMENTS) throw new InvalidArgumentException('TOO_MANY_SEGMENTS');
        $todayDate = $this->strictDate($today, 'INVALID_REFERENCE_DATE');

        $normalized = [];
        foreach (array_values($segments) as $i => $raw) {
            $n = $i + 1;
            if (! is_array($raw)) throw new InvalidArgumentException("SEGMENT_{$n}_INVALID");

            $start = $this->strictDate((string) ($raw['start_date'] ?? ''), "SEGMENT_{$n}_INVALID_START_DATE");
            if ($start > $todayDate) throw new InvalidArgumentException("SEGMENT_{$n}_START_IN_FUTURE");

            $ongoing = ($raw['is_ongoing'] ?? false) === true;
            $endRaw = trim((string) ($raw['end_date'] ?? ''));
            if ($ongoing && $endRaw !== '') throw new InvalidArgumentException("SEGMENT_{$n}_ONGOING_WITH_END_DATE");
            if (! $ongoing && $endRaw === '') throw new InvalidArgumentException("SEGMENT_{$n}_END_DATE_REQUIRED");
            $end = null;
            if (! $ongoing) {
                $end = $this->strictDate($endRaw, "SEGMENT_{$n}_INVALID_END_DATE");
                if ($end < $start) throw new InvalidArgumentException("SEGMENT_{$n}_END_BEFORE_START");
                if ($end > $todayDate) throw new InvalidArgumentException("SEGMENT_{$n}_END_IN_FUTURE");
            }

            $classification = strtolower(trim((string) ($raw['classification'] ?? '')));
            if (! in_array($classification, self::CLASSIFICATIONS, true)) throw new InvalidArgumentException("SEGMENT_{$n}_INVALID_CLASSIFICATION");

            $hrReason = $this->nullableText($raw['hr_reason'] ?? null);
            $countability = strtolower(trim((string) ($raw['countability'] ?? '')));
            if ($countability === '') {
                $countability = $classification === self::CLASSIFICATION_PART_TIME ? self::EXCLUDED : self::COUNTABLE;
            }
            if (! in_array($countability, [self::COUNTABLE, self::EXCLUDED], true)) throw new InvalidArgumentException("SEGMENT_{$n}_INVALID_COUNTABILITY");
            if ($classification === self::CLASSIFICATION_PART_TIME && $countability === self::COUNTABLE) throw new InvalidArgumentException("SEGMENT_{$n}_PART_TIME_NOT_COUNTABLE");
            if ($classification === self::CLASSIFICATION_FULL_TIME && $countability === self::EXCLUDED && $hrReason === null) throw new InvalidArgumentException("SEGMENT_{$n}_EXCLUSION_REASON_REQUIRED");

            $normalized[] = [
                'start_date' => $start->format('Y-m-d'),
                'end_date' => $end?->format('Y-m-d'),
                'is_ongoing' => $ongoing,
                'classification' => $classification,
                'countability' => $countability,
                'hr_reason' => $hrReason,
                'source_remarks' => $this->nullableText($raw['source_remarks'] ?? null),
            ];
        }

        usort($normalized, fn ($a, $b) => strcmp($a['start_date'], $b['start_date']));
        $ongoingCount = count(array_filter($normalized, fn ($s) => $s['is_ongoing']));
        if ($ongoingCount > 1) throw new InvalidArgumentException('ONLY_ONE_ONGOING_SEGMENT_ALLOWED');
        if ($ongoingCount === 1 && ! end($normalized)['is_ongoing']) throw new InvalidArgumentException('ONGOING_SEGMENT_MUST_BE_LATEST');

        for ($i = 1; $i < count($normalized); $i++) {
            $prevEnd = $normalized[$i - 1]['end_date']; // non-null: only the latest segment may be ongoing
            if ($normalized[$i]['start_date'] <= $prevEnd) throw new InvalidArgumentException('SEGMENTS_OVERLAP');
        }
        return $normalized;
    }

    private function segmentsForVersion(string $versionId): array
    {
        $rows = $this->db->table('personnel_service_segments')->where('service_history_version_id', $versionId)->get()->getResultArray();
        $segments = array_map(fn (array $r) => [
            'id' => $r['id'],
            'start_date' => $this->ymd($r['period_start_year'], $r['period_start_month'], $r['period_start_day']),
            'end_date' => $this->ymd($r['period_end_year'], $r['period_end_month'], $r['period_end_day']),
            'is_ongoing' => (int) $r['is_ongoing'] === 1,
            'period_precision' => $r['period_precision'],
            'classification' => $r['source_classification'],
            'countability' => $r['countability_state'],
            'hr_reason' => $r['hr_reason'],
            'source_remarks' => $r['source_remarks'],
        ], $rows);
        usort($segments, fn ($a, $b) => strcmp((string) $a['start_date'], (string) $b['start_date']));
        return $segments;
    }

    private function presentVersion(array $v): array
    {
        $out = [
            'id' => $v['id'],
            'version_number' => (int) $v['version_number'],
            'previous_version_id' => $v['previous_version_id'],
            'resolution_status' => $v['resolution_status'],
            'countable_days' => $v['countable_days'] === null ? null : (int) $v['countable_days'],
            'resolved_by_profile_id' => $v['resolved_by_profile_id'],
            'resolved_at' => $v['resolved_at'],
            'policy_rule_version_reference' => $v['policy_rule_version_reference'],
            'created_at' => $v['created_at'],
        ];
        if (array_key_exists('segments', $v)) $out['segments'] = $v['segments'];
        return $out;
    }

    private function findHistory(string $personnelProfileId): ?array
    {
        return $this->db->table('personnel_service_histories')
            ->where('personnel_profile_id', $personnelProfileId)
            ->where('stream_code', self::STREAM_NDMU_EMPLOYMENT)
            ->get()->getRowArray() ?: null;
    }

    private function assertPersonnelExists(string $personnelProfileId): void
    {
        if (! $this->db->table('personnel_profiles')->where('profile_id', $personnelProfileId)->countAllResults()) {
            throw new InvalidArgumentException('PERSONNEL_NOT_FOUND');
        }
    }

    private function audit(string $profileId, string $actorId, string $reason, int $versionNumber, string $versionId, int $segmentCount, string $now): void
    {
        if (! $this->db->tableExists('account_lifecycle_events')) return;
        $profile = $this->db->table('profiles')->select('status')->where('id', $profileId)->get()->getRowArray();
        $status = trim((string) ($profile['status'] ?? '')) !== '' ? $profile['status'] : 'active';
        $this->mustWrite($this->db->table('account_lifecycle_events')->insert([
            'id' => $this->uuid(),
            'profile_id' => $profileId,
            'actor_profile_id' => $actorId,
            'event_type' => 'service_history_updated',
            'previous_status' => $status,
            'new_status' => $status,
            'reason' => json_encode([
                'justification' => $reason,
                'service_history_version_id' => $versionId,
                'version_number' => $versionNumber,
                'segment_count' => $segmentCount,
                'policy_rule_version_reference' => self::POLICY_RULE_VERSION,
            ], JSON_UNESCAPED_UNICODE),
            'occurred_at' => $now,
        ]));
    }

    private function mustWrite(mixed $result): void
    {
        if ($result === false) {
            $error = $this->db->error();
            throw new RuntimeException((string) ($error['message'] ?? 'write failed'));
        }
    }

    private function strictDate(string $value, string $code): DateTimeImmutable
    {
        $value = trim($value);
        $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
        $errors = DateTimeImmutable::getLastErrors();
        if (! $date || ($errors !== false && ($errors['warning_count'] || $errors['error_count'])) || $date->format('Y-m-d') !== $value) {
            throw new InvalidArgumentException($code);
        }
        return $date;
    }

    private function ymd(mixed $y, mixed $m, mixed $d): ?string
    {
        if ($y === null) return null;
        if ($m === null) return sprintf('%04d', $y);
        if ($d === null) return sprintf('%04d-%02d', $y, $m);
        return sprintf('%04d-%02d-%02d', $y, $m, $d);
    }

    private function nullableText(mixed $value): ?string { $value = trim((string) ($value ?? '')); return $value === '' ? null : $value; }

    private function uuid(): string
    {
        $data = random_bytes(16); $data[6] = chr((ord($data[6]) & 0x0f) | 0x40); $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
