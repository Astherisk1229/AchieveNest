import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Download, QrCode } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../../../components/ui/dialog'

/**
 * Shows the student's attendance QR code.
 * The QR encodes ONLY the student's institutional ID — the exact value the
 * organization scanner (parseScannedIdentifier) and the check-in API
 * (profiles.institutional_id) already expect. No names, tokens, or URLs.
 */
export default function StudentAttendanceQrModal({ open, onOpenChange, studentId, fullName }) {
  const [dataUrl, setDataUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !studentId) return undefined
    let active = true
    setError('')
    QRCode.toDataURL(String(studentId), {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 512,
      color: { dark: '#000000', light: '#FFFFFF' }
    })
      .then(url => { if (active) setDataUrl(url) })
      .catch(() => { if (active) setError('Your QR code could not be generated. Please try again.') })
    return () => { active = false }
  }, [open, studentId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2">
            <QrCode className="w-5 h-5 text-[#16834a]" />
            My Attendance QR
          </DialogTitle>
          <DialogDescription>
            Show this code to the organization officer when you attend an event.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3">
          {error ? (
            <p role="alert" className="text-xs font-bold text-rose-700">{error}</p>
          ) : dataUrl ? (
            <img
              src={dataUrl}
              alt={`Attendance QR code for student ${studentId}`}
              className="w-56 h-56 rounded-xl border border-[#dde3dd] bg-white p-1"
            />
          ) : (
            <div className="w-56 h-56 rounded-xl border border-[#dde3dd] bg-slate-50 animate-pulse" />
          )}

          <div className="space-y-0.5">
            {fullName && <p className="text-sm font-extrabold text-[#123D2A] dark:text-white">{fullName}</p>}
            <p className="text-xs font-bold text-[#3F6B52] dark:text-slate-400 tracking-wide">{studentId}</p>
          </div>

          {dataUrl && (
            <a
              href={dataUrl}
              download={`attendance-qr-${studentId}.png`}
              className="inline-flex items-center justify-center gap-1.5 h-8 px-3 text-[11px] font-bold rounded-lg bg-white text-[#145C39] border border-[#69A97C] hover:bg-[#EAF4EC] hover:border-[#16834A] dark:bg-[#131e2e] dark:text-slate-200 dark:border-slate-800 shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              Save as image
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
