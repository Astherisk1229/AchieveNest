<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

class AddMustChangePasswordToLocalAuthCredentials extends Migration
{
    public function up(): void
    {
        if (! $this->tableExistsFresh('local_auth_credentials')) {
            throw new RuntimeException('Required table local_auth_credentials does not exist.');
        }

        if (! $this->columnExistsFresh('local_auth_credentials', 'must_change_password')) {
            $this->forge->addColumn('local_auth_credentials', [
                'must_change_password' => [
                    'type'       => 'TINYINT',
                    'constraint' => 1,
                    'null'       => false,
                    'default'    => 1,
                    'after'      => 'password_changed_at',
                ],
            ]);
        }
    }

    public function down(): void
    {
        if ($this->tableExistsFresh('local_auth_credentials')
            && $this->columnExistsFresh('local_auth_credentials', 'must_change_password')) {
            $this->forge->dropColumn('local_auth_credentials', 'must_change_password');
        }
    }

    private function tableExistsFresh(string $table): bool
    {
        $row = $this->db->query(
            'SELECT EXISTS (
                SELECT 1
                FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND TABLE_TYPE = \'BASE TABLE\'
            ) AS object_exists',
            [$table]
        )->getRowArray();

        return (int) ($row['object_exists'] ?? 0) === 1;
    }

    private function columnExistsFresh(string $table, string $column): bool
    {
        $row = $this->db->query(
            'SELECT EXISTS (
                SELECT 1
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND COLUMN_NAME = ?
            ) AS object_exists',
            [$table, $column]
        )->getRowArray();

        return (int) ($row['object_exists'] ?? 0) === 1;
    }
}
