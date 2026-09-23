<?php

namespace Tests\Unit;

use App\Services\ExternalAuthIdentityRepository;
use CodeIgniter\Database\BaseConnection;
use CodeIgniter\Test\CIUnitTestCase;
use Throwable;

final class ExternalAuthIdentityRepositoryTest extends CIUnitTestCase
{
    private const DATABASE = 'achievenest_phase17m_google_auth_test';
    private const PROFILE_A = '53530000-0000-4000-8000-000000000001';
    private const PROFILE_B = '53530000-0000-4000-8000-000000000002';

    private BaseConnection $connection;
    private ExternalAuthIdentityRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->connection = db_connect('phase17m_replay');
        if ($this->connection->database !== self::DATABASE || ! str_contains($this->connection->database, 'google_auth_test')) {
            self::fail('External identity tests require the isolated ' . self::DATABASE . ' database. Resolved: ' . $this->connection->database);
        }
        if (! $this->connection->tableExists('external_auth_identities')) {
            self::fail('The isolated external_auth_identities schema is missing.');
        }
        $this->connection->transBegin();
        $now = '2026-09-22 12:00:00.000000';
        foreach ([[self::PROFILE_A, 'SYNTH-GAUTH-A', 'synthetic.google.a@example.test'], [self::PROFILE_B, 'SYNTH-GAUTH-B', 'synthetic.google.b@example.test']] as [$id, $institutionalId, $email]) {
            $this->connection->table('profiles')->insert([
                'id' => $id, 'institutional_id' => $institutionalId, 'account_type' => 'student',
                'email' => $email, 'full_name' => 'Synthetic Google Auth Fixture', 'status' => 'active',
                'created_at' => $now, 'updated_at' => $now,
            ]);
        }
        $this->repository = new ExternalAuthIdentityRepository($this->connection);
    }

    protected function tearDown(): void
    {
        if (isset($this->connection)) {
            $this->connection->transRollback();
            $this->connection->close();
        }
        parent::tearDown();
    }

    public function testFindByProviderSubjectReturnsNull(): void
    {
        self::assertNull($this->repository->findByProviderSubject(' Google ', 'missing-subject'));
    }

    public function testFindByProviderSubjectReturnsLinkedIdentity(): void
    {
        $this->repository->insertLink($this->identity('10000000-0000-4000-8000-000000000001', self::PROFILE_A, 'google-sub-A'));
        $row = $this->repository->findByProviderSubject('GOOGLE', ' google-sub-A ');
        self::assertSame('10000000-0000-4000-8000-000000000001', $row['id']);
        self::assertSame(self::PROFILE_A, $row['profile_id']);
        self::assertSame('google', $row['provider']);
        self::assertSame('google-sub-A', $row['provider_subject']);
    }

    public function testFindByProfileAndProviderReturnsNull(): void
    {
        self::assertNull($this->repository->findByProfileAndProvider(self::PROFILE_A, 'google'));
    }

    public function testFindByProfileAndProviderReturnsIdentity(): void
    {
        $this->repository->insertLink($this->identity('10000000-0000-4000-8000-000000000002', self::PROFILE_A, 'google-sub-A'));
        self::assertSame('google-sub-A', $this->repository->findByProfileAndProvider(self::PROFILE_A, ' GOOGLE ')['provider_subject']);
    }

    public function testInsertLinkSucceedsAndPreservesFields(): void
    {
        $row = $this->repository->insertLink($this->identity('10000000-0000-4000-8000-000000000003', self::PROFILE_A, 'CaseSensitive-Subject'));
        self::assertSame('CaseSensitive-Subject', $row['provider_subject']);
        self::assertSame('synthetic.a@example.test', $row['provider_email_snapshot']);
        self::assertSame('example.test', $row['provider_hosted_domain_snapshot']);
        self::assertSame('bootstrap_verified_email', $row['link_method']);
    }

    public function testDuplicateProviderSubjectIsRejected(): void
    {
        $this->repository->insertLink($this->identity('10000000-0000-4000-8000-000000000004', self::PROFILE_A, 'google-sub-A'));
        $this->assertPersistenceFailure(fn () => $this->repository->insertLink($this->identity('10000000-0000-4000-8000-000000000005', self::PROFILE_B, 'google-sub-A')));
    }

    public function testDuplicateProfileProviderIsRejected(): void
    {
        $this->repository->insertLink($this->identity('10000000-0000-4000-8000-000000000006', self::PROFILE_A, 'google-sub-A'));
        $this->assertPersistenceFailure(fn () => $this->repository->insertLink($this->identity('10000000-0000-4000-8000-000000000007', self::PROFILE_A, 'google-sub-B')));
    }

    public function testInvalidProfileForeignKeyIsRejected(): void
    {
        $this->assertPersistenceFailure(fn () => $this->repository->insertLink($this->identity('10000000-0000-4000-8000-000000000008', '53539999-0000-4000-8000-000000000099', 'google-sub-Z')));
    }

    public function testUpdateLastAuthenticatedChangesOnlyAuthenticationTimestamps(): void
    {
        $id = '10000000-0000-4000-8000-000000000009';
        $before = $this->repository->insertLink($this->identity($id, self::PROFILE_A, 'google-sub-A'));
        $this->repository->updateLastAuthenticatedAt($id, '2026-09-22 13:14:15.123456');
        $after = $this->repository->findByProviderSubject('google', 'google-sub-A');
        self::assertStringStartsWith('2026-09-22 13:14:15.123456', $after['last_authenticated_at']);
        self::assertSame($after['last_authenticated_at'], $after['updated_at']);
        self::assertSame($before['provider_subject'], $after['provider_subject']);
        self::assertSame($before['profile_id'], $after['profile_id']);
    }

    public function testProviderSnapshotRefreshDoesNotRelinkDurableIdentity(): void
    {
        $id = '10000000-0000-4000-8000-000000000010';
        $before = $this->repository->insertLink($this->identity($id, self::PROFILE_A, 'google-sub-A'));
        $this->repository->updateProviderSnapshot($id, 'changed@example.test', null, '2026-09-22 14:15:16.654321');
        $after = $this->repository->findByProviderSubject('google', 'google-sub-A');
        self::assertSame('changed@example.test', $after['provider_email_snapshot']);
        self::assertNull($after['provider_hosted_domain_snapshot']);
        self::assertStringStartsWith('2026-09-22 14:15:16.654321', $after['last_authenticated_at']);
        self::assertSame($before['provider_subject'], $after['provider_subject']);
        self::assertSame($before['profile_id'], $after['profile_id']);
        self::assertSame('synthetic.google.a@example.test', $this->connection->table('profiles')->where('id', self::PROFILE_A)->get()->getRowArray()['email']);
    }

    private function identity(string $id, string $profileId, string $subject): array
    {
        return [
            'id' => $id, 'profile_id' => $profileId, 'provider' => ' Google ', 'provider_subject' => " {$subject} ",
            'provider_email_snapshot' => ' synthetic.a@example.test ', 'provider_hosted_domain_snapshot' => ' example.test ',
            'link_method' => 'bootstrap_verified_email', 'linked_at' => '2026-09-22 12:01:02.123456',
            'last_authenticated_at' => '2026-09-22 12:01:02.123456', 'created_at' => '2026-09-22 12:01:02.123456',
            'updated_at' => '2026-09-22 12:01:02.123456',
        ];
    }

    private function assertPersistenceFailure(callable $operation): void
    {
        $error = null;
        try {
            $operation();
        } catch (Throwable $caught) {
            $error = $caught;
        }
        self::assertNotNull($error, 'Expected the database integrity boundary to reject the write.');
    }
}
