# Phase D2-2: Recommendation vs Current Rank Separation

## State Model Distinction
In both `OnboardPersonnelModal.jsx` and `EditMasterDataModal.jsx`, the data model explicitly decouples two independent state structures:

```javascript
// 1. Authoritative Persisted Rank
const [formData, setFormData] = useState({
  current_academic_rank: 'ASST_1', // Authoritative rank ID
  // ... other form fields
});

// 2. Advisory Derived Recommendation
const [recommendationState, setRecommendationState] = useState({
  status: 'idle', // 'idle' | 'loading' | 'resolved' | 'error' | 'no_match'
  recommendedCode: null,
  recommendedLabel: null,
  source: 'plan_e',
  reasonCode: null,
  helperText: '',
  sequenceId: 0
});
```

## Architectural Rationale
- **Authoritative Rank**: Represents the official Personnel record that will be committed to the database on form submission.
- **Advisory Recommendation**: Represents real-time guidance produced by Plan E resolver logic.
- Keeping these states strictly separated ensures that recommendation updates never cause side effects on the authoritative state for existing personnel records.
