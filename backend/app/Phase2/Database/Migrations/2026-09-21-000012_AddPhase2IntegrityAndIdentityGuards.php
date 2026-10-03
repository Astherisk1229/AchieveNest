<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddPhase2IntegrityAndIdentityGuards extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
CREATE TABLE `admin_personnel_account_links` (
    `admin_profile_id`
        CHAR(36)
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci
        NOT NULL,

    `personnel_profile_id`
        CHAR(36)
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci
        NOT NULL,

    `link_status`
        VARCHAR(30)
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci
        NOT NULL
        DEFAULT 'active',

    `linked_by_profile_id`
        CHAR(36)
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci
        DEFAULT NULL,

    `linked_at`
        DATETIME(6)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`admin_profile_id`),

    UNIQUE KEY `uq_admin_personnel_account_links_personnel`
        (`personnel_profile_id`),

    KEY `idx_admin_personnel_account_links_linked_by`
        (`linked_by_profile_id`),

    CONSTRAINT `fk_admin_personnel_links_admin`
        FOREIGN KEY (`admin_profile_id`)
        REFERENCES `profiles` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_admin_personnel_links_personnel`
        FOREIGN KEY (`personnel_profile_id`)
        REFERENCES `personnel_profiles` (`profile_id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_admin_personnel_links_linked_by`
        FOREIGN KEY (`linked_by_profile_id`)
        REFERENCES `profiles` (`id`)
        ON DELETE SET NULL
        ON UPDATE NO ACTION,

    CONSTRAINT `chk_admin_personnel_account_links_status`
        CHECK (`link_status` IN ('active', 'inactive', 'revoked')),

    CONSTRAINT `chk_admin_personnel_account_links_not_self`
        CHECK (`admin_profile_id` <> `personnel_profile_id`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
SQL);

        $this->db->query(<<<'SQL'
ALTER TABLE `profile_roles`
    ADD COLUMN `normalized_scope_id`
        CHAR(36)
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci
        GENERATED ALWAYS AS (
            CASE
                WHEN `scope_id` IS NULL
                    THEN '00000000-0000-0000-0000-000000000000'
                ELSE `scope_id`
            END
        ) STORED,

    ADD COLUMN `active_scope_guard`
        TINYINT
        GENERATED ALWAYS AS (
            CASE
                WHEN `is_active` = 1
                    THEN 1
                ELSE NULL
            END
        ) STORED,

    ADD UNIQUE KEY `uq_profile_roles_active_assignment`
        (
            `profile_id`,
            `role_id`,
            `scope_type`,
            `normalized_scope_id`,
            `active_scope_guard`
        );
SQL);
    }

    public function down()
    {
        $this->db->query(<<<'SQL'
ALTER TABLE `profile_roles`
    DROP INDEX `uq_profile_roles_active_assignment`,
    DROP COLUMN `active_scope_guard`,
    DROP COLUMN `normalized_scope_id`;
SQL);

        $this->db->query('DROP TABLE `admin_personnel_account_links`');
    }
}
