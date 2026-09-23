import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Trash2, 
  CheckCheck, 
  ChevronRight, 
  ExternalLink,
  Layers,
  RefreshCw
} from 'lucide-react'
import notificationApiService from '../../services/notificationApiService'

export default function NotificationsPage({ currentUser }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'unread' | 'read'
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  // Load persisted notifications from backend
  const loadNotifications = async () => {
    try {
      setLoading(true)
      const res = await notificationApiService.getNotifications()
      const list = res?.data?.notifications || []
      
      const mapped = list.map(item => ({
        id: item.id,
        title: item.title,
        message: item.message,
        time: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent',
        type: item.type || 'info',
        isRead: Boolean(item.is_read),
        icon: item.type === 'success' || item.type === 'endorsed' ? CheckCircle2 : item.type === 'warning' || item.type === 'returned' ? AlertTriangle : Info,
        iconBg: item.type === 'success' || item.type === 'endorsed'
          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#159552] dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
          : item.type === 'warning' || item.type === 'returned'
          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
          : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        targetPath: item.target_path || (item.entity_type === 'personnel_portfolio_submission' ? '/personnel/portfolio/edit' : null),
        navState: { highlightId: item.entity_id },
        actionLabel: item.type === 'returned' ? 'Update Portfolio' : 'View Details'
      }))

      setNotifications(mapped)
    } catch (err) {
      console.warn('Could not load notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  // Bulk Actions
  const handleMarkAllRead = async () => {
    try {
      await notificationApiService.markAllAsRead()
      setNotifications(notifications.map(item => ({ ...item, isRead: true })))
    } catch (e) {
      console.warn('Failed to mark all as read:', e)
    }
  }

  const handleClearAll = () => {
    setNotifications([])
  }

  // Item Actions
  const handleMarkSingleRead = async (e, id) => {
    e.stopPropagation()
    try {
      await notificationApiService.markAsRead(id)
      setNotifications(notifications.map(item => item.id === id ? { ...item, isRead: true } : item))
    } catch (e) {
      console.warn('Failed to mark single read:', e)
    }
  }

  const handleDeleteSingle = (e, id) => {
    e.stopPropagation()
    setNotifications(notifications.filter(item => item.id !== id))
  }

  // Handle Card Navigation
  const handleNotificationClick = async (item) => {
    if (!item.isRead) {
      try {
        await notificationApiService.markAsRead(item.id)
      } catch {
        // ignore
      }
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n))
    }
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
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              System alerts, portfolio reviews, and workflow updates.
            </p>
          </div>
        </div>

        {/* Right Group: Action Controls */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-[#159552]" />
              <span>Mark All as Read</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadNotifications}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 transition cursor-pointer"
            title="Refresh notifications"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* ================= TABS ================= */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {['all', 'unread', 'read'].map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === tab
                ? 'bg-[#159552] text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {tab === 'all' && `All (${notifications.length})`}
            {tab === 'unread' && `Unread (${unreadCount})`}
            {tab === 'read' && `Read (${readCount})`}
          </button>
        ))}
      </div>

      {/* ================= NOTIFICATION LIST ================= */}
      {loading ? (
        <div className="p-12 text-center space-y-2 bg-white dark:bg-[#131e2e] rounded-2xl border border-slate-200 dark:border-slate-800">
          <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="p-12 text-center space-y-2 bg-white dark:bg-[#131e2e] rounded-2xl border border-slate-200 dark:border-slate-800">
          <Bell className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">No notifications found</h3>
          <p className="text-[11px] text-slate-500">You're all caught up! New alerts and portfolio feedback will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  !item.isRead
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 shadow-2xs'
                    : 'bg-white dark:bg-[#131e2e] border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${item.iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">{item.title}</h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{item.message}</p>
                    <span className="text-[10px] text-slate-400 font-bold block">{item.time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-1">
                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkSingleRead(e, item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Mark as read"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  {item.targetPath && (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
