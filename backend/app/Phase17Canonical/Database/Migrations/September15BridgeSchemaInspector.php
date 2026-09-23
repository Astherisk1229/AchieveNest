<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\BaseConnection;

/** Reads committed MySQL schema state without CodeIgniter metadata caches. */
class September15BridgeSchemaInspector
{
    public function __construct(private readonly BaseConnection $db)
    {
    }

    public function tableExists(string $table): bool
    {
        $row = $this->db->query(
            'SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema=? AND table_name=? AND table_type=\'BASE TABLE\'',
            [$this->database(), $table]
        )->getRowArray();

        return (int) ($row['total'] ?? 0) === 1;
    }

    public function columnExists(string $table, string $column): bool
    {
        return $this->column($table, $column) !== null;
    }

    /** @return array<string, mixed>|null */
    public function column(string $table, string $column): ?array
    {
        $row = $this->db->query(
            'SELECT COLUMN_TYPE AS column_type, IS_NULLABLE AS is_nullable, COLUMN_DEFAULT AS column_default, EXTRA AS extra, GENERATION_EXPRESSION AS generation_expression '
            . 'FROM information_schema.columns WHERE table_schema=? AND table_name=? AND column_name=?',
            [$this->database(), $table, $column]
        )->getRowArray();

        return $row ?: null;
    }

    /** @return list<array<string, mixed>> */
    public function index(string $table, string $index): array
    {
        return $this->db->query(
            'SELECT NON_UNIQUE AS non_unique, COLUMN_NAME AS column_name, SEQ_IN_INDEX AS seq_in_index, SUB_PART AS sub_part '
            . 'FROM information_schema.statistics WHERE table_schema=? AND table_name=? AND index_name=? ORDER BY SEQ_IN_INDEX',
            [$this->database(), $table, $index]
        )->getResultArray();
    }

    public function indexExists(string $table, string $index): bool
    {
        return $this->index($table, $index) !== [];
    }

    private function database(): string
    {
        return (string) $this->db->getDatabase();
    }
}
