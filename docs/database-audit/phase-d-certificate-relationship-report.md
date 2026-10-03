# AchieveNest — Phase D: Certificate Domain Relationship Report

> **Domain:** Certificate Template Families, Versions, Batches, and Issued Certificates  

---

1. `certificate_template_families (1)` $\rightarrow$ `(N) certificate_template_versions`
2. `certificate_template_versions (1)` $\rightarrow$ `(N) certificate_issuance_batches`
3. `certificate_issuance_batches (1)` $\rightarrow$ `(N) issued_certificates` $\leftarrow$ `(1) profiles (recipient)`
