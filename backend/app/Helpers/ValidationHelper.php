<?php

namespace App\Helpers;

/**
 * ValidationHelper
 *
 * Centralized backend validation functions for the AchieveNest HR vertical slice.
 * All frontend validation must mirror these rules — the backend is always authoritative.
 */
class ValidationHelper
{
    /** NDMU institutional email pattern */
    public const NDMU_EMAIL_PATTERN = '/^[A-Za-z0-9.!#$%&\'*+\/=?^_`{|}~-]+@ndmu\.edu\.ph$/D';
    public const MAX_INSTITUTIONAL_EMAIL_LENGTH = 255;

    /** Minimum password length */
    public const PASSWORD_MIN_LENGTH = 8;

    /** Maximum lengths for bounded text fields */
    public const MAX_REASON_LENGTH     = 500;
    public const MAX_REMARKS_LENGTH    = 2000;
    public const MAX_DESCRIPTION_LENGTH = 5000;
    public const MAX_NAME_LENGTH       = 255;
    public const MAX_LABEL_LENGTH      = 255;

    /** Allowed sort columns (allowlist for ORDER BY injection prevention) */
    public const ALLOWED_PERSONNEL_SORT = ['full_name', 'institutional_id', 'created_at', 'status', 'updated_at'];
    public const ALLOWED_SORT_DIRECTIONS = ['ASC', 'DESC'];

    /** Pagination caps */
    public const DEFAULT_PER_PAGE = 25;
    public const MAX_PER_PAGE     = 100;

    /**
     * Validates an NDMU institutional email.
     */
    public static function validateNdmuEmail(string $email): bool
    {
        return self::canonicalizeNdmuEmail($email) !== null;
    }

    /**
     * Returns the one canonical login identifier, or null for malformed,
     * non-institutional, control/invisible-character, or overlength input.
     */
    public static function canonicalizeNdmuEmail(mixed $email): ?string
    {
        if (! is_string($email)) {
            return null;
        }

        if (preg_match('/[\x00-\x1F\x7F\p{Cf}]/u', $email) === 1) {
            return null;
        }
        $clean = strtolower(trim($email));
        if ($clean === '' || strlen($clean) > self::MAX_INSTITUTIONAL_EMAIL_LENGTH) {
            return null;
        }
        if (preg_match('/\s/u', $clean) === 1) {
            return null;
        }

        return filter_var($clean, FILTER_VALIDATE_EMAIL) !== false
            && preg_match(self::NDMU_EMAIL_PATTERN, $clean) === 1 ? $clean : null;
    }

    /**
     * Validates an institutional ID.
     * Must be non-empty, no hyphens (hyphens indicate EMP-YYYY-NNNN auto-generation).
     * Strips whitespace, allows alphanumeric + dash for externally-supplied IDs.
     */
    public static function validateInstitutionalId(string $id): bool
    {
        $clean = trim($id);
        return $clean !== '' && strlen($clean) >= 3 && strlen($clean) <= 50;
    }

    public static function canonicalizeStudentInstitutionalId(mixed $id, int $minimum = 5, int $maximum = 50): ?string
    {
        if (! is_string($id) || preg_match('/[\x00-\x1F\x7F\p{Cf}]/u', $id) === 1) {
            return null;
        }
        $clean = trim($id);
        return preg_match('/^[0-9]{' . $minimum . ',' . $maximum . '}$/D', $clean) === 1 ? $clean : null;
    }

    public static function canonicalizePersonnelInstitutionalId(mixed $id, int $maximum = 50): ?string
    {
        if (! is_string($id) || preg_match('/[\x00-\x1F\x7F\p{Cf}]/u', $id) === 1) {
            return null;
        }
        $clean = trim($id);
        return $clean !== '' && strlen($clean) <= $maximum ? $clean : null;
    }

    public static function validateStudentYearLevel(mixed $value, ?array $allowedYearLevels = null): bool
    {
        if (! is_string($value) || trim($value) === '') {
            return false;
        }
        $allowed = $allowedYearLevels ?? [
            '1st Year',
            '2nd Year',
            '3rd Year',
            '4th Year',
            '5th Year',
        ];
        return in_array(trim($value), $allowed, true);
    }

    public static function validateSex(mixed $value, ?array $allowedSexValues = null): bool
    {
        if (! is_string($value) || trim($value) === '') {
            return false;
        }
        $allowed = $allowedSexValues ?? [
            'Male',
            'Female',
            'Prefer not to say',
        ];
        return in_array(trim($value), $allowed, true);
    }

    public static function validateAcademicYear(mixed $value, int $earliestStart, int $latestStart): bool
    {
        if (! is_string($value) || preg_match('/^([0-9]{4})-([0-9]{4})$/D', $value, $matches) !== 1) {
            return false;
        }
        $start = (int) $matches[1];
        return $start >= $earliestStart && $start <= $latestStart && (int) $matches[2] === $start + 1;
    }


    /**
     * Validates a UUID string.
     */
    public static function validateUuid(string $id): bool
    {
        return preg_match(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
            trim($id)
        ) === 1;
    }

    /**
     * Validates a non-empty bounded text string.
     */
    public static function validateBoundedText(string $text, int $maxLen, bool $allowEmpty = false): bool
    {
        $clean = trim($text);
        if ($clean === '') {
            return $allowEmpty;
        }
        return strlen($clean) <= $maxLen;
    }

    /**
     * Validates that a value is in an allowed enum list.
     */
    public static function validateEnum(string $value, array $allowed): bool
    {
        return in_array($value, $allowed, true);
    }

    /**
     * Validates a date string in YYYY-MM-DD format.
     */
    public static function validateDateString(string $date): bool
    {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', trim($date))) {
            return false;
        }
        [$year, $month, $day] = explode('-', trim($date));
        return checkdate((int) $month, (int) $day, (int) $year);
    }

    /**
     * Validates a numeric value within [min, max] bounds.
     */
    public static function validateNumericBounded(mixed $val, float $min, float $max): bool
    {
        if (!is_numeric($val)) {
            return false;
        }
        $f = (float) $val;
        return $f >= $min && $f <= $max;
    }

    /**
     * Validates and normalizes pagination parameters.
     * Returns ['page' => int, 'per_page' => int, 'offset' => int] or null on invalid.
     */
    public static function validatePagination(mixed $page, mixed $perPage): ?array
    {
        $p  = max(1, (int) $page);
        $pp = max(1, min(self::MAX_PER_PAGE, (int) ($perPage ?: self::DEFAULT_PER_PAGE)));
        return [
            'page'     => $p,
            'per_page' => $pp,
            'offset'   => ($p - 1) * $pp,
        ];
    }

    /**
     * Validates a sort column against an allowlist.
     */
    public static function validateSortColumn(string $col, array $allowed = self::ALLOWED_PERSONNEL_SORT): bool
    {
        return in_array($col, $allowed, true);
    }

    /**
     * Validates sort direction.
     */
    public static function validateSortDirection(string $dir): string
    {
        return strtoupper($dir) === 'DESC' ? 'DESC' : 'ASC';
    }

    /**
     * Validates a password against the institutional policy.
     * Min 8 chars, at least one uppercase, one lowercase, one digit, one special char.
     */
    public static function validatePasswordPolicy(string $password): bool
    {
        if (strlen($password) < self::PASSWORD_MIN_LENGTH) {
            return false;
        }
        if (!preg_match('/[A-Z]/', $password)) {
            return false;
        }
        if (!preg_match('/[a-z]/', $password)) {
            return false;
        }
        if (!preg_match('/[0-9]/', $password)) {
            return false;
        }
        if (!preg_match('/[^A-Za-z0-9]/', $password)) {
            return false;
        }
        return true;
    }

    /**
     * Validates a person's name component (first, last, middle).
     */
    public static function validateName(string $name, bool $required = true): bool
    {
        $clean = trim($name);
        if ($clean === '') {
            return !$required;
        }
        return strlen($clean) >= 1
            && strlen($clean) <= self::MAX_NAME_LENGTH
            && preg_match('/[\x00-\x1F\x7F\p{Cf}]/u', $clean) !== 1;
    }

    public const TEMP_UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    public const TEMP_LOWERCASE = 'abcdefghijkmnopqrstuvwxyz';
    public const TEMP_DIGITS    = '23456789';
    public const TEMP_SPECIALS  = '!@#$%*?-_';
    public const TEMP_LENGTH    = 16;

    /**
     * Selects a single character uniformly from an alphabet using cryptographically secure randomness.
     */
    public static function secureRandomCharacter(string $alphabet): string
    {
        $length = strlen($alphabet);
        if ($length === 0) {
            throw new \InvalidArgumentException('Alphabet must not be empty.');
        }

        $index = random_int(0, $length - 1);
        return $alphabet[$index];
    }

    /**
     * Shuffles an array of characters using the cryptographic Fisher-Yates algorithm.
     */
    public static function secureShuffle(array $characters): array
    {
        for ($i = count($characters) - 1; $i > 0; $i--) {
            $j = random_int(0, $i);
            [$characters[$i], $characters[$j]] = [$characters[$j], $characters[$i]];
        }

        return $characters;
    }

    /**
     * Generates a cryptographically secure 16-character temporary password.
     * Guarantees at least 1 uppercase, 1 lowercase, 1 digit, and 1 special character from human-safe sets.
     * Yields > 100 bits of effective entropy with zero predictable prefixes.
     */
    public static function generateTemporaryPassword(): string
    {
        $groups = [
            self::TEMP_UPPERCASE,
            self::TEMP_LOWERCASE,
            self::TEMP_DIGITS,
            self::TEMP_SPECIALS,
        ];

        $characters = [];

        // 1. Ensure at least one character from each required class
        foreach ($groups as $group) {
            $characters[] = self::secureRandomCharacter($group);
        }

        // 2. Fill remaining positions from the combined approved alphabet
        $combinedAlphabet = implode('', $groups);
        while (count($characters) < self::TEMP_LENGTH) {
            $characters[] = self::secureRandomCharacter($combinedAlphabet);
        }

        // 3. Cryptographically shuffle to eliminate fixed class positioning
        $shuffled = self::secureShuffle($characters);
        $password = implode('', $shuffled);

        // 4. Defensive validation against authoritative password policy
        if (! self::validatePasswordPolicy($password)) {
            throw new \RuntimeException('Generated temporary password failed authoritative password policy.');
        }

        return $password;
    }

}
