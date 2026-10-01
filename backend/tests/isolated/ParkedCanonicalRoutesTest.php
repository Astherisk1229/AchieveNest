<?php
namespace Tests\Isolated;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;

final class ParkedCanonicalRoutesTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    public function testAllRegisteredCanonicalWriteRoutesFailClosed(): void
    {
        $base = 'api/v1/student/achievements';
        foreach ([['post', '/drafts'], ['put', '/record'], ['post', '/record/evidence'],
            ['delete', '/record/evidence/evidence'], ['post', '/record/evidence/evidence/scan'], ['post', '/record/submit'],
        ] as [$method, $path]) {
            $result = $this->{$method}($base . $path);
            $result->assertStatus(410);
            $result->assertJSONFragment(['error' => ['code' => 'CANONICAL_STUDENT_WRITES_DISABLED', 'message' => 'This student achievement write API is parked. Use the supported portfolio workflow.']]);
        }
    }
}
