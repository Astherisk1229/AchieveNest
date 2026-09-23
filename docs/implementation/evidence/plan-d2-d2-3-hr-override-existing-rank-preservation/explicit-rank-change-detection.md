# Phase D2-3: Explicit Rank Change Detection

## Dirty Checking & Classification
`TargetHRPersonnelController.php` detects whether the submitted rank differs from the saved rank:

```php
$priorRank = $currentPersonnel['current_rank_title'] ?? ($currentPersonnel['rank_level'] ?? '');
$newRank = $validation['current_rank_title'];
$isRankChanged = ($priorRank !== $newRank);
```

### Unchanged Rank Behavior
- If `$isRankChanged` is false, master data updates proceed as standard profile updates without rank progression side effects.

### Changed Rank Behavior
- If `$isRankChanged` is true, server validates the new value against active catalogs and logs the transition in the audit trail with explicit `prior_rank` and `new_rank`.
