-- Persist the OSAD certificate-template code selected while creating an event.
-- This is safe on restored databases and clean deployments.
SET @event_template_column_sql = (
  SELECT CASE WHEN COUNT(*) = 0
    THEN 'ALTER TABLE `events` ADD COLUMN `osad_template_id` VARCHAR(32) NULL AFTER `event_type`'
    ELSE 'SELECT 1'
  END
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'events'
    AND column_name = 'osad_template_id'
);

PREPARE event_template_column_statement FROM @event_template_column_sql;
EXECUTE event_template_column_statement;
DEALLOCATE PREPARE event_template_column_statement;
