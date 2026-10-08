<?php

namespace App\Services;

use App\Helpers\ValidationHelper;
use CodeIgniter\Database\BaseConnection;

/**
 * PortfolioStructuredMetadataValidator
 * Authoritative backend validator for Category-Specific Structured Metadata.
 * Enforces controlled vocabularies, schema lookup, unknown-key rejection, and draft/submit validation rules.
 */
class PortfolioStructuredMetadataValidator
{
    protected BaseConnection $db;

    public const CONTROLLED_VOCABULARIES = [
        'event_level' => ['institutional', 'local', 'regional', 'national', 'international'],
        'placement' => ['champion', 'first_runner_up', 'second_runner_up', 'finalist', 'participant'],
        'publication_status' => ['published', 'draft'],
        'publication_type' => ['news', 'literary', 'column', 'editorial', 'feature'],
        'position_level' => ['executive', 'officer', 'committee_head', 'year_representative'],
        'membership_type' => ['charter_member', 'regular_member', 'honorary_member'],
        'contribution_level' => ['lead_organizer', 'committee_member', 'general_contributor'],
        'service_type' => ['direct_outreach', 'advocacy', 'environmental', 'educational'],
        'ministry_context' => ['campus_ministry', 'parish_ministry', 'church_organization'],
        'training_type' => ['leadership_dev', 'sports_dev', 'socio_cultural_dev', 'journalism_dev', 'professional_dev', 'spiritual_dev', 'community_dev', 'other_dev'],
        'competition_type' => ['tournament', 'league', 'meet', 'invitational'],
        'individual_team' => ['individual', 'team'],
        'individual_group' => ['individual', 'group'],
        'performance_type' => ['solo_performance', 'ensemble_lead', 'ensemble_member', 'exhibition'],
        'authorship_role' => ['lead_author', 'co_author', 'editor', 'illustrator_photographer'],
        'academic_year' => ['2025-2026', '2024-2025', '2023-2024'],
        'semester' => ['1st_semester', '2nd_semester', 'summer'],
    ];

    public const FORBIDDEN_METADATA_KEYS = [
        'award_id', 'award_name', 'score', 'points', 'rubric', 'potential_award',
        'award_criteria', 'scoring_weight', 'evaluator_score', 'criteria_points'
    ];

    public function __construct(?BaseConnection $db = null)
    {
        $this->db = $db ?? db_connect();
    }

    /**
     * Validates Category and Subcategory taxonomy pair.
     * 
     * @return array{valid: bool, error: ?array, category: ?array, subcategory: ?array}
     */
    public function validateTaxonomyPair(string $categoryId, ?string $subcategoryId): array
    {
        if (! ValidationHelper::validateUuid($categoryId)) {
            return [
                'valid' => false,
                'error' => ['code' => 'INVALID_CATEGORY_ID', 'message' => 'category_id must be a valid UUID.'],
                'category' => null,
                'subcategory' => null,
            ];
        }

        $category = $this->db->table('portfolio_categories')
            ->where('id', $categoryId)
            ->where('status', 'active')
            ->get()->getRowArray();

        if ($category === null) {
            return [
                'valid' => false,
                'error' => ['code' => 'INVALID_CATEGORY', 'message' => 'Category does not exist or is inactive.'],
                'category' => null,
                'subcategory' => null,
            ];
        }

        // A category is a valid terminal node only when it has no active children.
        // This keeps nullable subcategory support without allowing clients to skip
        // a configured classification step.
        $activeSubcategoryCount = $this->db->table('portfolio_subcategories')
            ->where('category_id', $categoryId)
            ->where('status', 'active')
            ->countAllResults();
        if (empty($subcategoryId) && $activeSubcategoryCount > 0) {
            return [
                'valid' => false,
                'error' => ['code' => 'SUBCATEGORY_REQUIRED', 'message' => 'Select an active subcategory for this category.'],
                'category' => $category,
                'subcategory' => null,
            ];
        }

        $subcategory = null;
        if (! empty($subcategoryId)) {
            if (! ValidationHelper::validateUuid($subcategoryId)) {
                return [
                    'valid' => false,
                    'error' => ['code' => 'INVALID_SUBCATEGORY_ID', 'message' => 'subcategory_id must be a valid UUID.'],
                    'category' => $category,
                    'subcategory' => null,
                ];
            }

            $subcategory = $this->db->table('portfolio_subcategories')
                ->where('id', $subcategoryId)
                ->where('category_id', $categoryId)
                ->where('status', 'active')
                ->get()->getRowArray();

            if ($subcategory === null) {
                return [
                    'valid' => false,
                    'error' => ['code' => 'INVALID_TAXONOMY_COMBINATION', 'message' => 'Subcategory does not belong to the selected category or is inactive.'],
                    'category' => $category,
                    'subcategory' => null,
                ];
            }
        }

        return [
            'valid' => true,
            'error' => null,
            'category' => $category,
            'subcategory' => $subcategory,
        ];
    }

    /**
     * Validates structured_metadata against the canonical schema and controlled vocabularies.
     * 
     * @return array{valid: bool, errors: array, sanitized_metadata: array}
     */
    public function validateMetadata(
        string $categoryId,
        ?string $subcategoryId,
        array $metadata,
        bool $submitNow = true
    ): array {
        if (($metadata['schema_version'] ?? null) === StudentAchievementFormSchemaRegistry::VERSION) {
            return $this->validateConfiguredSchemaMetadata($categoryId, $subcategoryId, $metadata, $submitNow);
        }

        $errors = [];
        $sanitized = [];

        // 1. Schema version validation
        $schemaVersion = $metadata['schema_version'] ?? '1.0';
        if ($schemaVersion !== '1.0') {
            $errors['structured_metadata.schema_version'] = ['Unsupported schema version. Only version 1.0 is supported.'];
        }
        $sanitized['schema_version'] = '1.0';

        // 2. Reject injection of forbidden award/scoring keys
        foreach (self::FORBIDDEN_METADATA_KEYS as $forbiddenKey) {
            if (array_key_exists($forbiddenKey, $metadata)) {
                $errors["structured_metadata.{$forbiddenKey}"] = ["Field '{$forbiddenKey}' is forbidden in student structured metadata."];
            }
        }

        // 3. Known Schema Allowed Keys per Category / Subcategory
        $allowedKeys = [
            'schema_version', 'academic_year', 'semester', 'event_level', 'placement',
            'organization_name', 'position_level', 'position_title', 'tenure_start', 'tenure_end',
            'membership_type', 'contribution_level', 'committee_name', 'activity_name', 'facilitation_role', 'project_name',
            'service_type', 'beneficiary_type', 'service_scope', 'hours_rendered', 'leadership_role',
            'ministry_context', 'involvement_type', 'parish_or_org', 'initiative_title',
            'training_type', 'hours_duration',
            'recognition_level', 'granting_body',
            'competition_type', 'individual_team', 'team_role',
            'performance_type', 'individual_group',
            'publication_name', 'publication_type', 'publication_status', 'authorship_role', 'publication_date',
            'member_role', 'officer_title', 'event_date'
        ];

        foreach ($metadata as $key => $val) {
            if (! in_array($key, $allowedKeys, true) && ! in_array($key, self::FORBIDDEN_METADATA_KEYS, true)) {
                $errors["structured_metadata.{$key}"] = ["Unknown or unsupported metadata field: '{$key}'."];
            }
        }

        // 4. Validate Controlled Vocabularies where present
        foreach (self::CONTROLLED_VOCABULARIES as $vocabKey => $allowedValues) {
            if (isset($metadata[$vocabKey]) && $metadata[$vocabKey] !== '') {
                $val = is_string($metadata[$vocabKey]) ? strtolower(trim($metadata[$vocabKey])) : $metadata[$vocabKey];
                if (! in_array($val, $allowedValues, true)) {
                    $errors["structured_metadata.{$vocabKey}"] = ["Invalid value '{$metadata[$vocabKey]}' for controlled field {$vocabKey}."];
                } else {
                    $sanitized[$vocabKey] = $val;
                }
            }
        }

        // 5. Validate Open Text & Specific Fields
        $textFields = [
            'organization_name', 'position_title', 'committee_name', 'activity_name',
            'facilitation_role', 'project_name', 'beneficiary_type', 'involvement_type',
            'parish_or_org', 'initiative_title', 'granting_body', 'team_role',
            'publication_name', 'member_role', 'officer_title'
        ];
        foreach ($textFields as $tf) {
            if (isset($metadata[$tf])) {
                $sanitized[$tf] = trim((string) $metadata[$tf]);
            }
        }

        // 6. Validate Numbers
        $numberFields = ['hours_rendered', 'hours_duration'];
        foreach ($numberFields as $nf) {
            if (isset($metadata[$nf]) && $metadata[$nf] !== '') {
                if (! is_numeric($metadata[$nf]) || $metadata[$nf] < 0) {
                    $errors["structured_metadata.{$nf}"] = ["Field {$nf} must be a valid non-negative number."];
                } else {
                    $sanitized[$nf] = (float) $metadata[$nf];
                }
            }
        }

        // 7. Validate Booleans
        $booleanFields = ['leadership_role'];
        foreach ($booleanFields as $bf) {
            if (isset($metadata[$bf])) {
                $sanitized[$bf] = (bool) $metadata[$bf];
            }
        }

        // 8. Validate Dates
        $dateFields = ['tenure_start', 'tenure_end', 'publication_date', 'event_date'];
        foreach ($dateFields as $df) {
            if (isset($metadata[$df]) && $metadata[$df] !== '') {
                $d = \DateTime::createFromFormat('Y-m-d', $metadata[$df]);
                if (! $d || $d->format('Y-m-d') !== $metadata[$df]) {
                    $errors["structured_metadata.{$df}"] = ["Field {$df} must be a valid date in YYYY-MM-DD format."];
                } else {
                    $sanitized[$df] = $metadata[$df];
                }
            }
        }

        // 9. Conditional Rules & Hidden Incompatible Sanitization
        if (isset($sanitized['individual_team']) && $sanitized['individual_team'] === 'individual') {
            unset($sanitized['team_role']); // Purge hidden team_role
        }

        if (isset($sanitized['publication_status']) && $sanitized['publication_status'] === 'draft') {
            unset($sanitized['publication_date']); // Purge hidden publication_date
        }

        // 10. Requiredness on Submit
        if ($submitNow && empty($errors)) {
            // Require Academic Year & Semester
            if (empty($sanitized['academic_year'])) {
                $errors['structured_metadata.academic_year'] = ['Academic Year is required.'];
            }
            if (empty($sanitized['semester'])) {
                $errors['structured_metadata.semester'] = ['Semester is required.'];
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'sanitized_metadata' => $sanitized,
        ];
    }

    /** Validate the active OSAD student contract schema on the existing portfolio API. */
    private function validateConfiguredSchemaMetadata(string $categoryId, ?string $subcategoryId, array $metadata, bool $submitNow): array
    {
        $errors = [];
        $sanitized = ['schema_version' => StudentAchievementFormSchemaRegistry::VERSION];
        foreach (self::FORBIDDEN_METADATA_KEYS as $key) {
            if (array_key_exists($key, $metadata)) {
                $errors["structured_metadata.{$key}"] = ["Field '{$key}' is forbidden in student structured metadata."];
            }
        }

        if ($subcategoryId === null || $subcategoryId === '') {
            foreach (array_diff(array_keys($metadata), ['schema_version']) as $key) {
                $errors["structured_metadata.{$key}"] = ['Select a configured subcategory before entering its fields.'];
            }
            return ['valid' => $errors === [], 'errors' => $errors, 'sanitized_metadata' => $sanitized];
        }

        $contract = $this->db->table('achievement_contracts')
            ->where('domain', 'STUDENT')->where('is_active', 1)
            ->where('legacy_category_id', $categoryId)
            ->where('legacy_subcategory_id', $subcategoryId)
            ->get()->getRowArray();
        if ($contract === null) {
            return ['valid' => false, 'errors' => ['structured_metadata' => ['No active OSAD intake schema is configured for this subcategory.']], 'sanitized_metadata' => $sanitized];
        }

        try {
            $schema = (new StudentAchievementFormSchemaRegistry())->get((string) $contract['contract_code']);
        } catch (\RuntimeException) {
            return ['valid' => false, 'errors' => ['structured_metadata' => ['The configured OSAD intake schema is unavailable.']], 'sanitized_metadata' => $sanitized];
        }

        $fields = $schema['fields'] ?? [];
        $allowed = ['schema_version'];
        foreach ($fields as $field) {
            $allowed = array_merge($allowed, $field['payload_keys'] ?? [$field['key']]);
        }
        $allowed = array_unique($allowed);
        foreach ($metadata as $key => $value) {
            if (!in_array($key, $allowed, true) && !in_array($key, self::FORBIDDEN_METADATA_KEYS, true)) {
                $errors["structured_metadata.{$key}"] = ["Unknown or unsupported configured field: '{$key}'."];
            }
        }

        foreach ($fields as $field) {
            $key = (string) ($field['key'] ?? '');
            $control = (string) ($field['control'] ?? 'text');
            $rules = $field['validation'] ?? [];
            $payloadKeys = $field['payload_keys'] ?? [$key];
            $conditionalRequired = false;
            if (isset($rules['required_when'])) {
                foreach ($rules['required_when'] as $whenKey => $whenValue) {
                    $conditionalRequired = $conditionalRequired || (($metadata[$whenKey] ?? null) === $whenValue);
                }
            }
            $forbidden = false;
            if (isset($rules['forbidden_when'])) {
                foreach ($rules['forbidden_when'] as $whenKey => $whenValues) {
                    $forbidden = $forbidden || in_array($metadata[$whenKey] ?? null, (array) $whenValues, true);
                }
            }
            if ($forbidden && array_key_exists($key, $metadata) && $metadata[$key] !== '' && $metadata[$key] !== null) {
                $errors["structured_metadata.{$key}"] = ["{$field['label']} is not applicable for the selected option."];
                continue;
            }

            if ($control === 'fixed') {
                $fixed = $rules['value'] ?? '';
                if (array_key_exists($key, $metadata) && (string) $metadata[$key] !== (string) $fixed) {
                    $errors["structured_metadata.{$key}"] = ["{$field['label']} is fixed by the configured schema."];
                }
                $sanitized[$key] = $fixed;
                continue;
            }

            if (in_array($control, ['date_range', 'structured_date_or_range'], true)) {
                $this->validateConfiguredDateGroup($field, $metadata, $submitNow, $errors, $sanitized);
                continue;
            }
            if ($control === 'ongoing_academic_year_or_activity_dates') {
                $this->validateConfiguredRecordMode($field, $metadata, $submitNow, $errors, $sanitized);
                continue;
            }

            $value = $metadata[$key] ?? null;
            $required = !empty($field['required']) || $conditionalRequired;
            if ($submitNow && $required && ($value === null || $value === '')) {
                $errors["structured_metadata.{$key}"] = ["{$field['label']} is required."];
                continue;
            }
            if ($value === null || $value === '') {
                continue;
            }
            if (in_array($control, ['text', 'textarea'], true)) {
                if (!is_scalar($value)) {
                    $errors["structured_metadata.{$key}"] = ["{$field['label']} must be text."];
                    continue;
                }
                $value = trim((string) $value);
                if ($submitNow && $required && $value === '') {
                    $errors["structured_metadata.{$key}"] = ["{$field['label']} is required."];
                    continue;
                }
            } elseif ($control === 'select') {
                $options = array_column($field['options'] ?? [], 'value');
                if (!in_array((string) $value, $options, true)) {
                    $errors["structured_metadata.{$key}"] = ["Choose a valid {$field['label']} option."];
                    continue;
                }
            } elseif ($control === 'date') {
                if (!$this->isIsoDate((string) $value)) {
                    $errors["structured_metadata.{$key}"] = ["{$field['label']} must be a valid date."];
                    continue;
                }
            } elseif ($control === 'decimal') {
                if (!is_numeric($value)) {
                    $errors["structured_metadata.{$key}"] = ["{$field['label']} must be a number."];
                    continue;
                }
                $number = (float) $value;
                if (isset($rules['minimum_exclusive']) && $number <= (float) $rules['minimum_exclusive']) {
                    $errors["structured_metadata.{$key}"] = ["{$field['label']} must be greater than {$rules['minimum_exclusive']}."];
                    continue;
                }
                if (isset($rules['maximum']) && $number > (float) $rules['maximum']) {
                    $errors["structured_metadata.{$key}"] = ["{$field['label']} cannot exceed {$rules['maximum']}."];
                    continue;
                }
                $value = $number;
            } elseif ($control === 'academic_year') {
                if (!preg_match('/^(19|20)\d{2}-(19|20)\d{2}$/', (string) $value)) {
                    $errors["structured_metadata.{$key}"] = ["{$field['label']} must use YYYY-YYYY format."];
                    continue;
                }
                [$start, $end] = array_map('intval', explode('-', (string) $value));
                if (isset($rules['end_year_rule']) && $rules['end_year_rule'] === 'start_year_plus_one' && $end !== $start + 1) {
                    $errors["structured_metadata.{$key}"] = ["{$field['label']} must span consecutive academic years."];
                    continue;
                }
                if (($rules['maximum_start_year'] ?? null) === 'current_calendar_year' && $start > (int) date('Y')) {
                    $errors["structured_metadata.{$key}"] = ["{$field['label']} cannot start in a future academic year."];
                    continue;
                }
            }
            $sanitized[$key] = $value;
        }

        return ['valid' => $errors === [], 'errors' => $errors, 'sanitized_metadata' => $sanitized];
    }

    private function validateConfiguredDateGroup(array $field, array $metadata, bool $submitNow, array &$errors, array &$sanitized): void
    {
        $rules = $field['validation'] ?? [];
        if (($field['control'] ?? '') === 'date_range') {
            $startKey = $rules['start_key'] ?? '';
            $endKey = $rules['end_key'] ?? '';
            $start = $metadata[$startKey] ?? '';
            $end = $metadata[$endKey] ?? '';
            if ($submitNow && !empty($field['required']) && $start === '') $errors["structured_metadata.{$startKey}"] = ["{$field['label']} start date is required."];
            foreach ([$startKey => $start, $endKey => $end] as $key => $value) {
                if ($value !== '' && !$this->isIsoDate((string) $value)) $errors["structured_metadata.{$key}"] = ["{$field['label']} must contain valid dates."];
                elseif ($value !== '') $sanitized[$key] = $value;
            }
            if (!empty($rules['end_not_before_start']) && $start !== '' && $end !== '' && $end < $start) $errors["structured_metadata.{$endKey}"] = ['End date cannot be before start date.'];
            return;
        }

        $precisionKey = $rules['precision_key'] ?? 'period_precision';
        $precision = $metadata[$precisionKey] ?? '';
        $startYear = $metadata['period_start_year'] ?? '';
        $startMonth = $metadata['period_start_month'] ?? '';
        $startDay = $metadata['period_start_day'] ?? '';
        $endYear = $metadata['period_end_year'] ?? '';
        $endMonth = $metadata['period_end_month'] ?? '';
        $endDay = $metadata['period_end_day'] ?? '';
        if ($submitNow && !empty($field['required']) && !in_array($precision, ['DATE', 'RANGE'], true)) $errors["structured_metadata.{$precisionKey}"] = ["Select a date or date range for {$field['label']}."];
        if (in_array($precision, ['DATE', 'RANGE'], true) && (!ctype_digit((string) $startYear) || (int) $startYear < 1900 || (int) $startYear > 2200)) $errors['structured_metadata.period_start_year'] = ["{$field['label']} needs a valid start year."];
        if ($precision === 'DATE' && (!ctype_digit((string) $startMonth) || (int) $startMonth < 1 || (int) $startMonth > 12 || !ctype_digit((string) $startDay) || !checkdate((int) $startMonth, (int) $startDay, (int) $startYear))) $errors['structured_metadata.period_start_day'] = ["{$field['label']} needs a valid start date."];
        if ($precision === 'RANGE' && $submitNow && !ctype_digit((string) $endYear)) $errors['structured_metadata.period_end_year'] = ["{$field['label']} needs a valid end year."];
        if ($precision === 'RANGE' && $endYear !== '' && (!ctype_digit((string) $endYear) || (int) $endYear < (int) $startYear || ((int) $endYear === (int) $startYear && ($endMonth !== '' && (int) $endMonth < (int) $startMonth)))) $errors['structured_metadata.period_end_year'] = ["{$field['label']} end cannot be before its start."];
        foreach ($field['payload_keys'] ?? [] as $payloadKey) if (array_key_exists($payloadKey, $metadata)) $sanitized[$payloadKey] = $metadata[$payloadKey];
    }

    private function validateConfiguredRecordMode(array $field, array $metadata, bool $submitNow, array &$errors, array &$sanitized): void
    {
        $mode = $metadata['record_mode'] ?? '';
        $modes = $field['validation']['modes'] ?? [];
        if ($submitNow && !array_key_exists($mode, $modes)) $errors['structured_metadata.record_mode'] = ['Choose a record period type.'];
        if (array_key_exists($mode, $modes)) {
            foreach ($modes[$mode] as $key) {
                if ($submitNow && empty($metadata[$key])) $errors["structured_metadata.{$key}"] = ["{$key} is required for the selected record period."];
            }
            if ($mode === 'ACADEMIC_YEAR' && !empty($metadata['academic_year_start']) && !preg_match('/^(19|20)\d{2}-(19|20)\d{2}$/', (string) $metadata['academic_year_start'])) {
                $errors['structured_metadata.academic_year_start'] = ['Academic year must use YYYY-YYYY format.'];
            }
            if ($mode === 'ACTIVITY') {
                $start = (string) ($metadata['activity_start_date'] ?? '');
                $end = (string) ($metadata['activity_end_date'] ?? '');
                if ($start !== '' && !$this->isIsoDate($start)) $errors['structured_metadata.activity_start_date'] = ['Activity start date must be valid.'];
                if ($end !== '' && !$this->isIsoDate($end)) $errors['structured_metadata.activity_end_date'] = ['Activity end date must be valid.'];
                if ($start !== '' && $end !== '' && $end < $start) $errors['structured_metadata.activity_end_date'] = ['Activity end date cannot be before the start date.'];
            }
        }
        foreach ($field['payload_keys'] ?? [] as $key) if (array_key_exists($key, $metadata)) $sanitized[$key] = $metadata[$key];
    }

    private function isIsoDate(string $value): bool
    {
        $date = \DateTime::createFromFormat('!Y-m-d', $value);
        return $date !== false && $date->format('Y-m-d') === $value;
    }
}
