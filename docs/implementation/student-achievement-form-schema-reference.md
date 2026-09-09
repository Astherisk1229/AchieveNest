# AchieveNest — Student Achievement Entry & Dynamic Category-Based Structured Forms
## Form Schema Reference

---

### 1. Schema Architecture Overview

- **Storage Mode**: Configuration-driven dynamic registry (`portfolioFormSchemaRegistry.js`).
- **Schema Resolution Key**: `category_id` + `subcategory_id`.
- **Current Version**: `"schema_version": "1.0"`.
- **Coverage**: Exactly 9 Primary Categories, 57 Subcategories ($100\%$ covered).

---

### 2. Category Distribution & Subcategory Registry

| # | Primary Category Name | UUID | Subcategory Count | Example Subcategories |
|---|---|---|---|---|
| 1 | Leadership Position | `8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646` | 4 | Supreme Student Government, Academic Org Officer, Non-Academic Org Officer, Class Officer |
| 2 | Organization Membership | `c9a6d837-78f4-4516-b2db-d438ae717be5` | 5 | Academic Org Member, Non-Academic Org Member, Institutional Club, External Youth Org, Committee Volunteer |
| 3 | Community Service | `ace24637-66f7-4329-9451-ccc61e18eab9` | 5 | Direct Outreach, Environmental / Clean-up, Literacy / Educational, Advocacy Campaign, Disaster Relief |
| 4 | Church / Ministry | `779a9653-d972-47ce-93dc-cb381150568b` | 4 | Liturgical Ministry, Marist Youth Ministry, Parish Youth Ministry, Religious / Faith Formation |
| 5 | Seminar / Training | `802de57b-54d7-4d38-9433-052ca9636380` | 8 | Leadership Dev, Skills Workshop, Academic Conference, Sports Dev, Socio-Cultural Dev, Spiritual Retreat, Research Forum, Professional Certification |
| 6 | Citation / Recognition | `448beadb-a254-4cb6-84fb-a3d5f4f8822e` | 8 | Academic Honor, Exemplary Leadership Citation, Community Service Citation, Sports Citation, Cultural Artist Award, Journalism Award, External Commendation, Special Campus Recognition |
| 7 | Sports | `2d20d412-bf34-46b4-a21d-d7131d4b514a` | 10 | Basketball, Volleyball, Football / Futsal, Badminton, Table Tennis, Chess, Athletics / Track, Swimming, Martial Arts, Esports |
| 8 | Socio-Cultural / Performing Arts | `6514e620-b5a0-4ff2-9353-0ee8787b5ce6` | 7 | Dance Troupe, Choral / Vocal Music, Instrumental / Band, Theatre / Drama, Visual Arts, Literary Arts, Pageantry / Cultural Modeling |
| 9 | Campus Journalism | `2b09cd61-7a23-4466-be58-889398e8f201` | 6 | News Writing, Feature Writing, Editorial / Opinion, Literary Writing, Photojournalism, Editorial Board Leadership |

Total Subcategories: **57**.
Total Primary Categories: **9**.
Forbidden Top-Level Categories: **0**.
