<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;

/** Canonical, explainable Dean portfolio-eligibility engine. */
class PersonnelEligibilityService
{
    public const ELIGIBLE_RATINGS = ['outstanding', 'very_satisfactory', 'satisfactory'];
    public const RATINGS = ['outstanding', 'very_satisfactory', 'satisfactory', 'fair', 'poor'];

    public static function isEligibleRating(?string $rating): bool { return in_array($rating, self::ELIGIBLE_RATINGS, true); }
    public static function serviceCondition(string $employmentStatus, ?float $serviceYears): ?bool
    {
        if ($serviceYears === null) return null;
        if ($employmentStatus === 'permanent') return true;
        if ($employmentStatus === 'probationary') return $serviceYears >= 3.0;
        return false;
    }

    public function __construct(protected ?BaseConnection $db = null, private ?EmploymentServiceDurationService $duration = null)
    {
        $this->db ??= db_connect();
        $this->duration ??= new EmploymentServiceDurationService($this->db);
    }

    public function evaluateEligibility(string $personnelProfileId, string $periodReference): array
    {
        $period = $this->resolvePeriod($periodReference);
        $person = $this->db->table('personnel_profiles pp')
            ->select('p.id,p.full_name,p.status AS account_status,pp.personnel_group,pp.organizational_side,pp.faculty_engagement,pp.employment_status,pp.employment_start_date,pp.position_title,pp.current_rank_title')
            ->join('profiles p','p.id=pp.profile_id')->where('pp.profile_id',$personnelProfileId)->get()->getRowArray();

        $reasons = [];
        if (!$person) return $this->result($personnelProfileId, $period, 'pending', ['Personnel record is unavailable.']);
        try { $authority=(new OrganizationalAuthorityResolver($this->db))->resolveResponsibleAuthority($personnelProfileId,$period);$reviewResponsibility=strtolower((string)$authority['authority_type']); }
        catch (\RuntimeException) { $reviewResponsibility='unresolved'; }
        if (!$period) $reasons[] = 'Evaluation period is unavailable.';
        elseif (!in_array($period['status']??'', ['OPEN_FOR_SUBMISSION','SUBMISSION_CLOSED','EVALUATION_ONGOING'], true)) $reasons[] = 'Evaluation period is not open.';

        $service = null;
        // HR master-data fields the service requirement depends on (HR → Personnel Directory → Edit Master Data).
        $missing = [];
        $hrSource = 'HR → Personnel Directory → Edit Master Data';
        $startDate = trim((string)($person['employment_start_date'] ?? ''));
        // COMPUTED (Years of Service): measured up to the ranking period's achievement coverage end; legacy cycles without coverage keep the evaluation end.
        $cutoff = (new EvaluationValidityService($this->db))->serviceCutoff($period);
        if ($startDate === '') $missing[] = ['field'=>'employment_start_date','label'=>'Employment start date','detail'=>'Not recorded in HR master data; years of service cannot be calculated.','source'=>$hrSource];
        if (trim((string)($person['employment_status'] ?? '')) === '') $missing[] = ['field'=>'employment_status','label'=>'Employment status (Permanent or Probationary)','detail'=>'Not recorded in HR master data.','source'=>$hrSource];
        // Qualifying length of service (excludes part-time periods and breaks), as of the period end.
        // HR service history is authoritative; without it the HR start date is used (unverified).
        if ($period) {
            $invalidStart = false;
            try {
                $service = $this->duration->calculateQualifyingService($personnelProfileId, $cutoff);
                $legacy = ($service['basis'] ?? null) === EmploymentServiceDurationService::BASIS_LEGACY_START_DATE;
                if ($legacy && $startDate > $cutoff) $invalidStart = true;
                if (($service['basis'] ?? null) === EmploymentServiceDurationService::BASIS_UNAVAILABLE) $service = null;
            } catch (\Throwable $e) {
                $invalidStart = true;
            }
            if ($invalidStart) {
                $service = null;
                $reasons[] = 'Employment start date is invalid.';
                $missing[] = ['field'=>'employment_start_date','label'=>'Employment start date','detail'=>'Recorded value ('.$startDate.') is invalid or later than the service cutoff ('.$cutoff.').','source'=>$hrSource];
            }
        }
        // A recorded service history replaces the start date as the service source.
        if ($service !== null && ($service['basis'] ?? null) === EmploymentServiceDurationService::BASIS_SERVICE_HISTORY) {
            $missing = array_values(array_filter($missing, fn ($m) => $m['field'] !== 'employment_start_date'));
        }
        $status = strtolower((string)($person['employment_status'] ?? ''));
        $serviceYears = $service ? round(((int)$service['total_months']) / 12, 2) : null;
        $serviceStatus='pending';
        if($serviceYears===null)$reasons[]='Waiting for HR employment/service information.';
        elseif($status==='permanent')$serviceStatus='passed';
        elseif($status==='probationary'&&$serviceYears>=3.0)$serviceStatus='passed';
        elseif($status==='probationary'){$serviceStatus='not_passed';$reasons[]='Probationary personnel require at least 3.00 years of service.';}
        else{$serviceStatus='not_passed';$reasons[]='Employment status must be Permanent or Probationary.';}
        // Part-time faculty hold part-time titles and are not ranked, so they cannot enter a ranking period.
        if(strtoupper((string)($person['personnel_group']??''))==='FACULTY'&&($person['faculty_engagement']??null)===FacultyStatusService::ENGAGEMENT_PART_TIME){$serviceStatus='not_passed';$reasons[]='Part-time faculty hold a part-time title and are not ranked; only full-time faculty can apply for a rank.';}

        $import=null;
        if($period&&$this->db->tableExists('personnel_annual_review_imports'))$import=$this->db->table('personnel_annual_review_imports')->where(['personnel_profile_id'=>$personnelProfileId,'evaluation_period_id'=>$period['id']])->where('confirmed_at !=',null)->where('superseded_at',null)->orderBy('confirmed_at','DESC')->get()->getRowArray();
        $annualStatus=$import['two_review_status']??'pending';
        if(!$import)$reasons[]='Two confirmed annual-review reports are required.';
        elseif($annualStatus==='pending')$reasons[]=$import['two_review_reason']?:'Second required annual review is missing.';
        elseif($annualStatus==='not_passed')$reasons[]='Two annual reviews are not both passing.';
        $hardFailure=$serviceStatus==='not_passed'||$annualStatus==='not_passed'||($period&&!in_array($period['status']??'', ['OPEN_FOR_SUBMISSION','SUBMISSION_CLOSED','EVALUATION_ONGOING'],true));
        $eligibility=$hardFailure?'not_eligible':(($serviceStatus==='passed'&&$annualStatus==='passed'&&$period)?'eligible':'pending');
        $result=$this->result($personnelProfileId,$period,$eligibility,$reasons,$serviceYears,null,$status,null,$import,$annualStatus,$serviceStatus);$result['review_responsibility']=$reviewResponsibility;
        $result['service_completed_years'] = $service['completed_years'] ?? null;
        $result['service_requirement'] += [
            'completed_years' => $service['completed_years'] ?? null,
            'display' => $service['display'] ?? null,
            'basis' => $service['basis'] ?? EmploymentServiceDurationService::BASIS_UNAVAILABLE,
            'verified' => (bool) ($service['verified'] ?? false),
            'reference_date' => $cutoff,
            'service_history_version_id' => $service['service_history_version_id'] ?? null,
            'policy_rule_version_reference' => $service['policy_rule_version_reference'] ?? null,
        ];
        // Reported only while the service requirement is unresolved; it does not change the decision above.
        $result['missing_hr_requirements']=$serviceStatus==='pending'?$missing:[];
        return$result;
    }

    private function resolvePeriod(string $reference): ?array
    {
        $builder = $this->db->table('personnel_evaluation_periods');
        $builder->groupStart()->where('id',$reference)->orWhere('academic_year',$reference)->orWhere('period_code',$reference)->groupEnd();
        return $builder->orderBy('evaluation_end_at','DESC')->get()->getRowArray() ?: null;
    }

    private function result(string $profileId, ?array $period, string $status, array $reasons, ?float $years=null, ?string $rating=null, ?string $employment=null, ?string $reviewId=null, ?array $import=null, string $annualStatus='pending', string $serviceStatus='pending'): array
    {
        $labels=['eligible'=>'Eligible','not_eligible'=>'Not Eligible','pending'=>'Pending'];
        return [
            'evaluation_period_id'=>$period['id']??null,'evaluation_cycle_id'=>$period['academic_year']??null,'personnel_profile_id'=>$profileId,
            'eligibility_status'=>$status,'eligibility_label'=>$labels[$status],'eligibility_reasons'=>array_values(array_unique($reasons)),
            'service_years'=>$years,'annual_rating'=>$rating,'employment_status'=>$employment,'annual_review_id'=>$reviewId,
            'annual_review_requirement'=>['status'=>$annualStatus,'review_1_school_year'=>$import['review_1_school_year']??null,'review_1_rating'=>$import['review_1_rating']??null,'review_2_school_year'=>$import['review_2_school_year']??null,'review_2_rating'=>$import['review_2_rating']??null,'import_id'=>$import['id']??null],
            'service_requirement'=>['status'=>$serviceStatus,'service_years'=>$years,'employment_status'=>$employment],
            'portfolio_validation'=>['eligible'=>$status==='eligible','decision'=>$status,'review_id'=>$reviewId,'reason_codes'=>array_values(array_unique($reasons))],
        ];
    }
}
