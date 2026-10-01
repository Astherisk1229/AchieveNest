<?php

namespace Tests\Unit;

use App\Services\CanonicalStudentAchievementService;
use CodeIgniter\Test\CIUnitTestCase;
use ReflectionClass;
use RuntimeException;

final class CanonicalStudentAchievementServiceSocioCulturalTest extends CIUnitTestCase
{
    private function validate(string $contractCode, array $payload): array
    {
        $reflection = new ReflectionClass(
            CanonicalStudentAchievementService::class
        );
        $service = $reflection->newInstanceWithoutConstructor();
        $method = $reflection->getMethod('validateSocioCulturalPayload');
        $method->setAccessible(true);

        return $method->invoke($service, $contractCode, $payload);
    }

    private function basePayload(string $discipline = 'DANCE'): array
    {
        return [
            'discipline' => $discipline,
            'specified_discipline' => null,
            'event_type' => 'PRISAA',
            'specified_event_type' => null,
            'competition_level' => 'REGIONAL',
            'participation_type' => 'GROUP_ENSEMBLE',
            'placement_result' => 'GOLD_1ST_PLACE_CHAMPION',
            'event_competition_title' => '2026 Cultural Festival',
            'organizer_issuing_organization' => 'PRISAA Region XII',
            'event_start_date' => '2026-08-20',
            'event_end_date' => '2026-08-22',
            'additional_notes' => ' Factual context. ',
        ];
    }

    /** @dataProvider contracts */
    public function testAllStudent08ContractsAcceptCanonicalPayload(
        string $contractCode,
        string $discipline
    ): void {
        $payload = $this->basePayload($discipline);

        if ($discipline === 'OTHER_APPROVED_DISCIPLINE') {
            $payload['specified_discipline'] = ' Spoken   Word ';
        }

        $result = $this->validate($contractCode, $payload);

        $this->assertSame($discipline, $result['discipline']);
        $this->assertSame('Factual context.', $result['additional_notes']);

        if ($discipline === 'OTHER_APPROVED_DISCIPLINE') {
            $this->assertSame('Spoken Word', $result['specified_discipline']);
        }
    }

    public static function contracts(): array
    {
        return [
            ['S08-DANCE', 'DANCE'],
            ['S08-VOCAL_SINGING', 'VOCAL_SINGING'],
            ['S08-INSTRUMENTAL', 'INSTRUMENTAL'],
            ['S08-THEATER', 'THEATER'],
            ['S08-CULTURAL_PERFORMANCE', 'CULTURAL_PERFORMANCE'],
            ['S08-PERFORMING_ARTS', 'PERFORMING_ARTS'],
            [
                'S08-OTHER_APPROVED_DISCIPLINE',
                'OTHER_APPROVED_DISCIPLINE',
            ],
        ];
    }

    public function testContractMustMatchDiscipline(): void
    {
        $this->expectException(RuntimeException::class);
        $this->validate('S08-DANCE', $this->basePayload('THEATER'));
    }

    /** @dataProvider invalidOtherDisciplineValues */
    public function testOtherDisciplineMustBeSpecific(?string $value): void
    {
        $payload = $this->basePayload('OTHER_APPROVED_DISCIPLINE');
        $payload['specified_discipline'] = $value;

        $this->expectException(RuntimeException::class);
        $this->validate('S08-OTHER_APPROVED_DISCIPLINE', $payload);
    }

    public static function invalidOtherDisciplineValues(): array
    {
        return [[null], ['   '], ['Other'], ['Dance']];
    }

    public function testSeededDisciplineRejectsSpecifiedValue(): void
    {
        $payload = $this->basePayload();
        $payload['specified_discipline'] = 'Spoken Word';

        $this->expectException(RuntimeException::class);
        $this->validate('S08-DANCE', $payload);
    }

    /** @dataProvider eventContexts */
    public function testAuthoritativeEventContextsAndOptionalLevel(
        string $eventType,
        ?string $specifiedEvent,
        ?string $level
    ): void {
        $payload = $this->basePayload();
        $payload['event_type'] = $eventType;
        $payload['specified_event_type'] = $specifiedEvent;
        $payload['competition_level'] = $level;

        $result = $this->validate('S08-DANCE', $payload);

        $this->assertSame($eventType, $result['event_type']);
        $this->assertSame($level, $result['competition_level']);
    }

    public static function eventContexts(): array
    {
        return [
            ['PRISAA', null, 'REGIONAL'],
            ['NDEA_OR_EQUIVALENT', null, null],
            ['UNIVERSITY_LEVEL_COMPETITION', null, null],
            ['OTHER_APPROVED_EVENT', 'City Arts Festival', 'LOCAL'],
        ];
    }

    /** @dataProvider invalidOtherEventValues */
    public function testOtherEventMustBeSpecific(?string $value): void
    {
        $payload = $this->basePayload();
        $payload['event_type'] = 'OTHER_APPROVED_EVENT';
        $payload['specified_event_type'] = $value;

        $this->expectException(RuntimeException::class);
        $this->validate('S08-DANCE', $payload);
    }

    public static function invalidOtherEventValues(): array
    {
        return [[null], ['Other'], ['Event'], ['PRISAA']];
    }

    public function testInvalidControlledValuesAreRejected(): void
    {
        $payload = $this->basePayload();
        $payload['participation_type'] = 'TEAM';

        $this->expectException(RuntimeException::class);
        $this->validate('S08-DANCE', $payload);
    }

    public function testInvalidCompetitionLevelIsRejected(): void
    {
        $payload = $this->basePayload();
        $payload['competition_level'] = 'INTERNATIONAL';

        $this->expectException(RuntimeException::class);
        $this->validate('S08-DANCE', $payload);
    }

    public function testEndDateCannotPrecedeStartDate(): void
    {
        $payload = $this->basePayload();
        $payload['event_end_date'] = '2026-08-19';

        $this->expectException(RuntimeException::class);
        $this->validate('S08-DANCE', $payload);
    }

    public function testInvalidCalendarDateIsRejected(): void
    {
        $payload = $this->basePayload();
        $payload['event_start_date'] = '2026-02-31';

        $this->expectException(RuntimeException::class);
        $this->validate('S08-DANCE', $payload);
    }
}
