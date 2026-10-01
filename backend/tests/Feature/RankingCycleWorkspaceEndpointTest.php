<?php

namespace Tests\Feature;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;

final class RankingCycleWorkspaceEndpointTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    public function testWorkspaceRequiresAuthorization(): void
    {
        $this->get('/api/v1/hr/ranking-cycles/cycle-1/tracks/faculty/workspace/submissions')->assertStatus(401);
    }
}
