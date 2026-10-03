# Extension Allowlist Enforcement

## Canonical Allowed Extensions
| Extension | Normalized Extension | Allowed MIME Types | Status |
|---|---|---|---|
| `.pdf` | `pdf` | `application/pdf` | Allowed |
| `.jpg` | `jpg` | `image/jpeg` | Allowed |
| `.jpeg` | `jpeg` | `image/jpeg` | Allowed |
| `.png` | `png` | `image/png` | Allowed |

## Explicitly Prohibited Extensions
- Executables & Scripts: `.exe`, `.dll`, `.bat`, `.cmd`, `.com`, `.sh`, `.ps1`, `.py`, `.js`, `.vbs`, `.scr`, `.bin`
- Web Documents & Server Scripts: `.php`, `.phar`, `.phtml`, `.html`, `.htm`, `.svg`
- Unapproved Archives/Docs: `.zip`, `.tar`, `.docx`, `.xlsx`

Any upload with an unlisted extension is rejected with `HTTP 415 UNSUPPORTED_FILE_TYPE`.
