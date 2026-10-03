# Filename Sanitization & Security

## Original Filename Handling
1. **Separation of Metadata and Storage Key**:
   - The user's original filename is preserved purely as display metadata in `personnel_accomplishment_evidence.original_filename`.
   - The original filename is NEVER used to construct directory paths or stored object names on the host filesystem.
2. **Sanitization Rules**:
   - Directory traversal sequences (`../`, `..\`) are stripped via `basename()`.
   - Null bytes (`\0`) are eliminated.
   - Non-alphanumeric characters (except `.`, `_`, `-`) are converted to underscores.
   - Multiple consecutive dots are collapsed into single dots to prevent extension masking.
