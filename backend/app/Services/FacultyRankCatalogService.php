<?php

namespace App\Services;

use Config\Database;

/**
 * Class FacultyRankCatalogService
 * 
 * Server-authoritative reference service for the official NDMU Academic Ranks & Titles catalogue.
 * Plan E — Phase E1 (Full-Time Faculty Rank Seed).
 */
class FacultyRankCatalogService
{
    protected $db;

    public function __construct()
    {
        $this->db = Database::connect();
    }

    /**
     * Retrieves all active Full-Time Academic Ranks, optionally filtered by tier code.
     *
     * @param string|null $tierCode
     * @return array
     */
    public function getFullTimeFacultyRanks(?string $tierCode = null): array
    {
        $builder = $this->db->table('faculty_rank_catalog')
            ->where('catalog_type', 'full_time_academic_rank')
            ->where('is_active', 1)
            ->orderBy('display_order', 'ASC');

        if ($tierCode) {
            $builder->where('qualification_tier_code', $tierCode);
        }

        $rows = $builder->get()->getResultArray();

        return array_map(function ($row) {
            return [
                'id' => (int)$row['id'],
                'rank_code' => $row['rank_code'],
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
     * Retrieves a single rank by its unique stable code and catalog type.
     *
     * @param string $rankCode
     * @param string $catalogType
     * @return array|null
     */
    public function getRankByCode(string $rankCode, string $catalogType = 'full_time_academic_rank'): ?array
    {
        $row = $this->db->table('faculty_rank_catalog')
            ->where('catalog_type', $catalogType)
            ->where('rank_code', $rankCode)
            ->where('is_active', 1)
            ->get()
            ->getRowArray();

        if (!$row) {
            return null;
        }

        return [
            'id' => (int)$row['id'],
            'rank_code' => $row['rank_code'],
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
     * Retrieves a single rank by its exact display label.
     *
     * @param string $label
     * @param string $catalogType
     * @return array|null
     */
    public function getRankByLabel(string $label, string $catalogType = 'full_time_academic_rank'): ?array
    {
        $row = $this->db->table('faculty_rank_catalog')
            ->where('catalog_type', $catalogType)
            ->where('display_label', $label)
            ->where('is_active', 1)
            ->get()
            ->getRowArray();

        if (!$row) {
            return null;
        }

        return [
            'id' => (int)$row['id'],
            'rank_code' => $row['rank_code'],
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
     * Returns the full structured tier hierarchy for read-only presentation.
     *
     * @return array
     */
    public function getRankHierarchy(): array
    {
        $allRanks = $this->getFullTimeFacultyRanks();

        $tiers = [
            'doctoral' => [
                'tier_code' => 'doctoral',
                'tier_label' => 'Doctoral Degree Tier',
                'qualification_source_label' => 'Ph.D./Ed.D.',
                'ranks' => [],
            ],
            'masters' => [
                'tier_code' => 'masters',
                'tier_label' => "Master's / Professional / Religious Tier",
                'qualification_source_label' => 'MA/MS/MAT/MD/LL.B./Priests or Equivalent',
                'ranks' => [],
            ],
            'board_licensure' => [
                'tier_code' => 'board_licensure',
                'tier_label' => 'Professional Board Licensure Tier',
                'qualification_source_label' => 'CPA/ENGR./MEDTECH/CHEMIST/NURSE/DVM/SOCIAL WORKER/ARCHITECT/DMD',
                'ranks' => [],
            ],
            'baccalaureate' => [
                'tier_code' => 'baccalaureate',
                'tier_label' => 'Baccalaureate Baseline Tier',
                'qualification_source_label' => 'AB/BSE/BS or Equivalent',
                'ranks' => [],
            ],
        ];

        foreach ($allRanks as $rank) {
            $tierCode = $rank['qualification_tier_code'];
            if (isset($tiers[$tierCode])) {
                $tiers[$tierCode]['ranks'][] = $rank;
            }
        }

        return [
            'source_document_id' => 'NDMU-DOC-ACAD-RANKS-2026-V1',
            'catalog_type' => 'full_time_academic_rank',
            'seed_version' => '2026.1',
            'total_ranks' => count($allRanks),
            'tiers' => array_values($tiers),
        ];
    }

    /**
     * Returns summary metadata and counts for diagnostics.
     *
     * @return array
     */
    public function getCatalogMetadata(): array
    {
        $allRanks = $this->getFullTimeFacultyRanks();
        $tierCounts = [
            'doctoral' => 0,
            'masters' => 0,
            'board_licensure' => 0,
            'baccalaureate' => 0,
        ];

        foreach ($allRanks as $r) {
            $t = $r['qualification_tier_code'];
            if (isset($tierCounts[$t])) {
                $tierCounts[$t]++;
            }
        }

        return [
            'source_document_id' => 'NDMU-DOC-ACAD-RANKS-2026-V1',
            'catalog_type' => 'full_time_academic_rank',
            'seed_version' => '2026.1',
            'total_active_ranks' => count($allRanks),
            'tier_breakdown' => $tierCounts,
        ];
    }
}
