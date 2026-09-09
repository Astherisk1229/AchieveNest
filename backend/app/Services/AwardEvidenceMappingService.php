<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;

/**
 * AwardEvidenceMappingService
 *
 * Authoritative Evidence Mapping & Students for Evaluation Engine for AchieveNest OSAD Award Evaluation.
 * Maps student verified master-portfolio records to award-specific criteria/components based on the 9-category taxonomy
 * and structured metadata WITHOUT calculating points or potential candidate status.
 *
 * Invariant: Does not calculate points, normalized scores, rankings, or Potential Candidate status.
 */
class AwardEvidenceMappingService
{
    protected $db = null;
    protected AwardEligibilityService $eligibilityService;

    public const REASON_NOT_VERIFIED = 'RECORD_NOT_VERIFIED';
    public const REASON_CATEGORY_NOT_RELEVANT = 'PORTFOLIO_CATEGORY_NOT_RELEVANT';
    public const REASON_SUBCATEGORY_NOT_RELEVANT = 'PORTFOLIO_SUBCATEGORY_NOT_RELEVANT';
    public const REASON_REQUIRED_METADATA_MISSING = 'REQUIRED_METADATA_MISSING';
    public const REASON_METADATA_VALUE_UNSUPPORTED = 'METADATA_VALUE_NOT_SUPPORTED';
    public const REASON_DUPLICATE_SAME_SUBSECTION = 'DUPLICATE_EVIDENCE_SAME_SUBSECTION';
    public const REASON_JOURNALISM_NOT_PUBLISHED = 'JOURNALISM_NOT_PUBLISHED';
    public const REASON_JOURNALISM_TYPE_UNSUPPORTED = 'JOURNALISM_PUBLICATION_TYPE_UNSUPPORTED';
    public const REASON_SPORTS_NON_COMPETITION = 'SPORTS_NON_COMPETITION_RECORD';
    public const REASON_SOCIOCULTURAL_NON_COMPETITION = 'SOCIOCULTURAL_NON_COMPETITION_RECORD';
    public const REASON_ROLE_NOT_MET = 'ROLE_REQUIREMENT_NOT_MET';
    public const REASON_SCOPE_NOT_MET = 'SCOPE_REQUIREMENT_NOT_MET';

    public function __construct($db = null, ?AwardEligibilityService $eligibilityService = null)
    {
        if ($db !== null) {
            $this->db = $db;
        } elseif (function_exists('db_connect')) {
            $this->db = db_connect();
        }
        $this->eligibilityService = $eligibilityService ?? new AwardEligibilityService($this->db);
    }

    /**
     * Maps a student's verified master portfolio records to the selected award's criteria.
     *
     * @param array|object $award Award definition entity
     * @param array|object $student Student profile entity
     * @param array|null $records Pre-loaded portfolio records (optional)
     * @return array Complete award evidence package
     */
    public function mapStudentEvidenceForAward($award, $student, ?array $records = null): array
    {
        $awardArr = is_object($award) ? (array) $award : $award;
        $studentArr = is_object($student) ? (array) $student : $student;

        // 1. Evaluate Phase 3 Award-Level Eligibility
        $eligibility = $this->eligibilityService->evaluateStudentEligibility($awardArr, $studentArr);

        if (! $eligibility['eligible']) {
            return [
                'award_id'                       => $awardArr['id'] ?? null,
                'award_code'                     => $awardArr['code'] ?? null,
                'student_id'                     => $studentArr['id'] ?? null,
                'student_name'                   => $studentArr['full_name'] ?? $studentArr['student_name'] ?? '',
                'phase3_eligibility'             => $eligibility,
                'is_award_level_eligible'        => false,
                'has_relevant_verified_evidence' => false,
                'relevant_verified_record_count' => 0,
                'matched_criterion_count'        => 0,
                'criteria'                       => [],
                'excluded_records'               => [],
                'mapping_summary'                => 'Student is ineligible at award-level gates (Phase 3).',
            ];
        }

        $studentId = $studentArr['id'] ?? '';
        if ($records === null && $this->db !== null) {
            if (method_exists($this->db, 'table')) {
                $records = $this->db->table('student_portfolio_records')
                    ->where('student_profile_id', $studentId)
                    ->get()->getResultArray();
            } elseif ($this->db instanceof \mysqli) {
                $eStd = $this->db->real_escape_string($studentId);
                $res = $this->db->query("SELECT * FROM student_portfolio_records WHERE student_profile_id = '{$eStd}'");
                $records = [];
                if ($res) {
                    while ($r = $res->fetch_assoc()) {
                        $records[] = $r;
                    }
                }
            } else {
                $records = [];
            }
        } elseif ($records === null) {
            $records = [];
        }

        // 3. Load Computable Criteria for the Award
        $awardId = $awardArr['id'];
        $criteria = $this->loadComputableCriteriaForAward($awardId, $awardArr);

        $awardCode = strtoupper(trim((string) ($awardArr['code'] ?? '')));
        $relevantRecords = [];
        $excludedRecords = [];
        $seenSubsectionKeys = [];
        $matchedCriterionIds = [];

        foreach ($records as $rec) {
            $recId = $rec['id'] ?? '';
            $status = strtolower(trim((string) ($rec['status'] ?? '')));

            // Hard Verification Gate: Only 'verified' records enter award mapping
            if ($status !== 'verified') {
                $excludedRecords[] = [
                    'record_id' => $recId,
                    'title'     => $rec['title'] ?? '',
                    'reason'    => self::REASON_NOT_VERIFIED,
                    'message'   => "Record status [{$status}] is not verified.",
                ];
                continue;
            }

            // Evaluate relevance against the award
            $eval = $this->evaluateRecordRelevanceForAward($awardCode, $rec, $criteria);

            if ($eval['relevant']) {
                $matchedCritId = $eval['matched_criterion_id'];
                $matchedCompId = $eval['matched_component_id'] ?? null;
                $subsectionKey = "{$matchedCritId}:{$matchedCompId}:" . ($rec['source_record_id'] ?? $rec['title'] ?? $recId);

                // Check duplicate within same scoring subsection boundary
                if (isset($seenSubsectionKeys[$subsectionKey])) {
                    $excludedRecords[] = [
                        'record_id' => $recId,
                        'title'     => $rec['title'] ?? '',
                        'reason'    => self::REASON_DUPLICATE_SAME_SUBSECTION,
                        'message'   => 'Duplicate evidence for the same activity/result within the same scoring subsection.',
                    ];
                    continue;
                }

                $seenSubsectionKeys[$subsectionKey] = true;
                if (isset($eval['matched_criteria']) && is_array($eval['matched_criteria'])) {
                    foreach ($eval['matched_criteria'] as $mc) {
                        $relevantRecords[] = [
                            'record_id'             => $recId,
                            'title'                 => $rec['title'] ?? '',
                            'category_code'         => $eval['category_code'],
                            'subcategory_code'      => $eval['subcategory_code'],
                            'matched_criterion_id'  => $mc['criterion_id'],
                            'matched_component_id'  => $mc['component_id'],
                            'mapping_rule'          => $mc['mapping_rule'],
                            'structured_metadata'   => $eval['metadata'],
                            'verification_status'   => 'verified',
                        ];
                        $matchedCriterionIds[$mc['criterion_id']] = true;
                    }
                } else {
                    $matchedCritId = $eval['matched_criterion_id'] ?? ($criteria[0]['id'] ?? 'CRIT_DEFAULT');
                    $matchedCompId = $eval['matched_component_id'] ?? 'COMP_DEFAULT';
                    $matchedCriterionIds[$matchedCritId] = true;

                    $relevantRecords[] = [
                        'record_id'             => $recId,
                        'title'                 => $rec['title'] ?? '',
                        'category_code'         => $eval['category_code'],
                        'subcategory_code'      => $eval['subcategory_code'],
                        'matched_criterion_id'  => $matchedCritId,
                        'matched_component_id'  => $matchedCompId,
                        'mapping_rule'          => $eval['mapping_rule'],
                        'structured_metadata'   => $eval['metadata'],
                        'verification_status'   => 'verified',
                    ];
                }
            } else {
                $excludedRecords[] = [
                    'record_id' => $recId,
                    'title'     => $rec['title'] ?? '',
                    'reason'    => $eval['reason'] ?? self::REASON_CATEGORY_NOT_RELEVANT,
                    'message'   => $eval['message'] ?? 'Record is not relevant to this award rubric.',
                ];
            }
        }

        // Group relevant records by criteria and components
        $groupedCriteria = $this->groupEvidenceIntoCriteria($criteria, $relevantRecords);
        $hasRelevantEvidence = ! empty($relevantRecords);

        return [
            'award_id'                       => $awardId,
            'award_code'                     => $awardCode,
            'student_id'                     => $studentId,
            'student_name'                   => $studentArr['full_name'] ?? $studentArr['student_name'] ?? '',
            'phase3_eligibility'             => $eligibility,
            'is_award_level_eligible'        => true,
            'has_relevant_verified_evidence' => $hasRelevantEvidence,
            'relevant_verified_record_count' => count($relevantRecords),
            'matched_criterion_count'        => count($matchedCriterionIds),
            'criteria'                       => $groupedCriteria,
            'excluded_records'               => $excludedRecords,
            'mapping_summary'                => $hasRelevantEvidence
                ? "Found " . count($relevantRecords) . " relevant verified records across " . count($matchedCriterionIds) . " criteria."
                : "Student is eligible but has 0 relevant verified portfolio records for this award.",
        ];
    }

    /**
     * Evaluates a single record's relevance against an award's computable criteria.
     */
    public function evaluateRecordRelevanceForAward(string $awardCode, array $rec, array $criteria): array
    {
        $catCode = strtoupper(trim((string) ($rec['category_code'] ?? $rec['category'] ?? '')));
        $subCode = strtoupper(trim((string) ($rec['subcategory_code'] ?? $rec['subcategory'] ?? '')));
        $meta = is_string($rec['structured_metadata'] ?? null)
            ? json_decode($rec['structured_metadata'], true) ?? []
            : ($rec['structured_metadata'] ?? []);

        // 1. Campus Journalism Award
        if ($awardCode === 'CAMPUS_JOURNALISM_AWARD') {
            if ($catCode === 'CAMPUS_JOURNALISM') {
                $pubType = strtolower((string) ($meta['publication_type'] ?? 'news'));
                $matchedComp = match ($pubType) {
                    'news', 'news item' => 'COMP_JOURN_NEWS',
                    'literary', 'literary piece' => 'COMP_JOURN_LITERARY',
                    'column', 'opinion' => 'COMP_JOURN_COLUMN',
                    'editorial' => 'COMP_JOURN_EDITORIAL',
                    default => 'COMP_JOURN_NEWS',
                };
                $matchedCrit = $this->findCriterionByCode($criteria, ['PUB', 'PUBLICATION', 'QUALITY']);
                return [
                    'relevant'             => true,
                    'category_code'        => 'CAMPUS_JOURNALISM',
                    'subcategory_code'     => $subCode,
                    'matched_criterion_id' => $matchedCrit['id'] ?? 'crit-journ-pub',
                    'matched_component_id' => $matchedComp,
                    'mapping_rule'         => 'RULE_JOURNALISM_PUBLICATION',
                    'metadata'             => $meta,
                ];
            }

            if ($catCode === 'LEADERSHIP_POSITION' && (str_contains($subCode, 'JOURN') || str_contains(strtolower($rec['title'] ?? ''), 'editor') || str_contains(strtolower($rec['title'] ?? ''), 'writer') || str_contains(strtolower($rec['title'] ?? ''), 'journalist') || str_contains(strtolower($rec['title'] ?? ''), 'managing'))) {
                $matchedCrit = $this->findCriterionByCode($criteria, ['LEADERSHIP', 'LEAD']);
                return [
                    'relevant'             => true,
                    'category_code'        => 'LEADERSHIP_POSITION',
                    'subcategory_code'     => $subCode,
                    'matched_criterion_id' => $matchedCrit['id'] ?? 'crit-journ-lead',
                    'matched_component_id' => 'COMP_JOURN_LEAD_ROLE',
                    'mapping_rule'         => 'RULE_JOURNALISM_LEADERSHIP',
                    'metadata'             => $meta,
                ];
            }

            if ($catCode === 'CITATION_RECOGNITION' && (str_contains($subCode, 'JOURN') || str_contains(strtolower($rec['title'] ?? ''), 'journalism') || str_contains(strtolower($rec['title'] ?? ''), 'press') || str_contains(strtolower($rec['title'] ?? ''), 'editorial') || str_contains(strtolower($rec['title'] ?? ''), 'writer'))) {
                $matchedCrit = $this->findCriterionByCode($criteria, ['LEADERSHIP', 'LEAD', 'AWARDS']);
                return [
                    'relevant'             => true,
                    'category_code'        => 'CITATION_RECOGNITION',
                    'subcategory_code'     => $subCode,
                    'matched_criterion_id' => $matchedCrit['id'] ?? 'crit-journ-lead',
                    'matched_component_id' => 'COMP_JOURN_LEAD_AWARDS',
                    'mapping_rule'         => 'RULE_JOURNALISM_AWARDS',
                    'metadata'             => $meta,
                ];
            }

            if ($catCode === 'SEMINAR_TRAINING' && (str_contains($subCode, 'JOURN') || str_contains(strtolower($rec['title'] ?? ''), 'journalism') || str_contains(strtolower($rec['title'] ?? ''), 'press'))) {
                return [
                    'relevant' => false,
                    'reason'   => self::REASON_JOURNALISM_SEMINAR_ZERO,
                    'message'  => 'Campus Journalism seminars/trainings earn 0 points in the authoritative rubric.',
                ];
            }

            return ['relevant' => false, 'reason' => self::REASON_CATEGORY_NOT_RELEVANT, 'message' => 'Record is not relevant to Campus Journalism.'];
        }

        // 2. Sports Family Awards (Sports Performance F/M, Athlete of the Year F/M)
        if (str_contains($awardCode, 'SPORTS') || str_contains($awardCode, 'ATHLETE')) {
            if ($catCode === 'SPORTS' || str_contains($subCode, 'SPORT') || str_contains($subCode, 'ATHLET')) {
                $placement = $meta['placement'] ?? $meta['result'] ?? null;
                $compType = $meta['competition_type'] ?? null;
                $eventLevel = $meta['event_level'] ?? null;

                $matches = [];
                if ($compType !== null || (! $placement && ! $eventLevel)) {
                    $matchedCrit = $this->findCriterionByCode($criteria, ['SKILL', 'SKILLS']);
                    $matches[] = [
                        'criterion_id' => $matchedCrit['id'] ?? 'crit-sports-skills',
                        'component_id' => 'COMP_SPORTS_SKILLS',
                        'mapping_rule' => 'RULE_SPORTS_SKILLS',
                    ];
                }
                if ($eventLevel !== null) {
                    $matchedCrit = $this->findCriterionByCode($criteria, ['MEETS', 'PARTICIPATION', 'MEET']);
                    $matches[] = [
                        'criterion_id' => $matchedCrit['id'] ?? 'crit-sports-meets',
                        'component_id' => 'COMP_SPORTS_PARTICIPATION',
                        'mapping_rule' => 'RULE_SPORTS_PARTICIPATION',
                    ];
                }
                if ($placement !== null) {
                    $matchedCrit = $this->findCriterionByCode($criteria, ['AWARDS', 'PLACEMENT', 'AWARD']);
                    $matches[] = [
                        'criterion_id' => $matchedCrit['id'] ?? 'crit-sports-awards',
                        'component_id' => 'COMP_SPORTS_AWARDS',
                        'mapping_rule' => 'RULE_SPORTS_AWARDS',
                    ];
                }

                return [
                    'relevant'             => true,
                    'category_code'        => 'SPORTS',
                    'subcategory_code'     => $subCode,
                    'matched_criteria'     => $matches,
                    'matched_criterion_id' => $matches[0]['criterion_id'] ?? 'crit-sports',
                    'matched_component_id' => $matches[0]['component_id'] ?? 'COMP_SPORTS',
                    'mapping_rule'         => $matches[0]['mapping_rule'] ?? 'RULE_SPORTS',
                    'metadata'             => $meta,
                ];
            }
            return ['relevant' => false, 'reason' => self::REASON_CATEGORY_NOT_RELEVANT, 'message' => 'Record is not relevant to Sports Awards.'];
        }

        // 3. Socio-Cultural / Performer Family Awards
        if (str_contains($awardCode, 'SOCIO') || str_contains($awardCode, 'PERFORMER')) {
            if ($catCode === 'SOCIO_CULTURAL_PERFORMING_ARTS' || str_contains($subCode, 'SOCIO') || str_contains($subCode, 'PERFORM') || str_contains($subCode, 'CULTUR')) {
                $activityType = strtolower((string) ($meta['activity_type'] ?? 'performance'));
                if ($activityType === 'workshop' || $activityType === 'training') {
                    return [
                        'relevant' => false,
                        'reason'   => self::REASON_SOCIOCULTURAL_NON_COMPETITION,
                        'message'  => 'Cultural workshops and masterclasses belong to Seminar/Training, not performance evidence.',
                    ];
                }

                $placement = $meta['placement'] ?? $meta['result'] ?? null;
                $perfType = $meta['performance_type'] ?? null;
                $eventLevel = $meta['event_level'] ?? null;

                $matches = [];
                if ($perfType !== null || (! $placement && ! $eventLevel)) {
                    $matchedCrit = $this->findCriterionByCode($criteria, ['SKILL', 'SKILLS']);
                    $matches[] = [
                        'criterion_id' => $matchedCrit['id'] ?? 'crit-socio-skills',
                        'component_id' => 'COMP_SOCIO_SKILLS',
                        'mapping_rule' => 'RULE_SOCIOCULTURAL_SKILLS',
                    ];
                }
                if ($eventLevel !== null) {
                    $matchedCrit = $this->findCriterionByCode($criteria, ['MEETS', 'PARTICIPATION', 'SHOWCASES']);
                    $matches[] = [
                        'criterion_id' => $matchedCrit['id'] ?? 'crit-socio-meets',
                        'component_id' => 'COMP_SOCIO_PARTICIPATION',
                        'mapping_rule' => 'RULE_SOCIOCULTURAL_PARTICIPATION',
                    ];
                }
                if ($placement !== null) {
                    $matchedCrit = $this->findCriterionByCode($criteria, ['AWARDS', 'PLACEMENT', 'AWARD']);
                    $matches[] = [
                        'criterion_id' => $matchedCrit['id'] ?? 'crit-socio-awards',
                        'component_id' => 'COMP_SOCIO_AWARDS',
                        'mapping_rule' => 'RULE_SOCIOCULTURAL_AWARDS',
                    ];
                }

                return [
                    'relevant'             => true,
                    'category_code'        => 'SOCIO_CULTURAL_PERFORMING_ARTS',
                    'subcategory_code'     => $subCode,
                    'matched_criteria'     => $matches,
                    'matched_criterion_id' => $matches[0]['criterion_id'] ?? 'crit-socio',
                    'matched_component_id' => $matches[0]['component_id'] ?? 'COMP_SOCIO',
                    'mapping_rule'         => $matches[0]['mapping_rule'] ?? 'RULE_SOCIO',
                    'metadata'             => $meta,
                ];
            }
            return ['relevant' => false, 'reason' => self::REASON_CATEGORY_NOT_RELEVANT, 'message' => 'Record is not relevant to Socio-Cultural Awards.'];
        }

        // 4. Leadership / Institutional Awards (Notre Dame, SMC, Leadership Award, Student Leader, Member, Volunteer)
        if ($catCode === 'LEADERSHIP_POSITION') {
            $matchedCrit = $this->findCriterionByCode($criteria, ['CAMPUS_LEAD', 'LEADERSHIP', 'LEAD', 'GOVERNANCE']);
            return [
                'relevant'             => true,
                'category_code'        => 'LEADERSHIP_POSITION',
                'subcategory_code'     => $subCode,
                'matched_criterion_id' => $matchedCrit['id'] ?? 'crit-lead',
                'matched_component_id' => $subCode,
                'mapping_rule'         => 'RULE_LEADERSHIP_INVOLVEMENT',
                'metadata'             => $meta,
            ];
        }

        if ($catCode === 'CHURCH_MINISTRY_INVOLVEMENT') {
            $matchedCrit = $this->findCriterionByCode($criteria, ['CHURCH', 'COMMUNITY', 'SERVICE', 'VOLUNTEER', 'VOL_DIRECT']);
            return [
                'relevant'             => true,
                'category_code'        => 'CHURCH_MINISTRY_INVOLVEMENT',
                'subcategory_code'     => $subCode,
                'matched_criterion_id' => $matchedCrit['id'] ?? 'crit-church',
                'matched_component_id' => $subCode,
                'mapping_rule'         => 'RULE_CHURCH_MINISTRY_INVOLVEMENT',
                'metadata'             => $meta,
            ];
        }

        if ($catCode === 'COMMUNITY_SERVICE_VOLUNTEERISM') {
            if ($awardCode === 'LEADERSHIP_AWARD' && (str_contains($subCode, 'CIVIC') || isset($meta['civic_level']))) {
                $matchedCrit = $this->findCriterionByCode($criteria, ['CAMPUS_LEAD', 'LEADERSHIP', 'LEAD']);
            } else {
                $matchedCrit = $this->findCriterionByCode($criteria, ['COMMUNITY', 'SERVICE', 'VOLUNTEER', 'VOL_DIRECT']);
            }
            return [
                'relevant'             => true,
                'category_code'        => 'COMMUNITY_SERVICE_VOLUNTEERISM',
                'subcategory_code'     => $subCode,
                'matched_criterion_id' => $matchedCrit['id'] ?? 'crit-service',
                'matched_component_id' => $subCode,
                'mapping_rule'         => 'RULE_COMMUNITY_SERVICE',
                'metadata'             => $meta,
            ];
        }

        if ($catCode === 'ORG_MEMBERSHIP_PARTICIPATION' && ($awardCode === 'MEMBER_OF_THE_YEAR' || str_contains($awardCode, 'MEMBER'))) {
            $contributionType = $meta['contribution_type'] ?? null;
            if ($contributionType !== null) {
                $matchedCrit = $this->findCriterionByCode($criteria, ['CONTRIBUTION', 'IMPORTANT']);
            } else {
                $matchedCrit = $this->findCriterionByCode($criteria, ['MEMBERSHIP', 'INVOLVEMENT', 'PARTICIPATION', 'QUALITY']);
            }
            return [
                'relevant'             => true,
                'category_code'        => 'ORG_MEMBERSHIP_PARTICIPATION',
                'subcategory_code'     => $subCode,
                'matched_criterion_id' => $matchedCrit['id'] ?? 'crit-member',
                'matched_component_id' => $subCode,
                'mapping_rule'         => 'RULE_ORGANIZATION_MEMBERSHIP',
                'metadata'             => $meta,
            ];
        }

        if ($catCode === 'CITATION_RECOGNITION') {
            if (str_contains($subCode, 'LEADER') || str_contains(strtolower($meta['citation_type'] ?? ''), 'leader')) {
                $matchedCrit = $this->findCriterionByCode($criteria, ['LEADERSHIP', 'LEAD']);
                $componentId = 'LEADERSHIP_CITATION';
                $ruleName = 'RULE_LEADERSHIP_CITATION';
            } elseif ($awardCode === 'VOLUNTEER_OF_THE_YEAR') {
                $matchedCrit = $this->findCriterionByCode($criteria, ['VOLUNTEER', 'VOL_DIRECT', 'CITATION']);
                $componentId = 'VOLUNTEER_CITATION';
                $ruleName = 'RULE_VOLUNTEER_CITATION';
            } else {
                $matchedCrit = $this->findCriterionByCode($criteria, ['CITATION', 'CITATIONS', 'RECOGNITION', 'AWARDS']);
                $componentId = 'NON_ACADEMIC_CITATION';
                $ruleName = 'RULE_NON_ACADEMIC_CITATION';
            }

            if ($matchedCrit !== null) {
                return [
                    'relevant'             => true,
                    'category_code'        => 'CITATION_RECOGNITION',
                    'subcategory_code'     => $subCode,
                    'matched_criterion_id' => $matchedCrit['id'],
                    'matched_component_id' => $componentId,
                    'mapping_rule'         => $ruleName,
                    'metadata'             => $meta,
                ];
            }
        }

        if ($catCode === 'SEMINAR_TRAINING' && (str_contains($subCode, 'LEADER') || str_contains(strtolower($rec['title'] ?? ''), 'leadership'))) {
            $matchedCrit = $this->findCriterionByCode($criteria, ['LEADERSHIP', 'LEAD']);
            if ($matchedCrit !== null && $awardCode !== 'CAMPUS_JOURNALISM_AWARD') {
                return [
                    'relevant'             => true,
                    'category_code'        => 'SEMINAR_TRAINING',
                    'subcategory_code'     => 'LEADERSHIP_DEVELOPMENT',
                    'matched_criterion_id' => $matchedCrit['id'],
                    'matched_component_id' => 'LEADERSHIP_SEMINAR',
                    'mapping_rule'         => 'RULE_LEADERSHIP_SEMINAR',
                    'metadata'             => $meta,
                ];
            }
        }

        return [
            'relevant' => false,
            'reason'   => self::REASON_CATEGORY_NOT_RELEVANT,
            'message'  => "Category [{$catCode}] is not relevant to award [{$awardCode}].",
        ];
    }

    /**
     * Lists all students who qualify for the "Students for Evaluation" queue.
     * Rule: Phase 3 Eligible AND Has at least one relevant verified mapped portfolio record.
     */
    public function getStudentsForEvaluation(string $awardId): array
    {
        if ($this->db === null) {
            return [];
        }

        $award = null;
        $students = [];

        if (method_exists($this->db, 'table')) {
            $award = $this->db->table('award_definitions')->where('id', $awardId)->get()->getRowArray();
            if ($award === null || $award['status'] !== 'active') {
                return [];
            }
            $students = $this->db->table('profiles')
                ->where('account_type', 'student')
                ->where('status', 'active')
                ->orderBy('full_name', 'ASC')
                ->get()->getResultArray();
        } elseif ($this->db instanceof \mysqli) {
            $eAward = $this->db->real_escape_string($awardId);
            $aRes = $this->db->query("SELECT * FROM award_definitions WHERE id = '{$eAward}' AND status = 'active' LIMIT 1");
            if ($aRes && $row = $aRes->fetch_assoc()) {
                $award = $row;
            }
            if ($award === null) {
                return [];
            }
            $sRes = $this->db->query("SELECT * FROM profiles WHERE account_type = 'student' AND status = 'active' ORDER BY full_name ASC");
            if ($sRes) {
                while ($sRow = $sRes->fetch_assoc()) {
                    $students[] = $sRow;
                }
            }
        }

        $studentsForEvaluation = [];

        foreach ($students as $std) {
            $package = $this->mapStudentEvidenceForAward($award, $std);

            if ($package['is_award_level_eligible'] && $package['has_relevant_verified_evidence']) {
                $studentsForEvaluation[] = [
                    'student_id'                     => $std['id'],
                    'student_name'                   => $std['full_name'],
                    'student_id_number'              => $std['student_id'] ?? '',
                    'program'                        => $std['program'] ?? '',
                    'college'                        => $std['college'] ?? '',
                    'award_id'                       => $award['id'],
                    'award_code'                     => $award['code'],
                    'award_name'                     => $award['name'],
                    'award_level_eligible'           => true,
                    'has_relevant_verified_evidence' => true,
                    'relevant_verified_record_count' => $package['relevant_verified_record_count'],
                    'matched_criterion_count'        => $package['matched_criterion_count'],
                    'evaluation_status'              => 'NOT_REVIEWED',
                ];
            }
        }

        return $studentsForEvaluation;
    }

    /**
     * Helper to load computable criteria for an award.
     */
    protected function loadComputableCriteriaForAward(string $awardId, array $award): array
    {
        if (is_object($this->db) && method_exists($this->db, 'table')) {
            return $this->db->table('award_criteria')
                ->where('award_definition_id', $awardId)
                ->where('is_portfolio_computable', 1)
                ->orderBy('sort_order', 'ASC')
                ->get()->getResultArray();
        }

        if ($this->db instanceof \mysqli) {
            $escapedId = $this->db->real_escape_string($awardId);
            $res = $this->db->query("SELECT * FROM award_criteria WHERE award_definition_id = '{$escapedId}' AND is_portfolio_computable = 1 ORDER BY sort_order ASC");
            $critList = [];
            if ($res) {
                while ($row = $res->fetch_assoc()) {
                    $critList[] = $row;
                }
            }
            if (! empty($critList)) {
                return $critList;
            }
        }

        return (array) ($award['criteria'] ?? []);
    }

    /**
     * Helper to find criterion matching any of candidate codes.
     */
    protected function findCriterionByCode(array $criteria, array $candidateCodes): ?array
    {
        foreach ($criteria as $crit) {
            $code = strtoupper(trim((string) ($crit['code'] ?? '')));
            foreach ($candidateCodes as $cand) {
                if (str_contains($code, strtoupper($cand))) {
                    return $crit;
                }
            }
        }
        return ! empty($criteria) ? $criteria[0] : null;
    }

    /**
     * Groups relevant records into criteria and component hierarchy.
     */
    protected function groupEvidenceIntoCriteria(array $criteria, array $records): array
    {
        $grouped = [];
        $recordsByCrit = [];

        foreach ($records as $r) {
            $recordsByCrit[$r['matched_criterion_id']][] = $r;
        }

        foreach ($criteria as $crit) {
            $critId = $crit['id'];
            $critRecords = $recordsByCrit[$critId] ?? [];

            $grouped[] = [
                'criterion_id'           => $critId,
                'criterion_code'         => $crit['code'] ?? '',
                'criterion_name'         => $crit['name'] ?? '',
                'max_points'             => (float) ($crit['max_points'] ?? 0),
                'is_computable'          => true,
                'relevant_evidence_count'=> count($critRecords),
                'evidence'               => $critRecords,
            ];
        }

        return $grouped;
    }
}
