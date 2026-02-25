import type { ChatMode } from "@/hooks/useStreamingChat"

export const CHAT_SESSION_STORAGE_KEY = "copilot-chat-playground:last-session"

export type ChatTimelineMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

export type PersistedChatSession = {
  version: 1
  mode: ChatMode
  timeline: ChatTimelineMessage[]
}

function isChatMode(value: unknown): value is ChatMode {
  return value === "explain-only" || value === "project-helper"
}

function isTimelineMessage(value: unknown): value is ChatTimelineMessage {
  if (!value || typeof value !== "object") return false
  const message = value as Record<string, unknown>
  return (
    typeof message.id === "string" &&
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string"
  )
}

function isPersistedChatSession(value: unknown): value is PersistedChatSession {
  if (!value || typeof value !== "object") return false
  const session = value as Record<string, unknown>
  return (
    session.version === 1 &&
    isChatMode(session.mode) &&
    Array.isArray(session.timeline) &&
    session.timeline.every(isTimelineMessage)
  )
}

export function readStoredChatSession(storage: Storage = window.localStorage): PersistedChatSession | null {
  try {
    const raw = storage.getItem(CHAT_SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isPersistedChatSession(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function writeStoredChatSession(
  session: PersistedChatSession,
  storage: Storage = window.localStorage
): void {
  storage.setItem(CHAT_SESSION_STORAGE_KEY, JSON.stringify(session))
}
