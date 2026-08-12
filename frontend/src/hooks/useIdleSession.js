import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * useIdleSession.js
 * React hook tracking user activity on university terminals.
 * Dispatches a 2-minute warning modal at 13 minutes and logs out automatically at 15 minutes of idle time.
 */
export default function useIdleSession(onLogout, idleTimeMs = 15 * 60 * 1000, warningTimeMs = 13 * 60 * 1000) {
  const [showWarning, setShowWarning] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(120)

  const lastActivityRef = useRef(Date.now())
  const warningTimerRef = useRef(null)
  const logoutTimerRef = useRef(null)
  const countdownIntervalRef = useRef(null)

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
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
      setShowWarning(false)
      if (onLogout) onLogout()
    }, idleTimeMs)
  }, [idleTimeMs, warningTimeMs, onLogout])

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    const handleUserInteraction = () => {
      // Only auto-reset if warning modal is not currently open
      if (!showWarning) {
        resetActivity()
      }
    }

    events.forEach(evt => window.addEventListener(evt, handleUserInteraction))
    resetActivity()

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleUserInteraction))
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [resetActivity, showWarning])

  const stayLoggedIn = useCallback(() => {
    resetActivity()
  }, [resetActivity])

  return {
    showWarning,
    secondsRemaining,
    stayLoggedIn
  }
}
