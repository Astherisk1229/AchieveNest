# Database Evidence Reference Audit

## Database Tables Referencing Evidence
1. **`personnel_accomplishment_evidence`**:
   - `id` (VARCHAR/CHAR UUID, PK)
   - `accomplishment_id` (VARCHAR/CHAR UUID, FK -> `personnel_accomplishments.id`)
   - `storage_path` (VARCHAR, relative path: `personnel/{owner}/{accId}/{uuid}.ext`)
   - `original_filename` (VARCHAR)
   - `mime_type` (VARCHAR)
   - `detected_mime_type` (VARCHAR)
   - `byte_size` (BIGINT)
   - `checksum` / `sha256` (VARCHAR 64 chars)
   - `uploaded_by` (VARCHAR/CHAR UUID, FK -> `profiles.id`)
   - `uploaded_at` (DATETIME)
   - `security_status` (VARCHAR, default `pending`)
   - `status` (VARCHAR, default `active`)

2. **`personnel_accomplishments`**:
   - `id` (VARCHAR/CHAR UUID, PK)
   - `personnel_profile_id` (VARCHAR/CHAR UUID, FK -> `profiles.id`)
   - `title` (VARCHAR)
   - `domain` (VARCHAR)
   - `occurrence_date` (DATE)
   - `claimed_points` (DECIMAL)
   - `status` (VARCHAR)

3. **`personnel_evaluation_items` (Submission Snapshot)**:
   - `id` (VARCHAR/CHAR UUID, PK)
   - `evaluation_id` (VARCHAR/CHAR UUID, FK -> `personnel_evaluations.id`)
   - `accomplishment_id` (VARCHAR/CHAR UUID, FK -> `personnel_accomplishments.id`)
   - `file_name` (VARCHAR)
   - `file_url` (VARCHAR, relative storage path)
   - `category_area` (VARCHAR)
   - `criterion_code` (VARCHAR)
   - `awarded_points` (DECIMAL)
   - `scoring_payload` (JSON)
