<?php

namespace Tests\Unit;

use App\Services\StudentCategoryMapperRegistry;
use CodeIgniter\Test\CIUnitTestCase;

final class StudentCategoryMapperRegistryTest extends CIUnitTestCase
{
    /** @dataProvider supportedFacts */
    public function testSupportedFinalizedFacts(array $fact): void
    {
        $this->assertSame([], (new StudentCategoryMapperRegistry())->validate($fact + ['subcategory_id'=>'subcategory']));
    }

    public static function supportedFacts(): array
    {
        return [
            'student 02 participant'=>[['category_code'=>'ORG_MEMBERSHIP_PARTICIPATION','participation_role'=>'activity_participant']],
            'student 03 volunteer'=>[['category_code'=>'COMMUNITY_SERVICE_VOLUNTEERISM','participation_role'=>'volunteer']],
            'student 05 participated'=>[['category_code'=>'SEMINAR_TRAINING','verified_engagement_outcome'=>'participated']],
            'student 05 completed'=>[['category_code'=>'SEMINAR_TRAINING','verified_engagement_outcome'=>'completed']],
            'student 07 participant'=>[['category_code'=>'SPORTS','placement'=>'participant']],
            'student 07 champion'=>[['category_code'=>'SPORTS','placement'=>'champion']],
            'student 08 participant'=>[['category_code'=>'SOCIO_CULTURAL_PERFORMING_ARTS','placement'=>'participant']],
            'student 08 gold'=>[['category_code'=>'SOCIO_CULTURAL_PERFORMING_ARTS','placement'=>'gold']],
            'student 09 contributor'=>[['category_code'=>'CAMPUS_JOURNALISM','participation_role'=>'publication_contributor']],
        ];
    }

    public function testMissingFactsFailClosed(): void
    {
        $mapper=new StudentCategoryMapperRegistry();
        $this->assertSame(['ROLE_NOT_FINALIZED'],$mapper->validate(['category_code'=>'COMMUNITY_SERVICE_VOLUNTEERISM','subcategory_id'=>'s']));
        $this->assertSame(['CATEGORY_MAPPING_UNRESOLVED'],$mapper->validate(['category_code'=>'CITATION_RECOGNITION','subcategory_id'=>'s']));
        $this->assertSame(['SUBCATEGORY_MAPPING_UNRESOLVED'],$mapper->validate(['category_code'=>'SPORTS','placement'=>'champion']));
    }
}
