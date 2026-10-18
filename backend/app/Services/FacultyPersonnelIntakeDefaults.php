<?php

namespace App\Services;

/**
 * Compatibility defaults for the established Teaching Faculty entry forms.
 * HR's published hierarchy remains authoritative for whether a criterion is
 * active; these keys only validate legacy form payloads when no field schema
 * was saved on that published criterion.
 */
final class FacultyPersonnelIntakeDefaults
{
    private const REQUIRED_FIELDS = [
        'A.1.1' => ['degree_title', 'institution'],
        'A1_PHD_HOLDER' => ['degree_title', 'institution'],
        'A.1.2' => ['units_completed', 'program', 'institution', 'semester', 'academic_year'],
        'A1_PHD_UNITS' => ['units_completed', 'program', 'institution', 'semester', 'academic_year'],
        'A.1.3' => ['degree_title', 'institution'],
        'A1_MA_HOLDER' => ['degree_title', 'institution'],
        'A.1.4' => ['units_completed', 'program', 'institution', 'semester', 'academic_year'],
        'A1_MA_UNITS' => ['units_completed', 'program', 'institution', 'semester', 'academic_year'],
        'A.2.1' => ['organization', 'organizer', 'membership_role'],
        'A.2.2' => ['organization', 'organizer', 'membership_role'],
        'A2_MEMBERSHIP' => ['organization', 'organizer', 'membership_role'],
        'A.3.1' => ['title', 'organizer', 'scope'],
        'A3_ATTENDANCE' => ['title', 'organizer', 'scope'],
        'B.1.1' => ['activity_title', 'organizer', 'role', 'extent', 'scope'],
        'B1_ACTIVITY' => ['activity_title', 'organizer', 'role', 'extent', 'scope'],
        'B.2.1' => ['publication_title', 'publication_type', 'scope'],
        'B2_PUBLICATION' => ['publication_title', 'publication_type', 'scope'],
        'B.3.1' => ['research_title'],
        'B3_RESEARCH' => ['research_title'],
        'B.4.1' => ['award_title', 'recognition_status', 'scope'],
        'B4_AWARD' => ['award_title', 'recognition_status', 'scope'],
        'B.5.1' => ['material_title', 'material_type'],
        'B5_MATERIAL' => ['material_title', 'material_type'],
        'B.6.1' => ['creative_work', 'creative_work_type', 'presenting_body'],
        'B6_CREATIVE_WORK' => ['creative_work', 'creative_work_type', 'presenting_body'],
        'C.1.1' => ['organization', 'role', 'organizer'],
        'C1_MODERATOR' => ['organization', 'role', 'organizer'],
        'C.1.2' => ['activity', 'role', 'organizer'],
        'C1_COACH' => ['activity', 'role', 'organizer'],
        'C.1.3' => ['activity', 'role', 'organizer'],
        'C1_COMMITTEE' => ['activity', 'role', 'organizer'],
        'C.1.4' => ['activity', 'role', 'organizer'],
        'C1_SERVICE' => ['activity', 'role', 'organizer'],
        'C.2.1' => ['activity', 'organizer', 'role'],
        'C2_CHURCH' => ['activity', 'organizer', 'role'],
        'C.2.2' => ['activity', 'organizer', 'role'],
        'C2_CIVIC' => ['activity', 'organizer', 'role'],
        'C.2.3' => ['activity', 'organizer', 'support_type'],
        'C2_CHARITY' => ['activity', 'organizer', 'support_type'],
    ];

    /** The submitted hierarchy is already the published, group-specific source. */
    public static function apply(array $hierarchy): array
    {
        return $hierarchy;
    }

    /** Return the legacy form's required detail keys for a criterion code. */
    public static function requiredFields(string $code): array
    {
        $rawCode = strtoupper(trim($code));
        if (isset(self::REQUIRED_FIELDS[$rawCode])) return self::REQUIRED_FIELDS[$rawCode];
        $code = str_replace('_', '.', $rawCode);
        $aliases = [
            'A.1.PHD.HOLDER' => 'A1_PHD_HOLDER',
            'A.1.PHD.UNITS' => 'A1_PHD_UNITS',
            'A.1.MA.HOLDER' => 'A1_MA_HOLDER',
            'A.1.MA.UNITS' => 'A1_MA_UNITS',
            'A.2.MEMBERSHIP' => 'A2_MEMBERSHIP',
            'A.3.ATTENDANCE' => 'A3_ATTENDANCE',
            'B.1.ACTIVITY' => 'B1_ACTIVITY',
            'B.2.PUBLICATION' => 'B2_PUBLICATION',
            'B.3.RESEARCH' => 'B3_RESEARCH',
            'B.4.AWARD' => 'B4_AWARD',
            'B.5.MATERIAL' => 'B5_MATERIAL',
            'B.6.CREATIVE.WORK' => 'B6_CREATIVE_WORK',
            'C.1.MODERATOR' => 'C1_MODERATOR',
            'C.1.COACH' => 'C1_COACH',
            'C.1.COMMITTEE' => 'C1_COMMITTEE',
            'C.1.SERVICE' => 'C1_SERVICE',
            'C.2.CHURCH' => 'C2_CHURCH',
            'C.2.CIVIC' => 'C2_CIVIC',
            'C.2.CHARITY' => 'C2_CHARITY',
        ];
        $key = $aliases[$code] ?? $code;
        return self::REQUIRED_FIELDS[$key] ?? [];
    }
}
