# Invalid Extension Validation

## Prohibited Extensions Blocked Server-Side
The server rejects all non-whitelisted extensions, including:
- Executables: `.exe`, `.bat`, `.cmd`, `.sh`, `.bin`
- Web Scripts: `.php`, `.phtml`, `.js`, `.html`, `.svg`
- Archives & Code: `.zip`, `.tar`, `.py`, `.c`, `.java`
- Double extension tricks: `file.pdf.exe`, `image.png.php`

## Invariants
- Rejected before writing persistent disk files.
- Zero database rows created.
- Zero accomplishment evidence attachments formed.
