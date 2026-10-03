# Upload Atomicity Validation

## Failure Boundaries
1. **Physical Write Failure**: No database row is created; returns `storage_write_failed`.
2. **Database Insert Failure**: Newly written file on disk is immediately unlinked (`unlink()`); transaction rolled back.
3. **Accomplishment Attachment Failure**: Database row rolled back and disk file removed.
4. **Zero Partial Evidence**: No dangling rows without files; no orphaned files without rows.
