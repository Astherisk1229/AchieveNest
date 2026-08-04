import React, { useEffect, useRef } from 'react'
import { 
  ExternalLink, 
  Info, 
  PlusCircle, 
  Edit3, 
  Download, 
  RotateCcw, 
  Copy, 
  Trash2, 
  Check, 
  Star 
} from 'lucide-react'

/**
 * AchievementPopoverMenu.jsx
 * Popover dropdown menu for achievement cards matching the design reference image.
 */
export default function AchievementPopoverMenu({
  achievement,
  position = { x: 0, y: 0 },
  onClose,
  onOpenPreview,
  onEdit,
  onDownload,
  onResubmit,
  onAttachPortfolio,
  onDelete,
  onToggleFavorite
}) {
  const popoverRef = useRef(null)
  const [copied, setCopied] = React.useState(false)

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose()
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  if (!achievement) return null

  const isEditable = achievement.canEdit ? achievement.canEdit() : achievement.status !== 'Verified'
  const isDeletable = achievement.canDelete ? achievement.canDelete() : achievement.status !== 'Verified'
  const isReturned = achievement.status === 'Returned'

  const handleCopyLink = (e) => {
    e.stopPropagation()
    const shareText = `[AchieveNest] ${achievement.title} (${achievement.category}) - Ref: ${achievement.id}`
    navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Clamped position styling so popover stays inside viewport
  const style = {
    top: `${Math.min(position.y + 8, window.innerHeight - 380)}px`,
    left: `${Math.min(position.x - 220, window.innerWidth - 280)}px`
  }

  return (
    <div
      ref={popoverRef}
      style={style}
      className="fixed z-50 w-72 bg-white rounded-3xl shadow-2xl border border-slate-200/90 py-2.5 px-1 font-sans text-slate-800 animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header section matching user reference image */}
      <div className="px-3 py-2 border-b border-slate-100 mb-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-black text-slate-900 truncate leading-snug" title={achievement.title}>
            {achievement.title}
          </h4>
          {isEditable && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(achievement); onClose() }}
              className="p-1 rounded-full text-slate-400 hover:text-[#2d8a4e] hover:bg-[#eef7f0] transition cursor-pointer"
              title="Edit Title"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
          {achievement.category} • <span className="text-[#2d8a4e] font-semibold">{achievement.portfolio_status || achievement.status}</span>
        </p>
      </div>

      {/* Menu Actions List */}
      <div className="space-y-0.5 text-xs">
        
        {/* Action 1: Open Preview */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpenPreview(achievement); onClose() }}
          className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-slate-700 hover:bg-[#eef7f0] hover:text-[#2d8a4e] font-semibold transition cursor-pointer"
        >
          <ExternalLink className="w-4 h-4 text-[#2d8a4e]" />
          <span>Open in Preview Viewer</span>
        </button>

        {/* Action 2: View Details & Score */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpenPreview(achievement); onClose() }}
          className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 font-semibold transition cursor-pointer"
        >
          <Info className="w-4 h-4 text-slate-400" />
          <span>Details & Points Breakdown</span>
        </button>

        {/* Action 3: Add/View in Portfolio */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onAttachPortfolio(achievement.id); onClose() }}
          className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-slate-700 hover:bg-[#eef7f0] hover:text-[#1e5831] font-semibold transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-emerald-600" />
          <span>Attach to Annual Portfolio</span>
        </button>

        {/* Action 4: Toggle Favorite */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(achievement.id); onClose() }}
          className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-slate-700 hover:bg-amber-50 hover:text-amber-800 font-semibold transition cursor-pointer"
        >
          <Star className={`w-4 h-4 ${achievement.is_favorited ? 'text-amber-500 fill-amber-400' : 'text-slate-400'}`} />
          <span>{achievement.is_favorited ? 'Remove from Highlights' : 'Add to Highlights'}</span>
        </button>

        {/* Action 5: Edit Accomplishment (If non-verified) */}
        {isEditable && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(achievement); onClose() }}
            className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 font-semibold transition cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-slate-500" />
            <span>Edit Accomplishment</span>
          </button>
        )}

        {/* Action 6: Download Attached File */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDownload(achievement); onClose() }}
          className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 font-semibold transition cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Download Proof Document</span>
        </button>

        {/* Action 7: Re-submit (If returned) */}
        {isReturned && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onResubmit(achievement); onClose() }}
            className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-rose-700 bg-rose-50/60 hover:bg-rose-100 font-bold transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>Re-submit with Corrections</span>
          </button>
        )}

        {/* Action 8: Copy Link */}
        <button
          type="button"
          onClick={handleCopyLink}
          className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 font-semibold transition cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
          <span>{copied ? 'Reference Copied!' : 'Copy Link / Reference ID'}</span>
        </button>

        {/* Divider & Delete Action */}
        {isDeletable && (
          <>
            <div className="my-1 border-t border-slate-100" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(achievement.id); onClose() }}
              className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 font-bold transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>Delete Submission</span>
            </button>
          </>
        )}

      </div>
    </div>
  )
}
