import { describe, it, expect, afterEach } from "vitest"

import {
  CHAT_SESSION_STORAGE_KEY,
  buildConversationMessages,
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
      sessionId: "test-session-id",
      timeline: [
        { id: "u-1", role: "user", content: "Hi" },
        { id: "a-1", role: "assistant", content: "Hello" },
      ],
    }

    expect(writeStoredChatSession(session, storage)).toBe(true)

    const storedRaw = storage.getItem(CHAT_SESSION_STORAGE_KEY)
    expect(storedRaw).toBeTruthy()
    expect(readStoredChatSession(storage)).toEqual(session)
  })

  it("returns null when storage contains invalid data", () => {
    storage.setItem(CHAT_SESSION_STORAGE_KEY, "not-json")

    expect(readStoredChatSession(storage)).toBeNull()
  })

  it("allows session without sessionId for backward compatibility", () => {
    const oldSession = {
      version: 1,
      mode: "explain-only",
      timeline: [
        { id: "u-1", role: "user", content: "Hi" },
        { id: "a-1", role: "assistant", content: "Hello" },
      ],
    }
    storage.setItem(CHAT_SESSION_STORAGE_KEY, JSON.stringify(oldSession))
    expect(readStoredChatSession(storage)).toEqual(oldSession)
  })

  it("builds conversation messages including the current prompt", () => {
    expect(
      buildConversationMessages(
        [
          { id: "u-1", role: "user", content: "Hi" },
          { id: "a-1", role: "assistant", content: "Hello" },
          { id: "a-2", role: "assistant", content: "" },
        ],
        "  What changed?  "
      )
    ).toEqual([
      { role: "user", content: "Hi" },
      { role: "assistant", content: "Hello" },
      { role: "user", content: "What changed?" },
    ])
  })

  it("returns false when storage writes fail", () => {
    const failingStorage = {
      ...storage,
      setItem() {
        throw new Error("blocked")
      },
    } as Storage

    expect(
      writeStoredChatSession(
        {
          version: 1,
          mode: "explain-only",
          sessionId: "test-session-id",
          timeline: [],
        },
        failingStorage
      )
    ).toBe(false)
  })
})
