<?php

namespace App\Services;

/** Strict identity comparison for row-bound annual-review uploads. */
final class AnnualReviewPersonnelMatcher
{
    public static function normalize(string $value): string
    {
        return mb_strtolower(trim((string) preg_replace('/\s+/u', ' ', trim($value))));
    }

    public static function matches(string $selectedPersonnelName, string $workbookPersonnelName): bool
    {
        $selected = self::normalize($selectedPersonnelName);
        $workbook = self::normalize($workbookPersonnelName);
        return $selected !== '' && hash_equals($selected, $workbook);
    }
}
