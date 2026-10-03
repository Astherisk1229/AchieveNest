<?php

namespace App\Services;

use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\RequestInterface;

final class AuthorizationHeader
{
    /** A nonempty ordinary/provided header is authoritative, even if malformed. */
    public static function fromRequest(RequestInterface $request, ?string $provided = null): string
    {
        foreach ([$provided, $request->getHeaderLine('Authorization')] as $value) {
            if (trim((string) $value) !== '') {
                return trim((string) $value);
            }
        }
        if ($request instanceof IncomingRequest) {
            foreach (['HTTP_AUTHORIZATION', 'REDIRECT_HTTP_AUTHORIZATION'] as $key) {
                $value = trim((string) $request->getServer($key));
                if ($value !== '') {
                    return $value;
                }
            }
        }
        return '';
    }
}
