<?php

namespace App\Commands;

use App\Services\September15BridgePreflightService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use RuntimeException;

class PreflightSeptember15Bridge extends BaseCommand
{
    protected $group = 'Migration';
    protected $name = 'migration:preflight-september15-bridge';
    protected $description = 'Read-only proof gate for the Phase17Canonical September 15 bridge.';

    public function run(array $params)
    {
        $result = (new September15BridgePreflightService())->audit(db_connect());
        CLI::write('canonical_ledger=' . (count($result['ledger']) === 6 ? 'EXPECTED_SIX_ROWS' : 'MISMATCH'));
        CLI::write('canonical_baseline_proven=' . ($result['baseline']['proven'] ? 'YES' : 'NO'));
        CLI::write('september15_targets_present=' . ($result['present_targets'] ? implode(',', $result['present_targets']) : 'NONE'));
        CLI::write('missing_kw_prerequisites=' . ($result['missing_prerequisites'] ? implode(',', $result['missing_prerequisites']) : 'NONE'));
        CLI::write('compatibility_cycle_candidates=' . count($result['compatibility_candidates']));
        foreach ($result['compatibility_candidates'] as $candidate) {
            CLI::write('CANDIDATE ' . json_encode($candidate, JSON_UNESCAPED_SLASHES));
        }
        foreach ($result['transitions']['unsupported'] as $transition) {
            CLI::write("UNSUPPORTED {$transition['from']}->{$transition['to']} active=" . ($transition['active'] ? 'YES' : 'NO'));
        }
        foreach ($result['transitions']['replacements'] as $transition) {
            CLI::write("REPLACEMENT {$transition['from']}->{$transition['to']} state=" . ($transition['missing'] ? 'MISSING' : ($transition['active'] ? 'ACTIVE' : 'INACTIVE')));
        }
        CLI::write('PHD_EXCEPTION ' . json_encode($result['transitions']['phd_exception'], JSON_UNESCAPED_SLASHES));
        CLI::write('faculty_transitions_already_reconciled=' . ($result['transitions']['already_reconciled'] ? 'YES' : 'NO'));
        foreach ($result['bridge_order'] as $index => $migration) {
            CLI::write(sprintf('BRIDGE_%03d=%s', $index + 1, $migration));
        }
        CLI::write('database_writes=ZERO');
        CLI::write('bridge_ready=' . ($result['ready'] ? 'YES' : 'NO'), $result['ready'] ? 'green' : 'red');
        if (! $result['ready']) {
            foreach ($result['failures'] as $failure) {
                CLI::error('BLOCKER ' . $failure);
            }
            throw new RuntimeException('SEPTEMBER15_BRIDGE_PREFLIGHT_FAILED');
        }
    }
}
