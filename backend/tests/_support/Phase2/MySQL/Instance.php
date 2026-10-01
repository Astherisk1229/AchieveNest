<?php
namespace Tests\Support\Phase2\MySQL;

/** Opt-in proof instance: never reads .env or accepts an arbitrary host/database. */
final class Instance
{
    public const PORT = 33379;
    public const DATABASE = 'achievenest_phase2_disposable_20261001';

    public static function database(): string
    {
        $run = (string) getenv('ACHIEVENEST_PHASE2_RUN');
        if (!preg_match('/^[a-f0-9]{8}$/', $run)) {
            throw new \RuntimeException('PHASE2_RUN_ID_REQUIRED');
        }
        return self::DATABASE . '_' . $run;
    }

    public static function dataDirectory(): string
    {
        return dirname(ROOTPATH) . '/output/phase2-evidence/mysql-disposable-20261001';
    }

    public static function authorize(): void
    {
        if (getenv('ACHIEVENEST_PHASE2_MYSQL') !== '1') {
            throw new \RuntimeException('PHASE2_MYSQL_REQUIRES_EXPLICIT_OPT_IN');
        }
        if (!is_file(self::dataDirectory() . '/auto.cnf')) {
            throw new \RuntimeException('PHASE2_DISPOSABLE_INSTANCE_MISSING');
        }
    }

    public static function assertIdentity(\mysqli $connection, bool $requireDatabase = true): void
    {
        self::authorize();
        $identity = $connection->query('SELECT @@port AS port, @@datadir AS datadir, @@server_uuid AS uuid, DATABASE() AS db')->fetch_assoc();
        $normalize = static fn (string $path): string => strtolower(rtrim(str_replace('\\', '/', $path), '/'));
        $config = parse_ini_file(self::dataDirectory() . '/auto.cnf', true);
        if ((int) $identity['port'] !== self::PORT
            || $normalize($identity['datadir']) !== $normalize(self::dataDirectory())
            || $identity['uuid'] !== ($config['auto']['server-uuid'] ?? null)
            || ($requireDatabase && $identity['db'] !== self::database())) {
            throw new \RuntimeException('PHASE2_DATABASE_IDENTITY_MISMATCH');
        }
    }

    public static function provision(): void
    {
        self::authorize();
        $connection = new \mysqli('127.0.0.1', 'root', '', '', self::PORT);
        self::assertIdentity($connection, false);
        // No IF NOT EXISTS: an existing proof database is never silently reused.
        $connection->query('CREATE DATABASE ' . self::database());
        $connection->close();
    }

    public static function connect(): Connection
    {
        self::authorize();
        return new Connection(['hostname' => '127.0.0.1', 'port' => self::PORT,
            'username' => 'root', 'password' => '', 'database' => self::database(),
            'DBDriver' => 'MySQLi', 'DBPrefix' => '', 'DBDebug' => true,
            'charset' => 'utf8mb4', 'DBCollat' => 'utf8mb4_unicode_ci', 'pConnect' => false]);
    }
}
