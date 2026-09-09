# AchieveNest — Phase D: Event & Attendance Relationship Report

> **Domain:** Campus Events, Sessions, and Student Attendance  

---

1. **Event Sessions**: `events (1)` $\rightarrow$ `(N) attendance_sessions`
2. **Session Attendance**: `attendance_sessions (1)` $\rightarrow$ `(N) attendance_records` $\leftarrow$ `(1) profiles (student)`
