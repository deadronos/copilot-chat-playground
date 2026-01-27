import { useCallback, useEffect, useRef, useState } from "react"

import { DEFAULT_UI_CONFIG } from "@/redvsblue/config"

export type UseToastOptions = {
  timeoutMs?: number
}

export type UseToastResult = {
  toast: string | null
  showToast: (message: string) => void
  clearToast: () => void
}

export function useToast(options: UseToastOptions = {}): UseToastResult {
  const { timeoutMs = DEFAULT_UI_CONFIG.toastTimeoutMs } = options

  const [toast, setToast] = useState<string | null>(null)
  const timeoutRef = useRef<number | null>(null)

  const clearToast = useCallback(() => {
    setToast(null)
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const showToast = useCallback(
    (message: string) => {
      setToast(message)
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
      if (timeoutMs > 0) {
        timeoutRef.current = window.setTimeout(() => {
          setToast(null)
          timeoutRef.current = null
        }, timeoutMs)
      }
    },
    [timeoutMs]
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { toast, showToast, clearToast }
}
