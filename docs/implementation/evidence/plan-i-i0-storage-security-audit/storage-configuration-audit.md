# Storage Configuration Source Audit

## Configuration Sources
1. **Backend Environment (`backend/.env`)**:
   - `AUTH_MODE=local-defense`: Configures local defense mode.
   - `supabase.url` and `supabase.anonKey` are defined as inactive/placeholder references.
   - Storage root defaults to `WRITEPATH . 'uploads/evidence/'` defined in `LocalEvidenceStorageService.php`.
2. **Frontend Environment (`frontend/.env.local`)**:
   - `VITE_API_BASE_URL=http://localhost:8080/api/v1`
   - `VITE_AUTH_MODE=local-defense`
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` present but API routes redirect evidence handling to backend endpoints (`/api/v1/evidence/...`).
3. **Secret & Credential Exposure Assessment**:
   - No sensitive server service-role keys are exposed to the client bundle.
   - All physical file operations and storage access are mediated exclusively through backend controllers.
