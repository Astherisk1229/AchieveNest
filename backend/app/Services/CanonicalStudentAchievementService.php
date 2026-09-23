<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;

final class CanonicalStudentAchievementService
{
    private const DETAIL_TABLE_BY_CATEGORY = [
        'LEADERSHIP_POSITION'
            => 'student_leadership_position_details',

        'ORG_MEMBERSHIP_PARTICIPATION'
            => 'student_organization_involvement_details',

        'COMMUNITY_SERVICE_VOLUNTEERISM'
            => 'student_service_details',

        'CHURCH_MINISTRY_INVOLVEMENT'
            => 'student_church_ministry_details',

        'SEMINAR_TRAINING'
            => 'student_seminar_training_details',

        'CITATION_RECOGNITION'
            => 'student_recognition_details',

        'SPORTS'
            => 'student_sports_details',

        'SOCIO_CULTURAL_PERFORMING_ARTS'
            => 'student_socio_cultural_details',

        'CAMPUS_JOURNALISM'
            => 'student_campus_journalism_details',
    ];

    public function __construct(
        private ?BaseConnection $db = null
    ) {
        $this->db ??= db_connect();
    }

    public function resolveContract(string $contractCode): array
    {
        $contractCode = strtoupper(trim($contractCode));

        if ($contractCode === '') {
            throw new RuntimeException(
                'STUDENT_ACHIEVEMENT_CONTRACT_CODE_REQUIRED'
            );
        }

        $rows = $this->db
            ->table('achievement_contracts')
            ->where('contract_code', $contractCode)
            ->where('domain', 'STUDENT')
            ->where('is_active', 1)
            ->get()
            ->getResultArray();

        if (count($rows) !== 1) {
            throw new RuntimeException(
                'STUDENT_ACHIEVEMENT_CONTRACT_NOT_FOUND'
            );
        }

        $contract = $rows[0];

        $categoryCode = strtoupper(
            trim((string) ($contract['category_code'] ?? ''))
        );

        $subcategoryCode = strtoupper(
            trim((string) ($contract['subcategory_code'] ?? ''))
        );

        if ($categoryCode === '' || $subcategoryCode === '') {
            throw new RuntimeException(
                'STUDENT_ACHIEVEMENT_CONTRACT_TAXONOMY_INCOMPLETE'
            );
        }

        if (! isset(self::DETAIL_TABLE_BY_CATEGORY[$categoryCode])) {
            throw new RuntimeException(
                'STUDENT_ACHIEVEMENT_DETAIL_FAMILY_UNSUPPORTED'
            );
        }

        return $contract;
    }

    public function detailTableForContract(string $contractCode): string
    {
        $contract = $this->resolveContract($contractCode);

        $categoryCode = strtoupper(
            trim((string) $contract['category_code'])
        );

        return self::DETAIL_TABLE_BY_CATEGORY[$categoryCode];
    }

    public function allowedDetailFields(string $contractCode): array
    {
        $table = $this->detailTableForContract($contractCode);

        if (! $this->db->tableExists($table)) {
            throw new RuntimeException(
                'STUDENT_ACHIEVEMENT_DETAIL_TABLE_MISSING'
            );
        }

        $fields = $this->db->getFieldNames($table);

        return array_values(
            array_filter(
                $fields,
                static fn (string $field): bool =>
                    $field !== 'record_version_id'
            )
        );
    }

    public function normalizeDetailPayload(
        string $contractCode,
        array $payload
    ): array {
        $contract = $this->resolveContract($contractCode);

        $allowedFields = $this->allowedDetailFields($contractCode);

        $unknownFields = array_values(
            array_diff(
                array_keys($payload),
                $allowedFields
            )
        );

        if ($unknownFields !== []) {
            sort($unknownFields);

            throw new RuntimeException(
                'STUDENT_ACHIEVEMENT_DETAIL_FIELD_NOT_ALLOWED:'
                . implode(',', $unknownFields)
            );
        }

        $normalized = [];

        foreach ($allowedFields as $field) {
            if (! array_key_exists($field, $payload)) {
                continue;
            }

            $normalized[$field] = $payload[$field];
        }

        $categoryCode = strtoupper(
            trim((string) $contract['category_code'])
        );

        if ($categoryCode === 'LEADERSHIP_POSITION') {
            $normalized = $this->validateLeadershipPayload(
                strtoupper(trim((string) $contract['contract_code'])),
                $normalized
            );
        } elseif ($categoryCode === 'ORG_MEMBERSHIP_PARTICIPATION') {
            $normalized = $this->validateOrganizationInvolvementPayload(
                strtoupper(trim((string) $contract['contract_code'])),
                $normalized
            );
        } elseif ($categoryCode === 'COMMUNITY_SERVICE_VOLUNTEERISM') {
            $normalized = $this->validateServicePayload(
                strtoupper(trim((string) $contract['contract_code'])),
                $normalized
            );
        } elseif ($categoryCode === 'CHURCH_MINISTRY_INVOLVEMENT') {
            $normalized = $this->validateChurchMinistryPayload(
                strtoupper(trim((string) $contract['contract_code'])),
                $normalized
            );
        } elseif ($categoryCode === 'SEMINAR_TRAINING') {
            $normalized = $this->validateSeminarTrainingPayload(
                strtoupper(trim((string) $contract['contract_code'])),
                $normalized
            );
        } elseif ($categoryCode === 'CITATION_RECOGNITION') {
            $normalized = $this->validateRecognitionPayload(
                strtoupper(trim((string) $contract['contract_code'])),
                $normalized
            );
        } elseif ($categoryCode === 'SPORTS') {
            $normalized = $this->validateSportsPayload(
                strtoupper(trim((string) $contract['contract_code'])),
                $normalized
            );
        }

        return $normalized;
    }

    private function validateLeadershipPayload(
        string $contractCode,
        array $payload
    ): array {
        $requiredTextFields = [
            'governing_body_name',
            'position_held',
        ];

        foreach ($requiredTextFields as $field) {
            if (
                ! array_key_exists($field, $payload)
                || trim((string) $payload[$field]) === ''
            ) {
                throw new RuntimeException(
                    'STUDENT_LEADERSHIP_REQUIRED_FIELD_MISSING:' . $field
                );
            }

            $payload[$field] = trim((string) $payload[$field]);
        }

        if (! array_key_exists('academic_year_start', $payload)) {
            throw new RuntimeException(
                'STUDENT_LEADERSHIP_REQUIRED_FIELD_MISSING:academic_year_start'
            );
        }

        $academicYearStart = filter_var(
            $payload['academic_year_start'],
            FILTER_VALIDATE_INT
        );

        if ($academicYearStart === false) {
            throw new RuntimeException(
                'STUDENT_LEADERSHIP_ACADEMIC_YEAR_INVALID'
            );
        }

        $payload['academic_year_start'] = $academicYearStart;

        $representedYearLevel = array_key_exists(
            'represented_year_level',
            $payload
        )
            ? trim((string) $payload['represented_year_level'])
            : '';

        if ($contractCode === 'S01-YEAR_LEVEL') {
            if ($representedYearLevel === '') {
                throw new RuntimeException(
                    'STUDENT_LEADERSHIP_YEAR_LEVEL_REQUIRED'
                );
            }

            $payload['represented_year_level'] = $representedYearLevel;
        } else {
            if ($representedYearLevel !== '') {
                throw new RuntimeException(
                    'STUDENT_LEADERSHIP_YEAR_LEVEL_NOT_ALLOWED'
                );
            }

            if (array_key_exists('represented_year_level', $payload)) {
                $payload['represented_year_level'] = null;
            }
        }

        if (array_key_exists('additional_notes', $payload)) {
            $notes = trim((string) $payload['additional_notes']);

            $payload['additional_notes'] = $notes !== ''
                ? $notes
                : null;
        }

        return $payload;
    }
    private function validateOrganizationInvolvementPayload(
        string $contractCode,
        array $payload
    ): array {
        $payload['organization_name'] = $this->requireNonBlankText(
            $payload,
            'organization_name',
            'STUDENT_ORGANIZATION_REQUIRED_FIELD_MISSING'
        );

        if (array_key_exists('additional_notes', $payload)) {
            $notes = trim((string) $payload['additional_notes']);

            $payload['additional_notes'] = $notes !== ''
                ? $notes
                : null;
        }

        switch ($contractCode) {
            case 'S02-GENERAL_MEMBER':
                $this->assertOrganizationContractFields(
                    $payload,
                    [
                        'organization_name',
                        'academic_year_start',
                        'additional_notes',
                    ]
                );

                $payload['academic_year_start']
                    = $this->requireIntegerField(
                        $payload,
                        'academic_year_start',
                        'STUDENT_ORGANIZATION_ACADEMIC_YEAR_REQUIRED',
                        'STUDENT_ORGANIZATION_ACADEMIC_YEAR_INVALID'
                    );

                break;

            case 'S02-COMMITTEE_MEMBER':
                $this->assertOrganizationContractFields(
                    $payload,
                    [
                        'organization_name',
                        'committee_name',
                        'related_activity_title',
                        'responsibility_assignment',
                        'academic_year_start',
                        'period_start_year',
                        'period_start_month',
                        'period_start_day',
                        'period_end_year',
                        'period_end_month',
                        'period_end_day',
                        'period_precision',
                        'source_period_text',
                        'additional_notes',
                    ]
                );

                $payload['committee_name'] = $this->requireNonBlankText(
                    $payload,
                    'committee_name',
                    'STUDENT_ORGANIZATION_REQUIRED_FIELD_MISSING'
                );

                $payload['academic_year_start']
                    = $this->requireIntegerField(
                        $payload,
                        'academic_year_start',
                        'STUDENT_ORGANIZATION_ACADEMIC_YEAR_REQUIRED',
                        'STUDENT_ORGANIZATION_ACADEMIC_YEAR_INVALID'
                    );

                if (array_key_exists(
                    'responsibility_assignment',
                    $payload
                )) {
                    $value = trim(
                        (string) $payload['responsibility_assignment']
                    );

                    $payload['responsibility_assignment']
                        = $value !== '' ? $value : null;
                }

                $relatedActivity = array_key_exists(
                    'related_activity_title',
                    $payload
                )
                    ? trim((string) $payload['related_activity_title'])
                    : '';

                foreach (
                    [
                        'period_start_year',
                        'period_start_month',
                        'period_start_day',
                        'period_end_year',
                        'period_end_month',
                        'period_end_day',
                        'period_precision',
                        'source_period_text',
                    ] as $field
                ) {
                    if (
                        array_key_exists($field, $payload)
                        && (
                            $payload[$field] === null
                            || trim((string) $payload[$field]) === ''
                        )
                    ) {
                        $payload[$field] = null;
                    }
                }

                $hasPeriod = $this->hasOrganizationPeriodData($payload);

                if ($relatedActivity !== '' || $hasPeriod) {
                    if ($relatedActivity === '') {
                        throw new RuntimeException(
                            'STUDENT_ORGANIZATION_RELATED_ACTIVITY_REQUIRED'
                        );
                    }

                    $payload['related_activity_title']
                        = $relatedActivity;

                    $payload = $this->validateOrganizationPeriod(
                        $payload,
                        true
                    );
                } elseif (
                    array_key_exists('related_activity_title', $payload)
                ) {
                    $payload['related_activity_title'] = null;
                }

                break;

            case 'S02-ACTIVITY_PARTICIPANT':
                $this->assertOrganizationContractFields(
                    $payload,
                    [
                        'organization_name',
                        'activity_program_title',
                        'activity_type',
                        'period_start_year',
                        'period_start_month',
                        'period_start_day',
                        'period_end_year',
                        'period_end_month',
                        'period_end_day',
                        'period_precision',
                        'source_period_text',
                        'additional_notes',
                    ]
                );

                $payload['activity_program_title']
                    = $this->requireNonBlankText(
                        $payload,
                        'activity_program_title',
                        'STUDENT_ORGANIZATION_REQUIRED_FIELD_MISSING'
                    );

                $payload['activity_type']
                    = $this->requireControlledValue(
                        $payload,
                        'activity_type',
                        [
                            'ORGANIZATION_ACTIVITY_PROGRAM',
                            'OUTREACH_EXTENSION',
                            'EXTRA_CURRICULAR',
                            'CO_CURRICULAR',
                        ],
                        'STUDENT_ORGANIZATION_ACTIVITY_TYPE_REQUIRED',
                        'STUDENT_ORGANIZATION_ACTIVITY_TYPE_INVALID'
                    );

                $payload = $this->validateOrganizationPeriod(
                    $payload,
                    true
                );

                break;

            case 'S02-FACILITATOR_ORGANIZER':
                $this->assertOrganizationContractFields(
                    $payload,
                    [
                        'organization_name',
                        'activity_program_title',
                        'activity_type',
                        'contribution_role',
                        'period_start_year',
                        'period_start_month',
                        'period_start_day',
                        'period_end_year',
                        'period_end_month',
                        'period_end_day',
                        'period_precision',
                        'source_period_text',
                        'additional_notes',
                    ]
                );

                $payload['activity_program_title']
                    = $this->requireNonBlankText(
                        $payload,
                        'activity_program_title',
                        'STUDENT_ORGANIZATION_REQUIRED_FIELD_MISSING'
                    );

                $payload['activity_type']
                    = $this->requireControlledValue(
                        $payload,
                        'activity_type',
                        [
                            'ORGANIZATION_ACTIVITY_PROGRAM',
                            'OUTREACH_EXTENSION',
                            'EXTRA_CURRICULAR',
                            'CO_CURRICULAR',
                        ],
                        'STUDENT_ORGANIZATION_ACTIVITY_TYPE_REQUIRED',
                        'STUDENT_ORGANIZATION_ACTIVITY_TYPE_INVALID'
                    );

                $payload['contribution_role']
                    = $this->requireControlledValue(
                        $payload,
                        'contribution_role',
                        [
                            'FACILITATOR',
                            'ORGANIZER',
                            'FACILITATOR_AND_ORGANIZER',
                        ],
                        'STUDENT_ORGANIZATION_CONTRIBUTION_ROLE_REQUIRED',
                        'STUDENT_ORGANIZATION_CONTRIBUTION_ROLE_INVALID'
                    );

                $payload = $this->validateOrganizationPeriod(
                    $payload,
                    true
                );

                break;

            case 'S02-PROJECT_CONTRIBUTOR':
                $this->assertOrganizationContractFields(
                    $payload,
                    [
                        'organization_name',
                        'project_initiative_title',
                        'contribution_type',
                        'contribution_description',
                        'period_start_year',
                        'period_start_month',
                        'period_start_day',
                        'period_end_year',
                        'period_end_month',
                        'period_end_day',
                        'period_precision',
                        'source_period_text',
                        'additional_notes',
                    ]
                );

                $payload['project_initiative_title']
                    = $this->requireNonBlankText(
                        $payload,
                        'project_initiative_title',
                        'STUDENT_ORGANIZATION_REQUIRED_FIELD_MISSING'
                    );

                $payload['contribution_type']
                    = $this->requireControlledValue(
                        $payload,
                        'contribution_type',
                        [
                            'CONTRIBUTOR_SUPPORT_ROLE',
                            'MAJOR_PROJECT_RESPONSIBILITY',
                        ],
                        'STUDENT_ORGANIZATION_CONTRIBUTION_TYPE_REQUIRED',
                        'STUDENT_ORGANIZATION_CONTRIBUTION_TYPE_INVALID'
                    );

                $payload['contribution_description']
                    = $this->requireNonBlankText(
                        $payload,
                        'contribution_description',
                        'STUDENT_ORGANIZATION_REQUIRED_FIELD_MISSING'
                    );

                $payload = $this->validateOrganizationPeriod(
                    $payload,
                    true
                );

                break;

            default:
                throw new RuntimeException(
                    'STUDENT_ORGANIZATION_CONTRACT_UNSUPPORTED'
                );
        }

        return $payload;
    }

    private function validateServicePayload(
        string $contractCode,
        array $payload
    ): array {
        $commonFields = [
            'service_activity_project_title',
            'activity_role',
            'period_start_year',
            'period_start_month',
            'period_start_day',
            'period_end_year',
            'period_end_month',
            'period_end_day',
            'period_precision',
            'service_hours',
            'additional_notes',
        ];

        $requiredContextFields = [];
        $optionalTextFields = [];
        $allowsCivicScope = false;

        switch ($contractCode) {
            case 'S03-UNIVERSITY_BASED_SERVICE':
                $allowedFields = array_merge(
                    $commonFields,
                    [
                        'university_unit_or_office',
                        'partner_organization',
                        'beneficiary_group',
                    ]
                );

                $requiredContextFields = [
                    'university_unit_or_office',
                ];

                $optionalTextFields = [
                    'partner_organization',
                    'beneficiary_group',
                ];

                break;

            case 'S03-COMMUNITY_BASED_SERVICE':
                $allowedFields = array_merge(
                    $commonFields,
                    [
                        'organizer_implementing_body',
                        'partner_organization',
                        'service_location_or_context',
                        'beneficiary_group',
                        'civic_scope',
                    ]
                );

                $requiredContextFields = [
                    'organizer_implementing_body',
                    'service_location_or_context',
                ];

                $optionalTextFields = [
                    'partner_organization',
                    'beneficiary_group',
                ];

                $allowsCivicScope = true;

                break;

            case 'S03-CHURCH_BASED_SERVICE':
                $allowedFields = array_merge(
                    $commonFields,
                    [
                        'church_parish_ministry_organization',
                        'organizer_implementing_body',
                        'partner_organization',
                        'service_location_or_context',
                        'beneficiary_group',
                    ]
                );

                $requiredContextFields = [
                    'church_parish_ministry_organization',
                    'organizer_implementing_body',
                ];

                $optionalTextFields = [
                    'partner_organization',
                    'service_location_or_context',
                    'beneficiary_group',
                ];

                break;

            case 'S03-ENVIRONMENTAL_SERVICE':
            case 'S03-PEOPLE_DEVELOPMENT_EDUCATIONAL_SERVICE':
                $allowedFields = array_merge(
                    $commonFields,
                    [
                        'organizer_implementing_body',
                        'partner_organization',
                        'service_location_or_context',
                        'beneficiary_group',
                    ]
                );

                $requiredContextFields = [
                    'organizer_implementing_body',
                ];

                $optionalTextFields = [
                    'partner_organization',
                    'service_location_or_context',
                    'beneficiary_group',
                ];

                break;

            default:
                throw new RuntimeException(
                    'STUDENT_SERVICE_CONTRACT_UNSUPPORTED'
                );
        }

        $this->assertServiceContractFields(
            $payload,
            $allowedFields
        );

        $payload['service_activity_project_title']
            = $this->requireNonBlankText(
                $payload,
                'service_activity_project_title',
                'STUDENT_SERVICE_REQUIRED_FIELD_MISSING'
            );

        $payload['activity_role']
            = $this->requireControlledValue(
                $payload,
                'activity_role',
                [
                    'PARTICIPANT',
                    'VOLUNTEER',
                    'ORGANIZER',
                    'INITIATOR',
                    'LEADER',
                ],
                'STUDENT_SERVICE_ACTIVITY_ROLE_REQUIRED',
                'STUDENT_SERVICE_ACTIVITY_ROLE_INVALID'
            );

        foreach ($requiredContextFields as $field) {
            $payload[$field] = $this->requireNonBlankText(
                $payload,
                $field,
                'STUDENT_SERVICE_REQUIRED_FIELD_MISSING'
            );
        }

        foreach ($optionalTextFields as $field) {
            if (! array_key_exists($field, $payload)) {
                continue;
            }

            $value = trim((string) $payload[$field]);

            $payload[$field] = $value !== ''
                ? $value
                : null;
        }

        if ($allowsCivicScope) {
            if (array_key_exists('civic_scope', $payload)) {
                $civicScope = trim(
                    (string) $payload['civic_scope']
                );

                if ($civicScope === '') {
                    $payload['civic_scope'] = null;
                } else {
                    $payload['civic_scope']
                        = $this->requireControlledValue(
                            $payload,
                            'civic_scope',
                            [
                                'BARANGAY',
                                'MUNICIPAL',
                                'PROVINCIAL',
                                'NATIONAL',
                            ],
                            'STUDENT_SERVICE_CIVIC_SCOPE_REQUIRED',
                            'STUDENT_SERVICE_CIVIC_SCOPE_INVALID'
                        );
                }
            }
        }

        $payload = $this->validateServicePeriod($payload);
        $payload = $this->validateServiceHours($payload);

        if (array_key_exists('additional_notes', $payload)) {
            $notes = trim(
                (string) $payload['additional_notes']
            );

            $payload['additional_notes'] = $notes !== ''
                ? $notes
                : null;
        }

        return $payload;
    }

    private function assertServiceContractFields(
        array $payload,
        array $allowedFields
    ): void {
        $unexpected = array_values(
            array_diff(array_keys($payload), $allowedFields)
        );

        if ($unexpected === []) {
            return;
        }

        sort($unexpected);

        throw new RuntimeException(
            'STUDENT_SERVICE_FIELD_NOT_ALLOWED_FOR_CONTRACT:'
            . implode(',', $unexpected)
        );
    }

    private function validateServicePeriod(array $payload): array
    {
        $payload['period_precision']
            = $this->requireControlledValue(
                $payload,
                'period_precision',
                [
                    'DATE',
                    'RANGE',
                ],
                'STUDENT_SERVICE_PERIOD_PRECISION_REQUIRED',
                'STUDENT_SERVICE_PERIOD_PRECISION_INVALID'
            );

        foreach (
            [
                'period_start_year',
                'period_start_month',
                'period_start_day',
            ] as $field
        ) {
            $payload[$field] = $this->requireIntegerField(
                $payload,
                $field,
                'STUDENT_SERVICE_PERIOD_START_REQUIRED:' . $field,
                'STUDENT_SERVICE_PERIOD_VALUE_INVALID:' . $field
            );
        }

        if (
            $payload['period_start_month'] < 1
            || $payload['period_start_month'] > 12
            || $payload['period_start_day'] < 1
            || $payload['period_start_day'] > 31
            || ! checkdate(
                $payload['period_start_month'],
                $payload['period_start_day'],
                $payload['period_start_year']
            )
        ) {
            throw new RuntimeException(
                'STUDENT_SERVICE_PERIOD_START_DATE_INVALID'
            );
        }

        $endFields = [
            'period_end_year',
            'period_end_month',
            'period_end_day',
        ];

        if ($payload['period_precision'] === 'DATE') {
            foreach ($endFields as $field) {
                if (
                    array_key_exists($field, $payload)
                    && $payload[$field] !== null
                    && trim((string) $payload[$field]) !== ''
                ) {
                    throw new RuntimeException(
                        'STUDENT_SERVICE_DATE_END_NOT_ALLOWED'
                    );
                }

                if (array_key_exists($field, $payload)) {
                    $payload[$field] = null;
                }
            }

            return $payload;
        }

        foreach ($endFields as $field) {
            $payload[$field] = $this->requireIntegerField(
                $payload,
                $field,
                'STUDENT_SERVICE_PERIOD_END_REQUIRED:' . $field,
                'STUDENT_SERVICE_PERIOD_VALUE_INVALID:' . $field
            );
        }

        if (
            $payload['period_end_month'] < 1
            || $payload['period_end_month'] > 12
            || $payload['period_end_day'] < 1
            || $payload['period_end_day'] > 31
            || ! checkdate(
                $payload['period_end_month'],
                $payload['period_end_day'],
                $payload['period_end_year']
            )
        ) {
            throw new RuntimeException(
                'STUDENT_SERVICE_PERIOD_END_DATE_INVALID'
            );
        }

        $startComparable
            = ($payload['period_start_year'] * 10000)
            + ($payload['period_start_month'] * 100)
            + $payload['period_start_day'];

        $endComparable
            = ($payload['period_end_year'] * 10000)
            + ($payload['period_end_month'] * 100)
            + $payload['period_end_day'];

        if ($endComparable < $startComparable) {
            throw new RuntimeException(
                'STUDENT_SERVICE_PERIOD_ORDER_INVALID'
            );
        }

        return $payload;
    }

    private function validateServiceHours(array $payload): array
    {
        if (! array_key_exists('service_hours', $payload)) {
            return $payload;
        }

        if (
            $payload['service_hours'] === null
            || trim((string) $payload['service_hours']) === ''
        ) {
            $payload['service_hours'] = null;

            return $payload;
        }

        if ($payload['period_precision'] !== 'DATE') {
            throw new RuntimeException(
                'STUDENT_SERVICE_HOURS_RANGE_NOT_ALLOWED'
            );
        }

        $hours = trim((string) $payload['service_hours']);

        if (
            preg_match(
                '/^\d+(?:\.\d{1,2})?$/',
                $hours
            ) !== 1
            || (float) $hours <= 0
            || (float) $hours > 9999.99
        ) {
            throw new RuntimeException(
                'STUDENT_SERVICE_HOURS_INVALID'
            );
        }

        $payload['service_hours'] = $hours;

        return $payload;
    }
    private function validateChurchMinistryPayload(
        string $contractCode,
        array $payload
    ): array {
        switch ($contractCode) {
            case 'S04-CAMPUS_MINISTRY':
                $this->assertChurchMinistryContractFields(
                    $payload,
                    [
                        'ministry_or_organization_name',
                        'specified_ministry_or_organization',
                        'involvement_activity_title',
                        'involvement_type',
                        'specified_involvement_type',
                        'role_position',
                        'specified_role_position',
                        'academic_year_start',
                        'activity_start_date',
                        'activity_end_date',
                        'additional_notes',
                    ]
                );

                $payload['ministry_or_organization_name']
                    = $this->requireNonBlankText(
                        $payload,
                        'ministry_or_organization_name',
                        'STUDENT_CHURCH_REQUIRED_FIELD_MISSING'
                    );

                $payload['involvement_activity_title']
                    = $this->requireNonBlankText(
                        $payload,
                        'involvement_activity_title',
                        'STUDENT_CHURCH_REQUIRED_FIELD_MISSING'
                    );

                $payload['involvement_type']
                    = $this->requireExactControlledLabel(
                        $payload,
                        'involvement_type',
                        [
                            'Member / Regular Ministry Involvement',
                            'Activity Participant',
                            'Ministry Volunteer / Service Role',
                            'Facilitator / Organizer',
                            'Other Campus Ministry Involvement',
                        ],
                        'STUDENT_CHURCH_INVOLVEMENT_TYPE_REQUIRED',
                        'STUDENT_CHURCH_INVOLVEMENT_TYPE_INVALID'
                    );

                $payload = $this->validateChurchSpecifiedInvolvementType(
                    $payload,
                    'Other Campus Ministry Involvement'
                );

                $payload['role_position']
                    = $this->requireNonBlankText(
                        $payload,
                        'role_position',
                        'STUDENT_CHURCH_ROLE_POSITION_REQUIRED'
                    );

                $payload = $this->normalizeChurchOptionalText(
                    $payload,
                    'specified_ministry_or_organization'
                );

                $payload = $this->validateChurchRoleFallback(
                    $payload,
                    true
                );

                $payload = $this->validateChurchOngoingOrActivityMode(
                    $payload
                );

                break;

            case 'S04-PARISH_CHURCH_MINISTRY':
                $this->assertChurchMinistryContractFields(
                    $payload,
                    [
                        'ministry_or_organization_name',
                        'specified_ministry_or_organization',
                        'involvement_activity_title',
                        'involvement_type',
                        'specified_involvement_type',
                        'role_position',
                        'specified_role_position',
                        'academic_year_start',
                        'activity_start_date',
                        'activity_end_date',
                        'additional_notes',
                    ]
                );

                $payload['ministry_or_organization_name']
                    = $this->requireNonBlankText(
                        $payload,
                        'ministry_or_organization_name',
                        'STUDENT_CHURCH_REQUIRED_FIELD_MISSING'
                    );

                $payload['involvement_activity_title']
                    = $this->requireNonBlankText(
                        $payload,
                        'involvement_activity_title',
                        'STUDENT_CHURCH_REQUIRED_FIELD_MISSING'
                    );

                $payload['involvement_type']
                    = $this->requireExactControlledLabel(
                        $payload,
                        'involvement_type',
                        [
                            'Member / Regular Ministry Involvement',
                            'Activity Participant',
                            'Ministry Function / Assigned Responsibility',
                            'Facilitator / Organizer',
                            'Other Parish / Church Ministry Involvement',
                        ],
                        'STUDENT_CHURCH_INVOLVEMENT_TYPE_REQUIRED',
                        'STUDENT_CHURCH_INVOLVEMENT_TYPE_INVALID'
                    );

                $payload = $this->validateChurchSpecifiedInvolvementType(
                    $payload,
                    'Other Parish / Church Ministry Involvement'
                );

                $payload = $this->normalizeChurchOptionalText(
                    $payload,
                    'specified_ministry_or_organization'
                );

                $payload = $this->validateChurchRoleFallback(
                    $payload,
                    false
                );

                $payload = $this->validateChurchOngoingOrActivityMode(
                    $payload
                );

                break;

            case 'S04-CHURCH_ORGANIZATION':
                $this->assertChurchMinistryContractFields(
                    $payload,
                    [
                        'ministry_or_organization_name',
                        'specified_ministry_or_organization',
                        'involvement_type',
                        'specified_involvement_type',
                        'committee_working_group_name',
                        'involvement_activity_title',
                        'role_position',
                        'specified_role_position',
                        'academic_year_start',
                        'activity_start_date',
                        'activity_end_date',
                        'additional_notes',
                    ]
                );

                $payload['ministry_or_organization_name']
                    = $this->requireNonBlankText(
                        $payload,
                        'ministry_or_organization_name',
                        'STUDENT_CHURCH_REQUIRED_FIELD_MISSING'
                    );

                $payload['involvement_type']
                    = $this->requireExactControlledLabel(
                        $payload,
                        'involvement_type',
                        [
                            'Member / Regular Organization Involvement',
                            'Activity Participant',
                            'Committee / Working Group Involvement',
                            'Facilitator / Organizer',
                            'Other Church Organization Involvement',
                        ],
                        'STUDENT_CHURCH_INVOLVEMENT_TYPE_REQUIRED',
                        'STUDENT_CHURCH_INVOLVEMENT_TYPE_INVALID'
                    );

                $payload = $this->validateChurchSpecifiedInvolvementType(
                    $payload,
                    'Other Church Organization Involvement'
                );

                $payload = $this->normalizeChurchOptionalText(
                    $payload,
                    'specified_ministry_or_organization'
                );

                $payload = $this->validateChurchRoleFallback(
                    $payload,
                    false
                );

                if (
                    $payload['involvement_type']
                    === 'Committee / Working Group Involvement'
                ) {
                    $payload['committee_working_group_name']
                        = $this->requireNonBlankText(
                            $payload,
                            'committee_working_group_name',
                            'STUDENT_CHURCH_COMMITTEE_NAME_REQUIRED'
                        );
                } elseif (
                    array_key_exists(
                        'committee_working_group_name',
                        $payload
                    )
                ) {
                    $committeeName = trim(
                        (string) $payload['committee_working_group_name']
                    );

                    if ($committeeName !== '') {
                        throw new RuntimeException(
                            'STUDENT_CHURCH_COMMITTEE_NAME_NOT_APPLICABLE'
                        );
                    }

                    $payload['committee_working_group_name'] = null;
                }

                $payload = $this->validateChurchOngoingOrActivityMode(
                    $payload
                );

                $isSpecificActivity
                    = ($payload['activity_start_date'] ?? null) !== null;

                if ($isSpecificActivity) {
                    $payload['involvement_activity_title']
                        = $this->requireNonBlankText(
                            $payload,
                            'involvement_activity_title',
                            'STUDENT_CHURCH_ACTIVITY_TITLE_REQUIRED'
                        );
                } elseif (
                    array_key_exists(
                        'involvement_activity_title',
                        $payload
                    )
                ) {
                    $title = trim(
                        (string) $payload['involvement_activity_title']
                    );

                    if ($title !== '') {
                        throw new RuntimeException(
                            'STUDENT_CHURCH_ACTIVITY_TITLE_NOT_APPLICABLE'
                        );
                    }

                    $payload['involvement_activity_title'] = null;
                }

                break;

            case 'S04-INITIATED_CHURCH_RELATED_ACTIVITY':
                $this->assertChurchMinistryContractFields(
                    $payload,
                    [
                        'activity_initiative_title',
                        'initiation_role',
                        'specified_initiation_role',
                        'official_role_responsibility',
                        'church_ministry_context_affiliation',
                        'activity_start_date',
                        'activity_end_date',
                        'additional_notes',
                    ]
                );

                $payload['activity_initiative_title']
                    = $this->requireNonBlankText(
                        $payload,
                        'activity_initiative_title',
                        'STUDENT_CHURCH_REQUIRED_FIELD_MISSING'
                    );

                $payload['initiation_role']
                    = $this->requireControlledValue(
                        $payload,
                        'initiation_role',
                        [
                            'INITIATOR',
                            'CO_INITIATOR',
                            'PRINCIPAL_ORGANIZER',
                            'CO_PRINCIPAL_ORGANIZER',
                            'OTHER_VERIFIED_INITIATION_ROLE',
                        ],
                        'STUDENT_CHURCH_INITIATION_ROLE_REQUIRED',
                        'STUDENT_CHURCH_INITIATION_ROLE_INVALID'
                    );

                if (
                    $payload['initiation_role']
                    === 'OTHER_VERIFIED_INITIATION_ROLE'
                ) {
                    $payload['specified_initiation_role']
                        = $this->requireNonBlankText(
                            $payload,
                            'specified_initiation_role',
                            'STUDENT_CHURCH_SPECIFIED_INITIATION_ROLE_REQUIRED'
                        );
                } elseif (
                    array_key_exists(
                        'specified_initiation_role',
                        $payload
                    )
                ) {
                    $specified = trim(
                        (string) $payload['specified_initiation_role']
                    );

                    if ($specified !== '') {
                        throw new RuntimeException(
                            'STUDENT_CHURCH_SPECIFIED_INITIATION_ROLE_NOT_ALLOWED'
                        );
                    }

                    $payload['specified_initiation_role'] = null;
                }

                $payload['church_ministry_context_affiliation']
                    = $this->requireNonBlankText(
                        $payload,
                        'church_ministry_context_affiliation',
                        'STUDENT_CHURCH_REQUIRED_FIELD_MISSING'
                    );

                $payload = $this->normalizeChurchOptionalText(
                    $payload,
                    'official_role_responsibility'
                );

                $payload = $this->validateChurchActivityDates(
                    $payload,
                    true
                );

                break;

            default:
                throw new RuntimeException(
                    'STUDENT_CHURCH_CONTRACT_UNSUPPORTED'
                );
        }

        if (array_key_exists('additional_notes', $payload)) {
            $notes = trim(
                (string) $payload['additional_notes']
            );

            $payload['additional_notes']
                = $notes !== '' ? $notes : null;
        }

        return $payload;
    }

    private function assertChurchMinistryContractFields(
        array $payload,
        array $allowedFields
    ): void {
        $unexpected = array_values(
            array_diff(array_keys($payload), $allowedFields)
        );

        if ($unexpected === []) {
            return;
        }

        sort($unexpected);

        throw new RuntimeException(
            'STUDENT_CHURCH_FIELD_NOT_ALLOWED_FOR_CONTRACT:'
            . implode(',', $unexpected)
        );
    }

    private function requireExactControlledLabel(
        array $payload,
        string $field,
        array $allowedValues,
        string $requiredError,
        string $invalidError
    ): string {
        if (
            ! array_key_exists($field, $payload)
            || trim((string) $payload[$field]) === ''
        ) {
            throw new RuntimeException($requiredError);
        }

        $value = trim((string) $payload[$field]);

        if (! in_array($value, $allowedValues, true)) {
            throw new RuntimeException($invalidError);
        }

        return $value;
    }

    private function normalizeChurchOptionalText(
        array $payload,
        string $field
    ): array {
        if (! array_key_exists($field, $payload)) {
            return $payload;
        }

        $value = trim((string) $payload[$field]);

        $payload[$field] = $value !== ''
            ? $value
            : null;

        return $payload;
    }

    private function validateChurchSpecifiedInvolvementType(
        array $payload,
        string $otherValue
    ): array {
        if ($payload['involvement_type'] === $otherValue) {
            $payload['specified_involvement_type']
                = $this->requireNonBlankText(
                    $payload,
                    'specified_involvement_type',
                    'STUDENT_CHURCH_SPECIFIED_INVOLVEMENT_TYPE_REQUIRED'
                );

            return $payload;
        }

        if (
            array_key_exists(
                'specified_involvement_type',
                $payload
            )
        ) {
            $specified = trim(
                (string) $payload['specified_involvement_type']
            );

            if ($specified !== '') {
                throw new RuntimeException(
                    'STUDENT_CHURCH_SPECIFIED_INVOLVEMENT_TYPE_NOT_ALLOWED'
                );
            }

            $payload['specified_involvement_type'] = null;
        }

        return $payload;
    }

    private function validateChurchRoleFallback(
        array $payload,
        bool $required
    ): array {
        if (
            ! array_key_exists('role_position', $payload)
            || trim((string) $payload['role_position']) === ''
        ) {
            if ($required) {
                throw new RuntimeException(
                    'STUDENT_CHURCH_ROLE_POSITION_REQUIRED'
                );
            }

            if (array_key_exists('role_position', $payload)) {
                $payload['role_position'] = null;
            }

            if (
                array_key_exists(
                    'specified_role_position',
                    $payload
                )
            ) {
                $specified = trim(
                    (string) $payload['specified_role_position']
                );

                if ($specified !== '') {
                    throw new RuntimeException(
                        'STUDENT_CHURCH_SPECIFIED_ROLE_WITHOUT_ROLE'
                    );
                }

                $payload['specified_role_position'] = null;
            }

            return $payload;
        }

        $payload['role_position']
            = trim((string) $payload['role_position']);

        if (
            $payload['role_position']
            === 'Other Official Role / Position'
        ) {
            $payload['specified_role_position']
                = $this->requireNonBlankText(
                    $payload,
                    'specified_role_position',
                    'STUDENT_CHURCH_SPECIFIED_ROLE_REQUIRED'
                );

            return $payload;
        }

        if (
            array_key_exists('specified_role_position', $payload)
        ) {
            $specified = trim(
                (string) $payload['specified_role_position']
            );

            if ($specified !== '') {
                throw new RuntimeException(
                    'STUDENT_CHURCH_SPECIFIED_ROLE_NOT_ALLOWED'
                );
            }

            $payload['specified_role_position'] = null;
        }

        return $payload;
    }

    private function validateChurchOngoingOrActivityMode(
        array $payload
    ): array {
        if (array_key_exists('academic_year_start', $payload)) {
            if (
                $payload['academic_year_start'] === null
                || trim(
                    (string) $payload['academic_year_start']
                ) === ''
            ) {
                $payload['academic_year_start'] = null;
            }
        }

        foreach (
            [
                'activity_start_date',
                'activity_end_date',
            ] as $field
        ) {
            if (
                array_key_exists($field, $payload)
                && (
                    $payload[$field] === null
                    || trim((string) $payload[$field]) === ''
                )
            ) {
                $payload[$field] = null;
            }
        }

        $hasAcademicYear
            = ($payload['academic_year_start'] ?? null) !== null;

        $hasActivityStart
            = ($payload['activity_start_date'] ?? null) !== null;

        if ($hasAcademicYear === $hasActivityStart) {
            throw new RuntimeException(
                'STUDENT_CHURCH_RECORD_MODE_INVALID'
            );
        }

        if ($hasAcademicYear) {
            $academicYear = filter_var(
                $payload['academic_year_start'],
                FILTER_VALIDATE_INT
            );

            if (
                $academicYear === false
                || $academicYear > (int) date('Y')
            ) {
                throw new RuntimeException(
                    'STUDENT_CHURCH_ACADEMIC_YEAR_INVALID'
                );
            }

            $payload['academic_year_start'] = $academicYear;

            if (
                ($payload['activity_end_date'] ?? null) !== null
            ) {
                throw new RuntimeException(
                    'STUDENT_CHURCH_ACTIVITY_END_WITHOUT_START'
                );
            }

            return $payload;
        }

        return $this->validateChurchActivityDates(
            $payload,
            true
        );
    }

    private function validateChurchActivityDates(
        array $payload,
        bool $required
    ): array {
        $start = array_key_exists(
            'activity_start_date',
            $payload
        )
            ? trim((string) $payload['activity_start_date'])
            : '';

        if ($start === '') {
            if ($required) {
                throw new RuntimeException(
                    'STUDENT_CHURCH_ACTIVITY_START_DATE_REQUIRED'
                );
            }

            return $payload;
        }

        $startDate = \DateTimeImmutable::createFromFormat(
            '!Y-m-d',
            $start
        );

        if (
            $startDate === false
            || $startDate->format('Y-m-d') !== $start
        ) {
            throw new RuntimeException(
                'STUDENT_CHURCH_ACTIVITY_START_DATE_INVALID'
            );
        }

        $payload['activity_start_date'] = $start;

        $end = array_key_exists(
            'activity_end_date',
            $payload
        )
            ? trim((string) $payload['activity_end_date'])
            : '';

        if ($end === '') {
            if (array_key_exists('activity_end_date', $payload)) {
                $payload['activity_end_date'] = null;
            }

            return $payload;
        }

        $endDate = \DateTimeImmutable::createFromFormat(
            '!Y-m-d',
            $end
        );

        if (
            $endDate === false
            || $endDate->format('Y-m-d') !== $end
        ) {
            throw new RuntimeException(
                'STUDENT_CHURCH_ACTIVITY_END_DATE_INVALID'
            );
        }

        if ($endDate < $startDate) {
            throw new RuntimeException(
                'STUDENT_CHURCH_ACTIVITY_DATE_ORDER_INVALID'
            );
        }

        $payload['activity_end_date'] = $end;

        return $payload;
    }
    private function validateSeminarTrainingPayload(
        string $contractCode,
        array $payload
    ): array {
        $standardContracts = [
            'S05-LEADERSHIP_DEVELOPMENT',
            'S05-PERSONAL_PROFESSIONAL_DEVELOPMENT',
            'S05-CAMPUS_JOURNALISM_DEVELOPMENT',
            'S05-SPORTS_DEVELOPMENT',
            'S05-SOCIO_CULTURAL_PERFORMING_ARTS_DEVELOPMENT',
            'S05-COMMUNITY_SERVICE_VOLUNTEER_DEVELOPMENT',
            'S05-OTHER_SEMINAR_TRAINING',
        ];

        $spiritualContract
            = 'S05-SPIRITUAL_FORMATION_DEVELOPMENT';

        if (
            ! in_array($contractCode, $standardContracts, true)
            && $contractCode !== $spiritualContract
        ) {
            throw new RuntimeException(
                'STUDENT_SEMINAR_TRAINING_CONTRACT_UNSUPPORTED'
            );
        }

        $allowedFields = [
            'activity_type',
            'activity_program_title',
            'organizer_issuing_organization',
            'activity_start_date',
            'activity_end_date',
            'additional_notes',
        ];

        $unexpected = array_values(
            array_diff(array_keys($payload), $allowedFields)
        );

        if ($unexpected !== []) {
            sort($unexpected);

            throw new RuntimeException(
                'STUDENT_SEMINAR_TRAINING_FIELD_NOT_ALLOWED_FOR_CONTRACT:'
                . implode(',', $unexpected)
            );
        }

        $activityTypes = [
            'SEMINAR',
            'WORKSHOP',
            'TRAINING',
            'CONFERENCE',
            'CONGRESS',
            'CERTIFICATION',
        ];

        if ($contractCode === $spiritualContract) {
            $activityTypes[] = 'RETREAT';
            $activityTypes[] = 'RECOLLECTION';
        }

        $payload['activity_type']
            = $this->requireControlledValue(
                $payload,
                'activity_type',
                $activityTypes,
                'STUDENT_SEMINAR_TRAINING_ACTIVITY_TYPE_REQUIRED',
                'STUDENT_SEMINAR_TRAINING_ACTIVITY_TYPE_INVALID'
            );

        $payload['activity_program_title']
            = $this->requireNonBlankText(
                $payload,
                'activity_program_title',
                'STUDENT_SEMINAR_TRAINING_REQUIRED_FIELD_MISSING'
            );

        $payload['organizer_issuing_organization']
            = $this->requireNonBlankText(
                $payload,
                'organizer_issuing_organization',
                'STUDENT_SEMINAR_TRAINING_REQUIRED_FIELD_MISSING'
            );

        $payload = $this->validateSeminarTrainingDates(
            $payload
        );

        if (array_key_exists('additional_notes', $payload)) {
            $notes = trim(
                (string) $payload['additional_notes']
            );

            $payload['additional_notes']
                = $notes !== '' ? $notes : null;
        }

        return $payload;
    }

    private function validateSeminarTrainingDates(
        array $payload
    ): array {
        $start = array_key_exists(
            'activity_start_date',
            $payload
        )
            ? trim((string) $payload['activity_start_date'])
            : '';

        if ($start === '') {
            throw new RuntimeException(
                'STUDENT_SEMINAR_TRAINING_ACTIVITY_START_DATE_REQUIRED'
            );
        }

        $startDate = \DateTimeImmutable::createFromFormat(
            '!Y-m-d',
            $start
        );

        if (
            $startDate === false
            || $startDate->format('Y-m-d') !== $start
        ) {
            throw new RuntimeException(
                'STUDENT_SEMINAR_TRAINING_ACTIVITY_START_DATE_INVALID'
            );
        }

        $payload['activity_start_date'] = $start;

        $end = array_key_exists(
            'activity_end_date',
            $payload
        )
            ? trim((string) $payload['activity_end_date'])
            : '';

        if ($end === '') {
            if (array_key_exists('activity_end_date', $payload)) {
                $payload['activity_end_date'] = null;
            }

            return $payload;
        }

        $endDate = \DateTimeImmutable::createFromFormat(
            '!Y-m-d',
            $end
        );

        if (
            $endDate === false
            || $endDate->format('Y-m-d') !== $end
        ) {
            throw new RuntimeException(
                'STUDENT_SEMINAR_TRAINING_ACTIVITY_END_DATE_INVALID'
            );
        }

        if ($endDate < $startDate) {
            throw new RuntimeException(
                'STUDENT_SEMINAR_TRAINING_ACTIVITY_DATE_ORDER_INVALID'
            );
        }

        $payload['activity_end_date'] = $end;

        return $payload;
    }
    private function assertOrganizationContractFields(
        array $payload,
        array $allowedFields
    ): void {
        $unexpected = array_values(
            array_diff(array_keys($payload), $allowedFields)
        );

        if ($unexpected === []) {
            return;
        }

        sort($unexpected);

        throw new RuntimeException(
            'STUDENT_ORGANIZATION_FIELD_NOT_ALLOWED_FOR_CONTRACT:'
            . implode(',', $unexpected)
        );
    }

    private function validateSportsPayload(
        string $contractCode,
        array $payload
    ): array {
        $contractToDiscipline = [
            'S07-BASKETBALL' => 'BASKETBALL',
            'S07-VOLLEYBALL' => 'VOLLEYBALL',
            'S07-ATHLETICS' => 'ATHLETICS',
            'S07-SWIMMING' => 'SWIMMING',
            'S07-BADMINTON' => 'BADMINTON',
            'S07-TABLE_TENNIS' => 'TABLE_TENNIS',
            'S07-CHESS' => 'CHESS',
            'S07-FOOTBALL' => 'FOOTBALL',
            'S07-SEPAK_TAKRAW' => 'SEPAK_TAKRAW',
            'S07-OTHER_APPROVED_SPORT'
                => 'OTHER_APPROVED_SPORT',
        ];

        $contractCode = strtoupper(trim($contractCode));

        if (! isset($contractToDiscipline[$contractCode])) {
            throw new RuntimeException(
                'STUDENT_SPORTS_CONTRACT_UNSUPPORTED'
            );
        }

        $normalizeSpaces = static function (
            string $value
        ): string {
            $value = trim($value);

            $normalized = preg_replace(
                '/\s+/',
                ' ',
                $value
            );

            return $normalized === null
                ? $value
                : $normalized;
        };

        $normalizeComparison = static function (
            string $value
        ) use ($normalizeSpaces): string {
            $value = str_replace(
                ['_', '/', '-'],
                ' ',
                $value
            );

            return strtolower(
                $normalizeSpaces($value)
            );
        };

        $requiredFields = [
            'sport_discipline',
            'event_type_competition',
            'participation_type',
            'placement_result',
            'competition_event_title',
            'organizer_issuing_organization',
            'event_start_date',
        ];

        foreach ($requiredFields as $field) {
            if (
                ! array_key_exists($field, $payload)
                || trim((string) $payload[$field]) === ''
            ) {
                throw new RuntimeException(
                    'STUDENT_SPORTS_REQUIRED_FIELD_MISSING:'
                    . $field
                );
            }
        }

        /*
         * Sport Discipline / Contract alignment
         */
        $sportDiscipline = strtoupper(
            trim((string) $payload['sport_discipline'])
        );

        $expectedDiscipline =
            $contractToDiscipline[$contractCode];

        if ($sportDiscipline !== $expectedDiscipline) {
            throw new RuntimeException(
                'STUDENT_SPORTS_CONTRACT_DISCIPLINE_MISMATCH'
            );
        }

        $payload['sport_discipline']
            = $sportDiscipline;

        $seededSports = [
            'BASKETBALL',
            'VOLLEYBALL',
            'ATHLETICS',
            'SWIMMING',
            'BADMINTON',
            'TABLE_TENNIS',
            'CHESS',
            'FOOTBALL',
            'SEPAK_TAKRAW',
        ];

        $specifiedSport = null;

        if (
            array_key_exists(
                'specified_sport_discipline',
                $payload
            )
            && $payload['specified_sport_discipline'] !== null
        ) {
            $specifiedSport = $normalizeSpaces(
                (string) $payload['specified_sport_discipline']
            );
        }

        if (
            $sportDiscipline === 'OTHER_APPROVED_SPORT'
        ) {
            if (
                $specifiedSport === null
                || $specifiedSport === ''
            ) {
                throw new RuntimeException(
                    'STUDENT_SPORTS_SPECIFIED_DISCIPLINE_REQUIRED'
                );
            }

            $specifiedComparison =
                $normalizeComparison($specifiedSport);

            foreach ($seededSports as $seededSport) {
                if (
                    $specifiedComparison
                    === $normalizeComparison($seededSport)
                ) {
                    throw new RuntimeException(
                        'STUDENT_SPORTS_SPECIFIED_DISCIPLINE_DUPLICATES_SEEDED'
                    );
                }
            }

            $payload['specified_sport_discipline']
                = $specifiedSport;
        } else {
            if (
                $specifiedSport !== null
                && $specifiedSport !== ''
            ) {
                throw new RuntimeException(
                    'STUDENT_SPORTS_SPECIFIED_DISCIPLINE_NOT_ALLOWED'
                );
            }

            if (
                array_key_exists(
                    'specified_sport_discipline',
                    $payload
                )
            ) {
                $payload['specified_sport_discipline']
                    = null;
            }
        }

        /*
         * Event Type / Competition
         */
        $competition = strtoupper(
            trim((string) $payload[
                'event_type_competition'
            ])
        );

        $allowedCompetitions = [
            'PRISAA',
            'NDEA',
            'INTRAMURALS_UNIVERSITY_MEET',
            'OTHER_APPROVED_COMPETITION',
        ];

        if (
            ! in_array(
                $competition,
                $allowedCompetitions,
                true
            )
        ) {
            throw new RuntimeException(
                'STUDENT_SPORTS_COMPETITION_INVALID'
            );
        }

        $payload['event_type_competition']
            = $competition;

        $specifiedCompetition = null;

        if (
            array_key_exists(
                'specified_competition_meet',
                $payload
            )
            && $payload['specified_competition_meet'] !== null
        ) {
            $specifiedCompetition = $normalizeSpaces(
                (string) $payload[
                    'specified_competition_meet'
                ]
            );
        }

        if (
            $competition === 'OTHER_APPROVED_COMPETITION'
        ) {
            if (
                $specifiedCompetition === null
                || $specifiedCompetition === ''
            ) {
                throw new RuntimeException(
                    'STUDENT_SPORTS_SPECIFIED_COMPETITION_REQUIRED'
                );
            }

            $comparison = $normalizeComparison(
                $specifiedCompetition
            );

            $genericCompetitionNames = [
                'other',
                'sports event',
                'competition',
                'tournament',
            ];

            if (
                in_array(
                    $comparison,
                    $genericCompetitionNames,
                    true
                )
            ) {
                throw new RuntimeException(
                    'STUDENT_SPORTS_SPECIFIED_COMPETITION_GENERIC'
                );
            }

            $seededCompetitionNames = [
                'PRISAA',
                'NDEA',
                'INTRAMURALS_UNIVERSITY_MEET',
                'Intramurals / University Meet',
            ];

            foreach (
                $seededCompetitionNames
                as $seededCompetition
            ) {
                if (
                    $comparison
                    === $normalizeComparison(
                        $seededCompetition
                    )
                ) {
                    throw new RuntimeException(
                        'STUDENT_SPORTS_SPECIFIED_COMPETITION_DUPLICATES_SEEDED'
                    );
                }
            }

            $payload['specified_competition_meet']
                = $specifiedCompetition;
        } else {
            if (
                $specifiedCompetition !== null
                && $specifiedCompetition !== ''
            ) {
                throw new RuntimeException(
                    'STUDENT_SPORTS_SPECIFIED_COMPETITION_NOT_ALLOWED'
                );
            }

            if (
                array_key_exists(
                    'specified_competition_meet',
                    $payload
                )
            ) {
                $payload['specified_competition_meet']
                    = null;
            }
        }

        /*
         * Competition Level
         */
        $competitionLevel = null;

        if (
            array_key_exists(
                'competition_level',
                $payload
            )
            && $payload['competition_level'] !== null
            && trim(
                (string) $payload['competition_level']
            ) !== ''
        ) {
            $competitionLevel = strtoupper(
                trim(
                    (string) $payload[
                        'competition_level'
                    ]
                )
            );
        }

        $allowedLevels = [
            'LOCAL',
            'REGIONAL',
            'NATIONAL',
        ];

        if (
            $competitionLevel !== null
            && ! in_array(
                $competitionLevel,
                $allowedLevels,
                true
            )
        ) {
            throw new RuntimeException(
                'STUDENT_SPORTS_COMPETITION_LEVEL_INVALID'
            );
        }

        if (
            $competition === 'PRISAA'
            && $competitionLevel === null
        ) {
            throw new RuntimeException(
                'STUDENT_SPORTS_COMPETITION_LEVEL_REQUIRED'
            );
        }

        if (
            in_array(
                $competition,
                [
                    'NDEA',
                    'INTRAMURALS_UNIVERSITY_MEET',
                ],
                true
            )
            && $competitionLevel !== null
        ) {
            throw new RuntimeException(
                'STUDENT_SPORTS_COMPETITION_LEVEL_NOT_APPLICABLE'
            );
        }

        $payload['competition_level']
            = $competitionLevel;

        /*
         * Participation Type
         */
        $participationType = strtoupper(
            trim(
                (string) $payload[
                    'participation_type'
                ]
            )
        );

        if (
            ! in_array(
                $participationType,
                [
                    'INDIVIDUAL',
                    'TEAM',
                ],
                true
            )
        ) {
            throw new RuntimeException(
                'STUDENT_SPORTS_PARTICIPATION_TYPE_INVALID'
            );
        }

        $payload['participation_type']
            = $participationType;

        /*
         * Placement / Result
         */
        $placementResult = strtoupper(
            trim(
                (string) $payload[
                    'placement_result'
                ]
            )
        );

        if (
            ! in_array(
                $placementResult,
                [
                    'PARTICIPANT',
                    'BRONZE_3RD_PLACE',
                    'SILVER_2ND_PLACE',
                    'GOLD_1ST_PLACE_CHAMPION',
                ],
                true
            )
        ) {
            throw new RuntimeException(
                'STUDENT_SPORTS_PLACEMENT_RESULT_INVALID'
            );
        }

        $payload['placement_result']
            = $placementResult;

        /*
         * Required factual text
         */
        $eventTitle = trim(
            (string) $payload[
                'competition_event_title'
            ]
        );

        if ($eventTitle === '') {
            throw new RuntimeException(
                'STUDENT_SPORTS_EVENT_TITLE_REQUIRED'
            );
        }

        $payload['competition_event_title']
            = $eventTitle;

        $organizer = trim(
            (string) $payload[
                'organizer_issuing_organization'
            ]
        );

        if ($organizer === '') {
            throw new RuntimeException(
                'STUDENT_SPORTS_ORGANIZER_REQUIRED'
            );
        }

        $payload['organizer_issuing_organization']
            = $organizer;

        /*
         * Competition / Event Date / Period
         */
        $parseDate = static function (
            string $value,
            string $errorCode
        ): \DateTimeImmutable {
            $date = \DateTimeImmutable::createFromFormat(
                '!Y-m-d',
                $value
            );

            $errors = \DateTimeImmutable::getLastErrors();

            if (
                $date === false
                || (
                    $errors !== false
                    && (
                        $errors['warning_count'] > 0
                        || $errors['error_count'] > 0
                    )
                )
                || $date->format('Y-m-d') !== $value
            ) {
                throw new RuntimeException(
                    $errorCode
                );
            }

            return $date;
        };

        $startDateValue = trim(
            (string) $payload['event_start_date']
        );

        $startDate = $parseDate(
            $startDateValue,
            'STUDENT_SPORTS_EVENT_START_DATE_INVALID'
        );

        $payload['event_start_date']
            = $startDateValue;

        if (
            ! array_key_exists(
                'event_end_date',
                $payload
            )
            || $payload['event_end_date'] === null
            || trim(
                (string) $payload['event_end_date']
            ) === ''
        ) {
            $payload['event_end_date'] = null;
        } else {
            $endDateValue = trim(
                (string) $payload['event_end_date']
            );

            $endDate = $parseDate(
                $endDateValue,
                'STUDENT_SPORTS_EVENT_END_DATE_INVALID'
            );

            if ($endDate < $startDate) {
                throw new RuntimeException(
                    'STUDENT_SPORTS_EVENT_DATE_ORDER_INVALID'
                );
            }

            $payload['event_end_date']
                = $endDateValue;
        }

        /*
         * Additional Notes are optional.
         */
        if (
            array_key_exists(
                'additional_notes',
                $payload
            )
            && $payload['additional_notes'] !== null
        ) {
            $payload['additional_notes'] = trim(
                (string) $payload[
                    'additional_notes'
                ]
            );
        }

        return $payload;
    }
    private function validateRecognitionPayload(
        string $contractCode,
        array $payload
    ): array {
        $genericScopes = [
            'Local',
            'Regional',
            'National',
            'International',
        ];

        $extendedScopes = [
            'Institutional / School',
            'Local / City / Municipal',
            'Provincial',
            'Regional',
            'National',
            'International',
            'Not Applicable / No Formal Level',
        ];

        $contractRules = [
            'S06-LEADERSHIP' => [
                'types' => [
                    'Leadership Award',
                    'Leadership Citation',
                    'Other Formal Leadership Recognition',
                ],
                'scope_required' => false,
                'scopes' => $genericScopes,
                'organization_required' => false,
            ],

            'S06-ORGANIZATION_MEMBERSHIP' => [
                'types' => [
                    'Organization / Membership Award',
                    'Organization / Membership Citation',
                    'Other Formal Organization / Membership Recognition',
                ],
                'scope_required' => false,
                'scopes' => $genericScopes,
                'organization_required' => true,
            ],

            'S06-COMMUNITY_SERVICE_VOLUNTEERISM' => [
                'types' => [
                    'Community Service / Volunteerism Award',
                    'Community Service / Volunteerism Citation',
                    'Other Formal Community Service / Volunteerism Recognition',
                ],
                'scope_required' => false,
                'scopes' => $genericScopes,
                'organization_required' => false,
            ],

            'S06-CHURCH_MINISTRY' => [
                'types' => [
                    'Church / Ministry Award',
                    'Church / Ministry Citation',
                    'Other Formal Church / Ministry Recognition',
                ],
                'scope_required' => false,
                'scopes' => $genericScopes,
                'organization_required' => false,
            ],

            'S06-CAMPUS_JOURNALISM' => [
                'types' => [
                    'Campus Journalism Award',
                    'Campus Journalism Citation',
                    'Other Formal Campus Journalism Recognition',
                ],
                'scope_required' => false,
                'scopes' => $genericScopes,
                'organization_required' => false,
            ],

            'S06-SPORTS' => [
                'types' => [
                    'Individual Performance Recognition',
                    'Sportsmanship / Character Recognition',
                    'Team / Squad Recognition',
                    'Selection / Representative Recognition',
                    'Leadership Recognition in Sports',
                    'Special / Other Sports Recognition',
                ],
                'scope_required' => false,
                'scopes' => $extendedScopes,
                'organization_required' => false,
            ],

            'S06-SOCIO_CULTURAL_PERFORMING_ARTS' => [
                'types' => [
                    'Individual Performance Recognition',
                    'Group / Ensemble Recognition',
                    'Artistic / Creative Contribution Recognition',
                    'Leadership / Direction Recognition',
                    'Representation / Selection Recognition',
                    'Special / Other Socio-Cultural / Performing Arts Recognition',
                ],
                'scope_required' => true,
                'scopes' => $extendedScopes,
                'organization_required' => false,
            ],

            'S06-OTHER_NON_ACADEMIC_RECOGNITION' => [
                'types' => [
                    'Achievement / Merit Recognition',
                    'Character / Values Recognition',
                    'Service / Contribution Recognition',
                    'Special / Honorary Recognition',
                    'Other Formal Non-Academic Recognition',
                ],
                'scope_required' => true,
                'scopes' => $extendedScopes,
                'organization_required' => false,
            ],
        ];

        if (! isset($contractRules[$contractCode])) {
            throw new RuntimeException(
                'STUDENT_RECOGNITION_CONTRACT_UNSUPPORTED:' . $contractCode
            );
        }

        $rules = $contractRules[$contractCode];

        if (
            ! array_key_exists('recognition_citation_type', $payload)
            || trim((string) $payload['recognition_citation_type']) === ''
        ) {
            throw new RuntimeException(
                'STUDENT_RECOGNITION_REQUIRED_FIELD_MISSING:recognition_citation_type'
            );
        }

        $recognitionType = trim(
            (string) $payload['recognition_citation_type']
        );

        if (! in_array($recognitionType, $rules['types'], true)) {
            throw new RuntimeException(
                'STUDENT_RECOGNITION_TYPE_INVALID'
            );
        }

        $payload['recognition_citation_type'] = $recognitionType;

        $scope = array_key_exists('recognition_scope_level', $payload)
            ? trim((string) $payload['recognition_scope_level'])
            : '';

        if ($rules['scope_required']) {
            if ($scope === '') {
                throw new RuntimeException(
                    'STUDENT_RECOGNITION_REQUIRED_FIELD_MISSING:recognition_scope_level'
                );
            }

            if (! in_array($scope, $rules['scopes'], true)) {
                throw new RuntimeException(
                    'STUDENT_RECOGNITION_SCOPE_INVALID'
                );
            }

            $payload['recognition_scope_level'] = $scope;
        } else {
            if ($scope === '') {
                if (array_key_exists('recognition_scope_level', $payload)) {
                    $payload['recognition_scope_level'] = null;
                }
            } else {
                if (! in_array($scope, $rules['scopes'], true)) {
                    throw new RuntimeException(
                        'STUDENT_RECOGNITION_SCOPE_INVALID'
                    );
                }

                $payload['recognition_scope_level'] = $scope;
            }
        }

        if (
            ! array_key_exists('granting_body_name', $payload)
            || trim((string) $payload['granting_body_name']) === ''
        ) {
            throw new RuntimeException(
                'STUDENT_RECOGNITION_REQUIRED_FIELD_MISSING:granting_body_name'
            );
        }

        $payload['granting_body_name'] = trim(
            (string) $payload['granting_body_name']
        );

        if (
            ! array_key_exists('recognition_title_name', $payload)
            || trim((string) $payload['recognition_title_name']) === ''
        ) {
            throw new RuntimeException(
                'STUDENT_RECOGNITION_REQUIRED_FIELD_MISSING:recognition_title_name'
            );
        }

        $payload['recognition_title_name'] = trim(
            (string) $payload['recognition_title_name']
        );

        if (
            ! array_key_exists('recognition_date', $payload)
            || trim((string) $payload['recognition_date']) === ''
        ) {
            throw new RuntimeException(
                'STUDENT_RECOGNITION_REQUIRED_FIELD_MISSING:recognition_date'
            );
        }

        $recognitionDate = trim(
            (string) $payload['recognition_date']
        );

        $date = \DateTimeImmutable::createFromFormat(
            '!Y-m-d',
            $recognitionDate
        );

        $dateErrors = \DateTimeImmutable::getLastErrors();

        if (
            $date === false
            || (
                is_array($dateErrors)
                && (
                    ($dateErrors['warning_count'] ?? 0) > 0
                    || ($dateErrors['error_count'] ?? 0) > 0
                )
            )
            || $date->format('Y-m-d') !== $recognitionDate
        ) {
            throw new RuntimeException(
                'STUDENT_RECOGNITION_DATE_INVALID'
            );
        }

        if (
            in_array(
                $contractCode,
                [
                    'S06-SPORTS',
                    'S06-SOCIO_CULTURAL_PERFORMING_ARTS',
                    'S06-OTHER_NON_ACADEMIC_RECOGNITION',
                ],
                true
            )
            && $date > new \DateTimeImmutable('today')
        ) {
            throw new RuntimeException(
                'STUDENT_RECOGNITION_DATE_FUTURE'
            );
        }

        $payload['recognition_date'] = $recognitionDate;

        $organizationName = array_key_exists(
            'recognized_organization_name',
            $payload
        )
            ? trim((string) $payload['recognized_organization_name'])
            : '';

        if ($rules['organization_required']) {
            if ($organizationName === '') {
                throw new RuntimeException(
                    'STUDENT_RECOGNITION_REQUIRED_FIELD_MISSING:recognized_organization_name'
                );
            }

            $payload['recognized_organization_name'] = $organizationName;
        } else {
            if ($organizationName !== '') {
                throw new RuntimeException(
                    'STUDENT_RECOGNITION_ORGANIZATION_NOT_ALLOWED'
                );
            }

            if (
                array_key_exists(
                    'recognized_organization_name',
                    $payload
                )
            ) {
                $payload['recognized_organization_name'] = null;
            }
        }

        if (array_key_exists('additional_notes', $payload)) {
            $notes = trim((string) $payload['additional_notes']);

            $payload['additional_notes'] = $notes !== ''
                ? $notes
                : null;
        }

        return $payload;
    }
    private function requireNonBlankText(
        array $payload,
        string $field,
        string $errorCode
    ): string {
        if (
            ! array_key_exists($field, $payload)
            || trim((string) $payload[$field]) === ''
        ) {
            throw new RuntimeException(
                $errorCode . ':' . $field
            );
        }

        return trim((string) $payload[$field]);
    }

    private function requireIntegerField(
        array $payload,
        string $field,
        string $requiredError,
        string $invalidError
    ): int {
        if (! array_key_exists($field, $payload)) {
            throw new RuntimeException($requiredError);
        }

        $value = filter_var(
            $payload[$field],
            FILTER_VALIDATE_INT
        );

        if ($value === false) {
            throw new RuntimeException($invalidError);
        }

        return $value;
    }

    private function requireControlledValue(
        array $payload,
        string $field,
        array $allowedValues,
        string $requiredError,
        string $invalidError
    ): string {
        if (
            ! array_key_exists($field, $payload)
            || trim((string) $payload[$field]) === ''
        ) {
            throw new RuntimeException($requiredError);
        }

        $value = strtoupper(trim((string) $payload[$field]));

        if (! in_array($value, $allowedValues, true)) {
            throw new RuntimeException($invalidError);
        }

        return $value;
    }

    private function hasOrganizationPeriodData(array $payload): bool
    {
        foreach (
            [
                'period_start_year',
                'period_start_month',
                'period_start_day',
                'period_end_year',
                'period_end_month',
                'period_end_day',
                'period_precision',
                'source_period_text',
            ] as $field
        ) {
            if (
                array_key_exists($field, $payload)
                && $payload[$field] !== null
                && trim((string) $payload[$field]) !== ''
            ) {
                return true;
            }
        }

        return false;
    }

    private function validateOrganizationPeriod(
        array $payload,
        bool $required
    ): array {
        $hasPeriod = $this->hasOrganizationPeriodData($payload);

        if (! $hasPeriod) {
            if ($required) {
                throw new RuntimeException(
                    'STUDENT_ORGANIZATION_PERIOD_REQUIRED'
                );
            }

            return $payload;
        }

        if (
            ! array_key_exists('period_precision', $payload)
            || trim((string) $payload['period_precision']) === ''
        ) {
            throw new RuntimeException(
                'STUDENT_ORGANIZATION_PERIOD_PRECISION_REQUIRED'
            );
        }

        $precision = strtoupper(
            trim((string) $payload['period_precision'])
        );

        if (! in_array($precision, ['DATE', 'RANGE'], true)) {
            throw new RuntimeException(
                'STUDENT_ORGANIZATION_PERIOD_PRECISION_INVALID'
            );
        }

        $payload['period_precision'] = $precision;

        foreach (
            [
                'period_start_year',
                'period_start_month',
                'period_start_day',
            ] as $field
        ) {
            $payload[$field] = $this->requireIntegerField(
                $payload,
                $field,
                'STUDENT_ORGANIZATION_PERIOD_START_REQUIRED:' . $field,
                'STUDENT_ORGANIZATION_PERIOD_VALUE_INVALID:' . $field
            );
        }

        if (
            $payload['period_start_month'] < 1
            || $payload['period_start_month'] > 12
        ) {
            throw new RuntimeException(
                'STUDENT_ORGANIZATION_PERIOD_VALUE_INVALID:period_start_month'
            );
        }

        if (
            $payload['period_start_day'] < 1
            || $payload['period_start_day'] > 31
        ) {
            throw new RuntimeException(
                'STUDENT_ORGANIZATION_PERIOD_VALUE_INVALID:period_start_day'
            );
        }

        $endFields = [
            'period_end_year',
            'period_end_month',
            'period_end_day',
        ];

        if ($precision === 'DATE') {
            foreach ($endFields as $field) {
                if (
                    array_key_exists($field, $payload)
                    && $payload[$field] !== null
                    && trim((string) $payload[$field]) !== ''
                ) {
                    throw new RuntimeException(
                        'STUDENT_ORGANIZATION_DATE_END_NOT_ALLOWED'
                    );
                }

                if (array_key_exists($field, $payload)) {
                    $payload[$field] = null;
                }
            }
        } else {
            foreach ($endFields as $field) {
                $payload[$field] = $this->requireIntegerField(
                    $payload,
                    $field,
                    'STUDENT_ORGANIZATION_PERIOD_END_REQUIRED:' . $field,
                    'STUDENT_ORGANIZATION_PERIOD_VALUE_INVALID:' . $field
                );
            }

            if (
                $payload['period_end_month'] < 1
                || $payload['period_end_month'] > 12
            ) {
                throw new RuntimeException(
                    'STUDENT_ORGANIZATION_PERIOD_VALUE_INVALID:period_end_month'
                );
            }

            if (
                $payload['period_end_day'] < 1
                || $payload['period_end_day'] > 31
            ) {
                throw new RuntimeException(
                    'STUDENT_ORGANIZATION_PERIOD_VALUE_INVALID:period_end_day'
                );
            }
        }

        if (array_key_exists('source_period_text', $payload)) {
            $source = trim((string) $payload['source_period_text']);

            $payload['source_period_text']
                = $source !== '' ? $source : null;
        }

        return $payload;
    }
}
