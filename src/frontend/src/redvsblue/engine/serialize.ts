/**
 * Serialization helpers for GameState snapshots.
 *
 * Ensures GameState snapshots are plain, serializable objects suitable for:
 * - Web Worker posting (via structuredClone)
 * - Network transmission
 * - Storage persistence
 *
 * A serialized snapshot contains only primitives, plain objects, and arrays—
 * no functions, class instances, DOM nodes, Maps, Sets, or circular references.
 */

import type { GameState } from "@/redvsblue/types";

/**
 * Validates that a value is JSON-serializable (no functions, circular refs, etc).
 * This is a runtime check to catch issues during development.
 *
 * @param value - The value to validate
 * @param visited - Set of objects already visited (to detect circular refs)
 * @returns true if value is serializable, false otherwise
 */
function isSerializable(value: unknown, visited = new WeakSet<object>()): boolean {
  // Primitives are always serializable
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return true;
  }

  // Functions, symbols, undefined are not serializable
  if (typeof value === "function" || typeof value === "symbol" || value === undefined) {
    return false;
  }

  // For objects, check for circular references and non-serializable properties
  if (typeof value === "object") {
    if (visited.has(value)) {
      return false; // Circular reference detected
    }

    visited.add(value);

    // Maps and Sets are not serializable
    if (value instanceof Map || value instanceof Set) {
      return false;
    }

    // DOM nodes are not serializable (Node is not defined in Web Workers)
    if (typeof Node !== "undefined" && value instanceof Node) {
      return false;
    }

    // Arrays are serializable if all elements are serializable
    if (Array.isArray(value)) {
      return value.every((item) => isSerializable(item, visited));
    }

    // Plain objects are serializable if all property values are serializable
    if (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null) {
      for (const key in value) {
        if (!isSerializable((value as Record<string, unknown>)[key], visited)) {
          return false;
        }
      }
      return true;
    }

    // Class instances and other non-plain objects are not serializable
    return false;
  }

  return true;
}

/**
 * Serializes a GameState snapshot to ensure it's a plain, serializable object.
 *
 * This function validates that the snapshot contains no functions, class instances,
 * DOM nodes, or circular references. The snapshot is returned as-is if valid.
 *
 * @param snapshot - The GameState snapshot to serialize
 * @returns The serialized GameState (guaranteed to be structuredClone-compatible)
 * @throws Error if snapshot contains non-serializable data
 */
export function serialize(snapshot: GameState): GameState {
  // Validate that the entire snapshot is serializable
  if (!isSerializable(snapshot)) {
    throw new Error("GameState snapshot contains non-serializable data (functions, circular refs, DOM nodes, etc.)");
  }

  // Return the snapshot as-is. engine.getState() already returns plain objects,
  // so no transformation is needed. This function primarily serves as a validation
  // and documentation that the snapshot is serialization-safe.
  return snapshot;
}

/**
 * Deep-clones a GameState snapshot using structuredClone.
 * Useful for testing serialization and for creating independent state copies.
 *
 * @param snapshot - The GameState to clone
 * @returns A deep-cloned copy of the snapshot
 */
export function cloneGameState(snapshot: GameState): GameState {
  return structuredClone(snapshot);
}
