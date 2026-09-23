<?php

namespace App\Services;

use Config\Database;

/**
 * Class PartTimeFacultyTitleService
 *
 * Server-authoritative service governing Part-Time Faculty Titles and Qualification Mappings.
 * Plan E — Phase E3.
 *
 * Strict Non-Progression Principle:
 * Part-Time Faculty receive qualification-based titles but are not considered for Full-Time ranking or promotion.
 */
class PartTimeFacultyTitleService
{
    protected $db;

    public function __construct()
    {
        $this->db = Database::connect();
    }

    /**
     * Retrieves all active Part-Time Faculty Titles.
     *
     * @return array
     */
    public function getAllTitles(): array
    {
        $rows = $this->db->table('faculty_rank_catalog')
            ->where('catalog_type', 'part_time_faculty_title')
            ->where('is_active', 1)
            ->orderBy('display_order', 'ASC')
            ->get()
            ->getResultArray();

        return array_map(function ($row) {
            return [
                'id' => (int)$row['id'],
                'title_code' => $row['rank_code'],
                'display_label' => $row['display_label'],
                'catalog_type' => $row['catalog_type'],
                'qualification_tier_code' => $row['qualification_tier_code'],
                'qualification_source_label' => $row['qualification_source_label'],
                'display_order' => (int)$row['display_order'],
                'source_document_id' => $row['source_document_id'],
                'source_row_id' => $row['source_row_id'],
                'seed_version' => $row['seed_version'],
            ];
        }, $rows);
    }

    /**
     * Retrieves a single Part-Time title by code.
     *
     * @param string $code
     * @return array|null
     */
    public function getTitleByCode(string $code): ?array
    {
        $row = $this->db->table('faculty_rank_catalog')
            ->where('catalog_type', 'part_time_faculty_title')
            ->where('rank_code', $code)
            ->where('is_active', 1)
            ->get()
            ->getRowArray();

        if (!$row) {
            return null;
        }

        return [
            'id' => (int)$row['id'],
            'title_code' => $row['rank_code'],
            'display_label' => $row['display_label'],
            'catalog_type' => $row['catalog_type'],
            'qualification_tier_code' => $row['qualification_tier_code'],
            'qualification_source_label' => $row['qualification_source_label'],
            'display_order' => (int)$row['display_order'],
            'source_document_id' => $row['source_document_id'],
            'source_row_id' => $row['source_row_id'],
            'seed_version' => $row['seed_version'],
        ];
    }

    /**
     * Checks whether a given code is a valid Part-Time title.
     *
     * @param string $code
     * @return bool
     */
    public function isPartTimeTitle(string $code): bool
    {
        return $this->getTitleByCode($code) !== null;
    }

    /**
     * Resolves the canonical Part-Time Faculty Title from verified qualification context.
     *
     * @param array $qualificationContext
     * @return array
     */
    public function resolveTitleFromQualification(array $qualificationContext): array
    {
        // 1. Boundary check: Personnel Group
        $group = $qualificationContext['personnel_group'] ?? 'faculty';
        if ($group !== 'faculty') {
            return [
                'resolved_title' => null,
                'status' => 'INELIGIBLE',
                'reason_code' => 'unsupported_personnel_group',
                'message' => 'Non-Teaching personnel cannot receive Part-Time Faculty titles.',
            ];
        }

        // 2. Boundary check: Faculty Engagement
        $engagement = $qualificationContext['faculty_engagement'] ?? 'part_time_faculty';
        if ($engagement === 'full_time_faculty') {
            return [
                'resolved_title' => null,
                'status' => 'INELIGIBLE',
                'reason_code' => 'not_part_time_faculty',
                'message' => 'Full-time faculty receive Academic Ranks, not Part-Time faculty titles.',
            ];
        }

        // 3. Check qualification verification state
        $isVerified = !empty($qualificationContext['is_verified']) || !empty($qualificationContext['verified']);
        $qualString = trim($qualificationContext['qualification'] ?? $qualificationContext['degree_title'] ?? $qualificationContext['highest_degree'] ?? '');

        if (!$isVerified || $qualString === '') {
            return [
                'resolved_title' => null,
                'status' => 'UNRESOLVED',
                'reason_code' => 'qualification_not_verified',
                'message' => 'Title assignment requires authoritative verified qualification records.',
            ];
        }

        // 4. Map normalized qualification
        $norm = strtoupper($qualString);

        // Doctoral Tier: Ph.D./Ed.D.
        if (preg_match('/\b(PH\.?D|ED\.?D|DOCTOR OF PHILOSOPHY|DOCTOR OF EDUCATION|DOCTORATE)\b/i', $norm)) {
            $title = $this->getTitleByCode('PT_PROFESSORIAL_LECTURER');
            return [
                'resolved_title' => $title,
                'status' => 'RESOLVED',
                'reason_code' => 'resolved_doctoral',
                'qualification_group' => 'doctoral',
                'source_reference' => 'NDMU-DOC-ACAD-RANKS-2026-V1/P2-DOCTORAL',
                'message' => 'Resolved to Professorial Lecturer based on verified doctoral degree.',
            ];
        }

        // Master's / Professional Graduate Tier: MA/MS/MAT/MD/LL.B./Priests or Equivalent
        if (preg_match('/\b(MA|MS|MAT|MD|LL\.?B|LLB|MASTER|PRIEST|DOCTOR OF MEDICINE|BACHELOR OF LAWS)\b/i', $norm)) {
            $title = $this->getTitleByCode('PT_ASSISTANT_PROFESSORIAL_LECTURER');
            return [
                'resolved_title' => $title,
                'status' => 'RESOLVED',
                'reason_code' => 'resolved_masters_professional',
                'qualification_group' => 'masters',
                'source_reference' => 'NDMU-DOC-ACAD-RANKS-2026-V1/P2-MASTERS',
                'message' => 'Resolved to Assistant Professorial Lecturer based on verified master\'s or professional degree.',
            ];
        }

        // Professional Licensure Tier: CPA/ENGR./MEDTECH/CHEMIST/NURSE/DVM/ARCHITECT/DMD
        if (preg_match('/\b(CPA|ENGR|ENGINEER|MEDTECH|CHEMIST|NURSE|DVM|ARCHITECT|DMD|DDM|BOARD PASSER|LICENSED)\b/i', $norm)) {
            $title = $this->getTitleByCode('PT_SENIOR_LECTURER');
            return [
                'resolved_title' => $title,
                'status' => 'RESOLVED',
                'reason_code' => 'resolved_licensed_professional',
                'qualification_group' => 'board_licensure',
                'source_reference' => 'NDMU-DOC-ACAD-RANKS-2026-V1/P2-BOARD',
                'message' => 'Resolved to Senior Lecturer based on verified professional board licensure.',
            ];
        }

        // Baccalaureate Tier: AB/BSE/BS or Equivalent
        if (preg_match('/\b(AB|BSE|BS|BACHELOR|BACCALAUREATE)\b/i', $norm)) {
            $title = $this->getTitleByCode('PT_LECTURER');
            return [
                'resolved_title' => $title,
                'status' => 'RESOLVED',
                'reason_code' => 'resolved_baccalaureate',
                'qualification_group' => 'baccalaureate',
                'source_reference' => 'NDMU-DOC-ACAD-RANKS-2026-V1/P2-BACCALAUREATE',
                'message' => 'Resolved to Lecturer based on verified baccalaureate degree.',
            ];
        }

        return [
            'resolved_title' => null,
            'status' => 'UNRESOLVED',
            'reason_code' => 'qualification_unmapped',
            'message' => "The qualification [{$qualString}] does not match any canonical Part-Time qualification tier.",
        ];
    }

    /**
     * Validates if a proposed Part-Time title assignment matches the verified qualification context.
     *
     * @param string $titleCode
     * @param array $qualificationContext
     * @return array
     */
    public function validateTitleAssignment(string $titleCode, array $qualificationContext): array
    {
        $resolution = $this->resolveTitleFromQualification($qualificationContext);

        if ($resolution['status'] !== 'RESOLVED') {
            return [
                'valid' => false,
                'reason_code' => $resolution['reason_code'],
                'message' => $resolution['message'],
            ];
        }

        $expectedCode = $resolution['resolved_title']['title_code'] ?? null;
        if ($expectedCode !== $titleCode) {
            return [
                'valid' => false,
                'reason_code' => 'title_qualification_mismatch',
                'message' => "Proposed title code [{$titleCode}] does not match the resolved qualification title [{$expectedCode}].",
                'expected_title_code' => $expectedCode,
            ];
        }

        return [
            'valid' => true,
            'title' => $resolution['resolved_title'],
            'qualification_group' => $resolution['qualification_group'],
            'source_reference' => $resolution['source_reference'],
            'message' => 'Title assignment is valid and verified against qualification standard.',
        ];
    }
}
