<?php

namespace Tests\Unit;

use App\Services\PersonnelImportService;
use CodeIgniter\Test\CIUnitTestCase;
use ReflectionClass;
use SimpleXMLElement;
use ZipArchive;

final class PersonnelImportTemplateIntegrityTest extends CIUnitTestCase
{
    private string $workbookPath;

    protected function setUp(): void
    {
        parent::setUp();

        $service = (new ReflectionClass(PersonnelImportService::class))->newInstanceWithoutConstructor();
        $content = $service->generateTemplate();

        $this->workbookPath = tempnam(sys_get_temp_dir(), 'personnel_import_template_');
        self::assertNotFalse($this->workbookPath);
        self::assertGreaterThan(0, file_put_contents($this->workbookPath, $content));
    }

    protected function tearDown(): void
    {
        if (isset($this->workbookPath) && is_file($this->workbookPath)) {
            unlink($this->workbookPath);
        }

        parent::tearDown();
    }

    public function testGeneratedTemplateIsAValidOoxmlPackage(): void
    {
        self::assertGreaterThan(0, filesize($this->workbookPath));
        self::assertSame("PK\x03\x04", file_get_contents($this->workbookPath, false, null, 0, 4));

        $zip = new ZipArchive();
        self::assertTrue($zip->open($this->workbookPath));

        $required = [
            '[Content_Types].xml',
            '_rels/.rels',
            'xl/workbook.xml',
            'xl/_rels/workbook.xml.rels',
            'xl/sharedStrings.xml',
            'xl/worksheets/sheet1.xml',
            'xl/worksheets/sheet2.xml',
        ];
        foreach ($required as $entry) {
            self::assertNotFalse($zip->locateName($entry), "Missing OOXML entry: {$entry}");
        }

        $names = [];
        for ($index = 0; $index < $zip->numFiles; $index++) {
            $name = $zip->getNameIndex($index);
            self::assertIsString($name);
            self::assertArrayNotHasKey($name, $names, "Duplicate OOXML entry: {$name}");
            $names[$name] = true;

            if (str_ends_with($name, '.xml') || str_ends_with($name, '.rels')) {
                $xml = $zip->getFromIndex($index);
                self::assertIsString($xml);
                self::assertInstanceOf(SimpleXMLElement::class, simplexml_load_string($xml), "Malformed XML: {$name}");
            }
        }

        $workbook = simplexml_load_string((string) $zip->getFromName('xl/workbook.xml'));
        self::assertInstanceOf(SimpleXMLElement::class, $workbook);
        $workbook->registerXPathNamespace('m', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');
        $workbook->registerXPathNamespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships');

        $relationships = simplexml_load_string((string) $zip->getFromName('xl/_rels/workbook.xml.rels'));
        self::assertInstanceOf(SimpleXMLElement::class, $relationships);
        $relationships->registerXPathNamespace('p', 'http://schemas.openxmlformats.org/package/2006/relationships');

        $targets = [];
        foreach ($relationships->xpath('//p:Relationship') ?: [] as $relationship) {
            $targets[(string) $relationship['Id']] = 'xl/' . ltrim((string) $relationship['Target'], '/');
        }

        $sheetNames = [];
        foreach ($workbook->xpath('//m:sheet') ?: [] as $sheet) {
            $sheetNames[] = (string) $sheet['name'];
            $attributes = $sheet->attributes('http://schemas.openxmlformats.org/officeDocument/2006/relationships');
            $relationshipId = (string) $attributes['id'];
            self::assertArrayHasKey($relationshipId, $targets);
            self::assertNotFalse($zip->locateName($targets[$relationshipId]), "Missing worksheet target: {$targets[$relationshipId]}");
        }

        self::assertSame(['Personnel Roster', 'Guidance & Allowed Values'], $sheetNames);
        $zip->close();
    }

    public function testGeneratedTemplateContainsExpectedHeaders(): void
    {
        $zip = new ZipArchive();
        self::assertTrue($zip->open($this->workbookPath));

        $sharedStrings = simplexml_load_string((string) $zip->getFromName('xl/sharedStrings.xml'));
        self::assertInstanceOf(SimpleXMLElement::class, $sharedStrings);
        $sharedStrings->registerXPathNamespace('m', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');
        $values = array_map(static fn (SimpleXMLElement $node): string => (string) $node->t, $sharedStrings->xpath('//m:si') ?: []);

        foreach (['Employee ID', 'Institutional Email', 'Personnel Type', 'Current Rank Title'] as $header) {
            self::assertContains($header, $values);
        }

        $zip->close();
    }

    public function testGeneratedTemplateContainsExpectedPersonnelDropdowns(): void
    {
        $zip = new ZipArchive();
        self::assertTrue($zip->open($this->workbookPath));

        $worksheet = simplexml_load_string((string) $zip->getFromName('xl/worksheets/sheet1.xml'));
        self::assertInstanceOf(SimpleXMLElement::class, $worksheet);
        $worksheet->registerXPathNamespace('m', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');

        $validations = $worksheet->xpath('//m:dataValidation') ?: [];
        self::assertCount(4, $validations);
        self::assertSame(['G2:G1000', 'H2:H1000', 'I2:I1000', 'K2:K1000'], array_map(
            static fn (SimpleXMLElement $validation): string => (string) $validation['sqref'],
            $validations
        ));
        self::assertSame([
            '"Faculty,Non-Teaching Faculty"',
            '"Permanent,Probationary"',
            '"Academic,Non-Academic"',
            '"full_time_faculty,part_time_faculty"',
        ], array_map(static fn (SimpleXMLElement $validation): string => (string) $validation->formula1, $validations));

        $zip->close();
    }

    public function testGeneratedTemplateCanBeReopenedByTheImportParser(): void
    {
        $service = (new ReflectionClass(PersonnelImportService::class))->newInstanceWithoutConstructor();
        $rows = $service->parseFile($this->workbookPath, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        self::assertCount(1, $rows);
        self::assertSame('EMP-2026-001', $rows[0]['institutional_id']);
        self::assertSame('sample.faculty@ndmu.edu.ph', $rows[0]['institutional_email']);
        self::assertSame('Faculty', $rows[0]['personnel_group']);
        self::assertSame('Assistant Professor I', $rows[0]['current_rank_title']);
    }
}
