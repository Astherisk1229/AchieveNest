<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;
use Throwable;

class AwardEvaluationService
{
    protected BaseConnection $db;
    protected ?AwardScoringService $scoringService;
    protected ?AwardEvaluationPersistenceService $persistenceService;

    public function __construct(
        ?BaseConnection $db = null,
        ?AwardScoringService $scoringService = null,
        ?AwardEvaluationPersistenceService $persistenceService = null
    ) {
        $this->db = $db ?? db_connect();
        $this->scoringService = $scoringService;
        $this->persistenceService = $persistenceService;
    }

    /**
     * Resolves the active award cycle.
     */
    public function resolveActiveCycle(?string $cycleId = null): ?array
    {
        if ($cycleId !== null && trim($cycleId) !== '') {
            return $this->db->table('award_cycles')
                ->where('id', trim($cycleId))
                ->get()->getRowArray();
        }

        return $this->db->table('award_cycles')
            ->whereIn('status', ['active', 'evaluating'])
            ->orderBy('start_date', 'DESC')
            ->get()->getRowArray();
    }

    /**
     * Evaluates a single student for a specific award definition and cycle.
     * Points come only from AwardScoringService (the single rubric engine) applied to verified
     * student_portfolio_records; persistence goes through AwardEvaluationPersistenceService.
     * Transactional and idempotent: one evaluation row per (cycle, award, student).
     */
    public function evaluateStudentAward(
        string $cycleId,
        string $awardId,
        string $studentProfileId,
        ?string $evaluatorProfileId = null
    ): array {
        $cycle = $this->db->table('award_cycles')->where('id', $cycleId)->get()->getRowArray();
        if ($cycle === null || ! in_array($cycle['status'], ['active', 'evaluating'], true)) {
            throw new RuntimeException('Active award cycle not found.');
        }

        $award = $this->db->table('award_definitions')->where('id', $awardId)->get()->getRowArray();
        if ($award === null || $award['status'] !== 'active') {
            throw new RuntimeException('Active award definition not found.');
        }

        $student = $this->db->table('profiles')
            ->where('id', $studentProfileId)
            ->where('account_type', 'student')
            ->where('status', 'active')
            ->get()->getRowArray();
        if ($student === null) {
            throw new RuntimeException('Active student profile not found.');
        }

        $scoring = $this->scoringService()->scoreStudentForAward($award, $student);
        $persisted = $this->persistenceService()->persistPortfolioEvaluation(
            $cycle,
            $award,
            $studentProfileId,
            $scoring,
            $evaluatorProfileId
        );

        return [
            'evaluation_id'             => $persisted['evaluation_id'],
            'cycle_id'                  => $cycleId,
            'award_definition_id'       => $awardId,
            'student_profile_id'        => $studentProfileId,
            'is_eligible'               => (bool) ($scoring['is_eligible'] ?? false),
            'scoring_status'            => $scoring['scoring_status'] ?? null,
            'scoring_version'           => $persisted['scoring_version'],
            'scoring_model_version_id'  => $persisted['scoring_model_version_id'],
            'raw_score'                 => $persisted['raw_score'],
            'raw_portfolio_score'       => $persisted['raw_score'],
            'max_computable_score'      => $persisted['max_computable_score'],
            'computable_max_score'      => $persisted['max_computable_score'],
            'potential_percent'         => $persisted['potential_percent'],
            'candidate_threshold'       => $persisted['candidate_threshold'],
            'qualifies_portfolio_based' => $persisted['qualifies_portfolio_based'],
            'outcome'                   => $persisted['qualifies_portfolio_based'] ? 'Potential Candidate / Eligible for Interview' : 'Not Qualified for Interview',
            'criteria'                  => $persisted['criteria'],
            'contributing_evidence'     => $scoring['contributing_evidence'] ?? [],
            'scoring_warnings'          => $scoring['scoring_warnings'] ?? [],
            'diagnostics'               => $scoring['diagnostics'] ?? [],
        ];
    }

    protected function scoringService(): AwardScoringService
    {
        return $this->scoringService ??= new AwardScoringService($this->db);
    }

    protected function persistenceService(): AwardEvaluationPersistenceService
    {
        return $this->persistenceService ??= new AwardEvaluationPersistenceService($this->db);
    }

    /**
     * Runs automated evaluation for all students with verified records for a given award.
     */
    public function evaluateAwardForAllStudents(
        string $cycleId,
        string $awardId,
        ?string $evaluatorProfileId = null
    ): array {
        $verifiedStudents = $this->db->table('student_portfolio_records spr')
            ->select('DISTINCT(spr.student_profile_id) AS student_id')
            ->join('profiles p', 'p.id = spr.student_profile_id')
            ->where('spr.status', 'verified')
            ->where('p.account_type', 'student')
            ->where('p.status', 'active')
            ->get()->getResultArray();

        $results = [];
        $candidatesCount = 0;

        foreach ($verifiedStudents as $s) {
            $studentId = $s['student_id'];
            $eval = $this->evaluateStudentAward($cycleId, $awardId, $studentId, $evaluatorProfileId);
            $results[] = $eval;
            if ($eval['qualifies_portfolio_based']) {
                $candidatesCount++;
            }
        }

        return [
            'cycle_id'            => $cycleId,
            'award_definition_id' => $awardId,
            'total_evaluated'     => count($results),
            'candidates_count'    => $candidatesCount,
            'evaluations'         => $results,
        ];
    }

}
