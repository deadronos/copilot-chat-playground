import { create } from "zustand"
import type { TelemetryEvent } from "../types"
import { ensureTelemetryEvent } from "../telemetry"

export type TelemetryStore = {
  telemetryBuffer: TelemetryEvent[]
  maxBufferSize: number
  pushTelemetry: (event: Partial<TelemetryEvent>) => void
  drainTelemetry: (n?: number) => TelemetryEvent[]
  peek: (n?: number) => TelemetryEvent[]
  clearTelemetry: () => void
  getBufferLength: () => number
}

const DEFAULT_MAX_BUFFER = 5000

export const useTelemetryStore = create<TelemetryStore>((set, get) => ({
  telemetryBuffer: [],
  maxBufferSize: DEFAULT_MAX_BUFFER,

  pushTelemetry: (partialEvent) => {
    const event = ensureTelemetryEvent(partialEvent)
    set((state) => {
      const buffer = [...state.telemetryBuffer, event]
      // enforce capacity: drop oldest when over capacity
      const over = buffer.length - state.maxBufferSize
      const newBuffer = over > 0 ? buffer.slice(over) : buffer
      return { telemetryBuffer: newBuffer }
    })
  },

  drainTelemetry: (n) => {
    const drainCount = n ?? get().telemetryBuffer.length
    const drained: TelemetryEvent[] = []
    set((state) => {
      const toDrain = state.telemetryBuffer.slice(0, drainCount)
      const remaining = state.telemetryBuffer.slice(drainCount)
      drained.push(...toDrain)
      return { telemetryBuffer: remaining }
    })
    return drained
  },

  peek: (n) => {
    const count = n ?? get().telemetryBuffer.length
    return get().telemetryBuffer.slice(0, count)
  },

  clearTelemetry: () => set({ telemetryBuffer: [] }),

  getBufferLength: () => get().telemetryBuffer.length,
}))
