ALTER TABLE events
    ADD COLUMN portfolio_category_id CHAR(36) NULL AFTER event_type,
    ADD COLUMN portfolio_subcategory_id CHAR(36) NULL AFTER portfolio_category_id,
    ADD KEY idx_events_portfolio_category (portfolio_category_id),
    ADD KEY idx_events_portfolio_subcategory (portfolio_subcategory_id),
    ADD CONSTRAINT fk_events_portfolio_category
        FOREIGN KEY (portfolio_category_id) REFERENCES portfolio_categories(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_events_portfolio_subcategory
        FOREIGN KEY (portfolio_subcategory_id) REFERENCES portfolio_subcategories(id) ON DELETE RESTRICT;
