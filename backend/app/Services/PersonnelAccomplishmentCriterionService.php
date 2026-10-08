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
     * Faculty submissions cannot choose a retired/draft version or provide the snapshot themselves.
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
        if (! $profile || strtoupper((string) ($profile['personnel_group'] ?? '')) !== 'FACULTY') {
            throw new RuntimeException('HR-defined Faculty criteria are unavailable for this Personnel account.', 422);
        }

        $versions = $this->db->table('evaluation_scale_versions v')
            ->select('v.id')->join('evaluation_scales s', 's.id=v.scale_id')
            ->where('s.personnel_group', 'FACULTY')->where('v.status', 'approved')
            ->get()->getResultArray();
        if (count($versions) !== 1) {
            throw new RuntimeException(count($versions) === 0
                ? 'No published Faculty criteria are available.'
                : 'Multiple published Faculty criteria versions are configured. HR must resolve this before intake.', 409);
        }

        $hierarchy = (new RubricAdministrationService())->getScaleVersionHierarchy((string) $versions[0]['id']);
        return self::snapshotFromPublishedHierarchy($hierarchy, $criterionId);
    }

    /** Pure resolver used to keep snapshot construction deterministic and independently testable. */
    public static function snapshotFromPublishedHierarchy(array $hierarchy, string $criterionId): array
    {
        $version = $hierarchy['version'] ?? [];
        if (strtolower((string) ($version['status'] ?? '')) !== 'approved') {
            throw new RuntimeException('The selected HR criterion is not in a published version.', 422);
        }

        $matches = [];
        foreach (($hierarchy['areas'] ?? []) as $area) {
            foreach (($area['categories'] ?? []) as $category) {
                foreach (($category['subcategories'] ?? []) as $criterion) {
                    if ((string) ($criterion['id'] ?? '') === $criterionId) {
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
            throw new RuntimeException('The selected criterion is not part of the current published Faculty version.', 422);
        }

        [$area, $category, $criterion] = $matches[0];
        if ((int) ($criterion['intake_active'] ?? 0) !== 1) {
            throw new RuntimeException('The selected HR criterion is inactive for new accomplishments.', 422);
        }
        RubricAdministrationService::assertValidIntakeDefinition($criterion);

        $areaCode = strtoupper(trim((string) ($area['area_code'] ?? '')));
        if (! in_array($areaCode, ['A', 'B', 'C'], true)) {
            throw new RuntimeException('The selected HR criterion has no supported Faculty area classification.', 422);
        }

        $snapshot = [
            'evaluation_scale_version_id' => (string) $version['id'],
            'version_number' => (string) ($version['version_number'] ?? ''),
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
                'intake_mode' => strtoupper((string) $criterion['intake_mode']),
                'field_schema' => $criterion['field_schema'] ?? [],
                'evidence_rules' => $criterion['evidence_rules'] ?? null,
                'scoring_rule_reference' => (string) $criterion['scoring_rule_reference'],
                'maximum_points' => (float) ($criterion['default_points'] ?? 0),
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
