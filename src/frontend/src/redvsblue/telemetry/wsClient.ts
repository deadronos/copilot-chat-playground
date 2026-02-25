export type WSClientOptions = {
  WebSocketCtor?: new (url: string) => WebSocket
  url: string
}

export class WSClient {
  WebSocketCtor: new (url: string) => WebSocket
  url: string
  ws: WebSocket | null = null

  onopen?: () => void
  onclose?: () => void
  onerror?: (err: unknown) => void

  constructor(opts: WSClientOptions) {
    this.WebSocketCtor =
      opts.WebSocketCtor ?? (typeof WebSocket !== "undefined" ? WebSocket : (null as unknown as new (url: string) => WebSocket))
    this.url = opts.url
  }

  connect(): void {
    if (!this.WebSocketCtor) throw new Error("No WebSocketCtor available")

    this.ws = new this.WebSocketCtor(this.url)
    this.ws.onopen = () => {
      if (this.onopen) this.onopen()
    }
    this.ws.onclose = () => {
      if (this.onclose) this.onclose()
    }
    this.ws.onerror = (event) => {
      if (this.onerror) this.onerror(event)
    }
  }

  send(v: string): void {
    if (!this.ws || this.ws.readyState !== 1) {
      throw new Error("WebSocket not open")
    }
    this.ws.send(v)
  }

  close(): void {
    if (!this.ws) return
    try {
      this.ws.close()
    } catch {
      // swallow errors during close
    }
    this.ws = null
  }
}
