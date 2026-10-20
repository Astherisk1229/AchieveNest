<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/** Adds optional links from organization events to OSAD's canonical portfolio taxonomy. */
final class AddOptionalEventPortfolioClassification extends Migration
{
    public function up()
    {
        if ($this->db->DBDriver === 'Postgre') {
            $this->db->query('ALTER TABLE public.events ADD COLUMN IF NOT EXISTS portfolio_category_id uuid NULL');
            $this->db->query('ALTER TABLE public.events ADD COLUMN IF NOT EXISTS portfolio_subcategory_id uuid NULL');
            $this->db->query("DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_events_portfolio_category' AND conrelid='public.events'::regclass) THEN
                    ALTER TABLE public.events ADD CONSTRAINT fk_events_portfolio_category FOREIGN KEY (portfolio_category_id) REFERENCES public.portfolio_categories(id) ON DELETE RESTRICT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_events_portfolio_subcategory' AND conrelid='public.events'::regclass) THEN
                    ALTER TABLE public.events ADD CONSTRAINT fk_events_portfolio_subcategory FOREIGN KEY (portfolio_subcategory_id) REFERENCES public.portfolio_subcategories(id) ON DELETE RESTRICT;
                END IF;
            END $$");
            $this->db->query('CREATE INDEX IF NOT EXISTS idx_events_portfolio_category ON public.events(portfolio_category_id)');
            $this->db->query('CREATE INDEX IF NOT EXISTS idx_events_portfolio_subcategory ON public.events(portfolio_subcategory_id)');
            return;
        }

        if ($this->db->DBDriver !== 'MySQLi') {
            throw new \RuntimeException('Optional event classification requires PostgreSQL or MySQL.');
        }

        if (! $this->db->fieldExists('portfolio_category_id', 'events')) {
            $this->db->query('ALTER TABLE events ADD COLUMN portfolio_category_id CHAR(36) NULL AFTER event_type');
            $this->db->query('ALTER TABLE events ADD KEY idx_events_portfolio_category (portfolio_category_id)');
            $this->db->query('ALTER TABLE events ADD CONSTRAINT fk_events_portfolio_category FOREIGN KEY (portfolio_category_id) REFERENCES portfolio_categories(id) ON DELETE RESTRICT');
        }
        if (! $this->db->fieldExists('portfolio_subcategory_id', 'events')) {
            $this->db->query('ALTER TABLE events ADD COLUMN portfolio_subcategory_id CHAR(36) NULL AFTER portfolio_category_id');
            $this->db->query('ALTER TABLE events ADD KEY idx_events_portfolio_subcategory (portfolio_subcategory_id)');
            $this->db->query('ALTER TABLE events ADD CONSTRAINT fk_events_portfolio_subcategory FOREIGN KEY (portfolio_subcategory_id) REFERENCES portfolio_subcategories(id) ON DELETE RESTRICT');
        }
    }

    public function down()
    {
        if ($this->db->DBDriver === 'Postgre') {
            $this->db->query('ALTER TABLE public.events DROP CONSTRAINT IF EXISTS fk_events_portfolio_subcategory');
            $this->db->query('ALTER TABLE public.events DROP CONSTRAINT IF EXISTS fk_events_portfolio_category');
            $this->db->query('DROP INDEX IF EXISTS public.idx_events_portfolio_category');
            $this->db->query('DROP INDEX IF EXISTS public.idx_events_portfolio_subcategory');
            $this->db->query('ALTER TABLE public.events DROP COLUMN IF EXISTS portfolio_subcategory_id');
            $this->db->query('ALTER TABLE public.events DROP COLUMN IF EXISTS portfolio_category_id');
            return;
        }

        if ($this->db->DBDriver !== 'MySQLi') return;
        if ($this->db->fieldExists('portfolio_subcategory_id', 'events')) {
            $this->db->query('ALTER TABLE events DROP FOREIGN KEY fk_events_portfolio_subcategory');
            $this->db->query('ALTER TABLE events DROP INDEX idx_events_portfolio_subcategory');
            $this->db->query('ALTER TABLE events DROP COLUMN portfolio_subcategory_id');
        }
        if ($this->db->fieldExists('portfolio_category_id', 'events')) {
            $this->db->query('ALTER TABLE events DROP FOREIGN KEY fk_events_portfolio_category');
            $this->db->query('ALTER TABLE events DROP INDEX idx_events_portfolio_category');
            $this->db->query('ALTER TABLE events DROP COLUMN portfolio_category_id');
        }
    }
}
