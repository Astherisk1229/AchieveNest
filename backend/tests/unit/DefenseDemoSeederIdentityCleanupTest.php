<?php

namespace Tests\Unit;

use CodeIgniter\Test\CIUnitTestCase;

final class DefenseDemoSeederIdentityCleanupTest extends CIUnitTestCase
{
    public function testResetPreservesStableDemoIdentityAnchorsForReferencedScenarioData(): void
    {
        $source = file_get_contents(APPPATH . 'Database/Seeds/DefenseDemoSeeder.php');

        foreach ([
            "table('profiles')->like('id', \$demoPrefix)->delete()",
            "table('student_profiles')->like('profile_id', \$demoPrefix)->delete()",
            "table('personnel_profiles')->like('profile_id', \$demoPrefix)->delete()",
            "table('profile_roles')->like('profile_id', \$demoPrefix)->delete()",
            "table('local_auth_credentials')->like('profile_id', \$demoPrefix)->delete()",
        ] as $destructiveIdentityReset) {
            self::assertStringNotContainsString($destructiveIdentityReset, $source);
        }

        self::assertStringContainsString("\$this->call('DefenseDemoPersonaSeeder')", $source);
        self::assertStringContainsString('upserts', $source);
    }
}
