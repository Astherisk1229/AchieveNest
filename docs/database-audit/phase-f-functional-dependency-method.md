# AchieveNest — Phase F: Functional Dependency Methodology

> **Database:** `achievenest_local`  
> **Standards Reference:** Codd's Relational Normalization Formulations (1970–1972)  

---

## 1. Functional Dependency Definition
A functional dependency $X \rightarrow Y$ holds over a relation $R$ if and only if whenever two tuples in $r(R)$ agree on all attributes in $X$, they must also agree on all attributes in $Y$.

## 2. Normal Forms Evaluation Criteria
- **First Normal Form (1NF)**: Every attribute contains only atomic, indivisible values; no repeating groups; each row has a primary determinant key.
- **Second Normal Form (2NF)**: Relation is in 1NF, and every non-prime attribute is fully functionally dependent on the entire primary key (no partial key dependencies). In `achievenest_local`, all 64 tables use single-column primary keys (`id` or `profile_id`), making partial-key dependency structurally impossible.
- **Third Normal Form (3NF)**: Relation is in 2NF, and no non-prime attribute is transitively dependent on the primary key ($X \rightarrow Y$ where $Y$ is non-prime implies $X$ is a superkey).
