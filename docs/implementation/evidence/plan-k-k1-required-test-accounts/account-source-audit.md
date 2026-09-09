# Account Creation Source Audit

### Mechanism Selected
- **Source**: Automated frontend test persona module at `frontend/src/test/personnelPlanKPersonas.js` and companion backend persona seeders in `backend/app/Database/Seeds/DefenseDemoPersonaSeeder.php`.
- **Minimality**: Strictly 10 personas prepared (P1–P7, P-SEC, P-LEG-SUPPORTED, P-LEG-AMBIGUOUS), matching exactly the 39 frozen K0 acceptance matrix cases.
- **Least Invasive Pattern**: Memory-isolated synthetic session tokens with verified claims.
