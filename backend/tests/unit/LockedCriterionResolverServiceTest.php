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
    public function testPhdUnitsUseTheEditedLockedLevelWithoutAnExplicitOptionSelection(): void
    {
        $snapshot = $this->snapshot;
        $snapshot['areas'][0]['categories'][0]['subcategories'][] = [
            'subcategory_code' => 'A.1.2', 'name' => 'Ph.D. Units', 'default_points' => 0,
            'levels' => [
                ['id' => 'nine', 'label' => '9', 'points' => 6, 'is_active' => 1],
                ['id' => 'fifteen', 'label' => '15', 'points' => 12, 'is_active' => 1],
            ],
        ];
        $result = (new LockedCriterionResolverService())->resolve($snapshot, 'A.1', [
            'subcategory_code' => 'A1_PHD_UNITS', 'details' => ['units_completed' => '15'],
        ]);
        self::assertSame(12.0, $result['configured_points']);
        self::assertSame('fifteen', $result['selected_level']['id']);
    }
    /** @dataProvider graduateUnitThresholds */
    public function testGraduateUnitPreviewMatchesConfiguredScoreBoundaries(string $code, string $label, int $units, float $points): void
    {
        $isPhd = $code === 'A.1.2';
        $thresholds = $isPhd
            ? [[3, 2], [6, 4], [9, 6], [12, 8], [15, 10]]
            : [[3, 1], [6, 2], [9, 3], [12, 4], [15, 5], [18, 6], [21, 7], [24, 8], [27, 9], [30, 10]];
        $snapshot = $this->snapshot;
        $snapshot['areas'][0]['categories'][0]['subcategories'][] = [
            'subcategory_code' => $code, 'name' => $label, 'default_points' => 0,
            'levels' => array_map(static fn (array $row): array => ['label' => $row[0] . ($row[0] === ($isPhd ? 15 : 30) ? '+' : '') . ' units', 'points' => $row[1], 'is_active' => 1], $thresholds),
        ];
        $result = (new LockedCriterionResolverService())->resolve($snapshot, 'A.1', [
            'subcategory_code' => $code,
            'details' => ['units_completed' => (string) $units],
        ]);
        self::assertSame($points, $result['configured_points']);
    }

    public static function graduateUnitThresholds(): array
    {
        return [
            'PhD below first threshold' => ['A.1.2', 'Ph.D. Units', 2, 0.0],
            'PhD first threshold' => ['A.1.2', 'Ph.D. Units', 3, 2.0],
            'PhD between thresholds' => ['A.1.2', 'Ph.D. Units', 5, 2.0],
            'PhD second threshold' => ['A.1.2', 'Ph.D. Units', 6, 4.0],
            'PhD maximum threshold' => ['A.1.2', 'Ph.D. Units', 15, 10.0],
            'MA below first threshold' => ['A.1.4', 'MA Units', 2, 0.0],
            'MA first threshold' => ['A.1.4', 'MA Units', 3, 1.0],
            'MA between thresholds' => ['A.1.4', 'MA Units', 5, 1.0],
            'MA second threshold' => ['A.1.4', 'MA Units', 6, 2.0],
            'MA maximum threshold' => ['A.1.4', 'MA Units', 30, 10.0],
        ];
    }
    public function testResolvesConfiguredOption():void { $r=(new LockedCriterionResolverService())->resolve($this->snapshot,'A.3',['subcategory_code'=>'A3_ATTENDANCE','details'=>['scope'=>'National']]); self::assertSame(8.0,$r['configured_points']); }
    /** @dataProvider facultyFullMaximumCriteria */
    public function testFacultyB2AndB5ResolveToLockedFullCriterionMaximum(string $code, float $maximum): void
    {
        $snapshot = ['sheet' => ['applies_to' => 'FACULTY'], 'areas' => [['area_code' => 'B', 'max_points' => 50, 'categories' => [['category_code' => $code, 'name' => $code, 'max_points' => $maximum, 'options' => [['option_group_code' => 'TYPE', 'option_code' => 'BOOK', 'points' => 10]], 'subcategories' => []]]]]];
        $result = (new LockedCriterionResolverService())->resolve($snapshot, $code, ['details' => ['publication_type' => 'Book']]);
        self::assertSame($maximum, $result['configured_points']);
        self::assertSame($maximum, $result['criterion_cap']);
        self::assertTrue($result['award_maximum_after_evidence_verification']);
        self::assertSame('VERIFIED_EVIDENCE_FULL_CRITERION_MAXIMUM', $result['scoring_rule']);
    }
    public static function facultyFullMaximumCriteria(): array { return [['B.2', 30.0], ['B.5', 20.0]]; }
    public function testRejectsUnknownCriterion():void { $this->expectException(RuntimeException::class); (new LockedCriterionResolverService())->resolve($this->snapshot,'B.9',[]); }
    public function testResolvesNtfB1AContractToLockedNumericSubcategory():void
    {
        $r=(new LockedCriterionResolverService())->resolve($this->ntfSnapshot(),'B.1.a',['contract_code'=>'NTF-B1A','subcategory_code'=>'NTF_B1A_MODERATOR_OFFICER']);
        self::assertSame('B.1.1',$r['criterion_reference']);
        self::assertSame(30.0,$r['configured_points']);
        self::assertSame('Moderator / Officer of Clubs',$r['level']['name']);
        self::assertFalse($r['evaluator_judgment_required']);
        self::assertSame(30.0,$r['criterion_cap']);
    }
    public function testNtfB2bUsesFixedItemPointsAndParentCategoryCap():void
    {
        $snapshot=['sheet'=>['applies_to'=>'NON_TEACHING_FACULTY'],'areas'=>[['area_code'=>'B','max_points'=>60,'categories'=>[['category_code'=>'B.2','name'=>'Community Service','max_points'=>30,'subcategories'=>[['subcategory_code'=>'B.2.2','name'=>'Civic Activities','default_points'=>25]],'options'=>[]]]]]];
        $result=(new LockedCriterionResolverService())->resolve($snapshot,'B.2.b',['contract_code'=>'NTF-B2B']);
        self::assertSame('B.2.2',$result['criterion_reference']);
        self::assertSame(25.0,$result['configured_points']);
        self::assertSame(30.0,$result['criterion_cap']);
        self::assertFalse($result['evaluator_judgment_required']);
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
    public function testNtfB5RemainsEvaluatorScored(): void
    {
        $snapshot = ['sheet' => ['applies_to' => 'NON_TEACHING_FACULTY'], 'areas' => [['area_code' => 'B', 'max_points' => 60, 'categories' => [['category_code' => 'B.5', 'name' => 'Recognition', 'max_points' => 30, 'options' => [], 'subcategories' => []]]]]];
        $result = (new LockedCriterionResolverService())->resolve($snapshot, 'B.5', ['contract_code' => 'NTF-B5']);
        self::assertTrue($result['evaluator_judgment_required']);
        self::assertArrayNotHasKey('award_maximum_after_evidence_verification', $result);
    }
    private function ntfSnapshot():array
    {
        return ['sheet'=>['applies_to'=>'NON_TEACHING_FACULTY'],'areas'=>[['area_code'=>'B','max_points'=>60,'categories'=>[['category_code'=>'B.1','name'=>'School Involvement','max_points'=>30,'requires_manual_hr_rule'=>0,'subcategories'=>[['subcategory_code'=>'B.1.1','name'=>'Moderator / Officer of Clubs','default_points'=>30]],'options'=>[]]]]]];
    }
}
