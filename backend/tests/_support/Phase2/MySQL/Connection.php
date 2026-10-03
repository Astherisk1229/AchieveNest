<?php
namespace Tests\Support\Phase2\MySQL;

final class Connection extends \CodeIgniter\Database\MySQLi\Connection
{
    public function connect(bool $persistent = false)
    {
        Instance::authorize();
        if ($this->hostname !== '127.0.0.1' || (int) $this->port !== Instance::PORT
            || $this->database !== Instance::database() || !empty($this->DSN) || !empty($this->failover)) {
            throw new \RuntimeException('PHASE2_DATABASE_CONFIGURATION_REJECTED');
        }
        $connection = parent::connect(false);
        Instance::assertIdentity($connection);
        return $connection;
    }

    protected function execute(string $sql)
    {
        Instance::assertIdentity($this->connID);
        if (preg_match('/\b(?:USE|ATTACH|OUTFILE|DUMPFILE)\b/i', $sql)) {
            throw new \RuntimeException('PHASE2_DATABASE_ESCAPE_REJECTED');
        }
        return parent::execute($sql);
    }
}
