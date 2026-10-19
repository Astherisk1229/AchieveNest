-- Retires Dean student nominations; award interview eligibility now requires a portfolio evaluation.
ALTER TABLE award_interview_eligibilities
    DROP CHECK ck_award_eligibility_source_reference,
    DROP CHECK ck_interview_eligibility_source,
    DROP CHECK ck_interview_eligibility_pathway,
    DROP FOREIGN KEY fk_interview_eligibility_nomination;

DELETE FROM award_interview_eligibilities
WHERE eligibility_source = 'dean_nomination'
   OR dean_nomination_id IS NOT NULL;

UPDATE award_interview_eligibilities
SET pathway = 'automated_threshold'
WHERE pathway IN ('dean_nomination', 'both');

ALTER TABLE award_interview_eligibilities
    DROP INDEX fk_interview_eligibility_nomination,
    DROP COLUMN dean_nomination_id,
    ADD CONSTRAINT ck_award_eligibility_source_reference
        CHECK (eligibility_source = 'portfolio_based' AND evaluation_id IS NOT NULL),
    ADD CONSTRAINT ck_interview_eligibility_source
        CHECK (eligibility_source = 'portfolio_based'),
    ADD CONSTRAINT ck_interview_eligibility_pathway
        CHECK (pathway = 'automated_threshold');

UPDATE award_student_evaluation_summaries
SET candidate_pathway = 'automatic_portfolio',
    summary_payload = JSON_REMOVE(
        JSON_SET(summary_payload, '$.candidate_intake.candidate_pathway', 'automatic_portfolio'),
        '$.candidate_intake.dean_nomination'
    )
WHERE candidate_pathway = 'dean_nomination';

DROP TABLE dean_student_nominations;
