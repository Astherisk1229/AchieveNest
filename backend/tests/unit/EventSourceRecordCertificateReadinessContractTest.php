<?php

namespace Tests\Unit;

use App\Services\CertificateEligibilityService;
use App\Services\StudentCategoryMapperRegistry;
use CodeIgniter\Test\CIUnitTestCase;

final class EventSourceRecordCertificateReadinessContractTest extends CIUnitTestCase
{
    public function testCommunityVolunteerFactBecomesAppreciationEligible(): void
    {
        $fact=['category_code'=>'COMMUNITY_SERVICE_VOLUNTEERISM','subcategory_id'=>'community-based','participation_role'=>'volunteer'];
        $this->assertSame([], (new StudentCategoryMapperRegistry())->validate($fact));
        $eligibility=(new CertificateEligibilityService())->resolve(['id'=>'source-community','category_code'=>'COMMUNITY_SERVICE_VOLUNTEERISM','verification_status'=>'verified','structured_attributes'=>['role'=>'volunteer','origin_type'=>'event','origin_event_id'=>'event-community','origin_event_participation_id'=>'participation-1']]);
        $this->assertSame('ELIGIBLE',$eligibility['eligibility_status']);
        $this->assertSame('APPRECIATION',$eligibility['eligible_purpose']);
        $this->assertSame('source-community',$eligibility['source_record_id']);
    }

    public function testSportsChampionFactBecomesRecognitionEligible(): void
    {
        $fact=['category_code'=>'SPORTS','subcategory_id'=>'basketball','placement'=>'champion'];
        $this->assertSame([], (new StudentCategoryMapperRegistry())->validate($fact));
        $eligibility=(new CertificateEligibilityService())->resolve(['id'=>'source-sports','category_code'=>'SPORTS','verification_status'=>'verified','structured_attributes'=>['placement'=>'champion','origin_type'=>'event','origin_event_id'=>'event-sports','origin_event_participation_id'=>'participation-2']]);
        $this->assertSame('RECOGNITION',$eligibility['eligible_purpose']);
    }

    public function testPendingEventFactCannotBecomeCertificateEligible(): void
    {
        $eligibility=(new CertificateEligibilityService())->resolve(['id'=>'source-pending','category_code'=>'COMMUNITY_SERVICE_VOLUNTEERISM','verification_status'=>'pending','structured_attributes'=>['role'=>'volunteer']]);
        $this->assertSame('NOT_ELIGIBLE',$eligibility['eligibility_status']);
        $this->assertSame(['SOURCE_RECORD_NOT_VERIFIED'],$eligibility['reason_codes']);
    }
}
