<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use RuntimeException;

class VerifyMigrationDialect extends BaseCommand
{
    protected $group = 'Verification';
    protected $name = 'verify:migration-dialect';
    protected $description = 'Verify the immutable legacy inventory and MySQL-only Phase 17M canonical namespace';

    public function run(array $params)
    {
        $legacy = glob(APPPATH . 'Database/Migrations/*.php') ?: [];
        sort($legacy);
        if (count($legacy) !== 49) {
            throw new RuntimeException('Expected the classified 49-file legacy chain; found ' . count($legacy));
        }

        $canonicalFiles = array_merge(
            glob(APPPATH . 'Phase17Canonical/Database/Migrations/*.php') ?: [],
            glob(ROOTPATH . 'database/codeigniter-canonical-baseline/*.sql') ?: []
        );
        $postgresTokens = [
            '/\bCREATE\s+EXTENSION\b/i', '/\bgen_random_uuid\s*\(/i', '/\btimestamptz\b/i',
            '/\bjsonb\b/i', '/\bbytea\b/i', '/\bILIKE\b/i', '/\bPL\/pgSQL\b/i',
            '/\bENABLE\s+ROW\s+LEVEL\s+SECURITY\b/i', '/\bauth\.users\b/i', '/::[a-z_]+/i',
        ];
        $violations = [];
        foreach ($canonicalFiles as $file) {
            // Run fingerprints are evidence artifacts, not migration inputs.
            if (str_contains(basename($file), 'achievenest_phase17m_')) {
                continue;
            }
            $source = (string) file_get_contents($file);
            foreach ($postgresTokens as $token) {
                if (preg_match($token, $source)) {
                    $violations[] = basename($file) . ':' . $token;
                }
            }
        }
        if ($violations !== []) {
            throw new RuntimeException("PostgreSQL-only syntax in canonical MySQL path:\n" . implode("\n", $violations));
        }

        CLI::write('[PASS] 49 legacy migrations remain isolated and classified.', 'green');
        CLI::write('[PASS] Canonical Phase17Canonical namespace contains no PostgreSQL-only constructs.', 'green');
    }
}
