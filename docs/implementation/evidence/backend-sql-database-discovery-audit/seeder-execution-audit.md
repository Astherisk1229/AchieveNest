# Seeder Execution Discovery

### Seeders Available
1. `LocalDefenseAuthSeeder.php` — Seeds default admin, dean, HR, and coordinator credentials.
2. `DemoAcademicStructureSeeder.php` — Seeds authoritative Colleges and Administrative Units.
3. `DefenseDemoPersonaSeeder.php` — Seeds Personnel Evaluation personas (P1–P7).
4. `DefenseDemoScenarioSeeder.php` — Seeds demo evaluation scenarios, submissions, and reviews.
5. `DefenseDemoSeeder.php` — Master composite runner executing all seeders in correct foreign-key sequence.

### Execution Command
```bash
cd backend
php spark db:seed DefenseDemoSeeder
```
