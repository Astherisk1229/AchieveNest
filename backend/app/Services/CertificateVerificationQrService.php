<?php

namespace App\Services;

use Endroid\QrCode\Color\Color;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\RoundBlockSizeMode;
use Endroid\QrCode\Writer\PngWriter;
use InvalidArgumentException;

final class CertificateVerificationQrService
{
    private PngWriter $writer;

    public function __construct(?PngWriter $writer = null)
    {
        $this->writer = $writer ?? new PngWriter();
    }

    public function generatePng(string $url, int $size = 200, int $margin = 8): string
    {
        $payload = trim($url);
        if ($payload === '') {
            throw new InvalidArgumentException('Verification URL payload cannot be empty.');
        }

        $qrCode = new QrCode(
            data: $payload,
            encoding: new Encoding('UTF-8'),
            errorCorrectionLevel: ErrorCorrectionLevel::Medium,
            size: $size,
            margin: $margin,
            roundBlockSizeMode: RoundBlockSizeMode::Margin,
            foregroundColor: new Color(20, 20, 20),
            backgroundColor: new Color(255, 255, 255)
        );

        $result = $this->writer->write($qrCode);
        return $result->getString();
    }

    public function generateDataUri(string $url, int $size = 200, int $margin = 8): string
    {
        $payload = trim($url);
        if ($payload === '') {
            throw new InvalidArgumentException('Verification URL payload cannot be empty.');
        }

        $qrCode = new QrCode(
            data: $payload,
            encoding: new Encoding('UTF-8'),
            errorCorrectionLevel: ErrorCorrectionLevel::Medium,
            size: $size,
            margin: $margin,
            roundBlockSizeMode: RoundBlockSizeMode::Margin,
            foregroundColor: new Color(20, 20, 20),
            backgroundColor: new Color(255, 255, 255)
        );

        $result = $this->writer->write($qrCode);
        return $result->getDataUri();
    }
}
