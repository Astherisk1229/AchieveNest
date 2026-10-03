# Student evidence ClamAV runtime

AchieveNest uses a deployment-owned ClamAV runtime for Student achievement
evidence. It is not a browser or Codex dependency.

## Local WAMP location

- Engine: `backend/.runtime/clamav/clamav-1.5.4.win.x64/clamscan.exe`
- Signatures: `backend/.runtime/clamav/database`
- FreshClam configuration: `backend/.runtime/clamav/config/freshclam.conf`

Run `freshclam.exe --config-file=<freshclam.conf>` after installation and on a
scheduled deployment task. A missing engine or missing `main.cvd`/`daily.cvd`
is an unavailable scanner state: evidence remains `pending` and OCR must not
run.

The application adapter maps ClamAV exit code `0` to `clean`, `1` to infected,
and every other result (including its 60-second process timeout) to unavailable.
Only the canonical lifecycle endpoint may persist that result; the adapter never
marks an evidence row clean by itself.
