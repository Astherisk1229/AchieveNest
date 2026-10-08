<?php

namespace Tests\Unit;

use App\Services\PortfolioStructuredMetadataValidator;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;

final class PortfolioStructuredMetadataValidatorOptionalHierarchyTest extends CIUnitTestCase
{
    public function testTerminalCategoryMayBeSubmittedWithoutSubcategory(): void
    {
        $db = Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => ''], false);
        $this->taxonomyTables($db);
        $categoryId = '2f24ae1c-5e2f-4eb5-a28b-4781205d649c';
        $db->table('portfolio_categories')->insert(['id' => $categoryId, 'status' => 'active']);

        $result = (new PortfolioStructuredMetadataValidator($db))->validateTaxonomyPair($categoryId, null);

        self::assertTrue($result['valid']);
        self::assertNull($result['subcategory']);
        $db->close();
    }

    public function testCategoryWithActiveChildrenRequiresMatchingSubcategory(): void
    {
        $db = Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => ''], false);
        $this->taxonomyTables($db);
        $categoryId = '2f24ae1c-5e2f-4eb5-a28b-4781205d649c';
        $subcategoryId = 'b17af946-221e-45de-8439-8fb91a462936';
        $db->table('portfolio_categories')->insert(['id' => $categoryId, 'status' => 'active']);
        $db->table('portfolio_subcategories')->insert([
            'id' => $subcategoryId,
            'category_id' => $categoryId,
            'status' => 'active',
        ]);

        $validator = new PortfolioStructuredMetadataValidator($db);
        $missing = $validator->validateTaxonomyPair($categoryId, null);
        $selected = $validator->validateTaxonomyPair($categoryId, $subcategoryId);

        self::assertFalse($missing['valid']);
        self::assertSame('SUBCATEGORY_REQUIRED', $missing['error']['code']);
        self::assertTrue($selected['valid']);
        $db->close();
    }

    private function taxonomyTables($db): void
    {
        $db->query('CREATE TABLE portfolio_categories (id VARCHAR(36) PRIMARY KEY, status VARCHAR(16) NOT NULL)');
        $db->query('CREATE TABLE portfolio_subcategories (id VARCHAR(36) PRIMARY KEY, category_id VARCHAR(36) NOT NULL, status VARCHAR(16) NOT NULL)');
    }
}
