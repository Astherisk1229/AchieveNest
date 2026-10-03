# Phase 9 Evidence: OSAD Role / Account Switch Navigation Matrix

| Initial Role Context | Target Role Context | Switch Mechanism | Navigation Re-render | Stale Items | Manual Reload Required | Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Personnel** | Program Coordinator | Topbar Profile Accordion | Instant SPA State Update | 0 | **NO** | **PASS** |
| **Personnel** | Organization Moderator | Topbar Profile Accordion | Instant SPA State Update | 0 | **NO** | **PASS** |
| **Personnel** | Dean | Topbar Profile Accordion | Instant SPA State Update | 0 | **NO** | **PASS** |
| **Student** | (Switch Blocked) | Role switch rejected (Account type `student`) | Zero change | 0 | **NO** | **PASS** |
| **OSAD Staff** | (Dedicated Admin) | Fixed OSAD Catalog | Zero change | 0 | **NO** | **PASS** |
| **HR Staff** | (Dedicated Admin) | Fixed HR Catalog | Zero change | 0 | **NO** | **PASS** |
