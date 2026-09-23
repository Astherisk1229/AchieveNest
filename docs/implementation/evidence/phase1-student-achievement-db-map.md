# AchieveNest — Plan 04 Phase 1
## Evidence: Database Schema & Entity Relationships

---

### 1. Portfolio Tables in `achievenest_local`

1. **`portfolio_categories`**
   - `id` (char(36) PK)
   - `code` (varchar(50) UK)
   - `name` (varchar(100))
   - `description` (text)
   - `sort_order` (int)
   - `status` (varchar(20))
   - `created_at`, `updated_at` (datetime)

2. **`portfolio_subcategories`**
   - `id` (char(36) PK)
   - `category_id` (char(36) FK -> `portfolio_categories.id`)
   - `code` (varchar(50) UK)
   - `name` (varchar(100))
   - `description` (text)
   - `sort_order` (int)
   - `status` (varchar(20))
   - `created_at`, `updated_at` (datetime)

3. **`student_portfolio_records`**
   - `id` (char(36) PK)
   - `student_profile_id` (char(36) FK -> `profiles.id`)
   - `category_id` (char(36) FK -> `portfolio_categories.id`)
   - `subcategory_id` (char(36) FK -> `portfolio_subcategories.id`, nullable)
   - `title` (varchar(255))
   - `organizer_or_body` (varchar(255), nullable)
   - `occurrence_date` (date, nullable)
   - `start_date` (date, nullable)
   - `end_date` (date, nullable)
   - `description` (text, nullable)
   - `structured_metadata` (json)
   - `status` (varchar(30) - `draft`, `submitted`, `under_review`, `verified`, `revisions_requested`, `rejected`)
   - `submitted_at` (datetime, nullable)
   - `verified_at` (datetime, nullable)
   - `created_at`, `updated_at` (datetime)

4. **`student_portfolio_evidence`**
   - `id` (char(36) PK)
   - `portfolio_record_id` (char(36) FK -> `student_portfolio_records.id`)
   - `file_path` (varchar(255))
   - `original_name` (varchar(255))
   - `mime_type` (varchar(100))
   - `file_size` (bigint)
   - `created_at` (datetime)

5. **`student_portfolio_verification_events`**
   - `id` (char(36) PK)
   - `portfolio_record_id` (char(36) FK -> `student_portfolio_records.id`)
   - `actor_profile_id` (char(36) FK -> `profiles.id`)
   - `action` (varchar(50) - `submitted`, `approved`, `rejected`, `returned`)
   - `previous_status` (varchar(50))
   - `new_status` (varchar(50))
   - `remarks` (text, nullable)
   - `occurred_at` (datetime)
