# Legacy Event & Status Compatibility

## Compatibility Layer
- Legacy status entries (e.g. `returned_to_personnel`) are normalized during read operations into canonical `returned_for_revision`.
- Deprecated status keys are prohibited for all new write operations.
- Historical event rows that do not strictly match canonical event keys are preserved without destructive alteration and presented with capitalized labels.
