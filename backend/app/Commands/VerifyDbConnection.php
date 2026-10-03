<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Throwable;

class VerifyDbConnection extends BaseCommand
{
    protected $group       = 'Database';
    protected $name        = 'db:verify-defense';
    protected $description = 'Verifies CodeIgniter local defense MySQL connection and table accessibility.';

    public function run(array $params)
    {
        try {
            $db = \Config\Database::connect();
            CLI::write("CONNECTED_GROUP: " . $db->DBGroup, 'green');
            CLI::write("DB_DRIVER: " . $db->DBDriver, 'green');
            CLI::write("HOSTNAME: " . $db->hostname, 'green');
            CLI::write("DATABASE: " . $db->database, 'green');
            CLI::write("PORT: " . $db->port, 'green');

            $row = $db->query("SELECT DATABASE() AS cur_db, VERSION() AS ver, CURRENT_USER() AS cur_user")->getRowArray();
            CLI::write("RUNTIME_DB: " . ($row['cur_db'] ?? 'N/A'), 'green');
            CLI::write("RUNTIME_VERSION: " . ($row['ver'] ?? 'N/A'), 'green');
            CLI::write("RUNTIME_USER: " . ($row['cur_user'] ?? 'N/A'), 'green');

            $cs = $db->query("SHOW VARIABLES LIKE 'character_set_connection'")->getRowArray();
            $col = $db->query("SHOW VARIABLES LIKE 'collation_connection'")->getRowArray();
            CLI::write("CHARSET_CONNECTION: " . ($cs['Value'] ?? 'unknown'), 'green');
            CLI::write("COLLATION_CONNECTION: " . ($col['Value'] ?? 'unknown'), 'green');

            $rolesCount = $db->table('roles')->countAllResults();
            $collegesCount = $db->table('colleges')->countAllResults();
            $programsCount = $db->table('academic_programs')->countAllResults();
            $unitsCount = $db->table('administrative_units')->countAllResults();
            $categoriesCount = $db->table('portfolio_categories')->countAllResults();
            $subcategoriesCount = $db->table('portfolio_subcategories')->countAllResults();
            $awardsCount = $db->table('award_definitions')->countAllResults();

            CLI::write("READ_ROLES: $rolesCount (Expected: 7)", 'yellow');
            CLI::write("READ_COLLEGES: $collegesCount (Expected: 5)", 'yellow');
            CLI::write("READ_PROGRAMS: $programsCount (Expected: 14)", 'yellow');
            CLI::write("READ_UNITS: $unitsCount (Expected: 19)", 'yellow');
            CLI::write("READ_CATEGORIES: $categoriesCount (Expected: 9)", 'yellow');
            CLI::write("READ_SUBCATEGORIES: $subcategoriesCount (Expected: 57)", 'yellow');
            CLI::write("READ_AWARDS: $awardsCount (Expected: 15)", 'yellow');
            CLI::write("CODEIGNITER_MYSQL_VERIFICATION: PASS", 'green');
        } catch (Throwable $e) {
            CLI::error("CODEIGNITER_MYSQL_VERIFICATION: FAIL - " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
