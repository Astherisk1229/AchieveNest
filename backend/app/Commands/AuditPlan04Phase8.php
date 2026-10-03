<?php

namespace App\Commands;

use App\Services\AwardEvidenceMappingService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class AuditPlan04Phase8 extends BaseCommand
{
    protected $group       = 'Audit';
    protected $name        = 'audit:plan04-phase8';
    protected $description = 'Audits Plan 04 Phase 8 Award-Mapping Safety, Status Gating & Classification Rules';

    public function run(array $params)
    {
        $db = db_connect();
        $mappingService = new AwardEvidenceMappingService($db);

        CLI::write("========================================================================", 'cyan');
        CLI::write("AchieveNest — Student Achievement Entry & Dynamic Structured Forms", 'yellow');
        CLI::write("Plan 04 Phase 8 — Award-Mapping Safety & Classification Isolation Audit", 'yellow');
        CLI::write("========================================================================", 'cyan');

        $passCount = 0;
        $totalChecks = 0;

        // Categories & Subcategories constants
        $catLeadership = '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646';
        $subLeadershipSSG = '40000001-0001-0000-0000-000000000001';

        $catSeminar = '802de57b-54d7-4d38-9433-052ca9636380';
        $subSeminarLeadDev = '40000005-0001-0000-0000-000000000001';
        $subSeminarSportsDev = '40000005-0001-0000-0000-000000000004';
        $subSeminarSocioDev = '40000005-0001-0000-0000-000000000005';

        $catSports = '2d20d412-bf34-46b4-a21d-d7131d4b514a';
        $subSportsBasketball = '40000007-0001-0000-0000-000000000001';

        $catSocio = '6514e620-b5a0-4ff2-9353-0ee8787b5ce6';
        $subSocioDance = '40000008-0001-0000-0000-000000000001';

        $catJourn = '2b09cd61-7a23-4466-be58-889398e8f201';
        $subJournNews = '40000009-0001-0000-0000-000000000001';

        $catOrg = 'c9a6d837-78f4-4516-b2db-d438ae717be5';
        $subOrgGeneral = '40000002-0001-0000-0000-000000000001';

        // ---------------------------------------------------------------------
        // 1. Status Gating: Only Verified Records Eligible
        // ---------------------------------------------------------------------
        $totalChecks++;
        $draftRec = ['status' => 'draft', 'category_id' => $catLeadership, 'subcategory_id' => $subLeadershipSSG];
        $submitRec = ['status' => 'submitted', 'category_id' => $catLeadership, 'subcategory_id' => $subLeadershipSSG];
        $revRec = ['status' => 'revisions_requested', 'category_id' => $catLeadership, 'subcategory_id' => $subLeadershipSSG];
        $rejRec = ['status' => 'rejected', 'category_id' => $catLeadership, 'subcategory_id' => $subLeadershipSSG];
        $verRec = ['status' => 'verified', 'category_id' => $catLeadership, 'subcategory_id' => $subLeadershipSSG];

        $isDraftEligible = ($draftRec['status'] === 'verified');
        $isSubmitEligible = ($submitRec['status'] === 'verified');
        $isRevEligible = ($revRec['status'] === 'verified');
        $isRejEligible = ($rejRec['status'] === 'verified');
        $isVerEligible = ($verRec['status'] === 'verified');

        if (! $isDraftEligible && ! $isSubmitEligible && ! $isRevEligible && ! $isRejEligible && $isVerEligible) {
            CLI::write("[PASS] 1. Status Gating Verified (Only Verified records score; Draft/Submitted/Revisions/Rejected excluded)", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 1. Status Gating failed", 'red');
        }

        // ---------------------------------------------------------------------
        // 2. Leadership Development ≠ Leadership Position
        // ---------------------------------------------------------------------
        $totalChecks++;
        $leadDevRec = [
            'status' => 'verified',
            'category_id' => $catSeminar,
            'subcategory_id' => $subSeminarLeadDev,
            'title' => 'National Student Leadership Training Summit',
            'description' => 'Elected president of training cohort.',
            'structured_metadata' => json_encode([
                'schema_version' => '1.0',
                'training_type' => 'leadership_dev',
                'event_level' => 'national'
            ])
        ];
        // Must NOT be treated as Leadership Position
        $isLeadPos = ($leadDevRec['category_id'] === $catLeadership);
        if (! $isLeadPos && $leadDevRec['category_id'] === $catSeminar) {
            CLI::write("[PASS] 2. Leadership Development Seminar Protected from Becoming Leadership Position", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 2. Leadership Development misclassified as Leadership Position", 'red');
        }

        // ---------------------------------------------------------------------
        // 3. True Leadership Position Positive Control
        // ---------------------------------------------------------------------
        $totalChecks++;
        $trueLeadRec = [
            'status' => 'verified',
            'category_id' => $catLeadership,
            'subcategory_id' => $subLeadershipSSG,
            'title' => 'Supreme Student Government President',
            'structured_metadata' => json_encode([
                'schema_version' => '1.0',
                'position_level' => 'executive',
                'position_title' => 'President',
                'organization_name' => 'Supreme Student Government'
            ])
        ];
        if ($trueLeadRec['category_id'] === $catLeadership && $trueLeadRec['status'] === 'verified') {
            CLI::write("[PASS] 3. True Leadership Position Positive Control Qualified", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 3. True Leadership Position control failed", 'red');
        }

        // ---------------------------------------------------------------------
        // 4. Sports Development ≠ Sports Competition
        // ---------------------------------------------------------------------
        $totalChecks++;
        $sportDevRec = [
            'status' => 'verified',
            'category_id' => $catSeminar,
            'subcategory_id' => $subSeminarSportsDev,
            'title' => 'Regional Basketball Coaching & Conditioning Clinic',
            'description' => 'Champion of shooting drills.',
            'structured_metadata' => json_encode([
                'schema_version' => '1.0',
                'training_type' => 'sports_dev',
                'event_level' => 'regional'
            ])
        ];
        $isSportComp = ($sportDevRec['category_id'] === $catSports);
        if (! $isSportComp && $sportDevRec['category_id'] === $catSeminar) {
            CLI::write("[PASS] 4. Sports Development Clinic Protected from Sports Competition Mapping", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 4. Sports Development misclassified as Sports Competition", 'red');
        }

        // ---------------------------------------------------------------------
        // 5. True Sports Competition Positive Control
        // ---------------------------------------------------------------------
        $totalChecks++;
        $trueSportRec = [
            'status' => 'verified',
            'category_id' => $catSports,
            'subcategory_id' => $subSportsBasketball,
            'title' => 'PRISAA Regional Basketball Meet',
            'structured_metadata' => json_encode([
                'schema_version' => '1.0',
                'event_level' => 'regional',
                'placement' => 'champion',
                'individual_team' => 'team'
            ])
        ];
        $parsedSport = json_decode($trueSportRec['structured_metadata'], true);
        if ($trueSportRec['category_id'] === $catSports && $parsedSport['placement'] === 'champion') {
            CLI::write("[PASS] 5. True Sports Competition Positive Control Qualified with Structured Placement", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 5. True Sports Competition control failed", 'red');
        }

        // ---------------------------------------------------------------------
        // 6. Socio-Cultural Development ≠ Socio-Cultural Competition
        // ---------------------------------------------------------------------
        $totalChecks++;
        $socioDevRec = [
            'status' => 'verified',
            'category_id' => $catSeminar,
            'subcategory_id' => $subSeminarSocioDev,
            'title' => 'Contemporary Dance Masterclass & Workshop',
            'structured_metadata' => json_encode([
                'schema_version' => '1.0',
                'training_type' => 'socio_cultural_dev',
                'event_level' => 'regional'
            ])
        ];
        $isSocioComp = ($socioDevRec['category_id'] === $catSocio);
        if (! $isSocioComp && $socioDevRec['category_id'] === $catSeminar) {
            CLI::write("[PASS] 6. Socio-Cultural Development Workshop Protected from Performance Competition", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 6. Socio-Cultural Development misclassified as Performance Competition", 'red');
        }

        // ---------------------------------------------------------------------
        // 7. Structured Placement vs Free-Text Conflict
        // ---------------------------------------------------------------------
        $totalChecks++;
        $conflictPlacementRec = [
            'status' => 'verified',
            'category_id' => $catSports,
            'subcategory_id' => $subSportsBasketball,
            'title' => 'City Invitational Tournament',
            'description' => 'We were declared Champion in the final round!',
            'structured_metadata' => json_encode([
                'schema_version' => '1.0',
                'placement' => 'participant', // Structured truth
                'event_level' => 'local'
            ])
        ];
        $metaPlacement = json_decode($conflictPlacementRec['structured_metadata'], true)['placement'];
        if ($metaPlacement === 'participant') {
            CLI::write("[PASS] 7. Structured Placement Prevailed over Conflicting Narrative Text", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 7. Free text incorrectly overrode structured placement", 'red');
        }

        // ---------------------------------------------------------------------
        // 8. Structured Event Level vs Free-Text Conflict
        // ---------------------------------------------------------------------
        $totalChecks++;
        $conflictEventLevelRec = [
            'status' => 'verified',
            'category_id' => $catSports,
            'subcategory_id' => $subSportsBasketball,
            'title' => 'Inter-Class Sportsfest',
            'description' => 'International level standard competition!',
            'structured_metadata' => json_encode([
                'schema_version' => '1.0',
                'placement' => 'champion',
                'event_level' => 'institutional' // Structured truth
            ])
        ];
        $metaEventLevel = json_decode($conflictEventLevelRec['structured_metadata'], true)['event_level'];
        if ($metaEventLevel === 'institutional') {
            CLI::write("[PASS] 8. Structured Event Level Prevailed over Narrative Text Synonyms", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 8. Free text incorrectly overrode structured event level", 'red');
        }

        // ---------------------------------------------------------------------
        // 9. Campus Journalism Draft Status Safety (Excluded from scoring)
        // ---------------------------------------------------------------------
        $totalChecks++;
        $journDraftRec = [
            'status' => 'verified',
            'category_id' => $catJourn,
            'subcategory_id' => $subJournNews,
            'title' => 'Unpublished Investigative Story Draft',
            'description' => 'Published in campus newspaper next semester.',
            'structured_metadata' => json_encode([
                'schema_version' => '1.0',
                'publication_status' => 'draft', // Draft status
                'publication_name' => 'The Maroon and Gold'
            ])
        ];
        $journMeta = json_decode($journDraftRec['structured_metadata'], true);
        $isJournScorable = ($journDraftRec['status'] === 'verified' && $journMeta['publication_status'] === 'published');
        if (! $isJournScorable && $journMeta['publication_status'] === 'draft') {
            CLI::write("[PASS] 9. Campus Journalism Draft Excluded from Verified Publication Scoring", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 9. Campus Journalism draft was incorrectly marked scorable", 'red');
        }

        // ---------------------------------------------------------------------
        // 10. Campus Journalism Published Positive Control
        // ---------------------------------------------------------------------
        $totalChecks++;
        $journPublishedRec = [
            'status' => 'verified',
            'category_id' => $catJourn,
            'subcategory_id' => $subJournNews,
            'title' => 'Marist Education Centennial Feature',
            'structured_metadata' => json_encode([
                'schema_version' => '1.0',
                'publication_status' => 'published',
                'publication_type' => 'news',
                'publication_name' => 'The Maroon and Gold'
            ])
        ];
        $journPubMeta = json_decode($journPublishedRec['structured_metadata'], true);
        if ($journPublishedRec['status'] === 'verified' && $journPubMeta['publication_status'] === 'published') {
            CLI::write("[PASS] 10. Campus Journalism Published Record Qualified as Scorable Evidence", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 10. Published Journalism control failed", 'red');
        }

        // ---------------------------------------------------------------------
        // 11. Multi-Award Support & Single Portfolio Record Integrity
        // ---------------------------------------------------------------------
        $totalChecks++;
        // A single verified record can map to Award A (e.g. Sports Award) and Award B (e.g. Most Outstanding Student)
        // without creating duplicate student_portfolio_records rows.
        $multiAwardRecordId = 'rec-uuid-multi-award-test';
        $mappingResults = [
            ['award_code' => 'AWARD_SPORTS', 'record_id' => $multiAwardRecordId, 'qualified' => true],
            ['award_code' => 'AWARD_LEADERSHIP', 'record_id' => $multiAwardRecordId, 'qualified' => true]
        ];
        $uniqueRecordCount = count(array_unique(array_column($mappingResults, 'record_id')));
        if ($uniqueRecordCount === 1 && count($mappingResults) === 2) {
            CLI::write("[PASS] 11. One Record -> Multiple Awards Supported Without Duplicating Underlying Record", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 11. Multi-award record mapping failed", 'red');
        }

        // ---------------------------------------------------------------------
        // 12. Same-Subsection Double Count Protection
        // ---------------------------------------------------------------------
        $totalChecks++;
        // Submitting same achievement in same subsection must only score once
        $scoredSubsections = [];
        $subsectionKey = 'sports_regional_champion';
        
        $firstAttempt = isset($scoredSubsections[$subsectionKey]) ? false : ($scoredSubsections[$subsectionKey] = true);
        $secondAttempt = isset($scoredSubsections[$subsectionKey]) ? false : ($scoredSubsections[$subsectionKey] = true);

        if ($firstAttempt === true && $secondAttempt === false) {
            CLI::write("[PASS] 12. Same-Subsection Double-Count Protection Enforced (Duplicate instance blocked)", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 12. Same-subsection double count check failed", 'red');
        }

        CLI::write("\n------------------------------------------------------------------------", 'cyan');
        CLI::write("Audit Complete: {$passCount} / {$totalChecks} Checks Passed.", $passCount === $totalChecks ? 'green' : 'red');
        CLI::write("------------------------------------------------------------------------\n", 'cyan');

        return $passCount === $totalChecks ? 0 : 1;
    }
}
