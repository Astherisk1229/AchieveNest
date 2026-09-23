<?php

use App\Services\AnnualReviewPersonnelMatcher;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class AnnualReviewPersonnelMatcherTest extends TestCase
{
    public static function matchingNames(): array
    {
        return [
            'exact' => ['Jessa Mae Morte'],
            'case' => ['JESSA MAE MORTE'],
            'spacing' => ['  Jessa   Mae   Morte  '],
        ];
    }

    #[DataProvider('matchingNames')]
    public function testRowLevelStrictNormalizationMatches(string $workbookName): void
    {
        self::assertTrue(AnnualReviewPersonnelMatcher::matches('Jessa Mae Morte', $workbookName));
    }

    public function testTrueMismatchIsRejected(): void
    {
        self::assertFalse(AnnualReviewPersonnelMatcher::matches('Jessa Mae Morte', 'Cynthia Ramos'));
    }

    public function testNormalizationDoesNotBecomeFuzzyOrPartial(): void
    {
        self::assertFalse(AnnualReviewPersonnelMatcher::matches('Jessa Mae Morte', 'Jessa Morte'));
        self::assertFalse(AnnualReviewPersonnelMatcher::matches('Jessa Mae Morte', 'Dr. Jessa Mae Morte'));
    }
}
