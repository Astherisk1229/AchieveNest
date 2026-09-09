<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;

/**
 * AwardEligibilityService
 *
 * Authoritative Award-Level Eligibility Gate Engine for AchieveNest OSAD Award Evaluation.
 * Evaluates award eligibility gates (Active Award, Active Student Profile, Graduation Gate, Sex Gate)
 * BEFORE any award evidence is mapped or scored.
 *
 * Invariant: Does not calculate points, normalized scores, rankings, or Potential Candidate status.
 */
class AwardEligibilityService
{
    protected $db = null;

    public const REASON_AWARD_NOT_FOUND = 'AWARD_NOT_FOUND';
    public const REASON_AWARD_INACTIVE = 'AWARD_INACTIVE';
    public const REASON_STUDENT_NOT_FOUND = 'STUDENT_NOT_FOUND';
    public const REASON_STUDENT_PROFILE_INACTIVE = 'STUDENT_PROFILE_INACTIVE';
    public const REASON_GRADUATING_STATUS_MISSING = 'GRADUATING_STATUS_MISSING';
    public const REASON_GRADUATING_REQUIREMENT_NOT_MET = 'GRADUATING_REQUIREMENT_NOT_MET';
    public const REASON_SEX_VALUE_MISSING = 'SEX_VALUE_MISSING';
    public const REASON_SEX_REQUIREMENT_NOT_MET = 'SEX_REQUIREMENT_NOT_MET';
    public const REASON_INVALID_AWARD_CONFIG = 'INVALID_AWARD_ELIGIBILITY_CONFIGURATION';

    public function __construct($db = null)
    {
        if ($db !== null) {
            $this->db = $db;
        } elseif (function_exists('db_connect')) {
            $this->db = db_connect();
        }
    }

    /**
     * Normalizes a sex/gender value to uppercase 'FEMALE', 'MALE', or null.
     */
    public function normalizeSex(?string $sex): ?string
    {
        if ($sex === null) {
            return null;
        }

        $cleaned = strtoupper(trim($sex));
        if ($cleaned === '') {
            return null;
        }

        if (in_array($cleaned, ['FEMALE', 'F', 'WOMAN'], true)) {
            return 'FEMALE';
        }

        if (in_array($cleaned, ['MALE', 'M', 'MAN'], true)) {
            return 'MALE';
        }

        return $cleaned;
    }

    /**
     * Evaluates award-level eligibility for a given student profile and award definition.
     *
     * @param array|object|null $award Award definition entity or array
     * @param array|object|null $student Student profile entity or array (with optional enrollments)
     * @return array Structured diagnostic result
     */
    public function evaluateStudentEligibility($award, $student): array
    {
        $awardArr = is_object($award) ? (array) $award : $award;
        $studentArr = is_object($student) ? (array) $student : $student;

        $checks = [
            'award_exists' => [
                'required' => true,
                'passed'   => false,
            ],
            'award_active' => [
                'required' => true,
                'passed'   => false,
            ],
            'student_profile_exists' => [
                'required' => true,
                'passed'   => false,
            ],
            'student_active' => [
                'required' => true,
                'passed'   => false,
            ],
            'graduating' => [
                'required' => false,
                'actual'   => null,
                'passed'   => false,
            ],
            'sex' => [
                'required' => false,
                'expected' => null,
                'actual'   => null,
                'passed'   => false,
            ],
        ];

        $reasons = [];

        // 1. Award Exists Check
        if (empty($awardArr) || empty($awardArr['id'])) {
            $reasons[] = [
                'code'    => self::REASON_AWARD_NOT_FOUND,
                'message' => 'Award definition was not found or is invalid.',
            ];
            return $this->buildResult(false, null, null, null, $checks, $reasons);
        }
        $checks['award_exists']['passed'] = true;

        $awardId = $awardArr['id'];
        $awardCode = $awardArr['code'] ?? '';

        // 2. Award Active Check
        $awardStatus = strtolower(trim((string) ($awardArr['status'] ?? '')));
        if ($awardStatus !== 'active') {
            $reasons[] = [
                'code'    => self::REASON_AWARD_INACTIVE,
                'message' => "Award [{$awardCode}] is not active for evaluation (status: {$awardStatus}).",
            ];
            return $this->buildResult(false, $awardId, $awardCode, null, $checks, $reasons);
        }
        $checks['award_active']['passed'] = true;

        // 3. Validate Award Configuration
        $requiresGraduating = (int) ($awardArr['graduating_only'] ?? $awardArr['requires_graduating'] ?? 0) === 1;
        $rawSexReq = $awardArr['gender_restriction'] ?? $awardArr['sex_requirement'] ?? null;
        $normSexReq = $this->normalizeSex($rawSexReq);

        if ($rawSexReq !== null && ! in_array($normSexReq, ['MALE', 'FEMALE'], true) && strtolower((string) $rawSexReq) !== 'none') {
            $reasons[] = [
                'code'    => self::REASON_INVALID_AWARD_CONFIG,
                'message' => "Award [{$awardCode}] has invalid sex requirement configuration: [{$rawSexReq}].",
            ];
            return $this->buildResult(false, $awardId, $awardCode, null, $checks, $reasons);
        }

        $checks['graduating']['required'] = $requiresGraduating;
        $checks['sex']['required'] = ($normSexReq !== null);
        $checks['sex']['expected'] = $normSexReq;

        // 4. Student Profile Exists Check
        if (empty($studentArr) || empty($studentArr['id'])) {
            $reasons[] = [
                'code'    => self::REASON_STUDENT_NOT_FOUND,
                'message' => 'Student profile record was not found.',
            ];
            return $this->buildResult(false, $awardId, $awardCode, null, $checks, $reasons);
        }
        $checks['student_profile_exists']['passed'] = true;

        $studentId = $studentArr['id'];

        // 5. Student Active Status Check
        $studentStatus = strtolower(trim((string) ($studentArr['status'] ?? 'active')));
        if ($studentStatus !== 'active') {
            $reasons[] = [
                'code'    => self::REASON_STUDENT_PROFILE_INACTIVE,
                'message' => "Student profile account is not active (status: {$studentStatus}).",
            ];
            $checks['student_active']['passed'] = false;
        } else {
            $checks['student_active']['passed'] = true;
        }

        // 6. Graduation Gate Evaluation
        $isGraduating = $this->resolveStudentGraduatingStatus($studentArr);
        $checks['graduating']['actual'] = $isGraduating;

        if ($requiresGraduating) {
            if ($isGraduating === null) {
                $checks['graduating']['passed'] = false;
                $reasons[] = [
                    'code'    => self::REASON_GRADUATING_STATUS_MISSING,
                    'message' => 'Student enrollment year-level or graduation status is missing from institutional records.',
                ];
            } elseif ($isGraduating === false) {
                $checks['graduating']['passed'] = false;
                $reasons[] = [
                    'code'    => self::REASON_GRADUATING_REQUIREMENT_NOT_MET,
                    'message' => 'This award is restricted to graduating students only.',
                ];
            } else {
                $checks['graduating']['passed'] = true;
            }
        } else {
            // Open pool (Graduating and Non-Graduating allowed)
            $checks['graduating']['passed'] = true;
        }

        // 7. Sex Gate Evaluation
        $studentSexRaw = $studentArr['gender'] ?? $studentArr['sex'] ?? $studentArr['Sex'] ?? null;
        $studentSexNorm = $this->normalizeSex($studentSexRaw);
        $checks['sex']['actual'] = $studentSexNorm;

        if ($normSexReq !== null) {
            if ($studentSexNorm === null) {
                $checks['sex']['passed'] = false;
                $reasons[] = [
                    'code'    => self::REASON_SEX_VALUE_MISSING,
                    'message' => 'Official student profile Sex is missing or invalid for a sex-specific award.',
                ];
            } elseif ($studentSexNorm !== $normSexReq) {
                $checks['sex']['passed'] = false;
                $reasons[] = [
                    'code'    => self::REASON_SEX_REQUIREMENT_NOT_MET,
                    'message' => "Official student profile Sex [{$studentSexNorm}] does not match required award variant [{$normSexReq}].",
                ];
            } else {
                $checks['sex']['passed'] = true;
            }
        } else {
            // Non-sex-gated award
            $checks['sex']['passed'] = true;
        }

        $isEligible = empty($reasons);

        return $this->buildResult($isEligible, $awardId, $awardCode, $studentId, $checks, $reasons);
    }

    /**
     * Resolves graduating status from student profile or enrollment records.
     * Returns true if 4th year/graduating/senior, false if 1st-3rd year, null if missing.
     */
    protected function resolveStudentGraduatingStatus(array $student): ?bool
    {
        // 1. Direct explicit boolean flag
        if (isset($student['is_graduating'])) {
            return (bool) $student['is_graduating'];
        }

        // 2. Year level string from student record
        $yearLevel = $student['year_level'] ?? null;

        // 3. Query enrollment table if not in profile array
        if ($yearLevel === null && ! empty($student['id']) && isset($this->db) && $this->db !== null) {
            try {
                $enrollment = $this->db->table('student_program_enrollments')
                    ->where('student_profile_id', $student['id'])
                    ->orderBy('created_at', 'DESC')
                    ->get()->getRowArray();

                if ($enrollment !== null) {
                    $yearLevel = $enrollment['year_level'] ?? null;
                }
            } catch (\Throwable) {
                // Missing optional enrollment data must resolve as unknown, not crash eligibility evaluation.
            }
        }

        if ($yearLevel === null) {
            return null;
        }

        $cleaned = strtolower(trim((string) $yearLevel));
        if ($cleaned === '') {
            return null;
        }

        $graduatingLevels = ['4', '4th', '4th year', 'fourth year', 'graduating', 'senior', 'iv', '5', '5th year'];
        $undergradLevels = ['1', '1st', '1st year', 'first year', 'freshman', 'i', '2', '2nd', '2nd year', 'second year', 'sophomore', 'ii', '3', '3rd', '3rd year', 'third year', 'junior', 'iii'];

        if (in_array($cleaned, $graduatingLevels, true)) {
            return true;
        }

        if (in_array($cleaned, $undergradLevels, true)) {
            return false;
        }

        return false;
    }

    /**
     * Evaluates award eligibility by database identifiers.
     */
    public function evaluateStudentEligibilityByIds(string $awardId, string $studentProfileId): array
    {
        $award = $this->db->table('award_definitions')
            ->where('id', $awardId)
            ->get()->getRowArray();

        $student = $this->db->table('profiles')
            ->where('id', $studentProfileId)
            ->where('account_type', 'student')
            ->get()->getRowArray();

        if ($student !== null) {
            $enrollment = $this->db->table('student_program_enrollments')
                ->where('student_profile_id', $studentProfileId)
                ->orderBy('created_at', 'DESC')
                ->get()->getRowArray();

            if ($enrollment !== null) {
                $student['year_level'] = $enrollment['year_level'] ?? $student['year_level'] ?? null;
                $student['program_id'] = $enrollment['academic_program_id'] ?? null;
            }
        }

        return $this->evaluateStudentEligibility($award, $student);
    }

    /**
     * Helper to construct uniform structured diagnostic results.
     */
    protected function buildResult(
        bool $isEligible,
        ?string $awardId,
        ?string $awardCode,
        ?string $studentId,
        array $checks,
        array $reasons
    ): array {
        return [
            'eligible'    => $isEligible,
            'award_id'    => $awardId,
            'award_code'  => $awardCode,
            'student_id'  => $studentId,
            'checks'      => $checks,
            'reasons'     => $reasons,
        ];
    }
}
