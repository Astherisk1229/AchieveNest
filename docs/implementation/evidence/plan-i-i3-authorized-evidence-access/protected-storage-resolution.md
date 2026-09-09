# Protected Storage Resolution & Path Security

## 1. Storage Path Resolution Protocol
1. Client requests evidence strictly by `evidence_id`.
2. Backend queries database for the authoritative `storage_key`.
3. Server resolves the full path against the protected root `writable/uploads/personnel_evidence/`.
4. Directory traversal sequences (`..`, `\0`) are stripped.
5. Realpath is checked to ensure it resides within the protected storage root.

## 2. Webroot Isolation
- The evidence directory is located entirely outside the public webroot (`public/`).
- Direct URL requests to static assets (e.g. `http://example.com/uploads/...`) are impossible and return 404.
- All file bytes are delivered through authenticated PHP streaming controllers (`EvidenceController.php`).
