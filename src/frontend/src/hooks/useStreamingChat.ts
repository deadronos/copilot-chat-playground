import * as React from "react"

export type StreamStatus = "empty" | "waiting" | "streaming" | "done" | "error"
export type ChatMode = "explain-only" | "project-helper"

export type StreamingSubmitArgs = {
  prompt: string
  apiUrl: string
  mode: ChatMode
}

export type StreamingChatState = {
  output: string
  status: StreamStatus
  error: string | null
  isBusy: boolean
  submit: (args: StreamingSubmitArgs) => Promise<void>
  clear: () => void
}

const NETWORK_FAILURE_PATTERNS = [
  /Failed to fetch/i,
  /NetworkError/i,
  /ECONNREFUSED/i,
  /ERR_NAME_NOT_RESOLVED/i,
  /timeout/i,
]

export function useStreamingChat(): StreamingChatState {
  const [output, setOutput] = React.useState("")
  const [status, setStatus] = React.useState<StreamStatus>("empty")
  const [error, setError] = React.useState<string | null>(null)

  const isBusy = status === "waiting" || status === "streaming"

  const clear = React.useCallback(() => {
    setOutput("")
    setError(null)
    setStatus("empty")
  }, [])

  const submit = React.useCallback(
    async ({ prompt, apiUrl, mode }: StreamingSubmitArgs) => {
      const trimmed = prompt.trim()
      if (!trimmed || isBusy) {
        return
      }

      setError(null)
      setOutput("")
      setStatus("waiting")

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: trimmed, mode }),
        })

        if (!response.ok || !response.body) {
          let message = response.ok
            ? "Streaming response was empty."
            : `Request failed with status ${response.status}.`
          try {
            const ct = response.headers.get("content-type") || ""
            if (ct.includes("application/json")) {
              const data = await response.json()
              if (data?.errorType === "token_missing") {
                message =
                  "Copilot service is not configured on the server. Please ensure GH_TOKEN/GITHUB_TOKEN or runtime secrets are provided on the server (see project docs)."
              } else if (data?.errorType === "auth") {
                message =
                  "Copilot authentication failed on the server. Check token permissions (Copilot Requests)."
              } else if (data?.error) {
                message = String(data.error)
              }
            } else {
              const text = await response.text()
              if (
                text &&
                /token_missing|GitHub Copilot is not configured|Missing GitHub token/i.test(
                  text
                )
              ) {
                message =
                  "Copilot service is not configured on the server. Please ensure GH_TOKEN/GITHUB_TOKEN or runtime secrets are provided on the server (see project docs)."
              } else if (text) {
                message = text
              }
            }
          } catch {
            // ignore parsing errors and fall back to the status message
          }

          throw new Error(message)
        }

        setStatus("streaming")
        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { value, done } = await reader.read()
          if (done) {
            break
          }
          const chunk = decoder.decode(value, { stream: true })
          if (chunk) {
            setOutput((prev) => prev + chunk)
          }
        }

        const finalChunk = decoder.decode()
        if (finalChunk) {
          setOutput((prev) => prev + finalChunk)
        }

        setStatus("done")
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Streaming failed."
        const looksLikeNetworkError = NETWORK_FAILURE_PATTERNS.some((r) => r.test(message))

        if (looksLikeNetworkError) {
          setError(
            "Cannot reach backend service. Ensure the backend is running and reachable (e.g., run `docker compose ps` and check logs)."
          )
        } else {
          setError(message)
        }

        setStatus("error")
      }
    },
    [isBusy]
  )

  return { output, status, error, isBusy, submit, clear }
}
