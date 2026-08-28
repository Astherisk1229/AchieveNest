<?php

namespace App\Services\Policies;

use App\Services\Policies\PersonnelPolicy;
use App\Services\Policies\StudentPortfolioPolicy;

class EvidencePolicy
{
    protected StudentPortfolioPolicy $portfolioPolicy;
    protected PersonnelPolicy $personnelPolicy;

    public function __construct(
        ?StudentPortfolioPolicy $portfolioPolicy = null,
        ?PersonnelPolicy $personnelPolicy = null
    ) {
        $this->portfolioPolicy = $portfolioPolicy ?? new StudentPortfolioPolicy();
        $this->personnelPolicy = $personnelPolicy ?? new PersonnelPolicy();
    }

    /**
     * Determines whether an actor can view/download student evidence metadata or content.
     */
    public function canReadStudentEvidence(array $actor, array $evidence): bool
    {
        $actorId = (string) ($actor['profile']['id'] ?? '');
        if ($actorId === '') {
            return false;
        }

        $ownerProfileId = (string) ($evidence['student_profile_id'] ?? $evidence['uploaded_by'] ?? '');

        // 1. Direct student owner
        if ($actorId === $ownerProfileId) {
            return true;
        }

        // 2. Fetch parent portfolio record and delegate to portfolio viewing policy
        $portfolioRecordId = (string) ($evidence['portfolio_record_id'] ?? $evidence['record_id'] ?? '');
        if ($portfolioRecordId !== '') {
            $db = db_connect();
            $record = $db->table('student_portfolio_records')
                ->where('id', $portfolioRecordId)
                ->get()
                ->getRowArray();

            if ($record !== null) {
                return $this->portfolioPolicy->canView($actor, $record);
            }
        }

        return false;
    }

    /**
     * Determines whether an actor can upload evidence to a student portfolio record.
     */
    public function canUploadStudentEvidence(array $actor, array $record): bool
    {
        return $this->portfolioPolicy->canEdit($actor, $record);
    }

    /**
     * Determines whether an actor can delete evidence from a student portfolio record.
     */
    public function canDeleteStudentEvidence(array $actor, array $evidence): bool
    {
        $actorId = (string) ($actor['profile']['id'] ?? '');
        if ($actorId === '') {
            return false;
        }

        $ownerProfileId = (string) ($evidence['student_profile_id'] ?? $evidence['uploaded_by'] ?? '');
        if ($actorId !== $ownerProfileId) {
            return false;
        }

        $portfolioRecordId = (string) ($evidence['portfolio_record_id'] ?? $evidence['record_id'] ?? '');
        if ($portfolioRecordId !== '') {
            $db = db_connect();
            $record = $db->table('student_portfolio_records')
                ->where('id', $portfolioRecordId)
                ->get()
                ->getRowArray();

            if ($record !== null) {
                return in_array($record['status'] ?? 'draft', ['draft', 'revisions_requested'], true);
            }
        }

        return false;
    }

    /**
     * Determines whether an actor can view personnel accomplishment evidence.
     */
    public function canReadPersonnelEvidence(array $actor, array $evidence): bool
    {
        $actorId = (string) ($actor['profile']['id'] ?? '');
        if ($actorId === '') {
            return false;
        }

        $ownerId = (string) ($evidence['personnel_profile_id'] ?? $evidence['uploaded_by'] ?? '');
        $roles = (array) ($actor['roles'] ?? []);

        // 1. Direct owner
        if ($actorId === $ownerId) {
            return true;
        }

        // 2. HR Staff
        if (in_array('hr_staff', $roles, true)) {
            return true;
        }

        // 3. Dean assigned to the Personnel's college
        if (in_array('dean', $roles, true) && $ownerId !== '') {
            $db = db_connect();
            $deanAssignment = $db->table('dean_assignments')
                ->where('personnel_profile_id', $actorId)
                ->where('is_active', 1)
                ->get()
                ->getRowArray();

            if ($deanAssignment !== null && ! empty($deanAssignment['college_id'])) {
                $personnelAffiliation = $db->table('personnel_college_affiliations')
                    ->where('personnel_profile_id', $ownerId)
                    ->where('college_id', $deanAssignment['college_id'])
                    ->where('is_active', 1)
                    ->get()
                    ->getRowArray();

                if ($personnelAffiliation !== null) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Determines whether an actor can upload personnel accomplishment evidence.
     */
    public function canUploadPersonnelEvidence(array $actor, array $record): bool
    {
        return $this->personnelPolicy->canEditAccomplishment($actor, $record);
    }
}
