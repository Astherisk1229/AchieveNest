# Event Persistence Model

## Database Persistence
- **Table**: `public.personnel_evaluation_events`
- **Fields**:
  - `id`: UUID Primary Key
  - `evaluation_id`: UUID Foreign Key referencing `personnel_evaluations.id` (nullable for portfolio purge)
  - `event_type`: VARCHAR(50) Canonical event key string
  - `performed_by`: UUID Foreign Key referencing `profiles.id`
  - `payload`: JSONB structured metadata (`actor_role`, `version_number`, `idempotency_key`, `occurred_at`, etc.)
  - `created_at`: TIMESTAMPTZ Server-generated timestamp (`now()`)
- **Immutability**: Append-only; `UPDATE` and `DELETE` queries are revoked.
