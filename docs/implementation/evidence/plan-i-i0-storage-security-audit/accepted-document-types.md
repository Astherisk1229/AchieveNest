# Accepted Document Types Matrix

| Document Category | Permitted Extensions | Canonical MIME Types | Magic Byte Signature | Max Allowed Size |
|---|---|---|---|---|
| Portable Document Format | `.pdf` | `application/pdf` | `25 50 44 46` (`%PDF`) | 10 MiB (10,485,760 bytes) |
| JPEG Image | `.jpg`, `.jpeg` | `image/jpeg` | `FF D8 FF` | 10 MiB (10,485,760 bytes) |
| PNG Image | `.png` | `image/png` | `89 50 4E 47` (`.PNG`) | 10 MiB (10,485,760 bytes) |

## Prohibited & Restricted File Types
The following extensions are strictly rejected by both frontend and backend validators:
- `php`, `phar`, `phtml`, `html`, `htm`, `js`, `exe`, `dll`, `bat`, `cmd`, `com`, `msi`, `sh`, `ps1`, `jar`, `svg`, `py`, `vbs`, `scr`, `bin`
