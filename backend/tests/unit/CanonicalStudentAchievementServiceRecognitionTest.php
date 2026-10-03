<?php

namespace Tests\Unit;

use App\Services\CanonicalStudentAchievementService;
use CodeIgniter\Test\CIUnitTestCase;
use ReflectionClass;
use RuntimeException;

final class CanonicalStudentAchievementServiceRecognitionTest extends CIUnitTestCase
{
    /**
     * Invoke the real Student 06 validator without running the service
     * constructor, because the constructor opens a database connection.
     */
    private function validateRecognition(
        string $contractCode,
        array $payload
    ): array {
        $reflection = new ReflectionClass(
            CanonicalStudentAchievementService::class
        );

        /** @var CanonicalStudentAchievementService $service */
        $service = $reflection->newInstanceWithoutConstructor();

        $method = $reflection->getMethod(
            'validateRecognitionPayload'
        );

        $method->setAccessible(true);

        /** @var array $result */
        $result = $method->invoke(
            $service,
            $contractCode,
            $payload
        );

        return $result;
    }

    private function basePayload(
        string $recognitionType
    ): array {
        return [
            'recognition_citation_type' => $recognitionType,
            'granting_body_name' => 'Notre Dame of Marbel University',
            'recognition_date' => '2026-09-01',
            'recognition_title_name' => 'Official Recognition',
            'additional_notes' => 'Verified factual context.',
        ];
    }

    /**
     * @dataProvider validContractPayloads
     */
    public function testAllEightStudent06ContractsAcceptValidPayload(
        string $contractCode,
        array $payload
    ): void {
        $result = $this->validateRecognition(
            $contractCode,
            $payload
        );

        $this->assertSame(
            $payload['recognition_citation_type'],
            $result['recognition_citation_type']
        );

        $this->assertSame(
            'Notre Dame of Marbel University',
            $result['granting_body_name']
        );

        $this->assertSame(
            '2026-09-01',
            $result['recognition_date']
        );

        $this->assertSame(
            'Official Recognition',
            $result['recognition_title_name']
        );
    }

    public static function validContractPayloads(): array
    {
        return [
            'leadership' => [
                'S06-LEADERSHIP',
                [
                    'recognition_citation_type'
                        => 'Leadership Award',
                    'recognition_scope_level'
                        => 'National',
                    'granting_body_name'
                        => 'Notre Dame of Marbel University',
                    'recognition_date'
                        => '2026-09-01',
                    'recognition_title_name'
                        => 'Official Recognition',
                    'additional_notes'
                        => 'Verified factual context.',
                ],
            ],

            'organization membership' => [
                'S06-ORGANIZATION_MEMBERSHIP',
                [
                    'recognition_citation_type'
                        => 'Organization / Membership Citation',
                    'recognition_scope_level'
                        => 'Regional',
                    'granting_body_name'
                        => 'Notre Dame of Marbel University',
                    'recognition_date'
                        => '2026-09-01',
                    'recognition_title_name'
                        => 'Official Recognition',
                    'recognized_organization_name'
                        => 'Example Student Organization',
                    'additional_notes'
                        => 'Verified factual context.',
                ],
            ],

            'community service volunteerism' => [
                'S06-COMMUNITY_SERVICE_VOLUNTEERISM',
                [
                    'recognition_citation_type'
                        => 'Community Service / Volunteerism Award',
                    'recognition_scope_level'
                        => 'Local',
                    'granting_body_name'
                        => 'Notre Dame of Marbel University',
                    'recognition_date'
                        => '2026-09-01',
                    'recognition_title_name'
                        => 'Official Recognition',
                    'additional_notes'
                        => 'Verified factual context.',
                ],
            ],

            'church ministry' => [
                'S06-CHURCH_MINISTRY',
                [
                    'recognition_citation_type'
                        => 'Church / Ministry Citation',
                    'recognition_scope_level'
                        => 'International',
                    'granting_body_name'
                        => 'Notre Dame of Marbel University',
                    'recognition_date'
                        => '2026-09-01',
                    'recognition_title_name'
                        => 'Official Recognition',
                    'additional_notes'
                        => 'Verified factual context.',
                ],
            ],

            'campus journalism' => [
                'S06-CAMPUS_JOURNALISM',
                [
                    'recognition_citation_type'
                        => 'Campus Journalism Award',
                    'recognition_scope_level'
                        => 'National',
                    'granting_body_name'
                        => 'Notre Dame of Marbel University',
                    'recognition_date'
                        => '2026-09-01',
                    'recognition_title_name'
                        => 'Official Recognition',
                    'additional_notes'
                        => 'Verified factual context.',
                ],
            ],

            'sports' => [
                'S06-SPORTS',
                [
                    'recognition_citation_type'
                        => 'Individual Performance Recognition',
                    'recognition_scope_level'
                        => 'Provincial',
                    'granting_body_name'
                        => 'Notre Dame of Marbel University',
                    'recognition_date'
                        => '2026-09-01',
                    'recognition_title_name'
                        => 'Official Recognition',
                    'additional_notes'
                        => 'Verified factual context.',
                ],
            ],

            'socio cultural performing arts' => [
                'S06-SOCIO_CULTURAL_PERFORMING_ARTS',
                [
                    'recognition_citation_type'
                        => 'Group / Ensemble Recognition',
                    'recognition_scope_level'
                        => 'Institutional / School',
                    'granting_body_name'
                        => 'Notre Dame of Marbel University',
                    'recognition_date'
                        => '2026-09-01',
                    'recognition_title_name'
                        => 'Official Recognition',
                    'additional_notes'
                        => 'Verified factual context.',
                ],
            ],

            'other non academic recognition' => [
                'S06-OTHER_NON_ACADEMIC_RECOGNITION',
                [
                    'recognition_citation_type'
                        => 'Achievement / Merit Recognition',
                    'recognition_scope_level'
                        => 'Not Applicable / No Formal Level',
                    'granting_body_name'
                        => 'Notre Dame of Marbel University',
                    'recognition_date'
                        => '2026-09-01',
                    'recognition_title_name'
                        => 'Official Recognition',
                    'additional_notes'
                        => 'Verified factual context.',
                ],
            ],
        ];
    }

    public function testConditionalScopeMayNormalizeBlankToNull(): void
    {
        $payload = $this->basePayload(
            'Leadership Citation'
        );

        $payload['recognition_scope_level'] = '   ';

        $result = $this->validateRecognition(
            'S06-LEADERSHIP',
            $payload
        );

        $this->assertArrayHasKey(
            'recognition_scope_level',
            $result
        );

        $this->assertNull(
            $result['recognition_scope_level']
        );
    }

    /**
     * @dataProvider requiredScopeContracts
     */
    public function testRequiredScopeCannotBeBlank(
        string $contractCode,
        string $recognitionType
    ): void {
        $payload = $this->basePayload(
            $recognitionType
        );

        $payload['recognition_scope_level'] = '   ';

        $this->expectException(RuntimeException::class);

        $this->expectExceptionMessage(
            'STUDENT_RECOGNITION_REQUIRED_FIELD_MISSING:recognition_scope_level'
        );

        $this->validateRecognition(
            $contractCode,
            $payload
        );
    }

    public static function requiredScopeContracts(): array
    {
        return [
            'socio cultural' => [
                'S06-SOCIO_CULTURAL_PERFORMING_ARTS',
                'Individual Performance Recognition',
            ],
            'other non academic' => [
                'S06-OTHER_NON_ACADEMIC_RECOGNITION',
                'Achievement / Merit Recognition',
            ],
        ];
    }

    public function testGenericRecognitionContractRejectsExtendedScope(): void
    {
        $payload = $this->basePayload(
            'Leadership Award'
        );

        $payload['recognition_scope_level']
            = 'Institutional / School';

        $this->expectException(RuntimeException::class);

        $this->expectExceptionMessage(
            'STUDENT_RECOGNITION_SCOPE_INVALID'
        );

        $this->validateRecognition(
            'S06-LEADERSHIP',
            $payload
        );
    }

    public function testSportsAcceptsExtendedScopeVocabulary(): void
    {
        $payload = $this->basePayload(
            'Sportsmanship / Character Recognition'
        );

        $payload['recognition_scope_level']
            = 'Local / City / Municipal';

        $result = $this->validateRecognition(
            'S06-SPORTS',
            $payload
        );

        $this->assertSame(
            'Local / City / Municipal',
            $result['recognition_scope_level']
        );
    }

    public function testOldCityLocalScopeSpellingFailsClosed(): void
    {
        $payload = $this->basePayload(
            'Individual Performance Recognition'
        );

        $payload['recognition_scope_level']
            = 'City / Local';

        $this->expectException(RuntimeException::class);

        $this->expectExceptionMessage(
            'STUDENT_RECOGNITION_SCOPE_INVALID'
        );

        $this->validateRecognition(
            'S06-SPORTS',
            $payload
        );
    }

    public function testOrganizationMembershipRequiresOrganizationClub(): void
    {
        $payload = $this->basePayload(
            'Organization / Membership Award'
        );

        $payload['recognition_scope_level'] = 'Local';

        $this->expectException(RuntimeException::class);

        $this->expectExceptionMessage(
            'STUDENT_RECOGNITION_REQUIRED_FIELD_MISSING:recognized_organization_name'
        );

        $this->validateRecognition(
            'S06-ORGANIZATION_MEMBERSHIP',
            $payload
        );
    }

    public function testOrganizationMembershipAcceptsOrganizationClub(): void
    {
        $payload = $this->basePayload(
            'Organization / Membership Citation'
        );

        $payload['recognized_organization_name']
            = '  Example Organization  ';

        $result = $this->validateRecognition(
            'S06-ORGANIZATION_MEMBERSHIP',
            $payload
        );

        $this->assertSame(
            'Example Organization',
            $result['recognized_organization_name']
        );
    }

    public function testOrganizationClubRejectedForOtherRecognitionContracts(): void
    {
        $payload = $this->basePayload(
            'Leadership Award'
        );

        $payload['recognized_organization_name']
            = 'Should Not Be Here';

        $this->expectException(RuntimeException::class);

        $this->expectExceptionMessage(
            'STUDENT_RECOGNITION_ORGANIZATION_NOT_ALLOWED'
        );

        $this->validateRecognition(
            'S06-LEADERSHIP',
            $payload
        );
    }

    public function testInvalidRecognitionTypeFailsClosed(): void
    {
        $payload = $this->basePayload(
            'Made Up Recognition Type'
        );

        $this->expectException(RuntimeException::class);

        $this->expectExceptionMessage(
            'STUDENT_RECOGNITION_TYPE_INVALID'
        );

        $this->validateRecognition(
            'S06-LEADERSHIP',
            $payload
        );
    }

    public function testRecognitionTypeFromAnotherDomainFailsClosed(): void
    {
        $payload = $this->basePayload(
            'Campus Journalism Award'
        );

        $this->expectException(RuntimeException::class);

        $this->expectExceptionMessage(
            'STUDENT_RECOGNITION_TYPE_INVALID'
        );

        $this->validateRecognition(
            'S06-LEADERSHIP',
            $payload
        );
    }

    /**
     * @dataProvider missingRequiredFieldPayloads
     */
    public function testRequiredRecognitionFieldsCannotBeBlank(
        string $field,
        string $expectedMessage
    ): void {
        $payload = $this->basePayload(
            'Leadership Award'
        );

        $payload[$field] = '   ';

        $this->expectException(RuntimeException::class);

        $this->expectExceptionMessage(
            $expectedMessage
        );

        $this->validateRecognition(
            'S06-LEADERSHIP',
            $payload
        );
    }

    public static function missingRequiredFieldPayloads(): array
    {
        return [
            'recognition type' => [
                'recognition_citation_type',
                'STUDENT_RECOGNITION_REQUIRED_FIELD_MISSING:recognition_citation_type',
            ],
            'granting body' => [
                'granting_body_name',
                'STUDENT_RECOGNITION_REQUIRED_FIELD_MISSING:granting_body_name',
            ],
            'recognition date' => [
                'recognition_date',
                'STUDENT_RECOGNITION_REQUIRED_FIELD_MISSING:recognition_date',
            ],
            'recognition title' => [
                'recognition_title_name',
                'STUDENT_RECOGNITION_REQUIRED_FIELD_MISSING:recognition_title_name',
            ],
        ];
    }

    /**
     * @dataProvider invalidRecognitionDates
     */
    public function testInvalidRecognitionDateFailsClosed(
        string $recognitionDate
    ): void {
        $payload = $this->basePayload(
            'Leadership Citation'
        );

        $payload['recognition_date']
            = $recognitionDate;

        $this->expectException(RuntimeException::class);

        $this->expectExceptionMessage(
            'STUDENT_RECOGNITION_DATE_INVALID'
        );

        $this->validateRecognition(
            'S06-LEADERSHIP',
            $payload
        );
    }

    public static function invalidRecognitionDates(): array
    {
        return [
            'impossible date'
                => ['2026-02-30'],
            'wrong order'
                => ['09-01-2026'],
            'month only'
                => ['2026-09'],
            'year only'
                => ['2026'],
            'slash formatted'
                => ['2026/09/01'],
            'invalid month'
                => ['2026-13-01'],
        ];
    }

    public function testTextValuesAreTrimmed(): void
    {
        $payload = [
            'recognition_citation_type'
                => '  Leadership Award  ',
            'recognition_scope_level'
                => '  National  ',
            'granting_body_name'
                => '  Example Granting Body  ',
            'recognition_date'
                => '  2026-09-01  ',
            'recognition_title_name'
                => '  Outstanding Leadership  ',
            'additional_notes'
                => '  Evidence-backed note.  ',
        ];

        $result = $this->validateRecognition(
            'S06-LEADERSHIP',
            $payload
        );

        $this->assertSame(
            'Leadership Award',
            $result['recognition_citation_type']
        );

        $this->assertSame(
            'National',
            $result['recognition_scope_level']
        );

        $this->assertSame(
            'Example Granting Body',
            $result['granting_body_name']
        );

        $this->assertSame(
            '2026-09-01',
            $result['recognition_date']
        );

        $this->assertSame(
            'Outstanding Leadership',
            $result['recognition_title_name']
        );

        $this->assertSame(
            'Evidence-backed note.',
            $result['additional_notes']
        );
    }

    public function testBlankAdditionalNotesNormalizeToNull(): void
    {
        $payload = $this->basePayload(
            'Leadership Citation'
        );

        $payload['additional_notes'] = '   ';

        $result = $this->validateRecognition(
            'S06-LEADERSHIP',
            $payload
        );

        $this->assertNull(
            $result['additional_notes']
        );
    }

    public function testNotApplicableScopeIsRealControlledValue(): void
    {
        $payload = $this->basePayload(
            'Special / Honorary Recognition'
        );

        $payload['recognition_scope_level']
            = 'Not Applicable / No Formal Level';

        $result = $this->validateRecognition(
            'S06-OTHER_NON_ACADEMIC_RECOGNITION',
            $payload
        );

        $this->assertSame(
            'Not Applicable / No Formal Level',
            $result['recognition_scope_level']
        );
    }

    /**
     * @dataProvider contractsThatRejectFutureRecognitionDates
     */
    public function testFinalizedContractsRejectFutureRecognitionDate(
        string $contractCode,
        string $recognitionType,
        string $scope
    ): void {
        $payload = $this->basePayload(
            $recognitionType
        );

        $payload['recognition_date'] = (new \DateTimeImmutable('tomorrow'))
            ->format('Y-m-d');

        $payload['recognition_scope_level'] = $scope;

        $this->expectException(RuntimeException::class);

        $this->expectExceptionMessage(
            'STUDENT_RECOGNITION_DATE_FUTURE'
        );

        $this->validateRecognition(
            $contractCode,
            $payload
        );
    }

    public static function contractsThatRejectFutureRecognitionDates(): array
    {
        return [
            'sports' => [
                'S06-SPORTS',
                'Individual Performance Recognition',
                'National',
            ],

            'socio cultural performing arts' => [
                'S06-SOCIO_CULTURAL_PERFORMING_ARTS',
                'Individual Performance Recognition',
                'National',
            ],

            'other non academic recognition' => [
                'S06-OTHER_NON_ACADEMIC_RECOGNITION',
                'Achievement / Merit Recognition',
                'National',
            ],
        ];
    }
    public function testUnsupportedStudent06ContractFailsClosed(): void
    {
        $payload = $this->basePayload(
            'Leadership Award'
        );

        $this->expectException(RuntimeException::class);

        $this->expectExceptionMessage(
            'STUDENT_RECOGNITION_CONTRACT_UNSUPPORTED:S06-NOT_REAL'
        );

        $this->validateRecognition(
            'S06-NOT_REAL',
            $payload
        );
    }
}
