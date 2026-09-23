<?php

namespace Tests\Unit;

use App\Services\CertificateIdentityService;
use App\Services\CertificateIssuanceReadinessService;
use App\Services\CertificateSnapshotBuilder;
use CodeIgniter\Test\CIUnitTestCase;

final class CertificateIssuanceFoundationTest extends CIUnitTestCase
{
    public function testServerIdentityIsUniqueAndFormatted(): void
    {
        $service=new CertificateIdentityService();$first=$service->uuid();$second=$service->uuid();$public=$service->publicId();
        self::assertNotSame($first,$second);self::assertMatchesRegularExpression('/^[0-9a-f-]{36}$/',$first);
        self::assertMatchesRegularExpression('/^[0-9a-f]{48}$/',$public);self::assertSame('AN-2026-000123',$service->number(123,2026));
    }

    public function testSnapshotFreezesOfficialIdentityAndResolvedFacts(): void
    {
        $snapshot=(new CertificateSnapshotBuilder())->build(
            ['id'=>'certificate-1','certificate_number'=>'AN-2026-000001','public_verification_id'=>'public-1','verification_url'=>'/verify/certificate/public-1','issued_at'=>'2026-09-21 20:00:00'],
            ['id'=>'student-1','full_name'=>'Synthetic Student'],
            ['id'=>'source-1','title'=>'Community Outreach','category_code'=>'COMMUNITY_SERVICE_VOLUNTEERISM','subcategory_code'=>'COMMUNITY_OUTREACH'],
            'APPRECIATION',['recipient_name'=>'Synthetic Student','activity_title'=>'Community Outreach','issued_date'=>'2026-09-21'],
            ['id'=>'template-version-1','template_family_id'=>'template-family-1','version_number'=>1],[]
        );
        self::assertSame('AN-2026-000001',$snapshot['certificate_identity']['certificate_number']);
        self::assertSame('source-1',$snapshot['source_record']['id']);self::assertSame('COMMUNITY_SERVICE_VOLUNTEERISM',$snapshot['classification']['category']);
        self::assertSame('APPRECIATION',$snapshot['certificate_purpose']);self::assertSame('template-version-1',$snapshot['template']['version_id']);
    }

    public function testReadinessFailsClosedForMissingTemplateAndCurrentCertificate(): void
    {
        $service=new CertificateIssuanceReadinessService();$eligibility=['eligibility_status'=>'ELIGIBLE','eligible_purpose'=>'APPRECIATION','reason_codes'=>[]];
        $missing=$service->evaluate($eligibility,null,[],[],false);self::assertSame('ELIGIBLE_NOT_ISSUABLE',$missing['status']);self::assertContains('MISSING_PUBLISHED_TEMPLATE',$missing['blocking_reasons']);
        $current=$service->evaluate($eligibility,['status'=>'PUBLISHED','certificate_purpose'=>'APPRECIATION','placeholder_contract'=>[],'signatory_slots'=>[]],[],[],true);
        self::assertSame('ELIGIBLE_NOT_ISSUABLE',$current['status']);self::assertContains('CURRENT_CERTIFICATE_ALREADY_EXISTS',$current['blocking_reasons']);
    }
}
