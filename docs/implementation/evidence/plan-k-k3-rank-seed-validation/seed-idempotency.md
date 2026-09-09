# Seed Idempotency & Uniqueness Validation

- **Full-Time Ranks Seed**: Seeded deterministically via `2026-09-08-000065_SeedFacultyRankCatalog.php` and mirrored in `facultyRankCatalogService.js`.
- **Part-Time Titles Seed**: Seeded deterministically via `2026-09-08-000066_SeedPartTimeFacultyTitles.php` and mirrored in `partTimeFacultyTitleService.js`.
- **Idempotency Guarantee**: UNIQUE constraint on `code` prevents duplication across repeated seeder runs.
- **Verification**: 0 duplicate codes, 0 duplicate display labels, 0 duplicate hierarchy orders.
