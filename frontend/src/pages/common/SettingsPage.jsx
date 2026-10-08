import React, { useState } from 'react'
import { Bell, CheckCircle2, KeyRound, Moon, Settings, ShieldCheck, Sun, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import useTheme from '../../hooks/useTheme'
import ChangePasswordDialog from './ChangePasswordDialog'

const surface = 'text-slate-900 dark:text-slate-100'

function SettingsSections({ activeUser, isDark, toggleTheme, onChangePassword }) {
  return <div className="divide-y divide-slate-200 dark:divide-slate-700">
    <section aria-labelledby="settings-appearance" className="py-4 first:pt-1">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-emerald-800 dark:text-emerald-300" aria-hidden="true">{isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</span>
        <div className="min-w-0 flex-1">
          <h3 id="settings-appearance" className="text-sm font-bold">Appearance</h3>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Choose how AchieveNest looks on this device.</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-600 dark:text-slate-300">Current: {isDark ? 'Dark' : 'Light'}</span>
            <button type="button" onClick={toggleTheme} className="rounded-lg border border-emerald-800/25 px-3 py-2 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:border-emerald-400/30 dark:text-emerald-200 dark:hover:bg-emerald-950/40">Switch to {isDark ? 'Light' : 'Dark'}</button>
          </div>
        </div>
      </div>
    </section>

    <section aria-labelledby="settings-notifications" className="py-4">
      <div className="flex items-start gap-3">
        <Bell className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800 dark:text-emerald-300" aria-hidden="true" />
        <div className="min-w-0">
          <h3 id="settings-notifications" className="text-sm font-bold">Notification Preferences</h3>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Choose which optional notifications you want to receive.</p>
          <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">No optional notification subscriptions are currently available to configure. Required workflow and security notifications continue to follow your account role.</p>
        </div>
      </div>
    </section>

    <section aria-labelledby="settings-security" className="py-4 last:pb-1">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800 dark:text-emerald-300" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 id="settings-security" className="text-sm font-bold">Account Security</h3>
          <p className="mt-3 text-xs font-semibold">Password</p>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Keep your account secure by updating your password when needed.</p>
          <button type="button" onClick={onChangePassword} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900">
            <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />Change Password
          </button>
        </div>
      </div>
    </section>
    <span className="sr-only">Settings for {activeUser?.full_name || 'your account'}.</span>
  </div>
}

export default function SettingsPage({ currentUser, compact = false, onBack, onClose }) {
  const { user: authUser } = useAuth()
  const activeUser = currentUser || authUser
  const { isDark, toggleTheme } = useTheme()
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [passwordUpdated, setPasswordUpdated] = useState(false)

  const header = compact
    ? <header className="shrink-0 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button type="button" onClick={onBack} aria-label="Back to account menu" className="mb-2 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-sm font-bold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/40"><span aria-hidden="true">‹</span>Back</button>
          <h2 className="text-base font-extrabold">Settings</h2>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Manage your appearance, notification preferences, and account security.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close panel" title="Close" className="shrink-0 rounded-md p-2 text-slate-600 transition hover:bg-slate-100 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-emerald-300"><X className="h-4 w-4" aria-hidden="true" /></button>
      </div>
    </header>
    : <header className="mb-4 border-b border-slate-200 pb-3 dark:border-slate-700">
      <h1 className="flex items-center gap-2 text-xl font-extrabold"><Settings className="h-5 w-5 text-emerald-800 dark:text-emerald-300" aria-hidden="true" />Settings</h1>
      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Manage your appearance, notification preferences, and account security.</p>
    </header>

  return <>
    {compact
      ? <section role="dialog" aria-modal="false" aria-label="Settings" className="fixed right-3 top-[4.5rem] z-[60] flex max-h-[calc(100dvh-5.25rem)] w-[min(420px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-emerald-900/15 bg-white text-slate-900 shadow-[0_18px_50px_-20px_rgba(15,23,42,.42)] md:absolute md:right-0 md:top-full md:mt-2 md:max-h-[min(76vh,720px)] dark:border-slate-700 dark:bg-[#131e2e] dark:text-slate-100">
        {header}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-2 [scrollbar-width:thin]">{passwordUpdated && <p role="status" className="mb-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Password updated successfully.</p>}<SettingsSections activeUser={activeUser} isDark={isDark} toggleTheme={toggleTheme} onChangePassword={() => { setPasswordUpdated(false); setChangePasswordOpen(true) }} /></div>
      </section>
      : <main className={`mx-auto max-w-4xl space-y-2 font-sans ${surface}`}>
        {header}
        {passwordUpdated && <p role="status" className="mb-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Password updated successfully.</p>}
        <SettingsSections activeUser={activeUser} isDark={isDark} toggleTheme={toggleTheme} onChangePassword={() => { setPasswordUpdated(false); setChangePasswordOpen(true) }} />
      </main>}
    {changePasswordOpen && <ChangePasswordDialog onClose={() => setChangePasswordOpen(false)} onSuccess={() => { setPasswordUpdated(true); setChangePasswordOpen(false) }} />}
  </>
}
