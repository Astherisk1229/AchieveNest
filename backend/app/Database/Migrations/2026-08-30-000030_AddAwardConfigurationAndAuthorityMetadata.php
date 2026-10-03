<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Migration: 2026-08-30-000030_AddAwardConfigurationAndAuthorityMetadata.php
 * Domain: OSAD Awards & Scoring Criteria Configuration, Versioning, and Authority
 * Engine: MySQL 8.4.7 (InnoDB, utf8mb4_unicode_ci)
 */
class AddAwardConfigurationAndAuthorityMetadata extends Migration
{
    public function up()
    {
        // 1. Extend award_definitions with authority and active scoring version
        $this->db->query(<<<'SQL'
ALTER TABLE award_definitions
    ADD COLUMN authority_status VARCHAR(50) NOT NULL DEFAULT 'OFFICIAL' AFTER status,
    ADD COLUMN active_scoring_version VARCHAR(20) NOT NULL DEFAULT '1.0' AFTER authority_status;
SQL);

        // 2. Extend award_criteria with version link, authority, and rubric reference
        $this->db->query(<<<'SQL'
ALTER TABLE award_criteria
    ADD COLUMN scoring_model_version_id CHAR(36) NULL AFTER award_definition_id,
    ADD COLUMN authority_status VARCHAR(50) NOT NULL DEFAULT 'OFFICIAL' AFTER is_portfolio_computable,
    ADD COLUMN source_rubric_reference VARCHAR(255) NULL AFTER authority_status,
    ADD COLUMN is_published TINYINT(1) NOT NULL DEFAULT 1 AFTER source_rubric_reference;
SQL);

        // 3. Create award_scoring_model_versions table
        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS award_scoring_model_versions (
    id CHAR(36) NOT NULL,
    award_definition_id CHAR(36) NOT NULL,
    award_cycle_id CHAR(36) NULL,
    version_number VARCHAR(20) NOT NULL DEFAULT '1.0',
    version_label VARCHAR(100) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'published',
    candidate_threshold_percent DECIMAL(5,2) NOT NULL DEFAULT 80.00,
    graduating_only TINYINT(1) NOT NULL DEFAULT 1,
    gender_requirement VARCHAR(20) NULL,
    authority_status VARCHAR(50) NOT NULL DEFAULT 'OFFICIAL',
    published_at DATETIME(6) NULL,
    published_by CHAR(36) NULL,
    retired_at DATETIME(6) NULL,
    retired_by CHAR(36) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_asmv_award (award_definition_id),
    KEY idx_asmv_cycle (award_cycle_id),
    KEY idx_asmv_status (status),
    CONSTRAINT fk_asmv_award FOREIGN KEY (award_definition_id) REFERENCES award_definitions (id) ON DELETE CASCADE,
    CONSTRAINT fk_asmv_cycle FOREIGN KEY (award_cycle_id) REFERENCES award_cycles (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL);

        // 4. Create award_criterion_components table
        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS award_criterion_components (
    id CHAR(36) NOT NULL,
    criterion_id CHAR(36) NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    max_points DECIMAL(10,2) NOT NULL,
    sort_order INT NOT NULL DEFAULT 1,
    is_computable TINYINT(1) NOT NULL DEFAULT 1,
    authority_status VARCHAR(50) NOT NULL DEFAULT 'OFFICIAL',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_acc_criterion (criterion_id),
    CONSTRAINT fk_acc_criterion FOREIGN KEY (criterion_id) REFERENCES award_criteria (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL);

        // 5. Deterministic Seeding of Canonical 40 Criteria
        $this->db->query(<<<'SQL'
INSERT IGNORE INTO award_criteria (id, award_definition_id, code, name, weight, max_points, sort_order, is_portfolio_computable, created_at, updated_at) VALUES
('50000002-0001-0000-0000-000000000001','50000001-0000-0000-0000-000000000001','CRIT_LEADERSHIP','Leadership and Governance',35.00,35.00,1,1,NOW(6),NOW(6)),
('50000002-0001-0000-0000-000000000002','50000001-0000-0000-0000-000000000001','CRIT_COMMUNITY','Community Service and Extension',35.00,35.00,2,1,NOW(6),NOW(6)),
('50000002-0001-0000-0000-000000000003','50000001-0000-0000-0000-000000000001','CRIT_DEVELOPMENT','Seminars and Professional Growth',30.00,30.00,3,1,NOW(6),NOW(6)),
('50000002-0002-0000-0000-000000000001','50000001-0000-0000-0000-000000000002','CRIT_LEAD_GOV','Leadership: On and Off Campus',80.00,40.00,1,1,NOW(6),NOW(6)),
('50000002-0002-0000-0000-000000000002','50000001-0000-0000-0000-000000000002','CRIT_LEAD_COMM','Community Involvement',20.00,10.00,2,1,NOW(6),NOW(6)),
('50000002-0003-0000-0000-000000000001','50000001-0000-0000-0000-000000000003','CRIT_VOL_DIRECT','Volunteerism: On and Off Campus',80.00,40.00,1,1,NOW(6),NOW(6)),
('50000002-0003-0000-0000-000000000002','50000001-0000-0000-0000-000000000003','CRIT_VOL_LEAD','Leadership in Service Initiatives',20.00,10.00,2,1,NOW(6),NOW(6)),
('50000002-0004-0000-0000-000000000001','50000001-0000-0000-0000-000000000004','CRIT_JOURN_PUB','Verified Publication Evidence',85.71,60.00,1,1,NOW(6),NOW(6)),
('50000002-0004-0000-0000-000000000002','50000001-0000-0000-0000-000000000004','CRIT_JOURN_LEAD','Leadership in Campus Journalism',14.29,10.00,2,1,NOW(6),NOW(6)),
('50000002-0005-0000-0000-000000000001','50000001-0000-0000-0000-000000000005','CRIT_SPORTS_SKILLS_M','Sports Skills Evidence',36.36,20.00,1,1,NOW(6),NOW(6)),
('50000002-0005-0000-0000-000000000002','50000001-0000-0000-0000-000000000005','CRIT_SPORTS_MEETS_M','Participation in Athletic Meets',36.36,20.00,2,1,NOW(6),NOW(6)),
('50000002-0005-0000-0000-000000000003','50000001-0000-0000-0000-000000000005','CRIT_SPORTS_AWARDS_M','Sports Awards and Placements',27.28,15.00,3,1,NOW(6),NOW(6)),
('50000002-0006-0000-0000-000000000001','50000001-0000-0000-0000-000000000006','CRIT_SPORTS_SKILLS_F','Sports Skills Evidence',36.36,20.00,1,1,NOW(6),NOW(6)),
('50000002-0006-0000-0000-000000000002','50000001-0000-0000-0000-000000000006','CRIT_SPORTS_MEETS_F','Participation in Athletic Meets',36.36,20.00,2,1,NOW(6),NOW(6)),
('50000002-0006-0000-0000-000000000003','50000001-0000-0000-0000-000000000006','CRIT_SPORTS_AWARDS_F','Sports Awards and Placements',27.28,15.00,3,1,NOW(6),NOW(6)),
('50000002-0007-0000-0000-000000000001','50000001-0000-0000-0000-000000000007','CRIT_CULT_SKILLS','Socio-Cultural Skills Evidence',36.36,20.00,1,1,NOW(6),NOW(6)),
('50000002-0007-0000-0000-000000000002','50000001-0000-0000-0000-000000000007','CRIT_CULT_MEETS','Participation in Meets / Showcases',36.36,20.00,2,1,NOW(6),NOW(6)),
('50000002-0007-0000-0000-000000000003','50000001-0000-0000-0000-000000000007','CRIT_CULT_AWARDS','Cultural Awards and Recognitions',27.28,15.00,3,1,NOW(6),NOW(6)),
('50000002-0008-0000-0000-000000000001','50000001-0000-0000-0000-000000000008','CRIT_MINISTRY_INVOLVE','Church Ministries Involvement',37.50,15.00,1,1,NOW(6),NOW(6)),
('50000002-0008-0000-0000-000000000002','50000001-0000-0000-0000-000000000008','CRIT_MINISTRY_INITIATE','Initiated Ministry Activities',37.50,15.00,2,1,NOW(6),NOW(6)),
('50000002-0008-0000-0000-000000000003','50000001-0000-0000-0000-000000000008','CRIT_MINISTRY_LEAD','Ministry Leadership & Citations',25.00,10.00,3,1,NOW(6),NOW(6)),
('50000002-0009-0000-0000-000000000001','50000001-0000-0000-0000-000000000009','CRIT_COCURR_MEM','Membership Participation',50.00,20.00,1,1,NOW(6),NOW(6)),
('50000002-0009-0000-0000-000000000002','50000001-0000-0000-0000-000000000009','CRIT_COCURR_CONTRIB','Important Org Contribution',25.00,10.00,2,1,NOW(6),NOW(6)),
('50000002-0009-0000-0000-000000000003','50000001-0000-0000-0000-000000000009','CRIT_COCURR_LEAD','Org Leadership Involvement',25.00,10.00,3,1,NOW(6),NOW(6)),
('50000002-0010-0000-0000-000000000001','50000001-0000-0000-0000-000000000010','CRIT_EXTR_MEM','Club Membership Participation',50.00,20.00,1,1,NOW(6),NOW(6)),
('50000002-0010-0000-0000-000000000002','50000001-0000-0000-0000-000000000010','CRIT_EXTR_CONTRIB','Important Club Contribution',25.00,10.00,2,1,NOW(6),NOW(6)),
('50000002-0010-0000-0000-000000000003','50000001-0000-0000-0000-000000000010','CRIT_EXTR_LEAD','Club Leadership Involvement',25.00,10.00,3,1,NOW(6),NOW(6)),
('50000002-0011-0000-0000-000000000001','50000001-0000-0000-0000-000000000011','CRIT_ACAD_SCHOLASTIC','Scholastic Honors & Awards',50.00,50.00,1,1,NOW(6),NOW(6)),
('50000002-0011-0000-0000-000000000002','50000001-0000-0000-0000-000000000011','CRIT_ACAD_COMPETITION','Academic Competitions & Seminars',50.00,50.00,2,1,NOW(6),NOW(6)),
('50000002-0012-0000-0000-000000000001','50000001-0000-0000-0000-000000000012','CRIT_RES_PUBLICATION','Research Publications & Papers',50.00,50.00,1,1,NOW(6),NOW(6)),
('50000002-0012-0000-0000-000000000002','50000001-0000-0000-0000-000000000012','CRIT_RES_INNOVATION','Innovations, Patents & Projects',30.00,30.00,2,1,NOW(6),NOW(6)),
('50000002-0012-0000-0000-000000000003','50000001-0000-0000-0000-000000000012','CRIT_RES_CONFERENCE','Research Presentations',20.00,20.00,3,1,NOW(6),NOW(6)),
('50000002-0013-0000-0000-000000000001','50000001-0000-0000-0000-000000000013','CRIT_LOYAL_LEAD','Leadership & Campus Presence',33.33,20.00,1,1,NOW(6),NOW(6)),
('50000002-0013-0000-0000-000000000002','50000001-0000-0000-0000-000000000013','CRIT_LOYAL_COMM','Community & Church Involvement',50.00,30.00,2,1,NOW(6),NOW(6)),
('50000002-0013-0000-0000-000000000003','50000001-0000-0000-0000-000000000013','CRIT_LOYAL_RECOG','Institutional Citations',16.67,10.00,3,1,NOW(6),NOW(6)),
('50000002-0014-0000-0000-000000000001','50000001-0000-0000-0000-000000000014','CRIT_DEAN_MERIT','Collegiate Academic & Holistic Merit',50.00,50.00,1,1,NOW(6),NOW(6)),
('50000002-0014-0000-0000-000000000002','50000001-0000-0000-0000-000000000014','CRIT_DEAN_SERVICE','Collegiate Leadership & Service',50.00,50.00,2,1,NOW(6),NOW(6)),
('50000002-0015-0000-0000-000000000001','50000001-0000-0000-0000-000000000015','CRIT_PRES_HOLISTIC','Institutional Holistic Excellence',40.00,40.00,1,1,NOW(6),NOW(6)),
('50000002-0015-0000-0000-000000000002','50000001-0000-0000-0000-000000000015','CRIT_PRES_LEAD','Supreme University Governance',30.00,30.00,2,1,NOW(6),NOW(6)),
('50000002-0015-0000-0000-000000000003','50000001-0000-0000-0000-000000000015','CRIT_PRES_SERVICE','Community Outreach & Marist Formation',30.00,30.00,3,1,NOW(6),NOW(6));
SQL);

        // 6. Deterministic Backfill
        $this->db->query(<<<'SQL'
UPDATE award_definitions SET authority_status = 'SYSTEM_OPERATIONALIZATION' WHERE code IN ('LOYALTY_AWARD', 'RESEARCH_AND_INNOVATION');
UPDATE award_definitions SET authority_status = 'OFFICIAL' WHERE code NOT IN ('LOYALTY_AWARD', 'RESEARCH_AND_INNOVATION');

UPDATE award_criteria SET authority_status = 'SYSTEM_OPERATIONALIZATION' WHERE code LIKE 'CRIT_LOYAL_%' OR code LIKE 'CRIT_RES_%';
UPDATE award_criteria SET authority_status = 'OFFICIAL' WHERE code NOT LIKE 'CRIT_LOYAL_%' AND code NOT LIKE 'CRIT_RES_%';

INSERT INTO award_scoring_model_versions (
    id,
    award_definition_id,
    award_cycle_id,
    version_number,
    version_label,
    status,
    candidate_threshold_percent,
    graduating_only,
    gender_requirement,
    authority_status,
    published_at,
    created_at,
    updated_at
)
SELECT 
    UUID() AS id,
    ad.id AS award_definition_id,
    (SELECT id FROM award_cycles WHERE status IN ('active', 'evaluating', 'draft') ORDER BY start_date DESC LIMIT 1) AS award_cycle_id,
    '1.0' AS version_number,
    CONCAT(ad.name, ' Scoring Model v1.0 (AY 2025-2026)') AS version_label,
    'published' AS status,
    ad.candidate_threshold_percent,
    ad.graduating_only,
    ad.gender_restriction AS gender_requirement,
    ad.authority_status,
    NOW(6) AS published_at,
    NOW(6) AS created_at,
    NOW(6) AS updated_at
FROM award_definitions ad
WHERE ad.status = 'active';

UPDATE award_criteria ac
JOIN award_scoring_model_versions asmv ON asmv.award_definition_id = ac.award_definition_id AND asmv.version_number = '1.0'
SET ac.scoring_model_version_id = asmv.id;
SQL);
    }

    public function down()
    {
        $this->db->query(<<<'SQL'
DROP TABLE IF EXISTS award_criterion_components;
DROP TABLE IF EXISTS award_scoring_model_versions;

ALTER TABLE award_criteria
    DROP COLUMN scoring_model_version_id,
    DROP COLUMN authority_status,
    DROP COLUMN source_rubric_reference,
    DROP COLUMN is_published;

ALTER TABLE award_definitions
    DROP COLUMN authority_status,
    DROP COLUMN active_scoring_version;
SQL);
    }
}
