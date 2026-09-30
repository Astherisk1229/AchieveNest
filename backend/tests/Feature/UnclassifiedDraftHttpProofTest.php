<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\LocalTokenService;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Evidence-first entry: a draft can exist before a category is chosen; nothing but a draft can.
 * Requires the local backend at http://127.0.0.1:8080. Fixture drafts are removed in tearDown().
 *
 * @group http-proof
 */
final class UnclassifiedDraftHttpProofTest extends CIUnitTestCase
{
    private const BASE = 'http://127.0.0.1:8080/api/v1';
    private const LEADERSHIP = '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646';
    private const CLUB = '40000001-0001-0000-0000-000000000003';

    protected $db;
    private array $tokens = [];
    private array $recordIds = [];

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
        foreach ($this->tokens as $token) {
            $this->db->table('local_auth_sessions')->where('token_hash', hash('sha256', $token))->delete();
        }
        foreach ($this->recordIds as $id) {
            $this->db->table('student_portfolio_verification_events')->where('portfolio_record_id', $id)->delete();
            $this->db->table('student_portfolio_records')->where('id', $id)->delete();
        }
        parent::tearDown();
    }

    public function testDraftMayStartWithoutCategoryButNothingElseMay(): void
    {
        $token = $this->token($this->credentialedStudent());

        $created = $this->json('POST', '/portfolio', ['submit_now' => false, 'title' => '', 'category_id' => null], $token);
        self::assertSame(201, $created['status'], $created['raw']);
        $id = $created['body']['data']['id'];
        $this->recordIds[] = $id;
        self::assertNull($this->categoryOf($id));

        // Listed and readable while unclassified.
        $list = $this->json('GET', '/portfolio', null, $token);
        self::assertContains($id, array_column($list['body']['data']['records'] ?? [], 'id'), $list['raw']);
        self::assertSame(200, $this->json('GET', "/portfolio/{$id}", null, $token)['status']);

        // Basic information can be saved before classification; a subcategory without a category is refused.
        self::assertSame(200, $this->json('PUT', "/portfolio/{$id}", ['title' => 'Leadership Excellence Award', 'category_id' => null], $token)['status']);
        self::assertSame(422, $this->json('PUT', "/portfolio/{$id}", ['category_id' => null, 'subcategory_id' => self::CLUB], $token)['status']);

        // Submitting while unclassified is refused.
        $submit = $this->json('POST', "/portfolio/{$id}/resubmit", null, $token);
        self::assertSame(422, $submit['status'], $submit['raw']);
        self::assertSame('draft', $this->statusOf($id));

        // Classifying later works.
        $classify = $this->json('PUT', "/portfolio/{$id}", ['category_id' => self::LEADERSHIP, 'subcategory_id' => self::CLUB], $token);
        self::assertSame(200, $classify['status'], $classify['raw']);
        self::assertSame(self::LEADERSHIP, $this->categoryOf($id));

        // The database itself refuses a non-draft record without a category.
        $this->db->table('student_portfolio_records')->where('id', $id)->update(['category_id' => null, 'subcategory_id' => null]);
        $threw = false;
        try {
            $threw = $this->db->table('student_portfolio_records')->where('id', $id)->update(['status' => 'submitted']) === false;
        } catch (\Throwable) {
            $threw = true;
        }
        self::assertTrue($threw, 'The CHECK constraint must reject a submitted record without a category.');
        self::assertSame('draft', $this->statusOf($id));
    }

    private function statusOf(string $id): string
    {
        return (string) $this->db->table('student_portfolio_records')->select('status')->where('id', $id)->get()->getRowArray()['status'];
    }

    private function categoryOf(string $id): ?string
    {
        return $this->db->table('student_portfolio_records')->select('category_id')->where('id', $id)->get()->getRowArray()['category_id'];
    }

    private function credentialedStudent(): string
    {
        $row = $this->db->table('profiles p')->select('p.id')
            ->join('local_auth_credentials c', "c.profile_id = p.id AND c.status = 'active' AND c.must_change_password = 0")
            ->where('p.account_type', 'student')->where('p.status', 'active')
            ->get(1)->getRowArray();
        if ($row === null) {
            self::markTestSkipped('No credentialed active student.');
        }

        return (string) $row['id'];
    }

    private function token(string $profileId): string
    {
        $token = (new LocalTokenService($this->db))->issueToken($profileId, false, '127.0.0.1', 'unclassified-draft-proof')['access_token'];
        $this->tokens[] = $token;

        return $token;
    }

    private function uuid(): string
    {
        $d = random_bytes(16);
        $d[6] = chr((ord($d[6]) & 0x0f) | 0x40);
        $d[8] = chr((ord($d[8]) & 0x3f) | 0x80);

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($d), 4));
    }

    private function json(string $method, string $path, ?array $payload, string $token): array
    {
        $data = $payload === null ? '' : json_encode($payload);
        $headers = ['Authorization: Bearer ' . $token, 'Accept: application/json', 'Content-Type: application/json', 'Content-Length: ' . strlen($data)];
        $context = stream_context_create(['http' => ['method' => $method, 'ignore_errors' => true, 'timeout' => 60, 'header' => $headers, 'content' => $data]]);
        $raw = (string) file_get_contents(self::BASE . $path, false, $context);
        $status = (int) preg_replace('/^\\S+\\s(\\d{3}).*$/', '$1', $http_response_header[0] ?? 'HTTP/1.1 000');

        return ['status' => $status, 'raw' => $raw, 'body' => json_decode($raw, true) ?? []];
    }
}
