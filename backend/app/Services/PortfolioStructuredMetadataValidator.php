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
}
