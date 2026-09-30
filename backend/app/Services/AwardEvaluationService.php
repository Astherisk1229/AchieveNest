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

    private function genUuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            random_int(0, 0xffff), random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0x0fff) | 0x4000,
            random_int(0, 0x3fff) | 0x8000,
            random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff)
        );
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

    /**
     * Records a Dean Nomination.
     * Does NOT fabricate any portfolio score or evaluation row.
     */
    public function createDeanNomination(
        string $deanProfileId,
        string $deanAssignmentId,
        string $studentProfileId,
        string $awardDefinitionId,
        ?string $cycleId,
        string $justification
    ): array {
        $deanAssignment = $this->db->table('dean_assignments')
            ->where('id', $deanAssignmentId)
            ->where('personnel_profile_id', $deanProfileId)
            ->where('is_active', 1)
            ->get()->getRowArray();
        if ($deanAssignment === null) {
            throw new RuntimeException('Active Dean assignment required.');
        }

        $student = $this->db->table('profiles')
            ->where('id', $studentProfileId)
            ->where('account_type', 'student')
            ->where('status', 'active')
            ->get()->getRowArray();
        if ($student === null) {
            throw new RuntimeException('Target student profile not found or inactive.');
        }

        // Validate that student is actively enrolled in the Dean's assigned College
        $deanCollegeId = (string) $deanAssignment['college_id'];
        $studentEnrollment = $this->db->table('student_program_enrollments spe')
            ->select('ap.college_id')
            ->join('academic_programs ap', 'ap.id = spe.academic_program_id')
            ->where('spe.student_profile_id', $studentProfileId)
            ->where('spe.is_active', 1)
            ->get()->getRowArray();

        if ($studentEnrollment === null || (string) ($studentEnrollment['college_id'] ?? '') !== $deanCollegeId) {
            throw new RuntimeException('Dean may only nominate students actively enrolled in their assigned College.');
        }

        $award = $this->db->table('award_definitions')
            ->where('id', $awardDefinitionId)
            ->where('status', 'active')
            ->get()->getRowArray();
        if ($award === null) {
            throw new RuntimeException('Target award definition not found or inactive.');
        }

        $cycle = $this->resolveActiveCycle($cycleId);
        if ($cycle === null || ! in_array($cycle['status'], ['active', 'evaluating'], true)) {
            throw new RuntimeException('Active award cycle not found.');
        }

        if (trim($justification) === '') {
            throw new RuntimeException('Nomination justification is required.');
        }

        $now = date('Y-m-d H:i:s');
        $nominationId = $this->genUuid();
        $eligibilityId = $this->genUuid();

        $this->db->transStart();

        $this->db->table('dean_student_nominations')->insert([
            'id'                  => $nominationId,
            'cycle_id'            => $cycle['id'],
            'award_definition_id' => $awardDefinitionId,
            'student_profile_id'  => $studentProfileId,
            'dean_assignment_id'  => $deanAssignmentId,
            'dean_profile_id'     => $deanProfileId,
            'college_id'          => $deanAssignment['college_id'],
            'justification'       => trim($justification),
            'status'              => 'active',
            'nominated_at'        => $now,
        ]);

        // Insert into interview eligibilities with source = dean_nomination (no fake score)
        $existingElig = $this->db->table('award_interview_eligibilities')
            ->where('cycle_id', $cycle['id'])
            ->where('award_definition_id', $awardDefinitionId)
            ->where('student_profile_id', $studentProfileId)
            ->where('eligibility_source', 'dean_nomination')
            ->get()->getRowArray();

        if ($existingElig === null) {
            $this->db->table('award_interview_eligibilities')->insert([
                'id'                  => $eligibilityId,
                'cycle_id'            => $cycle['id'],
                'award_definition_id' => $awardDefinitionId,
                'student_profile_id'  => $studentProfileId,
                'eligibility_source'  => 'dean_nomination',
                'pathway'             => 'dean_nomination',
                'evaluation_id'       => null,
                'dean_nomination_id'  => $nominationId,
                'potential_score'     => null,
                'eligible_at'         => $now,
                'status'              => 'eligible',
            ]);
        }

        $this->db->transComplete();

        if ($this->db->transStatus() === false) {
            throw new RuntimeException('Failed to record Dean nomination.');
        }

        return [
            'nomination_id'       => $nominationId,
            'cycle_id'            => $cycle['id'],
            'award_definition_id' => $awardDefinitionId,
            'student_profile_id'  => $studentProfileId,
            'eligibility_source'  => 'dean_nomination',
        ];
    }
}
