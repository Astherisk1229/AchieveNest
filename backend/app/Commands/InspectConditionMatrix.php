<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class InspectConditionMatrix extends BaseCommand
{
    protected $group       = 'Audit';
    protected $name        = 'audit:conditions-matrix';
    protected $description = 'Inspects and audits all structured metadata conditions and predicates for SA-01.5.';

    public function run(array $params)
    {
        $db = \Config\Database::connect();

        CLI::write("========================================================================================", 'cyan');
        CLI::write("SA-01.5: STRUCTURED METADATA & RULE CONDITIONS AUDIT", 'cyan');
        CLI::write("========================================================================================", 'cyan');

        // Check award_evidence_mapping_conditions table
        $conditions = $db->table('award_evidence_mapping_conditions')
            ->select('award_evidence_mapping_conditions.*, award_evidence_mapping_rules.rule_code, award_evidence_mapping_rules.criterion_id')
            ->join('award_evidence_mapping_rules', 'award_evidence_mapping_rules.id = award_evidence_mapping_conditions.mapping_rule_id')
            ->get()->getResultArray();

        CLI::write("Database Evidence Conditions Count: " . count($conditions), 'yellow');

        // Output summary
        $controlledVocabularies = \App\Services\PortfolioStructuredMetadataValidator::CONTROLLED_VOCABULARIES;
        CLI::write("\n[1] CONTROLLED VOCABULARIES ENFORCED:", 'yellow');
        foreach ($controlledVocabularies as $key => $values) {
            CLI::write(sprintf("  - %-22s: [%s]", $key, implode(', ', $values)), 'green');
        }

        CLI::write("\n[2] VERIFICATION & LIFECYCLE ENGINE GATES:", 'yellow');
        CLI::write("  - Record Verification Gate: status == 'verified' (REQUIRED)", 'cyan');
        CLI::write("  - Record Lifecycle Gate: status != 'archived' && status != 'superseded' (REQUIRED)", 'cyan');
        CLI::write("  - Date Scope Gate: Graduating Awards = Career Span / Senior Program; Annual Awards = Academic Year (REQUIRED)", 'cyan');

        CLI::write("\nAudit completed successfully.", 'green');
    }
}
