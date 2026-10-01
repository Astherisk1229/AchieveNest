<?php
namespace App\Database\Testing;

/** CI resolves result objects beside the concrete connection class. */
final class Result extends \CodeIgniter\Database\SQLite3\Result
{
}
