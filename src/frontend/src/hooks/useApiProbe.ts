import * as React from "react"

export type ApiProbeOptions = {
  defaultApiUrl: string
  apiUrlOverride?: string
  backendUrlOverride?: string
  probeCandidates?: string[]
  probeTimeoutMs?: number
  overrideLabel?: string
}

export type ApiProbeResult = {
  apiUrl: string
  backendProbeInfo: string | null
}

export function useApiProbe(options: ApiProbeOptions): ApiProbeResult {
  const {
    defaultApiUrl,
    apiUrlOverride,
    backendUrlOverride,
    probeCandidates,
    probeTimeoutMs = 1500,
    overrideLabel = "Using API URL from VITE_API_URL",
  } = options

  const [apiUrl, setApiUrl] = React.useState<string>(() => defaultApiUrl)
  const [backendProbeInfo, setBackendProbeInfo] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (apiUrlOverride) {
      setBackendProbeInfo(overrideLabel)
      return
    }

    let active = true
    const candidates =
      probeCandidates ??
      [
        ...(backendUrlOverride ? [backendUrlOverride] : []),
        "http://localhost:3000",
      ]

    const probe = async () => {
      for (const candidate of candidates) {
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), probeTimeoutMs)
          const res = await fetch(`${candidate.replace(/\/$/, "")}/health`, {
            signal: controller.signal,
          })
          clearTimeout(timeout)
          if (!active) return
          if (res.ok) {
            setApiUrl(`${candidate.replace(/\/$/, "")}/api/chat`)
            setBackendProbeInfo(`Backend reachable at ${candidate}`)
            return
          }
        } catch {
          // ignore and try next candidate
        }
      }
      if (active) {
        setBackendProbeInfo(null)
      }
    }

    probe()

    return () => {
      active = false
    }
  }, [
    apiUrlOverride,
    backendUrlOverride,
    defaultApiUrl,
    overrideLabel,
    probeCandidates,
    probeTimeoutMs,
  ])

  return { apiUrl, backendProbeInfo }
}
