<?php

namespace App\Database\Testing;

/** Shared CI factory also protects callers using the framework Config directly. */
final class GuardedDatabaseFactory extends \CodeIgniter\Database\Database
{
    public function load(array $params = [], string $alias = '')
    {
        DatabaseIdentityGuard::assertConfiguration($params, $alias);
        return $this->connections[$alias] = new Connection($params);
    }
}
