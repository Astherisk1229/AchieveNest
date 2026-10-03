<?php

namespace App\Services;

/**
 * A.1.2 Ph.D. Units and A.1.4 MA Units.
 *
 * Each semester is its own portfolio record and its own evaluation item, and each passes the
 * ranking-cycle gate (EvaluationValidityService) on its own completion date before it is ever
 * copied into an evaluation. Scoring then sums the units of the counted items per graduate
 * level and applies the official table ONCE to that total. Per-semester points are never
 * computed or added. MA and Ph.D. units are never mixed.
 *
 * Official tables (Faculty Ranking Scale, Table A.1):
 *   Ph.D. Units: 3→2, 6→4, 9→6, 12→8, 15+→10   (2 points per 3 units, max 10)
 *   MA Units:    3→1, 6→2, … 27→9, 30+→10      (1 point per 3 units, max 10)
 */
final class GraduateUnitScoringService
{
    public const MA = 'MA';
    public const PHD = 'PHD';

    private const LEVEL_BY_CODE = [
        'A1_PHD_UNITS' => self::PHD, 'A.1.2' => self::PHD,
        'A1_MA_UNITS' => self::MA, 'A.1.4' => self::MA,
    ];
    private const SUBCATEGORY_CODE = [self::PHD => 'A.1.2', self::MA => 'A.1.4'];
    private const LABEL = [self::PHD => 'Ph.D. Units', self::MA => 'MA Units'];

    /** Official table. Units below 3 earn nothing; partial groups of 3 earn nothing. */
    public static function pointsFor(string $level, int $units): float
    {
        $groups = intdiv(max(0, $units), 3);
        return match ($level) {
            self::PHD => (float) min(10, $groups * 2),
            self::MA => (float) min(10, $groups),
            default => 0.0,
        };
    }

    /** Graduate level of a portfolio record or an evaluation item, or null when it is not a units record. */
    public static function levelOf(array $row): ?string
    {
        $metadata = self::decode($row['category_metadata'] ?? null);
        $payload = self::decode($row['scoring_payload'] ?? null);
        $payloadMetadata = self::decode($payload['category_metadata'] ?? null);
        $snapshot = self::decode($row['criterion_snapshot'] ?? null);
        foreach ([
            $metadata['subcategory_code'] ?? null,
            $payloadMetadata['subcategory_code'] ?? null,
            $row['criterion_key'] ?? null,
            $snapshot['criterion_reference'] ?? null,
        ] as $code) {
            $level = self::LEVEL_BY_CODE[strtoupper(trim((string) $code))] ?? null;
            if ($level !== null) return $level;
        }
        return null;
    }

    /** Units on one record/item (details.units_completed); 0 when missing or not a whole number. */
    public static function unitsOf(array $row): int
    {
        $metadata = self::decode($row['category_metadata'] ?? null);
        if ($metadata === []) $metadata = self::decode(self::decode($row['scoring_payload'] ?? null)['category_metadata'] ?? null);
        $details = self::decode($metadata['details'] ?? null);
        $value = trim((string) ($details['units_completed'] ?? ''));
        return preg_match('/^\d+$/', $value) ? (int) $value : 0;
    }

    /**
     * Totals per level over the evaluation items that count (verified and rated). Items in the
     * evaluation already passed the cycle gate at submission, so nothing outside the cycle is here.
     *
     * @return array<string, array{level:string,label:string,subcategory_code:string,units:int,points:float,item_ids:list<string>}>
     */
    public static function aggregate(array $items): array
    {
        $levels = [];
        foreach ($items as $item) {
            $level = self::levelOf($item);
            if ($level === null || ! self::counts($item)) continue;
            $levels[$level] ??= ['level' => $level, 'label' => self::LABEL[$level], 'subcategory_code' => self::SUBCATEGORY_CODE[$level], 'category_code' => self::categoryCode($item), 'area' => 'A', 'units' => 0, 'points' => 0.0, 'item_ids' => []];
            $levels[$level]['units'] += self::unitsOf($item);
            $levels[$level]['item_ids'][] = (string) ($item['id'] ?? '');
        }
        foreach ($levels as $level => $row) $levels[$level]['points'] = self::pointsFor($level, $row['units']);
        return $levels;
    }

    public static function isUnitItem(array $item): bool
    {
        return self::levelOf($item) !== null;
    }

    private static function counts(array $item): bool
    {
        return ($item['verification_status'] ?? '') === 'verified' && ($item['rating_status'] ?? '') === 'rated';
    }

    private static function categoryCode(array $item): string
    {
        $snapshot = self::decode($item['criterion_snapshot'] ?? null);
        $category = self::decode($snapshot['category'] ?? null);
        return (string) ($category['category_code'] ?? 'A.1');
    }

    private static function decode(mixed $value): array
    {
        if (is_array($value)) return $value;
        if (! is_string($value) || $value === '') return [];
        $decoded = json_decode($value, true);
        return is_array($decoded) ? $decoded : [];
    }
}
