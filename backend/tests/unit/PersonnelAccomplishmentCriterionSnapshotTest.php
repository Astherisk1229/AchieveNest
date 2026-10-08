<?php

namespace Tests\Unit;

use App\Services\PersonnelAccomplishmentCriterionService;
use PHPUnit\Framework\TestCase;
use RuntimeException;

class PersonnelAccomplishmentCriterionSnapshotTest extends TestCase
{
    private function hierarchy(array $criterionOverrides = [], string $status = 'approved'): array
    {
        return [
            'version' => ['id' => 'scale-v4', 'version_number' => '4.0', 'status' => $status],
            'areas' => [[
                'area_code' => 'B', 'name' => 'Productivity and Creative Work', 'max_points' => 50,
                'categories' => [[
                    'category_code' => 'B.2', 'name' => 'Publication', 'max_points' => 20,
                    'subcategories' => [array_merge([
                        'id' => 'leaf-publication', 'subcategory_code' => 'B2-PUB', 'name' => 'Journal Article',
                        'description' => 'HR configured publication criterion', 'default_points' => 10,
                        'intake_active' => 1, 'intake_mode' => 'FORM',
                        'field_schema' => [['key' => 'title', 'label' => 'Title', 'type' => 'text', 'required' => true]],
                        'evidence_rules' => ['required' => true, 'accepted' => ['Published article']],
                        'scoring_rule_reference' => 'HR-approved publication rule',
                    ], $criterionOverrides)],
                ]],
            ]],
        ];
    }

    public function test_snapshot_captures_the_exact_hr_version_hierarchy_and_rules(): void
    {
        $resolved = PersonnelAccomplishmentCriterionService::snapshotFromPublishedHierarchy($this->hierarchy(), 'leaf-publication');

        $this->assertSame('leaf-publication', $resolved['criterion_id']);
        $this->assertSame('scale-v4', $resolved['evaluation_scale_version_id']);
        $this->assertSame('B.2', $resolved['category_code']);
        $this->assertSame('areaB', $resolved['category_area']);
        $this->assertSame('productivity_creative_work', $resolved['domain']);
        $this->assertSame('Published article', $resolved['criterion_snapshot']['criterion']['evidence_rules']['accepted'][0]);
        $this->assertSame('HR-approved publication rule', $resolved['criterion_snapshot']['criterion']['scoring_rule_reference']);
    }

    public function test_rejects_a_leaf_that_is_not_in_the_published_hierarchy(): void
    {
        $this->expectException(RuntimeException::class);
        PersonnelAccomplishmentCriterionService::snapshotFromPublishedHierarchy($this->hierarchy(), 'client-invented-id');
    }

    public function test_rejects_a_leaf_after_hr_deactivates_it(): void
    {
        $this->expectException(RuntimeException::class);
        PersonnelAccomplishmentCriterionService::snapshotFromPublishedHierarchy($this->hierarchy(['intake_active' => 0]), 'leaf-publication');
    }

    public function test_rejects_unpublished_versions(): void
    {
        $this->expectException(RuntimeException::class);
        PersonnelAccomplishmentCriterionService::snapshotFromPublishedHierarchy($this->hierarchy([], 'draft'), 'leaf-publication');
    }

    public function test_snapshots_category_level_manual_rule_for_official_categories_without_leaf_breakdowns(): void
    {
        $hierarchy = $this->hierarchy();
        $hierarchy['areas'][0]['categories'][] = [
            'id' => 'category-b3', 'category_code' => 'B.3', 'name' => 'Conduct of Research', 'max_points' => 40,
            'intake_active' => 1, 'intake_mode' => 'MANUAL_HR', 'intake_level' => 'CATEGORY',
            'field_schema' => [], 'evidence_rules' => ['required' => true, 'accepted' => ['Research documentation']],
            'scoring_rule_reference' => 'Manual / HR-defined; no lower-level breakdown in the official source.', 'subcategories' => [],
        ];

        $resolved = PersonnelAccomplishmentCriterionService::snapshotFromPublishedHierarchy($hierarchy, 'category-b3');

        $this->assertSame('category-b3', $resolved['criterion_id']);
        $this->assertSame('B.3', $resolved['category_code']);
        $this->assertSame('CATEGORY', $resolved['criterion_snapshot']['criterion']['intake_level']);
        $this->assertSame(40.0, $resolved['criterion_snapshot']['criterion']['maximum_points']);
        $this->assertSame('Manual / HR-defined; no lower-level breakdown in the official source.', $resolved['criterion_snapshot']['criterion']['scoring_rule_reference']);
    }
}
