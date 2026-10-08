<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/** Stores the OSAD display/intake hierarchy on immutable award scoring versions. */
class AddOsadCriteriaHierarchyConfiguration extends Migration
{
    public function up()
    {
        $versionColumns = $this->db->getFieldNames('award_scoring_model_versions');
        if (! in_array('hierarchy_config', $versionColumns, true)) {
            $this->db->query('ALTER TABLE award_scoring_model_versions ADD COLUMN hierarchy_config JSON NULL');
        }
        if (! in_array('change_reason', $versionColumns, true)) {
            $this->db->query('ALTER TABLE award_scoring_model_versions ADD COLUMN change_reason TEXT NULL');
        }
        if (! in_array('effective_date', $versionColumns, true)) {
            $this->db->query('ALTER TABLE award_scoring_model_versions ADD COLUMN effective_date DATE NULL');
        }

        $awardColumns = $this->db->getFieldNames('award_definitions');
        if (! in_array('active_hierarchy_version_id', $awardColumns, true)) {
            $this->db->query('ALTER TABLE award_definitions ADD COLUMN active_hierarchy_version_id CHAR(36) NULL');
        }
    }

    public function down()
    {
        $awardColumns = $this->db->getFieldNames('award_definitions');
        if (in_array('active_hierarchy_version_id', $awardColumns, true)) {
            $this->db->query('ALTER TABLE award_definitions DROP COLUMN active_hierarchy_version_id');
        }

        $versionColumns = $this->db->getFieldNames('award_scoring_model_versions');
        foreach (['effective_date', 'change_reason', 'hierarchy_config'] as $column) {
            if (in_array($column, $versionColumns, true)) {
                $this->db->query("ALTER TABLE award_scoring_model_versions DROP COLUMN {$column}");
            }
        }
    }
}
