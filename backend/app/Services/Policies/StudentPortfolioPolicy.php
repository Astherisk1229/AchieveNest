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

        // Only student owner can edit, and only in canonical editable states.
        return $actorId !== '' &&
               $actorId === $studentProfileId &&
               in_array($status, ['draft', 'revision_requested'], true);
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
     * - Record status is canonical 'submitted'
     */
    public function canVerify(array $actor, array $record): bool
    {
        return (string) ($record['status'] ?? 'draft') === 'submitted'
            && $this->canReviewStudent($actor, $record);
    }

    /**
     * Scope-only check used before state checks, so an unauthorized coordinator always gets 403
     * regardless of the record's status:
     * - not the student owner (no self-verification);
     * - active Program Coordinator of the student's single active program.
     */
    public function canReviewStudent(array $actor, array $record): bool
    {
        $actorId = (string) ($actor['profile']['id'] ?? '');
        $studentProfileId = (string) ($record['student_profile_id'] ?? '');

        if ($actorId === '' || $actorId === $studentProfileId) {
            return false;
        }

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

        // 2. OSAD sees all non-draft canonical workflow records.
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
                    static fn (BaseBuilder $sub) => self::studentsInPrograms($sub, $coordinatorProgramIds)
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
                static fn (BaseBuilder $sub) => self::studentsInPrograms($sub, $coordinatorProgramIds)
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

    /**
     * The one program-resolution rule used by list scoping, verification and submission routing:
     * the student's active enrollment(s) in active academic programs. Exactly one program is
     * authoritative; zero or several (ambiguous) resolve to no program.
     *
     * @return array{status: 'none'|'single'|'ambiguous', program_id: ?string}
     */
    public function resolveStudentProgram(string $studentProfileId): array
    {
        $rows = db_connect()->table('student_program_enrollments spe')
            ->select('spe.academic_program_id')
            ->join('academic_programs ap', "ap.id = spe.academic_program_id AND ap.status = 'active'")
            ->where('spe.student_profile_id', $studentProfileId)
            ->where('spe.is_active', 1)
            ->get()
            ->getResultArray();
        $programIds = array_values(array_unique(array_column($rows, 'academic_program_id')));

        return match (count($programIds)) {
            0 => ['status' => 'none', 'program_id' => null],
            1 => ['status' => 'single', 'program_id' => (string) $programIds[0]],
            default => ['status' => 'ambiguous', 'program_id' => null],
        };
    }

    /** Active Program Coordinators (active assignment and active profile) of a program. */
    public function activeCoordinatorIds(string $programId): array
    {
        $rows = db_connect()->table('program_coordinator_assignments pca')
            ->select('pca.personnel_profile_id')
            ->join('profiles p', "p.id = pca.personnel_profile_id AND p.status = 'active'")
            ->where('pca.academic_program_id', $programId)
            ->where('pca.is_active', 1)
            ->get()
            ->getResultArray();

        return array_values(array_unique(array_map('strval', array_column($rows, 'personnel_profile_id'))));
    }

    protected function getStudentCurrentProgramId(string $studentProfileId): ?string
    {
        return $this->resolveStudentProgram($studentProfileId)['program_id'];
    }

    /**
     * Subquery: students whose single active enrollment (in an active program) is one of $programIds.
     * The database guarantees at most one active enrollment per student (uq_active_student_enrollment);
     * students with ambiguous active programs are excluded, matching resolveStudentProgram().
     */
    private static function studentsInPrograms(BaseBuilder $sub, array $programIds): BaseBuilder
    {
        $db = db_connect();
        $in = implode(',', array_map(static fn (string $id): string => (string) $db->escape($id), $programIds));

        return $sub->select('spe.student_profile_id')
            ->from('student_program_enrollments spe')
            ->join('academic_programs ap', "ap.id = spe.academic_program_id AND ap.status = 'active'")
            ->where('spe.is_active', 1)
            ->groupBy('spe.student_profile_id')
            ->having("COUNT(DISTINCT spe.academic_program_id) = 1 AND MAX(spe.academic_program_id) IN ({$in})", null, false);
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
