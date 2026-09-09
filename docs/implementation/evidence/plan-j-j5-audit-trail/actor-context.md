# Actor & Context Persistence Evidence

### Captured Actor Properties
- `actor_user_id`: Authenticated user ID (or `system` for automated events).
- `actor_role`: Institutional role at the time of the action (`Personnel`, `Dean`, `HR`, `System`).
- `actor_context`: Additional situational attributes such as `college_scope`, `department`, `session_ip`, and `assignment_role`.

### Security Note
Actor fields are never inferred from UI routes or client query parameters; they are resolved strictly from authenticated session claims.
