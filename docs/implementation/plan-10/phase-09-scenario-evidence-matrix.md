# PLAN 10 — Phase 9 Scenario & Evidence Matrix
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. 60-Scenario Verification & Evidence Log

| Scenario # | Scenario Description | Tested Subject | Test Method | Observed Result | Verdict |
|---|---|---|---|---|---|
| **1** | Short Student Name & ID | `Ana Lim` [`101`] | Unit / DOM | Aligns cleanly without empty gap distortion | **PASS** |
| **2** | Long Student Name & ID | `Juan Carlos De La Cruz Del Rosario III` | Unit / DOM | Two-line clean wrapping, ID preserved | **PASS** |
| **3** | Long Program Label | `BS Information Technology (Enterprise Track)` | Unit / DOM | Wraps within cell, keeps College badge visible | **PASS** |
| **4** | CEAC Master Color | `colleges.acronym_badge_color` | Database / API | `#371683` verified from server record | **PASS** |
| **5** | All Configured Colleges | 6 Database Colleges | PHP Test Script | 6/6 colleges render with correct color or fallback | **PASS** |
| **6** | Very Light Color | `#FACC15` (Bright Yellow) | WCAG Contrast | Resolves to `#0F172A` (Slate 900) dark text | **PASS** |
| **7** | Very Dark Color | `#371683` (CEAC Purple) | WCAG Contrast | Resolves to `#FFFFFF` (Pure White) light text | **PASS** |
| **8** | Malformed Color | `'not-a-hex'` | Sanitization | Replaces with fallback `#16834A` | **PASS** |
| **9** | Missing Color | `NULL` | Sanitization | Replaces with fallback `#16834A` | **PASS** |
| **10** | College Color Accessibility | WCAG AA Contrast | Vitest Helper | Exceeds 4.5:1 ratio across all badge styles | **PASS** |
| **11** | Pending First Login UX | `must_change_password=1` | Component / Contract | Renders Amber badge + enables reset PWD | **PASS** |
| **12** | Active UX | `must_change_password=0` | Component / Contract | Renders Emerald badge + hides temp credential | **PASS** |
| **13** | Locked UX | `status='locked'` | Component / Contract | Renders Rose badge | **PASS** |
| **14** | Disabled / Suspended UX | `status='suspended'` | Component / Contract | Renders Slate badge | **PASS** |
| **15** | Archived UX | `status='archived'` | Component / Contract | Renders Neutral Slate badge | **PASS** |
| **16** | Unknown Status Fallback | Unsupported string | Component / Contract | Renders Neutral Gray badge, suppresses mutations | **PASS** |
| **17** | Status Color Independence | Plain visible text | Visual Inspection | Every badge legible without color | **PASS** |
| **18** | Student With Organization | Extracurricular link | Data model | Displayed inside View Details modal | **PASS** |
| **19** | Student Without Organization | `NULL` Organization | Data model | Renders cleanly without row crash | **PASS** |
| **20** | Desktop 4-Column Layout | Viewport `>= 1280px` | Browser / CSS | Fits ~820px, 0 horizontal scroll | **PASS** |
| **21** | Laptop Layout | Viewport `1024px - 1279px` | Browser / CSS | Fits container, 0 horizontal scroll | **PASS** |
| **22** | Tablet Layout | Viewport `768px - 1023px` | Browser / CSS | Compact padding, 4 columns preserved | **PASS** |
| **23** | Small-Screen Layout | Viewport `< 768px` | Mobile Card Stack | 4 essential criteria preserved on card stack | **PASS** |
| **24** | Row Height Consistency | Mixed content lengths | CSS Inspection | Predictable height across rows | **PASS** |
| **25** | Badge Density Contract | Badge count per row | DOM Inspection | Only College and Account Status badges | **PASS** |
| **26** | Keyboard-Only Navigation | Tab, Enter, Space, Escape | Vitest / DOM | 100% accessible via keyboard | **PASS** |
| **27** | Screen-Reader Labels | `aria-label` attributes | DOM Inspection | Accessible names for triggers & modals | **PASS** |
| **28** | Nested Interaction Safety | Action button clicks | `stopPropagation` | 0 navigation collisions | **PASS** |
| **29** | Search Regression | Toolbar Search Input | State / Filter | Instant search with result metrics | **PASS** |
| **30** | Filter Regression | College / Program / Year | State / Filter | Multi-parameter AND filtering verified | **PASS** |
| **31** | Sort Regression | Sort by Name / ID | State / Sort | Column sort toggles asc/desc | **PASS** |
| **32** | Pagination Regression | 25 rows per page | State / Pagination | 5 pages, auto-corrected out-of-bounds | **PASS** |
| **33** | Result Count Regression | Footer metrics text | DOM Inspection | Matches 103 total / filtered counts | **PASS** |
| **34** | Enrollment Column Absence | Default table headers | Component Contract | Enrollment absent from default table | **PASS** |
| **35** | Enrollment Detail Access | View Details Modal | Modal Inspection | Present as "Enrolled" in modal | **PASS** |
| **36** | Status vs Enrollment Split | Lifecycle vs Registrar | Semantic Contract | Strict separation maintained | **PASS** |
| **37** | Row Mutation Refresh | Password Reset | Service / Hook | Calls `fetchStudentAccounts()` | **PASS** |
| **38** | Query State Preservation | Active filters on refetch | State Handler | Search & filter inputs preserved | **PASS** |
| **39** | Mutation Failure Handling | API 500 Simulation | Error State | Keeps table healthy, shows toast | **PASS** |
| **40** | Post-Commit Refresh Error | Refresh failure hook | Banner Component | Offers "Retry List" without resubmit | **PASS** |
| **41** | Loading State | In-flight request | Skeleton / Spinner | Animated spinner with layout hold | **PASS** |
| **42** | True Empty State | 0 total records | Component State | "No student accounts created yet" + CTA | **PASS** |
| **43** | Filtered Empty State | 0 matching records | Component State | "No matches found" + Clear Filters | **PASS** |
| **44** | List Request Failure | HTTP 500 error | Error Banner | Rose banner + Retry button | **PASS** |
| **45** | Permission Denied | HTTP 403 error | Security Guard | Access denied, 0 data leaked | **PASS** |
| **46** | Row Action Error | Localized action error | Error Handling | Table remains usable | **PASS** |
| **47** | Zero Password in Cells | DOM Inspection | Security Scan | 0 plaintext passwords in table | **PASS** |
| **48** | Zero Password in Details | Modal DOM Inspection | Security Scan | 0 passwords in details modal | **PASS** |
| **49** | Zero Password in Tooltips | Title / description scan | Security Scan | 0 credentials in tooltips | **PASS** |
| **50** | Linked College Refresh | Master Data Sync | Service Query | Dynamic binding updates badge color | **PASS** |
| **51** | Desktop/Mobile Parity | Shared server list | Data Model | Exact same records rendered | **PASS** |
| **52** | Zero Client Relational Joins| Codebase Scan | Architecture | 0 client-side loop joins | **PASS** |
| **53** | Zero Hardcoded Color Maps | Codebase Scan | Code Quality | 0 hard-coded color dictionaries | **PASS** |
| **54** | Zero Duplicate Status Maps | Codebase Scan | Code Quality | Single centralized helper | **PASS** |
| **55** | Fallback on Invalid Color | Malformed hex string | Sanitization | Replaces with `#16834A` | **PASS** |
| **56** | Legacy Row Compatibility | Missing optional fields | Backward Compat | Safely renders historical records | **PASS** |
| **57** | Overflow Menu Long Content | Long student row | DOM Inspection | Menu opens without clipping | **PASS** |
| **58** | Browser Text Scaling | 125% - 150% Zoom | Layout Inspection | Controls remain reachable | **PASS** |
| **59** | High Density Page Load | 103 Student Records | Rendering Audit | Fast rendering, stable row rhythm | **PASS** |
| **60** | Full Reload Parity | Browser Reload | State Sync | API response matches initial load | **PASS** |
