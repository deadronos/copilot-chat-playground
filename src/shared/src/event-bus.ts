import type { LogEvent } from "./index.js";

/**
 * EventBus for structured event streaming across components.
 * Allows components to emit and subscribe to events with type safety.
 */
export class EventBus {
  private readonly logHandlers = new Set<(event: LogEvent) => void>();

  /**
   * Emit a log event to all subscribers
   */
  emitLog(event: LogEvent): void {
    for (const handler of this.logHandlers) {
      handler(event);
    }
  }

  /**
   * Subscribe to log events
   */
  onLog(handler: (event: LogEvent) => void): void {
    this.logHandlers.add(handler);
  }

  /**
   * Remove a log event subscriber
   */
  offLog(handler: (event: LogEvent) => void): void {
    this.logHandlers.delete(handler);
  }
}

/**
 * Create a new EventBus instance
 */
export function createEventBus(): EventBus {
  return new EventBus();
}
