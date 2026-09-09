import React from 'react'
import './credential-slip-print.css'

export default function CredentialSlipPrintView({
  credential,
  printedAtLabel
}) {
  if (!credential) return null

  const isStudent = credential.ownerType === 'student'
  const isReset = credential.action === 'administrative_reset' || credential.isReset || credential.action === 'password_reset'
  const ownerTypeLabel = isStudent ? 'Student' : 'Personnel'
  const idLabel = isStudent ? 'Student ID' : 'Personnel ID'
  const slipBadgeLabel = isReset ? 'Temporary Reset Credential Slip' : 'Confidential Account Credential Slip'
  const statusLabel = isReset ? 'Password Change Required' : 'Pending First Login'
  const instructionsTitle = isReset ? 'Account Recovery Sign-In Instructions:' : 'First-Time Sign-In Instructions:'
  const passwordLabel = isReset ? 'One-Time Temporary Reset Password:' : 'One-Time Temporary Password:'

  return (
    <section
      id="credential-slip-print-root"
      className="credential-slip-print-root p-6 max-w-2xl mx-auto text-black bg-white"
      aria-label="Printable Credential Slip"
    >
      <div className="border-2 border-black rounded-lg p-6 space-y-5">
        
        {/* Header Branding */}
        <div className="border-b-2 border-black pb-3 text-center">
          <h1 className="text-xl font-bold tracking-tight uppercase">
            Notre Dame of Marbel University
          </h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-700">
            AchieveNest Student & Personnel Achievement Platform
          </p>
          <div className="mt-2 inline-block px-3 py-1 bg-black text-white text-xs font-bold uppercase tracking-wider rounded">
            {slipBadgeLabel}
          </div>
        </div>

        {/* Account Identification */}
        <div className="grid grid-cols-2 gap-4 text-sm border-b border-black pb-4">
          <div>
            <span className="block text-xs font-bold uppercase text-slate-600">
              Account Owner
            </span>
            <span className="font-bold text-base">
              {credential.fullName}
            </span>
          </div>

          <div>
            <span className="block text-xs font-bold uppercase text-slate-600">
              Account Type
            </span>
            <span className="font-bold text-base">
              {ownerTypeLabel}
            </span>
          </div>

          <div>
            <span className="block text-xs font-bold uppercase text-slate-600">
              {idLabel}
            </span>
            <span className="font-mono font-bold text-base">
              {credential.institutionalId}
            </span>
          </div>

          <div>
            <span className="block text-xs font-bold uppercase text-slate-600">
              Account Status
            </span>
            <span className="font-bold text-base">
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Login Credentials Box */}
        <div className="bg-slate-50 border-2 border-black rounded p-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-center border-b border-slate-300 pb-1">
            Login Credentials
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="font-bold">Institutional Email (Sign-In Username):</span>
            <span className="font-mono font-bold">{credential.institutionalEmail}</span>
          </div>

          <div className="flex items-center justify-between text-sm pt-1 border-t border-slate-200">
            <span className="font-bold">{passwordLabel}</span>
            <span className="font-mono font-black text-lg tracking-widest bg-white px-2 py-0.5 border border-black rounded">
              {credential.temporaryPassword}
            </span>
          </div>
        </div>

        {/* Sign-In Instructions */}
        <div className="text-xs space-y-1.5 border-b border-black pb-4">
          <strong className="block text-xs font-bold uppercase">
            {instructionsTitle}
          </strong>
          <ol className="list-decimal list-inside space-y-1 text-slate-800">
            <li>Open the official AchieveNest sign-in portal.</li>
            <li>
              Sign in using your <strong>Institutional Email</strong> and the <strong>Temporary Password</strong> above.
              {isReset ? ' (Your previous password is no longer valid).' : ''}
            </li>
            <li>You will be immediately prompted to create a new personal password.</li>
            <li>Your temporary password will be permanently deactivated upon successful password creation.</li>
          </ol>
        </div>

        {/* Security & Confidentiality Notice */}
        <div className="text-[10pt] leading-tight space-y-1 text-slate-700">
          <p>
            <strong>CONFIDENTIAL:</strong> This credential slip is issued exclusively to the verified account owner. Verify identity before physical handoff. Do not photograph, share, or leave this slip unattended.
          </p>
          <p>
            <strong>Lost or Compromised Slips:</strong> If this slip is misplaced or disclosed to an unauthorized individual before first sign-in, immediately contact OSAD or HR to issue a replacement temporary credential and invalidate this passkey.
          </p>
        </div>

        {/* Footer Timestamp */}
        <div className="pt-2 text-[9pt] text-slate-500 flex justify-between items-center border-t border-slate-300">
          <span>AchieveNest Security Protocol — Local Defense Edition</span>
          <span>{`Printed on: ${printedAtLabel || new Date().toLocaleString()}`}</span>
        </div>

      </div>
    </section>
  )
}
