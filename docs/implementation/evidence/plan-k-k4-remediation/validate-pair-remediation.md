# validatePair() Remediation Evidence

- Removed `non_teaching_personnel` from active normalization in `validatePair()`.
- Calls passing `non_teaching_personnel` to active validation receive `['valid' => false, 'error' => ['code' => 'INVALID_PERSONNEL_CLASSIFICATION']]`.
- Protects Plan D1 two-group canonical active model.
