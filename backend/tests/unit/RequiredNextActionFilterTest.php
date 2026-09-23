<?php

namespace Tests\Unit;

use App\Filters\RequiredNextActionFilter;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * @internal
 */
final class RequiredNextActionFilterTest extends CIUnitTestCase
{
    protected RequiredNextActionFilter $filter;

    protected function setUp(): void
    {
        parent::setUp();
        $this->filter = new RequiredNextActionFilter();
    }

    public function testFilterInstantiates(): void
    {
        $this->assertInstanceOf(RequiredNextActionFilter::class, $this->filter);
    }
}
