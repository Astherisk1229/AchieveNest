# Plan H Phase H2 — Print Preview vs Export Evidence

### Output Type Consistency
- `OUTPUT_TYPES.DELIBERATION_SUMMARY`: Standard structured DTO.
- `OUTPUT_TYPES.PRINT_VIEW`: Browser printable view DTO.
- `OUTPUT_TYPES.PDF_EXPORT`: PDF export generation DTO.
- All formats consume the exact same underlying read model ensuring 100% calculation and field consistency across formats.
