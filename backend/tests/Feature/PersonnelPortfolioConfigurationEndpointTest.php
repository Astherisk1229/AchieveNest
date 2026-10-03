<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Controllers\Api\EvaluationScaleController;
use App\Services\AuthenticatedActorService;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;
use Config\Services;

#[\PHPUnit\Framework\Attributes\Group('manual-proof')]
final class PersonnelPortfolioConfigurationEndpointTest extends CIUnitTestCase
{
    public static function setUpBeforeClass(): void
    {
        \Tests\Support\ManualProofGate::requireOptIn(false);
        parent::setUpBeforeClass();
    }

    protected function setUp(): void
    {
        parent::setUp();

        $database = new Database();
        $database->tests = $database->default;
        $database->defaultGroup = 'default';
        \CodeIgniter\Config\Factories::injectMock('config', 'Database', $database);

        $connection = Database::connect('default');
        $reflection = new \ReflectionClass(Database::class);
        $instancesProperty = $reflection->getProperty('instances');
        $instancesProperty->setAccessible(true);
        $instances = $instancesProperty->getValue();
        $instances['tests'] = $connection;
        $instances['default'] = $connection;
        $instancesProperty->setValue(null, $instances);
    }

    public function testAcademicPersonnelConfigurationUsesCanonicalProfileIdentifier(): void
    {
        $db = Database::connect('default');
        $profile = $db->table('profiles p')
            ->select('p.id, p.email')
            ->join('personnel_profiles pp', 'pp.profile_id = p.id')
            ->where('p.email', 'demo.academic.personnel@ndmu.edu.ph')
            ->get()
            ->getRowArray();

        self::assertNotNull($profile, 'Academic Personnel demo profile must exist in canonical MySQL.');

        $actorService = $this->createMock(AuthenticatedActorService::class);
        $actorService->method('resolveActor')->willReturn(['profile' => $profile]);

        $controller = new EvaluationScaleController(actorService: $actorService);
        $controller->initController(Services::request(), Services::response(), Services::logger());
        $response = $controller->getPersonnelConfiguration();
        $payload = json_decode($response->getBody(), true, flags: JSON_THROW_ON_ERROR);

        self::assertSame(200, $response->getStatusCode(), $response->getBody());
        self::assertTrue($payload['success']);
        self::assertSame($profile['id'], $payload['data']['personnel_profile_id']);
        self::assertNotEmpty($payload['data']['scale']['id']);
        self::assertNotEmpty($payload['data']['version']['id']);
        self::assertIsArray($payload['data']['areas']);
        self::assertArrayNotHasKey('code', $payload);
    }
}
