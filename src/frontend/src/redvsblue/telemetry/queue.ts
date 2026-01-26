import { useTelemetryStore } from "@/redvsblue/stores/telemetry"
import type { TelemetryEvent } from "@/redvsblue/types"

export class TelemetryQueue {
  static drain(n?: number): TelemetryEvent[] {
    return useTelemetryStore.getState().drainTelemetry(n)
  }

  static peek(n?: number): TelemetryEvent[] {
    return useTelemetryStore.getState().peek(n)
  }

  static requeueAtHead(events: TelemetryEvent[]): void {
    if (!events || events.length === 0) return
    useTelemetryStore.setState((s) => ({ telemetryBuffer: [...events, ...s.telemetryBuffer] }))
  }

  static push(event: Partial<TelemetryEvent>): void {
    useTelemetryStore.getState().pushTelemetry(event)
  }

  static getBufferLength(): number {
    return useTelemetryStore.getState().getBufferLength()
  }
}
