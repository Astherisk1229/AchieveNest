import React, { useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Trash2, 
  Check, 
  Clock, 
  Filter,
  CheckCheck
} from 'lucide-react'

export default function NotificationsPage({ currentUser }) {
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'unread' | 'read'

  // Initial Notifications Data (Role-agnostic notifications)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Achievement Verified',
      message: 'Your submission "Dean\'s Lister - First Semester AY 2025-2026" has been verified.',
      time: '2 hours ago',
      type: 'success', // 'success' | 'warning' | 'info'
      isRead: false,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-[#2d8a4e] border-emerald-200'
    },
    {
      id: 2,
      title: 'Revision Requested',
      message: 'Please update your "Best Research Paper" submission with a higher resolution certificate scan.',
      time: '5 hours ago',
      type: 'warning',
      isRead: false,
      icon: AlertTriangle,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200'
    },
    {
      id: 3,
      title: 'New Event Registered',
      message: 'Leadership Training Workshop 2026 registration is now open for all students and faculty.',
      time: '1 day ago',
      type: 'info',
      isRead: false,
      icon: Info,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    {
      id: 4,
      title: 'Certificate Ready',
      message: 'Your official verified certificate for NDMU Tech Summit 2025 is ready for download.',
      time: '2 days ago',
      type: 'success',
      isRead: true,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-[#2d8a4e] border-emerald-200'
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
  const handleMarkSingleRead = (id) => {
    setNotifications(notifications.map(item => item.id === id ? { ...item, isRead: true } : item))
  }

  const handleDeleteSingle = (id) => {
    setNotifications(notifications.filter(item => item.id !== id))
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
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6 font-sans pb-12">
        
        {/* ================= HEADER CARD & BULK TOOLBAR ================= */}
        <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#2d8a4e] text-white flex items-center justify-center shadow-md shrink-0 border border-emerald-400/30">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  {unreadCount} unread notifications
                </p>
              </div>
            </div>

            {/* Bulk Action Buttons */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className="px-4 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-extrabold flex items-center gap-2 shadow-2xs hover:shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <CheckCheck className="w-4 h-4 text-[#2d8a4e]" />
                <span>Mark all read</span>
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                disabled={notifications.length === 0}
                className="px-4 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-extrabold flex items-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Clear all</span>
              </button>
            </div>

          </div>

          {/* Filter Pills Row */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#1b4332] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              All ({notifications.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'unread'
                  ? 'bg-[#1b4332] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              Unread ({unreadCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('read')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'read'
                  ? 'bg-[#1b4332] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              Read ({readCount})
            </button>
          </div>

        </div>

        {/* ================= NOTIFICATIONS LIST FEED CARD ================= */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#2d8a4e] flex items-center justify-center mx-auto border border-emerald-100">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">No notifications found</h3>
              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                You have catch up on all alerts for this view filter.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredNotifications.map((item) => {
                const IconComp = item.icon
                return (
                  <div
                    key={item.id}
                    className={`p-5 sm:p-6 transition flex items-start justify-between gap-4 relative group ${
                      !item.isRead ? 'bg-emerald-50/20 hover:bg-emerald-50/40' : 'bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      
                      {/* Category Icon */}
                      <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 mt-0.5 ${item.iconBg}`}>
                        <IconComp className="w-5 h-5" />
                      </div>

                      {/* Content Body */}
                      <div className="space-y-1 min-w-0">
                        <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          {item.message}
                        </p>

                        {/* Timestamp & Action Links */}
                        <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                          <span className="text-slate-400 font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> {item.time}
                          </span>

                          {!item.isRead && (
                            <>
                              <span>•</span>
                              <button
                                type="button"
                                onClick={() => handleMarkSingleRead(item.id)}
                                className="font-extrabold text-[#2d8a4e] hover:underline cursor-pointer"
                              >
                                Mark as read
                              </button>
                            </>
                          )}

                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSingle(item.id)}
                            className="font-extrabold text-rose-600 hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Right Side Unread Indicator Dot */}
                    {!item.isRead && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#2d8a4e] shrink-0 mt-2 shadow-xs" title="Unread" />
                    )}

                  </div>
                )
              })}
            </div>
          )}

        </div>

      </div>
    </MainLayout>
  )
}
