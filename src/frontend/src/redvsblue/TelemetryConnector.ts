import { useEffect } from "react"
import { useTelemetryStore } from "@/redvsblue/stores/telemetry"
import { useUIStore } from "@/redvsblue/stores/uiStore"

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

  private ws: WebSocket | null = null
  private reconnectTimer: number | null = null
  private drainTimer: number | null = null
  private backoffMs: number
  private stopped = true

  constructor(opts: TelemetryConnectorOptions = {}) {
    this.url = opts.url ?? (import.meta.env.VITE_TELEMETRY_WS_URL as string) ?? "ws://localhost:3000/telemetry"
    this.batchSize = opts.batchSize ?? 50
    this.drainIntervalMs = opts.drainIntervalMs ?? 1000
    this.backoffBaseMs = opts.backoffBaseMs ?? 1000
    this.backoffMaxMs = opts.backoffMaxMs ?? 30000
    this.WebSocketCtor = opts.WebSocketCtor ?? (typeof WebSocket !== "undefined" ? WebSocket : undefined)
    this.backoffMs = this.backoffBaseMs
  }

  private handleBeforeUnload = () => {
    try {
      const batch = useTelemetryStore.getState().drainTelemetry(this.batchSize)
      if (!batch || batch.length === 0) return

      // If sendBeacon is available, use it for a best-effort synchronous send during unload
      const nav: Navigator | null = typeof navigator !== "undefined" ? navigator : null
      if (nav && typeof (nav as unknown as { sendBeacon?: unknown }).sendBeacon === "function") {
        let ok = false
        try {
          const sb = (nav as unknown as { sendBeacon: (u: string, d: BodyInit) => boolean }).sendBeacon
          ok = sb.call(nav, this.url, JSON.stringify(batch))
        } catch {
          ok = false
        }
        if (!ok) {
          // requeue at head so events aren't lost
          useTelemetryStore.setState((s) => ({ telemetryBuffer: [...batch, ...s.telemetryBuffer] }))
        }
      } else {
        // No sendBeacon available; requeue so events can be sent later
        useTelemetryStore.setState((s) => ({ telemetryBuffer: [...batch, ...s.telemetryBuffer] }))
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
    if (this.ws) {
      try { this.ws.close() } catch (e) { void e }
      this.ws = null
    }

    if (typeof window !== "undefined" && typeof window.removeEventListener === "function") {
      window.removeEventListener("beforeunload", this.handleBeforeUnload)
    }
  }

  private scheduleReconnect() {
    if (this.stopped) return
    const jitter = 0.75 + Math.random() * 0.5
    const wait = Math.min(this.backoffMaxMs, Math.floor(this.backoffMs * jitter))
    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, wait)
    // exponential backoff
    this.backoffMs = Math.min(this.backoffMaxMs, this.backoffMs * 2)
  }

  private connect() {
    if (!this.WebSocketCtor) return
    try {
      this.ws = new this.WebSocketCtor(this.url)
      this.ws.onopen = () => {
        this.backoffMs = this.backoffBaseMs
        this.tryDrain()
      }
      this.ws.onclose = () => {
        this.scheduleReconnect()
      }
      this.ws.onerror = () => {
        // ensure reconnection
        if (this.ws) {
          try { this.ws.close() } catch (e) { console.warn("error closing websocket", e) }
        }
      }
    } catch (err) {
      console.warn("telemetry websocket connect failed", err)
      this.scheduleReconnect()
    }
  }

  private tryDrain() {
    const enabled = useUIStore.getState().telemetryEnabled
    if (!enabled) return
    if (!this.ws || this.ws.readyState !== 1) return

    const batch = useTelemetryStore.getState().drainTelemetry(this.batchSize)
    if (!batch || batch.length === 0) return

    try {
      this.ws.send(JSON.stringify(batch))
    } catch (err) {
      console.warn("telemetry send failed", err)
      // requeue at head
      useTelemetryStore.setState((s) => ({ telemetryBuffer: [...batch, ...s.telemetryBuffer] }))
      // close socket to trigger reconnect
      if (this.ws) {
        try { this.ws.close() } catch (e) { console.warn("error closing websocket after send failure", e) }
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
