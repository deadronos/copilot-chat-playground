import { describe, it, expect, afterEach } from "vitest"

import {
  CHAT_SESSION_STORAGE_KEY,
  readStoredChatSession,
  writeStoredChatSession,
  type PersistedChatSession,
} from "@/lib/chatSessionStorage"

function createStorageMock(): Storage {
  const data = new Map<string, string>()

  return {
    get length() {
      return data.size
    },
    clear() {
      data.clear()
    },
    getItem(key: string) {
      return data.get(key) ?? null
    },
    key(index: number) {
      return Array.from(data.keys())[index] ?? null
    },
    removeItem(key: string) {
      data.delete(key)
    },
    setItem(key: string, value: string) {
      data.set(key, value)
    },
  }
}

describe("chatSessionStorage", () => {
  const storage = createStorageMock()

  afterEach(() => {
    storage.clear()
  })

  it("stores and restores the latest session", () => {
    const session: PersistedChatSession = {
      version: 1,
      mode: "explain-only",
      timeline: [
        { id: "u-1", role: "user", content: "Hi" },
        { id: "a-1", role: "assistant", content: "Hello" },
      ],
    }

    writeStoredChatSession(session, storage)

    const storedRaw = storage.getItem(CHAT_SESSION_STORAGE_KEY)
    expect(storedRaw).toBeTruthy()
    expect(readStoredChatSession(storage)).toEqual(session)
  })

  it("returns null when storage contains invalid data", () => {
    storage.setItem(CHAT_SESSION_STORAGE_KEY, "not-json")

    expect(readStoredChatSession(storage)).toBeNull()
  })
})
