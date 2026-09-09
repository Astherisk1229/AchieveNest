# Service Guard Matrix

| Mutation/read | Guard/service | Persistence |
|---|---|---|
| Reviewer access/score | Reviewer assignment, workspace, scoring services | evaluation/items |
| Evidence read/delete | Evidence access/versioning services | evidence rows/storage |
| Promotion | Promotion decision/rank progression services | evaluation/rank history |
| Finalization | readiness/final-lock services | evaluation lock/result |
| Audit access/change | audit service | append-only events |

All listed guard classes execute server-side in backend counterparts; frontend visibility alone was not accepted as proof.
