<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;

/**
 * CampusJournalismEligibilityService
 *
 * Single authoritative backend source of truth for Campus Journalism portfolio
 * verification status and verified-only scoring eligibility (Phase 3 Gate).
 */
class CampusJournalismEligibilityService
{
    public const CATEGORY_JOURNALISM_ID = '2b09cd61-7a23-4466-be58-889398e8f201';
    public const CATEGORY_CITATION_ID   = '448beadb-a254-4cb6-84fb-a3d5f4f8822e';
    public const CATEGORY_SEMINAR_ID    = '802de57b-54d7-4d38-9433-052ca9636380';

    public const PUB_NEWS_ID      = '40000009-0001-0000-0000-000000000001';
    public const PUB_LITERARY_ID  = '40000009-0001-0000-0000-000000000002';
    public const PUB_COLUMN_ID    = '40000009-0001-0000-0000-000000000003';
    public const PUB_EDITORIAL_ID = '40000009-0001-0000-0000-000000000004';
    public const ROLE_MEMBER_ID   = '40000009-0001-0000-0000-000000000005';
    public const ROLE_OFFICER_ID  = '40000009-0001-0000-0000-000000000006';

    protected BaseConnection $db;

    public function __construct(?BaseConnection $db = null)
    {
        $this->db = $db ?? db_connect();
    }

    /**
     * Evaluates a single student portfolio record for future scoring eligibility.
     *
     * Returns:
     * [
     *   'eligible' => bool,
     *   'reason'   => string,
     *   'details'  => array,
     * ]
     */
    public function evaluateRecordEligibility(array $record): array
    {
        $recordId = $record['id'] ?? null;
        $categoryId = $record['category_id'] ?? null;
        $subcategoryId = $record['subcategory_id'] ?? null;
        $verificationStatus = $record['status'] ?? 'draft';
        $title = trim((string) ($record['title'] ?? ''));
        $outlet = trim((string) ($record['organizer_or_body'] ?? ''));
        $date = $record['occurrence_date'] ?? $record['start_date'] ?? null;

        $metadata = is_string($record['structured_metadata'] ?? null)
            ? (json_decode($record['structured_metadata'], true) ?? [])
            : (is_array($record['structured_metadata'] ?? null) ? $record['structured_metadata'] : []);

        // 1. Verification Gate: Must be verified
        if ($verificationStatus !== 'verified') {
            return [
                'eligible' => false,
                'reason'   => "Record verification status is '{$verificationStatus}'. Only 'verified' records are score-eligible.",
                'gate'     => 'VERIFICATION_STATUS_NOT_VERIFIED',
            ];
        }

        // 2. Lifecycle Gate: Exclude archived / superseded / removed
        if (in_array($verificationStatus, ['archived', 'superseded', 'removed'], true)) {
            return [
                'eligible' => false,
                'reason'   => "Record is marked as '{$verificationStatus}' in lifecycle.",
                'gate'     => 'LIFECYCLE_INELIGIBLE',
            ];
        }

        // 3. Category Validation
        $isJournalismPub = ($categoryId === self::CATEGORY_JOURNALISM_ID);
        $isCitation = ($categoryId === self::CATEGORY_CITATION_ID);
        $isSeminar = ($categoryId === self::CATEGORY_SEMINAR_ID);

        if (! $isJournalismPub && ! $isCitation && ! $isSeminar) {
            return [
                'eligible' => false,
                'reason'   => 'Record category does not map to Campus Journalism or supporting domains.',
                'gate'     => 'UNRELATED_CATEGORY',
            ];
        }

        // 4. Evidence Presence Gate
        if ($recordId !== null) {
            $evidenceCount = $this->db->table('student_portfolio_evidence')
                ->where('portfolio_record_id', $recordId)
                ->where('status', 'active')
                ->countAllResults();

            if ($evidenceCount === 0) {
                return [
                    'eligible' => false,
                    'reason'   => 'Record has 0 active supporting evidence attachments.',
                    'gate'     => 'NO_ACTIVE_EVIDENCE',
                ];
            }
        }

        // 5. Publication Specific Structural Completeness Gate
        $pubSubcategoryIds = [self::PUB_NEWS_ID, self::PUB_LITERARY_ID, self::PUB_COLUMN_ID, self::PUB_EDITORIAL_ID];
        if ($isJournalismPub && in_array($subcategoryId, $pubSubcategoryIds, true)) {
            if ($title === '') {
                return ['eligible' => false, 'reason' => 'Missing published work title.', 'gate' => 'INCOMPLETE_TITLE'];
            }
            if ($outlet === '') {
                return ['eligible' => false, 'reason' => 'Missing publication outlet / publisher.', 'gate' => 'INCOMPLETE_OUTLET'];
            }
            if ($date === null || strtotime($date) > time()) {
                return ['eligible' => false, 'reason' => 'Missing or invalid (future) publication date.', 'gate' => 'INVALID_DATE'];
            }
            $role = $metadata['contribution_role'] ?? $metadata['role'] ?? null;
            if (empty($role)) {
                return ['eligible' => false, 'reason' => 'Missing student authorship / contribution role.', 'gate' => 'INCOMPLETE_ROLE'];
            }

            return [
                'eligible'                 => true,
                'reason'                   => 'Publication record is structurally complete, verified, active, and supported by evidence.',
                'component_type'           => 'PUBLICATION_EVIDENCE',
                'target_subcategory_id'    => $subcategoryId,
                'scoring_effect_potential' => true,
            ];
        }

        // 6. Leadership Role Specific Structural Completeness Gate
        $roleSubcategoryIds = [self::ROLE_MEMBER_ID, self::ROLE_OFFICER_ID];
        if ($isJournalismPub && in_array($subcategoryId, $roleSubcategoryIds, true)) {
            return [
                'eligible'                 => true,
                'reason'                   => 'Journalism leadership role is verified, active, and supported by evidence.',
                'component_type'           => 'LEADERSHIP_ROLE',
                'role_family'              => ($subcategoryId === self::ROLE_OFFICER_ID) ? 'officer' : 'member',
                'scoring_effect_potential' => true,
            ];
        }

        // 7. Journalism Awards & Citations Gate
        if ($isCitation) {
            $recLevel = strtolower((string) ($metadata['recognition_level'] ?? ''));
            if (! in_array($recLevel, ['local', 'national', 'international'], true)) {
                return [
                    'eligible' => false,
                    'reason'   => "Recognition level '{$recLevel}' is not recognized for Campus Journalism awards scoring.",
                    'gate'     => 'INVALID_RECOGNITION_LEVEL',
                ];
            }

            return [
                'eligible'                 => true,
                'reason'                   => 'Journalism citation is verified, active, and contains structured recognition level.',
                'component_type'           => 'JOURNALISM_CITATION',
                'recognition_level'        => $recLevel,
                'scoring_effect_potential' => true,
            ];
        }

        // 8. Seminars Supporting Record Gate (Eligible for display/audit, 0 scoring points)
        if ($isSeminar) {
            return [
                'eligible'                 => true,
                'reason'                   => 'Journalism seminar is verified as non-scoring supporting evidence.',
                'component_type'           => 'SUPPORTING_SEMINAR',
                'scoring_effect_potential' => false,
            ];
        }

        return [
            'eligible' => false,
            'reason'   => 'Record could not be resolved to an authoritative scoring component.',
            'gate'     => 'UNRESOLVED_TAXONOMY',
        ];
    }

    /**
     * Fetches all verified, score-eligible Campus Journalism records for a student.
     */
    public function getEligibleRecordsForStudent(string $studentProfileId): array
    {
        $rawRecords = $this->db->table('student_portfolio_records spr')
            ->select(['spr.*', 'pc.code AS category_code', 'ps.code AS subcategory_code'])
            ->join('portfolio_categories pc', 'pc.id = spr.category_id')
            ->join('portfolio_subcategories ps', 'ps.id = spr.subcategory_id', 'left')
            ->where('spr.student_profile_id', $studentProfileId)
            ->where('spr.status', 'verified')
            ->get()->getResultArray();

        $eligible = [];
        foreach ($rawRecords as $rec) {
            $eval = $this->evaluateRecordEligibility($rec);
            if ($eval['eligible']) {
                $rec['eligibility_assessment'] = $eval;
                $eligible[] = $rec;
            }
        }

        return $eligible;
    }

    /**
     * Determines whether a student is allowed to enter Campus Journalism scoring.
     * Evaluates: graduating AND activePortfolio AND hasVerifiedJournalismRecord AND hasVerifiedJournalismRoleOrContribution.
     * Returns structured checks and explainable failure reasons for administrators.
     */
    public function evaluateStudentEligibility(string $studentProfileId): array
    {
        $reasons = [];
        $checks = [];

        // 1. Account / Portfolio Active Check
        $student = $this->db->table('profiles')
            ->where('id', $studentProfileId)
            ->where('account_type', 'student')
            ->get()->getRowArray();

        if ($student === null) {
            return [
                'is_eligible' => false,
                'reasons'     => ['Student profile not found.'],
                'checks'      => ['account_exists' => false],
            ];
        }

        $isAccountActive = (($student['status'] ?? '') === 'active');
        $checks['active_portfolio'] = $isAccountActive;
        if (! $isAccountActive) {
            $reasons[] = 'Student account / portfolio is not active.';
        }

        // 2. Graduating Status Check
        $enrollment = $this->db->table('student_program_enrollments')
            ->where('student_profile_id', $studentProfileId)
            ->where('is_active', 1)
            ->get()->getRowArray();

        $yearLevel = strtolower(trim((string) ($enrollment['year_level'] ?? '4th Year')));
        $isGraduating = in_array($yearLevel, ['4', '4th year', 'fourth year', 'graduating', 'senior'], true);
        $checks['graduating'] = $isGraduating;
        if (! $isGraduating) {
            $reasons[] = 'Campus Journalism Award requires graduating status. Student current enrollment is not graduating.';
        }

        // 3. Verified Journalism Record Check
        $eligibleRecords = $this->getEligibleRecordsForStudent($studentProfileId);
        $hasVerifiedRecord = (count($eligibleRecords) > 0);
        $checks['has_verified_journalism_record'] = $hasVerifiedRecord;
        if (! $hasVerifiedRecord) {
            $reasons[] = 'Student has 0 verified, structurally complete Campus Journalism portfolio records.';
        }

        // 4. Verified Journalism Role or Contribution Check
        $hasRoleOrContribution = false;
        foreach ($eligibleRecords as $rec) {
            $subcat = $rec['subcategory_id'] ?? '';
            $metadata = is_string($rec['structured_metadata'] ?? null)
                ? (json_decode($rec['structured_metadata'], true) ?? [])
                : (is_array($rec['structured_metadata'] ?? null) ? $rec['structured_metadata'] : []);

            if (in_array($subcat, [self::ROLE_OFFICER_ID, self::ROLE_MEMBER_ID], true)) {
                $hasRoleOrContribution = true;
                break;
            }
            if (! empty($metadata['contribution_role']) || ! empty($metadata['role_family'])) {
                $hasRoleOrContribution = true;
                break;
            }
            if (in_array($subcat, [self::PUB_NEWS_ID, self::PUB_LITERARY_ID, self::PUB_COLUMN_ID, self::PUB_EDITORIAL_ID], true)) {
                $hasRoleOrContribution = true;
                break;
            }
        }

        $checks['has_verified_journalism_role_or_contribution'] = $hasRoleOrContribution;
        if (! $hasRoleOrContribution) {
            $reasons[] = 'Student lacks verified campus publication leadership role or journalistic authorship contribution.';
        }

        $isEligible = empty($reasons);

        return [
            'student_id'             => $studentProfileId,
            'is_eligible'            => $isEligible,
            'reasons'                => $reasons,
            'checks'                 => $checks,
            'eligible_records_count' => count($eligibleRecords),
            'diagnostics'            => [
                'student_name' => $student['full_name'] ?? 'Student',
                'year_level'   => $enrollment['year_level'] ?? 'N/A',
                'status'       => $student['status'] ?? 'unknown',
            ],
        ];
    }
}
