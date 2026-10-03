<?php

namespace Tests\Unit;

use App\Services\NtfAnnualReviewSettingsService;
use App\Services\NtfAnnualReviewTemplateService;
use App\Services\NtfAnnualReviewWorkbookParser;
use PHPUnit\Framework\TestCase;
use RuntimeException;
use ZipArchive;

/**
 * The NTF annual-review workbook contract: only DS cells are trusted, everything else is recalculated
 * against the track's criteria and the configurable rating scale.
 */
final class NtfAnnualReviewWorkbookTest extends TestCase
{
    private const FIXTURE = __DIR__ . '/../_support/fixtures/ntf_annual_review_blank_v1.xlsx';
    private const YEARS = ['2025-2026', '2026-2027'];
    private array $temp = [];

    protected function tearDown(): void
    {
        foreach ($this->temp as $path) @unlink($path);
    }

    private static function criteria(): array
    {
        return ['version_id' => 'ver-ntp-2025-001', 'area_max' => 90.0, 'items' => [
            ['code' => 'A.1', 'name' => 'Job Performance', 'max_points' => 50.0, 'weight' => 0.5],
            ['code' => 'A.2', 'name' => 'Personal Attitudes and Qualities', 'max_points' => 10.0, 'weight' => 0.1],
            ['code' => 'A.3', 'name' => 'Efficiency', 'max_points' => 30.0, 'weight' => 0.3],
        ]];
    }

    private static function scale(): array
    {
        return ['version' => 1, 'value' => ['is_provisional' => true, 'bands' => [
            ['key' => 'outstanding', 'label' => 'Outstanding', 'min_percent' => 90, 'passing' => true],
            ['key' => 'very_satisfactory', 'label' => 'Very Satisfactory', 'min_percent' => 80, 'passing' => true],
            ['key' => 'satisfactory', 'label' => 'Satisfactory', 'min_percent' => 70, 'passing' => true],
            ['key' => 'unsatisfactory', 'label' => 'Unsatisfactory', 'min_percent' => 60, 'passing' => false],
            ['key' => 'poor', 'label' => 'Poor', 'min_percent' => 0, 'passing' => false],
        ]]];
    }

    /** Copies the generated blank template and writes a name plus DS values into it. */
    private function workbook(array $ds, string $name = 'Lourdes Bautista'): string
    {
        $path = tempnam(sys_get_temp_dir(), 'ntftest') . '.xlsx';
        copy(self::FIXTURE, $path);
        $this->temp[] = $path;
        $zip = new ZipArchive();
        $zip->open($path);
        $xml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $xml = preg_replace('#<c r="B5" s="(\d+)"/>#', '<c r="B5" s="$1" t="inlineStr"><is><t>' . htmlspecialchars($name) . '</t></is></c>', $xml);
        foreach ($ds as $ref => $value) {
            $xml = preg_replace('#<c r="' . $ref . '" s="(\d+)"/>#', '<c r="' . $ref . '" s="$1"><v>' . $value . '</v></c>', $xml);
        }
        $zip->addFromString('xl/worksheets/sheet1.xml', $xml);
        $zip->close();
        return $path;
    }

    private function parse(string $path): array
    {
        return (new NtfAnnualReviewWorkbookParser())->parseNtf($path, 'review.xlsx', self::YEARS, self::criteria(), self::scale());
    }

    public function testRecalculatesPointsAveragesAndRatingsFromDsOnly(): void
    {
        $result = $this->parse($this->workbook(['D16' => 75, 'D17' => 70, 'D18' => 68, 'F16' => 82, 'F17' => 80, 'F18' => 79]));
        $payload = $result['area_a_payload'];
        self::assertSame('Lourdes Bautista', $result['detected_personnel_name']);
        self::assertSame([37.5, 41.0], $payload['items'][0]['points']);
        self::assertSame(39.25, $payload['items'][0]['average_points']);
        self::assertSame([64.9, 72.7], $payload['totals']);
        self::assertSame([72.11, 80.78], $payload['percentages']);
        self::assertSame('satisfactory', $result['review_1_rating']);
        self::assertSame('very_satisfactory', $result['review_2_rating']);
        self::assertSame('passed', $result['two_review_status']);
        self::assertSame(68.8, $payload['average_total']);
    }

    public function testNonPassingYearFailsTheTwoYearRequirement(): void
    {
        $result = $this->parse($this->workbook(['D16' => 60, 'D17' => 60, 'D18' => 60, 'F16' => 95, 'F17' => 95, 'F18' => 95]));
        self::assertSame('unsatisfactory', $result['review_1_rating']);
        self::assertSame('outstanding', $result['review_2_rating']);
        self::assertSame('not_passed', $result['two_review_status']);
    }

    public function testAnEmptySchoolYearKeepsTheRequirementPending(): void
    {
        $result = $this->parse($this->workbook(['D16' => 90, 'D17' => 90, 'D18' => 90]));
        self::assertSame('pending', $result['two_review_status']);
        self::assertNull($result['review_2_rating']);
        self::assertNull($result['area_a_payload']['average_total']);
    }

    public function testRejectsOutOfRangeAndPartialDs(): void
    {
        try { $this->parse($this->workbook(['D16' => 120, 'D17' => 1, 'D18' => 1])); self::fail('DS above 100 must be rejected.'); }
        catch (RuntimeException $e) { self::assertStringStartsWith('INVALID_DS', $e->getMessage()); }
        $this->expectExceptionMessageMatches('/^INCOMPLETE_DS/');
        $this->parse($this->workbook(['D16' => 80]));
    }

    public function testRejectsWorkbooksForOtherSchoolYears(): void
    {
        $this->expectExceptionMessageMatches('/^UNSUPPORTED_TEMPLATE: Workbook school years/');
        (new NtfAnnualReviewWorkbookParser())->parseNtf($this->workbook(['D16' => 80]), 'review.xlsx', ['2024-2025', '2025-2026'], self::criteria(), self::scale());
    }

    public function testRejectsTheDeanWorkbookFormat(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'dean') . '.xlsx';
        $this->temp[] = $path;
        $zip = new ZipArchive();
        $zip->open($path, ZipArchive::CREATE);
        $zip->addFromString('xl/workbook.xml', '<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="SUMMARY 1st &amp; 2nd" sheetId="1" r:id="rId1"/></sheets></workbook>');
        $zip->addFromString('xl/_rels/workbook.xml.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="worksheets/sheet1.xml" Type="x"/></Relationships>');
        $zip->addFromString('xl/worksheets/sheet1.xml', '<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData/></worksheet>');
        $zip->close();
        $this->expectExceptionMessageMatches('/^UNSUPPORTED_TEMPLATE: This is not the AchieveNest Non-Teaching Faculty/');
        $this->parse($path);
    }

    public function testRatingBandsFollowTheConfiguredScale(): void
    {
        $scale = self::scale()['value'];
        self::assertSame('outstanding', NtfAnnualReviewSettingsService::band(90.0, $scale)['key']);
        self::assertSame('very_satisfactory', NtfAnnualReviewSettingsService::band(89.99, $scale)['key']);
        self::assertSame('unsatisfactory', NtfAnnualReviewSettingsService::band(60.0, $scale)['key']);
        self::assertSame('poor', NtfAnnualReviewSettingsService::band(0.0, $scale)['key']);
        $revised = ['bands' => [['key' => 'passed', 'label' => 'Passed', 'min_percent' => 75, 'passing' => true], ['key' => 'failed', 'label' => 'Failed', 'min_percent' => 0, 'passing' => false]]];
        self::assertSame('failed', NtfAnnualReviewSettingsService::band(74.99, $revised)['key']);
        self::assertSame('very_satisfactory', NtfAnnualReviewSettingsService::ratingKey('Very Satisfactory'));
    }

    public function testFormalDownloadNamesUseThePeriodAndAuthoritativeEmployeeIdentity(): void
    {
        $person = ['employee_id' => 'NTF-002', 'last_name' => 'Dela Cruz', 'first_name' => 'Ana María', 'name' => 'Ana María Dela Cruz'];
        self::assertSame('NTF_AnnualReview_SY2025-2027_NTF-002_Dela_Cruz_Ana_María.xlsx', NtfAnnualReviewTemplateService::workbookFilename(self::YEARS, $person));
        self::assertSame('NTF_Annual_Review_Workbooks_SY2025-2027.zip', NtfAnnualReviewTemplateService::zipFilename(self::YEARS));
    }

    public function testSelectedZipContainsOnlyTheRequestedPersonnelWorkbooks(): void
    {
        $service = new SelectedNtfZipTemplateService();
        [$path, $filename] = $service->buildZip(['academic_year' => '2027-2028'], ['p2', 'p1']);
        $this->temp[] = $path;
        $zip = new ZipArchive();
        self::assertTrue($zip->open($path));
        self::assertSame('NTF_Annual_Review_Workbooks_SY2025-2027.zip', $filename);
        self::assertSame(2, $zip->numFiles);
        self::assertSame([
            'NTF_AnnualReview_SY2025-2027_P2_P2_Person.xlsx',
            'NTF_AnnualReview_SY2025-2027_P1_P1_Person.xlsx',
        ], [$zip->getNameIndex(0), $zip->getNameIndex(1)]);
        self::assertSame(['p2', 'p1'], [$zip->getFromIndex(0), $zip->getFromIndex(1)]);
        $zip->close();
    }
}

final class SelectedNtfZipTemplateService extends NtfAnnualReviewTemplateService
{
    public function __construct() {}

    public function personContext(string $profileId, array $period): array
    {
        return ['profile_id' => $profileId, 'name' => "Person {$profileId}", 'employee_id' => strtoupper($profileId), 'first_name' => 'Person', 'last_name' => strtoupper($profileId)];
    }

    public function build(array $period, ?array $person = null): array
    {
        $path = tempnam(sys_get_temp_dir(), 'ntfselected');
        file_put_contents($path, (string) $person['profile_id']);
        return [$path, self::workbookFilename(self::requiredYears($period['academic_year']), $person)];
    }
}
