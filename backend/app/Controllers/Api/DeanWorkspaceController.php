<?php

namespace App\Controllers\Api;

use App\Services\AuthenticatedActorService;
use App\Services\PersonnelEvaluationPeriodService;
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

    public function dashboard(): mixed
    {
        $scope = $this->scope();
        if ($scope === false) return $this->respond(['error' => ['code' => 'DEAN_ASSIGNMENT_REQUIRED', 'message' => 'Your Dean role does not currently have an active college assignment.']], 403);
        $db = db_connect(); $collegeId = $scope['college_id'];
        $periods = (new PersonnelEvaluationPeriodService($db))->list(['evaluation_type' => 'RANKING_PROMOTION']);
        $period = null;
        foreach ($periods as $candidate) {
            if (in_array($candidate['status'], ['OPEN_FOR_SUBMISSION','SUBMISSION_CLOSED','EVALUATION_ONGOING'], true)) { $period = $candidate; break; }
        }
        $people = $db->table('personnel_profiles pp')->select('pp.profile_id, pp.personnel_group, pp.organizational_side')
            ->join('personnel_college_affiliations pca', 'pca.personnel_profile_id=pp.profile_id AND pca.is_active=1')
            ->where('pca.college_id', $collegeId)->get()->getResultArray();
        $ids = array_column($people, 'profile_id');
        $faculty = array_values(array_filter($people, fn($p) => ($p['personnel_group'] ?? '') === 'faculty' && ($p['organizational_side'] ?? '') === 'academic'));
        $facultyIds = array_column($faculty, 'profile_id');
        $actorProfileId = $scope['actor']['profile']['id'] ?? null;
        $deanEvaluableIds = array_values(array_filter($facultyIds, static fn($id) => $id !== $actorProfileId));
        $evaluationBuilder = $db->table('personnel_evaluations');
        if ($ids) $evaluationBuilder->whereIn('personnel_profile_id', $ids);
        if ($period) $evaluationBuilder->where('evaluation_period_id', $period['id']);
        $evaluations = ($ids && $period) ? $evaluationBuilder->orderBy('submitted_at', 'DESC')->get()->getResultArray() : [];
        $latest = []; foreach ($evaluations as $row) { if (!isset($latest[$row['personnel_profile_id']])) $latest[$row['personnel_profile_id']] = $row; }
        $counts = ['not_yet_submitted'=>0,'awaiting_dean_review'=>0,'returned_for_revision'=>0,'resubmitted'=>0,'endorsed_to_hr'=>0,'under_hr_review'=>0,'completed'=>0];
        foreach ($deanEvaluableIds as $id) {
            $status = $latest[$id]['status'] ?? null;
            if ($status === null) $counts['not_yet_submitted']++;
            elseif ($status === 'submitted') $counts['awaiting_dean_review']++;
            elseif ($status === 'returned_for_revision') $counts['returned_for_revision']++;
            elseif ($status === 'ready_for_finalization') $counts['endorsed_to_hr']++;
            elseif ($status === 'in_evaluation') $counts['under_hr_review']++;
            elseif ($status === 'completed') $counts['completed']++;
        }
        $activity = [];
        if ($evaluations) {
            $evaluationIds = array_column($evaluations, 'id');
            $eventsTable = 'personnel_evaluation_events';
            $eventColumn = $db->fieldExists('event_type', $eventsTable) ? 'event_type' : 'action';
            $notesColumn = $db->fieldExists('notes', $eventsTable) ? 'notes' : 'remarks';
            $timeColumn = $db->fieldExists('occurred_at', $eventsTable) ? 'occurred_at' : 'created_at';
            $activity = $db->table($eventsTable . ' ev')->select("ev.{$eventColumn} AS event_type, ev.{$notesColumn} AS notes, ev.{$timeColumn} AS occurred_at, ev.evaluation_id, p.full_name AS personnel_name")
                ->join('personnel_evaluations pe', 'pe.id=ev.evaluation_id')->join('profiles p', 'p.id=pe.personnel_profile_id')
                ->whereIn('ev.evaluation_id', $evaluationIds)->orderBy("ev.{$timeColumn}", 'DESC')->limit(10)->get()->getResultArray();
        }
        return $this->respond(['data' => ['college'=>['id'=>$collegeId,'name'=>$scope['college_name']], 'evaluation_period'=>$period ? [
            'id'=>$period['id'],'name'=>$period['period_name'],'status'=>$period['status'],'status_label'=>$period['status_label'],
            'start_date'=>$period['submission_open_at'],'end_date'=>$period['evaluation_end_at'],'submission_close_at'=>$period['submission_close_at']
        ] : null, 'metrics'=>[
            'total_college_personnel'=>count($people),'academic_faculty'=>count($faculty),'hr_handled_personnel'=>count($people)-count($deanEvaluableIds), ...$counts
        ], 'recent_activity'=>$activity]]);
    }

    public function roster(): mixed
    {
        $scope = $this->scope();
        if ($scope === false) return $this->respond(['error'=>['code'=>'DEAN_ASSIGNMENT_REQUIRED','message'=>'Your Dean role does not currently have an active college assignment.']], 403);
        $db=db_connect(); $period=null;
        foreach ((new PersonnelEvaluationPeriodService($db))->list(['evaluation_type'=>'RANKING_PROMOTION']) as $candidate) {
            if (in_array($candidate['status'], ['OPEN_FOR_SUBMISSION','SUBMISSION_CLOSED','EVALUATION_ONGOING'], true)) { $period=$candidate; break; }
        }
        $rows=$db->table('personnel_profiles pp')->select('p.id,p.full_name,p.institutional_id,p.email AS institutional_email,p.status,pp.personnel_group,pp.organizational_side,pp.personnel_classification,pp.position_title,pp.current_rank_title,pp.faculty_engagement,pp.employment_status,ap.id AS program_id,ap.name AS program_name,au.name AS department_name')
            ->join('profiles p','p.id=pp.profile_id')->join('personnel_college_affiliations pca','pca.personnel_profile_id=pp.profile_id AND pca.is_active=1')
            ->join('personnel_program_affiliations ppa','ppa.personnel_profile_id=pp.profile_id AND ppa.is_active=1','left')->join('academic_programs ap','ap.id=ppa.academic_program_id','left')
            ->join('personnel_administrative_unit_affiliations pau','pau.personnel_profile_id=pp.profile_id AND pau.is_active=1','left')->join('administrative_units au','au.id=pau.administrative_unit_id','left')
            ->where('pca.college_id',$scope['college_id'])->orderBy('p.full_name')->get()->getResultArray();
        $seen=[]; $result=[]; $eligibilityService=new \App\Services\PersonnelEligibilityService($db);
        foreach($rows as $row){ if(isset($seen[$row['id']])) continue; $seen[$row['id']]=true;
            $isSelf=$row['id']===($scope['actor']['profile']['id']??null);
            $eligible=($row['personnel_group']==='faculty' && $row['organizational_side']==='academic' && !$isSelf);
            $evaluation=$period ? $db->table('personnel_evaluations')->select('id,status,version_number,submitted_at')->where('personnel_profile_id',$row['id'])->where('evaluation_period_id',$period['id'])->orderBy('version_number','DESC')->get()->getRowArray() : null;
            $roles=$db->table('profile_roles pr')->select('r.role_key,r.display_name')->join('roles r','r.id=pr.role_id')->where('pr.profile_id',$row['id'])->where('pr.is_active',1)->orderBy('r.display_name')->get()->getResultArray();
            $classificationLabel=match (($row['personnel_group']??'').'|'.($row['organizational_side']??'')) {
                'faculty|academic' => 'Faculty · Academic',
                'faculty|non_academic' => 'Faculty · Non-Academic',
                'non_teaching_faculty|academic', 'non_teaching_faculty|non_academic' => 'Non-teaching Faculty',
                default => 'Non-Teaching Faculty',
            };
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
        return $this->respond(['data'=>['college'=>['id'=>$scope['college_id'],'name'=>$scope['college_name']],'evaluation_period'=>$period,'summary'=>['total'=>count($result),'dean_then_hr'=>$deanRouteCount,'hr_direct'=>count($result)-$deanRouteCount],'personnel'=>$result,'total'=>count($result)]]);
    }

    public function reviews(): mixed
    {
        $scope = $this->scope();
        if ($scope === false) {
            return $this->respond(['error' => ['code' => 'DEAN_ASSIGNMENT_REQUIRED', 'message' => 'Your Dean role does not currently have an active college assignment.']], 403);
        }

        $db = db_connect();
        $period = null;
        foreach ((new PersonnelEvaluationPeriodService($db))->list(['evaluation_type' => 'RANKING_PROMOTION']) as $candidate) {
            if (in_array($candidate['status'], ['OPEN_FOR_SUBMISSION', 'SUBMISSION_CLOSED', 'EVALUATION_ONGOING'], true)) {
                $period = $candidate;
                break;
            }
        }

        $emptyCounts = ['needs_review' => 0, 'resubmitted' => 0, 'returned' => 0, 'endorsed' => 0, 'completed' => 0];
        $workspace = ['role' => 'dean', 'college_id' => $scope['college_id'], 'college_name' => $scope['college_name']];
        if ($period === null) {
            return $this->respond(['data' => ['workspace' => $workspace, 'evaluation_period' => null, 'counts' => $emptyCounts, 'programs' => [], 'reviews' => []]]);
        }

        $rows = $db->table('personnel_evaluations pe')
            ->select('pe.id,pe.personnel_profile_id,pe.status,pe.version_number,pe.submitted_at,pe.return_reason,p.full_name,p.institutional_id,pp.current_rank_title,pp.position_title,ap.id AS program_id,ap.name AS program_name,au.name AS department_name')
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
            ->where('pp.organizational_side', 'academic')
            ->where('pe.personnel_profile_id !=', $scope['actor']['profile']['id'])
            ->orderBy('pe.submitted_at', 'ASC')->get()->getResultArray();

        $eligibilityService = new \App\Services\PersonnelEligibilityService($db);
        $unique = [];
        foreach ($rows as $row) {
            if (!isset($unique[$row['id']])) {
                $eligibility = $eligibilityService->evaluateEligibility($row['personnel_profile_id'], $period['id']);
                if (($eligibility['eligibility_status'] ?? '') === 'eligible') $unique[$row['id']] = $row + ['eligibility' => $eligibility];
            }
        }
        $all = array_values($unique);
        $counts = $emptyCounts;
        foreach ($all as $row) {
            $status = $row['status'];
            $version = (int) ($row['version_number'] ?? 1);
            if (in_array($status, ['submitted', 'in_evaluation'], true)) {
                $counts['needs_review']++;
                if ($version > 1) $counts['resubmitted']++;
            } elseif ($status === 'returned_for_revision') $counts['returned']++;
            elseif ($status === 'ready_for_finalization') $counts['endorsed']++;
            elseif ($status === 'completed') $counts['completed']++;
        }

        $tab = (string) ($this->request->getGet('status') ?: 'needs_review');
        $search = mb_strtolower(trim((string) $this->request->getGet('search')));
        $program = trim((string) $this->request->getGet('program'));
        $filtered = array_values(array_filter($all, static function (array $row) use ($tab, $search, $program): bool {
            $status = $row['status'];
            $version = (int) ($row['version_number'] ?? 1);
            $tabMatch = match ($tab) {
                'resubmitted' => $version > 1 && in_array($status, ['submitted', 'in_evaluation'], true),
                'returned' => $status === 'returned_for_revision',
                'endorsed' => $status === 'ready_for_finalization',
                'completed' => $status === 'completed',
                default => in_array($status, ['submitted', 'in_evaluation'], true),
            };
            if (!$tabMatch) return false;
            if ($program !== '' && (string) ($row['program_id'] ?? '') !== $program) return false;
            if ($search !== '') {
                $haystack = mb_strtolower(implode(' ', [$row['full_name'] ?? '', $row['institutional_id'] ?? '', $row['program_name'] ?? '', $row['department_name'] ?? '']));
                if (!str_contains($haystack, $search)) return false;
            }
            return true;
        }));

        $programs = [];
        foreach ($all as $row) {
            if (!empty($row['program_id']) && !isset($programs[$row['program_id']])) $programs[$row['program_id']] = ['id' => $row['program_id'], 'name' => $row['program_name']];
        }

        return $this->respond(['data' => [
            'workspace' => $workspace,
            'evaluation_period' => ['id' => $period['id'], 'name' => $period['period_name'], 'status' => $period['status'], 'status_label' => $period['status_label']],
            'counts' => $counts,
            'programs' => array_values($programs),
            'reviews' => $filtered,
        ]]);
    }

    /** Exact submitted portfolio detail with college, self-review, and eligibility guards. */
    public function reviewDetail(string $id=''): mixed
    {
        $scope=$this->scope();
        if($scope===false) return $this->respond(['error'=>['code'=>'DEAN_ASSIGNMENT_REQUIRED','message'=>'Your Dean role does not currently have an active college assignment.']],403);
        $db=db_connect();
        $review=$db->table('personnel_evaluations pe')->select('pe.*,p.full_name,p.institutional_id,pp.current_rank_title,pp.position_title,c.name AS college_name')
            ->join('profiles p','p.id=pe.personnel_profile_id')->join('personnel_profiles pp','pp.profile_id=pe.personnel_profile_id')
            ->join('personnel_college_affiliations pca','pca.personnel_profile_id=pe.personnel_profile_id AND pca.is_active=1')->join('colleges c','c.id=pca.college_id','left')
            ->where('pe.id',$id)->where('pca.college_id',$scope['college_id'])->get()->getRowArray();
        if(!$review) return $this->respond(['error'=>['code'=>'WORKSPACE_SCOPE_FORBIDDEN','message'=>'This portfolio review is unavailable or outside your assigned college.']],403);
        if($review['personnel_profile_id']===($scope['actor']['profile']['id']??null)) return $this->respond(['error'=>['code'=>'DEAN_SELF_REVIEW_FORBIDDEN','message'=>'Dean self-review is unavailable and routes to HR.']],403);
        $eligibility=is_string($review['eligibility_snapshot']??null) ? json_decode($review['eligibility_snapshot'],true) : ($review['eligibility_snapshot']??[]);
        if(!is_array($eligibility)||$eligibility===[]) $eligibility=(new \App\Services\PersonnelEligibilityService($db))->evaluateEligibility($review['personnel_profile_id'],$review['evaluation_period_id']);
        if(($eligibility['eligibility_status']??'')!=='eligible') return $this->respond(['error'=>['code'=>'PORTFOLIO_NOT_ELIGIBLE','message'=>'This portfolio is not eligible for Dean review.','reasons'=>$eligibility['eligibility_reasons']??[]]],422);
        $items=$db->table('personnel_evaluation_items pei')->select('pei.*')->where('pei.evaluation_id',$id)->orderBy('pei.submission_order','ASC')->orderBy('pei.created_at','ASC')->get()->getResultArray();
        foreach ($items as &$item) foreach (['criterion_snapshot','evidence_snapshot','scoring_payload'] as $field) if(isset($item[$field])&&is_string($item[$field])) $item[$field]=json_decode($item[$field],true);
        foreach(['criteria_snapshot','eligibility_snapshot'] as $field) if(isset($review[$field])&&is_string($review[$field])) $review[$field]=json_decode($review[$field],true);
        return $this->respond(['data'=>['review'=>$review,'items'=>$items,'eligibility'=>$eligibility]]);
    }
}
