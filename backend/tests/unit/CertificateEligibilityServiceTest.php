<?php

namespace Tests\Unit;

use App\Services\CertificateEligibilityService;
use CodeIgniter\Test\CIUnitTestCase;

final class CertificateEligibilityServiceTest extends CIUnitTestCase
{
    /** @dataProvider cases */
    public function testFinalizedCompatibilityRules(array $record, ?string $purpose): void
    {
        $result=(new CertificateEligibilityService())->resolve($record+['id'=>'r1','verification_status'=>'verified']);
        $this->assertSame($purpose,$result['eligible_purpose']);
        $this->assertSame($purpose === null ? 'NOT_ELIGIBLE' : 'ELIGIBLE',$result['eligibility_status']);
    }

    public static function cases(): array
    {
        return [
            'community participant'=>[['student_category'=>'STUDENT_03','role'=>'participant'],'PARTICIPATION'],
            'community volunteer'=>[['student_category'=>'STUDENT_03','role'=>'volunteer'],'APPRECIATION'],
            'training participated'=>[['student_category'=>'STUDENT_05','verified_engagement_outcome'=>'participated'],'PARTICIPATION'],
            'training completed'=>[['student_category'=>'STUDENT_05','verified_engagement_outcome'=>'completed'],'COMPLETION'],
            'sports champion'=>[['student_category'=>'STUDENT_07','placement'=>'champion'],'RECOGNITION'],
            'leadership position only'=>[['student_category'=>'STUDENT_01','role'=>'president'],null],
            'general member'=>[['student_category'=>'STUDENT_02','role'=>'general_member'],null],
            'journal news item'=>[['student_category'=>'STUDENT_09','role'=>'news_item'],null],
        ];
    }

    public function testUnverifiedRecordIsRejected(): void
    {
        $result=(new CertificateEligibilityService())->resolve(['id'=>'r','student_category'=>'STUDENT_06','verification_status'=>'pending']);
        $this->assertSame(['SOURCE_RECORD_NOT_VERIFIED'],$result['reason_codes']);
    }
}
