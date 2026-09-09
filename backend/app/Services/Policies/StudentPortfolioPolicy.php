<?php

namespace App\Services\Policies;

use CodeIgniter\Database\BaseBuilder;

class StudentPortfolioPolicy
{
    /**
     * Determines whether an actor can view a single student portfolio record.
     */
    public function canView(array $actor, array $record): bool
    {
        $actorId = (string) ($actor['profile']['id'] ?? '');
        $studentProfileId = (string) ($record['student_profile_id'] ?? '');
        $recordStatus = (string) ($record['status'] ?? 'draft');
        $roles = (array) ($actor['roles'] ?? []);

        // 1. Student owner can always view own record
        if ($actorId !== '' && $actorId === $studentProfileId) {
            return true;
        }

        // 2. Draft records are private to the student owner only
        if ($recordStatus === 'draft') {
            return false;
        }

        // 3. OSAD Administrator can view all submitted/verified student portfolio records
        if (in_array('osad_staff', $roles, true)) {
            return true;
        }

        // 4. Program Coordinator can view if the student is currently enrolled in their assigned program
        $coordinatorProgramIds = $this->getCoordinatorProgramIds($actor);
        if (! empty($coordinatorProgramIds)) {
            $studentProgramId = $this->getStudentCurrentProgramId($studentProfileId);
            if ($studentProgramId !== null && in_array($studentProgramId, $coordinatorProgramIds, true)) {
                return true;
            }
        }

        // 5. Dean can view if the student is currently enrolled in a program under their assigned college
        $deanCollegeIds = $this->getDeanCollegeIds($actor);
        if (! empty($deanCollegeIds)) {
            $studentCollegeId = $this->getStudentCurrentCollegeId($studentProfileId);
            if ($studentCollegeId !== null && in_array($studentCollegeId, $deanCollegeIds, true)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Determines whether an actor can create a portfolio record for their own profile.
     */
    public function canCreate(array $actor): bool
    {
        return ($actor['profile']['account_type'] ?? '') === 'student' &&
               in_array('student', $actor['roles'] ?? [], true) &&
               ($actor['profile']['status'] ?? '') === 'active';
    }

    /**
     * Determines whether an actor can edit a student portfolio record.
     */
    public function canEdit(array $actor, array $record): bool
    {
        $actorId = (string) ($actor['profile']['id'] ?? '');
        $studentProfileId = (string) ($record['student_profile_id'] ?? '');
        $status = (string) ($record['status'] ?? 'draft');

        // Only student owner can edit, and only in draft or revisions_requested status
        return $actorId !== '' &&
               $actorId === $studentProfileId &&
               in_array($status, ['draft', 'revisions_requested'], true);
    }

    /**
     * Determines whether an actor can submit a student portfolio record for verification.
     */
    public function canSubmit(array $actor, array $record): bool
    {
        return $this->canEdit($actor, $record);
    }

    /**
     * Determines whether an actor can delete a student portfolio record.
     */
    public function canDelete(array $actor, array $record): bool
    {
        $actorId = (string) ($actor['profile']['id'] ?? '');
        $studentProfileId = (string) ($record['student_profile_id'] ?? '');
        $status = (string) ($record['status'] ?? 'draft');

        // Only student owner can delete, and only in draft status
        return $actorId !== '' &&
               $actorId === $studentProfileId &&
               $status === 'draft';
    }

    /**
     * Determines whether an actor can verify/decide on a student portfolio record.
     * Enforces:
     * - Active Program Coordinator assignment
     * - Coordinator's assigned program matches student's active enrolled program
     * - NOT the student owner (NO self-verification)
     * - Record status is 'submitted' or 'under_review'
     */
    public function canVerify(array $actor, array $record): bool
    {
        $actorId = (string) ($actor['profile']['id'] ?? '');
        $studentProfileId = (string) ($record['student_profile_id'] ?? '');
        $status = (string) ($record['status'] ?? 'draft');

        // Rule 1: No self-verification under any circumstance
        if ($actorId !== '' && $actorId === $studentProfileId) {
            return false;
        }

        // Rule 2: Must be in a verifiable status
        if (! in_array($status, ['submitted', 'under_review'], true)) {
            return false;
        }

        // Rule 3: Must be an active Program Coordinator for the student's current program
        $coordinatorProgramIds = $this->getCoordinatorProgramIds($actor);
        if (empty($coordinatorProgramIds)) {
            return false;
        }

        $studentProgramId = $this->getStudentCurrentProgramId($studentProfileId);
        return $studentProgramId !== null && in_array($studentProgramId, $coordinatorProgramIds, true);
    }

    /**
     * Scopes a student portfolio query based on the actor's authorized scope.
     */
    public function scopeListQuery(array $actor, BaseBuilder $builder): BaseBuilder
    {
        $actorId = (string) ($actor['profile']['id'] ?? '');
        $accountType = (string) ($actor['profile']['account_type'] ?? '');
        $roles = (array) ($actor['roles'] ?? []);

        // 1. Student sees only their own records
        if ($accountType === 'student') {
            return $builder->where('spr.student_profile_id', $actorId);
        }

        // 2. OSAD sees all submitted/verified/under_review/revisions_requested/rejected records
        if (in_array('osad_staff', $roles, true)) {
            return $builder->whereNotIn('spr.status', ['draft']);
        }

        // 3. Program Coordinator: records for students in their assigned program(s)
        $coordinatorProgramIds = $this->getCoordinatorProgramIds($actor);
        $deanCollegeIds = $this->getDeanCollegeIds($actor);

        if (! empty($coordinatorProgramIds) || ! empty($deanCollegeIds)) {
            $builder->whereNotIn('spr.status', ['draft']);

            $builder->groupStart();
            if (! empty($coordinatorProgramIds)) {
                $builder->whereIn(
                    'spr.student_profile_id',
                    static function (BaseBuilder $sub) use ($coordinatorProgramIds) {
                        return $sub->select('student_profile_id')
                            ->from('student_program_enrollments')
                            ->whereIn('academic_program_id', $coordinatorProgramIds)
                            ->where('is_active', 1);
                    }
                );
            }

            if (! empty($deanCollegeIds)) {
                if (! empty($coordinatorProgramIds)) {
                    $builder->orWhereIn(
                        'spr.student_profile_id',
                        static function (BaseBuilder $sub) use ($deanCollegeIds) {
                            return $sub->select('spe.student_profile_id')
                                ->from('student_program_enrollments spe')
                                ->join('academic_programs ap', 'ap.id = spe.academic_program_id')
                                ->whereIn('ap.college_id', $deanCollegeIds)
                                ->where('spe.is_active', 1);
                        }
                    );
                } else {
                    $builder->whereIn(
                        'spr.student_profile_id',
                        static function (BaseBuilder $sub) use ($deanCollegeIds) {
                            return $sub->select('spe.student_profile_id')
                                ->from('student_program_enrollments spe')
                                ->join('academic_programs ap', 'ap.id = spe.academic_program_id')
                                ->whereIn('ap.college_id', $deanCollegeIds)
                                ->where('spe.is_active', 1);
                        }
                    );
                }
            }
            $builder->groupEnd();

            return $builder;
        }

        // Default: deny everything by adding impossible condition
        return $builder->where('spr.id', '00000000-0000-0000-0000-000000000000');
    }

    /**
     * Scopes verification queue query.
     */
    public function scopeVerificationQuery(array $actor, BaseBuilder $builder): BaseBuilder
    {
        $actorId = (string) ($actor['profile']['id'] ?? '');
        $roles = (array) ($actor['roles'] ?? []);

        // OSAD sees all in-queue items
        if (in_array('osad_staff', $roles, true)) {
            return $builder->where('spr.student_profile_id !=', $actorId);
        }

        $coordinatorProgramIds = $this->getCoordinatorProgramIds($actor);
        if (! empty($coordinatorProgramIds)) {
            $builder->whereIn(
                'spr.student_profile_id',
                static function (BaseBuilder $sub) use ($coordinatorProgramIds) {
                    return $sub->select('student_profile_id')
                        ->from('student_program_enrollments')
                        ->whereIn('academic_program_id', $coordinatorProgramIds)
                        ->where('is_active', 1);
                }
            );
            $builder->where('spr.student_profile_id !=', $actorId);
            return $builder;
        }

        return $builder->where('spr.id', '00000000-0000-0000-0000-000000000000');
    }

    protected function getCoordinatorProgramIds(array $actor): array
    {
        $programIds = [];
        foreach ($actor['assignments'] ?? [] as $asgn) {
            if (($asgn['role_key'] ?? '') === 'program_coordinator' &&
                ($asgn['scope_type'] ?? '') === 'academic_program' &&
                ! empty($asgn['scope_id'])) {
                $programIds[] = (string) $asgn['scope_id'];
            }
        }
        return array_values(array_unique($programIds));
    }

    protected function getDeanCollegeIds(array $actor): array
    {
        $collegeIds = [];
        foreach ($actor['assignments'] ?? [] as $asgn) {
            if (($asgn['role_key'] ?? '') === 'dean' &&
                ($asgn['scope_type'] ?? '') === 'college' &&
                ! empty($asgn['scope_id'])) {
                $collegeIds[] = (string) $asgn['scope_id'];
            }
        }
        return array_values(array_unique($collegeIds));
    }

    protected function getStudentCurrentProgramId(string $studentProfileId): ?string
    {
        $db = db_connect();
        $row = $db->table('student_program_enrollments')
            ->select('academic_program_id')
            ->where('student_profile_id', $studentProfileId)
            ->where('is_active', 1)
            ->orderBy('effective_from', 'DESC')
            ->get()
            ->getRowArray();

        return $row['academic_program_id'] ?? null;
    }

    protected function getStudentCurrentCollegeId(string $studentProfileId): ?string
    {
        $db = db_connect();
        $row = $db->table('student_program_enrollments spe')
            ->select('ap.college_id')
            ->join('academic_programs ap', 'ap.id = spe.academic_program_id')
            ->where('spe.student_profile_id', $studentProfileId)
            ->where('spe.is_active', 1)
            ->orderBy('spe.effective_from', 'DESC')
            ->get()
            ->getRowArray();

        return $row['college_id'] ?? null;
    }
}
