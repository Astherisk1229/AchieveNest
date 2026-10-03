<?php

namespace Tests\Unit;

use App\Services\CanonicalStudentAchievementService;
use CodeIgniter\Test\CIUnitTestCase;
use ReflectionClass;
use RuntimeException;

final class CanonicalStudentAchievementServiceSportsTest extends CIUnitTestCase
{
    /**
     * Invoke the real Student 07 validator without running the service
     * constructor because the constructor opens a database connection.
     */
    private function validateSports(
        string $contractCode,
        array $payload
    ): array {
        $reflection = new ReflectionClass(
            CanonicalStudentAchievementService::class
        );

        /** @var CanonicalStudentAchievementService $service */
        $service = $reflection->newInstanceWithoutConstructor();

        $method = $reflection->getMethod(
            'validateSportsPayload'
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
        string $sportDiscipline = 'BASKETBALL'
    ): array {
        return [
            'sport_discipline' => $sportDiscipline,
            'specified_sport_discipline' => null,
            'event_type_competition' => 'PRISAA',
            'specified_competition_meet' => null,
            'competition_level' => 'REGIONAL',
            'participation_type' => 'TEAM',
            'placement_result' => 'GOLD_1ST_PLACE_CHAMPION',
            'competition_event_title'
                => '2026 PRISAA XII Regional Games',
            'organizer_issuing_organization'
                => 'PRISAA Region XII',
            'event_start_date' => '2026-08-20',
            'event_end_date' => '2026-08-22',
            'additional_notes' => 'Verified factual context.',
        ];
    }

    /**
     * @dataProvider validSportsContracts
     */
    public function testAllTenStudent07ContractsAcceptValidPayload(
        string $contractCode,
        string $sportDiscipline
    ): void {
        $payload = $this->basePayload(
            $sportDiscipline
        );

        if ($sportDiscipline === 'OTHER_APPROVED_SPORT') {
            $payload['specified_sport_discipline']
                = 'Pencak Silat';
        }

        $result = $this->validateSports(
            $contractCode,
            $payload
        );

        $this->assertSame(
            $sportDiscipline,
            $result['sport_discipline']
        );

        $this->assertSame(
            'PRISAA',
            $result['event_type_competition']
        );

        $this->assertSame(
            'REGIONAL',
            $result['competition_level']
        );

        $this->assertSame(
            'TEAM',
            $result['participation_type']
        );

        $this->assertSame(
            'GOLD_1ST_PLACE_CHAMPION',
            $result['placement_result']
        );
    }

    public static function validSportsContracts(): array
    {
        return [
            'basketball' => [
                'S07-BASKETBALL',
                'BASKETBALL',
            ],
            'volleyball' => [
                'S07-VOLLEYBALL',
                'VOLLEYBALL',
            ],
            'athletics' => [
                'S07-ATHLETICS',
                'ATHLETICS',
            ],
            'swimming' => [
                'S07-SWIMMING',
                'SWIMMING',
            ],
            'badminton' => [
                'S07-BADMINTON',
                'BADMINTON',
            ],
            'table tennis' => [
                'S07-TABLE_TENNIS',
                'TABLE_TENNIS',
            ],
            'chess' => [
                'S07-CHESS',
                'CHESS',
            ],
            'football' => [
                'S07-FOOTBALL',
                'FOOTBALL',
            ],
            'sepak takraw' => [
                'S07-SEPAK_TAKRAW',
                'SEPAK_TAKRAW',
            ],
            'other approved sport' => [
                'S07-OTHER_APPROVED_SPORT',
                'OTHER_APPROVED_SPORT',
            ],
        ];
    }

    public function testUnsupportedStudent07ContractIsRejected(): void
    {
        $this->expectException(RuntimeException::class);

        $this->validateSports(
            'S07-UNKNOWN',
            $this->basePayload()
        );
    }

    public function testContractMustMatchSportDiscipline(): void
    {
        $this->expectException(RuntimeException::class);

        $this->validateSports(
            'S07-BASKETBALL',
            $this->basePayload('VOLLEYBALL')
        );
    }

    public function testOtherApprovedSportRequiresSpecifiedDiscipline(): void
    {
        $payload = $this->basePayload(
            'OTHER_APPROVED_SPORT'
        );

        $payload['specified_sport_discipline'] = null;

        $this->expectException(RuntimeException::class);

        $this->validateSports(
            'S07-OTHER_APPROVED_SPORT',
            $payload
        );
    }

    public function testOtherApprovedSportRejectsBlankSpecifiedDiscipline(): void
    {
        $payload = $this->basePayload(
            'OTHER_APPROVED_SPORT'
        );

        $payload['specified_sport_discipline'] = '   ';

        $this->expectException(RuntimeException::class);

        $this->validateSports(
            'S07-OTHER_APPROVED_SPORT',
            $payload
        );
    }

    public function testOtherApprovedSportRejectsSeededSportDuplicate(): void
    {
        $payload = $this->basePayload(
            'OTHER_APPROVED_SPORT'
        );

        $payload['specified_sport_discipline']
            = '  basketball  ';

        $this->expectException(RuntimeException::class);

        $this->validateSports(
            'S07-OTHER_APPROVED_SPORT',
            $payload
        );
    }

    public function testSpecifiedSportDisciplineIsNormalized(): void
    {
        $payload = $this->basePayload(
            'OTHER_APPROVED_SPORT'
        );

        $payload['specified_sport_discipline']
            = '  Pencak   Silat  ';

        $result = $this->validateSports(
            'S07-OTHER_APPROVED_SPORT',
            $payload
        );

        $this->assertSame(
            'Pencak Silat',
            $result['specified_sport_discipline']
        );
    }

    public function testSeededSportRejectsSpecifiedDiscipline(): void
    {
        $payload = $this->basePayload();

        $payload['specified_sport_discipline']
            = 'Something Else';

        $this->expectException(RuntimeException::class);

        $this->validateSports(
            'S07-BASKETBALL',
            $payload
        );
    }

    /**
     * @dataProvider validCompetitionContexts
     */
    public function testApprovedCompetitionContextsAreAccepted(
        string $competition,
        ?string $level,
        ?string $specifiedCompetition
    ): void {
        $payload = $this->basePayload();

        $payload['event_type_competition']
            = $competition;

        $payload['competition_level']
            = $level;

        $payload['specified_competition_meet']
            = $specifiedCompetition;

        $result = $this->validateSports(
            'S07-BASKETBALL',
            $payload
        );

        $this->assertSame(
            $competition,
            $result['event_type_competition']
        );

        $this->assertSame(
            $level,
            $result['competition_level']
        );
    }

    public static function validCompetitionContexts(): array
    {
        return [
            'PRISAA regional' => [
                'PRISAA',
                'REGIONAL',
                null,
            ],
            'NDEA' => [
                'NDEA',
                null,
                null,
            ],
            'intramurals university meet' => [
                'INTRAMURALS_UNIVERSITY_MEET',
                null,
                null,
            ],
            'other approved competition no level' => [
                'OTHER_APPROVED_COMPETITION',
                null,
                'South Cotabato Invitational Games',
            ],
            'other approved competition with level' => [
                'OTHER_APPROVED_COMPETITION',
                'REGIONAL',
                'South Cotabato Invitational Games',
            ],
        ];
    }

    public function testUnknownCompetitionTypeIsRejected(): void
    {
        $payload = $this->basePayload();

        $payload['event_type_competition']
            = 'UNKNOWN_COMPETITION';

        $this->expectException(RuntimeException::class);

        $this->validateSports(
            'S07-BASKETBALL',
            $payload
        );
    }

    public function testOtherApprovedCompetitionRequiresName(): void
    {
        $payload = $this->basePayload();

        $payload['event_type_competition']
            = 'OTHER_APPROVED_COMPETITION';

        $payload['specified_competition_meet']
            = null;

        $payload['competition_level'] = null;

        $this->expectException(RuntimeException::class);

        $this->validateSports(
            'S07-BASKETBALL',
            $payload
        );
    }

    /**
     * @dataProvider invalidGenericCompetitionNames
     */
    public function testOtherApprovedCompetitionRejectsGenericName(
        string $value
    ): void {
        $payload = $this->basePayload();

        $payload['event_type_competition']
            = 'OTHER_APPROVED_COMPETITION';

        $payload['specified_competition_meet']
            = $value;

        $payload['competition_level'] = null;

        $this->expectException(RuntimeException::class);

        $this->validateSports(
            'S07-BASKETBALL',
            $payload
        );
    }

    public static function invalidGenericCompetitionNames(): array
    {
        return [
            'other' => ['Other'],
            'sports event' => ['Sports Event'],
            'competition' => ['Competition'],
            'tournament' => ['Tournament'],
        ];
    }

    public function testOtherApprovedCompetitionRejectsSeededCompetitionName(): void
    {
        $payload = $this->basePayload();

        $payload['event_type_competition']
            = 'OTHER_APPROVED_COMPETITION';

        $payload['specified_competition_meet']
            = ' PRISAA ';

        $payload['competition_level'] = null;

        $this->expectException(RuntimeException::class);

        $this->validateSports(
            'S07-BASKETBALL',
            $payload
        );
    }

    public function testSeededCompetitionRejectsSpecifiedCompetitionName(): void
    {
        $payload = $this->basePayload();

        $payload['specified_competition_meet']
            = 'Unexpected Competition';

        $this->expectException(RuntimeException::class);

        $this->validateSports(
            'S07-BASKETBALL',
            $payload
        );
    }

    public function testPrisaaRequiresCompetitionLevel(): void
    {
        $payload = $this->basePayload();

        $payload['competition_level'] = null;

        $this->expectException(RuntimeException::class);

        $this->validateSports(
            'S07-BASKETBALL',
            $payload
        );
    }

    public function testInvalidCompetitionLevelIsRejected(): void
    {
        $payload = $this->basePayload();

        $payload['competition_level']
            = 'INTERNATIONAL';

        $this->expectException(RuntimeException::class);

        $this->validateSports(
            'S07-BASKETBALL',
            $payload
        );
    }

    public function testNdeaRejectsCompetitionLevel(): void
    {
        $payload = $this->basePayload();

        $payload['event_type_competition'] = 'NDEA';
        $payload['competition_level'] = 'LOCAL';

        $this->expectException(RuntimeException::class);

        $this->validateSports(
            'S07-BASKETBALL',
            $payload
        );
    }

    public function testIntramuralsRejectsCompetitionLevel(): void
    {
        $payload = $this->basePayload();

        $payload['event_type_competition']
            = 'INTRAMURALS_UNIVERSITY_MEET';

        $payload['competition_level']
            = 'LOCAL';

        $this->expectException(RuntimeException::class);

        $this->validateSports(
            'S07-BASKETBALL',
            $payload
        );
    }

    /**
     * @dataProvider validParticipationTypes
     */
    public function testValidParticipationTypes(
        string $participationType
    ): void {
        $payload = $this->basePayload();

        $payload['participation_type']
            = $participationType;

        $result = $this->validateSports(
            'S07-BASKETBALL',
            $payload
        );

        $this->assertSame(
            $participationType,
            $result['participation_type']
        );
    }

    public static function validParticipationTypes(): array
    {
        return [
            'individual' => ['INDIVIDUAL'],
            'team' => ['TEAM'],
        ];
    }

    public function testInvalidParticipationTypeIsRejected(): void
    {
        $payload = $this->basePayload();

        $payload['participation_type']
            = 'UNKNOWN';

        $this->expectException(RuntimeException::class);

        $this->validateSports(
            'S07-BASKETBALL',
            $payload
        );
    }

    /**
     * @dataProvider validPlacementResults
     */
    public function testValidPlacementResults(
        string $placementResult
    ): void {
        $payload = $this->basePayload();

        $payload['placement_result']
            = $placementResult;

        $result = $this->validateSports(
            'S07-BASKETBALL',
            $payload
        );

        $this->assertSame(
            $placementResult,
            $result['placement_result']
        );
    }

    public static function validPlacementResults(): array
    {
        return [
            'participant' => [
                'PARTICIPANT',
            ],
            'bronze third' => [
                'BRONZE_3RD_PLACE',
            ],
            'silver second' => [
                'SILVER_2ND_PLACE',
            ],
            'gold first champion' => [
                'GOLD_1ST_PLACE_CHAMPION',
            ],
        ];
    }

    public function testInvalidPlacementResultIsRejected(): void
    {
        $payload = $this->basePayload();

        $payload['placement_result']
            = 'MVP';

        $this->expectException(RuntimeException::class);

        $this->validateSports(
            'S07-BASKETBALL',
            $payload
        );
    }

    /**
     * @dataProvider requiredSportsFields
     */
    public function testRequiredSportsFieldCannotBeMissing(
        string $field
    ): void {
        $payload = $this->basePayload();

        unset($payload[$field]);

        $this->expectException(RuntimeException::class);

        $this->validateSports(
            'S07-BASKETBALL',
            $payload
        );
    }

    public static function requiredSportsFields(): array
    {
        return [
            'sport discipline' => [
                'sport_discipline',
            ],
            'competition type' => [
                'event_type_competition',
            ],
            'participation type' => [
                'participation_type',
            ],
            'placement result' => [
                'placement_result',
            ],
            'event title' => [
                'competition_event_title',
            ],
            'organizer' => [
                'organizer_issuing_organization',
            ],
            'event start date' => [
                'event_start_date',
            ],
        ];
    }

    public function testBlankEventTitleIsRejected(): void
    {
        $payload = $this->basePayload();

        $payload['competition_event_title'] = '   ';

        $this->expectException(RuntimeException::class);

        $this->validateSports(
            'S07-BASKETBALL',
            $payload
        );
    }

    public function testBlankOrganizerIsRejected(): void
    {
        $payload = $this->basePayload();

        $payload['organizer_issuing_organization']
            = '   ';

        $this->expectException(RuntimeException::class);

        $this->validateSports(
            'S07-BASKETBALL',
            $payload
        );
    }

    public function testInvalidStartDateIsRejected(): void
    {
        $payload = $this->basePayload();

        $payload['event_start_date']
            = '2026-02-31';

        $this->expectException(RuntimeException::class);

        $this->validateSports(
            'S07-BASKETBALL',
            $payload
        );
    }

    public function testInvalidEndDateIsRejected(): void
    {
        $payload = $this->basePayload();

        $payload['event_end_date']
            = 'not-a-date';

        $this->expectException(RuntimeException::class);

        $this->validateSports(
            'S07-BASKETBALL',
            $payload
        );
    }

    public function testEventEndDateCannotPrecedeStartDate(): void
    {
        $payload = $this->basePayload();

        $payload['event_start_date']
            = '2026-08-22';

        $payload['event_end_date']
            = '2026-08-20';

        $this->expectException(RuntimeException::class);

        $this->validateSports(
            'S07-BASKETBALL',
            $payload
        );
    }

    public function testSingleDayEventMayHaveNullEndDate(): void
    {
        $payload = $this->basePayload();

        $payload['event_end_date'] = null;

        $result = $this->validateSports(
            'S07-BASKETBALL',
            $payload
        );

        $this->assertNull(
            $result['event_end_date']
        );
    }

    public function testAdditionalNotesAreOptional(): void
    {
        $payload = $this->basePayload();

        unset($payload['additional_notes']);

        $result = $this->validateSports(
            'S07-BASKETBALL',
            $payload
        );

        $this->assertArrayNotHasKey(
            'additional_notes',
            $result
        );
    }
}