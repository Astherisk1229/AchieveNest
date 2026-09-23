<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;

/** Phase K1: generic placement/history foundation with Faculty-only compatibility mappings. */
class BridgeCreateRankPlacementDomain extends Migration
{
    use September15BridgeGuard;

public function up()
    {
        $this->assertBridgeStep(4);
        $this->db->query("CREATE TABLE IF NOT EXISTS rank_placement_groups (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            personnel_group VARCHAR(50) NOT NULL,
            catalog_type VARCHAR(50) NULL,
            qualification_tier_code VARCHAR(50) NULL,
            qualification_source_label VARCHAR(255) NULL,
            configuration_status VARCHAR(30) NOT NULL DEFAULT 'unresolved',
            unresolved_reason VARCHAR(500) NULL,
            source_document_id VARCHAR(100) NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_rank_placement_source_group (personnel_group, catalog_type, qualification_tier_code),
            INDEX idx_rank_placement_group_active (personnel_group, configuration_status, is_active),
            CONSTRAINT chk_rank_placement_personnel_group CHECK (personnel_group IN ('FACULTY','NON_TEACHING_FACULTY')),
            CONSTRAINT chk_rank_placement_configuration CHECK (configuration_status IN ('configured','unresolved'))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        $this->db->query("CREATE TABLE IF NOT EXISTS rank_placement_group_ranks (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            rank_placement_group_id BIGINT UNSIGNED NOT NULL,
            faculty_rank_catalog_id INT UNSIGNED NOT NULL,
            ladder_order INT UNSIGNED NOT NULL,
            mapping_status VARCHAR(30) NOT NULL DEFAULT 'configured',
            source_document_id VARCHAR(100) NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_rank_placement_catalog_mapping (rank_placement_group_id, faculty_rank_catalog_id),
            UNIQUE KEY uq_rank_placement_ladder_order (rank_placement_group_id, ladder_order),
            CONSTRAINT fk_rank_placement_group_rank_group FOREIGN KEY (rank_placement_group_id) REFERENCES rank_placement_groups(id),
            CONSTRAINT fk_rank_placement_group_rank_catalog FOREIGN KEY (faculty_rank_catalog_id) REFERENCES faculty_rank_catalog(id),
            CONSTRAINT chk_rank_placement_mapping_status CHECK (mapping_status IN ('configured','unresolved'))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        $this->db->query("CREATE TABLE IF NOT EXISTS personnel_rank_placements (
            id VARCHAR(36) PRIMARY KEY,
            personnel_profile_id VARCHAR(36) NOT NULL,
            rank_placement_group_id BIGINT UNSIGNED NOT NULL,
            previous_placement_id VARCHAR(36) NULL,
            effective_from DATE NOT NULL,
            effective_to DATE NULL,
            status VARCHAR(40) NOT NULL,
            hr_confirmed_at DATETIME NOT NULL,
            confirmed_by_profile_id VARCHAR(36) NOT NULL,
            supporting_credential_references JSON NULL,
            correction_of_placement_id VARCHAR(36) NULL,
            correction_type VARCHAR(30) NULL,
            correction_reason TEXT NULL,
            cancelled_at DATETIME NULL,
            cancelled_by_profile_id VARCHAR(36) NULL,
            cancellation_reason TEXT NULL,
            activation_failed_at DATETIME NULL,
            activation_failure_reason TEXT NULL,
            current_personnel_guard VARCHAR(36) GENERATED ALWAYS AS (CASE WHEN status='current' THEN personnel_profile_id ELSE NULL END) STORED,
            pending_personnel_guard VARCHAR(36) GENERATED ALWAYS AS (CASE WHEN status='pending_future' THEN personnel_profile_id ELSE NULL END) STORED,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_personnel_current_placement (current_personnel_guard),
            UNIQUE KEY uq_personnel_pending_placement (pending_personnel_guard),
            INDEX idx_personnel_placement_timeline (personnel_profile_id, effective_from, effective_to),
            CONSTRAINT fk_personnel_rank_placement_personnel FOREIGN KEY (personnel_profile_id) REFERENCES personnel_profiles(profile_id),
            CONSTRAINT fk_personnel_rank_placement_group FOREIGN KEY (rank_placement_group_id) REFERENCES rank_placement_groups(id),
            CONSTRAINT fk_personnel_rank_placement_previous FOREIGN KEY (previous_placement_id) REFERENCES personnel_rank_placements(id),
            CONSTRAINT fk_personnel_rank_placement_correction FOREIGN KEY (correction_of_placement_id) REFERENCES personnel_rank_placements(id),
            CONSTRAINT chk_personnel_rank_placement_status CHECK (status IN ('current','pending_future','historical','cancelled','corrected','activation_failed')),
            CONSTRAINT chk_personnel_rank_placement_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        $groups = [
            ['full_time_academic_rank','doctoral','Ph.D./Ed.D.','configured',null],
            ['full_time_academic_rank','masters','MA/MS/MAT/MD/LL.B./Priests or Equivalent','configured',null],
            ['full_time_academic_rank','board_licensure','CPA/ENGR./MEDTECH/CHEMIST/NURSE/DVM/SOCIAL WORKER/ARCHITECT/DMD','configured',null],
            ['full_time_academic_rank','baccalaureate','AB/BSE/BS or Equivalent','configured',null],
            ['part_time_faculty_title','doctoral','Ph.D./Ed.D.','configured',null],
            ['part_time_faculty_title','masters','MA/MS/MAT/MD/LL.B./Priests or Equivalent','configured',null],
            ['part_time_faculty_title','board_licensure','CPA/ENGR./MEDTECH/CHEMIST/NURSE/DVM/SOCIAL WORKER/ARCHITECT/DMD','unresolved','Existing part-time catalog qualification label omits SOCIAL WORKER; mapping requires reconciliation.'],
            ['part_time_faculty_title','baccalaureate','AB/BSE/BS or Equivalent','configured',null],
        ];
        foreach ($groups as [$catalogType,$tier,$label,$status,$reason]) {
            $exists=$this->db->table('rank_placement_groups')->where(['personnel_group'=>'FACULTY','catalog_type'=>$catalogType,'qualification_tier_code'=>$tier])->get()->getRowArray();
            if(!$exists)$this->db->table('rank_placement_groups')->insert(['personnel_group'=>'FACULTY','catalog_type'=>$catalogType,'qualification_tier_code'=>$tier,'qualification_source_label'=>$label,'configuration_status'=>$status,'unresolved_reason'=>$reason,'source_document_id'=>'NDMU-OFFICIAL-RANKING-DOCUMENT','is_active'=>1]);
        }

        $this->db->query("INSERT INTO rank_placement_group_ranks (rank_placement_group_id,faculty_rank_catalog_id,ladder_order,mapping_status,source_document_id)
            SELECT g.id,r.id,r.display_order,'configured','NDMU-OFFICIAL-RANKING-DOCUMENT'
            FROM rank_placement_groups g JOIN faculty_rank_catalog r ON r.catalog_type=g.catalog_type AND r.qualification_tier_code=g.qualification_tier_code AND r.is_active=1
            LEFT JOIN rank_placement_group_ranks m ON m.rank_placement_group_id=g.id AND m.faculty_rank_catalog_id=r.id
            WHERE g.personnel_group='FACULTY' AND g.configuration_status='configured' AND m.id IS NULL");
    }

    }
