/**
 * Lightweight in-memory metrics for Copilot package.
 * Intended for local observability and unit testing. Exported helpers allow
 * tests or telemetry adapters to read and reset metrics.
 */

const metrics = new Map<string, number>();

export function incrementMetric(name: string, by = 1): void {
  metrics.set(name, (metrics.get(name) || 0) + by);
}

export function getMetric(name: string): number {
  return metrics.get(name) || 0;
}

export function resetMetrics(): void {
  metrics.clear();
}
