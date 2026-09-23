<?php

namespace Tests\Unit;

use App\Services\AwardPotentialCandidateService;
use CodeIgniter\Test\CIUnitTestCase;

final class AwardScoringConfigurationPhase1BTest extends CIUnitTestCase
{
    public function testThresholdAndMaximumFallbacksAreAbsentAndProposedGenerationIsBlocked(): void
    {
        $root = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'app';
        $potential = file_get_contents($root . '/Services/AwardPotentialCandidateService.php');
        $generation = file_get_contents($root . '/Services/AwardCandidateGenerationService.php');
        $scoring = file_get_contents($root . '/Services/AwardScoringService.php');

        $this->assertStringNotContainsString('UNIVERSAL_THRESHOLD_PERCENT', $potential);
        $this->assertStringNotContainsString("?? 80.00", $generation);
        $this->assertStringContainsString('THRESHOLD_CONFIGURATION_ERROR', $potential);
        $this->assertStringContainsString("=== 'PROPOSED'", $generation);
        $this->assertStringContainsString('Configured computable maximum does not match', $scoring);
        $this->assertStringNotContainsString('PERFORMER_OF_THE_YEAR_FEMALE\' => 55.0', $scoring);
    }

    public function testThresholdResolverFailsClosedForMissingAndInvalidValues(): void
    {
        $reflection = new \ReflectionClass(AwardPotentialCandidateService::class);
        $service = $reflection->newInstanceWithoutConstructor();
        $method = $reflection->getMethod('resolveThreshold');

        $this->assertNull($method->invoke($service, []));
        $this->assertNull($method->invoke($service, ['candidate_threshold_percent' => 'unknown']));
        $this->assertNull($method->invoke($service, ['candidate_threshold_percent' => 101]));
        $this->assertSame(80.0, $method->invoke($service, ['candidate_threshold_percent' => 80]));
    }
}
