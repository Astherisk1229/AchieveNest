# File Size Enforcement

## Boundary Matrix
| File Size | Evaluation | HTTP Status | Response Code |
|---|---|---|---|
| `0 bytes` | Rejected (Empty File) | `422 Unprocessable Entity` | `EMPTY_FILE` |
| `1 byte` to `10,485,760 bytes` (10 MiB) | Accepted | `201 Created` | `OK` |
| `10,485,761 bytes` (> 10 MiB) | Rejected (Oversized) | `413 Payload Too Large` | `FILE_TOO_LARGE` |

Server validation enforces `filesize($tempPath) <= 10485760` strictly before writing to permanent storage.
