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
  targetElement = null,
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
  const [currentPos, setCurrentPos] = React.useState(position)

  // Sync position whenever initial position or targetElement changes
  useEffect(() => {
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect()
      setCurrentPos({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right
      })
    } else {
      setCurrentPos(position)
    }
  }, [position.x, position.y, targetElement])

  // Responsive Scroll & Resize listener (Hides when scrolled out of view, re-appears when scrolled back into view)
  useEffect(() => {
    if (!achievement) return

    function handleScrollOrResize() {
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect()
        // Update current position without closing popover state so it re-appears on scroll back
        setCurrentPos({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right
        })
      }
    }

    window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true })
    window.addEventListener('resize', handleScrollOrResize)
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true })
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [achievement, targetElement])

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(e.target) &&
        (!targetElement || !targetElement.contains(e.target))
      ) {
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
  }, [onClose, targetElement])

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

  // Calculate position on the RIGHT side of the option button
  const popoverWidth = 288 // w-72 = 288px
  const popoverHeight = 380
  const HEADER_HEIGHT = 72 // Height of stationary top white header bar + padding

  let leftPos = 0
  let topPos = 0
  let isVisible = true

  if (targetElement) {
    const rect = targetElement.getBoundingClientRect()
    // Position to the RIGHT side of the option button
    leftPos = rect.right + 10
    topPos = rect.top - 4

    // If placing to the right overflows the screen right edge, place on the LEFT side of the button
    if (leftPos + popoverWidth > window.innerWidth - 16) {
      leftPos = rect.left - popoverWidth - 10
    }

    // Check if targetElement is currently overlapped by top header or scrolled out of viewport bounds
    if (
      rect.top < HEADER_HEIGHT || 
      rect.bottom < 0 || 
      rect.top > window.innerHeight + 20 || 
      rect.right < 0 || 
      rect.left > window.innerWidth
    ) {
      isVisible = false
    }
  } else {
    leftPos = (position.x || 300) + 10
    topPos = position.y || 100
  }

  // Viewport & Top Header Boundary Clamping (Never overlap top white header bar)
  leftPos = Math.max(16, Math.min(leftPos, window.innerWidth - popoverWidth - 16))
  topPos = Math.max(HEADER_HEIGHT + 4, Math.min(topPos, window.innerHeight - popoverHeight - 16))

  const style = {
    top: `${topPos}px`,
    left: `${leftPos}px`,
    visibility: isVisible ? 'visible' : 'hidden',
    opacity: isVisible ? 1 : 0,
    pointerEvents: isVisible ? 'auto' : 'none',
    transition: 'opacity 150ms ease, visibility 150ms ease, top 50ms linear, left 50ms linear'
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
              className="p-1 rounded-full text-slate-400 hover:text-[#16834a] hover:bg-[#E7F3E9] transition cursor-pointer"
              title="Edit Title"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
          {achievement.category} • <span className="text-[#16834a] font-semibold">{achievement.portfolio_status || achievement.status}</span>
        </p>
      </div>

      {/* Menu Actions List */}
      <div className="space-y-0.5 text-xs">
        
        {/* Action 1: Open Preview */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpenPreview(achievement); onClose() }}
          className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-slate-700 hover:bg-[#E7F3E9] hover:text-[#16834a] font-semibold transition cursor-pointer"
        >
          <ExternalLink className="w-4 h-4 text-[#16834a]" />
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
          className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-slate-700 hover:bg-[#E7F3E9] hover:text-[#064e2b] font-semibold transition cursor-pointer"
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
