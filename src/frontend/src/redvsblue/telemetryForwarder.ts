import type { EngineConfig, TelemetryEvent } from "@/redvsblue/types"
import type { EngineWithWorkerControls } from "@/redvsblue/engineManager"

export type TelemetryForwarderOptions = {
  engine: EngineWithWorkerControls
  config: Omit<EngineConfig, "canvasWidth" | "canvasHeight">
  onTelemetry: (event: TelemetryEvent) => void
  getUiEnabled: () => boolean
  onError?: (error: unknown) => void
}

export function attachTelemetryForwarder(options: TelemetryForwarderOptions): () => void {
  const { engine, config, onTelemetry, getUiEnabled, onError } = options

  const handler = (data: unknown) => {
    try {
      const engineEnabled = config.enableTelemetry ?? true
      const uiEnabled = getUiEnabled() ?? true
      if (!engineEnabled || !uiEnabled) return
      onTelemetry(data as TelemetryEvent)
    } catch (error) {
      if (onError) {
        onError(error)
      } else {
        console.error("telemetry handler error", error)
      }
    }
  }

  engine.on("telemetry", handler)
  return () => engine.off("telemetry", handler)
}