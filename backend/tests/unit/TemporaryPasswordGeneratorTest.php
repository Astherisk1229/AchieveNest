<?php

namespace Tests\Unit;

use App\Helpers\ValidationHelper;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * @internal
 */
final class TemporaryPasswordGeneratorTest extends CIUnitTestCase
{
    public function testTemporaryPasswordLength(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $password = ValidationHelper::generateTemporaryPassword();
            $this->assertSame(ValidationHelper::TEMP_LENGTH, strlen($password));
        }
    }

    public function testTemporaryPasswordContainsAllRequiredCharacterClasses(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $password = ValidationHelper::generateTemporaryPassword();

            // Uppercase
            $this->assertMatchesRegularExpression('/[ABCDEFGHJKLMNPQRSTUVWXYZ]/', $password);
            // Lowercase
            $this->assertMatchesRegularExpression('/[abcdefghijkmnopqrstuvwxyz]/', $password);
            // Digit
            $this->assertMatchesRegularExpression('/[23456789]/', $password);
            // Special
            $this->assertMatchesRegularExpression('/[!@#$%*?-_]/', $password);
        }
    }

    public function testTemporaryPasswordExcludesAmbiguousAndUnsafeCharacters(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $password = ValidationHelper::generateTemporaryPassword();

            // Ambiguous characters: 0, O, 1, I, l
            $this->assertDoesNotMatchRegularExpression('/[0O1Il]/', $password);

            // Unsafe characters: quotes, backticks, backslashes, angle brackets, whitespace
            $this->assertDoesNotMatchRegularExpression('/[\s\'"`\\\\<>]/', $password);

            // No fixed prefix
            $this->assertStringStartsNotWith('Ndmu#', $password);
            $this->assertStringStartsNotWith('Temp_', $password);
        }
    }

    public function testTemporaryPasswordSatisfiesAuthoritativePasswordPolicy(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $password = ValidationHelper::generateTemporaryPassword();
            $this->assertTrue(ValidationHelper::validatePasswordPolicy($password));
        }
    }

    public function testTemporaryPasswordDiversityAndUniqueness(): void
    {
        $generated = [];
        $sampleCount = 100;

        for ($i = 0; $i < $sampleCount; $i++) {
            $password = ValidationHelper::generateTemporaryPassword();
            $this->assertArrayNotHasKey($password, $generated, 'Collision detected in temporary password generation.');
            $generated[$password] = true;
        }

        $this->assertCount($sampleCount, $generated);
    }

    public function testEntropyLowerBoundExceedsEightyBits(): void
    {
        $uppercaseCount = strlen(ValidationHelper::TEMP_UPPERCASE); // 24
        $lowercaseCount = strlen(ValidationHelper::TEMP_LOWERCASE); // 25
        $digitCount     = strlen(ValidationHelper::TEMP_DIGITS);    // 8
        $specialCount   = strlen(ValidationHelper::TEMP_SPECIALS);  // 9
        $totalAlphabet  = $uppercaseCount + $lowercaseCount + $digitCount + $specialCount; // 66
        $length         = ValidationHelper::TEMP_LENGTH; // 16

        $forcedClassSpace = $uppercaseCount * $lowercaseCount * $digitCount * $specialCount; // 43,200
        $remainingPositions = $length - 4; // 12
        $remainingSpaceBits = $remainingPositions * log($totalAlphabet, 2); // 12 * log2(66) = 72.53 bits
        $forcedBits = log($forcedClassSpace, 2); // 15.40 bits
        $permutationPositionsBits = log(16 * 15 * 14 * 13, 2); // 15.41 bits

        $conservativeEntropy = $forcedBits + $remainingSpaceBits + $permutationPositionsBits;

        $this->assertGreaterThanOrEqual(80.0, $conservativeEntropy, 'Calculated conservative entropy must exceed 80 bits.');
        $this->assertGreaterThan(100.0, $conservativeEntropy);
    }

    public function testSecureRandomCharacterRejectsEmptyAlphabet(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        ValidationHelper::secureRandomCharacter('');
    }

    public function testSecureShufflePreservesElements(): void
    {
        $original = ['A', 'b', '3', '!', 'X', 'y', '8', '$'];
        $shuffled = ValidationHelper::secureShuffle($original);

        $this->assertCount(count($original), $shuffled);
        $sortedOrig = $original;
        $sortedShuf = $shuffled;
        sort($sortedOrig);
        sort($sortedShuf);
        $this->assertSame($sortedOrig, $sortedShuf);
    }
}
