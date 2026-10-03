# Personnel Evaluation Track — Plan G — Phase G1: Routing Resolution Tests

## Authoritative Routing Resolution Results

| Personnel Profile / Position | Personnel Classification Context | Resolved Reviewer Role | Assigned Evaluator Actor | Reason Code | Routing Reason |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Faculty Member (CEAC) | `faculty` + `academic` | `dean` | `USER-DEAN-CEAC` | `route_assigned` | Faculty + Academic routes to active Dean of assigned college. |
| Non-Teaching Faculty (CBA) | `non_teaching_faculty` + `academic` | `dean` | `USER-DEAN-CBA` | `route_assigned` | Non-Teaching Faculty + Academic routes to active Dean of assigned college. |
| Non-Teaching Staff | `non_teaching_faculty` + `non_academic` | `hr_staff` | `USER-HR-1` | `route_assigned` | Non-Teaching Faculty + Non-Academic routes to HR Office. |
| College Dean (CEAC) | `faculty` + `academic` (`is_dean=true`) | `hr_staff` | `USER-HR-1` | `route_assigned` | Dean evaluation routes authoritatively to HR. |
| VP for Academics | `faculty` + `academic` (`is_vp_academics=true`) | `hr_staff` | `USER-HR-1` | `route_assigned` | VP for Academics evaluation routes authoritatively to HR. |
| VP for Administration | `non_teaching_faculty` + `non_academic` (`is_vp_administration=true`) | `hr_staff` | `USER-HR-1` | `route_assigned` | VP for Administration evaluation routes authoritatively to HR. |
