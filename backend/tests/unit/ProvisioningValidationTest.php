<?php

namespace Tests\Unit;

use App\Helpers\ValidationHelper;
use CodeIgniter\Test\CIUnitTestCase;

final class ProvisioningValidationTest extends CIUnitTestCase
{
    public function testCanonicalInstitutionalEmailContract(): void
    {
        $this->assertSame('bserquina@ndmu.edu.ph', ValidationHelper::canonicalizeNdmuEmail('  BSERQUINA@NDMU.EDU.PH  '));
        $this->assertNull(ValidationHelper::canonicalizeNdmuEmail(['bserquina@ndmu.edu.ph']));
        $this->assertNull(ValidationHelper::canonicalizeNdmuEmail("bserquina@ndmu.edu.ph\r\n"));
        $this->assertNull(ValidationHelper::canonicalizeNdmuEmail("bserquina\u{200B}@ndmu.edu.ph"));
        $this->assertNull(ValidationHelper::canonicalizeNdmuEmail('bserquina＠ndmu.edu.ph'));
    }

    /** @dataProvider invalidInstitutionalEmailProvider */
    public function testRejectsNonInstitutionalAndConfusableEmails(string $email): void
    {
        $this->assertNull(ValidationHelper::canonicalizeNdmuEmail($email));
    }

    public static function invalidInstitutionalEmailProvider(): array
    {
        return [
            ['user@ndmu.edu.ph.evil.example'], ['user@evilndmu.edu.ph'],
            ['user@ndmu.edu.ph@evil.example'], ['user gmail@ndmu.edu.ph'],
            ['.user@ndmu.edu.ph'], ['user..name@ndmu.edu.ph'],
        ];
    }

    public function testNamesRejectControlAndBidiCharacters(): void
    {
        $this->assertTrue(ValidationHelper::validateName("Dela Cruz-O'Neil"));
        $this->assertFalse(ValidationHelper::validateName("Unsafe\nName"));
        $this->assertFalse(ValidationHelper::validateName("Unsafe\u{202E}Name"));
    }

    public function testStudentInstitutionalIdContractPreservesLeadingZeros(): void
    {
        $this->assertSame('00123', ValidationHelper::canonicalizeStudentInstitutionalId(' 00123 ', 5, 50));
        $this->assertSame(str_repeat('9', 50), ValidationHelper::canonicalizeStudentInstitutionalId(str_repeat('9', 50), 5, 50));
        foreach (['1234', '12-345', '１２３４５', '12345.0', '+12345', "12345\n", '12345a'] as $invalid) {
            $this->assertNull(ValidationHelper::canonicalizeStudentInstitutionalId($invalid, 5, 50));
        }
    }

    public function testPersonnelIdSafetyDoesNotInventAFormat(): void
    {
        $this->assertSame('EMP822313', ValidationHelper::canonicalizePersonnelInstitutionalId(' EMP822313 ', 50));
        $this->assertSame('2026-DEMO-003', ValidationHelper::canonicalizePersonnelInstitutionalId('2026-DEMO-003', 50));
        $this->assertNull(ValidationHelper::canonicalizePersonnelInstitutionalId("EMP\u{202E}123", 50));
        $this->assertNull(ValidationHelper::canonicalizePersonnelInstitutionalId(str_repeat('A', 51), 50));
    }

    public function testAcademicYearMustBeConsecutiveAndWithinConfiguredBounds(): void
    {
        $this->assertTrue(ValidationHelper::validateAcademicYear('2025-2026', 2025, 2026));
        $this->assertTrue(ValidationHelper::validateAcademicYear('2026-2027', 2025, 2026));
        foreach (['2024-2025', '2027-2028', '2026-2026', '2026-2028', '2026–2027', 'Graduate'] as $invalid) {
            $this->assertFalse(ValidationHelper::validateAcademicYear($invalid, 2025, 2026));
        }
    }
}
