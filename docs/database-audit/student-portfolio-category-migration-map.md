# AchieveNest — Student Portfolio Category Migration Map

> **Database:** `achievenest_local`  
> **Status:** Pure Authoritative Taxonomy — Zero Remapping Required  

---

## Deterministic Taxonomy Mapping

| Source Classification | Final Primary Category | Final Subcategory | Deterministic? | Migration Rule | Status |
|---|---|---|:---:|---|:---:|
| Leadership Seminar / Training | Seminar / Training | Leadership Development | YES | Direct mapping to Seminar / Training subcategory | **NO_CHANGE** |
| Sports Clinic / Workshop | Seminar / Training | Sports Development | YES | Direct mapping to Seminar / Training subcategory | **NO_CHANGE** |
| Socio-Cultural Workshop | Seminar / Training | Socio-Cultural / Performing Arts Development | YES | Direct mapping to Seminar / Training subcategory | **NO_CHANGE** |
| Competition Placement / Result | Sports or Socio-Cultural | Relevant Category + Structured Metadata | YES | Placement (`Champion`, `1st Runner Up`) stored in `metadata` | **NO_CHANGE** |
| Campus Journalism Articles | Campus Journalism | News, Column, Editorial, etc. | YES | Publication details stored in structured `metadata` | **NO_CHANGE** |
