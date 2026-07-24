import React, { useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'

export default function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([
    {
      id: 'notif_1',
      title: 'Achievement Verification Status Updated',
      message: 'Your publication "AI in Higher Education" was verified by Program Coordinator.',
      type: 'verification',
      time: '10m ago',
      is_read: false
    },
    {
      id: 'notif_2',
      title: 'Department Endorsement Notice',
      message: 'Department Secretary endorsed 3 faculty research submissions to HR Office.',
      type: 'endorsement',
      time: '1h ago',
      is_read: false
    },
    {
      id: 'notif_3',
      title: 'Araw ng Parangal Criteria Tuned',
      message: 'OSAD Staff updated TOPSIS category weight multipliers for AY 2025-2026.',
      type: 'award',
      time: '3h ago',
      is_read: true
    }
  ])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, is_read: true })))
  }

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 hover:text-slate-900 transition backdrop-blur-md shadow-2xs"
        aria-label="Notifications"
      >
        <Bell className="w-5.5 h-5.5 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#2d8a4e] text-white font-bold text-xs flex items-center justify-center shadow-md animate-pulse border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Notifications Center</h3>
                {unreadCount > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#eef7f0] text-[#1e5831]">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-[#2d8a4e] hover:underline flex items-center gap-1 font-semibold"
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
                  <div
                    key={notif.id}
                    className={`p-3 rounded-xl border text-left transition ${
                      notif.is_read ? 'bg-slate-50 border-slate-100 opacity-75' : 'bg-[#f7faf8] border-[#cbe6d2]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{notif.title}</span>
                      <span className="text-[10px] text-slate-400">{notif.time}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400 font-mono">AchieveNest Realtime Gateway</span>
              <button
                type="button"
                onClick={() => { setIsOpen(false); navigate('/notifications'); }}
                className="font-extrabold text-[#2d8a4e] hover:underline cursor-pointer"
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
