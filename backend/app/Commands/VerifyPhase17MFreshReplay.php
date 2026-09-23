<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;
use RuntimeException;

class VerifyPhase17MFreshReplay extends BaseCommand
{
    protected $group = 'Verification';
    protected $name = 'verify:phase17m-fresh-replay';
    protected $description = 'Run the guarded canonical migration namespace and print deterministic fingerprints';

    public function run(array $params)
    {
        $db = Database::connect();
        $name = (string) $db->getDatabase();
        if ($name === 'achievenest_local' || ! str_starts_with($name, 'achievenest_phase17m_')) {
            throw new RuntimeException("Refusing fresh replay against non-disposable database [{$name}].");
        }

        service('migrations')->setNamespace('Phase17Canonical')->latest();
        $tables = $db->query("SELECT table_name,engine,table_collation FROM information_schema.tables WHERE table_schema=? AND table_name<>'migrations' ORDER BY table_name", [$name])->getResultArray();
        $columns = $db->query("SELECT table_name,column_name,ordinal_position,column_type,is_nullable,column_default,extra,collation_name FROM information_schema.columns WHERE table_schema=? AND table_name<>'migrations' ORDER BY table_name,ordinal_position", [$name])->getResultArray();
        $indexes = $db->query("SELECT table_name,index_name,non_unique,seq_in_index,column_name,collation,sub_part FROM information_schema.statistics WHERE table_schema=? AND table_name<>'migrations' ORDER BY table_name,index_name,seq_in_index", [$name])->getResultArray();
        $referenceTables = ['roles','colleges','academic_programs','administrative_units','portfolio_categories','portfolio_subcategories','award_definitions','award_cycles','award_scoring_model_versions','award_criteria','award_criterion_components','award_evidence_mapping_rules','award_evidence_mapping_conditions','award_scoring_rules','award_portfolio_mappings'];
        $reference = [];
        foreach ($referenceTables as $table) {
            $reference[$table] = $db->table($table)->orderBy('id')->get()->getResultArray();
        }
        $schemaHash = hash('sha256', json_encode([$tables, $columns, $indexes], JSON_UNESCAPED_SLASHES));
        $referenceHash = hash('sha256', json_encode($reference, JSON_UNESCAPED_SLASHES));

        CLI::write('[PASS] Protected-name and disposable-prefix guard', 'green');
        CLI::write('database=' . $name);
        CLI::write('business_tables=' . count($tables));
        CLI::write('schema_sha256=' . $schemaHash);
        CLI::write('reference_sha256=' . $referenceHash);
    }
}
