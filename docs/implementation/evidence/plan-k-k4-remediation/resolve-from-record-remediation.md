# resolveFromRecord() Remediation Evidence

- Removed hardcoded fallback to `non_teaching_faculty` + `non_academic`.
- Legacy rows without canonical fields invoke `resolveLegacyPlacement()`.
- If placement evidence is absent or conflicting, returns `['valid' => false, 'unresolved' => true, 'group' => null, 'side' => null]`.
- Prevents silent misrouting of ambiguous legacy records to HR or Dean.
