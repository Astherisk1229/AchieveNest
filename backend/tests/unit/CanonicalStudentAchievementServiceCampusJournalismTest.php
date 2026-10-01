<?php

namespace Tests\Unit;

use App\Services\CanonicalStudentAchievementService;
use CodeIgniter\Test\CIUnitTestCase;
use ReflectionClass;
use RuntimeException;

final class CanonicalStudentAchievementServiceCampusJournalismTest extends CIUnitTestCase
{
    private function validate(string $contractCode, array $payload): array
    {
        $reflection = new ReflectionClass(
            CanonicalStudentAchievementService::class
        );
        $service = $reflection->newInstanceWithoutConstructor();
        $method = $reflection->getMethod('validateCampusJournalismPayload');
        $method->setAccessible(true);

        return $method->invoke($service, $contractCode, $payload);
    }

    private function outputPayload(string $recordType = 'NEWS_ITEM'): array
    {
        return [
            'record_type' => $recordType,
            'title_of_work' => 'Campus sustainability initiative',
            'publication_outlet' => 'The Collegian',
            'publication_date' => '2026-08-20',
            'publication_role' => 'Writer',
            'role_start_date' => null,
            'role_end_date' => null,
            'additional_notes' => ' Published in print. ',
        ];
    }

    private function rolePayload(
        string $recordType = 'PUBLICATION_MEMBER_CONTRIBUTOR'
    ): array {
        return [
            'record_type' => $recordType,
            'title_of_work' => null,
            'publication_outlet' => 'The Collegian',
            'publication_date' => null,
            'publication_role' => 'Staff Writer',
            'role_start_date' => '2025-08-01',
            'role_end_date' => '2026-05-31',
            'additional_notes' => null,
        ];
    }

    /** @dataProvider contracts */
    public function testAllStudent09ContractsAcceptTheirCanonicalShape(
        string $contractCode,
        string $recordType,
        string $shape
    ): void {
        $payload = $shape === 'output'
            ? $this->outputPayload($recordType)
            : $this->rolePayload($recordType);

        $result = $this->validate($contractCode, $payload);

        $this->assertSame($recordType, $result['record_type']);
        $this->assertSame('The Collegian', $result['publication_outlet']);
    }

    public static function contracts(): array
    {
        return [
            ['S09-NEWS_ITEM', 'NEWS_ITEM', 'output'],
            ['S09-LITERARY_WORK', 'LITERARY_WORK', 'output'],
            ['S09-COLUMN', 'COLUMN', 'output'],
            ['S09-EDITORIAL', 'EDITORIAL', 'output'],
            [
                'S09-PUBLICATION_MEMBER_CONTRIBUTOR',
                'PUBLICATION_MEMBER_CONTRIBUTOR',
                'role',
            ],
            ['S09-PUBLICATION_OFFICER', 'PUBLICATION_OFFICER', 'role'],
        ];
    }

    public function testContractMustMatchRecordType(): void
    {
        $this->expectException(RuntimeException::class);
        $this->validate(
            'S09-NEWS_ITEM',
            $this->outputPayload('EDITORIAL')
        );
    }

    /** @dataProvider commonRequiredFields */
    public function testCommonFieldsAreRequired(string $field): void
    {
        $payload = $this->outputPayload();
        $payload[$field] = '   ';

        $this->expectException(RuntimeException::class);
        $this->validate('S09-NEWS_ITEM', $payload);
    }

    public static function commonRequiredFields(): array
    {
        return [
            ['publication_outlet'],
            ['publication_role'],
        ];
    }

    public function testOutputRequiresTitleAndPublicationDate(): void
    {
        $payload = $this->outputPayload();
        $payload['title_of_work'] = null;

        $this->expectException(RuntimeException::class);
        $this->validate('S09-NEWS_ITEM', $payload);
    }

    public function testOutputRejectsRoleDates(): void
    {
        $payload = $this->outputPayload();
        $payload['role_start_date'] = '2026-08-01';

        $this->expectException(RuntimeException::class);
        $this->validate('S09-NEWS_ITEM', $payload);
    }

    public function testRoleRequiresStartDate(): void
    {
        $payload = $this->rolePayload();
        $payload['role_start_date'] = null;

        $this->expectException(RuntimeException::class);
        $this->validate('S09-PUBLICATION_MEMBER_CONTRIBUTOR', $payload);
    }

    public function testRoleRejectsOutputFields(): void
    {
        $payload = $this->rolePayload();
        $payload['title_of_work'] = 'Unexpected article';

        $this->expectException(RuntimeException::class);
        $this->validate('S09-PUBLICATION_MEMBER_CONTRIBUTOR', $payload);
    }

    public function testRoleEndDateCannotPrecedeStartDate(): void
    {
        $payload = $this->rolePayload();
        $payload['role_end_date'] = '2025-07-31';

        $this->expectException(RuntimeException::class);
        $this->validate('S09-PUBLICATION_MEMBER_CONTRIBUTOR', $payload);
    }

    public function testInvalidPublicationDateIsRejected(): void
    {
        $payload = $this->outputPayload();
        $payload['publication_date'] = '2026-02-31';

        $this->expectException(RuntimeException::class);
        $this->validate('S09-NEWS_ITEM', $payload);
    }

    public function testRoleEndDateMayBeNull(): void
    {
        $payload = $this->rolePayload();
        $payload['role_end_date'] = null;

        $result = $this->validate(
            'S09-PUBLICATION_MEMBER_CONTRIBUTOR',
            $payload
        );

        $this->assertNull($result['role_end_date']);
    }
}
