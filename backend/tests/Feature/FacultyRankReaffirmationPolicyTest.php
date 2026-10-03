<?php

namespace Tests\Feature;

use App\Services\ApprovedRankActivationService;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;

#[\PHPUnit\Framework\Attributes\Group('manual-proof')]
final class FacultyRankReaffirmationPolicyTest extends CIUnitTestCase
{
    public static function setUpBeforeClass(): void
    {
        \Tests\Support\ManualProofGate::requireOptIn(false);
        parent::setUpBeforeClass();
    }

    private function source(string $path): string
    {
        return file_get_contents(ROOTPATH . $path);
    }

    public function testSourceAndDestinationResolveToDistinctCanonicalRanks(): void
    {
        $db = Database::connect('default');
        $source = $db->table('faculty_rank_catalog')->where(['rank_code' => 'ASSISTANT_PROFESSOR', 'is_active' => 1])->get()->getRowArray();
        $destination = $db->table('faculty_rank_catalog')->where(['rank_code' => 'ASSISTANT_PROFESSOR_I', 'is_active' => 1])->get()->getRowArray();

        self::assertSame('Assistant Professor', $source['display_label']);
        self::assertSame('Assistant Professor I', $destination['display_label']);
        self::assertNotSame($source['rank_code'], $destination['rank_code']);
    }

    public function testValidUpwardTransitionRemainsAuthoritative(): void
    {
        $transition = Database::connect('default')->table('faculty_rank_transitions')->where([
            'from_rank_code' => 'ASSISTANT_PROFESSOR',
            'to_rank_code' => 'ASSISTANT_PROFESSOR_I',
            'transition_type' => 'normal_sequential',
            'is_active' => 1,
        ])->get()->getRowArray();

        self::assertNotNull($transition);
        self::assertSame(0, (int) $transition['requires_verified_phd']);
    }

    public function testCatalogueContainsNoSameRankTransition(): void
    {
        $count = Database::connect('default')->table('faculty_rank_transitions')
            ->where('from_rank_code = to_rank_code', null, false)
            ->where('is_active', 1)
            ->countAllResults();

        self::assertSame(0, $count);
    }

    public function testFailedEvaluationExplicitlyRetainsPresentRank(): void
    {
        $source = $this->source('app/Services/RecommendedRankService.php');
        self::assertStringContainsString("\$suggested=\$passed?\$applied:\$present", $source);
        self::assertStringContainsString("'retained_present_rank'", $source);
    }

    public function testReaffirmationCreatesNoFakeRankHistoryTransition(): void
    {
        $recording = $this->source('app/Services/OfflineApprovedRankService.php');
        $activation = $this->source('app/Services/ApprovedRankActivationService.php');

        self::assertStringContainsString("\$reaffirmation=\$previous['rank_code']===\$code", $recording);
        self::assertStringContainsString("if(!\$reaffirmation)\$this->db->table('personnel_rank_history')->insert", $recording);
        self::assertStringContainsString("if(\$present['rank_code']===\$target['rank_code'])", $activation);
        self::assertStringContainsString("return'reaffirmation'", $activation);
        self::assertStringContainsString('REAFFIRMATION_HISTORY_MUST_BE_ABSENT', $activation);
    }

    public function testNonFacultyIsRejectedAtBothApprovedRankBoundaries(): void
    {
        foreach (['OfflineApprovedRankService.php', 'ApprovedRankActivationService.php'] as $file) {
            self::assertStringContainsString('FACULTY_APPROVED_RANK_REQUIRED', $this->source('app/Services/' . $file));
        }
    }

    public function testReaffirmationActivationMutatesNeitherProfileNorHistory(): void
    {
        $fixture = $this->activationFixture('ASSISTANT_PROFESSOR', false);
        try {
            $result = (new ApprovedRankActivationService($fixture['db']))->retry($fixture['actor'], $fixture['target_record_id']);
            self::assertSame('reaffirmation', $result['transition_semantics']);
            self::assertSame('Assistant Professor', $fixture['db']->table('personnel_profiles')->select('current_rank_title')->where('profile_id', $fixture['profile_id'])->get()->getRowArray()['current_rank_title']);
            self::assertSame(0, $fixture['db']->table('personnel_rank_history')->where('personnel_profile_id', $fixture['profile_id'])->countAllResults());
            self::assertSame(1, $fixture['db']->table('personnel_rank_activation_attempts')->where(['approved_rank_record_id' => $fixture['target_record_id'], 'outcome' => 'succeeded'])->countAllResults());
        } finally {
            $this->cleanupFixture($fixture);
        }
    }

    public function testDistinctRankActivationChangesProfileAndHistoryExactlyOnce(): void
    {
        $fixture = $this->activationFixture('ASSISTANT_PROFESSOR_I', true);
        try {
            $result = (new ApprovedRankActivationService($fixture['db']))->retry($fixture['actor'], $fixture['target_record_id']);
            self::assertSame('rank_change', $result['transition_semantics']);
            self::assertSame('Assistant Professor I', $fixture['db']->table('personnel_profiles')->select('current_rank_title')->where('profile_id', $fixture['profile_id'])->get()->getRowArray()['current_rank_title']);
            self::assertSame(1, $fixture['db']->table('personnel_rank_history')->where(['personnel_profile_id' => $fixture['profile_id'], 'status' => 'historical'])->countAllResults());
            self::assertSame(1, $fixture['db']->table('personnel_rank_history')->where(['personnel_profile_id' => $fixture['profile_id'], 'status' => 'current', 'rank_code' => 'ASSISTANT_PROFESSOR_I'])->countAllResults());
            self::assertSame(1, $fixture['db']->table('personnel_rank_activation_attempts')->where(['approved_rank_record_id' => $fixture['target_record_id'], 'outcome' => 'succeeded'])->countAllResults());
        } finally {
            $this->cleanupFixture($fixture);
        }
    }

    private function activationFixture(string $targetRank, bool $withCurrentHistory): array
    {
        $db = Database::connect('default');
        $suffix = substr(str_replace('-', '', $this->uuid()), 0, 10);
        $profileId = $this->uuid();
        $baseProfile = $db->table('profiles')->where('id', '2b4ac83b-4f90-43d4-b0a8-b23be422c36e')->get()->getRowArray();
        $basePersonnel = $db->table('personnel_profiles')->where('profile_id', '2b4ac83b-4f90-43d4-b0a8-b23be422c36e')->get()->getRowArray();
        $baseDecision = $db->table('personnel_recommended_rank_decisions')->where('id', 'dd93bab3-28b7-41df-b49d-9d4c40e54211')->get()->getRowArray();
        $baseReview = $db->table('personnel_hr_final_rank_reviews')->where('id', '62f6ee5f-d76c-46de-82c3-d747eb4cb86e')->get()->getRowArray();
        $baseRecord = $db->table('personnel_approved_rank_records')->where('id', '683f4ae6-91e9-4aa8-86c0-1939ffe42e59')->get()->getRowArray();
        self::assertNotNull($baseProfile); self::assertNotNull($basePersonnel); self::assertNotNull($baseDecision); self::assertNotNull($baseReview); self::assertNotNull($baseRecord);

        unset($baseProfile['active_hr_guard']); $baseProfile['id'] = $profileId; $baseProfile['email'] = "r7s4-rankfix-{$suffix}@example.test"; $baseProfile['institutional_id'] = "R7S4-RF-{$suffix}"; $baseProfile['full_name'] = "R7S4_RANKFIX_{$suffix}";
        $db->table('profiles')->insert($baseProfile);
        $basePersonnel['profile_id'] = $profileId; $basePersonnel['current_rank_title'] = 'Assistant Professor';
        $db->table('personnel_profiles')->insert($basePersonnel);

        $decisionIds = [$this->uuid(), $this->uuid()];
        foreach ($decisionIds as $decisionId) { $decision = $baseDecision; $decision['id'] = $decisionId; $decision['personnel_profile_id'] = $profileId; $db->table('personnel_recommended_rank_decisions')->insert($decision); }
        $reviewIds = [$this->uuid(), $this->uuid()];
        foreach ($reviewIds as $index => $reviewId) { $review = $baseReview; $review['id'] = $reviewId; $review['recommended_rank_decision_id'] = $decisionIds[$index]; $review['personnel_profile_id'] = $profileId; $db->table('personnel_hr_final_rank_reviews')->insert($review); }
        $recordIds = [$this->uuid(), $this->uuid()];
        foreach ($recordIds as $index => $recordId) {
            $record = $baseRecord; unset($record['pending_personnel_guard'], $record['original_case_guard']); $record['id'] = $recordId; $record['hr_final_rank_review_id'] = $reviewIds[$index]; $record['personnel_profile_id'] = $profileId; $record['approved_rank_code'] = $index === 0 ? 'ASSISTANT_PROFESSOR' : $targetRank; $record['previous_rank_code_snapshot'] = 'ASSISTANT_PROFESSOR'; $record['effectivity_date'] = $index === 0 ? date('Y-m-d', strtotime('-1 day')) : date('Y-m-d'); $record['status'] = $index === 0 ? 'active' : 'activation_failed'; $record['activated_at'] = $index === 0 ? date('Y-m-d H:i:s', strtotime('-1 day')) : null; $record['activation_failure_code'] = $index === 1 ? 'CONTROLLED_TEST_RETRY' : null; $record['activation_failure_reason'] = $index === 1 ? 'Controlled test setup' : null;
            $db->table('personnel_approved_rank_records')->insert($record);
        }
        if ($withCurrentHistory) {
            $db->table('personnel_rank_history')->insert(['id' => $this->uuid(), 'approved_rank_record_id' => $recordIds[0], 'personnel_profile_id' => $profileId, 'rank_code' => 'ASSISTANT_PROFESSOR', 'effective_from' => date('Y-m-d', strtotime('-1 day')), 'status' => 'current']);
            $db->table('personnel_rank_history')->insert(['id' => $this->uuid(), 'approved_rank_record_id' => $recordIds[1], 'personnel_profile_id' => $profileId, 'rank_code' => $targetRank, 'effective_from' => date('Y-m-d'), 'status' => 'pending']);
        }
        return ['db' => $db, 'profile_id' => $profileId, 'decision_ids' => $decisionIds, 'review_ids' => $reviewIds, 'record_ids' => $recordIds, 'target_record_id' => $recordIds[1], 'actor' => ['profile' => ['id' => 'd0000000-0000-0000-0001-000000000005'], 'roles' => ['hr_staff']]];
    }

    private function cleanupFixture(array $fixture): void
    {
        $db = $fixture['db'];
        $db->table('notifications')->where('reference_type', 'personnel_approved_rank_records')->whereIn('reference_id', $fixture['record_ids'])->delete();
        $db->table('personnel_rank_activation_attempts')->whereIn('approved_rank_record_id', $fixture['record_ids'])->delete();
        $db->table('personnel_approved_rank_events')->whereIn('approved_rank_record_id', $fixture['record_ids'])->delete();
        $db->table('personnel_rank_history')->where('personnel_profile_id', $fixture['profile_id'])->delete();
        $db->table('personnel_approved_rank_records')->whereIn('id', $fixture['record_ids'])->delete();
        $db->table('personnel_hr_final_rank_reviews')->whereIn('id', $fixture['review_ids'])->delete();
        $db->table('personnel_recommended_rank_decisions')->whereIn('id', $fixture['decision_ids'])->delete();
        $db->table('personnel_profiles')->where('profile_id', $fixture['profile_id'])->delete();
        $db->table('profiles')->where('id', $fixture['profile_id'])->delete();
    }

    private function uuid(): string
    {
        $data = random_bytes(16); $data[6] = chr((ord($data[6]) & 15) | 64); $data[8] = chr((ord($data[8]) & 63) | 128);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
