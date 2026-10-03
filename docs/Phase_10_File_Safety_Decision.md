# Phase 10 File Safety Decision

- scanner detected: No (clamscan, clamdscan, freshclam not found in PATH, Program Files, or WAMP runtime)
- scanner name: None
- scanner version: N/A
- installation required: Yes (to support local ClamAV on Windows)
- installation attempted: No (installation intentionally declined to preserve runtime stability and eliminate external background service dependencies for offline defense)
- runtime mode: Outcome B — Explicit Deferral of Local Malware Scanning
- offline capable: Yes (All Phase 9 local structural, MIME, size, checksum, containment, and authorization controls operate 100% offline)
- signature database available: No
- CodeIgniter integration feasible: Yes (Architecture prepared for post-prefinal antivirus integration)
- selected outcome: Outcome B — Explicit Deferral with Active File-Safety Controls
- decision rationale: In accordance with Phase 10 guidelines, installing an external antivirus engine/daemon on the local WAMP defense machine risks destabilizing the validated PHP 8.3/MySQL 8.4 runtime. Rather than fabricating scanner results or conflating MIME inspection with antivirus scanning, the system maintains strict physical file safety controls (server-side finfo MIME detection, strict PDF/JPEG/PNG allowlisting, 10 MiB size ceiling, zero-byte rejection, opaque UUID stored filenames, SHA-256 integrity hashing, realpath path traversal defense, and object-level policy authorization) while truthfully recording `security_status = 'pending'` and `malware_scanner = 'none_deferred'`.
