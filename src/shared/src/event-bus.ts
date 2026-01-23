import { EventEmitter } from "node:events";
import type { LogEvent } from "./index.js";

/**
 * EventBus for structured event streaming across components.
 * Allows components to emit and subscribe to events with type safety.
 */
export class EventBus extends EventEmitter {
  /**
   * Emit a log event to all subscribers
   */
  emitLog(event: LogEvent): void {
    this.emit("log", event);
  }

  /**
   * Subscribe to log events
   */
  onLog(handler: (event: LogEvent) => void): void {
    this.on("log", handler);
  }

  /**
   * Remove a log event subscriber
   */
  offLog(handler: (event: LogEvent) => void): void {
    this.off("log", handler);
  }
}

/**
 * Create a new EventBus instance
 */
export function createEventBus(): EventBus {
  return new EventBus();
}
