import type { ChatMessage } from "../schemas/chat.js";

type BuildPromptWithConversationContextArgs = {
  prompt: string;
  messages?: ChatMessage[];
  sessionId?: string;
};

function normalizeMessages(messages?: ChatMessage[]): ChatMessage[] {
  const normalized: ChatMessage[] = [];

  for (const message of messages ?? []) {
    const content = message.content.trim();
    if (!content) {
      continue;
    }

    normalized.push({ role: message.role, content });
  }

  return normalized;
}

export function buildPromptWithConversationContext({
  prompt,
  messages,
  sessionId,
}: BuildPromptWithConversationContextArgs): string {
  const trimmedPrompt = prompt.trim();
  const history = normalizeMessages(messages);

  if (history.length === 0) {
    return trimmedPrompt;
  }

  const lastMessage = history[history.length - 1];
  const conversation =
    lastMessage?.role === "user" && lastMessage.content === trimmedPrompt
      ? history
      : [...history, { role: "user", content: trimmedPrompt }];

  const transcript = conversation
    .map((message, index) => {
      const speaker = message.role === "user" ? "User" : "Assistant";
      const suffix = index === conversation.length - 1 ? " (latest)" : "";
      return `${speaker}${suffix}: ${message.content}`;
    })
    .join("\n\n");

  const sessionPrefix = sessionId ? `Session ID: ${sessionId}\n\n` : "";

  return `${sessionPrefix}Continue this conversation using the history below for context. Respond to the latest user message, and keep the reply grounded in the existing exchange.\n\nConversation history:\n${transcript}`;
}