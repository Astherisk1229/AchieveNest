/**
 * PublicCertificateVerificationPage.jsx
 * Public Unauthenticated Certificate Verification Page.
 * Route: /verify/certificate/:publicId
 */

import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShieldCheck, QrCode, AlertTriangle, CheckCircle2, Home, ExternalLink } from 'lucide-react'
import CertificateIssuanceController from '../../controllers/CertificateIssuanceController'

export default function PublicCertificateVerificationPage() {
  const { publicId } = useParams()
  const cert = CertificateIssuanceController.getPublicCertificate(publicId)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-4 font-sans text-slate-800 dark:text-slate-200">
      
      {/* Header Bar */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#EFF7F0] dark:bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            AN
          </div>
          <div>
            <span className="font-black text-sm text-slate-900 dark:text-white tracking-tight block">AchieveNest</span>
            <span className="text-[10px] font-extrabold text-[#16834a] dark:text-emerald-400 uppercase tracking-wider block">Public Verification Portal</span>
          </div>
        </Link>

        <Link
          to="/"
          className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-900 transition flex items-center gap-1.5"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
      </header>

      {/* Main Verification Card */}
      <main className="max-w-2xl w-full mx-auto my-auto space-y-6">
        
        {cert ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6 text-center">
            
            {/* Status Badge & Header */}
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <ShieldCheck className="w-9 h-9" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-[#245F42] text-xs font-extrabold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>OFFICIAL VERIFIED CREDENTIAL • {cert.status}</span>
              </div>

              <h1 className="text-2xl font-serif font-black text-slate-900 dark:text-white tracking-tight pt-1">
                {cert.templateTitle || 'Certificate of Completion'}
              </h1>
              <p className="text-xs font-mono font-bold text-slate-500">
                Institution Serial No: <span className="text-slate-900 dark:text-white font-extrabold">{cert.serialNumber}</span>
              </p>
            </div>

            {/* Recipient Details Summary Table */}
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-left space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500 font-bold">Recipient Name</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{cert.studentName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500 font-bold">Student ID</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{cert.studentId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500 font-bold">Event Title</span>
                <span className="font-bold text-emerald-800 dark:text-[#245F42]">{cert.eventTitle}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500 font-bold">Issuing Organization</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{cert.organizationName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500 font-bold">OSAD Template Code</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{cert.templateCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Issuance Timestamp</span>
                <span className="text-slate-700 dark:text-slate-300 font-bold">{new Date(cert.issuedAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Institution Authenticity Footer Note */}
            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-slate-600 dark:text-slate-400 text-center">
              This credential has been authenticated directly against the Notre Dame of Marbel University OSAD Registry.
            </div>

          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Certificate Record Not Found
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              The public verification record <code className="font-mono text-slate-800 dark:text-slate-200">{publicId}</code> could not be found or has expired. Please verify the URL or QR code.
            </p>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center py-4 text-[10px] text-slate-400 font-bold">
        AchieveNest © 2026 Notre Dame of Marbel University • Official OSAD Credential Registry
      </footer>

    </div>
  )
}
