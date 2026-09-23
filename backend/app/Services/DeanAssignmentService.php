<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use Throwable;

class DeanAssignmentService
{
    public function __construct(private ?DeanEligibilityService $eligibility = null)
    {
        $this->eligibility ??= new DeanEligibilityService();
    }

    public function assign(string $profileId, string $collegeId, string $actorId, string $effectiveFrom): array
    {
        $db = db_connect();
        $college = $this->activeCollege($db, $collegeId);
        if (! $college) return $this->failure('COLLEGE_NOT_FOUND', 404, 'The selected College was not found or is inactive.');
        $eligibility = $this->eligibility->check($profileId, $collegeId, $db);
        if (! $eligibility['eligible']) return $this->failure('INELIGIBLE_DEAN_AFFILIATION', 422, 'This faculty member is not eligible to serve as Dean of the selected College.');

        $db->transBegin();
        try {
            $current = $db->query('SELECT id FROM dean_assignments WHERE college_id=? AND is_active=1 FOR UPDATE', [$collegeId])->getRowArray();
            if ($current) { $db->transRollback(); return $this->failure('COLLEGE_ALREADY_HAS_ACTIVE_DEAN', 409, 'This College already has an active Dean. Use Reassign Dean instead.'); }
            $id = $this->uuid();
            $now = date('Y-m-d H:i:s');
            $db->table('dean_assignments')->insert(['id'=>$id,'personnel_profile_id'=>$profileId,'college_id'=>$collegeId,'effective_from'=>$effectiveFrom,'is_active'=>1,'assigned_by'=>$actorId,'assigned_at'=>$now,'created_at'=>$now,'updated_at'=>$now]);
            $this->audit($db, $profileId, $actorId, 'DEAN_ASSIGNED', 'unassigned', 'active', 'Initial Dean assignment', ['college_id'=>$collegeId,'effective_date'=>$effectiveFrom,'assignment_id'=>$id]);
            $this->notify($db, $profileId, $actorId, 'DEAN_ASSIGNED', 'Dean assignment', "You have been assigned as Dean of {$college['name']}.", $id);
            $db->transCommit();
            return ['success'=>true,'status'=>201,'data'=>['assignment_id'=>$id,'profile_id'=>$profileId,'college_id'=>$collegeId,'effective_from'=>$effectiveFrom]];
        } catch (Throwable $e) {
            $db->transRollback(); log_message('error', '[DeanAssignmentService::assign] '.$e->getMessage());
            return $this->failure('ASSIGNMENT_CONFLICT', 409, 'Dean assignment could not be completed.');
        }
    }

    public function reassign(string $collegeId, string $newProfileId, string $actorId, string $effectiveFrom, string $reason): array
    {
        if (mb_strlen(trim($reason)) < 5) return $this->failure('REASSIGNMENT_REASON_REQUIRED', 422, 'A reason for Dean reassignment is required.');
        $db = db_connect();
        $college = $this->activeCollege($db, $collegeId);
        if (! $college) return $this->failure('COLLEGE_NOT_FOUND', 404, 'The selected College was not found or is inactive.');
        $eligibility = $this->eligibility->check($newProfileId, $collegeId, $db);
        if (! $eligibility['eligible']) return $this->failure('INELIGIBLE_DEAN_AFFILIATION', 422, 'This faculty member is not eligible to serve as Dean of the selected College.');

        $db->transBegin();
        try {
            $current = $db->query('SELECT da.*,p.full_name FROM dean_assignments da JOIN profiles p ON p.id=da.personnel_profile_id WHERE da.college_id=? AND da.is_active=1 FOR UPDATE', [$collegeId])->getRowArray();
            if (! $current) { $db->transRollback(); return $this->failure('NO_ACTIVE_DEAN_TO_REASSIGN', 409, 'This College does not have an active Dean to reassign.'); }
            if ($current['personnel_profile_id'] === $newProfileId) { $db->transRollback(); return $this->failure('SAME_DEAN_REASSIGNMENT', 422, 'Select a different faculty member as the replacement Dean.'); }
            $now = date('Y-m-d H:i:s');
            $db->table('dean_assignments')->where('id',$current['id'])->update(['is_active'=>0,'effective_until'=>$effectiveFrom,'ended_by'=>$actorId,'ended_at'=>$now,'end_reason'=>trim($reason),'updated_at'=>$now]);
            $id = $this->uuid();
            $db->table('dean_assignments')->insert(['id'=>$id,'personnel_profile_id'=>$newProfileId,'college_id'=>$collegeId,'effective_from'=>$effectiveFrom,'is_active'=>1,'assigned_by'=>$actorId,'assigned_at'=>$now,'created_at'=>$now,'updated_at'=>$now]);
            $meta=['college_id'=>$collegeId,'old_dean_profile_id'=>$current['personnel_profile_id'],'new_dean_profile_id'=>$newProfileId,'effective_date'=>$effectiveFrom,'old_assignment_id'=>$current['id'],'new_assignment_id'=>$id];
            $this->audit($db,$current['personnel_profile_id'],$actorId,'DEAN_ASSIGNMENT_ENDED','active','ended',$reason,$meta);
            $this->audit($db,$newProfileId,$actorId,'DEAN_REASSIGNED','unassigned','active',$reason,$meta);
            $this->notify($db,$current['personnel_profile_id'],$actorId,'DEAN_ASSIGNMENT_ENDED','Dean assignment ended',"Your Dean assignment for {$college['name']} has ended.",$current['id']);
            $this->notify($db,$newProfileId,$actorId,'DEAN_REASSIGNED','Dean assignment',"You have been assigned as Dean of {$college['name']}.",$id);
            $db->transCommit();
            return ['success'=>true,'status'=>200,'data'=>['assignment_id'=>$id,'college_id'=>$collegeId,'previous_dean'=>$current['full_name'],'new_dean'=>$eligibility['personnel']['full_name'],'new_dean_id'=>$newProfileId,'effective_date'=>$effectiveFrom,'reason'=>trim($reason)]];
        } catch (Throwable $e) {
            $db->transRollback(); log_message('error', '[DeanAssignmentService::reassign] '.$e->getMessage());
            return $this->failure('ASSIGNMENT_FAILED', 500, 'Dean reassignment could not be completed.');
        }
    }

    public function history(string $collegeId): array
    {
        return db_connect()->table('dean_assignments da')->select('da.id AS assignment_id,da.personnel_profile_id,p.full_name,p.institutional_id,da.effective_from,da.effective_until,da.is_active,da.end_reason')->join('profiles p','p.id=da.personnel_profile_id')->where('da.college_id',$collegeId)->orderBy('da.effective_from','DESC')->get()->getResultArray();
    }

    private function activeCollege(BaseConnection $db,string $id): ?array { return $db->table('colleges')->where('id',$id)->where('status','active')->get()->getRowArray(); }
    private function failure(string $code,int $status,string $message): array { return ['success'=>false,'status'=>$status,'error'=>['code'=>$code,'message'=>$message]]; }
    private function uuid(): string { $h=bin2hex(random_bytes(16)); return substr($h,0,8).'-'.substr($h,8,4).'-4'.substr($h,13,3).'-'.dechex((hexdec($h[16])&3)|8).substr($h,17,3).'-'.substr($h,20,12); }
    private function audit(BaseConnection $db,string $profileId,string $actorId,string $type,string $previous,string $new,string $reason,array $metadata): void { if($db->tableExists('account_lifecycle_events')) $db->table('account_lifecycle_events')->insert(['id'=>$this->uuid(),'profile_id'=>$profileId,'actor_profile_id'=>$actorId,'event_type'=>$type,'previous_status'=>$previous,'new_status'=>$new,'reason'=>$reason,'metadata'=>json_encode($metadata),'occurred_at'=>date('Y-m-d H:i:s')]); }
    private function notify(BaseConnection $db,string $recipient,string $actor,string $type,string $title,string $message,string $reference): void { if($db->tableExists('notifications')) $db->table('notifications')->insert(['id'=>$this->uuid(),'recipient_profile_id'=>$recipient,'actor_profile_id'=>$actor,'notification_type'=>$type,'title'=>$title,'message'=>$message,'reference_type'=>'dean_assignment','reference_id'=>$reference,'is_mandatory'=>1,'created_at'=>date('Y-m-d H:i:s')]); }
}
