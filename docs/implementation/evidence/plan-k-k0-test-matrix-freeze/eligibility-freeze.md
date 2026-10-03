# Ranking Evaluation Eligibility Freeze — Plan K Phase K0

## Core Invariants

1. **Part-Time Exclusion**:
   - Part-Time Faculty (`part_time_faculty`) are mapped to qualification-based titles (`Lecturer` $\dots$ `Professorial Lecturer`) but are **strictly excluded** from ranking evaluation and promotion progression.
2. **Full-Time Evaluation Precondition**:
   - Full-Time Faculty (`full_time_faculty`) are not automatically evaluated.
   - Evaluation initiation requires `subject_to_evaluation = true` on the personnel profile.
3. **Evaluation Frequency**:
   - Exactly one ranking evaluation may exist per personnel profile per active academic evaluation cycle.
4. **Annual Review Algorithm Boundary**:
   - The exact automated metric computation determining `subject_to_evaluation` remains an external institutional formula and is preserved as an unresolved boundary rather than guessed.
