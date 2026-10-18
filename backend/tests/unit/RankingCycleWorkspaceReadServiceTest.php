<?php

namespace Tests\Unit;

use App\Services\RankingCycleWorkspaceReadService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

final class RankingCycleWorkspaceReadServiceTest extends TestCase
{
    #[DataProvider('submissionStates')]
    public function testSubmissionStateIsDerivedWithoutChangingEvaluationLifecycle(bool $hasEvaluation, int $activityCount, string $expected): void
    {
        self::assertSame($expected, $this->invoke('submissionStatus', [$hasEvaluation, $activityCount]));
    }

    public static function submissionStates(): array
    {
        return [
            'empty portfolio' => [false, 0, 'not_submitted'],
            'working portfolio' => [false, 2, 'draft'],
            'any evaluation version' => [true, 0, 'submitted'],
            'evaluation wins over working activity' => [true, 3, 'submitted'],
        ];
    }

    #[DataProvider('evaluationPresentationStates')]
    public function testEvaluationPresentationStatusKeepsTechnicalCompletionForResults(string $technical, string $key, string $label): void
    {
        self::assertSame(['key'=>$key, 'label'=>$label], $this->invoke('presentationStatus', [$technical]));
    }

    public static function evaluationPresentationStates(): array
    {
        return [
            ['submitted', 'ready_for_evaluation', 'Ready for Evaluation'],
            ['in_evaluation', 'in_progress', 'In Progress'],
            ['returned_for_revision', 'returned_for_revision', 'Returned for Revision'],
            ['ready_for_finalization', 'completed', 'Completed'],
        ];
    }

    public function testActionsAreDerivedFromAuthorityAsWellAsStatus(): void
    {
        self::assertSame(
            ['view_evaluation'],
            $this->invoke('allowedActions', ['evaluation', 'in_evaluation', false, true, false, 'FACULTY', true])
        );
        self::assertSame(
            ['view_evaluation', 'evaluate_items', 'return_for_revision', 'mark_ready'],
            $this->invoke('allowedActions', ['evaluation', 'in_evaluation', true, false, true, 'FACULTY', true])
        );
        self::assertSame(
            ['view_evaluation', 'finalize_evaluation'],
            $this->invoke('allowedActions', ['evaluation', 'ready_for_finalization', false, true, true, 'FACULTY', true])
        );
        self::assertSame(
            ['view_evaluation', 'finalize_evaluation'],
            $this->invoke('allowedActions', ['evaluation', 'ready_for_finalization', false, true, true, 'NON_TEACHING_FACULTY', true])
        );
    }

    public function testMonitoringStateNamesTheCurrentWorkflowOwnerWithoutGrantingAnAction(): void
    {
        self::assertSame(
            ['key'=>'with_dean_for_evaluation', 'label'=>'With Dean for Evaluation'],
            $this->invoke('workflowState', ['in_evaluation', 'FACULTY', 'dean', ['view_evaluation']])
        );
        self::assertSame(
            ['key'=>'with_personnel_for_revision', 'label'=>'With Personnel for Revision'],
            $this->invoke('workflowState', ['returned_for_revision', 'FACULTY', 'dean', ['view_evaluation']])
        );
        self::assertSame(
            ['key'=>'with_hr_for_finalization', 'label'=>'Ready for HR to complete portfolio review'],
            $this->invoke('workflowState', ['ready_for_finalization', 'FACULTY', 'dean', ['view_evaluation']])
        );
        self::assertNull(
            $this->invoke('workflowState', ['in_evaluation', 'FACULTY', 'dean', ['view_evaluation', 'evaluate_items']])
        );
    }

    public function testResultsDistinguishDeanEndorsedFacultyFromNonTeachingAwaitingFinalization(): void
    {
        self::assertSame('endorsed_to_hr', $this->invoke('resultStatus', ['ready_for_finalization', 'FACULTY']));
        self::assertSame('awaiting_finalization', $this->invoke('resultStatus', ['ready_for_finalization', 'NON_TEACHING_FACULTY']));
        self::assertSame('completed', $this->invoke('resultStatus', ['completed', 'FACULTY']));
    }

    private function invoke(string $method, array $arguments): mixed
    {
        return (new ReflectionMethod(RankingCycleWorkspaceReadService::class, $method))->invoke(null, ...$arguments);
    }
}
