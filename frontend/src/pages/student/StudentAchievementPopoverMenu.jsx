import React, { useState, useEffect, useRef } from 'react'
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
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '../../components/ui/dropdown-menu'
import { Badge } from '../../components/ui/badge'

export default function StudentAchievementPopoverMenu({
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
  const [copied, setCopied] = useState(false)
  const [currentPos, setCurrentPos] = useState(position)

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

  // Responsive Scroll & Resize listener
  useEffect(() => {
    if (!achievement) return

    function handleScrollOrResize() {
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

  const isEditable = achievement.status === 'Pending Review' || achievement.status === 'Pending' || achievement.status === 'Returned' || achievement.status === 'Draft'
  const isDeletable = achievement.status !== 'Verified'
  const isReturned = achievement.status === 'Returned'
  const isInPortfolio = Boolean(achievement.portfolio_id)

  const handleCopyRefCode = (e) => {
    e.stopPropagation()
    const refCode = achievement.id ? `REF-${String(achievement.id).toUpperCase()}` : 'REF-STU-2026-9842'
    const shareText = `[AchieveNest Student Submission] Title: "${achievement.title}" | Category: ${achievement.category} | Ref Code: ${refCode}`
    navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  // Calculate position on the RIGHT side of the option button
  const popoverWidth = 288
  const popoverHeight = 390
  const HEADER_HEIGHT = 72

  let leftPos = 0
  let topPos = 0
  let isVisible = true

  if (targetElement) {
    const rect = targetElement.getBoundingClientRect()
    leftPos = rect.right + 10
    topPos = rect.top - 4

    if (leftPos + popoverWidth > window.innerWidth - 16) {
      leftPos = rect.left - popoverWidth - 10
    }

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
    <div ref={popoverRef} style={style} className="fixed z-50">
      <DropdownMenuContent className="w-72 shadow-2xl">
        
        {/* Dropdown Header Label */}
        <DropdownMenuLabel>
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-black text-slate-900 dark:text-white truncate leading-snug" title={achievement.title}>
              {achievement.title}
            </h4>
            {isEditable && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit(achievement); onClose() }}
                className="p-1 rounded-full text-slate-400 hover:text-[#1b4332] hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition cursor-pointer"
                title="Edit Submission"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#1b4332] dark:text-emerald-400" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] text-slate-400 font-semibold">{achievement.category}</span>
            <span className="text-slate-300">•</span>
            <Badge variant={achievement.status === 'Verified' ? 'success' : (achievement.status === 'Pending Review' || achievement.status === 'Pending') ? 'warning' : 'destructive'} className="text-[9px] px-1.5 py-0">
              {achievement.status}
            </Badge>
          </div>
        </DropdownMenuLabel>

        {/* Menu Actions List */}
        <div className="space-y-0.5">
          
          {/* Action 1: Open Preview */}
          <DropdownMenuItem
            variant="emerald"
            onClick={(e) => { e.stopPropagation(); onOpenPreview(achievement); onClose() }}
          >
            <ExternalLink className="w-4 h-4 text-[#1b4332] dark:text-emerald-400" />
            <span>Open in Preview Viewer</span>
          </DropdownMenuItem>

          {/* Action 2: View Full Details & Remarks */}
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); onOpenPreview(achievement); onClose() }}
          >
            <Info className="w-4 h-4 text-slate-400" />
            <span>View Full Details & Remarks</span>
          </DropdownMenuItem>

          {/* Action 3: Add/View in Student Portfolio */}
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); onAttachPortfolio(achievement.id); onClose() }}
          >
            <PlusCircle className={`w-4 h-4 ${isInPortfolio ? 'text-emerald-600 fill-emerald-100' : 'text-slate-400'}`} />
            <span>{isInPortfolio ? 'Remove from Student Portfolio' : 'Attach to Student Portfolio'}</span>
          </DropdownMenuItem>

          {/* Action 4: Toggle Favorite Highlights */}
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(achievement.id); onClose() }}
          >
            <Star className={`w-4 h-4 ${achievement.is_favorited ? 'text-amber-500 fill-amber-400' : 'text-slate-400'}`} />
            <span>{achievement.is_favorited ? 'Remove from Highlights' : 'Add to Highlights'}</span>
          </DropdownMenuItem>

          {/* Action 5: Edit Accomplishment */}
          {isEditable && (
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onEdit(achievement); onClose() }}
            >
              <Edit3 className="w-4 h-4 text-slate-400" />
              <span>Edit Submission</span>
            </DropdownMenuItem>
          )}

          {/* Action 6: Download Attached Proof */}
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); onDownload(achievement); onClose() }}
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Download Proof Document</span>
          </DropdownMenuItem>

          {/* Action 7: Re-submit with Corrections */}
          {isReturned && (
            <DropdownMenuItem
              variant="destructive"
              onClick={(e) => { e.stopPropagation(); onResubmit(achievement); onClose() }}
            >
              <RotateCcw className="w-4 h-4 text-rose-500" />
              <span>Re-submit with Corrections</span>
            </DropdownMenuItem>
          )}

          {/* Action 8: Copy Submission Reference Code */}
          <DropdownMenuItem onClick={handleCopyRefCode}>
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copied ? 'Reference Code Copied!' : 'Copy Submission Reference ID'}</span>
          </DropdownMenuItem>

          {/* Action 9: Delete Submission */}
          {isDeletable && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(achievement.id); onClose() }}
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>Delete Submission</span>
              </DropdownMenuItem>
            </>
          )}

        </div>
      </DropdownMenuContent>
    </div>
  )
}
