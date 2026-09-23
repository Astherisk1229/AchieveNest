<?php

use App\Services\AnnualReviewWorkbookParser;
use PHPUnit\Framework\TestCase;

final class AnnualReviewWorkbookParserTest extends TestCase
{
    public function testCanonicalRatingNormalizationAndVerdicts(): void
    {
        $parser=new AnnualReviewWorkbookParser();
        $this->assertSame('outstanding',$parser->normalizeRating('  OUTSTANDING '));
        $this->assertSame('very_satisfactory',$parser->normalizeRating('Very   Satisfactory'));
        $this->assertSame('passed',$parser->twoReviewStatus('outstanding','satisfactory'));
        $this->assertSame('not_passed',$parser->twoReviewStatus('outstanding','fair'));
        $this->assertSame('pending',$parser->twoReviewStatus('poor',null));
        $this->expectException(RuntimeException::class);$parser->normalizeRating('Excellent');
    }
    public function testApprovedWorkbookContractWhenFixtureIsAvailable(): void
    {
        $path='C:/Users/Admin/Downloads/ANNUAL-REVIEW-FORMAT.xlsx';if(!is_file($path))$this->markTestSkipped('Approved workbook fixture is not available.');
        $parsed=(new AnnualReviewWorkbookParser())->parse($path,basename($path),['2024-2025','2025-2026']);
        $this->assertSame('Jessa Mae Morte',$parsed['detected_personnel_name']);$this->assertSame('outstanding',$parsed['review_1_rating']);$this->assertSame('outstanding',$parsed['review_2_rating']);$this->assertSame('passed',$parsed['two_review_status']);
    }
}
