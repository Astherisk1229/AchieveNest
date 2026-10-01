<?php
namespace App\Database\Testing;

/** CI resolves the builder beside the concrete connection class. */
final class Builder extends \CodeIgniter\Database\SQLite3\Builder
{
}
