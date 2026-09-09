<?php

namespace Config;

use CodeIgniter\Database\Config;

/**
 * Database Configuration
 */
class Database extends Config
{
    /**
     * The directory that holds the Migrations and Seeds directories.
     */
    public string $filesPath = APPPATH . 'Database' . DIRECTORY_SEPARATOR;

    /**
     * Lets you choose which connection group to use if no other is specified.
     */
    public string $defaultGroup = 'default';

    /**
     * The default database connection.
     *
     * @var array<string, mixed>
     */
    public array $default = [
        'DSN'          => '',
        'hostname'     => '',
        'username'     => '',
        'password'     => '',
        'database'     => 'postgres',
        'schema'       => 'public',
        'DBDriver'     => 'Postgre',
        'DBPrefix'     => '',
        'pConnect'     => false,
        'DBDebug'      => true,
        'charset'      => 'utf8',
        'DBCollat'     => '',
        'swapPre'      => '',
        'encrypt'      => false,
        'compress'     => false,
        'strictOn'     => false,
        'failover'     => [],
        'port'         => 5432,
        'connect_timeout' => 5,
        'sslmode'      => 'require',
        'numberNative' => false,
        'foundRows'    => false,
        'dateFormat'   => [
            'date'     => 'Y-m-d',
            'datetime' => 'Y-m-d H:i:s',
            'time'     => 'H:i:s',
        ],
    ];

    /**
     * Supabase development/testing database.
     *
     * Credentials are supplied through the local .env file.
     *
     * @var array<string, mixed>
     */
    public array $development = [
        'DSN'             => '',
        'hostname'        => '',
        'username'        => '',
        'password'        => '',
        'database'        => 'postgres',
        'schema'          => 'public',
        'DBDriver'        => 'Postgre',
        'DBPrefix'        => '',
        'pConnect'        => false,
        'DBDebug'         => true,
        'charset'         => 'utf8',
        'DBCollat'        => '',
        'swapPre'         => '',
        'encrypt'         => false,
        'compress'        => false,
        'strictOn'        => false,
        'failover'        => [],
        'port'            => 5432,
        'connect_timeout' => 5,
        'sslmode'         => 'require',
        'numberNative'    => false,
        'foundRows'       => false,
        'dateFormat'      => [
            'date'     => 'Y-m-d',
            'datetime' => 'Y-m-d H:i:s',
            'time'     => 'H:i:s',
        ],
    ];

    //    /**
    //     * Sample database connection for SQLite3.
    //     *
    //     * @var array<string, mixed>
    //     */
    //    public array $default = [
    //        'database'    => 'database.db',
    //        'DBDriver'    => 'SQLite3',
    //        'DBPrefix'    => '',
    //        'DBDebug'     => true,
    //        'swapPre'     => '',
    //        'failover'    => [],
    //        'foreignKeys' => true,
    //        'busyTimeout' => 1000,
    //        'synchronous' => null,
    //        'dateFormat'  => [
    //            'date'     => 'Y-m-d',
    //            'datetime' => 'Y-m-d H:i:s',
    //            'time'     => 'H:i:s',
    //        ],
    //    ];

    //    /**
    //     * Sample database connection for Postgre.
    //     *
    //     * @var array<string, mixed>
    //     */
    //    public array $default = [
    //        'DSN'        => '',
    //        'hostname'   => 'localhost',
    //        'username'   => 'root',
    //        'password'   => 'root',
    //        'database'   => 'ci4',
    //        'schema'     => 'public',
    //        'DBDriver'   => 'Postgre',
    //        'DBPrefix'   => '',
    //        'pConnect'   => false,
    //        'DBDebug'    => true,
    //        'charset'    => 'utf8',
    //        'swapPre'    => '',
    //        'failover'   => [],
    //        'port'       => 5432,
    //        'dateFormat' => [
    //            'date'     => 'Y-m-d',
    //            'datetime' => 'Y-m-d H:i:s',
    //            'time'     => 'H:i:s',
    //        ],
    //    ];

    //    /**
    //     * Sample database connection for SQLSRV.
    //     *
    //     * @var array<string, mixed>
    //     */
    //    public array $default = [
    //        'DSN'        => '',
    //        'hostname'   => 'localhost',
    //        'username'   => 'root',
    //        'password'   => 'root',
    //        'database'   => 'ci4',
    //        'schema'     => 'dbo',
    //        'DBDriver'   => 'SQLSRV',
    //        'DBPrefix'   => '',
    //        'pConnect'   => false,
    //        'DBDebug'    => true,
    //        'charset'    => 'utf8',
    //        'swapPre'    => '',
    //        'encrypt'    => false,
    //        'failover'   => [],
    //        'port'       => 1433,
    //        'dateFormat' => [
    //            'date'     => 'Y-m-d',
    //            'datetime' => 'Y-m-d H:i:s',
    //            'time'     => 'H:i:s',
    //        ],
    //    ];

    //    /**
    //     * Sample database connection for OCI8.
    //     *
    //     * You may need the following environment variables:
    //     *   NLS_LANG                = 'AMERICAN_AMERICA.UTF8'
    //     *   NLS_DATE_FORMAT         = 'YYYY-MM-DD HH24:MI:SS'
    //     *   NLS_TIMESTAMP_FORMAT    = 'YYYY-MM-DD HH24:MI:SS'
    //     *   NLS_TIMESTAMP_TZ_FORMAT = 'YYYY-MM-DD HH24:MI:SS'
    //     *
    //     * @var array<string, mixed>
    //     */
    //    public array $default = [
    //        'DSN'        => 'localhost:1521/FREEPDB1',
    //        'username'   => 'root',
    //        'password'   => 'root',
    //        'DBDriver'   => 'OCI8',
    //        'DBPrefix'   => '',
    //        'pConnect'   => false,
    //        'DBDebug'    => true,
    //        'charset'    => 'AL32UTF8',
    //        'swapPre'    => '',
    //        'failover'   => [],
    //        'dateFormat' => [
    //            'date'     => 'Y-m-d',
    //            'datetime' => 'Y-m-d H:i:s',
    //            'time'     => 'H:i:s',
    //        ],
    //    ];

    /**
     * This database connection is used when running PHPUnit database tests.
     *
     * @var array<string, mixed>
     */
    public array $tests = [
        'DSN'         => '',
        'hostname'    => '127.0.0.1',
        'username'    => '',
        'password'    => '',
        'database'    => ':memory:',
        'DBDriver'    => 'SQLite3',
        'DBPrefix'    => 'db_',  // Needed to ensure we're working correctly with prefixes live. DO NOT REMOVE FOR CI DEVS
        'pConnect'    => false,
        'DBDebug'     => true,
        'charset'     => 'utf8',
        'DBCollat'    => '',
        'swapPre'     => '',
        'encrypt'     => false,
        'compress'    => false,
        'strictOn'    => true,
        'failover'    => [],
        'port'        => 3306,
        'foreignKeys' => true,
        'busyTimeout' => 1000,
        'synchronous' => null,
        'dateFormat'  => [
            'date'     => 'Y-m-d',
            'datetime' => 'Y-m-d H:i:s',
            'time'     => 'H:i:s',
        ],
    ];

    /**
     * Local WAMP defense MySQL database.
     *
     * @var array<string, mixed>
     */
    public array $local_defense = [
        'DSN'             => '',
        'hostname'        => 'localhost',
        'username'        => 'achievenest_app',
        'password'        => '',
        'database'        => 'achievenest_local',
        'DBDriver'        => 'MySQLi',
        'DBPrefix'        => '',
        'pConnect'        => false,
        'DBDebug'         => true,
        'charset'         => 'utf8mb4',
        'DBCollat'        => 'utf8mb4_unicode_ci',
        'swapPre'         => '',
        'encrypt'         => false,
        'compress'        => false,
        'strictOn'        => false,
        'failover'        => [],
        'port'            => 3306,
        'dateFormat'      => [
            'date'     => 'Y-m-d',
            'datetime' => 'Y-m-d H:i:s',
            'time'     => 'H:i:s',
        ],
    ];

    /**
     * Disposable PostgreSQL connection used only by the Phase 17 replay gate.
     * Credentials are supplied as process environment variables and are never
     * committed. The constructor refuses the protected WAMP database name.
     *
     * @var array<string, mixed>
     */
    public array $phase17_replay = [
        'DSN'             => '',
        'hostname'        => '127.0.0.1',
        'username'        => 'postgres',
        'password'        => '',
        'database'        => 'achievenest_awards_phase_17_ci_replay',
        'schema'          => 'public',
        'DBDriver'        => 'Postgre',
        'DBPrefix'        => '',
        'pConnect'        => false,
        'DBDebug'         => true,
        'charset'         => 'utf8',
        'DBCollat'        => '',
        'swapPre'         => '',
        'encrypt'         => false,
        'compress'        => false,
        'strictOn'        => false,
        'failover'        => [],
        'port'            => 55432,
        'connect_timeout' => 5,
        'sslmode'         => 'disable',
        'dateFormat'      => [
            'date'     => 'Y-m-d',
            'datetime' => 'Y-m-d H:i:s',
            'time'     => 'H:i:s',
        ],
    ];

    /** @var array<string, mixed> */
    public array $phase17m_replay = [
        'DSN' => '', 'hostname' => '127.0.0.1', 'username' => 'root', 'password' => '',
        'database' => 'achievenest_phase17m_replay', 'DBDriver' => 'MySQLi', 'DBPrefix' => '',
        'pConnect' => false, 'DBDebug' => true, 'charset' => 'utf8mb4',
        'DBCollat' => 'utf8mb4_unicode_ci', 'swapPre' => '', 'encrypt' => false,
        'compress' => false, 'strictOn' => false, 'failover' => [], 'port' => 3306,
        'dateFormat' => ['date' => 'Y-m-d', 'datetime' => 'Y-m-d H:i:s', 'time' => 'H:i:s'],
    ];

    /**
     * Disposable isolated validation database for Plan K — Phase K4 remediation.
     * Hard-guarded against targeting protected achievenest_local.
     *
     * @var array<string, mixed>
     */
    public array $k4_test = [
        'DSN'         => '',
        'hostname'    => '127.0.0.1',
        'username'    => '',
        'password'    => '',
        'database'    => 'k4_test.sqlite',
        'DBDriver'    => 'SQLite3',
        'DBPrefix'    => '',
        'pConnect'    => false,
        'DBDebug'     => true,
        'charset'     => 'utf8',
        'DBCollat'    => '',
        'swapPre'     => '',
        'encrypt'     => false,
        'compress'    => false,
        'strictOn'    => true,
        'failover'    => [],
        'port'        => 3306,
        'foreignKeys' => true,
        'busyTimeout' => 1000,
        'synchronous' => null,
        'dateFormat'  => [
            'date'     => 'Y-m-d',
            'datetime' => 'Y-m-d H:i:s',
            'time'     => 'H:i:s',
        ],
    ];

    public function __construct()
    {
        parent::__construct();

        // Keep local defense, hosted development, and automated tests isolated.
        $runtimeTarget = getenv('ACHIEVENEST_ENV') ?: env('ACHIEVENEST_ENV');
        if ($runtimeTarget === 'k4-test') {
            $this->k4_test['database'] = (string) (getenv('K4_TEST_DATABASE') ?: 'k4_test.sqlite');
            if ($this->k4_test['database'] === 'achievenest_local' || ! str_contains($this->k4_test['database'], 'test')) {
                throw new \RuntimeException('K4 test target must be a disposable test database and must never target protected achievenest_local.');
            }
            $this->defaultGroup = 'k4_test';
        } elseif ($runtimeTarget === 'phase17m-replay') {
            $this->phase17m_replay['hostname'] = (string) (getenv('PHASE17M_REPLAY_HOST') ?: '127.0.0.1');
            $this->phase17m_replay['database'] = (string) (getenv('PHASE17M_REPLAY_DATABASE') ?: 'achievenest_phase17m_replay');
            $this->phase17m_replay['username'] = (string) (getenv('PHASE17M_REPLAY_USERNAME') ?: 'root');
            $this->phase17m_replay['password'] = (string) (getenv('PHASE17M_REPLAY_PASSWORD') ?: '');
            $this->phase17m_replay['port'] = (int) (getenv('PHASE17M_REPLAY_PORT') ?: 3306);
            if ($this->phase17m_replay['database'] === 'achievenest_local' || ! str_starts_with($this->phase17m_replay['database'], 'achievenest_phase17m_')) {
                throw new \RuntimeException('Phase 17M replay target must be a disposable achievenest_phase17m_* database.');
            }
            $this->defaultGroup = 'phase17m_replay';
        } elseif ($runtimeTarget === 'phase17-replay') {
            $this->phase17_replay['hostname'] = (string) (getenv('PHASE17_REPLAY_HOST') ?: '127.0.0.1');
            $this->phase17_replay['database'] = (string) (getenv('PHASE17_REPLAY_DATABASE') ?: 'achievenest_awards_phase_17_ci_replay');
            $this->phase17_replay['username'] = (string) (getenv('PHASE17_REPLAY_USERNAME') ?: 'postgres');
            $this->phase17_replay['password'] = (string) (getenv('PHASE17_REPLAY_PASSWORD') ?: '');
            $this->phase17_replay['port'] = (int) (getenv('PHASE17_REPLAY_PORT') ?: 55432);
            if ($this->phase17_replay['database'] === 'achievenest_local') {
                throw new \RuntimeException('Phase 17 replay must never target protected achievenest_local.');
            }
            $this->defaultGroup = 'phase17_replay';
        } elseif ($runtimeTarget === 'local-defense' || env('database.defaultGroup') === 'local_defense') {
            $this->defaultGroup = 'local_defense';
        } elseif (ENVIRONMENT === 'development') {
            $this->defaultGroup = 'development';
        } elseif (ENVIRONMENT === 'testing') {
            $this->defaultGroup = 'tests';
        }
    }
}
