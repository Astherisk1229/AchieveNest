# AchieveNest — Plan 03 Phase 7 Browser Interaction Evidence

## 1. Student Accounts Directory Interaction Checks

- **Directory Table View**:
  - 10-column table rendered properly on standard viewports (>= 768px).
  - Sortable column headers (`Name`, `Student ID`) toggle between ascending and descending order.
  - Hover states on rows provide clear visual feedback without flicker.

- **Search Behavior**:
  - Typing in search input filters table in real time with substring matching across Name, ID, Email, and Degree Program.
  - Clear button (`X`) immediately resets search text and restores previous filtered set.

- **Advanced Filters Panel**:
  - `College` select narrows directory and filters available degree programs in `Program` select.
  - `Year Level`, `Sex`, and `Account Status` selects combine with logical AND semantics.
  - `Reset Filters` button appears when active filters > 0 and restores defaults in a single click.

- **Mobile Card Stack (< 768px)**:
  - Table collapses into elegant mobile cards containing Name, ID, College badge, Status badge, Program, Year Level, Sex, and direct action buttons.

- **Contextual Action Menus**:
  - `MoreVertical` button opens clean dropdown menu with `View Portfolio` and `Reset Password`.
  - Pressing `Escape` or clicking outside immediately closes the active action menu.

- **Portfolio Modal**:
  - Displays student header with initials avatar, degree program, and verified accomplishments with points and dates.
  - `Escape` key and backdrop click close the modal safely.

- **Password Reset Modal**:
  - Displays student name and ID.
  - Random password generator generates unique temporary credentials (`NDMU-StdXXXX!`).
  - Copy button copies generated password to clipboard with a brief confirmation message.
  - Discard confirmation dialog triggers if modal is closed with unsubmitted modifications.
