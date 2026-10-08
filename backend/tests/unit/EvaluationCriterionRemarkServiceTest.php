<?php

namespace Tests\Unit;

use App\Services\EvaluationCriterionRemarkService;
use PHPUnit\Framework\TestCase;

final class EvaluationCriterionRemarkServiceTest extends TestCase
{
    public function testBuildsRemarkFromConfiguredSubcategoryPointsAndCutoff(): void
    {
        $remark = (new EvaluationCriterionRemarkService())->generate($this->criterion());
        self::assertSame('Awardee — 30 points. Category cut-off: 40 points.', $remark);
    }

    public function testBuildsRemarkFromSelectedLevelWhenPresent(): void
    {
        $criterion = $this->criterion();
        $criterion['selected_level'] = ['option_group_code' => 'LEVEL', 'label' => 'National'];
        self::assertSame('National — 30 points. Category cut-off: 40 points.', (new EvaluationCriterionRemarkService())->generate($criterion));
    }

    public function testManualCriterionUsesMaximumWithoutInventingPointRule(): void
    {
        $criterion = $this->criterion();
        $criterion['subcategory']['name'] = 'Conduct of Research';
        $criterion['evaluator_judgment_required'] = true;
        self::assertSame('Conduct of Research — manual evaluator scoring. Maximum: 40 points.', (new EvaluationCriterionRemarkService())->generate($criterion));
    }

    private function criterion(): array
    {
        return ['category' => ['name' => 'Professional Recognition', 'max_points' => 40], 'subcategory' => ['name' => 'Awardee', 'default_points' => 30], 'configured_points' => 30, 'criterion_cap' => 40];
    }
}
