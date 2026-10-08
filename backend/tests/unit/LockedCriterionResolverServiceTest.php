<?php
namespace Tests\Unit;
use App\Services\LockedCriterionResolverService;
use PHPUnit\Framework\TestCase;
use RuntimeException;
final class LockedCriterionResolverServiceTest extends TestCase
{
    private array $snapshot;
    protected function setUp(): void { $this->snapshot=['areas'=>[['area_code'=>'A','max_points'=>70,'categories'=>[['category_code'=>'A.1','name'=>'Degrees','max_points'=>40,'subcategories'=>[['subcategory_code'=>'A.1.1','name'=>'PhD','default_points'=>40]],'options'=>[]],['category_code'=>'A.3','name'=>'Training','max_points'=>20,'subcategories'=>[],'options'=>[['option_group_code'=>'LEVEL','option_code'=>'NATIONAL','points'=>8]]]]]]]; }
    public function testResolvesFixedSubtypeFromLockedSnapshot():void { $r=(new LockedCriterionResolverService())->resolve($this->snapshot,'A.1',['subcategory_code'=>'A1_PHD_HOLDER']); self::assertSame(40.0,$r['configured_points']); self::assertSame('A.1.1',$r['criterion_reference']); }
    public function testResolvesSelectedLevelAndPointsFromTheLockedSubcategory():void
    {
        $snapshot=$this->snapshot;
        $snapshot['areas'][0]['categories'][0]['subcategories'][0]['levels']=[['id'=>'level-national','option_code'=>'NATIONAL','label'=>'National','points'=>8,'is_active'=>1]];
        $r=(new LockedCriterionResolverService())->resolve($snapshot,'A.1',['subcategory_code'=>'A1_PHD_HOLDER','details'=>['level_code'=>'NATIONAL']]);
        self::assertSame(8.0,$r['configured_points']);
        self::assertSame('National',$r['selected_level']['label']);
        self::assertSame('PhD',$r['subcategory']['name']);
    }
    public function testResolvesConfiguredOption():void { $r=(new LockedCriterionResolverService())->resolve($this->snapshot,'A.3',['subcategory_code'=>'A3_ATTENDANCE','details'=>['scope'=>'National']]); self::assertSame(8.0,$r['configured_points']); }
    public function testRejectsUnknownCriterion():void { $this->expectException(RuntimeException::class); (new LockedCriterionResolverService())->resolve($this->snapshot,'B.9',[]); }
    public function testResolvesNtfB1AContractToLockedNumericSubcategory():void
    {
        $r=(new LockedCriterionResolverService())->resolve($this->ntfSnapshot(),'B.1.a',['contract_code'=>'NTF-B1A','subcategory_code'=>'NTF_B1A_MODERATOR_OFFICER']);
        self::assertSame('B.1.1',$r['criterion_reference']);
        self::assertSame(30.0,$r['configured_points']);
        self::assertSame('Moderator / Officer of Clubs',$r['level']['name']);
    }
    public function testRejectsNtfContractAgainstFacultyScale():void
    {
        $snapshot=$this->ntfSnapshot();$snapshot['sheet']['applies_to']='FACULTY';
        $this->expectException(RuntimeException::class);
        (new LockedCriterionResolverService())->resolve($snapshot,'B.1.a',['contract_code'=>'NTF-B1A']);
    }
    public function testRejectsWrongCriterionForNtfContractWithoutFuzzyFallback():void
    {
        $this->expectException(RuntimeException::class);
        (new LockedCriterionResolverService())->resolve($this->ntfSnapshot(),'B.1.AA',['contract_code'=>'NTF-B1A']);
    }
    private function ntfSnapshot():array
    {
        return ['sheet'=>['applies_to'=>'NON_TEACHING_FACULTY'],'areas'=>[['area_code'=>'B','max_points'=>60,'categories'=>[['category_code'=>'B.1','name'=>'School Involvement','max_points'=>30,'requires_manual_hr_rule'=>0,'subcategories'=>[['subcategory_code'=>'B.1.1','name'=>'Moderator / Officer of Clubs','default_points'=>30]],'options'=>[]]]]]];
    }
}
