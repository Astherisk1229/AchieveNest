<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;

/** Derives legacy portfolio summary columns from the active configured OSAD intake contract. */
final class StudentAchievementRecordSummaryService
{
    private StudentAchievementFormSchemaRegistry $registry;
    private array $schemaCache = [];

    public function __construct(private ?BaseConnection $db = null, ?StudentAchievementFormSchemaRegistry $registry = null)
    {
        $this->db ??= db_connect();
        $this->registry = $registry ?? new StudentAchievementFormSchemaRegistry();
    }

    /**
     * Returns null for legacy schema records. For configured records the visible form fields are
     * the source of truth; these values only populate the existing summary columns/read models.
     */
    public function derive(string $categoryId, ?string $subcategoryId, array $metadata): ?array
    {
        if (($metadata['schema_version'] ?? null) !== StudentAchievementFormSchemaRegistry::VERSION || !$subcategoryId) {
            return null;
        }

        [$contract, $schema] = $this->resolve($categoryId, $subcategoryId);
        if (!$contract || !$schema) return null;

        $fields = $schema['fields'] ?? [];
        $title = $this->firstConfiguredValue($fields, $metadata, $this->titleKeys((string) $contract['contract_code']))
            ?? trim((string) ($schema['label'] ?? $contract['display_name'] ?? 'Student achievement'));
        $organizer = $this->firstConfiguredValue($fields, $metadata, $this->organizerKeys((string) $contract['contract_code']));
        [$startDate, $endDate] = $this->dates($fields, $metadata);

        return [
            'title' => $title,
            'organizer_or_body' => $organizer,
            'occurrence_date' => $startDate,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'description' => $this->firstConfiguredValue($fields, $metadata, ['additional_notes']),
        ];
    }

    /** Stable configured-field key used for duplicate submissions; free-form notes are ignored. */
    public function fingerprint(string $categoryId, ?string $subcategoryId, array $metadata): ?string
    {
        if (($metadata['schema_version'] ?? null) !== StudentAchievementFormSchemaRegistry::VERSION) return null;
        [$contract, $schema] = $this->resolve($categoryId, $subcategoryId);
        if (!$contract || !$schema) return null;

        $identity = ['contract_code' => (string) $contract['contract_code']];
        foreach ($schema['fields'] ?? [] as $field) {
            if (($field['control'] ?? '') === 'textarea' && ($field['key'] ?? '') === 'additional_notes') continue;
            foreach ($field['payload_keys'] ?? [$field['key'] ?? ''] as $key) {
                if ($key === '' || $key === 'source_period_text' || $key === 'additional_notes' || !array_key_exists($key, $metadata)) continue;
                $value = $metadata[$key];
                if (is_string($value)) $value = mb_strtolower(preg_replace('/\s+/', ' ', trim($value)));
                if ($value !== null && $value !== '') $identity[$key] = $value;
            }
        }
        if (count($identity) === 1) return null;
        ksort($identity);
        return hash('sha256', json_encode($identity, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    /**
     * Compatibility projection for an editable configured record. Only fills blank legacy
     * columns so an edit can make new records visible to older scoring readers without
     * rewriting historical values.
     */
    public function missingLegacyColumns(array $record, array $summary): array
    {
        $changes = [];
        foreach (['title', 'organizer_or_body', 'occurrence_date', 'start_date', 'end_date', 'description'] as $field) {
            $current = trim((string) ($record[$field] ?? ''));
            $derived = $summary[$field] ?? null;
            if ($current === '' && is_string($derived) && trim($derived) !== '') {
                $changes[$field] = trim($derived);
            }
        }
        if (empty($record['occurrence_date']) && !empty($changes['start_date'])) {
            $changes['occurrence_date'] = $changes['start_date'];
        }
        return $changes;
    }

    private function resolve(string $categoryId, ?string $subcategoryId): array
    {
        if (!$subcategoryId) return [null, null];
        $cacheKey = $categoryId . ':' . $subcategoryId;
        if (array_key_exists($cacheKey, $this->schemaCache)) return $this->schemaCache[$cacheKey];
        $contract = $this->db->table('achievement_contracts')
            ->where('domain', 'STUDENT')->where('is_active', 1)
            ->where('legacy_category_id', $categoryId)
            ->where('legacy_subcategory_id', $subcategoryId)
            ->get()->getRowArray();
        if (!$contract) return $this->schemaCache[$cacheKey] = [null, null];
        try {
            $schema = $this->registry->get((string) $contract['contract_code']);
        } catch (\RuntimeException) {
            $schema = null;
        }
        return $this->schemaCache[$cacheKey] = [$contract, $schema];
    }

    /**
     * Summary mappings are explicit by contract family. A broad label match used to
     * mistake an organization name or granting body for the achievement title.
     */
    private function titleKeys(string $contractCode): array
    {
        return match (substr($contractCode, 0, 3)) {
            'S01' => ['position_held'],
            'S02' => match ($contractCode) {
                'S02-GENERAL_MEMBER' => ['organization_name'],
                'S02-COMMITTEE_MEMBER' => ['related_activity_title', 'committee_name', 'organization_name'],
                'S02-ACTIVITY_PARTICIPANT', 'S02-FACILITATOR_ORGANIZER' => ['activity_program_title', 'organization_name'],
                default => ['project_initiative_title', 'organization_name'],
            },
            'S03' => ['service_activity_project_title'],
            'S04' => $contractCode === 'S04-INITIATED_CHURCH_RELATED_ACTIVITY'
                ? ['activity_initiative_title']
                : ['involvement_activity_title', 'role_position', 'ministry_or_organization_name', 'specified_ministry_or_organization'],
            'S05' => ['activity_program_title'],
            'S06' => ['recognition_title_name'],
            'S07' => ['competition_event_title'],
            'S08' => ['event_competition_title'],
            'S09' => ['title_of_work', 'publication_role'],
            default => [],
        };
    }

    private function organizerKeys(string $contractCode): array
    {
        return match (substr($contractCode, 0, 3)) {
            'S01' => ['governing_body_name'],
            'S02' => ['organization_name'],
            'S03' => ['organizer_implementing_body', 'university_unit_or_office', 'church_parish_ministry_organization', 'partner_organization'],
            'S04' => ['ministry_or_organization_name', 'specified_ministry_or_organization', 'church_ministry_context_affiliation'],
            'S05', 'S07', 'S08' => ['organizer_issuing_organization'],
            'S06' => ['granting_body_name'],
            'S09' => ['publication_outlet'],
            default => [],
        };
    }

    private function firstConfiguredValue(array $fields, array $metadata, array $keys): ?string
    {
        $available = [];
        foreach ($fields as $field) {
            if (($field['control'] ?? '') !== 'fixed') $available[(string) ($field['key'] ?? '')] = true;
        }
        foreach ($keys as $key) {
            if (!isset($available[$key])) continue;
            $value = $metadata[$key] ?? null;
            if (is_scalar($value) && trim((string) $value) !== '') return trim((string) $value);
        }
        return null;
    }

    /** @return array{0:?string,1:?string} */
    private function dates(array $fields, array $metadata): array
    {
        foreach ($fields as $field) {
            $control = $field['control'] ?? '';
            $rules = $field['validation'] ?? [];
            if ($control === 'date') {
                $date = $metadata[$field['key'] ?? ''] ?? null;
                if ($this->isIsoDate($date)) return [$date, null];
            }
            if ($control === 'date_range') {
                $start = $metadata[$rules['start_key'] ?? ''] ?? null;
                $end = $metadata[$rules['end_key'] ?? ''] ?? null;
                if ($this->isIsoDate($start)) return [$start, $this->isIsoDate($end) ? $end : null];
            }
            if ($control === 'structured_date_or_range' && ($metadata[$rules['precision_key'] ?? 'period_precision'] ?? null) === 'DATE') {
                $year = $metadata['period_start_year'] ?? null;
                $month = $metadata['period_start_month'] ?? null;
                $day = $metadata['period_start_day'] ?? null;
                if (ctype_digit((string) $year) && ctype_digit((string) $month) && ctype_digit((string) $day)
                    && checkdate((int) $month, (int) $day, (int) $year)) {
                    return [sprintf('%04d-%02d-%02d', $year, $month, $day), null];
                }
            }
            if ($control === 'ongoing_academic_year_or_activity_dates' && ($metadata['record_mode'] ?? null) === 'ACTIVITY') {
                $start = $metadata['activity_start_date'] ?? null;
                $end = $metadata['activity_end_date'] ?? null;
                if ($this->isIsoDate($start)) return [$start, $this->isIsoDate($end) ? $end : null];
            }
        }
        return [null, null];
    }

    private function isIsoDate(mixed $value): bool
    {
        if (!is_string($value) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) return false;
        $date = \DateTime::createFromFormat('!Y-m-d', $value);
        return $date !== false && $date->format('Y-m-d') === $value;
    }
}
