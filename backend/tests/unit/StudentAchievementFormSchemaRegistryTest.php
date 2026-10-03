<?php

namespace Tests\Unit;

use App\Services\StudentAchievementFormSchemaRegistry;
use CodeIgniter\Test\CIUnitTestCase;

final class StudentAchievementFormSchemaRegistryTest extends CIUnitTestCase
{
    private StudentAchievementFormSchemaRegistry $registry;

    protected function setUp(): void
    {
        parent::setUp();
        $this->registry = new StudentAchievementFormSchemaRegistry();
    }

    public function testAllFiftySevenContractsHaveRendererMetadata(): void
    {
        $codes = $this->registry->supportedContractCodes();

        $this->assertCount(57, $codes);
        $this->assertCount(57, array_unique($codes));

        foreach ($codes as $code) {
            $schema = $this->registry->get($code);
            $this->assertSame($code, $schema['contract_code']);
            $this->assertNotEmpty($schema['fields']);
            $keys = array_column($schema['fields'], 'key');
            $this->assertSame($keys, array_values(array_unique($keys)));
        }
    }

    public function testTaxonomyContainsNineCategoriesAndFiftySevenSubcategories(): void
    {
        $schema = $this->registry->all();
        $this->assertSame(
            StudentAchievementFormSchemaRegistry::VERSION,
            $schema['schema_version']
        );
        $this->assertCount(9, $schema['categories']);
        $this->assertSame(
            'representative_evidence_audit_pending',
            $schema['ocr_field_mapping_status']
        );

        $subcategories = array_merge(
            ...array_column($schema['categories'], 'subcategories')
        );
        $this->assertCount(57, $subcategories);
    }

    public function testStudent08SchemaExposesFinalizedConditionalRules(): void
    {
        $schema = $this->registry->get(
            'S08-OTHER_APPROVED_DISCIPLINE'
        );
        $fields = array_column($schema['fields'], null, 'key');

        $this->assertSame(
            'OTHER_APPROVED_DISCIPLINE',
            $fields['discipline']['validation']['value']
        );
        $this->assertSame(
            ['discipline' => 'OTHER_APPROVED_DISCIPLINE'],
            $fields['specified_discipline']['validation']['required_when']
        );
        $this->assertFalse($fields['competition_level']['required']);
        $this->assertSame(
            ['INDIVIDUAL', 'GROUP_ENSEMBLE'],
            array_column($fields['participation_type']['options'], 'value')
        );
    }

    public function testStudent09OutputAndRoleSchemasAreDistinct(): void
    {
        $output = array_column(
            $this->registry->get('S09-NEWS_ITEM')['fields'],
            null,
            'key'
        );
        $role = array_column(
            $this->registry->get(
                'S09-PUBLICATION_MEMBER_CONTRIBUTOR'
            )['fields'],
            null,
            'key'
        );

        $this->assertArrayHasKey('title_of_work', $output);
        $this->assertArrayHasKey('publication_date', $output);
        $this->assertArrayNotHasKey('role_date_period', $output);
        $this->assertArrayHasKey('role_date_period', $role);
        $this->assertArrayNotHasKey('title_of_work', $role);
        $this->assertArrayNotHasKey('publication_date', $role);
    }

    public function testStudent03UsesAuthoritativeTrackerLabel(): void
    {
        $schema = $this->registry->get(
            'S03-UNIVERSITY_BASED_SERVICE'
        );

        $this->assertSame(
            'School / University-Based Service',
            $schema['label']
        );
    }

    public function testRegistryAcceptsItsExactActiveContractCatalog(): void
    {
        $rows = [];

        foreach ($this->registry->all()['categories'] as $category) {
            foreach ($category['subcategories'] as $subcategory) {
                $rows[] = [
                    'contract_code' => $subcategory['contract_code'],
                    'display_name' => $subcategory['label'],
                    'category_code' => $subcategory['category_code'],
                ];
            }
        }

        $this->registry->assertMatchesActiveContractRows($rows);
        $this->addToAssertionCount(1);
    }
}
