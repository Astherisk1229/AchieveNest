/**
 * Structured-detail keys that the OSAD award engine reads when matching an approved achievement
 * to award criteria (backend/app/Services/AwardScoringService.php and AwardEvidenceMappingService.php).
 * The coordinator sees these fields flagged "Affects award evaluation" but never any point values.
 * Category and subcategory also affect evaluation. Kept in sync by
 * backend/tests/unit/AwardEvaluationFieldsSyncTest.php.
 */
export const AWARD_EVALUATION_FIELDS = [
  'activity_type',
  'citation_type',
  'civic_level',
  'competition_type',
  'contribution_type',
  'event_level',
  'involvement_type',
  'participation_type',
  'performance_type',
  'placement',
  'position_level',
  'publication_type',
  'result',
  'role',
  'scope'
]

export const affectsAwardEvaluation = key => AWARD_EVALUATION_FIELDS.includes(key)
