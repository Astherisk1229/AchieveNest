# Missing Object Handling

## 1. Controlled Error Behavior
If an evidence metadata record exists in the database, but the physical file is not found on server storage:
1. Controller returns HTTP 404 with standard error envelope:
```json
{
  "error": {
    "code": "STORAGE_OBJECT_MISSING",
    "message": "Evidence physical file not found on server storage."
  }
}
```
2. No internal server paths or PHP stack traces are exposed.
3. The event is flagged for administrative integrity audit (I6 reconciliation).

## 2. Test Verification
- Test 8.1: `returns controlled error when evidence record exists but storage file is missing` (PASSED).
