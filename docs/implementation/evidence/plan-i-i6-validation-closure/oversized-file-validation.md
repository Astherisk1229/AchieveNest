# Oversized File Validation

## Size Limit
- Maximum file size: **10 MiB (10,485,760 bytes)**.
- Files <= 10 MiB: Accepted.
- Files > 10 MiB: Rejected immediately before disk persistence.
- Zero-byte files: Rejected (`file_empty`).
