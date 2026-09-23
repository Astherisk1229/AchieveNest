<?php
use PHPUnit\Framework\TestCase;

final class RankNotificationVisibilityPhaseUTest extends TestCase
{
    private function source(string $path): string { return file_get_contents(ROOTPATH.$path); }

    public function testPersonnelReceivesRecordedPendingCorrectionAndCancellationNotifications(): void
    {
        $record=$this->source('app/Services/OfflineApprovedRankService.php');
        foreach(['approved_rank_recorded','pending_future_rank_created','present_rank_changed'] as $type) self::assertStringContainsString($type,$record);
        $history=$this->source('app/Services/RankHistoryCorrectionService.php');
        foreach(['rank_record_corrected','pending_rank_cancelled'] as $type) self::assertStringContainsString($type,$history);
    }

    public function testReviewerReceivesOnlyFinalRecordedAndEffectiveNotifications(): void
    {
        $record=$this->source('app/Services/OfflineApprovedRankService.php');
        self::assertStringContainsString('approved_rank_recorded_scope',$record);
        self::assertStringContainsString('approved_rank_effective_scope',$record);
        $history=$this->source('app/Services/RankHistoryCorrectionService.php');
        $notify=substr($history,strpos($history,'private function notify'));
        self::assertStringNotContainsString('DEPARTMENT_HEAD',$notify);
        self::assertStringNotContainsString('DEAN',$notify);
    }

    public function testActivationSuccessFailureNotificationsAreRoleSafe(): void
    {
        $source=$this->source('app/Services/ApprovedRankActivationService.php');
        foreach(['approved_rank_effective','approved_rank_effective_scope','approved_rank_activation_succeeded','approved_rank_activation_failed','approved_rank_activation_delayed'] as $type) self::assertStringContainsString($type,$source);
        $failure=substr($source,strpos($source,'private function notifyFailure'),strpos($source,'private function send')-strpos($source,'private function notifyFailure'));
        self::assertStringContainsString('HR has been notified',$failure);
        self::assertStringNotContainsString("failed with code '.\$code",substr($failure,0,strpos($failure,'foreach')));
        self::assertStringNotContainsString('signed_document',$source);
    }

    public function testSignedDocumentIsRestrictedToHrAndOwner(): void
    {
        $source=$this->source('app/Services/OfflineApprovedRankService.php');
        self::assertStringContainsString("if(!\$this->isHr(\$actor)&&!\$this->isOwner(\$actor,\$r))",$source);
        self::assertStringContainsString('SIGNED_APPROVED_DOCUMENT_ACCESS_DENIED',$source);
    }

    public function testRankHistoryReviewerProjectionOmitsSensitiveFields(): void
    {
        $source=$this->source('app/Services/RankHistoryCorrectionService.php');
        $projection=$this->between($source,'private function reviewerProjection','private function correction');
        foreach(['reason','correction_type','signed_document','approval_date','source_record_id'] as $field) self::assertStringNotContainsString($field,$projection);
        foreach(['approved_rank_code','effectivity_date','status'] as $field) self::assertStringContainsString($field,$projection);
    }

    public function testReviewerPlacementProjectionContainsOnlyCurrentAndPendingSafeFields(): void
    {
        $source=$this->source('app/Services/PersonnelRankPlacementService.php');
        self::assertStringContainsString("whereIn('p.status',['current','pending_future'])",$source);
        $projection=substr($source,strpos($source,"if(!\$limited)return\$rows;"),700);
        foreach(['cancellation_reason','correction_reason','activation_failure_reason','supporting_credential_references','confirmed_by_profile_id'] as $field) self::assertStringNotContainsString($field,$projection);
    }

    public function testNotificationApiOmitsRecipientAndEntityDatabaseIds(): void
    {
        $source=$this->source('app/Controllers/Api/NotificationController.php');
        $formatted=$this->between($source,"\$formatted = array_map",'return $this->respond');
        self::assertStringNotContainsString("'recipient_profile_id'",$formatted);
        self::assertStringNotContainsString("'entity_id'",$formatted);
        self::assertStringContainsString("'id'",$formatted);
    }

    public function testHrAdminAndHrStaffReceiveFullPlacementAccess(): void
    {
        $source=$this->source('app/Controllers/Api/PersonnelRankPlacementController.php');
        self::assertStringContainsString("hasRole(\$a,'hr_staff')",$source);
        self::assertStringContainsString("hasRole(\$a,'hr_admin')",$source);
    }

    private function between(string $source,string $from,string $to): string
    {
        $start=strpos($source,$from);$end=strpos($source,$to,$start);
        return substr($source,$start,$end-$start);
    }
}
