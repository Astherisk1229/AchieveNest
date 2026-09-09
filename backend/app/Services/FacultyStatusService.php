<?php

namespace App\Services;

/**
 * FacultyStatusService
 *
 * Plan D — Phase D2: Faculty Status & Master Data Domain Service.
 * Canonical authority for faculty engagement, employment status,
 * position title, rank title, and downstream master data contracts.
 */
class FacultyStatusService
{
    public const ENGAGEMENT_FULL_TIME = 'full_time_faculty';
    public const ENGAGEMENT_PART_TIME = 'part_time_faculty';

    public const EMPLOYMENT_PERMANENT   = 'permanent';
    public const EMPLOYMENT_PROBATIONARY = 'probationary';

    public const CANONICAL_ENGAGEMENTS = [
        self::ENGAGEMENT_FULL_TIME => 'Full-time Faculty',
        self::ENGAGEMENT_PART_TIME => 'Part-time Faculty',
    ];

    public const CANONICAL_EMPLOYMENT_STATUSES = [
        self::EMPLOYMENT_PERMANENT   => 'Permanent',
        self::EMPLOYMENT_PROBATIONARY => 'Probationary',
    ];

    /**
     * Validates faculty engagement value.
     */
    public function validateEngagement(?string $engagement, bool $isRequired = false): array
    {
        if ($engagement === null || trim($engagement) === '') {
            if ($isRequired) {
                return [
                    'valid' => false,
                    'error' => [
                        'code'    => 'INVALID_FACULTY_ENGAGEMENT',
                        'message' => 'Faculty engagement is required.',
                    ],
                ];
            }
            return ['valid' => true, 'engagement' => null, 'label' => null];
        }

        $normalized = strtolower(trim($engagement));

        // Accept user-friendly labels or canonical codes
        if ($normalized === 'full_time' || $normalized === 'full-time' || $normalized === 'full-time faculty' || $normalized === 'full_time_faculty') {
            $canonical = self::ENGAGEMENT_FULL_TIME;
        } elseif ($normalized === 'part_time' || $normalized === 'part-time' || $normalized === 'part-time faculty' || $normalized === 'part_time_faculty') {
            $canonical = self::ENGAGEMENT_PART_TIME;
        } else {
            return [
                'valid' => false,
                'error' => [
                    'code'    => 'INVALID_FACULTY_ENGAGEMENT',
                    'message' => 'Faculty engagement must be either Full-time Faculty (full_time_faculty) or Part-time Faculty (part_time_faculty).',
                ],
            ];
        }

        return [
            'valid'      => true,
            'engagement' => $canonical,
            'label'      => self::CANONICAL_ENGAGEMENTS[$canonical],
        ];
    }

    /**
     * Validates employment status value (Permanent vs Probationary).
     */
    public function validateEmploymentStatus(?string $status, bool $isRequired = true): array
    {
        if ($status === null || trim($status) === '') {
            if ($isRequired) {
                return [
                    'valid' => false,
                    'error' => [
                        'code'    => 'INVALID_EMPLOYMENT_STATUS',
                        'message' => 'Employment status is required.',
                    ],
                ];
            }
            return ['valid' => true, 'status' => null, 'label' => null];
        }

        $normalized = strtolower(trim($status));

        if ($normalized === 'permanent') {
            $canonical = self::EMPLOYMENT_PERMANENT;
        } elseif ($normalized === 'probationary') {
            $canonical = self::EMPLOYMENT_PROBATIONARY;
        } else {
            return [
                'valid' => false,
                'error' => [
                    'code'    => 'INVALID_EMPLOYMENT_STATUS',
                    'message' => 'Employment status must be either Permanent (permanent) or Probationary (probationary).',
                ],
            ];
        }

        return [
            'valid'  => true,
            'status' => $canonical,
            'label'  => self::CANONICAL_EMPLOYMENT_STATUSES[$canonical],
        ];
    }

    /**
     * Validates the complete master data update payload.
     */
    public function validateMasterDataPayload(array $payload): array
    {
        $errors = [];

        // 1. Faculty Engagement
        $engagementValidation = $this->validateEngagement($payload['faculty_engagement'] ?? null, false);
        if (! $engagementValidation['valid']) {
            return ['valid' => false, 'error' => $engagementValidation['error']];
        }

        // 2. Employment Status
        $statusValidation = $this->validateEmploymentStatus($payload['employment_status'] ?? null, true);
        if (! $statusValidation['valid']) {
            return ['valid' => false, 'error' => $statusValidation['error']];
        }

        // 3. Position Title
        $positionTitle = isset($payload['position_title']) ? trim((string) $payload['position_title']) : null;
        if ($positionTitle !== null && mb_strlen($positionTitle) > 150) {
            return [
                'valid' => false,
                'error' => [
                    'code'    => 'INVALID_POSITION_TITLE',
                    'message' => 'Position title must not exceed 150 characters.',
                ],
            ];
        }

        // 4. Current Rank Title
        $rankTitle = isset($payload['current_rank_title']) ? trim((string) $payload['current_rank_title']) : (isset($payload['academic_rank']) ? trim((string) $payload['academic_rank']) : null);
        if ($rankTitle !== null && mb_strlen($rankTitle) > 100) {
            return [
                'valid' => false,
                'error' => [
                    'code'    => 'INVALID_RANK_TITLE',
                    'message' => 'Rank title must not exceed 100 characters.',
                ],
            ];
        }

        // Rank / Title Catalog Crossover Check
        if ($rankTitle !== null && $rankTitle !== '' && $rankTitle !== 'Faculty Member') {
            $ptTitles = [
                'professorial lecturer',
                'assistant professorial lecturer',
                'senior lecturer',
                'lecturer',
                'pt_professorial_lecturer',
                'pt_assistant_professorial_lecturer',
                'pt_senior_lecturer',
                'pt_lecturer'
            ];
            $normalizedRank = strtolower($rankTitle);
            $isPartTimeTitle = in_array($normalizedRank, $ptTitles, true);

            $effectiveEngagement = $engagementValidation['engagement'] ?? null;
            if ($effectiveEngagement === self::ENGAGEMENT_FULL_TIME && $isPartTimeTitle) {
                return [
                    'valid' => false,
                    'error' => [
                        'code'    => 'CATALOG_CROSSOVER_REJECTED',
                        'message' => 'Part-Time faculty title cannot be assigned to Full-Time faculty.',
                    ],
                ];
            }
            if ($effectiveEngagement === self::ENGAGEMENT_PART_TIME && ! $isPartTimeTitle) {
                return [
                    'valid' => false,
                    'error' => [
                        'code'    => 'CATALOG_CROSSOVER_REJECTED',
                        'message' => 'Full-Time academic rank cannot be assigned to Part-Time faculty. Only Part-Time titles are allowed.',
                    ],
                ];
            }
        }

        // 5. Qualification Summary
        $qualSummary = isset($payload['qualification_summary']) ? trim((string) $payload['qualification_summary']) : null;
        if ($qualSummary !== null && mb_strlen($qualSummary) > 255) {
            return [
                'valid' => false,
                'error' => [
                    'code'    => 'INVALID_QUALIFICATION_SUMMARY',
                    'message' => 'Qualification summary must not exceed 255 characters.',
                ],
            ];
        }

        return [
            'valid'                 => true,
            'faculty_engagement'    => $engagementValidation['engagement'],
            'faculty_engagement_label' => $engagementValidation['label'],
            'employment_status'     => $statusValidation['status'],
            'employment_status_label' => $statusValidation['label'],
            'position_title'        => $positionTitle ?: 'Faculty Member',
            'current_rank_title'    => $rankTitle ?: 'Faculty Member',
            'qualification_summary' => $qualSummary ?: 'Bachelor Degree / Masteral Units',
        ];
    }

    /**
     * Builds canonical server-derived downstream DTO for later modules (Plan D1 companion, F1, Plan C).
     */
    public function buildMasterDataDto(array $row): array
    {
        $engagement = $row['faculty_engagement'] ?? null;
        $status     = $row['employment_status'] ?? 'permanent';
        $group      = $row['personnel_group'] ?? 'faculty';
        $side       = $row['organizational_side'] ?? 'academic';

        $engagementLabel = $engagement ? (self::CANONICAL_ENGAGEMENTS[$engagement] ?? $engagement) : 'Unassigned';
        $statusLabel     = self::CANONICAL_EMPLOYMENT_STATUSES[$status] ?? ucfirst($status);

        $isFullTime = ($engagement === self::ENGAGEMENT_FULL_TIME);
        $isActive   = (($row['status'] ?? 'active') === 'active');
        $isAcademic = ($side === 'academic');

        // Dean review & evaluation eligibility derivation
        $isDeanReviewEligible = ($isAcademic && $isFullTime && $isActive);

        return [
            'profile_id'               => $row['id'] ?? $row['profile_id'],
            'personnel_group'          => $group,
            'organizational_side'      => $side,
            'faculty_engagement'       => $engagement,
            'faculty_engagement_label' => $engagementLabel,
            'employment_status'        => $status,
            'employment_status_label'  => $statusLabel,
            'college_id'               => $row['college_id'] ?? null,
            'college_code'             => $row['college_code'] ?? null,
            'college_name'             => $row['college_name'] ?? null,
            'administrative_unit_id'   => $row['administrative_unit_id'] ?? null,
            'administrative_unit_code' => $row['administrative_unit_code'] ?? null,
            'administrative_unit_name' => $row['administrative_unit_name'] ?? null,
            'position_title'           => $row['position_title'] ?? ($row['designation'] ?? 'Faculty Member'),
            'current_rank_title'       => $row['current_rank_title'] ?? ($row['rank_level'] ?? ($row['academic_rank'] ?? 'Faculty Member')),
            'qualification_summary'    => $row['qualification_summary'] ?? 'Bachelor Degree / Masteral Units',
            'is_dean_review_eligible'  => $isDeanReviewEligible,
        ];
    }
}
