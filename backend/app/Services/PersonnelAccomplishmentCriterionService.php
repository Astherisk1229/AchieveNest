<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use Config\Database;
use RuntimeException;

/** Resolves a new Personnel accomplishment against the current, published HR criterion version. */
class PersonnelAccomplishmentCriterionService
{
    public function __construct(private ?BaseConnection $db = null)
    {
        $this->db ??= Database::connect();
    }

    /**
     * Resolve an HR criterion identity, then capture its governing version and rule snapshot.
     * Personnel submissions cannot choose a retired/draft version or provide the snapshot themselves.
     */
    public function resolveForCreation(string $personnelProfileId, string $criterionId): array
    {
        $criterionId = trim($criterionId);
        if ($criterionId === '' || strlen($criterionId) > 64) {
            throw new RuntimeException('Select a valid active HR criterion.', 422);
        }

        foreach (['criterion_id', 'evaluation_scale_version_id', 'criterion_snapshot'] as $field) {
            if (! $this->db->fieldExists($field, 'personnel_accomplishments')) {
                throw new RuntimeException('Criterion version storage is not ready. Apply the pending accomplishment criteria migration first.', 503);
            }
        }
        foreach (['evaluation_scale_subcategories', 'evaluation_scale_categories'] as $table) {
            foreach (['intake_active', 'intake_mode', 'field_schema', 'evidence_rules', 'scoring_rule_reference'] as $field) {
                if (! $this->db->fieldExists($field, $table)) {
                    throw new RuntimeException('HR intake definitions are not ready. Apply the pending HR criteria migration first.', 503);
                }
            }
        }

        $profile = $this->db->table('personnel_profiles')->select('personnel_group')
            ->where('profile_id', $personnelProfileId)->get()->getRowArray();
        $group = strtoupper(trim((string) ($profile['personnel_group'] ?? '')));
        if (! $profile || ! in_array($group, ['FACULTY', 'NON_TEACHING_FACULTY'], true)) throw new RuntimeException('A supported personnel group is required to select HR criteria.', 422);

        $versions = $this->db->table('evaluation_scale_versions v')
            ->select('v.id')->join('evaluation_scales s', 's.id=v.scale_id')
            ->where('s.personnel_group', $group)->where('v.status', 'approved')
            ->get()->getResultArray();
        if (count($versions) !== 1) {
            throw new RuntimeException(count($versions) === 0
                ? 'No published criteria are available for your personnel group.'
                : 'Multiple published criteria versions are configured for your group. HR must resolve this before intake.', 409);
        }

        $hierarchy = (new RubricAdministrationService())->getScaleVersionHierarchy((string) $versions[0]['id']);
        return self::snapshotFromPublishedHierarchy($hierarchy, $criterionId, $group);
    }

    /** Validate values against the published criterion schema captured by the server. */
    public static function validateSubmissionFields(array $association, array $metadata): ?string
    {
        $criterion = $association['criterion_snapshot']['criterion'] ?? [];
        if (strtoupper((string) ($criterion['intake_mode'] ?? '')) === 'MANUAL_HR') return null;
        $values = is_array($metadata['details'] ?? null) ? $metadata['details'] : [];
        $fields = $criterion['field_schema'] ?? [];
        if (strtoupper((string) ($association['criterion_snapshot']['personnel_group'] ?? '')) === 'FACULTY' && $fields === []) {
            foreach (FacultyPersonnelIntakeDefaults::requiredFields((string) ($criterion['code'] ?? '')) as $key) {
                if (! is_scalar($values[$key] ?? null) || trim((string) $values[$key]) === '') {
                    return ucwords(str_replace('_', ' ', $key)) . ' is required for this criterion.';
                }
            }
        }
        if (strtoupper((string) ($association['criterion_snapshot']['personnel_group'] ?? '')) === 'NON_TEACHING_FACULTY') {
            // Appendix N owns the Non-Teaching submission form. These required detail keys mirror
            // nonTeachingPortfolioSchema.js; HR no longer has to configure a duplicate field schema.
            $code = strtoupper(trim((string) ($criterion['code'] ?? '')));
            $code = str_replace('NTF-', '', $code);
            if (preg_match('/^B([12])([A-D])$/', $code, $parts)) $code = 'B.' . $parts[1] . '.' . $parts[2];
            if (preg_match('/^B([45])$/', $code, $parts)) $code = 'B.' . $parts[1];
            $code = str_replace('_', '.', $code);
            $numberedCodes = ['B.1.1' => 'B.1.A', 'B.1.2' => 'B.1.B', 'B.1.3' => 'B.1.C', 'B.1.4' => 'B.1.D', 'B.2.1' => 'B.2.A', 'B.2.2' => 'B.2.B', 'B.2.3' => 'B.2.C', 'B.4.1' => 'B.4'];
            $code = $numberedCodes[$code] ?? $code;
            $requiredByCode = [
                'B.1.A' => ['organization', 'assignment_role', 'organizer'],
                'B.1.B' => ['activity', 'organizer'],
                'B.1.C' => ['committee', 'organizer'],
                'B.1.D' => ['activity', 'organizer'],
                'B.2.A' => ['activity', 'role'],
                'B.2.B' => ['activity', 'role'],
                'B.2.C' => ['project'],
                'B.4' => ['engagement', 'role', 'organizer'],
                'B.5' => ['award', 'issuing_body'],
            ];
            if (! array_key_exists($code, $requiredByCode)) return 'This Non-Teaching criterion has no standard personnel-entry form.';
            foreach ($requiredByCode[$code] ?? [] as $key) {
                if (! is_scalar($values[$key] ?? null) || trim((string) $values[$key]) === '') {
                    return ucwords(str_replace('_', ' ', $key)) . ' is required for this criterion.';
                }
            }
            $allowed = match ($code) {
                'B.1.A' => ['assignment_role' => ['MODERATOR', 'OFFICER']],
                'B.4' => ['role' => ['JUDGE', 'LECTURER', 'RESOURCE_PERSON']],
                default => [],
            };
            foreach ($allowed as $key => $options) {
                if (! in_array((string) ($values[$key] ?? ''), $options, true)) return 'Choose an allowed value for ' . str_replace('_', ' ', $key) . '.';
            }
            return null;
        }
        $isFacultyB1 = strtoupper((string) ($association['criterion_snapshot']['personnel_group'] ?? '')) === 'FACULTY'
            && strtoupper(trim((string) ($association['criterion_snapshot']['category']['code'] ?? ''))) === 'B.1';
        foreach ($fields as $field) {
            if (! is_array($field)) continue;
            $key = (string) ($field['key'] ?? '');
            // The official B.1 rubric scores reach (Local/Regional/etc.), not a
            // numeric headcount. Ignore the retired field in older snapshots.
            $normalizedKey = preg_replace('/[^a-z0-9]/', '', strtolower($key));
            $normalizedLabel = preg_replace('/[^a-z0-9]/', '', strtolower((string) ($field['label'] ?? '')));
            $retiredHeadcountKeys = ['participants', 'participantcount', 'participantscount', 'numberofparticipants', 'numberofparticipant', 'participantheadcount'];
            if ($isFacultyB1 && (in_array($normalizedKey, $retiredHeadcountKeys, true) || in_array($normalizedLabel, $retiredHeadcountKeys, true))) continue;
            $label = (string) ($field['label'] ?? 'This field');
            $value = $values[$key] ?? null;
            $empty = $value === null || (is_string($value) && trim($value) === '');
            if ($empty) {
                if (($field['required'] ?? false) === true) return $label . ' is required for this criterion.';
                continue;
            }
            if (! is_scalar($value)) return $label . ' has an invalid value.';
            $text = trim((string) $value);
            $type = strtolower((string) ($field['type'] ?? 'text'));
            $validation = is_array($field['validation'] ?? null) ? $field['validation'] : [];
            if (in_array($type, ['text', 'textarea'], true) && ((isset($validation['minLength']) && mb_strlen($text) < (int) $validation['minLength']) || (isset($validation['maxLength']) && mb_strlen($text) > (int) $validation['maxLength']))) return $label . ' must meet the allowed length.';
            if ($type === 'number' && (! is_numeric($text) || (! empty($validation['integer']) && filter_var($text, FILTER_VALIDATE_INT) === false) || (isset($validation['min']) && (float) $text < (float) $validation['min']) || (isset($validation['max']) && (float) $text > (float) $validation['max']))) return ! empty($validation['integer']) ? $label . ' must be a whole number within the allowed range.' : $label . ' must be within the allowed numeric range.';
            if ($type === 'date') {
                $date = preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $text, $parts);
                if (! $date || ! checkdate((int) $parts[2], (int) $parts[3], (int) $parts[1])) return $label . ' must be a valid date.';
            }
            if ($type === 'select' && ! in_array($text, $field['options'] ?? [], true)) return 'Choose an allowed value for ' . $label . '.';
        }
        return null;
    }

    /** Pure resolver used to keep snapshot construction deterministic and independently testable. */
    public static function snapshotFromPublishedHierarchy(array $hierarchy, string $criterionId, ?string $expectedGroup = null): array
    {
        if (strtoupper((string) ($hierarchy['sheet']['applies_to'] ?? '')) === 'FACULTY') {
            $hierarchy = FacultyPersonnelIntakeDefaults::apply($hierarchy);
        }
        $version = $hierarchy['version'] ?? [];
        if (strtolower((string) ($version['status'] ?? '')) !== 'approved') {
            throw new RuntimeException('The selected HR criterion is not in a published version.', 422);
        }
        $group = strtoupper(trim((string) ($hierarchy['sheet']['applies_to'] ?? '')));
        if ($expectedGroup !== null && $group !== strtoupper(trim($expectedGroup))) throw new RuntimeException('The selected criterion belongs to a different personnel group.', 422);

        $matches = [];
        foreach (($hierarchy['areas'] ?? []) as $area) {
            foreach (($area['categories'] ?? []) as $category) {
                if ((int) ($area['is_active'] ?? 1) !== 1 || (int) ($category['is_active'] ?? 1) !== 1) continue;
                foreach (($category['subcategories'] ?? []) as $criterion) {
                    if ((string) ($criterion['id'] ?? '') === $criterionId && (int) ($criterion['is_active'] ?? 1) === 1) {
                        $matches[] = [$area, $category, $criterion];
                    }
                }
                if ((string) ($category['id'] ?? '') === $criterionId && (int) ($category['intake_active'] ?? 0) === 1) {
                    $matches[] = [$area, $category, array_merge($category, [
                        'id' => $category['id'],
                        'subcategory_code' => $category['category_code'] ?? '',
                        'intake_level' => 'CATEGORY',
                        'default_points' => $category['max_points'] ?? 0,
                    ])];
                }
            }
        }
        if (count($matches) !== 1) {
            throw new RuntimeException('The selected criterion is not part of the current published criteria version for your group.', 422);
        }

        [$area, $category, $criterion] = $matches[0];
        if ((int) ($criterion['intake_active'] ?? 0) !== 1) {
            throw new RuntimeException('The selected HR criterion is inactive for new accomplishments.', 422);
        }
        $areaCode = strtoupper(trim((string) ($area['area_code'] ?? '')));
        if (! in_array($areaCode, ['A', 'B', 'C'], true)) {
            throw new RuntimeException('The selected HR criterion has no supported area classification.', 422);
        }

        $snapshot = [
            'evaluation_scale_version_id' => (string) $version['id'],
            'version_number' => (string) ($version['version_number'] ?? ''),
            'personnel_group' => $group,
            'area' => [
                'code' => $areaCode,
                'name' => (string) ($area['name'] ?? ''),
                'maximum_points' => (float) ($area['max_points'] ?? 0),
            ],
            'category' => [
                'code' => (string) ($category['category_code'] ?? ''),
                'name' => (string) ($category['name'] ?? ''),
                'maximum_points' => (float) ($category['max_points'] ?? 0),
            ],
            'criterion' => [
                'id' => (string) $criterion['id'],
                'code' => (string) ($criterion['subcategory_code'] ?? ''),
                'intake_level' => $criterion['intake_level'] ?? 'SUBCATEGORY',
                'name' => (string) ($criterion['name'] ?? ''),
                'description' => $criterion['description'] ?? null,
                'intake_mode' => strtoupper((string) ($criterion['intake_mode'] ?? 'FORM')),
                'field_schema' => $criterion['field_schema'] ?? [],
                'evidence_rules' => $criterion['evidence_rules'] ?? null,
                'scoring_rule_reference' => (string) ($criterion['scoring_rule_reference'] ?? ''),
                'maximum_points' => (float) ($criterion['default_points'] ?? 0),
                'entry_policy' => (string) ($area['entry_policy'] ?? 'personnel_entry_allowed'),
            ],
            // Keep the selected category's approved scoring tree with this accomplishment.
            // The same locked resolver is used later by the evaluator workflow.
            'scoring_configuration' => [
                'sheet' => $hierarchy['sheet'] ?? [],
                'areas' => [array_merge($area, ['categories' => [$category]])],
            ],
        ];

        return [
            'criterion_id' => (string) $criterion['id'],
            'evaluation_scale_version_id' => (string) $version['id'],
            'criterion_snapshot' => $snapshot,
            'category_code' => $snapshot['category']['code'],
            'category_area' => 'area' . $areaCode,
            'domain' => match ($areaCode) {
                'B' => 'productivity_creative_work',
                'C' => 'service_leadership',
                default => 'professional_development',
            },
        ];
    }
}
