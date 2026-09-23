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
    public function testResolvesConfiguredOption():void { $r=(new LockedCriterionResolverService())->resolve($this->snapshot,'A.3',['subcategory_code'=>'A3_ATTENDANCE','details'=>['scope'=>'National']]); self::assertSame(8.0,$r['configured_points']); }
    public function testRejectsUnknownCriterion():void { $this->expectException(RuntimeException::class); (new LockedCriterionResolverService())->resolve($this->snapshot,'B.9',[]); }
}
