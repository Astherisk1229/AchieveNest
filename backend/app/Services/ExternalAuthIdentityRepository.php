<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use DateTimeImmutable;
use DateTimeInterface;
use InvalidArgumentException;
use RuntimeException;

/** Provider-generic persistence boundary for durable external identity links. */
final class ExternalAuthIdentityRepository
{
    private const TABLE = 'external_auth_identities';

    public function __construct(private ?BaseConnection $db = null)
    {
        $this->db ??= db_connect();
    }

    public function findByProviderSubject(string $provider, string $providerSubject): ?array
    {
        return $this->findOne([
            'provider' => $this->provider($provider),
            'provider_subject' => $this->requiredExact($providerSubject, 'PROVIDER_SUBJECT_REQUIRED'),
        ]);
    }

    public function findByProfileAndProvider(string $profileId, string $provider): ?array
    {
        return $this->findOne([
            'profile_id' => $this->requiredExact($profileId, 'PROFILE_ID_REQUIRED'),
            'provider' => $this->provider($provider),
        ]);
    }

    public function insertLink(array $identityData): array
    {
        foreach (['id', 'profile_id', 'provider', 'provider_subject', 'provider_email_snapshot', 'provider_hosted_domain_snapshot', 'link_method', 'linked_at', 'created_at', 'updated_at'] as $field) {
            if (! array_key_exists($field, $identityData)) {
                throw new InvalidArgumentException('EXTERNAL_IDENTITY_FIELD_REQUIRED:' . $field);
            }
        }

        $row = [
            'id' => $this->requiredExact($identityData['id'], 'IDENTITY_ID_REQUIRED'),
            'profile_id' => $this->requiredExact($identityData['profile_id'], 'PROFILE_ID_REQUIRED'),
            'provider' => $this->provider((string) $identityData['provider']),
            'provider_subject' => $this->requiredExact($identityData['provider_subject'], 'PROVIDER_SUBJECT_REQUIRED'),
            'provider_email_snapshot' => $this->requiredTrimmed($identityData['provider_email_snapshot'], 'PROVIDER_EMAIL_REQUIRED'),
            'provider_hosted_domain_snapshot' => $this->nullableTrimmed($identityData['provider_hosted_domain_snapshot']),
            'link_method' => $this->requiredTrimmed($identityData['link_method'], 'LINK_METHOD_REQUIRED'),
            'linked_at' => $this->timestamp($identityData['linked_at']),
            'last_authenticated_at' => array_key_exists('last_authenticated_at', $identityData) && $identityData['last_authenticated_at'] !== null
                ? $this->timestamp($identityData['last_authenticated_at']) : null,
            'created_at' => $this->timestamp($identityData['created_at']),
            'updated_at' => $this->timestamp($identityData['updated_at']),
        ];

        if (! $this->db->table(self::TABLE)->insert($row)) {
            throw new RuntimeException('EXTERNAL_IDENTITY_INSERT_FAILED');
        }

        $inserted = $this->findById($row['id']);
        if ($inserted === null) {
            throw new RuntimeException('EXTERNAL_IDENTITY_INSERT_NOT_FOUND');
        }
        return $inserted;
    }

    public function updateLastAuthenticatedAt(string $identityId, DateTimeInterface|string $authenticatedAt): void
    {
        $timestamp = $this->timestamp($authenticatedAt);
        $this->updateExisting($identityId, ['last_authenticated_at' => $timestamp, 'updated_at' => $timestamp]);
    }

    public function updateProviderSnapshot(
        string $identityId,
        string $providerEmailSnapshot,
        ?string $providerHostedDomainSnapshot,
        DateTimeInterface|string $authenticatedAt
    ): void {
        $timestamp = $this->timestamp($authenticatedAt);
        $this->updateExisting($identityId, [
            'provider_email_snapshot' => $this->requiredTrimmed($providerEmailSnapshot, 'PROVIDER_EMAIL_REQUIRED'),
            'provider_hosted_domain_snapshot' => $this->nullableTrimmed($providerHostedDomainSnapshot),
            'last_authenticated_at' => $timestamp,
            'updated_at' => $timestamp,
        ]);
    }

    private function findOne(array $where): ?array
    {
        $rows = $this->db->table(self::TABLE)->where($where)->limit(2)->get()->getResultArray();
        if (count($rows) > 1) {
            throw new RuntimeException('EXTERNAL_IDENTITY_INTEGRITY_FAILURE');
        }
        return $rows[0] ?? null;
    }

    private function findById(string $identityId): ?array
    {
        return $this->findOne(['id' => $this->requiredExact($identityId, 'IDENTITY_ID_REQUIRED')]);
    }

    private function updateExisting(string $identityId, array $changes): void
    {
        $id = $this->requiredExact($identityId, 'IDENTITY_ID_REQUIRED');
        if (! $this->db->table(self::TABLE)->where('id', $id)->update($changes)) {
            throw new RuntimeException('EXTERNAL_IDENTITY_UPDATE_FAILED');
        }
        if ($this->db->affectedRows() === 0 && $this->findById($id) === null) {
            throw new RuntimeException('EXTERNAL_IDENTITY_NOT_FOUND');
        }
    }

    private function provider(string $provider): string
    {
        $provider = strtolower(trim($provider));
        if ($provider === '') {
            throw new InvalidArgumentException('PROVIDER_REQUIRED');
        }
        return $provider;
    }

    private function requiredExact(mixed $value, string $error): string
    {
        $value = (string) $value;
        if (trim($value) === '') {
            throw new InvalidArgumentException($error);
        }
        return trim($value);
    }

    private function requiredTrimmed(mixed $value, string $error): string
    {
        $value = trim((string) $value);
        if ($value === '') {
            throw new InvalidArgumentException($error);
        }
        return $value;
    }

    private function nullableTrimmed(mixed $value): ?string
    {
        $value = trim((string) ($value ?? ''));
        return $value === '' ? null : $value;
    }

    private function timestamp(DateTimeInterface|string $value): string
    {
        try {
            $date = $value instanceof DateTimeInterface ? $value : new DateTimeImmutable(trim($value));
        } catch (\Throwable) {
            throw new InvalidArgumentException('EXTERNAL_IDENTITY_TIMESTAMP_INVALID');
        }
        return $date->format('Y-m-d H:i:s.u');
    }
}
