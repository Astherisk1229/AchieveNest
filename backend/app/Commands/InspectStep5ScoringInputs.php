<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Throwable;

/**
 * Read-only inspection for Step 5 (single scoring engine). Writes the award rubric as stored in
 * the database, taxonomy codes, and duplicate evaluation groups to writable/step5-inspection.json.
 * It performs SELECT statements only.
 */
class InspectStep5ScoringInputs extends BaseCommand
{
    protected $group = 'Awards';
    protected $name = 'inspect:step5';
    protected $description = 'Read-only dump of award rubric, taxonomy codes and evaluation duplicates for Step 5.';

    public function run(array $params)
    {
        $db = db_connect();
        $out = ['generated_at' => date('c'), 'database' => $db->getDatabase()];
        $select = static function (string $sql) use ($db): array {
            try {
                return $db->query($sql)->getResultArray();
            } catch (Throwable $e) {
                return ['__error' => $e->getMessage()];
            }
        };
        $columns = static function (string $table) use ($db): array {
            try {
                return $db->tableExists($table) ? $db->getFieldNames($table) : ['__missing_table'];
            } catch (Throwable $e) {
                return ['__error' => $e->getMessage()];
            }
        };

        $out['columns'] = [];
        foreach (['award_definitions', 'award_criteria', 'award_criterion_components', 'award_scoring_rules', 'award_scoring_model_versions',
                  'award_portfolio_mappings', 'award_evidence_mapping_rules', 'award_cycles', 'student_award_evaluations',
                  'student_award_criterion_scores', 'student_award_score_evidence', 'award_student_evaluation_summaries'] as $table) {
            $out['columns'][$table] = $columns($table);
        }
        $out['categories'] = $select('SELECT id, code, name, status FROM portfolio_categories ORDER BY sort_order');
        $out['subcategories'] = $select('SELECT s.id, c.code AS category_code, s.code, s.name, s.status FROM portfolio_subcategories s JOIN portfolio_categories c ON c.id = s.category_id ORDER BY c.sort_order, s.sort_order');
        $out['award_definitions'] = $select('SELECT * FROM award_definitions ORDER BY name');
        $out['award_criteria'] = $select('SELECT * FROM award_criteria ORDER BY award_definition_id, sort_order');
        $out['award_criterion_components'] = $select('SELECT * FROM award_criterion_components ORDER BY criterion_id, sort_order');
        $out['award_scoring_rules'] = $select('SELECT * FROM award_scoring_rules ORDER BY criterion_id, sort_order');
        $out['award_scoring_model_versions'] = $select('SELECT * FROM award_scoring_model_versions ORDER BY award_definition_id, version_number');
        $out['award_cycles'] = $select('SELECT id, name, status, start_date, end_date FROM award_cycles ORDER BY start_date');
        $out['evaluation_duplicates'] = $select(
            'SELECT cycle_id, award_definition_id, student_profile_id, COUNT(*) AS rows_count, GROUP_CONCAT(id) AS ids
             FROM student_award_evaluations GROUP BY cycle_id, award_definition_id, student_profile_id HAVING COUNT(*) > 1'
        );
        $out['evaluation_count'] = $select('SELECT COUNT(*) AS n FROM student_award_evaluations');
        $out['verified_record_metadata_keys'] = $select(
            "SELECT pc.code AS category_code, spr.structured_metadata FROM student_portfolio_records spr
             JOIN portfolio_categories pc ON pc.id = spr.category_id WHERE spr.status = 'verified' LIMIT 200"
        );

        $path = WRITEPATH . 'step5-inspection.json';
        file_put_contents($path, json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
        CLI::write('Wrote ' . $path, 'green');
        CLI::write('Evaluation duplicate groups: ' . (isset($out['evaluation_duplicates']['__error']) ? 'ERROR' : count($out['evaluation_duplicates'])));
    }
}
