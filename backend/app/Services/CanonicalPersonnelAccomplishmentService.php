<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;
use Throwable;

/** Transactional bridge from the active personnel read model to the governed achievement graph. */
class CanonicalPersonnelAccomplishmentService
{
    private const LEGACY_TABLE = 'personnel_accomplishments';
    private const A3_CONTRACT = 'FAC-A3';
    private const NTF_B1A_CONTRACT = 'NTF-B1A';

    public function __construct(protected ?BaseConnection $db = null)
    {
        $this->db ??= db_connect();
    }

    public function supports(string $categoryCode, array $metadata): bool
    {
        return $this->supportsA3($categoryCode, $metadata)
            || $this->supportsNtfB1A($categoryCode, $metadata);
    }

    private function supportsA3(string $categoryCode, array $metadata): bool
    {
        return $categoryCode === 'A.3'
            && ($metadata['portfolio_format'] ?? '') === 'faculty_academic'
            && ($metadata['subcategory_code'] ?? '') === 'A3_ATTENDANCE';
    }

    public function supportsNtfB1A(string $categoryCode, array $metadata): bool
    {
        return $categoryCode === 'B.1.a'
            && ($metadata['portfolio_format'] ?? '') === 'non_teaching_faculty'
            && ($metadata['contract_code'] ?? '') === self::NTF_B1A_CONTRACT
            && ($metadata['criterion_code'] ?? '') === 'B.1.a';
    }

    public function create(string $categoryCode, array $compatibilityRow, array $metadata): array
    {
        if ($this->supportsA3($categoryCode, $metadata)) {
            return $this->createA3($compatibilityRow, $metadata);
        }
        if ($this->supportsNtfB1A($categoryCode, $metadata)) {
            return $this->createNtfB1A($compatibilityRow, $metadata);
        }
        throw new RuntimeException('CANONICAL_PERSONNEL_CONTRACT_UNSUPPORTED');
    }

    /**
     * Creates the compatibility record and its governed canonical A.3 graph.
     * The caller supplies the already validated compatibility insert payload.
     */
    public function createA3(array $compatibilityRow, array $metadata): array
    {
        $legacyId = (string) ($compatibilityRow['id'] ?? '');
        $ownerId = (string) ($compatibilityRow['personnel_profile_id'] ?? '');
        if ($legacyId === '' || $ownerId === '') {
            throw new RuntimeException('CANONICAL_PERSONNEL_IDENTITY_REQUIRED');
        }
        $categoryCode = (string) ($compatibilityRow['category_code'] ?? $metadata['criterion_code'] ?? '');
        if (! $this->supportsA3($categoryCode, $metadata)) {
            throw new RuntimeException('CANONICAL_PERSONNEL_CONTRACT_UNSUPPORTED');
        }

        $contract = $this->db->table('achievement_contracts')
            ->where('contract_code', self::A3_CONTRACT)
            ->where('domain', 'FACULTY')
            ->where('criterion_code', 'A.3')
            ->where('is_active', 1)
            ->get()->getRowArray();
        if (! $contract) {
            throw new RuntimeException('CANONICAL_PERSONNEL_CONTRACT_NOT_FOUND:FAC-A3');
        }

        $detail = $this->normalizeA3Detail($compatibilityRow, $metadata);
        return $this->persistGraph(
            $compatibilityRow,
            self::A3_CONTRACT,
            'FACULTY',
            'A.3',
            'Created transactionally from the governed Personnel A.3 API workflow.',
            fn (string $versionId) => $this->insertTypedDetail($versionId, $detail)
        );
    }

    /** Creates the compatibility record and governed NTF B.1.a graph atomically. */
    public function createNtfB1A(array $compatibilityRow, array $metadata): array
    {
        $legacyId = (string) ($compatibilityRow['id'] ?? '');
        $ownerId = (string) ($compatibilityRow['personnel_profile_id'] ?? '');
        if ($legacyId === '' || $ownerId === '') {
            throw new RuntimeException('CANONICAL_PERSONNEL_IDENTITY_REQUIRED');
        }
        $categoryCode = (string) ($compatibilityRow['category_code'] ?? $metadata['criterion_code'] ?? '');
        if (! $this->supportsNtfB1A($categoryCode, $metadata)) {
            throw new RuntimeException('CANONICAL_PERSONNEL_CONTRACT_UNSUPPORTED');
        }

        $detail = $this->normalizeNtfB1ADetail($compatibilityRow, $metadata);
        return $this->persistGraph(
            $compatibilityRow,
            self::NTF_B1A_CONTRACT,
            'NTP',
            'B.1.a',
            'Created transactionally from the governed NTF B.1.a API workflow.',
            fn (string $versionId) => $this->insertNtfB1ADetail($versionId, $detail)
        );
    }

    private function persistGraph(
        array $compatibilityRow,
        string $contractCode,
        string $contractDomain,
        string $criterionCode,
        string $mappingNotes,
        callable $insertDetail
    ): array {
        $legacyId = (string) $compatibilityRow['id'];
        $ownerId = (string) $compatibilityRow['personnel_profile_id'];
        $contract = $this->db->table('achievement_contracts')
            ->where('contract_code', $contractCode)
            ->where('domain', $contractDomain)
            ->where('criterion_code', $criterionCode)
            ->where('is_active', 1)
            ->get()->getRowArray();
        if (! $contract) {
            throw new RuntimeException("CANONICAL_PERSONNEL_CONTRACT_NOT_FOUND:{$contractCode}");
        }

        $rootId = $this->uuid();
        $versionId = $this->uuid();
        $now = date('Y-m-d H:i:s.u');

        $this->db->transBegin();
        try {
            $duplicateHash = $compatibilityRow['duplicate_hash'] ?? null;
            if (is_string($duplicateHash) && $duplicateHash !== ''
                && $this->db->table(self::LEGACY_TABLE)->where([
                    'personnel_profile_id' => $ownerId,
                    'duplicate_hash' => $duplicateHash,
                ])->countAllResults() > 0) {
                throw new RuntimeException('CANONICAL_PERSONNEL_DUPLICATE');
            }
            if (! $this->db->fieldExists('duplicate_hash', self::LEGACY_TABLE)) {
                $identity = [
                    'personnel_profile_id' => $ownerId,
                    'category_code' => $compatibilityRow['category_code'] ?? null,
                    'title' => $compatibilityRow['title'] ?? null,
                    'occurrence_date' => $compatibilityRow['occurrence_date'] ?? null,
                ];
                if ($this->db->table(self::LEGACY_TABLE)->where($identity)->countAllResults() > 0) {
                    throw new RuntimeException('CANONICAL_PERSONNEL_DUPLICATE');
                }
            }
            if ($this->db->table('achievement_legacy_crosswalk')->where([
                'legacy_table' => self::LEGACY_TABLE,
                'legacy_id' => $legacyId,
            ])->countAllResults() > 0) {
                throw new RuntimeException('CANONICAL_PERSONNEL_GRAPH_ALREADY_EXISTS');
            }

            $this->db->table(self::LEGACY_TABLE)->insert($compatibilityRow);
            $this->db->table('achievement_records')->insert([
                'id' => $rootId,
                'owner_profile_id' => $ownerId,
                'owner_domain' => 'PERSONNEL',
                'current_version_id' => null,
                'canonical_status' => 'active',
                'surviving_record_id' => null,
                'created_by_profile_id' => $ownerId,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $this->db->table('achievement_record_versions')->insert([
                'id' => $versionId,
                'achievement_record_id' => $rootId,
                'version_number' => 1,
                'previous_version_id' => null,
                'contract_code' => $contractCode,
                'submission_state' => 'draft',
                'source_type' => 'OWNER_ENTRY',
                'created_by_profile_id' => $ownerId,
                'revision_token' => 1,
                'created_at' => $now,
                'submitted_at' => null,
                'locked_at' => null,
            ]);
            $insertDetail($versionId);
            $this->db->table('achievement_records')->where('id', $rootId)->update([
                'current_version_id' => $versionId,
                'updated_at' => $now,
            ]);
            $this->db->table('achievement_legacy_crosswalk')->insert([
                'id' => $this->uuid(),
                'legacy_table' => self::LEGACY_TABLE,
                'legacy_id' => $legacyId,
                'achievement_record_id' => $rootId,
                'record_version_id' => $versionId,
                'backfill_run_id' => null,
                'mapping_status' => 'mapped',
                'mapped_contract_code' => $contractCode,
                'legacy_payload' => json_encode($compatibilityRow, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'mapping_notes' => $mappingNotes,
                'mapped_by_profile_id' => $ownerId,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            if ($this->db->transStatus() === false) {
                throw new RuntimeException('CANONICAL_PERSONNEL_TRANSACTION_FAILED');
            }
            $this->db->transCommit();
        } catch (Throwable $e) {
            $this->db->transRollback();
            throw $e;
        }

        return [
            'legacy_id' => $legacyId,
            'achievement_record_id' => $rootId,
            'record_version_id' => $versionId,
        ];
    }

    protected function insertTypedDetail(string $versionId, array $detail): void
    {
        $this->db->table('personnel_seminar_training_attendance_details')->insert([
            'record_version_id' => $versionId,
            'start_date' => $detail['start_date'],
            'end_date' => $detail['end_date'],
            'title' => $detail['title'],
            'conducted_or_organized_by' => $detail['conducted_or_organized_by'],
            'remarks' => $detail['remarks'],
        ]);
    }

    protected function insertNtfB1ADetail(string $versionId, array $detail): void
    {
        $this->db->table('personnel_moderator_assignment_details')->insert([
            'record_version_id' => $versionId,
            'period_precision' => $detail['period_precision'],
            'period_start_year' => $detail['period_start_year'],
            'period_start_month' => $detail['period_start_month'],
            'period_start_day' => $detail['period_start_day'],
            'period_end_year' => $detail['period_end_year'],
            'period_end_month' => $detail['period_end_month'],
            'period_end_day' => $detail['period_end_day'],
            'is_ongoing' => $detail['is_ongoing'],
            'source_period_text' => null,
            'clubs_organizations' => $detail['clubs_organizations'],
            'assignment_role' => $detail['assignment_role'],
            'conducted_or_organized_by' => $detail['conducted_or_organized_by'],
            'remarks' => $detail['remarks'],
        ]);
    }

    private function normalizeA3Detail(array $row, array $metadata): array
    {
        $details = is_array($metadata['details'] ?? null) ? $metadata['details'] : [];
        $start = trim((string) ($metadata['start_date'] ?? ''));
        $end = trim((string) ($metadata['end_date'] ?? ''));
        $title = trim((string) ($details['title'] ?? $row['title'] ?? ''));
        $organizer = trim((string) ($details['organizer'] ?? $row['organizer_or_publisher'] ?? ''));
        if (! $this->validDate($start) || ! $this->validDate($end) || $end < $start) {
            throw new RuntimeException('CANONICAL_PERSONNEL_A3_DATE_INVALID');
        }
        if ($title === '' || mb_strlen($title) > 255) {
            throw new RuntimeException('CANONICAL_PERSONNEL_A3_TITLE_INVALID');
        }
        if ($organizer === '' || mb_strlen($organizer) > 255) {
            throw new RuntimeException('CANONICAL_PERSONNEL_A3_ORGANIZER_INVALID');
        }
        $remarks = trim((string) ($row['description'] ?? ''));
        return [
            'start_date' => $start,
            'end_date' => $end,
            'title' => $title,
            'conducted_or_organized_by' => $organizer,
            'remarks' => $remarks !== '' ? $remarks : null,
        ];
    }

    private function normalizeNtfB1ADetail(array $row, array $metadata): array
    {
        $details = is_array($metadata['details'] ?? null) ? $metadata['details'] : [];
        $start = trim((string) ($metadata['start_date'] ?? ''));
        $end = trim((string) ($metadata['end_date'] ?? ''));
        $ongoing = ($metadata['ongoing'] ?? false) === true;
        $organization = trim((string) ($details['organization'] ?? ''));
        $role = strtoupper(trim((string) ($details['assignment_role'] ?? $details['role'] ?? '')));
        $organizer = trim((string) ($details['organizer'] ?? $row['organizer_or_publisher'] ?? ''));
        if (! $this->validDate($start) || (! $ongoing && ! $this->validDate($end)) || ($end !== '' && $end < $start)) {
            throw new RuntimeException('CANONICAL_PERSONNEL_NTF_B1A_DATE_INVALID');
        }
        if ($organization === '' || mb_strlen($organization) > 255) {
            throw new RuntimeException('CANONICAL_PERSONNEL_NTF_B1A_ORGANIZATION_INVALID');
        }
        if (! in_array($role, ['MODERATOR', 'OFFICER'], true)) {
            throw new RuntimeException('CANONICAL_PERSONNEL_NTF_B1A_ROLE_INVALID');
        }
        if ($organizer === '' || mb_strlen($organizer) > 255) {
            throw new RuntimeException('CANONICAL_PERSONNEL_NTF_B1A_ORGANIZER_INVALID');
        }
        [$startYear, $startMonth, $startDay] = array_map('intval', explode('-', $start));
        $endParts = $end !== '' ? array_map('intval', explode('-', $end)) : [null, null, null];
        $remarks = trim((string) ($row['description'] ?? ''));
        return [
            'period_precision' => 'RANGE',
            'period_start_year' => $startYear,
            'period_start_month' => $startMonth,
            'period_start_day' => $startDay,
            'period_end_year' => $ongoing ? null : $endParts[0],
            'period_end_month' => $ongoing ? null : $endParts[1],
            'period_end_day' => $ongoing ? null : $endParts[2],
            'is_ongoing' => $ongoing ? 1 : 0,
            'clubs_organizations' => $organization,
            'assignment_role' => $role,
            'conducted_or_organized_by' => $organizer,
            'remarks' => $remarks !== '' ? $remarks : null,
        ];
    }

    private function validDate(string $value): bool
    {
        $date = \DateTimeImmutable::createFromFormat('!Y-m-d', $value);
        $errors = \DateTimeImmutable::getLastErrors();
        return $date !== false
            && (! is_array($errors) || (($errors['warning_count'] ?? 0) === 0 && ($errors['error_count'] ?? 0) === 0))
            && $date->format('Y-m-d') === $value;
    }

    private function uuid(): string
    {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0x0fff) | 0x4000,
            random_int(0, 0x3fff) | 0x8000, random_int(0, 0xffff), random_int(0, 0xffff),
            random_int(0, 0xffff), random_int(0, 0xffff));
    }
}
