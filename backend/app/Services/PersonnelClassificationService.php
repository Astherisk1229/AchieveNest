<?php

namespace App\Services;

use InvalidArgumentException;

/**
 * PersonnelClassificationService
 *
 * Plan D — Phase D1: Canonical Personnel Classification Domain Service.
 * Validates, normalizes, and resolves the 3 authorized Personnel Group + Organizational Side combinations.
 */
class PersonnelClassificationService
{
    public const GROUP_FACULTY = 'faculty';
    public const GROUP_NON_TEACHING_FACULTY = 'non_teaching_faculty';

    public const SIDE_ACADEMIC = 'academic';
    public const SIDE_NON_ACADEMIC = 'non_academic';

    public const CODE_FACULTY_ACADEMIC = 'FACULTY_ACADEMIC';
    public const CODE_NON_TEACHING_FACULTY_ACADEMIC = 'NON_TEACHING_FACULTY_ACADEMIC';
    public const CODE_NON_TEACHING_FACULTY_NON_ACADEMIC = 'NON_TEACHING_FACULTY_NON_ACADEMIC';

    /**
     * Valid classification pair matrix.
     */
    public const VALID_PAIRS = [
        self::GROUP_FACULTY => [
            self::SIDE_ACADEMIC => self::CODE_FACULTY_ACADEMIC,
        ],
        self::GROUP_NON_TEACHING_FACULTY => [
            self::SIDE_ACADEMIC     => self::CODE_NON_TEACHING_FACULTY_ACADEMIC,
            self::SIDE_NON_ACADEMIC => self::CODE_NON_TEACHING_FACULTY_NON_ACADEMIC,
        ],
    ];

    /**
     * Normalizes and validates a (personnel_group, organizational_side) pair.
     *
     * @param string|null $group
     * @param string|null $side
     * @return array { valid: bool, group: string, side: string, code: string, label: string, error?: array }
     */
    public function validatePair(?string $group, ?string $side): array
    {
        $normGroup = strtolower(trim((string) $group));
        $normSide = strtolower(trim((string) $side));

        // Legacy normalization fallbacks
        if ($normGroup === 'teaching_faculty' || $normGroup === 'teaching') {
            $normGroup = self::GROUP_FACULTY;
        } elseif ($normGroup === 'non_teaching' || $normGroup === 'non_teaching_personnel' || $normGroup === 'staff') {
            $normGroup = self::GROUP_NON_TEACHING_FACULTY;
        }

        if ($normSide === 'acad') {
            $normSide = self::SIDE_ACADEMIC;
        } elseif ($normSide === 'non_acad' || $normSide === 'administrative') {
            $normSide = self::SIDE_NON_ACADEMIC;
        }

        // Check group validity
        if (! in_array($normGroup, [self::GROUP_FACULTY, self::GROUP_NON_TEACHING_FACULTY], true)) {
            return [
                'valid' => false,
                'error' => [
                    'code'    => 'INVALID_PERSONNEL_CLASSIFICATION',
                    'message' => "Invalid personnel_group: '{$group}'. Allowed values are: 'faculty', 'non_teaching_faculty'.",
                ],
            ];
        }

        // Check side validity
        if (! in_array($normSide, [self::SIDE_ACADEMIC, self::SIDE_NON_ACADEMIC], true)) {
            return [
                'valid' => false,
                'error' => [
                    'code'    => 'INVALID_PERSONNEL_CLASSIFICATION',
                    'message' => "Invalid organizational_side: '{$side}'. Allowed values are: 'academic', 'non_academic'.",
                ],
            ];
        }

        // Check pair validity
        if (! isset(self::VALID_PAIRS[$normGroup][$normSide])) {
            return [
                'valid' => false,
                'error' => [
                    'code'    => 'INVALID_PERSONNEL_CLASSIFICATION',
                    'message' => "Invalid classification combination: Group '{$normGroup}' cannot be paired with Side '{$normSide}'. Faculty must be Academic.",
                ],
            ];
        }

        $code = self::VALID_PAIRS[$normGroup][$normSide];
        $label = match ($code) {
            self::CODE_FACULTY_ACADEMIC                     => 'Faculty (Academic)',
            self::CODE_NON_TEACHING_FACULTY_ACADEMIC         => 'Non-Teaching Faculty (Academic)',
            self::CODE_NON_TEACHING_FACULTY_NON_ACADEMIC     => 'Non-Teaching Faculty (Non-Academic)',
            default                                         => 'Personnel',
        };

        return [
            'valid' => true,
            'group' => $normGroup,
            'side'  => $normSide,
            'code'  => $code,
            'label' => $label,
        ];
    }

    /**
     * Resolves classification details from an existing database record.
     */
    public function resolveFromRecord(array $row): array
    {
        $group = $row['personnel_group'] ?? null;
        $side = $row['organizational_side'] ?? null;
        $legacy = $row['personnel_classification'] ?? null;

        if (empty($group) || empty($side)) {
            if ($legacy === 'academic') {
                $group = self::GROUP_FACULTY;
                $side = self::SIDE_ACADEMIC;
            } else {
                $group = self::GROUP_NON_TEACHING_FACULTY;
                $side = self::SIDE_NON_ACADEMIC;
            }
        }

        $result = $this->validatePair($group, $side);
        if ($result['valid']) {
            return $result;
        }

        return [
            'valid' => true,
            'group' => self::GROUP_NON_TEACHING_FACULTY,
            'side'  => self::SIDE_NON_ACADEMIC,
            'code'  => self::CODE_NON_TEACHING_FACULTY_NON_ACADEMIC,
            'label' => 'Non-Teaching Faculty (Non-Academic)',
        ];
    }
}
