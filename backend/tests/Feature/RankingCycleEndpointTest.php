<?php

namespace Tests\Feature;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;

final class RankingCycleEndpointTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    public function testCycleListRequiresAuthorization(): void
    {
        $response = $this->get('/api/v1/hr/ranking-cycles');
        $response->assertStatus(401);
    }

    public function testCycleCreateRequiresAuthorization(): void
    {
        $this->post('/api/v1/hr/ranking-cycles', ['cycle_name'=>'AY 2026-2027 Ranking','academic_year'=>'2026-2027'])->assertStatus(401);
    }

    public function testCycleDetailRequiresAuthorization(): void
    {
        $this->get('/api/v1/hr/ranking-cycles/cycle-1')->assertStatus(401);
    }
}
