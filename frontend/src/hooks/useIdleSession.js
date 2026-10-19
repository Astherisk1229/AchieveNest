import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * useIdleSession.js
 * React hook tracking user activity on university terminals.
 * Dispatches a 2-minute warning modal at 13 minutes and logs out automatically at 15 minutes of idle time.
 */
export default function useIdleSession(onLogout, idleTimeMs = 15 * 60 * 1000, warningTimeMs = 13 * 60 * 1000) {
  const [showWarning, setShowWarning] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(120)

  const showWarningRef = useRef(false)
  const onLogoutRef = useRef(onLogout)
  const warningTimerRef = useRef(null)
  const logoutTimerRef = useRef(null)
  const countdownIntervalRef = useRef(null)

  useEffect(() => {
    onLogoutRef.current = onLogout
  }, [onLogout])

  const resetActivity = useCallback(() => {
    showWarningRef.current = false
    setShowWarning(false)
    setSecondsRemaining(120)

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }

    // Clear existing timers
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)

    // Set new warning timer (at 13 minutes)
    warningTimerRef.current = setTimeout(() => {
      showWarningRef.current = true
      setShowWarning(true)
      setSecondsRemaining(120)

      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)

    }, warningTimeMs)

    // Set new logout timer (at 15 minutes)
    logoutTimerRef.current = setTimeout(() => {
      showWarningRef.current = false
      setShowWarning(false)
      onLogoutRef.current?.()
    }, idleTimeMs)
  }, [idleTimeMs, warningTimeMs])

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    const handleUserInteraction = () => {
      // Only auto-reset if warning modal is not currently open
      if (!showWarningRef.current) {
        resetActivity()
      }
    }

    events.forEach(evt => window.addEventListener(evt, handleUserInteraction, evt === 'scroll'))
    resetActivity()

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleUserInteraction, evt === 'scroll'))
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [resetActivity])

  const stayLoggedIn = useCallback(() => {
    resetActivity()
  }, [resetActivity])

  return {
    showWarning,
    secondsRemaining,
    stayLoggedIn
  }
}
