<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Creates canonical event_venues registry, seeds initial candidates,
 * adds nullable venue_id FK to events table, and performs conservative backfill.
 */
class GovernEventVenues extends Migration
{
    public function up()
    {
        // 1. Create event_venues table
        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS event_venues (
    id CHAR(36) NOT NULL,
    name VARCHAR(150) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_event_venues_name (name),
    KEY idx_event_venues_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);

        // 2. Insert initial venue candidates deterministically
        $initialVenues = [
            ['BRC Convention Hall', 1],
            ['BRC Dining Hall', 2],
            ['SMC Hall', 3],
            ['Teston Building', 4],
            ['Reviewing Stand', 5],
            ['NDMU Gymnasium', 6],
        ];

        foreach ($initialVenues as [$name, $sortOrder]) {
            $this->db->query(<<<'SQL'
INSERT INTO event_venues (id, name, is_active, sort_order, created_at, updated_at)
VALUES (UUID(), ?, 1, ?, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6))
ON DUPLICATE KEY UPDATE
    sort_order = VALUES(sort_order),
    is_active = VALUES(is_active)
SQL, [$name, $sortOrder]);
        }

        // 3. Add venue_id column to events table if not exists
        if (!$this->db->fieldExists('venue_id', 'events')) {
            $this->db->query(<<<'SQL'
ALTER TABLE events
ADD COLUMN venue_id CHAR(36) NULL AFTER venue
SQL);
        }

        // 4. Add index on events.venue_id if not exists
        $indexExists = false;
        $indexes = $this->db->query("SHOW INDEX FROM events WHERE Key_name = 'idx_events_venue_id'")->getResultArray();
        if (!empty($indexes)) {
            $indexExists = true;
        }

        if (!$indexExists) {
            $this->db->query(<<<'SQL'
ALTER TABLE events
ADD INDEX idx_events_venue_id (venue_id)
SQL);
        }

        // 5. Add foreign key constraint if not exists
        $fkExists = false;
        $foreignKeys = $this->db->query(<<<'SQL'
SELECT CONSTRAINT_NAME
FROM information_schema.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'events'
  AND CONSTRAINT_NAME = 'fk_events_venue_id'
SQL)->getResultArray();

        if (!empty($foreignKeys)) {
            $fkExists = true;
        }

        if (!$fkExists) {
            $this->db->query(<<<'SQL'
ALTER TABLE events
ADD CONSTRAINT fk_events_venue_id
FOREIGN KEY (venue_id) REFERENCES event_venues(id)
ON DELETE RESTRICT
ON UPDATE CASCADE
SQL);
        }

        // 6. Conservative backfill: match exact trimmed case-insensitive venue text to event_venues.name
        $this->db->query(<<<'SQL'
UPDATE events e
JOIN event_venues v ON LOWER(TRIM(e.venue)) = LOWER(TRIM(v.name))
SET e.venue_id = v.id
WHERE e.venue IS NOT NULL
  AND TRIM(e.venue) <> ''
  AND e.venue_id IS NULL
SQL);
    }

    public function down()
    {
        // 1. Drop foreign key constraint if exists
        $foreignKeys = $this->db->query(<<<'SQL'
SELECT CONSTRAINT_NAME
FROM information_schema.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'events'
  AND CONSTRAINT_NAME = 'fk_events_venue_id'
SQL)->getResultArray();

        if (!empty($foreignKeys)) {
            $this->db->query(<<<'SQL'
ALTER TABLE events
DROP FOREIGN KEY fk_events_venue_id
SQL);
        }

        // 2. Drop index if exists
        $indexes = $this->db->query("SHOW INDEX FROM events WHERE Key_name = 'idx_events_venue_id'")->getResultArray();
        if (!empty($indexes)) {
            $this->db->query(<<<'SQL'
ALTER TABLE events
DROP INDEX idx_events_venue_id
SQL);
        }

        // 3. Drop venue_id column if exists
        if ($this->db->fieldExists('venue_id', 'events')) {
            $this->db->query(<<<'SQL'
ALTER TABLE events
DROP COLUMN venue_id
SQL);
        }

        // 4. Drop event_venues table
        $this->forge->dropTable('event_venues', true);
    }
}
