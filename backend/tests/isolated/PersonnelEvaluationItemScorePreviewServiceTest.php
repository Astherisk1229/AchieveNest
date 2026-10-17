<?php

namespace Tests\Isolated;

use App\Services\PersonnelEvaluationItemScorePreviewService;
use CodeIgniter\Test\CIUnitTestCase;

final class PersonnelEvaluationItemScorePreviewServiceTest extends CIUnitTestCase
{
    private function item(string $id, string $code, float $points, array $extra = []): array
    {
        return array_replace_recursive([
            'id' => $id, 'criterion_code' => $code, 'criterion_key' => $code,
            'configured_points_snapshot' => $points, 'max_allowed_points' => $points,
            'evaluator_judgment_required' => 0, 'verification_status' => 'pending',
            'rating_status' => 'unrated', 'awarded_points' => null,
            'criterion_snapshot' => [
                'criterion_reference' => $code, 'configured_points' => $points,
                'criterion_cap' => 10, 'category' => [
                    'category_code' => $code, 'area_code' => substr($code, 0, 1),
                    'max_points' => 10, 'area_max_points' => 100,
                ],
            ],
        ], $extra);
    }

    public function testFixedPreviewAndCategoryCapUseSavedTotalsAlgorithm(): void
    {
        $service = new PersonnelEvaluationItemScorePreviewService();
        $first = $this->item('first', 'A.3', 8, ['verification_status' => 'verified', 'rating_status' => 'rated', 'awarded_points' => 8]);
        $second = $this->item('second', 'A.3', 6);
        $preview = $service->preview([$first, $second], $second, 'FACULTY');
        self::assertSame('fixed', $preview['mode']);
        self::assertSame(6.0, $preview['proposed_points']);
        self::assertSame(2.0, $preview['additional_total_points']);
        self::assertSame(10.0, $preview['total_after_approval']);
        self::assertSame(8.0, $service->totals([$first, $second])['total_score']);
    }

    public function testAreaTotalsIncludeOnlyApprovedItemsAndLockedAutomaticServiceCredit(): void
    {
        $service = new PersonnelEvaluationItemScorePreviewService();
        $items = [
            $this->item('area-a', 'A.3', 8, ['verification_status' => 'verified', 'rating_status' => 'rated', 'awarded_points' => 8]),
            $this->item('area-b', 'B.4', 5, ['verification_status' => 'verified', 'rating_status' => 'rated', 'awarded_points' => 5]),
            $this->item('area-c', 'C.1.1', 4, ['verification_status' => 'verified', 'rating_status' => 'rated', 'awarded_points' => 4]),
            $this->item('pending', 'B.5', 9),
        ];
        $criteria = [
            'sheet' => ['applies_to' => 'FACULTY'],
            'areas' => [[
                'max_points' => 100,
                'categories' => [[
                    'category_code' => 'C.3', 'is_active' => 1, 'max_points' => 10,
                    'options' => [
                        ['option_group_code' => 'YEARS', 'label' => '3', 'points' => 1, 'is_active' => 1],
                        ['option_group_code' => 'YEARS', 'label' => '6', 'points' => 3, 'is_active' => 1],
                    ],
                ]],
            ]],
        ];

        $totals = $service->totals($items, 6, $criteria);

        self::assertSame(8.0, $totals['areaA_score']);
        self::assertSame(5.0, $totals['areaB_score']);
        self::assertSame(7.0, $totals['areaC_score']);
        self::assertSame(20.0, $totals['total_score']);
        self::assertSame(3.0, $totals['service_years_credit']['points']);
    }

    public function testAutomaticAndManualModesFollowLockedSnapshot(): void
    {
        $service = new PersonnelEvaluationItemScorePreviewService();
        $automatic = $this->item('auto', 'B.2', 12, [
            'criterion_snapshot' => ['criterion_cap' => 12, 'category' => ['max_points' => 12], 'award_maximum_after_evidence_verification' => true],
            'evidence_snapshot' => [['id' => 'proof']],
        ]);
        self::assertSame('automatic', $service->preview([$automatic], $automatic, 'FACULTY')['mode']);
        self::assertSame(12.0, $service->preview([$automatic], $automatic, 'FACULTY')['proposed_points']);
        $manual = $this->item('manual', 'B.3', 10, [
            'evaluator_judgment_required' => 1,
            'criterion_snapshot' => ['evaluator_judgment_required' => true],
        ]);
        $preview = $service->preview([$manual], $manual, 'FACULTY');
        self::assertSame('manual', $preview['mode']);
        self::assertNull($preview['proposed_points']);
        self::assertSame(10.0, $preview['maximum_points']);
        self::assertSame(10.0, $preview['maximum_additional_total_points']);
    }

    public function testGraduateUnitsPreviewUsesLockedLevelAndShowsMappingFailure(): void
    {
        $service = new PersonnelEvaluationItemScorePreviewService();
        $item = $this->item('units', 'A.1', 10, [
            'criterion_key' => 'A.1.2',
            'criterion_snapshot' => ['criterion_reference' => 'A.1.2', 'category' => ['category_code' => 'A.1'],
                'subcategory' => ['levels' => [['label' => '15', 'points' => 10, 'is_active' => 1]]]],
            'scoring_payload' => ['category_metadata' => ['subcategory_code' => 'A1_PHD_UNITS', 'details' => ['units_completed' => '15']]],
        ]);
        $preview = $service->preview([$item], $item, 'FACULTY');
        self::assertSame('graduate_units', $preview['mode']);
        self::assertSame(10.0, $preview['proposed_points']);
        self::assertSame(10.0, $preview['additional_total_points']);
        $mismatched = $item;
        $mismatched['criterion_key'] = 'A.1.4';
        self::assertSame('unavailable', $service->preview([$mismatched], $mismatched, 'FACULTY')['mode']);
        $mismatchedSubtype = $item;
        $mismatchedSubtype['scoring_payload']['category_metadata']['subcategory_code'] = 'A1_MA_UNITS';
        self::assertSame('unavailable', $service->preview([$mismatchedSubtype], $mismatchedSubtype, 'FACULTY')['mode']);
        $wrongCategory = $item;
        $wrongCategory['scoring_payload']['category_metadata']['portfolio_format'] = 'faculty_academic';
        $wrongCategory['scoring_payload']['category_metadata']['subcategory_code'] = 'B3_RESEARCH';
        self::assertSame('unavailable', $service->preview([$wrongCategory], $wrongCategory, 'FACULTY')['mode']);
        $undergraduate = $item;
        $undergraduate['scoring_payload']['category_metadata']['details']['program'] = 'Bachelor of Arts in Communication';
        self::assertSame('unavailable', $service->preview([$undergraduate], $undergraduate, 'FACULTY')['mode']);
        self::assertStringContainsString('Request a correction', $service->mappingIssue($undergraduate));
    }

    public function testSubmittedGraduateUnitsKeepTheirApprovedLevelScoreWhileDeanReviewIsPending(): void
    {
        $service = new PersonnelEvaluationItemScorePreviewService();
        $item = $this->item('submitted-units', 'A.1', 10, [
            'criterion_key' => 'A.1.2', 'awarded_points' => 0,
            'criterion_snapshot' => [
                'criterion_reference' => 'A.1.2',
                'category' => ['category_code' => 'A.1', 'area_code' => 'A'],
                'subcategory' => ['levels' => [['label' => '15', 'points' => 10, 'is_active' => 1]]],
                'provisional_scoring' => ['status' => 'verified', 'verified_points' => 0],
            ],
            'scoring_payload' => ['category_metadata' => [
                'subcategory_code' => 'A1_PHD_UNITS', 'details' => ['units_completed' => '15'],
            ]],
        ]);

        $totals = $service->totals([$item]);
        $preview = $service->preview([$item], $item, 'FACULTY');

        self::assertSame(10.0, $totals['areaA_score']);
        self::assertSame(10.0, $totals['graduate_units'][0]['points']);
        self::assertSame(['submitted-units'], $totals['graduate_units'][0]['item_ids']);
        self::assertSame(10.0, $preview['proposed_points']);
        self::assertSame(10.0, $preview['graduate_level_points']);
        self::assertSame(0.0, $preview['additional_total_points']);
    }

    public function testIncompleteSubmittedB1InputsCannotReceiveFixedPoints(): void
    {
        $service = new PersonnelEvaluationItemScorePreviewService();
        $item = $this->item('engagement', 'B.1', 8, [
            'scoring_payload' => ['category_metadata' => ['subcategory_code' => 'B1_ACTIVITY', 'details' => [
                'role' => 'Judge', 'extent' => '2 Days', 'scope' => 'National', 'organizer' => 'College of Arts',
            ]]],
        ]);
        self::assertSame('fixed', $service->preview([$item], $item, 'FACULTY')['mode']);
        $item['scoring_payload']['category_metadata']['details']['extent'] = '';
        self::assertSame('unavailable', $service->preview([$item], $item, 'FACULTY')['mode']);
    }

    private function nonTeachingB2b(string $id, bool $approved = false): array
    {
        return $this->item($id, 'B.2.b', 25, [
            'criterion_key' => 'B.2.2',
            'evaluator_judgment_required' => 1, // Older frozen versions incorrectly recorded this flag.
            'verification_status' => $approved ? 'verified' : 'pending',
            'rating_status' => $approved ? 'rated' : 'unrated',
            'awarded_points' => $approved ? 25 : null,
            'criterion_snapshot' => [
                'criterion_reference' => 'B.2.2', 'configured_points' => 25,
                'criterion_cap' => 25, 'evaluator_judgment_required' => true,
                'category' => ['category_code' => 'B.2', 'area_code' => 'B', 'max_points' => 30, 'area_max_points' => 60],
                'subcategory' => ['subcategory_code' => 'B.2.2', 'default_points' => 25],
            ],
            'scoring_payload' => ['category_metadata' => ['portfolio_format' => 'non_teaching_faculty']],
        ]);
    }

    public function testNonTeachingFixedItemsKeepFullPointsAndCapCategoryAfterSumming(): void
    {
        $service = new PersonnelEvaluationItemScorePreviewService();
        $first = $this->nonTeachingB2b('first', true);
        $second = $this->nonTeachingB2b('second');
        $criteria = ['sheet' => ['applies_to' => 'NON_TEACHING_FACULTY'], 'areas' => [[
            'max_points' => 60, 'categories' => [['category_code' => 'B.3', 'max_points' => 10, 'is_active' => 1]],
        ]]];
        self::assertNull($service->mappingIssue($second));
        $preview = $service->preview([$first, $second], $second, 'NON_TEACHING_FACULTY', 2, $criteria);
        self::assertSame('fixed', $preview['mode']);
        self::assertSame(25.0, $preview['proposed_points']);
        self::assertSame(5.0, $preview['additional_total_points']);
        $second['verification_status'] = 'verified';
        $second['rating_status'] = 'rated';
        $second['awarded_points'] = 25;
        $totals = $service->totals([$first, $second], 2, $criteria);
        self::assertSame(50.0, $totals['category_scores']['B.2']);
        self::assertSame(30.0, $totals['category_counted_scores']['B.2']);
        self::assertSame(1.0, $totals['category_scores']['B.3']);
        self::assertSame(31.0, $totals['areaB_score']);
        $school = $this->nonTeachingB2b('school', true);
        $school['criterion_code'] = 'B.1.a';
        $school['criterion_key'] = 'B.1.1';
        $school['configured_points_snapshot'] = $school['awarded_points'] = 30;
        $school['criterion_snapshot']['criterion_reference'] = 'B.1.1';
        $school['criterion_snapshot']['configured_points'] = 30;
        $school['criterion_snapshot']['category']['category_code'] = 'B.1';
        $school['criterion_snapshot']['subcategory'] = ['subcategory_code' => 'B.1.1', 'default_points' => 30];
        $areaCapped = $service->totals([$first, $second, $school], 2, $criteria);
        self::assertSame(30.0, $areaCapped['category_counted_scores']['B.1']);
        self::assertSame(60.0, $areaCapped['areaB_score']);
        $tampered = $second;
        $tampered['criterion_snapshot']['subcategory']['subcategory_code'] = 'B.2.1';
        self::assertNotNull($service->mappingIssue($tampered));
    }
}
