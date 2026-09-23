import React, { useState, useRef } from 'react'
import { Camera, Loader2, Trash2, AlertCircle, CheckCircle2, User } from 'lucide-react'
import PersonnelProfilePhotoService from '../../services/PersonnelProfilePhotoService'

export default function ProfilePhotoUploader({
  currentAvatarUrl,
  fullName = 'Personnel',
  onPhotoUpdated,
  size = 'md', // 'sm' | 'md' | 'lg'
  showRemoveButton = true
}) {
  const fileInputRef = useRef(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)

  const sizeClasses = {
    sm: 'w-14 h-14 text-sm',
    md: 'w-20 h-20 text-lg',
    lg: 'w-24 h-24 sm:w-28 sm:h-28 text-2xl'
  }

  const handleCameraClick = () => {
    setError('')
    setSuccessMsg('')
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setSuccessMsg('')

    // 1. Client-side preflight check
    const validation = await PersonnelProfilePhotoService.validatePhotoPreflight(file)
    if (!validation.isValid) {
      setError(validation.error)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Local instant preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    try {
      setIsUploading(true)
      const res = await PersonnelProfilePhotoService.uploadProfilePhoto(file)
      const newUrl = res?.data?.avatar_url || objectUrl
      setSuccessMsg('Profile photo updated!')
      if (onPhotoUpdated) {
        onPhotoUpdated(newUrl)
      }
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to upload profile photo.')
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemovePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return
    try {
      setIsUploading(true)
      setError('')
      await PersonnelProfilePhotoService.removeProfilePhoto()
      setPreviewUrl(null)
      setSuccessMsg('Profile photo removed.')
      if (onPhotoUpdated) {
        onPhotoUpdated(null)
      }
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to remove photo.')
    } finally {
      setIsUploading(false)
    }
  }

  const displayUrl = previewUrl || currentAvatarUrl
  const initials = PersonnelProfilePhotoService.getInitials(fullName)

  return (
    <div className="flex flex-col items-center sm:items-start gap-3">
      <div className="relative group shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        <div
          className={`${sizeClasses[size]} rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-emerald-900 text-white flex items-center justify-center font-black tracking-wider shadow-md relative`}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={fullName}
              className="w-full h-full object-cover"
              onError={() => setPreviewUrl(null)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full bg-linear-to-br from-emerald-800 to-emerald-950 text-emerald-100">
              <span>{initials}</span>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white backdrop-blur-2xs">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
        </div>

        {/* Camera action overlay button */}
        <button
          type="button"
          onClick={handleCameraClick}
          disabled={isUploading}
          className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl bg-[#16834a] hover:bg-[#11693b] text-white shadow-md transition cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
          title="Upload / Change Photo"
          aria-label="Upload profile photo"
        >
          <Camera className="w-3.5 h-3.5 text-white" />
        </button>
      </div>

      {/* Auxiliary action / Status display */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={handleCameraClick}
          disabled={isUploading}
          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition cursor-pointer disabled:opacity-50"
        >
          Change Photo
        </button>

        {showRemoveButton && displayUrl && (
          <button
            type="button"
            onClick={handleRemovePhoto}
            disabled={isUploading}
            className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Remove</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-medium flex items-center gap-1.5 max-w-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 max-w-xs animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  )
}
