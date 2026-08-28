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
    public const NDMU_EMAIL_PATTERN = '/^[^@\s]+@ndmu\.edu\.ph$/i';

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
        $clean = strtolower(trim($email));
        return $clean !== '' && preg_match(self::NDMU_EMAIL_PATTERN, $clean) === 1;
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
        return strlen($clean) >= 1 && strlen($clean) <= self::MAX_NAME_LENGTH;
    }

    /**
     * Generates a cryptographically secure temporary password.
     * Format: Ndmu#<8-hex-chars>  — satisfies policy: upper, lower, digit, special.
     */
    public static function generateTemporaryPassword(): string
    {
        return 'Ndmu#' . bin2hex(random_bytes(4));
    }

    /**
     * Validates an academic year string (e.g. "2025-2026").
     */
    public static function validateAcademicYear(string $year): bool
    {
        if (!preg_match('/^(\d{4})-(\d{4})$/', trim($year), $m)) {
            return false;
        }
        return ((int) $m[2]) === ((int) $m[1] + 1);
    }
}
