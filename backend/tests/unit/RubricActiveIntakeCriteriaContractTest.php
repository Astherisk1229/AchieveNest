<?php

namespace Tests\Unit;

use App\Services\RubricAdministrationService;
use PHPUnit\Framework\TestCase;
use RuntimeException;

class RubricActiveIntakeCriteriaContractTest extends TestCase
{
    private function hierarchy(array $inactive = []): array
    {
        $leaf = static fn (string $id, string $name, int $active = 1): array => [
            'id' => $id, 'subcategory_code' => $id, 'name' => $name, 'description' => null,
            'default_points' => 10, 'intake_active' => $active, 'intake_mode' => 'FORM',
            'field_schema' => [['key' => 'title', 'label' => 'Title', 'type' => 'text', 'required' => true]],
            'evidence_rules' => ['required' => true, 'accepted' => ['Supporting document']],
            'scoring_rule_reference' => 'HR approved scoring basis',
        ];

        return [
            'sheet' => ['id' => 'scale-faculty', 'code' => 'FACULTY-SCALE', 'name' => 'Faculty Ranking Scale', 'applies_to' => 'FACULTY', 'overall_max_points' => 160, 'passing_score' => 120],
            'version' => ['id' => 'scale-version-7', 'version_number' => '2.0.0', 'status' => 'approved', 'effective_start_date' => '2026-01-01'],
            'areas' => [[
                'id' => 'area-a', 'area_code' => 'A', 'name' => 'Professional Development', 'max_points' => 70,
                'categories' => [[
                    'id' => 'category-a1', 'category_code' => 'A.1', 'name' => 'Degrees', 'max_points' => 40,
                    'subcategories' => [$leaf('leaf-active', 'Ph.D. Units'), $leaf('leaf-inactive', 'Archived Degree', 0)],
                    'criteria' => [['id' => 'rule-1', 'criterion_code' => 'A.1.R1', 'name' => 'Unit scale', 'max_points_per_entry' => 10]],
                    'options' => [['id' => 'option-1', 'option_group_code' => 'UNITS', 'option_code' => 'U6', 'label' => '6 units', 'points' => 4]],
                ]],
            ]],
        ];
    }

    public function test_returns_renderable_hierarchy_with_active_versioned_leaf_contracts_only(): void
    {
        $contract = RubricAdministrationService::buildActiveIntakeCriteriaContract($this->hierarchy());

        $this->assertSame('scale-version-7', $contract['version']['scale_version_id']);
        $this->assertSame('FACULTY', $contract['personnel_group']);
        $this->assertCount(1, $contract['areas']);
        $this->assertSame('leaf-active', $contract['areas'][0]['categories'][0]['criteria'][0]['criterion_id']);
        $this->assertSame('scale-version-7', $contract['areas'][0]['categories'][0]['criteria'][0]['scale_version_id']);
        $this->assertSame(['title'], array_column($contract['areas'][0]['categories'][0]['criteria'][0]['field_schema'], 'key'));
        $this->assertSame(['Supporting document'], $contract['areas'][0]['categories'][0]['criteria'][0]['evidence_rules']['accepted']);
        $this->assertSame('HR approved scoring basis', $contract['areas'][0]['categories'][0]['criteria'][0]['scoring']['rule_reference']);
        $this->assertCount(1, $contract['areas'][0]['categories'][0]['scoring_rules']);
        $this->assertCount(1, $contract['areas'][0]['categories'][0]['scoring_options']);
    }

    public function test_rejects_a_contract_with_active_leaves_missing_hr_definitions(): void
    {
        $hierarchy = $this->hierarchy();
        $hierarchy['areas'][0]['categories'][0]['subcategories'][0]['field_schema'] = [];
        $this->expectException(RuntimeException::class);
        RubricAdministrationService::buildActiveIntakeCriteriaContract($hierarchy);
    }

    public function test_includes_manual_category_level_criteria_without_inventing_leaf_rules(): void
    {
        $hierarchy = $this->hierarchy();
        $hierarchy['areas'][0]['categories'][] = [
            'id' => 'category-b3', 'category_code' => 'B.3', 'name' => 'Conduct of Research', 'max_points' => 40,
            'intake_active' => 1, 'intake_mode' => 'MANUAL_HR', 'field_schema' => [],
            'evidence_rules' => ['required' => true, 'accepted' => ['Research documentation']],
            'scoring_rule_reference' => 'Manual / HR-defined scoring; no lower-level point breakdown in the official source.',
            'subcategories' => [], 'criteria' => [], 'options' => [],
        ];

        $contract = RubricAdministrationService::buildActiveIntakeCriteriaContract($hierarchy);
        $criterion = $contract['areas'][0]['categories'][1]['criteria'][0];

        $this->assertSame('category-b3', $criterion['criterion_id']);
        $this->assertSame('CATEGORY', $criterion['intake_level']);
        $this->assertSame('MANUAL_HR', $criterion['intake_mode']);
        $this->assertSame(40.0, $criterion['scoring']['criterion_maximum']);
        $this->assertSame([], $criterion['field_schema']);
    }

    public function test_rejects_active_manual_category_without_evidence_or_rule_reference(): void
    {
        $hierarchy = $this->hierarchy();
        $hierarchy['areas'][0]['categories'][] = [
            'id' => 'category-b6', 'category_code' => 'B.6', 'name' => 'Creative Work', 'max_points' => 20,
            'intake_active' => 1, 'intake_mode' => 'MANUAL_HR', 'field_schema' => [],
            'evidence_rules' => ['required' => true, 'accepted' => []], 'scoring_rule_reference' => '',
            'subcategories' => [], 'criteria' => [], 'options' => [],
        ];
        $this->expectException(RuntimeException::class);
        RubricAdministrationService::buildActiveIntakeCriteriaContract($hierarchy);
    }

    public function test_rejects_a_non_published_version(): void
    {
        $hierarchy = $this->hierarchy();
        $hierarchy['version']['status'] = 'draft';
        $this->expectException(RuntimeException::class);
        RubricAdministrationService::buildActiveIntakeCriteriaContract($hierarchy);
    }

    public function test_emits_cutoff_subcategory_and_optional_level_points_without_summing_them(): void
    {
        $hierarchy = $this->hierarchy();
        $hierarchy['areas'][0]['categories'][0]['subcategories'][0]['levels'] = [
            ['id' => 'level-regional', 'option_group_code' => 'LEVEL', 'label' => 'Regional', 'points' => 6, 'display_order' => 1, 'is_active' => 1],
            ['id' => 'level-national', 'option_group_code' => 'LEVEL', 'label' => 'National', 'points' => 8, 'display_order' => 2, 'is_active' => 1],
        ];
        $contract = RubricAdministrationService::buildActiveIntakeCriteriaContract($hierarchy);
        $category = $contract['areas'][0]['categories'][0];

        $this->assertSame(40.0, $category['cut_off_points']);
        $this->assertSame(10.0, $category['subcategories'][0]['points']);
        $this->assertSame([6.0, 8.0], array_column($category['subcategories'][0]['levels'], 'points'));
        $this->assertSame(10.0, $category['subcategories'][0]['points'], 'Level points must not be aggregated into subcategory points.');
    }

    public function test_inactive_hierarchy_items_are_not_offered_in_the_active_intake_contract(): void
    {
        $hierarchy = $this->hierarchy();
        $hierarchy['areas'][0]['categories'][0]['subcategories'][0]['levels'] = [
            ['id' => 'level-active', 'option_group_code' => 'LEVEL', 'label' => 'Regional', 'points' => 6, 'display_order' => 1, 'is_active' => 1],
            ['id' => 'level-inactive', 'option_group_code' => 'LEVEL', 'label' => 'Old Level', 'points' => 9, 'display_order' => 2, 'is_active' => 0],
        ];
        $hierarchy['areas'][0]['categories'][0]['subcategories'][] = [
            'id' => 'leaf-disabled', 'subcategory_code' => 'DISABLED', 'name' => 'Disabled', 'default_points' => 5,
            'is_active' => 0, 'intake_active' => 1, 'intake_mode' => 'FORM',
            'field_schema' => [['key' => 'title', 'label' => 'Title', 'type' => 'text', 'required' => true]],
            'evidence_rules' => ['required' => true, 'accepted' => ['Supporting document']],
            'scoring_rule_reference' => 'HR approved scoring basis', 'levels' => [],
        ];
        $contract = RubricAdministrationService::buildActiveIntakeCriteriaContract($hierarchy);
        $category = $contract['areas'][0]['categories'][0];

        $this->assertSame(['leaf-active'], array_column($category['criteria'], 'criterion_id'));
        $this->assertSame(['level-active'], array_column($category['subcategories'][0]['levels'], 'level_id'));
    }
}
