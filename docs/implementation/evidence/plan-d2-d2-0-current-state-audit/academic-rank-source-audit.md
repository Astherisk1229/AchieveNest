# Academic Rank Source Audit — Plan D2 Phase D2-0

### Current State Classification: **FREE-TEXT WITH BROKEN CATALOG BINDING**

1. **Frontend Input Mode**:
   - `OnboardPersonnelModal.jsx`: `<input type="text" name="currentRankTitle" ... />`
   - `EditMasterDataModal.jsx`: `<input type="text" value={formData.current_rank_title} ... />`
   - Neither modal fetches or binds options from the Plan E backend rank catalog (`faculty_rank_catalog`).

2. **Persistence Format**:
   - Column: `current_rank_title` (`VARCHAR(255)` / nullable) in `personnel_profiles` table.
   - Values are stored as plain string titles (e.g. `"Assistant Professor I"`, `"Associate Professor II"`).

3. **Risk & Impact**:
   - Typographical errors in manual rank entry.
   - Missing link between stored string and Plan E stable codes (`code`), rank order (`order_index`), and qualification tiers.
   - Inability to enforce strict progression or automated eligibility verification without normalization.
