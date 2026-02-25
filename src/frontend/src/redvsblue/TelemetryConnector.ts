import { useEffect } from "react"
import { useUIStore } from "@/redvsblue/stores/uiStore"
import { Backoff } from "@/redvsblue/telemetry/backoff"
import { WSClient } from "@/redvsblue/telemetry/wsClient"
import { TelemetryQueue } from "@/redvsblue/telemetry/queue"
import { trySendBeacon } from "@/redvsblue/telemetry/sendBeacon"

export interface TelemetryConnectorOptions {
  url?: string
  batchSize?: number
  drainIntervalMs?: number
  backoffBaseMs?: number
  backoffMaxMs?: number
  WebSocketCtor?: (new (url: string) => WebSocket) | undefined
  autoStart?: boolean
}

export class TelemetryConnectorCore {
  url: string
  batchSize: number
  drainIntervalMs: number
  backoffBaseMs: number
  backoffMaxMs: number
  WebSocketCtor?: new (url: string) => WebSocket

  private client: WSClient | null = null
  // Keep `_ws` for the currently active socket and `_lastSentWs` to preserve visibility for tests
  private _ws: WebSocket | null = null
  private _lastSentWs: WebSocket | null = null
  private reconnectTimer: number | null = null
  private drainTimer: number | null = null
  private backoff: Backoff
  private stopped = true

  // Expose `ws` for backward-compatible introspection (mirrors the socket that last successfully sent)
  get ws(): WebSocket | null {
    return this._lastSentWs ?? this._ws
  }

  constructor(opts: TelemetryConnectorOptions = {}) {
    this.url = opts.url ?? (import.meta.env.VITE_TELEMETRY_WS_URL as string) ?? "ws://localhost:3000/telemetry"
    this.batchSize = opts.batchSize ?? 50
    this.drainIntervalMs = opts.drainIntervalMs ?? 1000
    this.backoffBaseMs = opts.backoffBaseMs ?? 1000
    this.backoffMaxMs = opts.backoffMaxMs ?? 30000
    this.WebSocketCtor = opts.WebSocketCtor ?? (typeof WebSocket !== "undefined" ? WebSocket : undefined)
    this.backoff = new Backoff({ baseMs: this.backoffBaseMs, maxMs: this.backoffMaxMs })
  }

  private handleBeforeUnload = () => {
    try {
      const batch = TelemetryQueue.drain(this.batchSize)
      if (!batch || batch.length === 0) return

      // Use sendBeacon if available for best-effort synchronous flush

      // Use sendBeacon if available for best-effort synchronous flush
      const ok = trySendBeacon(this.url, JSON.stringify(batch))
      if (!ok) {
        TelemetryQueue.requeueAtHead(batch)
      }
    } catch {
      // be defensive on unload - swallow errors
    }
  }

  start() {
    if (!this.stopped) return
    this.stopped = false
    this.connect()
    this.drainTimer = setInterval(() => this.tryDrain(), this.drainIntervalMs)

    // register unload handler to attempt to flush buffered telemetry
    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      window.addEventListener("beforeunload", this.handleBeforeUnload)
    }
  }

  stop() {
    this.stopped = true
    if (this.drainTimer) clearInterval(this.drainTimer)
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.client) {
      try { this.client.close() } catch (e) { void e }
      this.client = null
      this._ws = null
    }

    if (typeof window !== "undefined" && typeof window.removeEventListener === "function") {
      window.removeEventListener("beforeunload", this.handleBeforeUnload)
    }
  }

  private scheduleReconnect() {
    if (this.stopped) return
    const wait = this.backoff.getNextDelay()

    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, wait)
  }

  private connect() {
    if (!this.WebSocketCtor) return
    try {
      // clean up any existing client before creating a new one
      if (this.client) {
        try { this.client.close() } catch { /* swallow */ }
        this.client = null
        this._ws = null
      }

      this.client = new WSClient({ WebSocketCtor: this.WebSocketCtor, url: this.url })

      this.client.onopen = () => {

        this.backoff.reset()
        // mirror underlying ws for tests and introspection; guard against races where client may have been cleared
        this._ws = this.client?.ws ?? null
        this.tryDrain()
      }

      this.client.onclose = () => {
        this.scheduleReconnect()
      }

      this.client.onerror = () => {
        // ensure reconnection
        if (this.client) {
          try { this.client.close() } catch (e) { console.warn("error closing websocket", e) }
          this.client = null
          this._ws = null
        }
      }

      this.client.connect()
      // if the ctor created the socket synchronously, mirror it immediately
      this._ws = this.client.ws ?? this._ws
    } catch (err) {
      console.warn("telemetry websocket connect failed", err)
      this.scheduleReconnect()
    }
  }

  private tryDrain() {
    const enabled = useUIStore.getState().telemetryEnabled
    if (!enabled) return
    if (!this.client || !this.client.ws || this.client.ws.readyState !== 1) return

    const batch = TelemetryQueue.drain(this.batchSize)
    if (!batch || batch.length === 0) return

    try {
      this.client.send(JSON.stringify(batch))
      // Track the ws that successfully sent so tests inspecting `ws` see it
      this._lastSentWs = this.client.ws ?? this._ws
    } catch (err) {
      console.warn("telemetry send failed", err)
      TelemetryQueue.requeueAtHead(batch)
      // close socket to trigger reconnect
      if (this.client) {
        try { this.client.close() } catch (e) { console.warn("error closing websocket after send failure", e) }
        this.client = null
        this._ws = null
      }
    }
  }
}

export function TelemetryConnectorReact(props: Partial<TelemetryConnectorOptions>) {
  useEffect(() => {
    const connector = new TelemetryConnectorCore({ ...props })
    if ((import.meta.env.VITE_ENABLE_TELEMETRY as string) === "false") return
    if (!useUIStore.getState().telemetryEnabled) return

    connector.start()
    return () => connector.stop()
  }, [props])

  return null
}
