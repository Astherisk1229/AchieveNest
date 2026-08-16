import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, CheckCheck, ChevronRight } from 'lucide-react'

export default function NotificationPopover() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([
    {
      id: 'notif_1',
      title: 'Achievement Verified',
      message: 'Your submission "Dean\'s Lister - First Semester AY 2025-2026" has been verified.',
      type: 'verification',
      targetPath: '/student/achievements',
      navState: { highlightId: 1, filterStatus: 'Verified' },
      time: '10m ago',
      is_read: false
    },
    {
      id: 'notif_2',
      title: 'Revision Requested',
      message: 'Please update your "Best Research Paper" submission with a higher resolution scan.',
      type: 'warning',
      targetPath: '/student/achievements',
      navState: { highlightId: 5, filterStatus: 'Returned' },
      time: '1h ago',
      is_read: false
    },
    {
      id: 'notif_3',
      title: 'Certificate Ready',
      message: 'Your official verified certificate for NDMU Tech Summit 2025 is ready for download.',
      type: 'certificate',
      targetPath: '/student/portfolio',
      navState: { openBookletModal: true },
      time: '3h ago',
      is_read: true
    }
  ])

  const unreadCount = notifications.filter(n => !n.is_read).length

  React.useEffect(() => {
    const handleAddResetNotification = () => {
      setNotifications(prev => [
        {
          id: `notif_reset_${Date.now()}`,
          title: '⚠️ Password Reset Requested',
          message: 'Student Juan Dela Cruz (2023-0142) submitted a password reset request.',
          type: 'warning',
          targetPath: '/osad/dashboard?tab=accounts',
          navState: {},
          time: 'Just now',
          is_read: false
        },
        ...prev
      ])
    }
    window.addEventListener('achievenest_reset_request_submitted', handleAddResetNotification)
    return () => window.removeEventListener('achievenest_reset_request_submitted', handleAddResetNotification)
  }, [])

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, is_read: true })))
  }

  const handleNotificationClick = (notif) => {
    // 1. Mark as read
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n))
    // 2. Close popover
    setIsOpen(false)
    // 3. Navigate to target path with nav state
    if (notif.targetPath) {
      navigate(notif.targetPath, { state: notif.navState })
    }
  }

  return (
    <div className="relative inline-block text-left font-sans">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-[#2d8a4e] dark:hover:text-emerald-400 hover:bg-slate-100/90 dark:hover:bg-slate-800/90 transition active:scale-[0.98] cursor-pointer"
        aria-label="Notifications"
        title="Notification Center"
      >
        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#2d8a4e] text-white font-black text-[10px] flex items-center justify-center shadow-xs animate-pulse border border-white dark:border-slate-900">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-white dark:bg-[#131e2e] text-slate-900 dark:text-white shadow-2xl border border-slate-200/90 dark:border-slate-800 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Notifications Center</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs text-[#2d8a4e] dark:text-emerald-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark read
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No notifications found.</p>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full p-3 rounded-2xl border text-left transition cursor-pointer group flex items-start justify-between gap-2 ${
                      notif.is_read 
                        ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 opacity-75 hover:opacity-100' 
                        : 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 hover:border-[#2d8a4e]'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-[#2d8a4e] dark:group-hover:text-emerald-400 transition truncate">{notif.title}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">{notif.time}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">{notif.message}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#2d8a4e] dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition shrink-0 mt-1" />
                  </button>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400 font-mono">AchieveNest Gateway</span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  const targetNotifPath = location.pathname.includes('/osad/')
                    ? '/osad/notifications'
                    : location.pathname.includes('/student/')
                    ? '/student/notifications'
                    : '/personnel/notifications'
                  navigate(targetNotifPath)
                }}
                className="font-extrabold text-[#2d8a4e] dark:text-emerald-400 hover:underline cursor-pointer"
              >
                View all →
              </button>
            </div>

          </div>
        </>
      )}
    </div>
  )
}
