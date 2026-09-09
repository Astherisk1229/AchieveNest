<?php

namespace App\Commands;

use App\Services\PortfolioStructuredMetadataValidator;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class AuditPlan04Phase5 extends BaseCommand
{
    protected $group       = 'Audit';
    protected $name        = 'audit:plan04-phase5';
    protected $description = 'Audits Plan 04 Phase 5 Controlled Vocabulary, Schema Validation, and Safety Rules';

    public function run(array $params)
    {
        $db = db_connect();
        $validator = new PortfolioStructuredMetadataValidator($db);

        CLI::write("========================================================================", 'cyan');
        CLI::write("AchieveNest — Student Achievement Entry & Dynamic Structured Forms", 'yellow');
        CLI::write("Plan 04 Phase 5 — Controlled Vocabulary & Validation Audit", 'yellow');
        CLI::write("========================================================================", 'cyan');

        $passCount = 0;
        $totalChecks = 0;

        // 1. Check Controlled Vocabularies count & 5-tier event level
        $totalChecks++;
        $eventLevels = PortfolioStructuredMetadataValidator::CONTROLLED_VOCABULARIES['event_level'];
        $expectedEventLevels = ['institutional', 'local', 'regional', 'national', 'international'];
        if ($eventLevels === $expectedEventLevels) {
            CLI::write("[PASS] 1. Event Level 5-Tier Controlled Vocabulary Verified", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 1. Event Level Vocabulary Mismatch", 'red');
        }

        // 2. Test Invalid Category UUID
        $totalChecks++;
        $invCat = $validator->validateTaxonomyPair('invalid-uuid', null);
        if (! $invCat['valid'] && ($invCat['error']['code'] ?? '') === 'INVALID_CATEGORY_ID') {
            CLI::write("[PASS] 2. Invalid Category UUID Rejected", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 2. Invalid Category UUID handling failed", 'red');
        }

        // 3. Test Invalid Taxonomy Pair (Leadership with Sports Subcategory)
        $totalChecks++;
        $leadCatId = '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646'; // Leadership Position
        $sportsSubId = '40000007-0001-0000-0000-000000000001'; // Basketball
        $invPair = $validator->validateTaxonomyPair($leadCatId, $sportsSubId);
        if (! $invPair['valid'] && ($invPair['error']['code'] ?? '') === 'INVALID_TAXONOMY_COMBINATION') {
            CLI::write("[PASS] 3. Incompatible Category/Subcategory Pair Rejected", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 3. Incompatible Category/Subcategory Pair not rejected", 'red');
        }

        // 4. Test Valid Taxonomy Pair (Leadership with SSG Subcategory)
        $totalChecks++;
        $ssgSubId = '40000001-0001-0000-0000-000000000001'; // SSG
        $validPair = $validator->validateTaxonomyPair($leadCatId, $ssgSubId);
        if ($validPair['valid'] && $validPair['category']['name'] === 'Leadership Position') {
            CLI::write("[PASS] 4. Valid Taxonomy Pair Accepted", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 4. Valid Taxonomy Pair resolution failed", 'red');
        }

        // 5. Test Forbidden Award/Scoring Metadata Injection
        $totalChecks++;
        $injMeta = [
            'schema_version' => '1.0',
            'award_id' => 'award-123',
            'score' => 100,
            'points' => 50,
            'academic_year' => '2025-2026',
            'semester' => '1st_semester'
        ];
        $injResult = $validator->validateMetadata($leadCatId, $ssgSubId, $injMeta, false);
        if (! $injResult['valid'] && isset($injResult['errors']['structured_metadata.award_id'])) {
            CLI::write("[PASS] 5. Forbidden Award/Scoring Key Injection Rejected", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 5. Award/Scoring Key Injection not rejected", 'red');
        }

        // 6. Test Unknown Top-Level Metadata Key
        $totalChecks++;
        $unknownMeta = [
            'schema_version' => '1.0',
            'random_fake_field' => 'exploit_value',
            'academic_year' => '2025-2026',
            'semester' => '1st_semester'
        ];
        $unknownResult = $validator->validateMetadata($leadCatId, $ssgSubId, $unknownMeta, false);
        if (! $unknownResult['valid'] && isset($unknownResult['errors']['structured_metadata.random_fake_field'])) {
            CLI::write("[PASS] 6. Unknown Top-Level Metadata Key Rejected", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 6. Unknown Metadata Key not rejected", 'red');
        }

        // 7. Test Invalid Controlled Option Value
        $totalChecks++;
        $invControlledMeta = [
            'schema_version' => '1.0',
            'event_level' => 'galactic_level', // Invalid
            'academic_year' => '2025-2026',
            'semester' => '1st_semester'
        ];
        $invCtrlResult = $validator->validateMetadata($leadCatId, $ssgSubId, $invControlledMeta, false);
        if (! $invCtrlResult['valid'] && isset($invCtrlResult['errors']['structured_metadata.event_level'])) {
            CLI::write("[PASS] 7. Invalid Controlled Option Value Rejected", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 7. Invalid Controlled Option Value not rejected", 'red');
        }

        // 8. Test Draft Incomplete Fields Permitted (Draft Mode)
        $totalChecks++;
        $draftMeta = [
            'schema_version' => '1.0',
            'position_title' => 'Vice President' // Missing academic_year / semester
        ];
        $draftResult = $validator->validateMetadata($leadCatId, $ssgSubId, $draftMeta, false);
        if ($draftResult['valid']) {
            CLI::write("[PASS] 8. Permissive Incomplete Draft Allowed", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 8. Incomplete draft was incorrectly rejected", 'red');
        }

        // 9. Test Submit Missing Required Fields Rejected (Submit Mode)
        $totalChecks++;
        $submitMeta = [
            'schema_version' => '1.0',
            'position_title' => 'Vice President' // Missing academic_year & semester on submit
        ];
        $submitResult = $validator->validateMetadata($leadCatId, $ssgSubId, $submitMeta, true);
        if (! $submitResult['valid'] && isset($submitResult['errors']['structured_metadata.academic_year'])) {
            CLI::write("[PASS] 9. Incomplete Submission Rejected on Submit", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 9. Incomplete submission not rejected on submit", 'red');
        }

        // 10. Test Hidden Incompatible Field Sanitization (individual_team = individual clears team_role)
        $totalChecks++;
        $hiddenMeta = [
            'schema_version' => '1.0',
            'individual_team' => 'individual',
            'team_role' => 'Point Guard', // Incompatible with individual
            'academic_year' => '2025-2026',
            'semester' => '1st_semester'
        ];
        $sportsCatId = '2d20d412-bf34-46b4-a21d-d7131d4b514a';
        $hiddenResult = $validator->validateMetadata($sportsCatId, $sportsSubId, $hiddenMeta, true);
        if ($hiddenResult['valid'] && ! isset($hiddenResult['sanitized_metadata']['team_role'])) {
            CLI::write("[PASS] 10. Hidden Incompatible Payload Automatically Sanitized", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 10. Hidden incompatible payload sanitization failed", 'red');
        }

        CLI::write("\n------------------------------------------------------------------------", 'cyan');
        CLI::write("Audit Complete: {$passCount} / {$totalChecks} Checks Passed.", $passCount === $totalChecks ? 'green' : 'red');
        CLI::write("------------------------------------------------------------------------\n", 'cyan');

        return $passCount === $totalChecks ? 0 : 1;
    }
}
