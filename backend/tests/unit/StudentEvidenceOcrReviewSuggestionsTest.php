<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\StudentEvidencePaddleOcrService;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * OCR review suggestions: role, organization and academic year lines are exposed as advisory
 * suggestions using the same keys as the category-specific fields; nothing else is inferred.
 */
final class StudentEvidenceOcrReviewSuggestionsTest extends CIUnitTestCase
{
    public function testLabelledCertificateLinesBecomeAdvisorySuggestions(): void
    {
        $method = new \ReflectionMethod(StudentEvidencePaddleOcrService::class, 'withReviewSuggestions');
        $payload = ['pages' => [['suggestions' => [
            'recognition' => ['value' => 'Outstanding Leadership and', 'confidence' => 0.98],
            'role' => ['value' => 'Student Organization President', 'confidence' => 0.99],
            'organization' => ['value' => 'Association of Computing', 'confidence' => 0.97],
            'academic_year' => ['value' => '2025–2026', 'confidence' => 0.99],
            'date_awarded' => ['value' => 'May 28, 2026', 'confidence' => 0.99],
            'granting_body' => ['value' => 'Office of Student', 'confidence' => 0.99],
            'unlabelled' => ['value' => 'ignored', 'confidence' => 0.99],
        ]]]];
        $result = $method->invoke(new StudentEvidencePaddleOcrService(), $payload);
        $byKey = array_column($result['review_suggestions'], 'value', 'key');

        self::assertSame('Student Organization President', $byKey['position_title']);
        self::assertSame('Association of Computing', $byKey['organization_name']);
        self::assertSame('2025–2026', $byKey['academic_year']);
        self::assertSame('May 28, 2026', $byKey['start_date_raw']);
        self::assertSame('Outstanding Leadership and', $byKey['activity_title']);
        self::assertSame('Office of Student', $byKey['organizer_granting_body']);
        self::assertArrayNotHasKey('position_level', $byKey);
        self::assertNotContains('ignored', $byKey);
        foreach ($result['review_suggestions'] as $suggestion) {
            self::assertTrue($suggestion['advisory_only']);
        }
    }

    public function testBridgeReadsTheNewLabels(): void
    {
        $bridge = (string) file_get_contents(dirname(__DIR__, 2) . '/ocr/student_ocr_bridge.py');
        self::assertStringContainsString('|Role|Position|Organization|Academic Year)', $bridge);
    }
}
