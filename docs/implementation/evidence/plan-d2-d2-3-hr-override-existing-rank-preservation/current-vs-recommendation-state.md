# Phase D2-3: Current Rank vs Recommendation State Model

## State Architecture
Phase D2-3 strictly decouples authoritative persisted state from advisory qualification recommendation state in both onboarding and edit workflows:

```javascript
// 1. Authoritative Form State
const [form, setForm] = useState({
  currentRankTitle: savedOfficialRank, // Form-bound official value
  // ... other personnel fields
})

// 2. Invariant Tracking
const [savedOfficialRank, setSavedOfficialRank] = useState(savedRank)
const [rankWasManuallyChanged, setRankWasManuallyChanged] = useState(false)
const [rankSelectionSource, setRankSelectionSource] = useState('saved') // 'saved' | 'recommended' | 'manual' | 'legacy'

// 3. Advisory Recommendation State
const [recommendation, setRecommendation] = useState({
  status: 'idle', // 'idle' | 'loading' | 'resolved' | 'unresolved' | 'error'
  recommendedCode: null,
  recommendedLabel: null,
  reasonCode: null,
  message: null,
  source: 'plan_e'
})
```

## Invariant Guarantees
- The advisory recommendation object never overwrites `form.currentRankTitle` on existing records.
- User selection source is tracked accurately through `getRankSelectionSource`.
