export type StartMatchPayload = {
  matchId: string
  rulesVersion?: string
  proposedRules?: Record<string, unknown>
  clientConfig?: Record<string, unknown>
}

type ApiErrorBody = {
  message?: string
  error?: string
  [key: string]: unknown
}

type MatchStartData = {
  sessionId: string
  effectiveConfig?: { snapshotIntervalMs?: number }
}

type AskData = {
  commentary?: string
  notificationText?: string
  validatedDecision?: unknown
  decisionRejectedReason?: string
}

const toApiErrorBody = (value: unknown): ApiErrorBody | undefined => {
  if (!value || typeof value !== "object") return undefined
  return value as ApiErrorBody
}

const toErrorMessage = (body: ApiErrorBody, fallback: string): string => {
  if (typeof body.message === "string" && body.message.length > 0) return body.message
  if (typeof body.error === "string" && body.error.length > 0) return body.error
  return JSON.stringify(body) || fallback
}

export type ApiErrorResult = {
  ok: false
  error: string
  status?: number
  body?: ApiErrorBody
}

async function parseErrorResponse(res: Response, fallback: string): Promise<ApiErrorResult> {
  const contentType = (res.headers?.get?.("content-type") || "").toLowerCase()
  if (contentType.includes("application/json")) {
    const rawBody: unknown = await res.json()
    const body = toApiErrorBody(rawBody)
    if (body) {
      return { ok: false, status: res.status, error: toErrorMessage(body, fallback), body }
    }
    return { ok: false, status: res.status, error: fallback }
  }

  const text = await res.text()
  return { ok: false, status: res.status, error: text || fallback }
}

export type MatchStartResult = { ok: true; data: MatchStartData } | ApiErrorResult
export async function startMatch(
  payload: StartMatchPayload,
  fetchFn: typeof fetch = fetch,
  options?: { headers?: Record<string, string> }
): Promise<MatchStartResult> {
  try {
    const headers = { "Content-Type": "application/json", ...(options?.headers ?? {}) }
    const res = await fetchFn(`/api/redvsblue/match/start`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })

    if (!res.ok) return parseErrorResponse(res, `Failed to start match (status ${res.status})`)

    const data = (await res.json()) as MatchStartData
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export type SendSnapshotResult = { ok: true; data: AskData } | ApiErrorResult
export async function sendSnapshot(
  matchId: string,
  payload: unknown,
  fetchFn: typeof fetch = fetch
): Promise<SendSnapshotResult> {
  try {
    const res = await fetchFn(`/api/redvsblue/match/${matchId}/snapshot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) return parseErrorResponse(res, `Failed to send snapshot (status ${res.status})`)

    const data = (await res.json()) as AskData
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function ask(
  matchId: string,
  payload: unknown,
  fetchFn: typeof fetch = fetch
): Promise<{ ok: true; data: AskData } | ApiErrorResult> {
  try {
    const res = await fetchFn(`/api/redvsblue/match/${matchId}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) return parseErrorResponse(res, `Failed to ask (status ${res.status})`)

    const data = (await res.json()) as AskData
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function endMatch(
  matchId: string,
  fetchFn: typeof fetch = fetch
): Promise<{ ok: true } | ApiErrorResult> {
  try {
    const res = await fetchFn(`/api/redvsblue/match/${matchId}/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })

    if (!res.ok) return parseErrorResponse(res, `Failed to end match (status ${res.status})`)

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
