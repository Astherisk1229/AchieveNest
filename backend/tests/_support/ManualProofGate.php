<?php
namespace Tests\Support;

use PHPUnit\Framework\TestCase;

final class ManualProofGate
{
    public static function requireOptIn(bool $legacyRawConnection = false): void
    {
        if (getenv('ACHIEVENEST_MANUAL_PROOFS') !== '1') {
            TestCase::markTestSkipped('Manual proof requires explicit ACHIEVENEST_MANUAL_PROOFS=1 and suite selection.');
        }
        if ($legacyRawConnection) {
            throw new \RuntimeException('MANUAL_PROOF_UNSAFE_DATABASE: port legacy PDO fixtures to an explicitly disposable database before enabling.');
        }
        // Opt-in never disables the testing database identity guard.
    }
}
