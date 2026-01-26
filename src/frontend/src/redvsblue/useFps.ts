import { useCallback, useRef } from "react"

export type UseFpsOptions = {
  windowMs?: number
  publishIntervalMs?: number
}

export type UseFpsResult = {
  reset: (now?: number) => void
  recordFrame: (now: number) => number | null
}

export function useFps(options: UseFpsOptions = {}): UseFpsResult {
  const { windowMs = 500, publishIntervalMs = 250 } = options

  const framesRef = useRef(0)
  const windowStartRef = useRef(0)
  const lastPublishRef = useRef(0)

  const reset = useCallback((now?: number) => {
    framesRef.current = 0
    if (typeof now === "number") {
      windowStartRef.current = now
      lastPublishRef.current = now
      return
    }
    windowStartRef.current = 0
    lastPublishRef.current = 0
  }, [])

  const recordFrame = useCallback(
    (now: number) => {
      if (windowStartRef.current === 0) {
        windowStartRef.current = now
        lastPublishRef.current = now
        framesRef.current = 0
      }

      framesRef.current += 1
      const windowElapsed = now - windowStartRef.current
      const publishElapsed = now - lastPublishRef.current
      if (windowElapsed >= windowMs && publishElapsed >= publishIntervalMs) {
        const fps = Math.round((framesRef.current * 1000) / windowElapsed)
        windowStartRef.current = now
        lastPublishRef.current = now
        framesRef.current = 0
        return fps
      }
      return null
    },
    [publishIntervalMs, windowMs]
  )

  return { reset, recordFrame }
}