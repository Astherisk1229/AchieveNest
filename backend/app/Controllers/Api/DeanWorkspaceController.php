<?php

namespace App\Controllers\Api;

use App\Services\AuthenticatedActorService;
use App\Services\OrganizationalAuthorityResolver;
use App\Services\PersonnelEvaluationPeriodService;
use App\Services\RankingCycleService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;

/** Server-derived college oversight read model. Visibility and review authority stay separate. */
class DeanWorkspaceController extends Controller
{
    use ResponseTrait;

    public function __construct(private ?AuthenticatedActorService $actors = null)
    {
        $this->actors ??= new AuthenticatedActorService();
    }

    public function options(): mixed { return $this->respond(null, 204); }

    /** POST dean/reviews/{evaluationId}/criteria-reconfirmation */
    public function criteriaReconfirmation(string $evaluationId = ''): mixed
    {
        $scope = $this->scope();
        if ($scope === false) return $this->respond(['error'=>['code'=>'DEAN_ASSIGNMENT_REQUIRED','message'=>'An active Dean assignment is required.']], 403);
        $body = $this->request->getJSON(true) ?? [];
        try {
            $result = (new \App\Services\PersonnelEvaluationCriteriaRecalculationService())->decideReconfirmation(
                $evaluationId,
                (string) $scope['actor']['profile']['id'],
                (string) ($body['decision'] ?? ''),
                isset($body['reason']) ? (string) $body['reason'] : null
            );
            return $this->respond(['data'=>$result]);
        } catch (\RuntimeException $error) {
            $status = $error->getCode() >= 400 && $error->getCode() <= 599 ? $error->getCode() : 409;
            return $this->respond(['error'=>['code'=>'CRITERIA_RECONFIRMATION_FAILED','message'=>$error->getMessage()]], $status);
        }
    }

    private function scope(): array|false
    {
        $actor = $this->actors->resolveActor($this->request->getHeaderLine('Authorization'));
        $assignment = null;
        foreach (($actor['assignments'] ?? []) as $item) {
            if (($item['role_key'] ?? '') === 'dean' && ($item['scope_type'] ?? '') === 'college' && !empty($item['scope_id'])) { $assignment = $item; break; }
        }
        if ($actor === null) return false;
        if (!in_array('dean', $actor['roles'] ?? [], true)) return false;
        if ($assignment === null) {
            $row = db_connect()->table('dean_assignments da')->select('da.college_id AS scope_id,c.name AS scope_name')
                ->join('colleges c', 'c.id=da.college_id', 'left')->where('da.personnel_profile_id', $actor['profile']['id'])
                ->where('da.is_active', 1)->get()->getRowArray();
            if ($row) $assignment = ['scope_id' => $row['scope_id'], 'scope_name' => $row['scope_name']];
        }
        if ($assignment === null) return false;
        return ['actor' => $actor, 'college_id' => $assignment['scope_id'], 'college_name' => $assignment['scope_name'] ?? 'Assigned College'];
    }

    /** @return array{0: ?array, 1: ?array} */
    private function facultyRankingContext($db): array
    {
        $period = (new PersonnelEvaluationPeriodService($db))->currentWorkflowTrack('FACULTY');
        $cycle = !empty($period['ranking_cycle_id']) ? (new RankingCycleService($db))->find((string) $period['ranking_cycle_id']) : null;
        return [$period, $cycle];
    }

    /** Read-only list of locked HR Faculty ranking tracks available to this Dean. */
    public function evaluationPeriods(): mixed
    {
        if ($this->scope() === false) return $this->respond(['error'=>['code'=>'DEAN_ASSIGNMENT_REQUIRED','message'=>'Your Dean role does not currently have an active college assignment.']], 403);

        $rows = db_connect()->table('personnel_evaluation_periods pep')
            ->select('pep.id,pep.ranking_cycle_id,pep.period_name,pep.academic_year,pep.status,pep.submission_open_at,pep.submission_close_at,pep.evaluation_start_at,pep.evaluation_end_at')
            ->where('pep.evaluation_type', 'RANKING_PROMOTION')->where('pep.personnel_group', 'FACULTY')
            ->whereIn('pep.status', ['CLOSED', 'ARCHIVED', 'CANCELLED'])
            ->orderBy('pep.academic_year', 'DESC')->orderBy('pep.created_at', 'DESC')->get()->getResultArray();

        $periods = array_map(static fn(array $row): array => [
            'id' => $row['id'], 'ranking_cycle_id' => $row['ranking_cycle_id'], 'name' => $row['period_name'],
            'display_name' => RankingCycleService::generatedName((string) $row['academic_year'], ['FACULTY']),
            'academic_year' => $row['academic_year'], 'status' => $row['status'],
            'status_label' => ucwords(strtolower(str_replace('_', ' ', (string) $row['status']))),
            'submission_open_at' => $row['submission_open_at'], 'submission_close_at' => $row['submission_close_at'],
            'evaluation_start_at' => $row['evaluation_start_at'], 'evaluation_end_at' => $row['evaluation_end_at'],
            'read_only' => true,
        ], $rows);

        return $this->respond(['data' => ['periods' => $periods]]);
    }

    private static function cycleSummary(?array $cycle): ?array
    {
        if (!$cycle) return null;
        return [
            'id'=>$cycle['id'], 'display_name'=>$cycle['display_name'], 'academic_year'=>$cycle['academic_year'],
            'lifecycle_status'=>$cycle['lifecycle_status'], 'operational_enabled'=>$cycle['operational_enabled'] ?? true, 'current_stage'=>$cycle['current_stage'], 'coverage'=>$cycle['coverage'],
        ];
    }

    public function roster(): mixed
    {
        $scope = $this->scope();
        if ($scope === false) return $this->respond(['error'=>['code'=>'DEAN_ASSIGNMENT_REQUIRED','message'=>'Your Dean role does not currently have an active college assignment.']], 403);
        $db=db_connect(); [$period, $cycle]=$this->facultyRankingContext($db);
        $rows=$db->table('personnel_profiles pp')->select('p.id,p.full_name,p.institutional_id,p.email AS institutional_email,p.status,pp.personnel_group,pp.organizational_side,pp.personnel_classification,pp.position_title,pp.current_rank_title,pp.faculty_engagement,pp.employment_status,ap.id AS program_id,ap.name AS program_name,au.name AS department_name')
            ->join('profiles p','p.id=pp.profile_id')->join('personnel_college_affiliations pca','pca.personnel_profile_id=pp.profile_id AND pca.is_active=1')
            ->join('personnel_program_affiliations ppa','ppa.personnel_profile_id=pp.profile_id AND ppa.is_active=1','left')->join('academic_programs ap','ap.id=ppa.academic_program_id','left')
            ->join('personnel_administrative_unit_affiliations pau','pau.personnel_profile_id=pp.profile_id AND pau.is_active=1','left')->join('administrative_units au','au.id=pau.administrative_unit_id','left')
            ->where('pca.college_id',$scope['college_id'])->orderBy('p.full_name')->get()->getResultArray();
        $seen=[]; $result=[]; $eligibilityService=new \App\Services\PersonnelEligibilityService($db);
        foreach($rows as $row){ if(isset($seen[$row['id']])) continue; $seen[$row['id']]=true;
            $isSelf=$row['id']===($scope['actor']['profile']['id']??null);
            $eligible=($row['personnel_group']==='faculty' && !$isSelf);
            $evaluation=$period ? $db->table('personnel_evaluations')->select('id,status,version_number,submitted_at')->where('personnel_profile_id',$row['id'])->where('evaluation_period_id',$period['id'])->orderBy('version_number','DESC')->get()->getRowArray() : null;
            $roles=$db->table('profile_roles pr')->select('r.role_key,r.display_name')->join('roles r','r.id=pr.role_id')->where('pr.profile_id',$row['id'])->where('pr.is_active',1)->orderBy('r.display_name')->get()->getResultArray();
            $classificationLabel=($row['personnel_group']??'') === 'faculty' ? 'Faculty' : 'Non-Teaching Faculty';
            $statusKey=null; $statusLabel=null;
            if ($period) {
                if (!$eligible) { $statusKey='hr_managed'; $statusLabel='HR-managed'; }
                elseif (!$evaluation) { $statusKey='not_yet_submitted'; $statusLabel='Not Yet Submitted'; }
                else {
                    $statusKey=($evaluation['status']==='submitted' && (int)($evaluation['version_number']??1)>1) ? 'resubmitted' : $evaluation['status'];
                    $statusLabel=match ($statusKey) {
                        'submitted' => 'Awaiting Dean Review', 'returned_for_revision' => 'Returned for Revision',
                        'resubmitted' => 'Resubmitted', 'ready_for_finalization' => 'Endorsed to HR',
                        'in_evaluation' => 'Under HR Review', 'completed' => 'Completed',
                        default => ucwords(str_replace('_',' ',$statusKey)),
                    };
                }
            }
            $eligibilityResult=$period ? $eligibilityService->evaluateEligibility($row['id'],$period['id']) : ['eligibility_status'=>'pending','eligibility_label'=>'Pending','eligibility_reasons'=>['No active evaluation period.']];
            $result[]=$row+[
                'college_id'=>$scope['college_id'],'college_name'=>$scope['college_name'],
                'classification_label'=>$classificationLabel,'functional_roles'=>$roles,
                'is_dean_evaluable'=>$eligible,'evaluation_route'=>$eligible?'DEAN_THEN_HR':'HR_DIRECT','review_responsibility'=>$eligible?'dean':'hr',
                'eligibility_status'=>$eligibilityResult['eligibility_status'],'eligibility'=>$eligibilityResult,
                'evaluation_status'=>$statusKey,'evaluation_status_label'=>$statusLabel,
                'is_review_actionable'=>$eligible && $eligibilityResult['eligibility_status']==='eligible' && $evaluation && in_array($evaluation['status'],['submitted','in_evaluation'],true),
                'evaluation'=>$evaluation,'is_self'=>$isSelf,
            ];
        }
        $deanRouteCount=count(array_filter($result,static fn($person)=>$person['evaluation_route']==='DEAN_THEN_HR'));
        return $this->respond(['data'=>['college'=>['id'=>$scope['college_id'],'name'=>$scope['college_name']],'ranking_cycle'=>self::cycleSummary($cycle),'evaluation_period'=>$period,'summary'=>['total'=>count($result),'dean_then_hr'=>$deanRouteCount,'hr_direct'=>count($result)-$deanRouteCount],'personnel'=>$result,'total'=>count($result)]]);
    }

    public function reviews(): mixed
    {
        $scope = $this->scope();
        if ($scope === false) {
            return $this->respond(['error' => ['code' => 'DEAN_ASSIGNMENT_REQUIRED', 'message' => 'Your Dean role does not currently have an active college assignment.']], 403);
        }

        $db = db_connect();
        $periodService = new PersonnelEvaluationPeriodService($db);
        [$currentPeriod, $currentCycle] = $this->facultyRankingContext($db);
        $requestedPeriodId = trim((string) $this->request->getGet('evaluation_period_id'));
        $period = $currentPeriod;
        $cycle = $currentCycle;
        if ($requestedPeriodId !== '' && (string) ($currentPeriod['id'] ?? '') !== $requestedPeriodId) {
            $historicalPeriod = $periodService->find($requestedPeriodId);
            if (! $historicalPeriod || ($historicalPeriod['evaluation_type'] ?? '') !== 'RANKING_PROMOTION' || ($historicalPeriod['personnel_group'] ?? '') !== 'FACULTY' || ! in_array($historicalPeriod['status'] ?? '', ['CLOSED', 'ARCHIVED', 'CANCELLED'], true)) {
                return $this->respond(['error' => ['code' => 'DEAN_PERIOD_UNAVAILABLE', 'message' => 'This Faculty ranking period is unavailable for Dean history.']], 404);
            }
            $period = $historicalPeriod;
            $cycleRow = $db->table('ranking_cycles')->where('id', $period['ranking_cycle_id'])->get()->getRowArray();
            $cycle = $cycleRow ? [
                'id' => $cycleRow['id'],
                'display_name' => RankingCycleService::generatedName((string) $period['academic_year'], ['FACULTY']),
                'academic_year' => $period['academic_year'],
                'lifecycle_status' => ['label' => $period['status_label']],
                'operational_enabled' => (bool) ($period['operational_enabled'] ?? true),
                'current_stage' => null,
                'coverage' => ['personnel_groups' => ['FACULTY']],
            ] : null;
        }
        $readOnly = ($period['operational_enabled'] ?? true) === false || in_array($period['status'] ?? '', ['CLOSED', 'ARCHIVED', 'CANCELLED'], true);

        $emptyCounts = ['needs_review' => 0, 'resubmitted' => 0, 'returned' => 0, 'endorsed' => 0, 'completed' => 0];
        $workspace = ['role' => 'dean', 'college_id' => $scope['college_id'], 'college_name' => $scope['college_name']];
        if ($period === null) {
            return $this->respond(['data' => ['workspace' => $workspace, 'ranking_cycle' => null, 'evaluation_period' => null, 'counts' => $emptyCounts, 'programs' => [], 'departments' => [], 'reviews' => []]]);
        }

        $rows = $db->table('personnel_evaluations pe')
            ->select('pe.id,pe.evaluation_root_id,pe.personnel_profile_id,pe.evaluator_profile_id,pe.originating_evaluator_profile_id,pe.status,pe.version_number,pe.submitted_at,pe.return_reason,p.full_name,p.institutional_id,pp.current_rank_title,pp.position_title,ap.id AS program_id,ap.name AS program_name,au.id AS department_id,au.name AS department_name')
            ->join('profiles p', 'p.id=pe.personnel_profile_id')
            ->join('personnel_profiles pp', 'pp.profile_id=pe.personnel_profile_id')
            ->join('personnel_college_affiliations pca', 'pca.personnel_profile_id=pe.personnel_profile_id AND pca.is_active=1')
            ->join('personnel_program_affiliations ppa', 'ppa.personnel_profile_id=pe.personnel_profile_id AND ppa.is_active=1', 'left')
            ->join('academic_programs ap', 'ap.id=ppa.academic_program_id', 'left')
            ->join('personnel_administrative_unit_affiliations pau', 'pau.personnel_profile_id=pe.personnel_profile_id AND pau.is_active=1', 'left')
            ->join('administrative_units au', 'au.id=pau.administrative_unit_id', 'left')
            ->where('pe.evaluation_period_id', $period['id'])
            ->where('pca.college_id', $scope['college_id'])
            ->where('pp.personnel_group', 'faculty')
            ->where('pe.personnel_profile_id !=', $scope['actor']['profile']['id'])
            ->orderBy('pe.version_number', 'DESC')->orderBy('pe.submitted_at', 'ASC')->get()->getResultArray();

        $eligibilityService = new \App\Services\PersonnelEligibilityService($db);
        $authorityResolver = new OrganizationalAuthorityResolver($db);
        $unique = [];
        foreach ($rows as $row) {
            $personnelId = (string) $row['personnel_profile_id'];
            if (isset($unique[$personnelId])) continue;
            try { $authority = $authorityResolver->resolveResponsibleAuthority($personnelId, $period); }
            catch (\RuntimeException) { continue; }
            if (($authority['authority_type'] ?? '') !== 'DEAN' || !$authorityResolver->actorMayAct($authority, (string) $scope['actor']['profile']['id'])) continue;
            // A submitted portfolio follows the current authoritative Dean
            // assignment; starting it refreshes evaluator_profile_id. Once a
            // review is in progress, keep it with the evaluator who started it.
            if ($row['status'] === 'in_evaluation'
                && (string) ($row['evaluator_profile_id'] ?? '') !== (string) $scope['actor']['profile']['id']) continue;

            $eligibility = $eligibilityService->evaluateEligibility($personnelId, $period['id']);
            $annualStatus = (string) ($eligibility['annual_review_requirement']['status'] ?? 'pending');
            $rankingEligibility = (string) ($eligibility['eligibility_status'] ?? 'pending');
            if (! $readOnly && in_array((string) $row['status'], ['submitted', 'in_evaluation'], true)
                && ($annualStatus !== 'passed' || $rankingEligibility !== 'eligible')) continue;

            $version = (int) ($row['version_number'] ?? 1);
            $deanReviewStatus = match ((string) $row['status']) {
                'submitted', 'in_evaluation' => 'needs_review',
                'returned_for_revision' => 'returned',
                'ready_for_finalization', 'completed' => 'reviewed',
                default => 'not_actionable',
            };
            $unique[$personnelId] = $row + [
                'eligibility'=>$eligibility,
                'annual_review_status'=>$annualStatus,
                'ranking_eligibility_status'=>$rankingEligibility,
                'dean_review_status'=>$deanReviewStatus,
                'is_resubmitted'=>$version > 1 && $deanReviewStatus === 'needs_review',
            ];
        }
        $all = array_values($unique);
        $counts = $emptyCounts;
        foreach ($all as $row) {
            $status = $row['status'];
            if ($row['dean_review_status'] === 'needs_review') {
                $counts['needs_review']++;
                if ($row['is_resubmitted']) $counts['resubmitted']++;
            } elseif ($status === 'returned_for_revision') $counts['returned']++;
            elseif ($status === 'ready_for_finalization') $counts['endorsed']++;
            elseif ($status === 'completed') $counts['completed']++;
        }

        $tab = (string) ($this->request->getGet('status') ?: 'needs_review');
        $search = mb_strtolower(trim((string) $this->request->getGet('search')));
        $program = trim((string) $this->request->getGet('program'));
        $department = trim((string) $this->request->getGet('department'));
        $filtered = array_values(array_filter($all, static function (array $row) use ($tab, $search, $program, $department): bool {
            $status = $row['status'];
            $tabMatch = match ($tab) {
                'all' => true,
                'resubmitted' => $row['is_resubmitted'],
                'returned' => $status === 'returned_for_revision',
                'endorsed' => $status === 'ready_for_finalization',
                'completed' => $status === 'completed',
                default => $row['dean_review_status'] === 'needs_review',
            };
            if (!$tabMatch) return false;
            if ($program !== '' && (string) ($row['program_id'] ?? '') !== $program) return false;
            if ($department !== '' && (string) ($row['department_id'] ?? '') !== $department) return false;
            if ($search !== '') {
                $haystack = mb_strtolower(implode(' ', [$row['full_name'] ?? '', $row['institutional_id'] ?? '', $row['program_name'] ?? '', $row['department_name'] ?? '']));
                if (!str_contains($haystack, $search)) return false;
            }
            return true;
        }));

        $programs = [];
        $departments = [];
        foreach ($all as $row) {
            if (!empty($row['program_id']) && !isset($programs[$row['program_id']])) $programs[$row['program_id']] = ['id' => $row['program_id'], 'name' => $row['program_name']];
            if (!empty($row['department_id']) && !isset($departments[$row['department_id']])) $departments[$row['department_id']] = ['id' => $row['department_id'], 'name' => $row['department_name']];
        }

        return $this->respond(['data' => [
            'workspace' => $workspace,
            'ranking_cycle' => self::cycleSummary($cycle),
            'evaluation_period' => ['id' => $period['id'], 'name' => $period['period_name'], 'academic_year' => $period['academic_year'] ?? null, 'status' => $period['status'], 'status_label' => $period['status_label'], 'operational_enabled' => (bool) ($period['operational_enabled'] ?? true), 'submission_open_at' => $period['submission_open_at'] ?? null, 'submission_close_at' => $period['submission_close_at'] ?? null, 'evaluation_start_at' => $period['evaluation_start_at'] ?? null, 'evaluation_end_at' => $period['evaluation_end_at'] ?? null],
            'read_only' => $readOnly,
            'counts' => $counts,
            'programs' => array_values($programs),
            'departments' => array_values($departments),
            'reviews' => $filtered,
        ]]);
    }

    /** Exact submitted portfolio detail with college, self-review, and eligibility guards. */
    public function reviewDetail(string $id=''): mixed
    {
        $scope=$this->scope();
        if($scope===false) return $this->respond(['error'=>['code'=>'DEAN_ASSIGNMENT_REQUIRED','message'=>'Your Dean role does not currently have an active college assignment.']],403);
        $db=db_connect();
        $review=$db->table('personnel_evaluations pe')->select('pe.*,p.full_name,p.institutional_id,pp.current_rank_title,pp.position_title,pp.faculty_engagement,pp.employment_status,pep.academic_year AS period_academic_year,c.name AS college_name')
            ->join('profiles p','p.id=pe.personnel_profile_id')->join('personnel_profiles pp','pp.profile_id=pe.personnel_profile_id')->join('personnel_evaluation_periods pep','pep.id=pe.evaluation_period_id','left')
            ->join('personnel_college_affiliations pca','pca.personnel_profile_id=pe.personnel_profile_id AND pca.is_active=1')->join('colleges c','c.id=pca.college_id','left')
            ->where('pe.id',$id)->where('pca.college_id',$scope['college_id'])->get()->getRowArray();
        if(!$review) return $this->respond(['error'=>['code'=>'WORKSPACE_SCOPE_FORBIDDEN','message'=>'This portfolio review is unavailable or outside your assigned college.']],403);
        $periodService = new PersonnelEvaluationPeriodService($db);
        $period = $periodService->find((string) $review['evaluation_period_id']);
        if (! $period || ($period['evaluation_type'] ?? '') !== 'RANKING_PROMOTION' || ($period['personnel_group'] ?? '') !== 'FACULTY') return $this->respond(['error'=>['code'=>'REVIEW_OUTSIDE_FACULTY_RANKING','message'=>'This portfolio is not part of a Faculty ranking period.']],409);
        [$currentPeriod] = $this->facultyRankingContext($db);
        $readOnly = ($period['operational_enabled'] ?? true) === false || in_array($period['status'] ?? '', ['CLOSED', 'ARCHIVED', 'CANCELLED'], true);
        if ((string) ($currentPeriod['id'] ?? '') !== (string) $period['id'] && ! $readOnly) return $this->respond(['error'=>['code'=>'REVIEW_OUTSIDE_CURRENT_HR_CYCLE','message'=>'This portfolio does not belong to the current HR Faculty ranking period.']],409);
        if($review['personnel_profile_id']===($scope['actor']['profile']['id']??null)) return $this->respond(['error'=>['code'=>'DEAN_SELF_REVIEW_FORBIDDEN','message'=>'Dean self-review is unavailable and routes to HR.']],403);
        $authorityResolver=new OrganizationalAuthorityResolver($db);
        try { $authority=$authorityResolver->resolveResponsibleAuthority((string)$review['personnel_profile_id'],$period); }
        catch (\RuntimeException) { $authority=null; }
        if(!$authority || ($authority['authority_type']??'')!=='DEAN' || !$authorityResolver->actorMayAct($authority,(string)$scope['actor']['profile']['id'])) return $this->respond(['error'=>['code'=>'WORKSPACE_SCOPE_FORBIDDEN','message'=>'You are not the assigned reviewer for this Faculty portfolio.']],403);
        $eligibility=(new \App\Services\PersonnelEligibilityService($db))->evaluateEligibility($review['personnel_profile_id'],$review['evaluation_period_id']);
        // Eligibility gates whether an active submission can be reviewed. Once
        // the Dean has endorsed or HR has completed it, the saved result stays
        // available even if a later eligibility check changes.
        $requiresCurrentEligibility = in_array((string) $review['status'], ['submitted', 'in_evaluation'], true);
        if(! $readOnly && $requiresCurrentEligibility && (($eligibility['annual_review_requirement']['status']??'pending')!=='passed' || ($eligibility['eligibility_status']??'')!=='eligible')) return $this->respond(['error'=>['code'=>'PORTFOLIO_NOT_ELIGIBLE','message'=>'The current Annual Review and ranking eligibility requirements are not satisfied.','reasons'=>$eligibility['eligibility_reasons']??[]]],422);
        $items=$db->table('personnel_evaluation_items pei')->select('pei.*')->where('pei.evaluation_id',$id)->orderBy('pei.submission_order','ASC')->orderBy('pei.created_at','ASC')->get()->getResultArray();
        foreach ($items as &$item) {
            foreach (['criterion_snapshot','evidence_snapshot','scoring_payload'] as $field) {
                if (isset($item[$field]) && is_string($item[$field])) $item[$field] = json_decode($item[$field], true);
            }

            // The submitted accomplishment classification is frozen inside the
            // scoring payload. Expose it explicitly so booklet renderers do not
            // lose leaf criteria such as A.1.2 Ph.D. Units while adapting the
            // evaluation item response for display.
            $categoryMetadata = $item['scoring_payload']['category_metadata'] ?? null;
            if (is_string($categoryMetadata)) $categoryMetadata = json_decode($categoryMetadata, true);
            if (is_array($categoryMetadata) && $categoryMetadata !== []) {
                $item['category_metadata'] = $categoryMetadata;
                $item['subcategory_code'] = $categoryMetadata['subcategory_code'] ?? ($item['subcategory_code'] ?? null);
            }
        }
        unset($item);
        $latestVersion=$db->table('personnel_evaluations')
            ->select('id, version_number, status')
            ->where('personnel_profile_id',$review['personnel_profile_id'])
            ->where('evaluation_period_id',$review['evaluation_period_id'])
            ->orderBy('version_number','DESC')
            ->orderBy('submitted_at','DESC')
            ->get(1)->getRowArray();
        foreach(['criteria_snapshot','eligibility_snapshot'] as $field) if(isset($review[$field])&&is_string($review[$field])) $review[$field]=json_decode($review[$field],true);
        $criteriaRecalculation = (new \App\Services\PersonnelEvaluationCriteriaRecalculationService($db))->statusForEvaluation($id);
        $scorePreviewService = new \App\Services\PersonnelEvaluationItemScorePreviewService();
        $scoreTotals = $scorePreviewService->totals($items, (int) ($review['tenure_years'] ?? 0), (array) ($review['criteria_snapshot'] ?? []));
        $review['total_score'] = $scoreTotals['total_score'];
        $review['area_a_score'] = $scoreTotals['areaA_score'];
        $review['area_b_score'] = $scoreTotals['areaB_score'];
        $review['area_c_score'] = $scoreTotals['areaC_score'];
        $review['service_years_credit'] = $scoreTotals['service_years_credit'];
        $scorePreviews = [];
        foreach ($items as $item) $scorePreviews[$item['id']] = $scorePreviewService->preview($items, $item, 'FACULTY', (int) ($review['tenure_years'] ?? 0), (array) ($review['criteria_snapshot'] ?? []));
        return $this->respond(['data'=>['review'=>$review,'items'=>$items,'latest_version'=>$latestVersion,'eligibility'=>$eligibility,'criteria_recalculation'=>$criteriaRecalculation,'graduate_units'=>$scoreTotals['graduate_units'],'score_previews'=>$scorePreviews,'read_only'=>$readOnly]]);
    }
}
