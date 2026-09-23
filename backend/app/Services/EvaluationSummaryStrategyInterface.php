<?php

namespace App\Services;

interface EvaluationSummaryStrategyInterface
{
    public function render(array $evaluation, array $items, array $criteria, array $totals): array;
}
