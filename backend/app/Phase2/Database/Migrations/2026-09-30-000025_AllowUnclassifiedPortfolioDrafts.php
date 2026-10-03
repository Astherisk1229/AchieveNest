<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

/**
 * Evidence-first entry: a student uploads evidence before choosing a category, so an unfinished
 * draft may exist without a category. Every non-draft record still requires one (CHECK).
 */
final class AllowUnclassifiedPortfolioDrafts extends Migration
{
    private const CHECK = 'chk_portfolio_records_category_unless_draft';

    public function up()
    {
        $this->db->query(
            'ALTER TABLE `student_portfolio_records`
                MODIFY `category_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
                ADD CONSTRAINT `' . self::CHECK . "` CHECK (`category_id` IS NOT NULL OR `status` = 'draft')"
        );
    }

    public function down()
    {
        if ($this->db->table('student_portfolio_records')->where('category_id', null)->countAllResults() > 0) {
            throw new RuntimeException('Cannot roll back while unclassified drafts exist.');
        }
        $this->db->query(
            'ALTER TABLE `student_portfolio_records`
                DROP CHECK `' . self::CHECK . '`,
                MODIFY `category_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL'
        );
    }
}
