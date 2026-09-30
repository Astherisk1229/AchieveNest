<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\LocalTokenService;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Step 7 proof: GET /notifications returns reference_type and reference_id so the UI can navigate.
 * Requires the local backend at http://127.0.0.1:8080. The fixture notification is removed in tearDown().
 *
 * @group http-proof
 */
final class NotificationReferenceHttpProofTest extends CIUnitTestCase
{
    private const BASE = 'http://127.0.0.1:8080/api/v1';

    protected $db;
    private ?string $notificationId = null;
    private ?string $token = null;

    protected function setUp(): void
    {
        parent::setUp();
        $this->db = db_connect('local_defense');
        $config = new \Config\Database();
        $config->default = $config->local_defense;
        $config->defaultGroup = 'local_defense';
        \CodeIgniter\Config\Factories::injectMock('config', 'Database', $config);
    }

    protected function tearDown(): void
    {
        if ($this->notificationId !== null) {
            $this->db->table('notifications')->where('id', $this->notificationId)->delete();
        }
        if ($this->token !== null) {
            $this->db->table('local_auth_sessions')->where('token_hash', hash('sha256', $this->token))->delete();
        }
        parent::tearDown();
    }

    public function testNotificationsExposeReferenceTypeAndId(): void
    {
        $row = $this->db->table('profiles p')->select('p.id')
            ->join('local_auth_credentials c', "c.profile_id = p.id AND c.status = 'active' AND c.must_change_password = 0")
            ->where('p.account_type', 'student')->where('p.status', 'active')->get(1)->getRowArray();
        if ($row === null) {
            self::markTestSkipped('No credentialed active student.');
        }
        $record = $this->db->table('student_portfolio_records')->select('id')->where('student_profile_id', $row['id'])->get(1)->getRowArray();
        if ($record === null) {
            self::markTestSkipped('The credentialed student has no portfolio record to reference.');
        }
        $this->notificationId = $this->uuid();
        $this->db->table('notifications')->insert([
            'id' => $this->notificationId, 'recipient_profile_id' => $row['id'], 'actor_profile_id' => null,
            'notification_type' => 'portfolio_verified', 'title' => 'Step7 proof', 'message' => 'Step7 proof notification',
            'reference_type' => 'student_portfolio_records', 'reference_id' => $record['id'], 'is_mandatory' => 0,
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        $this->token = (new LocalTokenService($this->db))->issueToken((string) $row['id'], false, '127.0.0.1', 'step7-http-proof')['access_token'];

        $context = stream_context_create(['http' => ['method' => 'GET', 'ignore_errors' => true, 'timeout' => 60,
            'header' => ['Authorization: Bearer ' . $this->token, 'Accept: application/json']]]);
        $raw = (string) file_get_contents(self::BASE . '/notifications', false, $context);
        $body = json_decode($raw, true);
        $found = array_values(array_filter($body['data']['notifications'] ?? [], fn (array $n): bool => $n['id'] === $this->notificationId));

        self::assertCount(1, $found, $raw);
        self::assertSame('student_portfolio_records', $found[0]['reference_type']);
        self::assertSame($record['id'], $found[0]['reference_id']);
        self::assertSame('portfolio_verified', $found[0]['type']);
    }

    private function uuid(): string
    {
        $d = random_bytes(16);
        $d[6] = chr((ord($d[6]) & 0x0f) | 0x40);
        $d[8] = chr((ord($d[8]) & 0x3f) | 0x80);

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($d), 4));
    }
}
