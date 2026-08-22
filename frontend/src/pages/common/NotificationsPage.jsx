import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Trash2, 
  CheckCheck, 
  ChevronRight, 
  ExternalLink 
} from 'lucide-react'

export default function NotificationsPage({ currentUser }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'unread' | 'read'

  // Initial Notifications Data (Role-agnostic notifications)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Achievement Verified',
      message: 'Your submission "Dean\'s Lister - First Semester AY 2025-2026" has been verified.',
      time: '2 hours ago',
      type: 'success',
      isRead: false,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-[#159552] dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      targetPath: '/student/achievements',
      navState: { highlightId: 1, filterStatus: 'Verified' },
      actionLabel: 'View Verified Entry'
    },
    {
      id: 2,
      title: 'Revision Requested',
      message: 'Please update your "Best Research Paper" submission with a higher resolution certificate scan.',
      time: '5 hours ago',
      type: 'warning',
      isRead: false,
      icon: AlertTriangle,
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      targetPath: '/student/achievements',
      navState: { highlightId: 5, filterStatus: 'Returned' },
      actionLabel: 'Update Submission'
    },
    {
      id: 3,
      title: 'New Event Registered',
      message: 'Leadership Training Workshop 2026 registration is now open for all students and faculty.',
      time: '1 day ago',
      type: 'info',
      isRead: false,
      icon: Info,
      iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      targetPath: '/student/dashboard',
      navState: { filterCategory: 'Leadership' },
      actionLabel: 'Open Event Page'
    },
    {
      id: 4,
      title: 'Certificate Ready',
      message: 'Your official verified certificate for NDMU Tech Summit 2025 is ready for download.',
      time: '2 days ago',
      type: 'success',
      isRead: true,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-[#159552] dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      targetPath: '/student/portfolio',
      navState: { openBookletModal: true },
      actionLabel: 'Download Certificate'
    }
  ])

  // Bulk Actions
  const handleMarkAllRead = () => {
    setNotifications(notifications.map(item => ({ ...item, isRead: true })))
  }

  const handleClearAll = () => {
    setNotifications([])
  }

  // Item Actions
  const handleMarkSingleRead = (e, id) => {
    e.stopPropagation()
    setNotifications(notifications.map(item => item.id === id ? { ...item, isRead: true } : item))
  }

  const handleDeleteSingle = (e, id) => {
    e.stopPropagation()
    setNotifications(notifications.filter(item => item.id !== id))
  }

  // Handle Card Navigation
  const handleNotificationClick = (item) => {
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n))
    if (item.targetPath) {
      navigate(item.targetPath, { state: item.navState })
    }
  }

  // Filtered Items
  const unreadCount = notifications.filter(n => !n.isRead).length
  const readCount = notifications.filter(n => n.isRead).length

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.isRead
    if (activeTab === 'read') return n.isRead
    return true
  })

  return (
    <div className="max-w-[960px] w-[calc(100%-20px)] sm:w-[calc(100%-40px)] mx-auto py-[20px] space-y-[14px] font-sans pb-12">
      
      {/* ================= COMPACT SINGLE-ROW HEADER TOOLBAR ================= */}
      <div className="p-3.5 sm:px-5 sm:py-3.5 rounded-[20px] bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Left Group: Bell Icon + Notifications title & unread count */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#159552] text-white flex items-center justify-center shadow-xs shrink-0 border border-emerald-400/30">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">Notifications</h1>
            <span className="text-slate-300 dark:text-slate-600 font-bold">•</span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{unreadCount} unread</span>
          </div>
        </div>

        {/* Center Group: Filter Pill Buttons */}
        <div className="flex items-center gap-1.5 self-center sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`h-[34px] px-3.5 text-xs font-extrabold rounded-full transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'all'
                ? 'bg-[#159552] text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>All</span>
            <span className="text-[10px] opacity-90">({notifications.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('unread')}
            className={`h-[34px] px-3.5 text-xs font-extrabold rounded-full transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'unread'
                ? 'bg-[#159552] text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>Unread</span>
            <span className="text-[10px] opacity-90">({unreadCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('read')}
            className={`h-[34px] px-3.5 text-xs font-extrabold rounded-full transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'read'
                ? 'bg-[#159552] text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>Read</span>
            <span className="text-[10px] opacity-90">({readCount})</span>
          </button>
        </div>

        {/* Right Group: Bulk Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 text-[#159552] dark:text-emerald-400" />
            <span>Mark all read</span>
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-extrabold flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Clear all</span>
          </button>
        </div>

      </div>

      {/* ================= COMPACT NOTIFICATION ROWS FEED CONTAINER ================= */}
      <div className="bg-white dark:bg-[#131e2e] rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#159552] dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-800">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">No notifications found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto">
              You have caught up on all alerts for this view filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredNotifications.map((item) => {
              const IconComp = item.icon
              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`min-h-[104px] p-4 sm:p-[18px_20px] transition flex items-center justify-between gap-4 cursor-pointer group ${
                    !item.isRead 
                      ? 'bg-emerald-50/30 dark:bg-emerald-950/20 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40' 
                      : 'bg-white dark:bg-[#131e2e] hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    
                    {/* Status Icon Container */}
                    <div className={`w-[40px] h-[40px] rounded-2xl border flex items-center justify-center shrink-0 ${item.iconBg}`}>
                      <IconComp className="w-4.5 h-4.5" />
                    </div>

                    {/* Content Column */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight group-hover:text-[#159552] dark:group-hover:text-emerald-400 transition">
                          {item.title}
                        </h3>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#159552] dark:group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition" />
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-[1.4] line-clamp-2">
                        {item.message}
                      </p>

                      {/* Timestamp & Actions */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-0.5 font-medium">
                        <span>{item.time}</span>

                        {item.actionLabel && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="font-extrabold text-[#159552] dark:text-emerald-400 group-hover:underline flex items-center gap-1">
                              {item.actionLabel}
                            </span>
                          </>
                        )}

                        {!item.isRead && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <button
                              type="button"
                              onClick={(e) => handleMarkSingleRead(e, item.id)}
                              className="font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:underline cursor-pointer"
                            >
                              Mark as read
                            </button>
                          </>
                        )}

                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSingle(e, item.id)}
                          className="font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Right Side Unread Dot & Chevron Cues */}
                  <div className="flex items-center gap-2 shrink-0 self-center">
                    {!item.isRead && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#159552] dark:bg-emerald-400 shrink-0 shadow-xs" title="Unread notification" />
                    )}
                    <ChevronRight className="w-4.5 h-4.5 text-slate-300 dark:text-slate-600 group-hover:text-[#159552] dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
