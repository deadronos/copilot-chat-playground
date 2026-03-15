import type { ChatMode } from "@/hooks/useStreamingChat"

export const CHAT_SESSION_STORAGE_KEY = "copilot-chat-playground:last-session"

export type ChatTimelineMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

export type ChatRequestMessage = {
  role: "user" | "assistant"
  content: string
}

export type PersistedChatSession = {
  version: 1
  mode: ChatMode
  sessionId?: string
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
    (typeof session.sessionId === "string" || session.sessionId === undefined) &&
    Array.isArray(session.timeline) &&
    session.timeline.every(isTimelineMessage)
  )
}

function getDefaultStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function buildConversationMessages(
  timeline: ChatTimelineMessage[],
  nextPrompt?: string
): ChatRequestMessage[] {
  const messages: ChatRequestMessage[] = []

  for (const message of timeline) {
    const content = message.content.trim()
    if (!content) {
      continue
    }

    messages.push({ role: message.role, content })
  }

  const trimmedPrompt = nextPrompt?.trim()
  if (!trimmedPrompt) {
    return messages
  }

  const lastMessage = messages[messages.length - 1]
  if (lastMessage?.role === "user" && lastMessage.content === trimmedPrompt) {
    return messages
  }

  return [...messages, { role: "user", content: trimmedPrompt }]
}

export function readStoredChatSession(storage?: Storage): PersistedChatSession | null {
  const targetStorage = storage ?? getDefaultStorage()
  if (!targetStorage) {
    return null
  }

  try {
    const raw = targetStorage.getItem(CHAT_SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isPersistedChatSession(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function writeStoredChatSession(
  session: PersistedChatSession,
  storage?: Storage
): boolean {
  const targetStorage = storage ?? getDefaultStorage()
  if (!targetStorage) {
    return false
  }

  try {
    targetStorage.setItem(CHAT_SESSION_STORAGE_KEY, JSON.stringify(session))
    return true
  } catch {
    return false
  }
}
