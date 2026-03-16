import { describe, expect, it } from "vitest"

import {
  readStoredSelectedModel,
  SELECTED_MODEL_STORAGE_KEY,
  writeStoredSelectedModel,
} from "@/lib/modelSelectionStorage"

function createMemoryStorage(): Storage {
  const values = new Map<string, string>()

  return {
    get length() {
      return values.size
    },
    clear() {
      values.clear()
    },
    getItem(key: string) {
      return values.get(key) ?? null
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null
    },
    removeItem(key: string) {
      values.delete(key)
    },
    setItem(key: string, value: string) {
      values.set(key, value)
    },
  }
}

describe("modelSelectionStorage", () => {
  it("reads and writes the selected model", () => {
    const storage = createMemoryStorage()
    storage.clear()

    expect(readStoredSelectedModel(storage)).toBeUndefined()

    expect(writeStoredSelectedModel("gpt-5", storage)).toBe(true)
    expect(storage.getItem(SELECTED_MODEL_STORAGE_KEY)).toBe("gpt-5")
    expect(readStoredSelectedModel(storage)).toBe("gpt-5")
  })

  it("removes the stored model when cleared", () => {
    const storage = createMemoryStorage()
    storage.clear()
    storage.setItem(SELECTED_MODEL_STORAGE_KEY, "gpt-5-mini")

    expect(writeStoredSelectedModel(undefined, storage)).toBe(true)
    expect(storage.getItem(SELECTED_MODEL_STORAGE_KEY)).toBeNull()
    expect(readStoredSelectedModel(storage)).toBeUndefined()
  })
})