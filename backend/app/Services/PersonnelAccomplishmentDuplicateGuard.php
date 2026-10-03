<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;

/**
 * Server-side duplicate rule for personnel (faculty and non-teaching) accomplishments.
 *
 * Identity of an accomplishment: same person + same classification + same date(s) + same details.
 * When the entry has no subcategory (some non-teaching entries), the normalized title stands in for the details.
 *
 * The rule holds even when the database is behind:
 * - with the duplicate_hash column, matching rows are found by index;
 * - rows saved before that column existed (hash NULL), or a database without the column, are compared by
 *   recomputing each of the person's existing records' identity from its stored fields.
 */
class PersonnelAccomplishmentDuplicateGuard
{
    public function __construct(private BaseConnection $db)
    {
    }

    public static function identityHash(string $categoryCode, string $occurrenceDate, array $metadata, string $title = ''): ?string
    {
        $normalize = static fn (mixed $value): string => preg_replace('/\s+/u', ' ', mb_strtolower(trim((string) $value)));
        $subcategory = trim((string) ($metadata['subcategory_code'] ?? ''));
        if ($subcategory === '') {
            // Fallback identity: classification + date + title (entries that carry no structured details).
            $normalizedTitle = $normalize($title);
            if ($categoryCode === '' || $normalizedTitle === '') return null;
            return hash('sha256', json_encode(['category_code' => $categoryCode, 'date' => $occurrenceDate, 'title' => $normalizedTitle, 'identity' => 'title'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        }
        $details = is_array($metadata['details'] ?? null) ? $metadata['details'] : [];
        ksort($details);
        foreach ($details as $key => $value) $details[$key] = $normalize($value);
        // Unchanged from the original rule so stored hashes keep matching.
        $identity = [
            'category_code' => $categoryCode,
            'subcategory_code' => $subcategory,
            'date' => $occurrenceDate,
            'start_date' => (string) ($metadata['start_date'] ?? ''),
            'end_date' => (string) ($metadata['end_date'] ?? ''),
            'ongoing' => ($metadata['ongoing'] ?? false) === true,
            'details' => $details,
        ];
        return hash('sha256', json_encode($identity, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    /** The person's existing record with the same identity (id, title, occurrence_date), or null. */
    public function findDuplicate(string $personnelProfileId, ?string $hash, ?string $excludeId = null): ?array
    {
        if ($hash === null) return null;
        $hasColumn = $this->db->fieldExists('duplicate_hash', 'personnel_accomplishments');

        if ($hasColumn) {
            $builder = $this->db->table('personnel_accomplishments')->select('id, title, occurrence_date')
                ->where('personnel_profile_id', $personnelProfileId)->where('duplicate_hash', $hash);
            if ($excludeId !== null && $excludeId !== '') $builder->where('id !=', $excludeId);
            $row = $builder->get()->getRowArray();
            if ($row) return $row;
        }

        // Records without a stored fingerprint: recompute from their saved fields.
        $columns = ['id', 'title', 'occurrence_date'];
        foreach (['category_code', 'category_metadata'] as $optional) {
            if ($this->db->fieldExists($optional, 'personnel_accomplishments')) $columns[] = $optional;
        }
        $builder = $this->db->table('personnel_accomplishments')->select(implode(', ', $columns))
            ->where('personnel_profile_id', $personnelProfileId);
        if ($hasColumn) $builder->where('duplicate_hash', null);
        if ($excludeId !== null && $excludeId !== '') $builder->where('id !=', $excludeId);
        foreach ($builder->get()->getResultArray() as $row) {
            $metadata = json_decode((string) ($row['category_metadata'] ?? ''), true);
            $rowHash = self::identityHash((string) ($row['category_code'] ?? ''), (string) ($row['occurrence_date'] ?? ''), is_array($metadata) ? $metadata : [], (string) ($row['title'] ?? ''));
            if ($rowHash !== null && hash_equals($rowHash, $hash)) {
                return ['id' => $row['id'], 'title' => $row['title'], 'occurrence_date' => $row['occurrence_date']];
            }
        }
        return null;
    }
}
