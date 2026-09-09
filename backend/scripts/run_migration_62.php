<?php
define('FCPATH', realpath(__DIR__ . '/../public') . DIRECTORY_SEPARATOR);
chdir(FCPATH);
require FCPATH . '../app/Config/Paths.php';
$paths = new Config\Paths();
require $paths->systemDirectory . '/Boot.php';
\CodeIgniter\Boot::bootTest($paths);

$db = db_connect();

require_once __DIR__ . '/../app/Database/Migrations/2026-09-08-000062_CreatePersonnelAnnualReviews.php';

$migration = new \App\Database\Migrations\CreatePersonnelAnnualReviews();
$migration->up();

echo "Migration 62 successfully executed!\n";
