export type BackoffOptions = {
  baseMs: number
  maxMs: number
  rng?: () => number
}

export class Backoff {
  private baseMs: number
  private maxMs: number
  private current: number
  private rng: () => number

  constructor(opts: BackoffOptions) {
    this.baseMs = opts.baseMs
    this.maxMs = opts.maxMs
    this.current = this.baseMs
    this.rng = opts.rng ?? Math.random
  }

  getNextDelay(): number {
    // jitter factor: 0.75 + random*0.5
    const jitter = 0.75 + this.rng() * 0.5
    const wait = Math.min(this.maxMs, Math.floor(this.current * jitter))
    // exponential backoff for next attempt
    this.current = Math.min(this.maxMs, this.current * 2)
    return wait
  }

  reset(): void {
    this.current = this.baseMs
  }
}
