# Protected Storage Verification

## Storage Isolation
1. **Physical Location**: `backend/writable/uploads/evidence/personnel/`
2. **Access Protection**:
   - Location is located strictly outside the public web server document root (`backend/public/`).
   - Direct HTTP access to evidence files is completely blocked by web server configuration.
   - Symlinks into public directories are prohibited.
3. **Retrieval**:
   - Download is gated through authenticated API routes (`GET /api/v1/evidence/personnel/{id}/download`) with security headers (`X-Content-Type-Options: nosniff`).
