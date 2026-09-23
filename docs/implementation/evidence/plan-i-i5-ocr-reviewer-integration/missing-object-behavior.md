# Missing Physical Storage Object Behavior

## Error Handling
If an evidence metadata record exists in the database but the physical file is absent on disk:
1. **OCR Processing**: Halts safely and returns `storage_object_missing`. No fake OCR data is generated.
2. **Reviewer Preview / Download**: Halts with `storage_object_missing` / HTTP 404 Not Found.
3. **No Automatic Substitution**: The server never scans another file with the same filename or attempts fuzzy resolution.
