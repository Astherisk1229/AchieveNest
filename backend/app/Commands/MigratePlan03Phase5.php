<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class MigratePlan03Phase5 extends BaseCommand
{
    protected $group       = 'Database';
    protected $name        = 'db:migrate-phase5';
    protected $description = 'Applies Plan 03 Phase 5 schema alignment adding profiles.sex';

    public function run(array $params)
    {
        $db = db_connect();

        CLI::write("=== Plan 03 Phase 5 Schema Alignment ===", 'yellow');

        $fields = $db->getFieldData('profiles');
        $hasSex = false;
        foreach ($fields as $field) {
            if (strtolower($field->name) === 'sex') {
                $hasSex = true;
                break;
            }
        }

        if (! $hasSex) {
            CLI::write("Adding column 'sex' VARCHAR(20) NULL to 'profiles' table...", 'yellow');
            $db->query("ALTER TABLE profiles ADD COLUMN sex VARCHAR(20) NULL AFTER full_name");
            CLI::write("Column 'sex' successfully added to 'profiles'.", 'green');
        } else {
            CLI::write("Column 'sex' already exists in 'profiles'.", 'green');
        }

        // Verify column structure
        $fieldsAfter = $db->getFieldData('profiles');
        $verified = false;
        foreach ($fieldsAfter as $field) {
            if (strtolower($field->name) === 'sex') {
                $verified = true;
                CLI::write("Verified column 'sex': Type={$field->type}, Nullable={$field->nullable}", 'green');
                break;
            }
        }

        if ($verified) {
            CLI::write("Migration completed successfully.", 'green');
        } else {
            CLI::error("Migration failed to verify 'sex' column.");
        }
    }
}
