<?php

namespace App\Services;

use RuntimeException;

/**
 * Backend-owned renderer metadata for the finalized Student 01-09 contracts.
 *
 * OCR assistance is deliberately not assigned to individual fields until the
 * representative evidence audit is complete. Backend validation remains the
 * authority for submitted values.
 */
final class StudentAchievementFormSchemaRegistry
{
    public const VERSION = 'student-form-schema-1';

    private const CATEGORIES = [
        'LEADERSHIP_POSITION' => 'Leadership Position',
        'ORG_MEMBERSHIP_PARTICIPATION'
            => 'Organization Membership / Participation',
        'COMMUNITY_SERVICE_VOLUNTEERISM'
            => 'Community Service / Volunteerism',
        'CHURCH_MINISTRY_INVOLVEMENT'
            => 'Church / Ministry Involvement',
        'SEMINAR_TRAINING' => 'Seminar / Training',
        'CITATION_RECOGNITION' => 'Citation / Recognition',
        'SPORTS' => 'Sports',
        'SOCIO_CULTURAL_PERFORMING_ARTS'
            => 'Socio-Cultural / Performing Arts',
        'CAMPUS_JOURNALISM' => 'Campus Journalism',
    ];

    private const CONTRACTS = [
        'S01-SSG' => ['SSG / University Student Government Leadership', 'LEADERSHIP_POSITION'],
        'S01-COLLEGE_COUNCIL' => ['Collegiate / College Council Leadership', 'LEADERSHIP_POSITION'],
        'S01-CLUB_ORGANIZATION' => ['Club / Organization Leadership', 'LEADERSHIP_POSITION'],
        'S01-YEAR_LEVEL' => ['Year-Level Leadership', 'LEADERSHIP_POSITION'],
        'S02-GENERAL_MEMBER' => ['General Member', 'ORG_MEMBERSHIP_PARTICIPATION'],
        'S02-COMMITTEE_MEMBER' => ['Committee Member', 'ORG_MEMBERSHIP_PARTICIPATION'],
        'S02-ACTIVITY_PARTICIPANT' => ['Activity Participant', 'ORG_MEMBERSHIP_PARTICIPATION'],
        'S02-FACILITATOR_ORGANIZER' => ['Facilitator / Organizer', 'ORG_MEMBERSHIP_PARTICIPATION'],
        'S02-PROJECT_CONTRIBUTOR' => ['Project Contributor', 'ORG_MEMBERSHIP_PARTICIPATION'],
        'S03-UNIVERSITY_BASED_SERVICE' => ['School / University-Based Service', 'COMMUNITY_SERVICE_VOLUNTEERISM'],
        'S03-COMMUNITY_BASED_SERVICE' => ['Community-Based Service', 'COMMUNITY_SERVICE_VOLUNTEERISM'],
        'S03-CHURCH_BASED_SERVICE' => ['Church-Based Service', 'COMMUNITY_SERVICE_VOLUNTEERISM'],
        'S03-ENVIRONMENTAL_SERVICE' => ['Environmental Service', 'COMMUNITY_SERVICE_VOLUNTEERISM'],
        'S03-PEOPLE_DEVELOPMENT_EDUCATIONAL_SERVICE' => ['People Development / Educational Service', 'COMMUNITY_SERVICE_VOLUNTEERISM'],
        'S04-CAMPUS_MINISTRY' => ['Campus Ministry', 'CHURCH_MINISTRY_INVOLVEMENT'],
        'S04-PARISH_CHURCH_MINISTRY' => ['Parish / Church Ministry', 'CHURCH_MINISTRY_INVOLVEMENT'],
        'S04-CHURCH_ORGANIZATION' => ['Church Organization', 'CHURCH_MINISTRY_INVOLVEMENT'],
        'S04-INITIATED_CHURCH_RELATED_ACTIVITY' => ['Initiated Church-Related Activity', 'CHURCH_MINISTRY_INVOLVEMENT'],
        'S05-LEADERSHIP_DEVELOPMENT' => ['Leadership Development', 'SEMINAR_TRAINING'],
        'S05-PERSONAL_PROFESSIONAL_DEVELOPMENT' => ['Personal / Professional Development', 'SEMINAR_TRAINING'],
        'S05-CAMPUS_JOURNALISM_DEVELOPMENT' => ['Campus Journalism Development', 'SEMINAR_TRAINING'],
        'S05-SPORTS_DEVELOPMENT' => ['Sports Development', 'SEMINAR_TRAINING'],
        'S05-SOCIO_CULTURAL_PERFORMING_ARTS_DEVELOPMENT' => ['Socio-Cultural / Performing Arts Development', 'SEMINAR_TRAINING'],
        'S05-COMMUNITY_SERVICE_VOLUNTEER_DEVELOPMENT' => ['Community Service / Volunteer Development', 'SEMINAR_TRAINING'],
        'S05-SPIRITUAL_FORMATION_DEVELOPMENT' => ['Spiritual / Formation Development', 'SEMINAR_TRAINING'],
        'S05-OTHER_SEMINAR_TRAINING' => ['Other Seminar / Training', 'SEMINAR_TRAINING'],
        'S06-LEADERSHIP' => ['Leadership Recognition', 'CITATION_RECOGNITION'],
        'S06-ORGANIZATION_MEMBERSHIP' => ['Organization / Membership Recognition', 'CITATION_RECOGNITION'],
        'S06-COMMUNITY_SERVICE_VOLUNTEERISM' => ['Community Service / Volunteerism Recognition', 'CITATION_RECOGNITION'],
        'S06-CHURCH_MINISTRY' => ['Church / Ministry Recognition', 'CITATION_RECOGNITION'],
        'S06-CAMPUS_JOURNALISM' => ['Campus Journalism Recognition', 'CITATION_RECOGNITION'],
        'S06-SPORTS' => ['Sports Recognition', 'CITATION_RECOGNITION'],
        'S06-SOCIO_CULTURAL_PERFORMING_ARTS' => ['Socio-Cultural / Performing Arts Recognition', 'CITATION_RECOGNITION'],
        'S06-OTHER_NON_ACADEMIC_RECOGNITION' => ['Other Non-Academic Recognition', 'CITATION_RECOGNITION'],
        'S07-BASKETBALL' => ['Basketball', 'SPORTS'],
        'S07-VOLLEYBALL' => ['Volleyball', 'SPORTS'],
        'S07-ATHLETICS' => ['Athletics', 'SPORTS'],
        'S07-SWIMMING' => ['Swimming', 'SPORTS'],
        'S07-BADMINTON' => ['Badminton', 'SPORTS'],
        'S07-TABLE_TENNIS' => ['Table Tennis', 'SPORTS'],
        'S07-CHESS' => ['Chess', 'SPORTS'],
        'S07-FOOTBALL' => ['Football', 'SPORTS'],
        'S07-SEPAK_TAKRAW' => ['Sepak Takraw', 'SPORTS'],
        'S07-OTHER_APPROVED_SPORT' => ['Other Approved Sport', 'SPORTS'],
        'S08-DANCE' => ['Dance', 'SOCIO_CULTURAL_PERFORMING_ARTS'],
        'S08-VOCAL_SINGING' => ['Vocal / Singing', 'SOCIO_CULTURAL_PERFORMING_ARTS'],
        'S08-INSTRUMENTAL' => ['Instrumental', 'SOCIO_CULTURAL_PERFORMING_ARTS'],
        'S08-THEATER' => ['Theater', 'SOCIO_CULTURAL_PERFORMING_ARTS'],
        'S08-CULTURAL_PERFORMANCE' => ['Cultural Performance', 'SOCIO_CULTURAL_PERFORMING_ARTS'],
        'S08-PERFORMING_ARTS' => ['Performing Arts', 'SOCIO_CULTURAL_PERFORMING_ARTS'],
        'S08-OTHER_APPROVED_DISCIPLINE' => ['Other Approved Discipline', 'SOCIO_CULTURAL_PERFORMING_ARTS'],
        'S09-NEWS_ITEM' => ['News Item', 'CAMPUS_JOURNALISM'],
        'S09-LITERARY_WORK' => ['Literary Work', 'CAMPUS_JOURNALISM'],
        'S09-COLUMN' => ['Column', 'CAMPUS_JOURNALISM'],
        'S09-EDITORIAL' => ['Editorial', 'CAMPUS_JOURNALISM'],
        'S09-PUBLICATION_MEMBER_CONTRIBUTOR' => ['Publication Member / Contributor', 'CAMPUS_JOURNALISM'],
        'S09-PUBLICATION_OFFICER' => ['Publication Officer', 'CAMPUS_JOURNALISM'],
    ];

    public function all(): array
    {
        $categories = [];

        foreach (self::CATEGORIES as $code => $label) {
            $categories[$code] = [
                'code' => $code,
                'label' => $label,
                'subcategories' => [],
            ];
        }

        foreach (self::CONTRACTS as $code => [$label, $categoryCode]) {
            $categories[$categoryCode]['subcategories'][] = $this->get($code);
        }

        return [
            'schema_version' => self::VERSION,
            'source' => 'student_master_tracker_finalized_contracts',
            'ocr_field_mapping_status'
                => 'representative_evidence_audit_pending',
            'evidence' => [
                'required' => true,
                'control' => 'file',
                'supported_types_status'
                    => 'upload_boundary_integration_pending',
            ],
            'categories' => array_values($categories),
        ];
    }

    public function get(string $contractCode): array
    {
        $contractCode = strtoupper(trim($contractCode));

        if (! isset(self::CONTRACTS[$contractCode])) {
            throw new RuntimeException(
                'STUDENT_FORM_SCHEMA_CONTRACT_NOT_FOUND'
            );
        }

        [$label, $categoryCode] = self::CONTRACTS[$contractCode];

        return [
            'contract_code' => $contractCode,
            'label' => $label,
            'category_code' => $categoryCode,
            'category_label' => self::CATEGORIES[$categoryCode],
            'fields' => $this->fieldsFor($contractCode),
        ];
    }

    public function supportedContractCodes(): array
    {
        return array_keys(self::CONTRACTS);
    }

    public function assertMatchesActiveContractRows(array $rows): void
    {
        $catalog = [];

        foreach ($rows as $row) {
            $code = strtoupper(trim((string) ($row['contract_code'] ?? '')));

            if ($code === '' || isset($catalog[$code])) {
                throw new RuntimeException(
                    'STUDENT_FORM_SCHEMA_CONTRACT_CATALOG_MISMATCH'
                );
            }

            $catalog[$code] = $row;
        }

        if (count($catalog) !== count(self::CONTRACTS)) {
            throw new RuntimeException(
                'STUDENT_FORM_SCHEMA_CONTRACT_CATALOG_MISMATCH'
            );
        }

        foreach (self::CONTRACTS as $code => [$label, $categoryCode]) {
            $row = $catalog[$code] ?? null;

            if (
                $row === null
                || trim((string) ($row['display_name'] ?? '')) !== $label
                || strtoupper(trim((string) ($row['category_code'] ?? '')))
                    !== $categoryCode
            ) {
                throw new RuntimeException(
                    'STUDENT_FORM_SCHEMA_CONTRACT_CATALOG_MISMATCH'
                );
            }
        }
    }

    private function fieldsFor(string $code): array
    {
        $prefix = substr($code, 0, 3);

        return match ($prefix) {
            'S01' => $this->leadershipFields($code),
            'S02' => $this->organizationFields($code),
            'S03' => $this->serviceFields($code),
            'S04' => $this->churchFields($code),
            'S05' => $this->seminarFields($code),
            'S06' => $this->recognitionFields($code),
            'S07' => $this->sportsFields($code),
            'S08' => $this->socioCulturalFields($code),
            'S09' => $this->journalismFields($code),
            default => throw new RuntimeException(
                'STUDENT_FORM_SCHEMA_FAMILY_NOT_FOUND'
            ),
        };
    }

    private function leadershipFields(string $code): array
    {
        $fields = [
            $this->field('governing_body_name', 'Organization / Governing Body', 'text', true),
            $this->field('position_held', 'Position Held', 'text', true),
            $this->field('academic_year_start', 'Academic Year / Inclusive Years', 'academic_year', true, [], [
                'end_year_rule' => 'start_year_plus_one',
                'maximum_start_year' => 'current_calendar_year',
            ]),
        ];

        if ($code === 'S01-YEAR_LEVEL') {
            $fields[] = $this->field(
                'represented_year_level',
                'Represented Year Level',
                'text',
                true
            );
        }

        $fields[] = $this->notes();

        return $fields;
    }

    private function organizationFields(string $code): array
    {
        $fields = [
            $this->field('organization_name', 'Organization Name', 'text', true),
        ];

        if ($code === 'S02-GENERAL_MEMBER') {
            $fields[] = $this->field(
                'academic_year_start',
                'Academic Year / Inclusive Years',
                'academic_year',
                true,
                [],
                ['end_year_rule' => 'start_year_plus_one']
            );
        } elseif ($code === 'S02-COMMITTEE_MEMBER') {
            $fields[] = $this->field('committee_name', 'Committee Name', 'text', true);
            $fields[] = $this->field('academic_year_start', 'Academic Year / Inclusive Years', 'academic_year', true, [], ['end_year_rule' => 'start_year_plus_one']);
            $fields[] = $this->field('related_activity_title', 'Related Activity / Program Title', 'text', false);
            $fields[] = $this->field('responsibility_assignment', 'Responsibility / Assignment', 'textarea', false);
            $fields[] = $this->period(false, ['related_activity_title' => 'non_blank_or_period_present']);
        } elseif ($code === 'S02-ACTIVITY_PARTICIPANT') {
            $fields[] = $this->field('activity_program_title', 'Activity / Program Title', 'text', true);
            $fields[] = $this->field('activity_type', 'Activity Type', 'select', true, [
                'ORGANIZATION_ACTIVITY_PROGRAM', 'OUTREACH_EXTENSION',
                'EXTRA_CURRICULAR', 'CO_CURRICULAR',
            ]);
            $fields[] = $this->period(true);
        } elseif ($code === 'S02-FACILITATOR_ORGANIZER') {
            $fields[] = $this->field('activity_program_title', 'Activity / Program Title', 'text', true);
            $fields[] = $this->field('activity_type', 'Activity Type', 'select', true, [
                'ORGANIZATION_ACTIVITY_PROGRAM', 'OUTREACH_EXTENSION',
                'EXTRA_CURRICULAR', 'CO_CURRICULAR',
            ]);
            $fields[] = $this->field('contribution_role', 'Contribution Role', 'select', true, [
                'FACILITATOR', 'ORGANIZER', 'FACILITATOR_AND_ORGANIZER',
            ]);
            $fields[] = $this->period(true);
        } else {
            $fields[] = $this->field('project_initiative_title', 'Project / Initiative Title', 'text', true);
            $fields[] = $this->field('contribution_type', 'Contribution Type', 'select', true, [
                'CONTRIBUTOR_SUPPORT_ROLE', 'MAJOR_PROJECT_RESPONSIBILITY',
            ]);
            $fields[] = $this->field('contribution_description', 'Contribution Description', 'textarea', true);
            $fields[] = $this->period(true);
        }

        $fields[] = $this->notes();

        return $fields;
    }

    private function serviceFields(string $code): array
    {
        $fields = [
            $this->field('service_activity_project_title', 'Service Activity / Project Title', 'text', true),
            $this->field('activity_role', 'Activity Role', 'select', true, [
                'PARTICIPANT', 'VOLUNTEER', 'ORGANIZER', 'INITIATOR', 'LEADER',
            ]),
        ];

        if ($code === 'S03-UNIVERSITY_BASED_SERVICE') {
            $fields[] = $this->field('university_unit_or_office', 'School / University Unit or Office', 'text', true);
        } elseif ($code === 'S03-COMMUNITY_BASED_SERVICE') {
            $fields[] = $this->field('organizer_implementing_body', 'Organizer / Implementing Body', 'text', true);
            $fields[] = $this->field('civic_scope', 'Civic Scope', 'select', false, [
                'BARANGAY', 'MUNICIPAL', 'PROVINCIAL', 'NATIONAL',
            ]);
        } elseif ($code === 'S03-CHURCH_BASED_SERVICE') {
            $fields[] = $this->field('church_parish_ministry_organization', 'Church / Parish / Ministry / Organization', 'text', true);
            $fields[] = $this->field('organizer_implementing_body', 'Organizer / Implementing Body', 'text', true);
        } else {
            $fields[] = $this->field('organizer_implementing_body', 'Organizer / Implementing Body', 'text', true);
        }

        $fields[] = $this->field('partner_organization', 'Partner Organization', 'text', false);

        if ($code !== 'S03-UNIVERSITY_BASED_SERVICE') {
            $fields[] = $this->field('service_location_or_context', 'Service Location / Context', 'text', $code === 'S03-COMMUNITY_BASED_SERVICE');
        }

        $fields[] = $this->field('beneficiary_group', 'Beneficiary Group', 'text', false);
        $fields[] = $this->period(true, [], false);
        $fields[] = $this->field('service_hours', 'Service Hours', 'decimal', false, [], [
            'visible_when' => ['period_precision' => 'DATE'],
            'minimum_exclusive' => 0,
            'maximum' => 9999.99,
            'decimal_places' => 2,
        ]);
        $fields[] = $this->notes();

        return $fields;
    }

    private function churchFields(string $code): array
    {
        if ($code === 'S04-INITIATED_CHURCH_RELATED_ACTIVITY') {
            return [
                $this->field('activity_initiative_title', 'Activity / Initiative Title', 'text', true),
                $this->field('initiation_role', 'Initiation Role', 'select', true, [
                    'INITIATOR', 'CO_INITIATOR', 'PRINCIPAL_ORGANIZER',
                    'CO_PRINCIPAL_ORGANIZER', 'OTHER_VERIFIED_INITIATION_ROLE',
                ]),
                $this->field('specified_initiation_role', 'Specify Initiation Role', 'text', false, [], ['required_when' => ['initiation_role' => 'OTHER_VERIFIED_INITIATION_ROLE']]),
                $this->field('official_role_responsibility', 'Official Role / Responsibility', 'text', false),
                $this->field('church_ministry_context_affiliation', 'Church / Ministry Context or Affiliation', 'text', true),
                $this->dateRange('activity', 'Activity Date / Period', true),
                $this->notes(),
            ];
        }

        $types = match ($code) {
            'S04-CAMPUS_MINISTRY' => [
                'Member / Regular Ministry Involvement', 'Activity Participant',
                'Ministry Volunteer / Service Role', 'Facilitator / Organizer',
                'Other Campus Ministry Involvement',
            ],
            'S04-PARISH_CHURCH_MINISTRY' => [
                'Member / Regular Ministry Involvement', 'Activity Participant',
                'Ministry Function / Assigned Responsibility',
                'Facilitator / Organizer',
                'Other Parish / Church Ministry Involvement',
            ],
            default => [
                'Member / Regular Organization Involvement',
                'Activity Participant', 'Committee / Working Group Involvement',
                'Facilitator / Organizer',
                'Other Church Organization Involvement',
            ],
        };

        $otherType = $types[count($types) - 1];
        $fields = [
            $this->field('ministry_or_organization_name', 'Ministry / Organization Name', 'text', true),
            $this->field('specified_ministry_or_organization', 'Specified Ministry / Organization', 'text', false),
            $this->field('involvement_type', 'Involvement Type', 'select', true, $types),
            $this->field('specified_involvement_type', 'Specify Involvement Type', 'text', false, [], ['required_when' => ['involvement_type' => $otherType]]),
        ];

        if ($code === 'S04-CHURCH_ORGANIZATION') {
            $fields[] = $this->field('committee_working_group_name', 'Committee / Working Group Name', 'text', false, [], ['required_when' => ['involvement_type' => 'Committee / Working Group Involvement']]);
        }

        $fields[] = $this->field('involvement_activity_title', 'Involvement Activity Title', 'text', $code !== 'S04-CHURCH_ORGANIZATION', [], $code === 'S04-CHURCH_ORGANIZATION' ? ['required_when' => ['record_mode' => 'ACTIVITY']] : []);
        $fields[] = $this->field('role_position', 'Role / Position', 'text', $code === 'S04-CAMPUS_MINISTRY');
        $fields[] = $this->field('specified_role_position', 'Specify Other Official Role / Position', 'text', false, [], ['required_when' => ['role_position' => 'Other Official Role / Position']]);
        $fields[] = $this->recordMode();
        $fields[] = $this->notes();

        return $fields;
    }

    private function seminarFields(string $code): array
    {
        $types = ['SEMINAR', 'WORKSHOP', 'TRAINING', 'CONFERENCE', 'CONGRESS', 'CERTIFICATION'];

        if ($code === 'S05-SPIRITUAL_FORMATION_DEVELOPMENT') {
            $types[] = 'RETREAT';
            $types[] = 'RECOLLECTION';
        }

        return [
            $this->field('activity_type', 'Activity Type', 'select', true, $types),
            $this->field('activity_program_title', 'Activity / Program Title', 'text', true),
            $this->field('organizer_issuing_organization', 'Organizer / Issuing Organization', 'text', true),
            $this->dateRange('activity', 'Activity Date / Period', true),
            $this->notes(),
        ];
    }

    private function recognitionFields(string $code): array
    {
        $genericScopes = ['Local', 'Regional', 'National', 'International'];
        $extendedScopes = [
            'Institutional / School', 'Local / City / Municipal', 'Provincial',
            'Regional', 'National', 'International',
            'Not Applicable / No Formal Level',
        ];
        $rules = [
            'S06-LEADERSHIP' => [['Leadership Award', 'Leadership Citation', 'Other Formal Leadership Recognition'], false, $genericScopes],
            'S06-ORGANIZATION_MEMBERSHIP' => [['Organization / Membership Award', 'Organization / Membership Citation', 'Other Formal Organization / Membership Recognition'], false, $genericScopes],
            'S06-COMMUNITY_SERVICE_VOLUNTEERISM' => [['Community Service / Volunteerism Award', 'Community Service / Volunteerism Citation', 'Other Formal Community Service / Volunteerism Recognition'], false, $genericScopes],
            'S06-CHURCH_MINISTRY' => [['Church / Ministry Award', 'Church / Ministry Citation', 'Other Formal Church / Ministry Recognition'], false, $genericScopes],
            'S06-CAMPUS_JOURNALISM' => [['Campus Journalism Award', 'Campus Journalism Citation', 'Other Formal Campus Journalism Recognition'], false, $genericScopes],
            'S06-SPORTS' => [['Individual Performance Recognition', 'Sportsmanship / Character Recognition', 'Team / Squad Recognition', 'Selection / Representative Recognition', 'Leadership Recognition in Sports', 'Special / Other Sports Recognition'], false, $extendedScopes],
            'S06-SOCIO_CULTURAL_PERFORMING_ARTS' => [['Individual Performance Recognition', 'Group / Ensemble Recognition', 'Artistic / Creative Contribution Recognition', 'Leadership / Direction Recognition', 'Representation / Selection Recognition', 'Special / Other Socio-Cultural / Performing Arts Recognition'], true, $extendedScopes],
            'S06-OTHER_NON_ACADEMIC_RECOGNITION' => [['Achievement / Merit Recognition', 'Character / Values Recognition', 'Service / Contribution Recognition', 'Special / Honorary Recognition', 'Other Formal Non-Academic Recognition'], true, $extendedScopes],
        ];
        [$types, $scopeRequired, $scopes] = $rules[$code];
        $fields = [
            $this->field('recognition_citation_type', 'Recognition / Citation Type', 'select', true, $types),
            $this->field('recognition_scope_level', 'Recognition Scope / Level', 'select', $scopeRequired, $scopes),
            $this->field('granting_body_name', 'Granting Body Name', 'text', true),
            $this->field('recognition_title_name', 'Recognition Title / Name', 'text', true),
            $this->field('recognition_date', 'Recognition Date', 'date', true, [], [
                'future_dates_allowed' => ! in_array($code, ['S06-SPORTS', 'S06-SOCIO_CULTURAL_PERFORMING_ARTS', 'S06-OTHER_NON_ACADEMIC_RECOGNITION'], true),
            ]),
        ];

        if ($code === 'S06-ORGANIZATION_MEMBERSHIP') {
            $fields[] = $this->field('recognized_organization_name', 'Recognized Organization Name', 'text', true);
        }

        $fields[] = $this->notes();

        return $fields;
    }

    private function sportsFields(string $code): array
    {
        $discipline = substr($code, 4);

        return [
            $this->fixed('sport_discipline', 'Sport Discipline', $discipline),
            $this->field('specified_sport_discipline', 'Specify Sport Discipline', 'text', false, [], ['required_when' => ['sport_discipline' => 'OTHER_APPROVED_SPORT']]),
            $this->field('event_type_competition', 'Event Type / Competition', 'select', true, ['PRISAA', 'NDEA', 'INTRAMURALS_UNIVERSITY_MEET', 'OTHER_APPROVED_COMPETITION']),
            $this->field('specified_competition_meet', 'Specify Competition / Meet', 'text', false, [], ['required_when' => ['event_type_competition' => 'OTHER_APPROVED_COMPETITION']]),
            $this->field('competition_level', 'Competition Level', 'select', false, ['LOCAL', 'REGIONAL', 'NATIONAL'], ['required_when' => ['event_type_competition' => 'PRISAA'], 'forbidden_when' => ['event_type_competition' => ['NDEA', 'INTRAMURALS_UNIVERSITY_MEET']]]),
            $this->field('participation_type', 'Participation Type', 'select', true, ['INDIVIDUAL', 'TEAM']),
            $this->field('placement_result', 'Placement / Result', 'select', true, ['PARTICIPANT', 'BRONZE_3RD_PLACE', 'SILVER_2ND_PLACE', 'GOLD_1ST_PLACE_CHAMPION']),
            $this->field('competition_event_title', 'Competition / Event Title', 'text', true),
            $this->field('organizer_issuing_organization', 'Organizer / Issuing Organization', 'text', true),
            $this->dateRange('event', 'Competition / Event Date / Period', true),
            $this->notes(),
        ];
    }

    private function socioCulturalFields(string $code): array
    {
        $discipline = substr($code, 4);

        return [
            $this->fixed('discipline', 'Discipline', $discipline),
            $this->field('specified_discipline', 'Specify Discipline', 'text', false, [], ['required_when' => ['discipline' => 'OTHER_APPROVED_DISCIPLINE']]),
            $this->field('event_type', 'Event Type', 'select', true, ['PRISAA', 'NDEA_OR_EQUIVALENT', 'UNIVERSITY_LEVEL_COMPETITION', 'OTHER_APPROVED_EVENT']),
            $this->field('specified_event_type', 'Specify Event Type', 'text', false, [], ['required_when' => ['event_type' => 'OTHER_APPROVED_EVENT']]),
            $this->field('competition_level', 'Competition Level', 'select', false, ['LOCAL', 'REGIONAL', 'NATIONAL'], ['applicability' => 'when_meaningful_for_event_context']),
            $this->field('participation_type', 'Participation Type', 'select', true, ['INDIVIDUAL', 'GROUP_ENSEMBLE']),
            $this->field('placement_result', 'Placement / Result', 'select', true, ['PARTICIPANT', 'BRONZE_3RD_PLACE', 'SILVER_2ND_PLACE', 'GOLD_1ST_PLACE_CHAMPION']),
            $this->field('event_competition_title', 'Event / Competition Title', 'text', true),
            $this->field('organizer_issuing_organization', 'Organizer / Issuing Organization', 'text', true),
            $this->dateRange('event', 'Event / Competition Date / Period', true),
            $this->notes(),
        ];
    }

    private function journalismFields(string $code): array
    {
        $recordType = substr($code, 4);
        $output = in_array($recordType, ['NEWS_ITEM', 'LITERARY_WORK', 'COLUMN', 'EDITORIAL'], true);
        $fields = [
            $this->fixed('record_type', 'Record Type / Subcategory', $recordType),
        ];

        if ($output) {
            $fields[] = $this->field('title_of_work', 'Title of Work', 'text', true);
        }

        $fields[] = $this->field('publication_outlet', 'Publication / Outlet', 'text', true);

        if ($output) {
            $fields[] = $this->field('publication_date', 'Publication Date', 'date', true);
        }

        $fields[] = $this->field('publication_role', 'Publication Role / Student Role', 'text', true);

        if (! $output) {
            $fields[] = $this->dateRange('role', 'Publication Role Date / Period', true);
        }

        $fields[] = $this->notes();

        return $fields;
    }

    private function field(
        string $key,
        string $label,
        string $control,
        bool $required,
        array $options = [],
        array $validation = []
    ): array {
        $field = [
            'key' => $key,
            'payload_keys' => [$key],
            'label' => $label,
            'control' => $control,
            'required' => $required,
            'ocr_assistance' => 'pending_representative_evidence_audit',
        ];

        if ($options !== []) {
            $field['options'] = array_map(
                static fn (string $value): array => [
                    'value' => $value,
                    'label' => $value,
                ],
                $options
            );
        }

        if ($validation !== []) {
            $field['validation'] = $validation;
        }

        return $field;
    }

    private function fixed(string $key, string $label, string $value): array
    {
        return $this->field($key, $label, 'fixed', true, [], [
            'value' => $value,
            'server_enforced' => true,
        ]);
    }

    private function notes(): array
    {
        return $this->field(
            'additional_notes',
            'Additional Notes',
            'textarea',
            false
        );
    }

    private function period(
        bool $required,
        array $validation = [],
        bool $includeSourceText = true
    ): array {
        $startKeys = [
            'period_start_year',
            'period_start_month',
            'period_start_day',
        ];
        $endKeys = [
            'period_end_year',
            'period_end_month',
            'period_end_day',
        ];
        $payloadKeys = array_merge(
            ['period_precision'],
            $startKeys,
            $endKeys,
            $includeSourceText ? ['source_period_text'] : []
        );
        $field = $this->field(
            'period',
            'Date / Period',
            'structured_date_or_range',
            $required,
            [],
            array_merge([
                'precision_key' => 'period_precision',
                'precision_options' => ['DATE', 'RANGE'],
                'start_keys' => $startKeys,
                'end_keys' => $endKeys,
                'end_not_before_start' => true,
            ], $validation)
        );

        if ($includeSourceText) {
            $field['validation']['source_text_key'] = 'source_period_text';
        }

        $field['payload_keys'] = $payloadKeys;

        return $field;
    }

    private function dateRange(
        string $prefix,
        string $label,
        bool $required
    ): array {
        $field = $this->field(
            $prefix . '_date_period',
            $label,
            'date_range',
            $required,
            [],
            [
                'start_key' => $prefix . '_start_date',
                'end_key' => $prefix . '_end_date',
                'end_required' => false,
                'end_not_before_start' => true,
            ]
        );

        $field['payload_keys'] = [
            $prefix . '_start_date',
            $prefix . '_end_date',
        ];

        return $field;
    }

    private function recordMode(): array
    {
        $field = $this->field(
            'record_mode',
            'Record Period',
            'ongoing_academic_year_or_activity_dates',
            true,
            [],
            [
                'modes' => [
                    'ACADEMIC_YEAR' => ['academic_year_start'],
                    'ACTIVITY' => ['activity_start_date', 'activity_end_date'],
                ],
                'exactly_one_mode' => true,
                'activity_end_not_before_start' => true,
            ]
        );

        $field['payload_keys'] = [
            'academic_year_start',
            'activity_start_date',
            'activity_end_date',
        ];

        return $field;
    }
}
