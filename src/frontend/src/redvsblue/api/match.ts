export type StartMatchPayload = { matchId: string; rulesVersion?: string; proposedRules?: Record<string, unknown>; clientConfig?: Record<string, unknown> }

type JsonObject = Record<string, unknown>
type MatchStartData = { sessionId: string; effectiveConfig?: { snapshotIntervalMs?: number } }

function getErrorMessage(body: unknown): string {
  if (typeof body === "object" && body !== null) {
    const maybeBody = body as JsonObject
    if (typeof maybeBody.message === "string") return maybeBody.message
    if (typeof maybeBody.error === "string") return maybeBody.error
  }

  return JSON.stringify(body)
}

export type ApiErrorResult = { ok: false; error: string; status?: number; body?: unknown }
export type MatchStartResult = { ok: true; data: MatchStartData } | ApiErrorResult

export async function startMatch(payload: StartMatchPayload, fetchFn: typeof fetch = fetch, options?: { headers?: Record<string, string> }): Promise<MatchStartResult> {
  try {
    const headers = { "Content-Type": "application/json", ...(options?.headers ?? {}) }
    const res = await fetchFn(`/api/redvsblue/match/start`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const contentType = (res.headers?.get?.("content-type") || "").toLowerCase()
      if (contentType.includes("application/json")) {
        const body = await res.json()
        return { ok: false, status: res.status, error: getErrorMessage(body), body }
      }
      const text = await res.text()
      return { ok: false, status: res.status, error: text || `Failed to start match (status ${res.status})` }
    }

    const data = await res.json() as MatchStartData
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export type SendSnapshotResult = { ok: true; data: unknown } | ApiErrorResult
export async function sendSnapshot(matchId: string, payload: unknown, fetchFn: typeof fetch = fetch): Promise<SendSnapshotResult> {
  try {
    const res = await fetchFn(`/api/redvsblue/match/${matchId}/snapshot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const contentType = (res.headers?.get?.("content-type") || "").toLowerCase()
      if (contentType.includes("application/json")) {
        const body = await res.json()
        return { ok: false, status: res.status, error: getErrorMessage(body), body }
      }
      const text = await res.text()
      return { ok: false, status: res.status, error: text || `Failed to send snapshot (status ${res.status})` }
    }
    const data = await res.json()
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function ask(matchId: string, payload: unknown, fetchFn: typeof fetch = fetch): Promise<{ ok: true; data: unknown } | ApiErrorResult> {
  try {
    const res = await fetchFn(`/api/redvsblue/match/${matchId}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const contentType = (res.headers?.get?.("content-type") || "").toLowerCase()
      if (contentType.includes("application/json")) {
        const body = await res.json()
        return { ok: false, status: res.status, error: getErrorMessage(body), body }
      }
      const text = await res.text()
      return { ok: false, status: res.status, error: text || `Failed to ask (status ${res.status})` }
    }
    const data = await res.json()
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function endMatch(matchId: string, fetchFn: typeof fetch = fetch): Promise<{ ok: true } | ApiErrorResult> {
  try {
    const res = await fetchFn(`/api/redvsblue/match/${matchId}/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
    if (!res.ok) {
      const contentType = (res.headers?.get?.("content-type") || "").toLowerCase()
      if (contentType.includes("application/json")) {
        const body = await res.json()
        return { ok: false, status: res.status, error: getErrorMessage(body), body }
      }
      const text = await res.text()
      return { ok: false, status: res.status, error: text || `Failed to end match (status ${res.status})` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
