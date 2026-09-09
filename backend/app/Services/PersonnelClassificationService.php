<?php

namespace App\Services;

use InvalidArgumentException;

/**
 * PersonnelClassificationService
 *
 * Plan D — Phase D1 & Plan K — Phase K4 Remediation:
 * Canonical Personnel Classification Domain Service.
 * Validates active two-group pairs, normalizes canonical sides, and reconciles legacy records
 * based strictly on authoritative institutional placement evidence.
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

    public const REASON_CANONICAL_ACTIVE = 'CANONICAL_ACTIVE';
    public const REASON_LEGACY_MAPPING_SUPPORTED_BY_COLLEGE = 'LEGACY_MAPPING_SUPPORTED_BY_COLLEGE';
    public const REASON_LEGACY_MAPPING_SUPPORTED_BY_ADMIN_UNIT = 'LEGACY_MAPPING_SUPPORTED_BY_ADMIN_UNIT';
    public const REASON_LEGACY_MAPPING_AMBIGUOUS_NO_PLACEMENT = 'LEGACY_MAPPING_AMBIGUOUS_NO_PLACEMENT';
    public const REASON_LEGACY_MAPPING_CONFLICTING_PLACEMENT = 'LEGACY_MAPPING_CONFLICTING_PLACEMENT';

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
     * Normalizes and validates an active (personnel_group, organizational_side) pair.
     * Legacy groups like 'non_teaching_personnel' are strictly rejected here.
     *
     * @param string|null $group
     * @param string|null $side
     * @return array { valid: bool, group: string, side: string, code: string, label: string, error?: array }
     */
    public function validatePair(?string $group, ?string $side): array
    {
        $normGroup = strtolower(trim((string) $group));
        $normSide = strtolower(trim((string) $side));

        // Teaching synonyms
        if ($normGroup === 'teaching_faculty' || $normGroup === 'teaching') {
            $normGroup = self::GROUP_FACULTY;
        }

        // Side synonyms
        if ($normSide === 'acad') {
            $normSide = self::SIDE_ACADEMIC;
        } elseif ($normSide === 'non_acad' || $normSide === 'administrative') {
            $normSide = self::SIDE_NON_ACADEMIC;
        }

        // Check active canonical group validity (two-group model only)
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
     * Resolves authoritative placement evidence for legacy records.
     * Legacy 'non_teaching_personnel' maps to 'non_teaching_faculty' ONLY when authoritative
     * institutional assignment proves the side.
     *
     * @param array $row
     * @return array
     */
    public function resolveLegacyPlacement(array $row): array
    {
        $collegeId = ! empty($row['college_id']) ? (string) $row['college_id'] : null;
        $adminUnitId = ! empty($row['administrative_unit_id']) ? (string) $row['administrative_unit_id'] : null;

        // Conflicting placement: Both College and Administrative Unit present
        if (! empty($collegeId) && ! empty($adminUnitId)) {
            return [
                'valid'                  => false,
                'status'                 => 'conflicting',
                'unresolved'             => true,
                'personnel_group'        => null,
                'organizational_side'    => null,
                'code'                   => null,
                'label'                  => 'Unresolved — Conflicting Placement',
                'college_id'             => $collegeId,
                'administrative_unit_id' => $adminUnitId,
                'reason_code'            => self::REASON_LEGACY_MAPPING_CONFLICTING_PLACEMENT,
                'message'                => 'Legacy record contains conflicting College and Administrative Unit assignments.',
            ];
        }

        // Supported by College assignment -> Academic
        if (! empty($collegeId)) {
            return [
                'valid'                  => true,
                'status'                 => 'supported',
                'unresolved'             => false,
                'personnel_group'        => self::GROUP_NON_TEACHING_FACULTY,
                'organizational_side'    => self::SIDE_ACADEMIC,
                'code'                   => self::CODE_NON_TEACHING_FACULTY_ACADEMIC,
                'label'                  => 'Non-Teaching Faculty (Academic)',
                'college_id'             => $collegeId,
                'administrative_unit_id' => null,
                'reason_code'            => self::REASON_LEGACY_MAPPING_SUPPORTED_BY_COLLEGE,
            ];
        }

        // Supported by Administrative Unit assignment -> Non-Academic
        if (! empty($adminUnitId)) {
            return [
                'valid'                  => true,
                'status'                 => 'supported',
                'unresolved'             => false,
                'personnel_group'        => self::GROUP_NON_TEACHING_FACULTY,
                'organizational_side'    => self::SIDE_NON_ACADEMIC,
                'code'                   => self::CODE_NON_TEACHING_FACULTY_NON_ACADEMIC,
                'label'                  => 'Non-Teaching Faculty (Non-Academic)',
                'college_id'             => null,
                'administrative_unit_id' => $adminUnitId,
                'reason_code'            => self::REASON_LEGACY_MAPPING_SUPPORTED_BY_ADMIN_UNIT,
            ];
        }

        // Ambiguous: No placement evidence
        return [
            'valid'                  => false,
            'status'                 => 'ambiguous',
            'unresolved'             => true,
            'personnel_group'        => null,
            'organizational_side'    => null,
            'code'                   => null,
            'label'                  => 'Unresolved — Ambiguous Placement',
            'college_id'             => null,
            'administrative_unit_id' => null,
            'reason_code'            => self::REASON_LEGACY_MAPPING_AMBIGUOUS_NO_PLACEMENT,
            'message'                => 'Legacy record lacks authoritative College or Administrative Unit assignment.',
        ];
    }

    /**
     * Resolves classification details from an existing database record.
     * Evaluates canonical fields first, and routes legacy records through placement reconciliation.
     *
     * @param array $row
     * @return array
     */
    public function resolveFromRecord(array $row): array
    {
        $group = $row['personnel_group'] ?? null;
        $side = $row['organizational_side'] ?? null;
        $legacy = $row['personnel_classification'] ?? null;

        // If canonical active pair already exists and is valid
        if (! empty($group) && ! empty($side)) {
            $validation = $this->validatePair($group, $side);
            if ($validation['valid']) {
                $validation['status'] = 'canonical';
                $validation['reason_code'] = self::REASON_CANONICAL_ACTIVE;
                return $validation;
            }
        }

        // Explicit legacy 'academic' classification mapping
        if ($legacy === 'academic' || $group === 'faculty' || $group === 'teaching_faculty') {
            return [
                'valid'       => true,
                'status'      => 'supported',
                'unresolved'  => false,
                'group'       => self::GROUP_FACULTY,
                'side'        => self::SIDE_ACADEMIC,
                'code'        => self::CODE_FACULTY_ACADEMIC,
                'label'       => 'Faculty (Academic)',
                'reason_code' => self::REASON_CANONICAL_ACTIVE,
            ];
        }

        // Legacy third-group or legacy non_academic reconciliation through placement evidence
        $legacyPlacement = $this->resolveLegacyPlacement($row);
        if ($legacyPlacement['valid']) {
            return [
                'valid'                  => true,
                'status'                 => 'supported',
                'unresolved'             => false,
                'group'                  => $legacyPlacement['personnel_group'],
                'side'                   => $legacyPlacement['organizational_side'],
                'code'                   => $legacyPlacement['code'],
                'label'                  => $legacyPlacement['label'],
                'reason_code'            => $legacyPlacement['reason_code'],
                'college_id'             => $legacyPlacement['college_id'],
                'administrative_unit_id' => $legacyPlacement['administrative_unit_id'],
            ];
        }

        // Ambiguous / Conflicting legacy record stays unresolved
        return [
            'valid'                  => false,
            'status'                 => $legacyPlacement['status'],
            'unresolved'             => true,
            'group'                  => null,
            'side'                   => null,
            'code'                   => null,
            'label'                  => $legacyPlacement['label'],
            'reason_code'            => $legacyPlacement['reason_code'],
            'message'                => $legacyPlacement['message'],
            'college_id'             => $legacyPlacement['college_id'],
            'administrative_unit_id' => $legacyPlacement['administrative_unit_id'],
        ];
    }
}
