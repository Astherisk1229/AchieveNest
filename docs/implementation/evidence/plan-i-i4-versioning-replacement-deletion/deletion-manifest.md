# Complete Deletion Manifest

## 1. Manifest Structure & Execution Plan
Prior to executing physical unlinks and database deletions, `PersonnelEvidenceVersioningService` compiles a pre-deletion manifest:
```json
{
  "valid": true,
  "owner_id": "USER-FACULTY-101",
  "initiated_by": "owner",
  "authorization_reference": "owner_direct_request",
  "evidence_count": 2,
  "storage_keys_to_unlink": [
    "personnel/101/evidence/018f3a2b-8c10-7e44-b611-e123456789aa.pdf",
    "personnel/101/evidence/018f3a2b-8c10-7e44-b611-e123456789bb.pdf"
  ],
  "timestamp": "2026-09-09T10:25:00.000Z"
}
```

## 2. Integrity Guarantee
The manifest ensures all storage objects belonging to the target personnel are identified for physical disk deletion before database records are deleted.
