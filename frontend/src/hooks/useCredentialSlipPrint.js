import { useState, useCallback, useEffect, useRef } from 'react'

export function useCredentialSlipPrint() {
  const [status, setStatus] = useState('idle') // 'idle' | 'preparing' | 'dialog_opening' | 'dialog_closed' | 'error'
  const [isPrintPrepared, setIsPrintPrepared] = useState(false)
  const [printAttemptCount, setPrintAttemptCount] = useState(0)
  const [printedAtLabel, setPrintedAtLabel] = useState('')
  const [lastErrorCode, setLastErrorCode] = useState(null)

  const cleanupTimerRef = useRef(null)

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current)
      }
    }
  }, [])

  const prepareAndPrint = useCallback(async (credential) => {
    if (!credential || !credential.temporaryPassword) {
      setStatus('error')
      setLastErrorCode('MISSING_CREDENTIAL')
      return { success: false, error: 'MISSING_CREDENTIAL' }
    }

    try {
      setStatus('preparing')
      setPrintedAtLabel(new Date().toLocaleString())
      setIsPrintPrepared(true)
      setPrintAttemptCount(prev => prev + 1)
      setLastErrorCode(null)

      // Allow React to commit the print view to the DOM before invoking window.print()
      await new Promise(resolve => setTimeout(resolve, 60))

      setStatus('dialog_opening')

      if (typeof window !== 'undefined' && typeof window.print === 'function') {
        // Set up afterprint listener
        const handleAfterPrint = () => {
          setIsPrintPrepared(false)
          setStatus('dialog_closed')
          window.removeEventListener('afterprint', handleAfterPrint)
        }

        window.addEventListener('afterprint', handleAfterPrint, { once: true })

        window.print()

        // Fallback cleanup timer in case afterprint does not fire in some browsers
        cleanupTimerRef.current = setTimeout(() => {
          setIsPrintPrepared(false)
          setStatus('dialog_closed')
        }, 1000)

        return { success: true }
      } else {
        setIsPrintPrepared(false)
        setStatus('error')
        setLastErrorCode('PRINT_UNAVAILABLE')
        return { success: false, error: 'PRINT_UNAVAILABLE' }
      }
    } catch (err) {
      console.error('Credential slip print error:', err)
      setIsPrintPrepared(false)
      setStatus('error')
      setLastErrorCode('PRINT_INVOCATION_FAILED')
      return { success: false, error: 'PRINT_INVOCATION_FAILED' }
    }
  }, [])

  const clearPrintState = useCallback(() => {
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current)
    }
    setIsPrintPrepared(false)
    setStatus('idle')
    setPrintAttemptCount(0)
    setPrintedAtLabel('')
    setLastErrorCode(null)
  }, [])

  return {
    status,
    isPrintPrepared,
    printAttemptCount,
    printedAtLabel,
    lastErrorCode,
    prepareAndPrint,
    clearPrintState
  }
}
