<?php

namespace Tests\Unit;

use App\Services\RubricAdministrationService;
use PHPUnit\Framework\TestCase;
use RuntimeException;

class RubricAdministrationIntakeDefinitionTest extends TestCase
{
    private function definition(array $overrides = []): array
    {
        return array_merge([
            'id' => 'sub-a1-phd-units',
            'name' => 'Configured criterion',
            'intake_active' => 1,
            'intake_mode' => 'FORM',
            'field_schema' => [
                ['key' => 'semester', 'label' => 'Semester', 'type' => 'select', 'required' => true, 'options' => ['First Semester', 'Second Semester']],
                ['key' => 'units_earned', 'label' => 'Units Earned', 'type' => 'number', 'required' => true, 'validation' => ['min' => 1, 'max' => 60]],
            ],
            'evidence_rules' => ['required' => true, 'accepted' => ['Transcript']],
            'scoring_rule_reference' => 'HR-published scoring rule reference',
        ], $overrides);
    }

    public function test_accepts_structured_hr_defined_fields_evidence_and_scoring_reference(): void
    {
        RubricAdministrationService::assertValidIntakeDefinition($this->definition());
        $this->assertTrue(true);
    }

    public function test_rejects_active_structured_criterion_without_a_field_schema(): void
    {
        $this->expectException(RuntimeException::class);
        RubricAdministrationService::assertValidIntakeDefinition($this->definition(['field_schema' => []]));
    }

    public function test_rejects_select_field_without_hr_approved_choices(): void
    {
        $this->expectException(RuntimeException::class);
        RubricAdministrationService::assertValidIntakeDefinition($this->definition([
            'field_schema' => [['key' => 'semester', 'label' => 'Semester', 'type' => 'select', 'required' => true, 'options' => []]],
        ]));
    }

    public function test_rejects_duplicate_field_keys(): void
    {
        $this->expectException(RuntimeException::class);
        RubricAdministrationService::assertValidIntakeDefinition($this->definition([
            'field_schema' => [
                ['key' => 'title', 'label' => 'Title', 'type' => 'text', 'required' => true],
                ['key' => 'title', 'label' => 'Other title', 'type' => 'text', 'required' => false],
            ],
        ]));
    }

    public function test_allows_explicit_manual_hr_defined_criterion_without_form_fields(): void
    {
        RubricAdministrationService::assertValidIntakeDefinition($this->definition([
            'intake_mode' => 'MANUAL_HR',
            'field_schema' => [],
            'scoring_rule_reference' => 'Manual / HR-defined after evidence review',
        ]));
        $this->assertTrue(true);
    }

    public function test_inactive_leaf_is_not_required_to_have_future_intake_definitions(): void
    {
        RubricAdministrationService::assertValidIntakeDefinition($this->definition([
            'intake_active' => 0,
            'field_schema' => null,
            'evidence_rules' => null,
            'scoring_rule_reference' => null,
        ]));
        $this->assertTrue(true);
    }
}
