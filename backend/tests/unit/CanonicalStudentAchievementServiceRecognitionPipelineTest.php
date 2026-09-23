<?php

namespace Tests\Unit;

use App\Services\CanonicalStudentAchievementService;
use CodeIgniter\Database\BaseConnection;
use CodeIgniter\Test\CIUnitTestCase;
use RuntimeException;

final class CanonicalStudentAchievementServiceRecognitionPipelineTest extends CIUnitTestCase
{

    private CanonicalStudentAchievementService $service;

    protected function setUp(): void
    {
        parent::setUp();

        /*
         * READ-ONLY integration connection.
         *
         * This test must never point at achievenest_local or another
         * unapproved database.
         */
        $this->db = db_connect('local_defense');

        $row = $this->db
            ->query('SELECT DATABASE() AS database_name')
            ->getRowArray();

        $databaseName = (string) ($row['database_name'] ?? '');

        if ($databaseName !== 'achievenest_phase2_restore_test') {
            throw new RuntimeException(
                'STUDENT06_PIPELINE_UNSAFE_DATABASE_TARGET:' . $databaseName
            );
        }

        $this->service = new CanonicalStudentAchievementService(
            $this->db
        );
    }

    /**
     * @dataProvider student06PipelineCases
     */
    public function testStudent06ContractTravelsThroughCanonicalPipeline(
        string $contractCode,
        array $payload
    ): void {
        /*
         * Step 1:
         * Real contract row must be resolvable from achievement_contracts.
         */
        $contract = $this->service->resolveContract(
            $contractCode
        );

        $this->assertSame(
            $contractCode,
            strtoupper(trim((string) $contract['contract_code']))
        );

        $this->assertSame(
            'CITATION_RECOGNITION',
            strtoupper(trim((string) $contract['category_code']))
        );

        /*
         * Step 2:
         * Real category mapping must resolve to the shared Student 06
         * detail table.
         */
        $this->assertSame(
            'student_recognition_details',
            $this->service->detailTableForContract(
                $contractCode
            )
        );

        /*
         * Step 3:
         * Schema introspection must expose the finalized recognition fields.
         */
        $allowedFields = $this->service->allowedDetailFields(
            $contractCode
        );

        $this->assertContains(
            'recognition_citation_type',
            $allowedFields
        );

        $this->assertContains(
            'recognition_scope_level',
            $allowedFields
        );

        $this->assertContains(
            'granting_body_name',
            $allowedFields
        );

        $this->assertContains(
            'recognition_date',
            $allowedFields
        );

        $this->assertContains(
            'recognition_title_name',
            $allowedFields
        );

        $this->assertContains(
            'recognized_organization_name',
            $allowedFields
        );

        $this->assertContains(
            'additional_notes',
            $allowedFields
        );

        $this->assertNotContains(
            'record_version_id',
            $allowedFields
        );

        /*
         * Step 4:
         * Invoke the real public canonical normalization pipeline.
         *
         * This proves:
         *
         * contract_code
         * -> resolveContract()
         * -> allowedDetailFields()
         * -> CITATION_RECOGNITION dispatch
         * -> validateRecognitionPayload()
         */
        $normalized = $this->service->normalizeDetailPayload(
            $contractCode,
            $payload
        );

        $this->assertSame(
            trim((string) $payload['recognition_citation_type']),
            $normalized['recognition_citation_type']
        );

        $this->assertSame(
            trim((string) $payload['granting_body_name']),
            $normalized['granting_body_name']
        );

        $this->assertSame(
            '2026-09-01',
            $normalized['recognition_date']
        );

        $this->assertSame(
            trim((string) $payload['recognition_title_name']),
            $normalized['recognition_title_name']
        );
    }

    public static function student06PipelineCases(): array
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
                        => 'Leadership Recognition',
                    'additional_notes'
                        => 'Pipeline verification.',
                ],
            ],

            'organization membership' => [
                'S06-ORGANIZATION_MEMBERSHIP',
                [
                    'recognition_citation_type'
                        => 'Organization / Membership Award',
                    'recognition_scope_level'
                        => 'Regional',
                    'granting_body_name'
                        => 'Notre Dame of Marbel University',
                    'recognition_date'
                        => '2026-09-01',
                    'recognition_title_name'
                        => 'Organization Recognition',
                    'recognized_organization_name'
                        => 'Example Student Organization',
                    'additional_notes'
                        => 'Pipeline verification.',
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
                        => 'Community Service Recognition',
                    'additional_notes'
                        => 'Pipeline verification.',
                ],
            ],

            'church ministry' => [
                'S06-CHURCH_MINISTRY',
                [
                    'recognition_citation_type'
                        => 'Church / Ministry Citation',
                    'recognition_scope_level'
                        => 'Regional',
                    'granting_body_name'
                        => 'Notre Dame of Marbel University',
                    'recognition_date'
                        => '2026-09-01',
                    'recognition_title_name'
                        => 'Ministry Recognition',
                    'additional_notes'
                        => 'Pipeline verification.',
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
                        => 'Campus Journalism Recognition',
                    'additional_notes'
                        => 'Pipeline verification.',
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
                        => 'Sports Recognition',
                    'additional_notes'
                        => 'Pipeline verification.',
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
                        => 'Performing Arts Recognition',
                    'additional_notes'
                        => 'Pipeline verification.',
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
                        => 'Non-Academic Recognition',
                    'additional_notes'
                        => 'Pipeline verification.',
                ],
            ],
        ];
    }

    public function testStudent06PipelineRejectsNonSchemaFieldBeforePersistence(): void
    {
        $payload = [
            'recognition_citation_type'
                => 'Leadership Award',
            'recognition_scope_level'
                => 'National',
            'granting_body_name'
                => 'Notre Dame of Marbel University',
            'recognition_date'
                => '2026-09-01',
            'recognition_title_name'
                => 'Leadership Recognition',

            /*
             * Deliberately forbidden:
             * award/scoring output does not belong in Student 06 detail.
             */
            'award_points' => 99,
        ];

        $this->expectException(RuntimeException::class);

        $this->expectExceptionMessage(
            'STUDENT_ACHIEVEMENT_DETAIL_FIELD_NOT_ALLOWED'
        );

        $this->service->normalizeDetailPayload(
            'S06-LEADERSHIP',
            $payload
        );
    }

    public function testSupportingEvidenceDoesNotBelongInRecognitionDetailPayload(): void
    {
        $payload = [
            'recognition_citation_type'
                => 'Leadership Award',
            'recognition_scope_level'
                => 'National',
            'granting_body_name'
                => 'Notre Dame of Marbel University',
            'recognition_date'
                => '2026-09-01',
            'recognition_title_name'
                => 'Leadership Recognition',

            /*
             * Evidence belongs to the shared evidence architecture,
             * not student_recognition_details.
             */
            'supporting_evidence' => 'certificate.pdf',
        ];

        $this->expectException(RuntimeException::class);

        $this->expectExceptionMessage(
            'STUDENT_ACHIEVEMENT_DETAIL_FIELD_NOT_ALLOWED'
        );

        $this->service->normalizeDetailPayload(
            'S06-LEADERSHIP',
            $payload
        );
    }
}
