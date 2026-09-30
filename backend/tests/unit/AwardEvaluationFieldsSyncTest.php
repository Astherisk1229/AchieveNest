<?php

declare(strict_types=1);

namespace Tests\Unit;

use CodeIgniter\Test\CIUnitTestCase;

/**
 * The coordinator screen flags "Affects award evaluation" from frontend/src/config/awardEvaluationFields.js.
 * That list must equal the structured-metadata keys the award engine reads for scoring or routing
 * (identity/duplicate keys excluded), so the flags never drift from the engine.
 */
final class AwardEvaluationFieldsSyncTest extends CIUnitTestCase
{
    private const IDENTITY_ONLY_KEYS = ['academic_year', 'event_id', 'period', 'publication_id', 'source_reference'];

    public function testFrontendListMatchesEngineKeys(): void
    {
        $root = dirname(__DIR__, 3);
        $engine = '';
        foreach (['AwardScoringService.php', 'AwardEvidenceMappingService.php'] as $file) {
            $engine .= (string) file_get_contents($root . '/backend/app/Services/' . $file);
        }
        preg_match_all("/\\\$meta\['([a-z_]+)'\]|structured_metadata'\] \?\? \[\]\)\['([a-z_]+)'\]/", $engine, $matches);
        $engineKeys = array_values(array_unique(array_filter(array_merge($matches[1], $matches[2]))));
        $engineKeys = array_values(array_diff($engineKeys, self::IDENTITY_ONLY_KEYS));
        sort($engineKeys);

        $config = (string) file_get_contents($root . '/frontend/src/config/awardEvaluationFields.js');
        preg_match('/AWARD_EVALUATION_FIELDS = \[(.*?)\]/s', $config, $block);
        preg_match_all("/'([a-z_]+)'/", $block[1] ?? '', $listed);
        $frontendKeys = $listed[1];
        sort($frontendKeys);

        self::assertSame($engineKeys, $frontendKeys);
    }
}
