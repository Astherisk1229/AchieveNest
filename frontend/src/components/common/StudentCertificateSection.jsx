import React, { useState } from 'react'
import {
  Award,
  Download,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  Calendar,
  Loader2,
  CheckCircle2,
  FileText
} from 'lucide-react'
import portfolioService from '../../services/portfolioService'

/**
 * StudentCertificateSection.jsx
 * Dedicated, authoritative lifecycle viewer for student achievement certificates.
 */
export default function StudentCertificateSection({
  certificate,
  onRefetch,
  className = ''
}) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState(null)

  if (!certificate || !certificate.status) {
    return null
  }

  const status = certificate.status.toUpperCase()
  const isIssued = status === 'ISSUED'
  const isRevoked = status === 'REVOKED'
  const isSuperseded = status === 'SUPERSEDED'

  const formattedDate = certificate.issued_at
    ? new Date(certificate.issued_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : null

  const handleDownload = async () => {
    if (!certificate.downloadable || !certificate.pdf_url || isDownloading) return
    setIsDownloading(true)
    setDownloadError(null)
    try {
      await portfolioService.downloadCertificatePdf(
        certificate.pdf_url,
        certificate.certificate_number
      )
    } catch (err) {
      setDownloadError(err.message || 'Failed to download certificate PDF.')
      if (err.status === 409 && typeof onRefetch === 'function') {
        onRefetch()
      }
    } finally {
      setIsDownloading(false)
    }
  }

  const handleVerify = (url) => {
    const targetUrl = url || certificate.verification_url
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div
      className={`rounded-2xl border transition overflow-hidden ${
        isIssued
          ? 'bg-[#eef7f0] border-[#cbe6d2]'
          : isRevoked
            ? 'bg-rose-50/70 border-rose-200'
            : 'bg-amber-50/70 border-amber-200'
      } ${className}`}
    >
      {/* Header Banner */}
      <div className="p-4 flex flex-wrap items-center justify-between gap-3 border-b border-inherit">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
              isIssued
                ? 'bg-white text-[#16834a] border border-[#cbe6d2]'
                : isRevoked
                  ? 'bg-white text-rose-600 border border-rose-200'
                  : 'bg-white text-amber-600 border border-amber-200'
            }`}
          >
            {isIssued ? (
              <ShieldCheck className="w-5 h-5 text-[#16834a]" />
            ) : isRevoked ? (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            ) : (
              <RotateCcw className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">
                OFFICIAL CERTIFICATE
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                  isIssued
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : isRevoked
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                {isIssued ? 'Issued' : isRevoked ? 'Revoked' : 'Superseded'}
              </span>
            </div>
            <h5 className="font-extrabold text-slate-900 text-sm font-mono mt-0.5">
              {certificate.certificate_number || 'Official Issuance'}
            </h5>
          </div>
        </div>

        {formattedDate && (
          <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Conferred {formattedDate}</span>
          </div>
        )}
      </div>

      {/* Body / Lifecycle Notice */}
      <div className="p-4 space-y-3 text-xs">
        {isRevoked && (
          <div className="p-3 rounded-xl bg-white/80 border border-rose-200 text-rose-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Certificate Revoked</span>
            </div>
            <p className="text-[11px] text-rose-700 font-medium leading-relaxed">
              This certificate was officially revoked and is no longer valid or downloadable.
              You can verify its historical record status using the public verification link below.
            </p>
          </div>
        )}

        {isSuperseded && (
          <div className="p-3 rounded-xl bg-white/80 border border-amber-200 text-amber-900 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Certificate Superseded</span>
            </div>
            <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
              This certificate issuance has been superseded by an updated version. PDF download is disabled for historical copies.
            </p>
            {certificate.replacement && (
              <div className="pt-1.5 border-t border-amber-100 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-amber-900">
                  Replacement Certificate: <strong className="font-mono">{certificate.replacement.certificate_number}</strong>
                </span>
                {certificate.replacement.verification_url && (
                  <button
                    type="button"
                    onClick={() => handleVerify(certificate.replacement.verification_url)}
                    className="text-[11px] font-bold text-[#16834a] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Replacement</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {isIssued && certificate.previous_certificate && (
          <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-emerald-900 text-[11px] flex items-center justify-between gap-2">
            <span>
              ℹ️ <strong>Replacement Issuance:</strong> Replaces superseded certificate #{certificate.previous_certificate.certificate_number}.
            </span>
            {certificate.previous_certificate.verification_url && (
              <button
                type="button"
                onClick={() => handleVerify(certificate.previous_certificate.verification_url)}
                className="text-[10px] font-bold text-emerald-800 hover:underline shrink-0"
              >
                View History
              </button>
            )}
          </div>
        )}

        {downloadError && (
          <div className="p-2.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{downloadError}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            {certificate.verification_url && (
              <button
                type="button"
                onClick={() => handleVerify()}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                title="Verify certificate authenticity on official public portal"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Verify Certificate</span>
              </button>
            )}
          </div>

          {certificate.downloadable && certificate.pdf_url && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-3.5 py-1.5 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              title="Download authenticated PDF copy"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
