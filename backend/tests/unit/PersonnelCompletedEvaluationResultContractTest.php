<?php

namespace Tests\Unit;

use App\Services\PersonnelCompletedEvaluationResultService;
use App\Services\PersonnelCompletedEvaluationResultHtmlRenderer;
use PHPUnit\Framework\TestCase;
use ReflectionClass;
use ReflectionMethod;

final class PersonnelCompletedEvaluationResultContractTest extends TestCase
{
    public function testOnlyVerifiedItemEvidenceIsExposedAsContributingEvidence(): void
    {
        $verified = $this->invoke('sanitizeItem', [[
            'id' => 'item-1', 'verification_status' => 'verified',
            'criterion_snapshot' => json_encode(['code' => 'A.1', 'title' => 'Degree']),
            'evidence_snapshot' => json_encode([['id' => 'e-1', 'original_filename' => 'degree.pdf']]),
        ]]);
        $unverified = $this->invoke('sanitizeItem', [[
            'id' => 'item-2', 'verification_status' => 'pending',
            'criterion_snapshot' => json_encode(['code' => 'A.2']),
            'evidence_snapshot' => json_encode([['id' => 'e-2', 'original_filename' => 'pending.pdf']]),
        ]]);

        self::assertSame('degree.pdf', $verified['evidence_snapshot'][0]['original_filename']);
        self::assertSame(['code' => 'A.1', 'title' => 'Degree'], $verified['criterion_snapshot']);
        self::assertSame([], $unverified['evidence_snapshot']);
    }

    public function testMaximumAndPassingScoresComeFromFrozenSnapshotFields(): void
    {
        self::assertSame(160.0, $this->invoke('frozenScore', [
            ['version' => ['total_max_points' => 160, 'passing_score' => 120]],
            [['version', 'total_max_points']],
        ]));
        self::assertSame(120.0, $this->invoke('frozenScore', [
            ['version' => ['total_max_points' => 160, 'passing_score' => 120]],
            [['version', 'passing_score']],
        ]));
        self::assertNull($this->invoke('frozenScore', [[], [['maximum_score']]]));
    }

    public function testLegacyReportUsesExactVerificationStatusFromImmutableTerminalSnapshot(): void
    {
        $items = $this->invoke('completedItems', [
            ['items' => [['id' => 'item-1', 'evidence_snapshot' => [['id' => 'e-1']]]]],
            ['final_snapshot' => json_encode(['items' => [['id' => 'item-1', 'verification_status' => 'verified']]])],
        ]);

        self::assertSame('verified', $items[0]['verification_status']);
    }

    public function testNonTeachingPrintUsesTheAppendixNWeightedColumns(): void
    {
        $html = (new PersonnelCompletedEvaluationResultHtmlRenderer())->render([
            'personnel' => ['group' => 'NON_TEACHING_FACULTY', 'name' => 'Lourdes Bautista'],
            'evaluation_period' => ['name' => 'AY 2027-2028'],
            'summary' => [
                'period_covered' => 'AY 2027-2028', 'passing_score' => 75, 'result' => 'Passed',
                'performance_personal_indicators' => ['points_earned' => 39.5, 'items' => [['criterion_code' => 'A.1', 'indicator' => 'Job Performance', 'weight' => 50, 'percentage' => .5, 'ds' => 79, 'points_earned' => 39.5]]],
                'service_leadership' => ['points_earned' => 20, 'items' => [['criterion_code' => 'B.1', 'document' => 'School Activities', 'weight' => 30, 'points_earned' => 20]]],
            ],
            'scores' => ['total' => 59.5, 'maximum' => 150, 'passing' => 75],
        ]);

        self::assertStringContainsString('Appendix N', $html);
        self::assertStringContainsString('NON-TEACHING PERSONNEL RANKING SCALE', $html);
        self::assertStringContainsString('<th class="num">Weight</th>', $html);
        self::assertStringContainsString('<th class="num">DS</th>', $html);
        self::assertStringContainsString('Passing Score:</b> 75.00 points', $html);
    }

    private function invoke(string $method, array $arguments): mixed
    {
        $service = (new ReflectionClass(PersonnelCompletedEvaluationResultService::class))->newInstanceWithoutConstructor();
        return (new ReflectionMethod(PersonnelCompletedEvaluationResultService::class, $method))->invoke($service, ...$arguments);
    }
}
