<?php

namespace App\Services;

/** Builds evaluator-facing text from the immutable criterion snapshot on an evaluation item. */
final class EvaluationCriterionRemarkService
{
    public function generate(array $criterion): string
    {
        $category = is_array($criterion['category'] ?? null) ? $criterion['category'] : [];
        $subcategory = is_array($criterion['subcategory'] ?? null)
            ? $criterion['subcategory']
            : (is_array($criterion['level'] ?? null) ? $criterion['level'] : []);
        $level = is_array($criterion['selected_level'] ?? null)
            ? $criterion['selected_level']
            : (is_array($criterion['configured_level'] ?? null) ? $criterion['configured_level'] : []);
        if ($level === []) {
            foreach ($criterion['matched_options'] ?? [] as $option) {
                if (strcasecmp((string) ($option['option_group_code'] ?? ''), 'LEVEL') === 0) {
                    $level = $option;
                    break;
                }
            }
        }

        $points = (float) ($criterion['configured_points'] ?? 0);
        $cap = (float) ($criterion['criterion_cap'] ?? $category['max_points'] ?? 0);
        $manual = ! empty($criterion['evaluator_judgment_required']);
        $label = $this->label($level) ?: $this->label($subcategory) ?: trim((string) ($category['name'] ?? ''));
        if ($label === '') return '';

        if ($manual) {
            return $label . ' — manual evaluator scoring. Maximum: ' . $this->number($cap) . ' points.';
        }

        if ($points <= 0 || $cap <= 0) return '';
        return $label . ' — ' . $this->number($points) . ' points. Category cut-off: ' . $this->number($cap) . ' points.';
    }

    public function snapshot(array $criterion): array
    {
        $remark = $this->generate($criterion);
        if ($remark !== '') $criterion['system_generated_remark'] = $remark;
        return $criterion;
    }

    private function label(array $row): string
    {
        foreach (['label', 'name', 'option_name', 'description'] as $field) {
            $value = trim((string) ($row[$field] ?? ''));
            if ($value !== '') return $value;
        }
        return '';
    }

    private function number(float $value): string
    {
        return rtrim(rtrim(number_format($value, 2, '.', ''), '0'), '.');
    }
}
