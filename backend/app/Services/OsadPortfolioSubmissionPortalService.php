<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;
use Throwable;

/** OSAD-selected student access and immutable whole-portfolio submission snapshots. */
final class OsadPortfolioSubmissionPortalService
{
    public function __construct(
        private ?BaseConnection $db = null,
        private ?LocalEvidenceStorageService $storage = null
    ) {
        $this->db ??= db_connect();
        $this->storage ??= new LocalEvidenceStorageService();
    }

    private function database(): BaseConnection { return $this->db ??= db_connect(); }
    private function files(): LocalEvidenceStorageService { return $this->storage ??= new LocalEvidenceStorageService(); }

    private function uuid(): string
    {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0x0fff) | 0x4000, random_int(0, 0x3fff) | 0x8000, random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff));
    }

    private function event(string $portalId, string $studentId, string $actorId, string $type, ?string $submissionId = null, ?string $reason = null, bool $exception = false): void
    {
        $this->database()->table('osad_portfolio_submission_events')->insert([
            'id' => $this->uuid(), 'portal_id' => $portalId, 'student_profile_id' => $studentId,
            'submission_id' => $submissionId, 'actor_profile_id' => $actorId, 'event_type' => $type,
            'reason' => $reason, 'evaluation_exception' => $exception ? 1 : 0,
            'occurred_at' => date('Y-m-d H:i:s.u'),
        ]);
    }

    private function requirePortal(string $portalId): array
    {
        $portal = $this->database()->table('osad_portfolio_submission_portals')->where('id', $portalId)->get()->getRowArray();
        if ($portal === null) throw new RuntimeException('PORTAL_NOT_FOUND');
        return $portal;
    }

    private function submissionWindowIsOpen(array $portal): bool
    {
        if (empty($portal['start_date']) || empty($portal['end_date'])) return true;
        $timezone = new \DateTimeZone(config('App')->appTimezone ?? 'Asia/Manila');
        $today = (new \DateTimeImmutable('now', $timezone))->format('Y-m-d');
        return $today >= (string) $portal['start_date'] && $today <= (string) $portal['end_date'];
    }

    private function studentCanAccessPortal(array $portal, array $access): bool
    {
        return ($portal['status'] === 'open' && $this->submissionWindowIsOpen($portal))
            || in_array($access['submission_state'], ['submitted', 'reopened'], true);
    }

    private function parsePortalDate(string $value): string
    {
        $value = trim($value);
        $timezone = new \DateTimeZone(config('App')->appTimezone ?? 'Asia/Manila');
        $date = \DateTimeImmutable::createFromFormat('!Y-m-d', $value, $timezone);
        $errors = \DateTimeImmutable::getLastErrors();
        if ($date === false || ($errors !== false && ($errors['warning_count'] > 0 || $errors['error_count'] > 0)) || $date->format('Y-m-d') !== $value) {
            throw new RuntimeException('PORTAL_DATE_RANGE_INVALID');
        }
        return $date->format('Y-m-d');
    }

    private function calendarAwardYear(): string
    {
        $timezone = new \DateTimeZone(config('App')->appTimezone ?? 'Asia/Manila');
        $year = (int) (new \DateTimeImmutable('now', $timezone))->format('Y');
        return $year . '-' . ($year + 1);
    }

    public function activeAwardYear(): string
    {
        return $this->calendarAwardYear();
    }

    private function evaluationStarted(string $portalId, string $studentId, ?string $recordedAt): ?string
    {
        if ($recordedAt) return $recordedAt;
        $portal = $this->requirePortal($portalId);
        if (! $this->database()->tableExists('student_award_evaluations')) return null;
        $access = $this->database()->table('osad_portfolio_submission_access')->where('portal_id', $portalId)->where('student_profile_id', $studentId)->get()->getRowArray();
        $awardIds = $access ? array_column($this->database()->table('osad_portfolio_submission_access_awards')->select('award_definition_id')->where('access_id', $access['id'])->get()->getResultArray(), 'award_definition_id') : [];
        if ($awardIds === [] && ! empty($portal['award_definition_id'])) $awardIds = [$portal['award_definition_id']];
        if ($awardIds === []) return null;
        $evaluation = $this->database()->table('student_award_evaluations')
            ->select('updated_at, evaluated_at')
            ->whereIn('award_definition_id', $awardIds)
            ->where('student_profile_id', $studentId)
            ->whereNotIn('status', ['pending', 'calculated', 'superseded'])
            ->orderBy('updated_at', 'DESC')->get(1)->getRowArray();
        return $evaluation['evaluated_at'] ?? $evaluation['updated_at'] ?? null;
    }

    private function studentAccess(string $portalId, string $studentId, bool $mustBeOpen = true): array
    {
        $row = $this->database()->table('osad_portfolio_submission_access a')
            ->select('a.*, p.status AS portal_status, p.start_date, p.end_date')
            ->join('osad_portfolio_submission_portals p', 'p.id = a.portal_id')
            ->where('a.portal_id', $portalId)->where('a.student_profile_id', $studentId)
            ->where('a.access_status', 'active')->get()->getRowArray();
        if ($row === null || ($mustBeOpen && $row['portal_status'] !== 'open')) throw new RuntimeException('PORTAL_ACCESS_NOT_AVAILABLE');
        return $row;
    }

    private function normalizeAwardIds(array $awardIds): array
    {
        $ids = array_values(array_unique(array_filter(array_map(static fn($id): string => is_scalar($id) ? trim((string) $id) : '', $awardIds))));
        if ($ids === []) throw new RuntimeException('AWARD_SELECTION_REQUIRED');
        $found = $this->database()->table('award_definitions')->select('id')->whereIn('id', $ids)->get()->getResultArray();
        if (count($found) !== count($ids)) throw new RuntimeException('AWARD_NOT_FOUND');
        return $ids;
    }

    private function awardsForAccess(string $accessId): array
    {
        return $this->database()->table('osad_portfolio_submission_access_awards aa')
            ->select('ad.id, ad.name')->join('award_definitions ad', 'ad.id = aa.award_definition_id')
            ->where('aa.access_id', $accessId)->orderBy('ad.name', 'ASC')->get()->getResultArray();
    }

    /** Remove any internal scoring/award-selection keys from user-entered structured metadata. */
    private function studentSafeMetadata(mixed $value): mixed
    {
        if (! is_array($value)) return $value;
        $safe = [];
        foreach ($value as $key => $child) {
            if (is_string($key) && preg_match('/score|points|ranking|threshold|candidate_status|potential_awardee|rubric|weight|selection_source/i', $key)) continue;
            $safe[$key] = $this->studentSafeMetadata($child);
        }
        return $safe;
    }

    public function listOpenStudentPortals(string $studentId): array
    {
        $rows = $this->database()->table('osad_portfolio_submission_portals p')
            ->select("p.id, p.start_date, p.end_date, p.status, 'Portfolio Submission' AS name, a.submission_state, a.current_submission_id", false)
            ->join('osad_portfolio_submission_access a', 'a.portal_id = p.id')
            ->where('a.student_profile_id', $studentId)->where('a.access_status', 'active')
            ->groupStart()->where('p.status', 'open')->orWhereIn('a.submission_state', ['submitted','reopened'])->groupEnd()
            ->orderBy('p.created_at', 'DESC')->get()->getResultArray();
        return array_values(array_filter($rows, fn(array $row): bool => $this->studentCanAccessPortal($row, $row)));
    }

    public function studentPortal(string $portalId, string $studentId): array
    {
        $portal = $this->requirePortal($portalId);
        $access = $this->studentAccess($portalId, $studentId, false);
        if (! $this->studentCanAccessPortal($portal, $access)) throw new RuntimeException('PORTAL_ACCESS_NOT_AVAILABLE');
        $windowOpen = $portal['status'] === 'open' && $this->submissionWindowIsOpen($portal);
        if ($access['submission_state'] === 'not_started' && $windowOpen) {
            $this->database()->table('osad_portfolio_submission_access')->where('portal_id', $portalId)->where('student_profile_id', $studentId)->update(['submission_state' => 'draft']);
            $this->event($portalId, $studentId, $studentId, 'draft_started');
            $access['submission_state'] = 'draft';
        }
        $student = $this->database()->table('profiles')->select('id, full_name, institutional_id')->where('id', $studentId)->get()->getRowArray();
        $current = null;
        if (! empty($access['current_submission_id'])) {
            $current = $this->database()->table('osad_portfolio_submissions')->where('id', $access['current_submission_id'])->get()->getRowArray();
        }
        $snapshot = $current ? (json_decode((string) $current['snapshot_json'], true) ?: []) : null;
        if ($current !== null) {
            $snapshot['submission_id'] = $current['id'];
            if (! isset($snapshot['awards'])) {
                $snapshot['awards'] = $this->database()->table('osad_portfolio_submission_submission_awards aa')
                    ->select('ad.id, ad.name')->join('award_definitions ad', 'ad.id = aa.award_definition_id')
                    ->where('aa.submission_id', $current['id'])->orderBy('ad.name', 'ASC')->get()->getResultArray();
            }
        }
        return [
            'portal' => ['id' => $portal['id'], 'name' => 'Portfolio Submission', 'status' => $access['submission_state'], 'start_date' => $portal['start_date'] ?? null, 'end_date' => $portal['end_date'] ?? null],
            'student' => ['name' => $student['full_name'] ?? '', 'student_id' => $student['institutional_id'] ?? ''],
            'awards' => $this->awardsForAccess((string) $access['id']),
            'submission' => $snapshot,
            'can_edit' => $access['submission_state'] === 'reopened' || ($windowOpen && in_array($access['submission_state'], ['not_started', 'draft'], true)),
        ];
    }

    public function listPortals(): array
    {
        return $this->database()->table('osad_portfolio_submission_portals p')
            ->select('p.id, p.title, p.award_period, p.start_date, p.end_date, p.status, p.award_definition_id, p.created_at, p.closed_at, COUNT(a.id) AS selected_count, SUM(a.submission_state = "submitted") AS submitted_count, SUM(a.submission_state IN ("draft","reopened")) AS draft_count', false)
            ->join('osad_portfolio_submission_access a', 'a.portal_id = p.id AND a.access_status = \'active\'', 'left')
            ->groupBy('p.id')->orderBy('p.created_at', 'DESC')->get()->getResultArray();
    }

    public function createPortal(array $payload, string $actorId): array
    {
        $title = trim((string) ($payload['title'] ?? ''));
        if ($title === '' || mb_strlen($title) > 180) throw new RuntimeException('PORTAL_TITLE_REQUIRED');
        // Award year is determined by the system calendar and cannot be chosen by OSAD or API payloads.
        $awardYear = $this->activeAwardYear();
        $startDate = $this->parsePortalDate((string) ($payload['start_date'] ?? ''));
        $endDate = $this->parsePortalDate((string) ($payload['end_date'] ?? ''));
        $timezone = new \DateTimeZone(config('App')->appTimezone ?? 'Asia/Manila');
        $today = (new \DateTimeImmutable('today', $timezone))->format('Y-m-d');
        if ($startDate < $today) throw new RuntimeException('PORTAL_START_DATE_IN_PAST');
        if ($startDate > $endDate) throw new RuntimeException('PORTAL_DATE_RANGE_INVALID');
        $awardSections = $payload['awards'] ?? null;
        if (! is_array($awardSections) || $awardSections === []) throw new RuntimeException('PORTAL_ASSIGNMENTS_REQUIRED');
        $awardIds = [];
        foreach ($awardSections as $section) {
            if (! is_array($section)) throw new RuntimeException('AWARD_SELECTION_REQUIRED');
            $awardIds[] = $section['award_id'] ?? '';
        }
        $uniqueAwardIds = $this->normalizeAwardIds($awardIds);
        if (count($uniqueAwardIds) !== count($awardIds)) throw new RuntimeException('PORTAL_AWARD_ALREADY_ADDED');

        $id = $this->uuid();
        $database = $this->database();
        $database->transBegin();
        try {
            $database->table('osad_portfolio_submission_portals')->insert([
                'id' => $id, 'award_definition_id' => null, 'title' => $title, 'award_period' => $awardYear,
                'start_date' => $startDate, 'end_date' => $endDate,
                'status' => 'open', 'created_by' => $actorId, 'updated_by' => $actorId,
            ]);
            $selectedStudentCount = 0;
            foreach ($awardSections as $index => $section) {
                $awardId = $uniqueAwardIds[$index];
                $database->table('osad_portfolio_submission_portal_awards')->insert([
                    'id' => $this->uuid(), 'portal_id' => $id, 'award_definition_id' => $awardId, 'assigned_by' => $actorId,
                ]);
                $studentIds = $section['student_profile_ids'] ?? [];
                if (! is_array($studentIds)) throw new RuntimeException('STUDENT_SELECTION_REQUIRED');
                if ($studentIds !== []) $selectedStudentCount += $this->selectStudents($id, $studentIds, $actorId, [$awardId]);
            }
            if ($selectedStudentCount === 0) throw new RuntimeException('PORTAL_ASSIGNMENTS_REQUIRED');
            foreach ($database->table('osad_portfolio_submission_access')->select('student_profile_id')->where('portal_id', $id)->where('access_status', 'active')->get()->getResultArray() as $access) {
                $this->event($id, $access['student_profile_id'], $actorId, 'portal_opened');
            }
            if (! $database->transStatus()) throw new RuntimeException('PORTAL_CREATE_FAILED');
            $database->transCommit();
        } catch (Throwable $error) {
            $database->transRollback();
            throw $error;
        }
        return $this->portalDetails($id);
    }

    public function addPortalAward(string $portalId, string $awardId, string $actorId): array
    {
        $portal = $this->requirePortal($portalId);
        if ($portal['status'] !== 'open') throw new RuntimeException('PORTAL_NOT_EDITABLE');
        $awardIds = $this->normalizeAwardIds([$awardId]);
        $exists = $this->database()->table('osad_portfolio_submission_portal_awards')->where('portal_id', $portalId)->where('award_definition_id', $awardIds[0])->countAllResults() > 0;
        if ($exists) throw new RuntimeException('PORTAL_AWARD_ALREADY_ADDED');
        $this->database()->table('osad_portfolio_submission_portal_awards')->insert([
            'id' => $this->uuid(), 'portal_id' => $portalId, 'award_definition_id' => $awardIds[0], 'assigned_by' => $actorId,
        ]);
        return $this->portalDetails($portalId);
    }

    public function portalDetails(string $portalId): array
    {
        $portal = $this->requirePortal($portalId);
        $db = $this->database();
        $students = $db->table('osad_portfolio_submission_access a')
            ->select('a.id AS access_id, a.student_profile_id, a.access_status, a.submission_state, a.selected_at, a.current_submission_id, a.evaluation_started_at, p.full_name, p.institutional_id')
            ->join('profiles p', 'p.id = a.student_profile_id')->where('a.portal_id', $portalId)
            ->orderBy($db->fieldExists('last_name', 'profiles') ? 'p.last_name' : 'p.full_name', 'ASC')
            ->orderBy($db->fieldExists('first_name', 'profiles') ? 'p.first_name' : 'p.institutional_id', 'ASC')
            ->get()->getResultArray();
        foreach ($students as &$student) {
            $student['awards'] = $this->awardsForAccess((string) $student['access_id']);
            $student['evaluation_started_at'] = $this->evaluationStarted($portalId, (string) $student['student_profile_id'], $student['evaluation_started_at'] ?: null);
            $student['history'] = $this->database()->table('osad_portfolio_submission_events')
                ->where('portal_id', $portalId)->where('student_profile_id', $student['student_profile_id'])
                ->orderBy('occurred_at', 'ASC')->get()->getResultArray();
        }
        unset($student);
        $configuredAwards = [];
        foreach ($this->database()->table('osad_portfolio_submission_portal_awards pa')
            ->select('ad.id, ad.name')->join('award_definitions ad', 'ad.id = pa.award_definition_id')
            ->where('pa.portal_id', $portalId)->orderBy('pa.assigned_at', 'DESC')->orderBy('ad.name', 'ASC')->get()->getResultArray() as $award) $configuredAwards[$award['id']] = $award;
        // Legacy portals may only have their award stored on the portal or access rows.
        foreach ($students as $student) foreach ($student['awards'] as $award) $configuredAwards[$award['id']] ??= $award;
        if ($configuredAwards === [] && ! empty($portal['award_definition_id'])) {
            $legacyAward = $this->database()->table('award_definitions')->select('id, name')->where('id', $portal['award_definition_id'])->get()->getRowArray();
            if ($legacyAward) $configuredAwards[$legacyAward['id']] = $legacyAward;
        }
        $configuredAwards = array_values($configuredAwards);
        $groups = [];
        foreach ($configuredAwards as $award) $groups[(string) $award['id']] = ['award' => $award, 'students' => [], 'selected_count' => 0];
        foreach ($students as $student) foreach ($student['awards'] as $award) {
            $awardKey = (string) $award['id'];
            if (isset($groups[$awardKey]) && $student['access_status'] === 'active') $groups[$awardKey]['selected_count']++;
        }
        foreach ($students as $student) {
            if ($student['submission_state'] !== 'submitted' || empty($student['current_submission_id'])) continue;
            $versionNumber = $this->database()->table('osad_portfolio_submissions')->select('version_number')->where('id', $student['current_submission_id'])->get()->getRowArray()['version_number'] ?? null;
            $submittedAwardIds = array_column($this->database()->table('osad_portfolio_submission_submission_awards')->select('award_definition_id')->where('submission_id', $student['current_submission_id'])->get()->getResultArray(), 'award_definition_id');
            foreach ($student['awards'] as $award) {
                if (! in_array($award['id'], $submittedAwardIds, true)) continue;
                $id = (string) $award['id'];
                $groups[$id] ??= ['award' => $award, 'students' => [], 'selected_count' => 0];
                $groups[$id]['students'][] = [
                    'student_profile_id' => $student['student_profile_id'], 'full_name' => $student['full_name'],
                    'institutional_id' => $student['institutional_id'], 'submission_state' => $student['submission_state'],
                    'submission_id' => $student['current_submission_id'], 'version_number' => $versionNumber, 'access_status' => $student['access_status'], 'awards' => [$award],
                ];
            }
        }
        return ['portal' => $portal, 'awards' => array_values(array_map(static fn($group) => $group['award'], $groups)), 'award_groups' => array_values($groups), 'students' => $students];
    }

    public function selectStudents(string $portalId, array $studentIds, string $actorId, array $awardIds = []): int
    {
        $portal = $this->requirePortal($portalId);
        if ($portal['status'] !== 'open') throw new RuntimeException('PORTAL_NOT_OPEN');
        $awardIds = $this->normalizeAwardIds($awardIds);
        $portalAwardIds = array_column($this->database()->table('osad_portfolio_submission_portal_awards')->select('award_definition_id')->where('portal_id', $portalId)->get()->getResultArray(), 'award_definition_id');
        if ($portalAwardIds === [] && ! empty($portal['award_definition_id'])) $portalAwardIds = [$portal['award_definition_id']];
        if (array_diff($awardIds, $portalAwardIds) !== []) throw new RuntimeException('AWARD_NOT_IN_PORTAL');
        $ids = array_values(array_unique(array_filter(array_map(static fn($id): string => trim((string) $id), $studentIds))));
        $added = 0;
        foreach ($ids as $studentId) {
            $student = $this->database()->table('profiles')->where('id', $studentId)->where('account_type', 'student')->where('status', 'active')->get()->getRowArray();
            if ($student === null) continue;
            $exists = $this->database()->table('osad_portfolio_submission_access')->where('portal_id', $portalId)->where('student_profile_id', $studentId)->countAllResults() > 0;
            $newlySelected = ! $exists;
            $wasRevoked = false;
            if ($exists) {
                $existing = $this->database()->table('osad_portfolio_submission_access')->where('portal_id', $portalId)->where('student_profile_id', $studentId)->get()->getRowArray();
                if ($existing['access_status'] === 'revoked') {
                    $wasRevoked = true;
                    $updates = ['access_status' => 'active', 'selected_by' => $actorId, 'selected_at' => date('Y-m-d H:i:s.u')];
                    if ($existing['submission_state'] !== 'submitted' && empty($existing['current_submission_id'])) $updates['submission_state'] = 'not_started';
                    $this->database()->table('osad_portfolio_submission_access')->where('portal_id', $portalId)->where('student_profile_id', $studentId)->update($updates);
                } elseif ($existing['submission_state'] === 'submitted') {
                    continue;
                }
            } else {
                $this->database()->table('osad_portfolio_submission_access')->insert(['id' => $this->uuid(), 'portal_id' => $portalId, 'student_profile_id' => $studentId, 'access_status' => 'active', 'submission_state' => 'not_started', 'selected_by' => $actorId, 'selected_at' => date('Y-m-d H:i:s.u')]);
            }
            $access = $this->database()->table('osad_portfolio_submission_access')->where('portal_id', $portalId)->where('student_profile_id', $studentId)->get()->getRowArray();
            foreach ($awardIds as $awardId) {
                $alreadyAssigned = $this->database()->table('osad_portfolio_submission_access_awards')->where('access_id', $access['id'])->where('award_definition_id', $awardId)->countAllResults() > 0;
                if (! $alreadyAssigned) $this->database()->table('osad_portfolio_submission_access_awards')->insert(['id' => $this->uuid(), 'access_id' => $access['id'], 'award_definition_id' => $awardId, 'assigned_by' => $actorId]);
            }
            if ($newlySelected || $wasRevoked) $this->event($portalId, $studentId, $actorId, 'student_selected');
            $added++;
        }
        return $added;
    }

    public function assignStudentAwards(string $portalId, string $studentId, array $awardIds, string $actorId): void
    {
        $portal = $this->requirePortal($portalId);
        if ($portal['status'] !== 'open') throw new RuntimeException('PORTAL_NOT_OPEN');
        $access = $this->studentAccess($portalId, $studentId, false);
        if ($access['submission_state'] === 'submitted') throw new RuntimeException('SUBMITTED_AWARDS_LOCKED');
        $awardIds = $this->normalizeAwardIds($awardIds);
        $portalAwardIds = array_column($this->database()->table('osad_portfolio_submission_portal_awards')->select('award_definition_id')->where('portal_id', $portalId)->get()->getResultArray(), 'award_definition_id');
        if ($portalAwardIds === [] && ! empty($portal['award_definition_id'])) $portalAwardIds = [$portal['award_definition_id']];
        if (array_diff($awardIds, $portalAwardIds) !== []) throw new RuntimeException('AWARD_NOT_IN_PORTAL');
        $this->database()->transStart();
        $this->database()->table('osad_portfolio_submission_access_awards')->where('access_id', $access['id'])->delete();
        foreach ($awardIds as $awardId) $this->database()->table('osad_portfolio_submission_access_awards')->insert([
            'id' => $this->uuid(), 'access_id' => $access['id'], 'award_definition_id' => $awardId, 'assigned_by' => $actorId,
        ]);
        $this->database()->transComplete();
        if (! $this->database()->transStatus()) throw new RuntimeException('AWARD_ASSIGNMENT_FAILED');
    }

    public function updatePortalStatus(string $portalId, string $status, string $actorId): array
    {
        if (! in_array($status, ['open', 'closed'], true)) throw new RuntimeException('INVALID_PORTAL_STATUS');
        $portal = $this->requirePortal($portalId);
        if ($status === 'open') {
            $awardCount = $this->database()->table('osad_portfolio_submission_portal_awards')->where('portal_id', $portalId)->countAllResults();
            if ($awardCount === 0 && ! empty($portal['award_definition_id'])) $awardCount = 1;
            $selectedCount = $this->database()->table('osad_portfolio_submission_access a')
                ->join('osad_portfolio_submission_access_awards aa', 'aa.access_id = a.id')
                ->where('a.portal_id', $portalId)->where('a.access_status', 'active')->countAllResults();
            if ($awardCount === 0 || $selectedCount === 0) throw new RuntimeException('PORTAL_ASSIGNMENTS_REQUIRED');
        }
        $now = date('Y-m-d H:i:s.u');
        $this->database()->table('osad_portfolio_submission_portals')->where('id', $portalId)->update([
            'status' => $status, 'updated_by' => $actorId, 'closed_at' => $status === 'closed' ? $now : null, 'updated_at' => $now,
        ]);
        foreach ($this->database()->table('osad_portfolio_submission_access')->where('portal_id', $portalId)->where('access_status', 'active')->get()->getResultArray() as $access) {
            $this->event($portalId, $access['student_profile_id'], $actorId, $status === 'open' ? 'portal_opened' : 'portal_closed');
        }
        return $this->portalDetails($portalId);
    }

    public function revokeStudent(string $portalId, string $studentId, string $actorId): void
    {
        $this->requirePortal($portalId);
        $access = $this->studentAccess($portalId, $studentId, false);
        if ($access['submission_state'] === 'submitted') throw new RuntimeException('SUBMITTED_ACCESS_CANNOT_BE_REVOKED');
        $this->database()->table('osad_portfolio_submission_access')->where('portal_id', $portalId)->where('student_profile_id', $studentId)->update(['access_status' => 'revoked']);
        $this->event($portalId, $studentId, $actorId, 'access_revoked');
    }

    public function startEvaluation(string $portalId, string $studentId, string $actorId): void
    {
        $access = $this->studentAccess($portalId, $studentId, false);
        if ($access['submission_state'] !== 'submitted') throw new RuntimeException('SUBMISSION_REQUIRED');
        $now = date('Y-m-d H:i:s.u');
        $this->database()->table('osad_portfolio_submission_access')->where('portal_id', $portalId)->where('student_profile_id', $studentId)->update(['evaluation_started_at' => $access['evaluation_started_at'] ?: $now]);
        $this->event($portalId, $studentId, $actorId, 'evaluation_started', $access['current_submission_id']);
    }

    public function reopen(string $portalId, string $studentId, string $actorId, string $reason, bool $acknowledgeException): array
    {
        $reason = trim($reason);
        if (mb_strlen($reason) < 8) throw new RuntimeException('REOPEN_REASON_REQUIRED');
        $access = $this->studentAccess($portalId, $studentId, false);
        if ($access['submission_state'] !== 'submitted' || empty($access['current_submission_id'])) throw new RuntimeException('SUBMISSION_NOT_FINAL');
        $evaluationStartedAt = $this->evaluationStarted($portalId, $studentId, $access['evaluation_started_at'] ?: null);
        $exception = $evaluationStartedAt !== null;
        if ($exception && ! $acknowledgeException) throw new RuntimeException('EVALUATION_EXCEPTION_ACK_REQUIRED');
        $this->database()->table('osad_portfolio_submission_access')->where('portal_id', $portalId)->where('student_profile_id', $studentId)->update(['submission_state' => 'reopened']);
        if ($evaluationStartedAt && empty($access['evaluation_started_at'])) {
            $this->database()->table('osad_portfolio_submission_access')->where('portal_id', $portalId)->where('student_profile_id', $studentId)->update(['evaluation_started_at' => $evaluationStartedAt]);
        }
        $this->event($portalId, $studentId, $actorId, 'reopened', $access['current_submission_id'], $reason, $exception);
        return ['evaluation_exception' => $exception, 'current_submission_id' => $access['current_submission_id']];
    }

    private function copyEvidenceForSnapshot(array $file, string $studentId, string $submissionId): array
    {
        $source = $this->files()->resolveAbsolutePath((string) ($file['storage_path'] ?? ''));
        if ($source === null || ! is_file($source)) throw new RuntimeException('SUBMISSION_EVIDENCE_UNAVAILABLE');
        $extension = $this->files()->extractExtension((string) ($file['original_filename'] ?? '')) ?: 'dat';
        $stored = $this->files()->storeFile($source, 'student', $studentId, $submissionId, $extension);
        return [
            'id' => pathinfo($stored['stored_filename'], PATHINFO_FILENAME),
            'original_filename' => (string) ($file['original_filename'] ?? 'Evidence file'),
            'mime_type' => (string) ($file['detected_mime_type'] ?? $stored['detected_mime_type']),
            'byte_size' => (int) $stored['byte_size'],
            'uploaded_at' => $file['uploaded_at'] ?? null,
            'storage_path' => $stored['storage_path'],
            'download_endpoint' => '/api/v1/student/portfolio-submission/submissions/' . $submissionId . '/files/' . pathinfo($stored['stored_filename'], PATHINFO_FILENAME),
        ];
    }

    public function submit(string $portalId, string $studentId, array $selectedAwardIds = []): array
    {
        $portal = $this->requirePortal($portalId);
        $access = $this->studentAccess($portalId, $studentId, false);
        if ($access['submission_state'] !== 'reopened' && ($portal['status'] !== 'open' || ! $this->submissionWindowIsOpen($portal))) throw new RuntimeException('PORTAL_NOT_OPEN');
        if (! in_array($access['submission_state'], ['not_started','draft','reopened'], true)) throw new RuntimeException('SUBMISSION_ALREADY_FINAL');
        $selectedAwardIds = array_values(array_unique(array_filter(array_map(static fn($id): string => is_scalar($id) ? trim((string) $id) : '', $selectedAwardIds))));
        if ($selectedAwardIds === []) throw new RuntimeException('AWARD_SELECTION_REQUIRED');
        $allowedAwardIds = array_column($this->database()->table('osad_portfolio_submission_access_awards')->select('award_definition_id')->where('access_id', $access['id'])->get()->getResultArray(), 'award_definition_id');
        if (array_diff($selectedAwardIds, $allowedAwardIds) !== []) throw new RuntimeException('AWARD_NOT_ASSIGNED');
        $awardRows = $this->database()->table('award_definitions')->select('id, name')->whereIn('id', $selectedAwardIds)->get()->getResultArray();
        if (count($awardRows) !== count($selectedAwardIds)) throw new RuntimeException('AWARD_NOT_FOUND');
        $records = $this->database()->table('student_portfolio_records spr')
            ->select('spr.id, spr.title, spr.organizer_or_body, spr.occurrence_date, spr.start_date, spr.end_date, spr.description, spr.structured_metadata, spr.status, spr.submitted_at, spr.verified_at, spr.created_at, pc.name AS category_name, ps.name AS subcategory_name')
            ->join('portfolio_categories pc', 'pc.id = spr.category_id', 'left')->join('portfolio_subcategories ps', 'ps.id = spr.subcategory_id', 'left')
            ->where('spr.student_profile_id', $studentId)->orderBy('spr.start_date', 'DESC')->orderBy('spr.created_at', 'DESC')->get()->getResultArray();
        if ($records === []) throw new RuntimeException('PORTFOLIO_EMPTY');

        $submissionId = $this->uuid();
        $version = (int) ($this->database()->table('osad_portfolio_submissions')->selectMax('version_number')->where('portal_id', $portalId)->where('student_profile_id', $studentId)->get()->getRow()->version_number ?? 0) + 1;
        $copiedPaths = [];
        try {
            $portfolio = [];
            foreach ($records as $record) {
                $metadata = json_decode((string) ($record['structured_metadata'] ?? '{}'), true) ?: [];
                $evidence = $this->database()->table('student_portfolio_evidence')->where('portfolio_record_id', $record['id'])->where('status', 'active')->orderBy('uploaded_at', 'ASC')->get()->getResultArray();
                $files = [];
                foreach ($evidence as $file) {
                    $copy = $this->copyEvidenceForSnapshot($file, $studentId, $submissionId);
                    $copiedPaths[] = $copy['storage_path'];
                    $files[] = $copy;
                }
                $portfolio[] = [
                    'record_id' => $record['id'], 'title' => $record['title'], 'organizer' => $record['organizer_or_body'],
                    'category' => $record['category_name'], 'subcategory' => $record['subcategory_name'],
                    'start_date' => $record['start_date'] ?? $record['occurrence_date'], 'end_date' => $record['end_date'],
                    'description' => $record['description'], 'details' => $this->studentSafeMetadata($metadata),
                    'verification_status' => $record['status'], 'submitted_at' => $record['submitted_at'], 'verified_at' => $record['verified_at'],
                    'evidence' => $files,
                ];
            }
            $student = $this->database()->table('profiles')->select('id, full_name, institutional_id')->where('id', $studentId)->get()->getRowArray();
            $snapshot = ['name' => 'Portfolio Submission', 'version' => $version, 'submitted_at' => date('Y-m-d H:i:s'), 'student' => ['name' => $student['full_name'] ?? '', 'student_id' => $student['institutional_id'] ?? ''], 'awards' => $awardRows, 'records' => $portfolio];
            $this->database()->transStart();
            $this->database()->table('osad_portfolio_submissions')->where('portal_id', $portalId)->where('student_profile_id', $studentId)->where('status', 'current')->update(['status' => 'superseded']);
            $this->database()->table('osad_portfolio_submissions')->insert([
                'id' => $submissionId, 'portal_id' => $portalId, 'student_profile_id' => $studentId,
                'version_number' => $version, 'snapshot_json' => json_encode($snapshot, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                'status' => 'current', 'submitted_by' => $studentId, 'submitted_at' => date('Y-m-d H:i:s.u'),
            ]);
            foreach ($selectedAwardIds as $awardId) $this->database()->table('osad_portfolio_submission_submission_awards')->insert([
                'id' => $this->uuid(), 'submission_id' => $submissionId, 'award_definition_id' => $awardId,
            ]);
            $this->database()->table('osad_portfolio_submission_access')->where('portal_id', $portalId)->where('student_profile_id', $studentId)
                ->update(['submission_state' => 'submitted', 'current_submission_id' => $submissionId]);
            $this->event($portalId, $studentId, $studentId, 'submitted', $submissionId);
            $this->database()->transComplete();
            if (! $this->database()->transStatus()) throw new RuntimeException('PORTFOLIO_SUBMISSION_FAILED');
            return ['submission_id' => $submissionId, 'version' => $version, 'submitted_at' => $snapshot['submitted_at'], 'record_count' => count($portfolio)];
        } catch (Throwable $error) {
            foreach ($copiedPaths as $path) $this->files()->deletePhysicalFile($path);
            throw $error;
        }
    }

    public function submissionForOsad(string $portalId, string $studentId): array
    {
        $access = $this->studentAccess($portalId, $studentId, false);
        $versions = $this->database()->table('osad_portfolio_submissions')->where('portal_id', $portalId)->where('student_profile_id', $studentId)->orderBy('version_number', 'DESC')->get()->getResultArray();
        return ['access' => $access, 'versions' => array_map(function (array $version): array {
            $version['snapshot'] = json_decode((string) $version['snapshot_json'], true) ?: [];
            $version['awards'] = $this->database()->table('osad_portfolio_submission_submission_awards aa')
                ->select('ad.id, ad.name')->join('award_definitions ad', 'ad.id = aa.award_definition_id')
                ->where('aa.submission_id', $version['id'])->orderBy('ad.name', 'ASC')->get()->getResultArray();
            unset($version['snapshot_json']);
            return $version;
        }, $versions)];
    }

    public function submissionFile(string $portalId, string $studentId, string $submissionId, string $fileId, string $actorId, bool $isStudent): array
    {
        if ($isStudent) {
            $access = $this->studentAccess($portalId, $studentId, false);
            if (! $this->studentCanAccessPortal([
                'status' => $access['portal_status'], 'start_date' => $access['start_date'], 'end_date' => $access['end_date'],
            ], $access)) throw new RuntimeException('PORTAL_ACCESS_NOT_AVAILABLE');
        }
        else $this->requirePortal($portalId);
        $row = $this->database()->table('osad_portfolio_submissions')->where('id', $submissionId)->where('portal_id', $portalId)->where('student_profile_id', $studentId)->get()->getRowArray();
        if ($row === null) throw new RuntimeException('SUBMISSION_NOT_FOUND');
        $snapshot = json_decode((string) $row['snapshot_json'], true) ?: [];
        foreach ($snapshot['records'] ?? [] as $record) foreach ($record['evidence'] ?? [] as $file) {
            if (($file['id'] ?? '') !== $fileId) continue;
            $path = $this->files()->resolveAbsolutePath((string) ($file['storage_path'] ?? ''));
            if ($path === null || ! is_file($path)) throw new RuntimeException('SUBMISSION_EVIDENCE_UNAVAILABLE');
            return ['path' => $path, 'mime_type' => $file['mime_type'] ?? 'application/octet-stream', 'filename' => $file['original_filename'] ?? 'evidence'];
        }
        throw new RuntimeException('SUBMISSION_EVIDENCE_NOT_FOUND');
    }
}
