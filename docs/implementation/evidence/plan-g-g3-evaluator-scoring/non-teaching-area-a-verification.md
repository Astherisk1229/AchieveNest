# Non-Teaching Area A Rating Verification

## Evaluator-Only Official Area A Input Workflow

Non-Teaching Personnel Ranking Scale Area A (Performance and Personal Indicators) is an official evaluator-only rating section totaling 90 points.

### Component Maximums & Validations:
1. **Job Performance**:
   - Maximum: `50.0` points
   - Valid input: `48.0` -> **Accepted**
   - Out-of-bounds input: `55.0` -> **Rejected**: `"Job Performance points [55] exceeds allowed range [0 - 50]."`
2. **Personal Attitudes and Qualities**:
   - Maximum: `10.0` points
   - Valid input: `9.0` -> **Accepted**
   - Out-of-bounds input: `15.0` -> **Rejected**: `"Personal Attitudes and Qualities points [15] exceeds allowed range [0 - 10]."`
3. **Efficiency & Punctuality**:
   - Maximum: `30.0` points
   - Valid input: `28.0` -> **Accepted**
   - Out-of-bounds input: `35.0` -> **Rejected**
4. **Total Area A Cap**:
   - Maximum: `90.0` points
5. **Scale Scoping**:
   - Attempting to submit Area A ratings on an Administrators scale evaluation -> **Rejected**: `"Area A evaluator ratings only apply to Non-Teaching Personnel Ranking Scale."`
6. **No Unsupported Formulas**:
   - Area A records official scores without inferring unsupported mathematical conversions.
