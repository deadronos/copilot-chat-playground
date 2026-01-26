export type StartMatchPayload = { matchId: string; rulesVersion?: string; proposedRules?: Record<string, unknown>; clientConfig?: Record<string, unknown> }

export type MatchStartResult = { ok: true; data: { sessionId: string; effectiveConfig?: { snapshotIntervalMs?: number } } } | { ok: false; error: string }

export async function startMatch(payload: StartMatchPayload, fetchFn: typeof fetch = fetch): Promise<MatchStartResult> {
  try {
    const res = await fetchFn(`/api/redvsblue/match/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: text || `Failed to start match (status ${res.status})` }
    }

    const data = await res.json()
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export type SendSnapshotResult = { ok: true; data: any } | { ok: false; error: string }
export async function sendSnapshot(matchId: string, payload: unknown, fetchFn: typeof fetch = fetch): Promise<SendSnapshotResult> {
  try {
    const res = await fetchFn(`/api/redvsblue/match/${matchId}/snapshot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: text || `Failed to send snapshot (status ${res.status})` }
    }
    const data = await res.json()
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function ask(matchId: string, payload: unknown, fetchFn: typeof fetch = fetch): Promise<{ ok: true; data: any } | { ok: false; error: string }> {
  try {
    const res = await fetchFn(`/api/redvsblue/match/${matchId}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: text || `Failed to ask (status ${res.status})` }
    }
    const data = await res.json()
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function endMatch(matchId: string, fetchFn: typeof fetch = fetch): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetchFn(`/api/redvsblue/match/${matchId}/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: text || `Failed to end match (status ${res.status})` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
