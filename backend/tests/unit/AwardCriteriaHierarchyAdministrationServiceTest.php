<?php

namespace Tests\Unit;

use App\Services\AwardCriteriaHierarchyAdministrationService;
use App\Services\Policies\AwardPolicy;
use PHPUnit\Framework\TestCase;

final class AwardCriteriaHierarchyAdministrationServiceTest extends TestCase
{
    public function test_rejects_category_without_subcategory_and_requires_nonnegative_cutoff(): void
    {
        $this->assertSame([
            'Category 1: Cut-off Points must be a non-negative number.',
            'Category 1: add at least one Subcategory.',
        ], AwardCriteriaHierarchyAdministrationService::validateHierarchy([
            'categories' => [['name' => 'Academic', 'cut_off_points' => -1, 'subcategories' => []]],
        ]));
    }

    public function test_accepts_category_with_subcategory_and_no_levels_without_sum_invariant(): void
    {
        $hierarchy = ['categories' => [[
            'id' => 'cat-a', 'name' => 'Professional Development', 'cut_off_points' => 40,
            'subcategories' => [['id' => 'sub-a', 'name' => 'Seminars', 'points' => 10, 'levels' => []]],
        ]]];
        $this->assertSame([], AwardCriteriaHierarchyAdministrationService::validateHierarchy($hierarchy));
    }

    public function test_accepts_multiple_optional_levels_with_independent_points(): void
    {
        $hierarchy = ['categories' => [[
            'name' => 'Professional Development', 'cut_off_points' => 40,
            'subcategories' => [['name' => 'Seminars', 'points' => 10, 'levels' => [
                ['name' => 'Regional', 'points' => 6], ['name' => 'National', 'points' => 8], ['name' => 'International', 'points' => 10],
            ]]],
        ]]];
        $this->assertSame([], AwardCriteriaHierarchyAdministrationService::validateHierarchy($hierarchy));
        $this->assertSame(10, $hierarchy['categories'][0]['subcategories'][0]['points']);
        $this->assertSame([6, 8, 10], array_column($hierarchy['categories'][0]['subcategories'][0]['levels'], 'points'));
    }

    public function test_rejects_missing_names_and_negative_level_points(): void
    {
        $errors = AwardCriteriaHierarchyAdministrationService::validateHierarchy(['categories' => [[
            'name' => 'A', 'cut_off_points' => 1,
            'subcategories' => [['name' => '', 'points' => 1, 'levels' => [['name' => 'Regional', 'points' => -1]]]],
        ]]]);
        $this->assertCount(2, $errors);
        $this->assertStringContainsString('Subcategory 1: name is required', $errors[0]);
        $this->assertStringContainsString('Level 1: Points must be a non-negative number', $errors[1]);
    }

    public function test_inactive_definitions_are_filtered_for_new_choices_without_mutating_version(): void
    {
        $published = ['categories' => [
            ['id' => 'active', 'active' => true, 'subcategories' => [['id' => 'sub', 'active' => true, 'levels' => [['id' => 'level', 'active' => true], ['id' => 'off', 'active' => false]]]]],
            ['id' => 'inactive', 'active' => false, 'subcategories' => []],
        ]];
        $filtered = AwardCriteriaHierarchyAdministrationService::activeForNewChoices($published);
        $this->assertSame(['active'], array_column($filtered['categories'], 'id'));
        $this->assertSame(['level'], array_column($filtered['categories'][0]['subcategories'][0]['levels'], 'id'));
        $this->assertCount(2, $published['categories'], 'Filtering is a projection and must retain historical version data.');
    }

    public function test_osad_editor_authorization_reuses_award_policy_and_blocks_other_roles(): void
    {
        $policy = new AwardPolicy();
        $this->assertTrue($policy->canRunAwardEvaluation(['profile' => ['account_type' => 'osad_admin', 'status' => 'active'], 'roles' => ['osad_staff']]));
        $this->assertFalse($policy->canRunAwardEvaluation(['profile' => ['account_type' => 'hr_admin', 'status' => 'active'], 'roles' => ['hr_staff']]));
        $this->assertFalse($policy->canRunAwardEvaluation(['profile' => ['account_type' => 'osad_admin', 'status' => 'inactive'], 'roles' => ['osad_staff']]));
    }
}
